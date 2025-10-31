/**
 * X.com Like Automation Script
 * Browser console script for automated liking with human-like behavior
 */

import { CONFIG, type ScrollOptions } from "./config";
import {
  checkForAutomationWarning,
  checkForDeletedPost,
  findAllLikeButtons,
  getButtonUniqueId,
  isButtonAlreadyLiked,
  isLikeButtonDisabled,
  isOldVersionPost,
  isReplyPost,
} from "./dom-utils";
import {
  isGAPost as detectGAPost,
  isGEPost as detectGEPost,
  isGMPost as detectGMPost,
  isGNPost as detectGNPost,
  isHBDPost as detectHBDPost,
} from "./post-detector";
import {
  generateGAReply,
  generateGEReply,
  generateGMReply,
  generateGNReply,
  generateHBDReply,
  generateSayItBackReply,
  hasSayItBack,
} from "./reply-generators";

(function () {
  "use strict";

  interface WindowWithAutomation extends Window {
    likeCurrentUserPosts: (limit?: number) => void;
    resetState: () => void;
    stop: () => void;
  }

  let shouldStop = false;

  function resetState(): void {
    shouldStop = false;
    console.log("State reset - ready to run");
  }

  function stop(): void {
    shouldStop = true;
    console.log("Stopping script...");

    const articles = document.querySelectorAll("article");
    for (const article of articles) {
      (article as HTMLElement).style.outline = "none";
    }
  }

  const sleep = async (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      if (shouldStop) {
        resolve();
        return;
      }
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (shouldStop || Date.now() - startTime >= ms) {
          clearInterval(interval);
          resolve();
        }
      }, 100); // Check every 100ms for shouldStop
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, ms);
    });
  };

  // Check for loading spinner and wait for it to disappear
  async function waitForLoadingToComplete(maxWaitTime = 10000): Promise<void> {
    const startTime = Date.now();

    // Check if spinner exists
    const checkForSpinner = (): HTMLElement | null => {
      // Look for the loading spinner by aria-label
      const spinner = document.querySelector<HTMLElement>(
        '[aria-label="Loading timeline"][role="progressbar"]'
      );
      return spinner;
    };

    let spinner = checkForSpinner();

    if (!spinner) {
      // No spinner, we're good
      return;
    }

    console.log("⏳ Loading spinner detected, waiting for it to disappear...");

    // Wait for spinner to disappear
    while (Date.now() - startTime < maxWaitTime && !shouldStop) {
      await sleep(200); // Check every 200ms
      if (shouldStop) return;

      spinner = checkForSpinner();
      if (!spinner) {
        console.log("✅ Loading complete");
        // Wait a bit more to ensure content is fully loaded
        await sleep(300);
        if (shouldStop) return;
        return;
      }
    }

    console.log("⚠️ Loading spinner timeout - proceeding anyway");
  }

  function isGMPost(postText: string): boolean {
    return detectGMPost(postText, CONFIG.gmPatterns);
  }

  function isGNPost(postText: string): boolean {
    return detectGNPost(postText, CONFIG.gnPatterns);
  }

  function isGAPost(postText: string): boolean {
    return detectGAPost(postText, CONFIG.gaPatterns);
  }

  function isGEPost(postText: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return detectGEPost(postText, CONFIG.gePatterns);
  }

  function isHBDPost(postText: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return detectHBDPost(postText, CONFIG.hbdPatterns);
  }

  async function randomDelay(): Promise<void> {
    if (shouldStop) return;

    const tweetText =
      document.querySelector<HTMLElement>('[data-testid="tweetText"]')
        ?.textContent || "";
    const hasImage = !!document.querySelector('img[src*="/media/"]');
    const hasVideo = !!document.querySelector("video");
    const textLength = tweetText.length;

    const wordsInTweet = tweetText.split(/\s+/).length;
    const baseReadingTime =
      (wordsInTweet /
        (CONFIG.readingSpeed.min +
          Math.random() *
            (CONFIG.readingSpeed.max - CONFIG.readingSpeed.min))) *
      60 *
      1000;

    let mediaTime = 0;
    if (hasImage) {
      mediaTime +=
        CONFIG.imageTime.min +
        Math.random() * (CONFIG.imageTime.max - CONFIG.imageTime.min);
    }
    if (hasVideo) {
      mediaTime +=
        CONFIG.videoTime.min +
        Math.random() * (CONFIG.videoTime.max - CONFIG.videoTime.min);
    }

    const baseDelayPerChar =
      CONFIG.delayPerChar.min +
      Math.random() * (CONFIG.delayPerChar.max - CONFIG.delayPerChar.min);
    const minDelay =
      CONFIG.baseDelay.min +
      Math.random() * (CONFIG.baseDelay.max - CONFIG.baseDelay.min);
    const baseDelay = Math.max(minDelay, textLength * baseDelayPerChar);

    // Human behavior patterns
    const behaviorRoll = Math.random();
    let finalDelay = baseDelay;

    if (behaviorRoll < CONFIG.behaviorPatterns.quickScroll) {
      // Quick scroll-through
      finalDelay = Math.max(minDelay, finalDelay * 0.5);
      console.log("Quick skim through");
    } else if (behaviorRoll < CONFIG.behaviorPatterns.interestedReading) {
      // Interested reading
      finalDelay += baseReadingTime * 0.5 + mediaTime * 0.5;
      console.log("Interested reading");
    } else if (behaviorRoll < CONFIG.behaviorPatterns.distracted) {
      // Distracted behavior
      finalDelay += Math.random() * 4000 + 2000;
      console.log("Distracted pause");
    } else if (behaviorRoll < CONFIG.behaviorPatterns.veryEngaged) {
      // Very engaged
      finalDelay += baseReadingTime * 0.75 + mediaTime * 0.75;
      console.log("Engaged reading");
    }

    const microAdjustment = (Math.random() - 0.5) * CONFIG.microAdjustment;
    finalDelay += microAdjustment;

    // Ensure minimum delay
    finalDelay = Math.max(minDelay, Math.floor(finalDelay));

    console.log(`Waiting for ${Math.round(finalDelay / 1000)} seconds...`);
    await sleep(finalDelay);
    if (shouldStop) return;
  }

  async function humanLikeScroll(
    targetY: number,
    options: ScrollOptions = {}
  ): Promise<void> {
    const {
      variation = "normal",
      shouldOvershoot = Math.random() < CONFIG.scrollOvershotChance,
    } = options;

    const startY = window.scrollY;
    const distance = targetY - startY;

    // Determine scroll characteristics based on variation
    let steps: number;
    let baseStepDelay: number;

    switch (variation) {
      case "quick":
        steps = 10 + Math.floor(Math.random() * 5);
        baseStepDelay = 20 + Math.random() * 10;
        break;
      case "careful":
        steps = 25 + Math.floor(Math.random() * 10);
        baseStepDelay = 40 + Math.random() * 20;
        break;
      default: // normal
        steps = 15 + Math.floor(Math.random() * 8);
        baseStepDelay = 30 + Math.random() * 15;
    }

    // Calculate overshoot if needed
    let overshootDistance = 0;
    if (shouldOvershoot) {
      overshootDistance =
        (Math.random() * 0.2 + 0.1) * window.innerHeight * Math.sign(distance);
      console.log("Adding scroll overshoot");
    }

    // Perform the scroll
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      // Easing function for more natural movement
      const easeInOutCubic =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Add slight horizontal wobble for realism
      const wobble = Math.random() * 2 - 1;
      window.scrollBy(
        wobble,
        distance * (easeInOutCubic - (i > 0 ? (i - 1) / steps : 0))
      );

      // Variable delay between steps
      const stepDelay = baseStepDelay * (1 + Math.random() * 0.5);
      await sleep(stepDelay);
    }

    // Handle overshoot and correction if needed
    if (shouldOvershoot) {
      window.scrollBy(0, overshootDistance);
      await sleep(200 + Math.random() * 300);

      // Scroll back smoothly
      const correctionSteps = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i <= correctionSteps; i++) {
        const progress = i / correctionSteps;
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        window.scrollBy(
          0,
          -overshootDistance *
            (easeOutQuad - (i > 0 ? (i - 1) / correctionSteps : 0))
        );
        await sleep(30 + Math.random() * 20);
      }
    }
  }

  // Dive into comments and like some replies
  async function diveIntoComments(post: HTMLElement): Promise<number> {
    console.log("🏊 Diving into comments to like some replies...");

    // Check how many replies this post has - try multiple methods
    const replyButton = post.querySelector('[data-testid="reply"]');
    let replyCount = 0;

    if (replyButton) {
      // Try aria-label first
      const ariaLabel = replyButton.getAttribute("aria-label") || "";
      const match = ariaLabel.match(/(\d+)\s+(?:repl|reply|replies)/i);
      if (match) {
        replyCount = Number.parseInt(match[1], 10);
        console.log(`📊 Post has ${replyCount} replies (from aria-label)`);
      } else {
        // Try to find the count in the button's text or nearby elements
        const buttonText = replyButton.textContent || "";
        const textMatch = buttonText.match(/(\d+)/);
        if (textMatch) {
          replyCount = Number.parseInt(textMatch[1], 10);
          console.log(`📊 Post has ${replyCount} replies (from button text)`);
        } else {
          // Check if there's a count span nearby
          const countSpan = replyButton.parentElement?.querySelector(
            '[data-testid="reply"] ~ span'
          );
          if (countSpan) {
            const spanMatch = countSpan.textContent?.match(/(\d+)/);
            if (spanMatch) {
              replyCount = Number.parseInt(spanMatch[1], 10);
              console.log(`📊 Post has ${replyCount} replies (from span)`);
            }
          }
        }
      }
    }

    // If no replies detected, try to open anyway (some posts might have replies but no count shown)
    if (replyCount === 0) {
      console.log(
        "⚠️ No reply count detected, but attempting to open post anyway..."
      );
    }

    // Just click the article in the middle - simple and direct
    if (post.tagName.toLowerCase() !== "article") {
      console.log("⚠️ Post is not an article element");
      return 0;
    }

    const article = post as HTMLElement;
    const originalUrl = window.location.href;

    // Get the center coordinates of the article
    const rect = article.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Click in the middle of the article
    try {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: centerX,
        clientY: centerY,
      });
      article.dispatchEvent(clickEvent);
      console.log("📖 Clicked article in the middle");
    } catch (error) {
      console.log("⚠️ Click failed:", error);
      // Fallback: try direct click
      try {
        article.click();
        console.log("📖 Clicked article directly (fallback)");
      } catch {
        console.log("⚠️ All click methods failed");
        return 0;
      }
    }

    // Wait for detail page to load - check for modal or detail view
    const maxWaitTime = 8000; // 8 seconds max wait
    const startTime = Date.now();
    let detailPageLoaded = false;

    while (Date.now() - startTime < maxWaitTime && !shouldStop) {
      await sleep(500); // Check every 500ms
      if (shouldStop) return 0;

      // Check if URL changed - only abort if it's a profile redirect (not a status page)
      // X.com may change URL to /home/status/1234567890 which is fine (client-side nav)
      // But if it goes to /username, that's a profile redirect and we should abort
      const currentUrl = window.location.href;
      if (currentUrl !== originalUrl) {
        // Check if we're on a profile page (bad - means we clicked profile link)
        const profilePattern = /\/[^/]+\/?(?:\?.*)?$/; // Matches /username or /username/
        const isProfilePage =
          profilePattern.test(currentUrl) &&
          !currentUrl.includes("/status/") &&
          !currentUrl.includes("/home");

        // Check if we left the site entirely
        const originalHost = new URL(originalUrl).hostname;
        const currentHost = new URL(currentUrl).hostname;
        const leftSite = originalHost !== currentHost;

        if (isProfilePage || leftSite) {
          console.log(
            "⚠️ URL changed to profile/other site - full page navigation detected, aborting dive"
          );
          // Try to go back if possible
          if (window.history.length > 1) {
            window.history.back();
            await sleep(2000);
          }
          return 0;
        }
        // Otherwise, URL change is fine (probably /home/status/xxx - client-side nav)
        // Continue checking for detail page
      }

      // Check if we're on a detail page (has multiple articles or detail view)
      const articles = document.querySelectorAll("article");
      // Detail pages usually have the main post + replies, so multiple articles
      if (articles.length > 1) {
        detailPageLoaded = true;
        break;
      }

      // Alternative: check for detail view indicators
      const detailView = document.querySelector('[data-testid="tweet"]');
      if (detailView && articles.length > 0) {
        // Might be a detail view even with just one article visible initially
        detailPageLoaded = true;
        break;
      }
    }

    if (!detailPageLoaded) {
      console.log("⚠️ Detail page not loaded - attempting to go back");
      await goBackToTimeline();
      return 0;
    }

    // Wait for any loading spinner to disappear
    await waitForLoadingToComplete();
    if (shouldStop) return 0;

    // Wait a bit more for comments to fully load
    await sleep(
      CONFIG.diveIntoComments.waitForLoad.min +
        Math.random() *
          (CONFIG.diveIntoComments.waitForLoad.max -
            CONFIG.diveIntoComments.waitForLoad.min)
    );
    if (shouldStop) return 0;

    // Check for loading again after waiting
    await waitForLoadingToComplete();
    if (shouldStop) return 0;

    // Find all reply posts (articles that are replies)
    const allArticles = Array.from(document.querySelectorAll("article"));

    // In detail view, the first article is the main post, all others are replies
    // No socialContext needed - we're in detail view so skip first and use rest
    let replyArticles: HTMLElement[] = [];

    if (allArticles.length > 1) {
      // Skip first article (main post), rest are replies
      replyArticles = allArticles.slice(1);
      console.log(
        `📝 Detail view: ${allArticles.length} articles found, ${replyArticles.length} are replies (skipped first as main post)`
      );
    } else {
      replyArticles = [];
      console.log(
        `📝 Only ${allArticles.length} article(s) found in detail view`
      );
    }

    console.log(`Found ${replyArticles.length} replies in comments`);

    if (replyArticles.length === 0) {
      console.log("⚠️ No replies found, going back");
      await goBackToTimeline();
      return 0;
    }

    // Determine how many replies to like (limit by both available replies and configured max)
    const repliesToLike =
      CONFIG.diveIntoComments.minRepliesToLike +
      Math.floor(
        Math.random() *
          (CONFIG.diveIntoComments.maxRepliesToLike -
            CONFIG.diveIntoComments.minRepliesToLike +
            1)
      );
    // Don't try to like more than the post has or what we found
    const targetCount = Math.min(
      repliesToLike,
      replyCount,
      replyArticles.length
    );
    console.log(
      `Planning to like ${targetCount} replies (post has ${replyCount}, found ${replyArticles.length})`
    );

    let likedCount = 0;

    // Like the first N replies
    for (let i = 0; i < targetCount && i < replyArticles.length; i++) {
      if (shouldStop) break;

      const replyArticle = replyArticles[i];

      // Find the like button in this reply
      const likeButton = replyArticle.querySelector<HTMLElement>(
        '[data-testid="like"]'
      );

      if (!likeButton) {
        console.log(`⚠️ Reply ${i + 1}: No like button found`);
        continue;
      }

      // Check if already liked
      if (isButtonAlreadyLiked(likeButton)) {
        console.log(`⚠️ Reply ${i + 1}: Already liked`);
        continue;
      }

      // Check if likes are disabled
      if (isLikeButtonDisabled(likeButton)) {
        console.log(`⚠️ Reply ${i + 1}: Likes disabled`);
        continue;
      }

      // Scroll to the reply
      const rect = replyArticle.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - window.innerHeight / 2;
      await humanLikeScroll(targetY, { variation: "quick" });
      if (shouldStop) break;

      // Wait for loading spinner if present
      await waitForLoadingToComplete();
      if (shouldStop) break;

      // Small delay before liking
      await sleep(
        CONFIG.beforeClick.min +
          Math.random() * (CONFIG.beforeClick.max - CONFIG.beforeClick.min)
      );
      if (shouldStop) break;

      // Like the reply
      likeButton.click();
      likedCount++;
      console.log(`💙 Liked reply ${i + 1}/${targetCount}`);

      // Small delay after liking
      await sleep(
        CONFIG.afterClick.min +
          Math.random() * (CONFIG.afterClick.max - CONFIG.afterClick.min)
      );
      if (shouldStop) break;
    }

    console.log(`✅ Liked ${likedCount} replies in comments`);

    // Go back to timeline
    await goBackToTimeline();

    return likedCount;
  }

  // Helper function to go back to timeline with multiple fallback methods
  async function goBackToTimeline(): Promise<void> {
    console.log("⬅️ Attempting to return to timeline...");

    // Wait a bit before going back
    await sleep(
      CONFIG.diveIntoComments.beforeBack.min +
        Math.random() *
          (CONFIG.diveIntoComments.beforeBack.max -
            CONFIG.diveIntoComments.beforeBack.min)
    );

    // Try multiple methods to go back
    let wentBack = false;

    // Method 1: Find and click the back button
    const backButton = document.querySelector<HTMLElement>(
      '[data-testid="app-bar-back"]'
    );
    if (backButton && backButton.offsetParent !== null) {
      // Check if button is visible
      try {
        backButton.click();
        console.log("⬅️ Clicked back button (method 1)");
        wentBack = true;
      } catch (error) {
        console.log("⚠️ Failed to click back button:", error);
      }
    }

    // Method 2: Try browser back button
    if (!wentBack) {
      try {
        window.history.back();
        console.log("⬅️ Used browser back (method 2)");
        wentBack = true;
        await sleep(1000); // Give it time to navigate
      } catch (error) {
        console.log("⚠️ Failed browser back:", error);
      }
    }

    // Method 3: Try ESC key
    if (!wentBack) {
      try {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            bubbles: true,
          })
        );
        console.log("⬅️ Sent ESC key (method 3)");
        wentBack = true;
        await sleep(1000);
      } catch (error) {
        console.log("⚠️ Failed ESC key:", error);
      }
    }

    // Method 4: Try clicking home link
    if (!wentBack) {
      const homeLink = document.querySelector<HTMLAnchorElement>(
        'a[href="/home"][aria-label="Home"]'
      );
      if (homeLink) {
        try {
          homeLink.click();
          console.log("⬅️ Clicked home link (method 4)");
          wentBack = true;
          await sleep(1000);
        } catch (error) {
          console.log("⚠️ Failed home link:", error);
        }
      }
    }

    // Method 5: Try clicking X logo to go home (doesn't cause full refresh)
    if (!wentBack) {
      const logoLink = document.querySelector<HTMLAnchorElement>(
        'a[aria-label="X"], a[aria-label="Twitter"], a[href="/home"]'
      );
      if (logoLink && logoLink.getAttribute("href") === "/home") {
        try {
          logoLink.click();
          console.log("⬅️ Clicked home logo (method 5)");
          wentBack = true;
          await sleep(2000);
        } catch (error) {
          console.log("⚠️ Failed logo click:", error);
        }
      }
    }

    // Don't use window.location.href as it causes full page refresh!

    if (!wentBack) {
      console.log("⚠️ All back methods failed - continuing anyway");
    }

    // Wait for timeline to load
    await sleep(
      CONFIG.diveIntoComments.afterBack.min +
        Math.random() *
          (CONFIG.diveIntoComments.afterBack.max -
            CONFIG.diveIntoComments.afterBack.min)
    );

    // Wait for any loading spinner to disappear
    await waitForLoadingToComplete();
  }

  async function likeAllPosts(limit = 10): Promise<void> {
    let processedCount = 0;
    const seenButtons = new Set<string>();
    const alreadyLikedSet = new Set<string>();
    let consecutiveNoNewButtons = 0;
    let actionsSinceBreak = 0; // Track actions for breathing breaks

    // Randomize first break point
    let nextBreakAt =
      CONFIG.breathingBreak.afterActions.min +
      Math.floor(
        Math.random() *
          (CONFIG.breathingBreak.afterActions.max -
            CONFIG.breathingBreak.afterActions.min)
      );

    // Function to check if document is visible
    function isDocumentVisible(): boolean {
      return !document.hidden;
    }

    // Function to wait for document to become visible
    async function waitForVisibility(
      maxWaitTime = CONFIG.maxVisibilityWait
    ): Promise<boolean> {
      console.log("Page not active. Waiting for visibility...");

      if (isDocumentVisible()) {
        return true;
      }

      return new Promise((resolve) => {
        let waitTime = 0;
        const checkInterval = CONFIG.visibilityCheckInterval;

        const visibilityInterval = setInterval(() => {
          waitTime += checkInterval;

          if (isDocumentVisible()) {
            console.log("Page became active again, continuing...");
            clearInterval(visibilityInterval);
            resolve(true);
          }

          if (waitTime >= maxWaitTime || shouldStop) {
            console.log("Max wait time reached or stop requested");
            clearInterval(visibilityInterval);
            resolve(false);
          }
        }, checkInterval);

        // Also listen for visibility change events
        const handleVisibilityChange = (): void => {
          if (isDocumentVisible()) {
            console.log("Page became active again, continuing...");
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange
            );
            clearInterval(visibilityInterval);
            resolve(true);
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
      });
    }

    console.log("Starting to process posts...");
    await sleep(CONFIG.initialDelay);

    let foundInitialPost = false;
    let initialScrollAttempts = 0;
    const maxInitialScrollAttempts = CONFIG.maxInitialScrollAttempts;
    const initialPosition = window.scrollY; // Save initial position

    console.log("Starting to scroll down to find first unliked post...");

    while (
      !foundInitialPost &&
      initialScrollAttempts < maxInitialScrollAttempts &&
      !shouldStop
    ) {
      const allButtons = findAllLikeButtons();
      const eligibleButtons = allButtons.filter((button) => {
        const buttonId = getButtonUniqueId(button);
        return (
          !seenButtons.has(buttonId) &&
          !alreadyLikedSet.has(buttonId) &&
          !isButtonAlreadyLiked(button)
        );
      });

      if (eligibleButtons.length > 0) {
        foundInitialPost = true;
        console.log(
          `Found first unliked post after scrolling ${initialScrollAttempts} times`
        );

        // Scroll to the first unliked post, but ensure we only go down, never up
        const nextButtonToLike = eligibleButtons[0];
        let post: HTMLElement | null = nextButtonToLike;
        for (let i = 0; i < 10; i++) {
          if (!post) break;
          if (
            post.tagName.toLowerCase() === "article" ||
            post.getAttribute("role") === "article"
          ) {
            break;
          }
          post = post.parentElement as HTMLElement | null;
        }

        if (post && post.tagName.toLowerCase() === "article") {
          const rect = post.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - window.innerHeight / 2;

          if (targetY > window.scrollY) {
            await humanLikeScroll(targetY);
            await sleep(
              CONFIG.scrollDelay.min +
                Math.random() *
                  (CONFIG.scrollDelay.max - CONFIG.scrollDelay.min)
            );
            // Wait for loading spinner if present
            await waitForLoadingToComplete();
          } else {
            console.log(
              "Found unliked post above current position, not scrolling up"
            );
          }
        }
      } else {
        // No eligible posts found, scroll down and try again
        initialScrollAttempts++;
        console.log(
          `Scrolling down to find unliked posts... (attempt ${initialScrollAttempts})`
        );

        // Ensure we're only scrolling downward, not upward
        const scrollAmount = window.innerHeight * (0.7 + Math.random() * 0.3);
        const newPosition = window.scrollY + scrollAmount;

        // Make sure we're always scrolling down from our starting position
        if (newPosition > initialPosition) {
          await humanLikeScroll(newPosition, {
            variation: "quick",
          });
          await sleep(
            CONFIG.scrollSearch.min +
              Math.random() *
                (CONFIG.scrollSearch.max - CONFIG.scrollSearch.min)
          );
          // Wait for loading spinner if present
          await waitForLoadingToComplete();
        } else {
          console.log("Warning: Attempted to scroll up, correcting course");
          await humanLikeScroll(initialPosition + scrollAmount, {
            variation: "quick",
          });
          await sleep(
            CONFIG.scrollSearch.min +
              Math.random() *
                (CONFIG.scrollSearch.max - CONFIG.scrollSearch.min)
          );
          // Wait for loading spinner if present
          await waitForLoadingToComplete();
        }
      }
    }

    if (
      !foundInitialPost &&
      initialScrollAttempts >= maxInitialScrollAttempts
    ) {
      console.log(
        `Could not find any unliked posts after ${maxInitialScrollAttempts} scroll attempts`
      );
      return;
    }

    while (processedCount < limit && !shouldStop) {
      if (checkForAutomationWarning()) {
        shouldStop = true;
        return;
      }

      if (shouldStop) {
        console.log("Stop requested, halting execution");
        return;
      }

      const allButtons = findAllLikeButtons();
      const eligibleButtons = allButtons.filter((button) => {
        const buttonId = getButtonUniqueId(button);
        return (
          !seenButtons.has(buttonId) &&
          !alreadyLikedSet.has(buttonId) &&
          !isButtonAlreadyLiked(button)
        );
      });

      eligibleButtons.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });

      if (eligibleButtons.length === 0) {
        consecutiveNoNewButtons++;
        if (consecutiveNoNewButtons >= CONFIG.noButtonsMaxAttempts) {
          // Only check for tab activity if no eligible buttons are found
          // and we've tried scrolling multiple times
          if (!isDocumentVisible()) {
            console.log(
              "No posts found and browser tab inactive - pausing until active again"
            );
            consecutiveNoNewButtons = 0; // Reset counter
            const becameVisible = await waitForVisibility();
            if (!becameVisible || shouldStop) {
              console.log("Stopping after visibility wait");
              return;
            }
            console.log("Tab active again - resuming operation");
            await sleep(CONFIG.visibilityWait);
            continue;
          }

          // Only stop if we've tried scrolling multiple times, found no new content, AND tab is active
          console.log("Finished! No more unliked posts found.");
          return;
        }

        const scrollAmount = window.innerHeight * (0.5 + Math.random() * 0.5);
        await humanLikeScroll(window.scrollY + scrollAmount, {
          variation: "quick",
        });
        await sleep(1500);
        // Wait for loading spinner if present
        await waitForLoadingToComplete();
        continue;
      }

      consecutiveNoNewButtons = 0;

      const nextButtonToLike = eligibleButtons[0];
      const buttonId = getButtonUniqueId(nextButtonToLike);
      seenButtons.add(buttonId);

      try {
        let post: HTMLElement | null = nextButtonToLike;
        for (let i = 0; i < 10; i++) {
          if (!post) break;
          if (
            post.tagName.toLowerCase() === "article" ||
            post.getAttribute("role") === "article"
          ) {
            break;
          }
          post = post.parentElement as HTMLElement | null;
        }

        if (!document.body.contains(nextButtonToLike)) {
          continue;
        }

        if (isButtonAlreadyLiked(nextButtonToLike)) {
          alreadyLikedSet.add(buttonId);
          continue;
        }

        // Check if likes are disabled on this button
        if (isLikeButtonDisabled(nextButtonToLike)) {
          console.log("⚠️ Likes disabled on this post - skipping");
          continue;
        }

        // Check if this is an old version of an edited post
        if (
          post &&
          post.tagName.toLowerCase() === "article" &&
          isOldVersionPost(post)
        ) {
          console.log("⚠️ Old version of edited post - skipping...");
          continue;
        }

        let isGM = false;
        let isGN = false;
        let isGA = false;
        let isGE = false;
        let isHBD = false;
        let postText = ""; // Store post text for reply generation

        if (post && post.tagName.toLowerCase() === "article") {
          const rect = post.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - window.innerHeight / 2;

          // Check for media in this post (prioritize video over image)
          const hasVideo = !!post.querySelector("video");
          const hasImage =
            !hasVideo && !!post.querySelector('[data-testid="tweetPhoto"]');

          // Check if this is a GM/GA/GN/GE/HBD post (but not a reply)
          postText =
            post.querySelector('[data-testid="tweetText"]')?.textContent || "";
          if (!isReplyPost(post)) {
            if (isHBDPost(postText)) {
              console.log("🎂 This is a HBD post");
              isHBD = true;
            } else if (isGMPost(postText)) {
              console.log("☀️ This is a GM post");
              isGM = true;
            } else if (isGAPost(postText)) {
              console.log("🌤️ This is a GA post");
              isGA = true;
            } else if (isGEPost(postText)) {
              console.log("🌆 This is a GE post");
              isGE = true;
            } else if (isGNPost(postText)) {
              console.log("🌙 This is a GN post");
              isGN = true;
            }
          }

          await humanLikeScroll(targetY, { shouldOvershoot: false });
          await sleep(
            CONFIG.scrollDelay.min +
              Math.random() * (CONFIG.scrollDelay.max - CONFIG.scrollDelay.min)
          );
          // Wait for loading spinner if present
          await waitForLoadingToComplete();

          // Add extra viewing time for visual content (skip for GM/GN/GA/GE/HBD posts - we'll reply instead)
          if (isGM || isGN || isGA || isGE || isHBD) {
            console.log("⚡ Special post - skipping media wait time");
          } else if (hasVideo) {
            const videoElement = post.querySelector(
              "video"
            ) as HTMLVideoElement;
            let videoViewTime =
              CONFIG.videoTime.min +
              Math.random() * (CONFIG.videoTime.max - CONFIG.videoTime.min);

            // If we can get the actual video duration, use a percentage of it
            if (
              videoElement &&
              videoElement.duration &&
              !Number.isNaN(videoElement.duration)
            ) {
              const videoDuration = videoElement.duration * 1000;
              const watchPercentage =
                CONFIG.videoWatchPercentage.min +
                Math.random() *
                  (CONFIG.videoWatchPercentage.max -
                    CONFIG.videoWatchPercentage.min);
              videoViewTime = Math.min(
                videoDuration * watchPercentage,
                CONFIG.videoTime.max
              );
              console.log(
                `🎥 Video found (${Math.round(videoDuration / 1000)}s), watching ${Math.round(watchPercentage * 100)}% = ${Math.round(videoViewTime / 1000)}s`
              );
            } else {
              console.log(
                `🎥 Video found, waiting extra ${Math.round(videoViewTime / 1000)}s`
              );
            }
            await sleep(videoViewTime);
          } else if (hasImage) {
            const imageViewTime =
              CONFIG.imageTime.min +
              Math.random() * (CONFIG.imageTime.max - CONFIG.imageTime.min);
            console.log(
              `📸 Image found, waiting extra ${Math.round(imageViewTime / 1000)}s`
            );
            await sleep(imageViewTime);
          }
        }

        // Skip "thinking" delay for GM/GN/GA/GE/HBD posts since we're replying
        if (!(isGM || isGN || isGA || isGE || isHBD)) {
          await sleep(
            CONFIG.beforeClick.min +
              Math.random() * (CONFIG.beforeClick.max - CONFIG.beforeClick.min)
          );
        }

        // Get author display name and username handle
        let authorName = "Unknown";
        let authorHandle = "";
        if (post && post.tagName.toLowerCase() === "article") {
          const authorElement = post.querySelector(
            '[data-testid="User-Name"] a[role="link"]'
          );
          authorName = authorElement?.textContent?.trim() || "Unknown";

          // Get username handle from the link href (e.g., "/m3aus" -> "@m3aus")
          const href = authorElement?.getAttribute("href");
          if (href) {
            authorHandle = "@" + href.replace(/^\//, "");
          }
        }

        // Skip own posts (check both display name and handle)
        if (CONFIG.skipOwnPosts) {
          const ownUsername = CONFIG.ownUsername
            .toLowerCase()
            .replace(/^@/, "");
          const handleWithoutAt = authorHandle.toLowerCase().replace(/^@/, "");
          const isOwnPost =
            authorName.toLowerCase() === ownUsername ||
            handleWithoutAt === ownUsername ||
            handleWithoutAt.includes(ownUsername);

          if (isOwnPost) {
            console.log(
              `⏭️ Skipping own post by ${authorHandle || authorName}`
            );
            continue;
          }
        }

        nextButtonToLike.click();
        processedCount++; // Only main posts increment this counter (not comment likes)
        console.log(`Liked post ${processedCount}/${limit} by @${authorName}`);

        // Small delay after like to let DOM settle
        await sleep(
          CONFIG.afterClick.min +
            Math.random() * (CONFIG.afterClick.max - CONFIG.afterClick.min)
        );
        // Wait for loading spinner if present
        await waitForLoadingToComplete();

        // If it's a GM/GN/GA/GE/HBD post, click reply and compose response
        if (
          (isGM || isGN || isGA || isGE || isHBD) &&
          post &&
          post.tagName.toLowerCase() === "article"
        ) {
          let postType: string;
          if (isHBD) {
            postType = "HBD";
          } else if (isGM) {
            postType = "GM";
          } else if (isGN) {
            postType = "GN";
          } else if (isGE) {
            postType = "GE";
          } else {
            postType = "GA";
          }
          console.log(`🔍 Looking for reply button in ${postType} post...`);
          const replyButton = post.querySelector(
            '[data-testid="reply"]'
          ) as HTMLElement;
          console.log(`🔍 Reply button found: ${!!replyButton}`);

          // Check if replies are disabled
          if (replyButton) {
            const svg = replyButton.querySelector("svg");
            if (svg && svg.classList.contains("r-12c3ph5")) {
              console.log(
                `⚠️ Replies disabled on this ${postType} post - skipping reply`
              );
            } else {
              await sleep(
                CONFIG.replyDelays.beforeReplyClick.min +
                  Math.random() *
                    (CONFIG.replyDelays.beforeReplyClick.max -
                      CONFIG.replyDelays.beforeReplyClick.min)
              );
              if (shouldStop) return;

              console.log(`💬 Opening ${postType} post reply box...`);
              replyButton.click();
              console.log("💬 Reply button clicked");
              await sleep(
                CONFIG.replyDelays.waitForReplyBox.min +
                  Math.random() *
                    (CONFIG.replyDelays.waitForReplyBox.max -
                      CONFIG.replyDelays.waitForReplyBox.min)
              ); // Wait for reply box to open
              if (shouldStop) return;

              // Generate appropriate reply
              let reply: string;

              // Check for "say it back" prompt
              if (hasSayItBack(postText)) {
                reply = generateSayItBackReply(postText);
                console.log(`💬 Generated "Say it back" reply: "${reply}"`);
              } else if (isHBD) {
                reply = generateHBDReply(authorName, postText);
                console.log(`💬 Generated HBD reply: "${reply}"`);
              } else if (isGM) {
                reply = generateGMReply(authorName, postText);
                console.log(`💬 Generated GM reply: "${reply}"`);
              } else if (isGN) {
                reply = generateGNReply(authorName, postText);
                console.log(`💬 Generated GN reply: "${reply}"`);
              } else if (isGE) {
                reply = generateGEReply(authorName, postText);
                console.log(`💬 Generated GE reply: "${reply}"`);
              } else {
                reply = generateGAReply(authorName, postText);
                console.log(`💬 Generated GA reply: "${reply}"`);
              }

              // Find the Draft.js contenteditable div
              const replyBox = document.querySelector(
                '[data-testid="tweetTextarea_0"]'
              ) as HTMLElement;
              if (replyBox) {
                // Type the reply using Draft.js method
                const draftEditor = replyBox.closest('[role="textbox"]');
                if (draftEditor) {
                  // Set focus
                  (draftEditor as HTMLElement).focus();
                  await sleep(
                    CONFIG.replyDelays.afterFocus.min +
                      Math.random() *
                        (CONFIG.replyDelays.afterFocus.max -
                          CONFIG.replyDelays.afterFocus.min)
                  );

                  // Type character by character for human-like behavior
                  for (const char of reply) {
                    document.execCommand("insertText", false, char);
                    await sleep(
                      CONFIG.replyDelays.perCharacter.min +
                        Math.random() *
                          (CONFIG.replyDelays.perCharacter.max -
                            CONFIG.replyDelays.perCharacter.min)
                    );
                    if (shouldStop) return;
                  }

                  console.log(
                    `💬 ${postType} reply typed, clicking send button...`
                  );
                  await sleep(
                    CONFIG.replyDelays.beforeSend.min +
                      Math.random() *
                        (CONFIG.replyDelays.beforeSend.max -
                          CONFIG.replyDelays.beforeSend.min)
                  );

                  // Find and click the Reply button
                  const tweetButton = document.querySelector(
                    '[data-testid="tweetButton"]'
                  ) as HTMLElement;
                  if (tweetButton) {
                    tweetButton.click();
                    console.log(`💬 ${postType} reply sent!`);
                    await sleep(
                      CONFIG.replyDelays.waitForModalClose.min +
                        Math.random() *
                          (CONFIG.replyDelays.waitForModalClose.max -
                            CONFIG.replyDelays.waitForModalClose.min)
                    ); // Wait for modal to auto-close
                    console.log(
                      "💬 Modal auto-closed, continuing to next post"
                    );
                  } else {
                    console.log(
                      "⚠️ Could not find tweet button - closing manually"
                    );
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", {
                        key: "Escape",
                        code: "Escape",
                        keyCode: 27,
                        bubbles: true,
                      })
                    );
                    await sleep(
                      CONFIG.replyDelays.escapeKeyFallback.min +
                        Math.random() *
                          (CONFIG.replyDelays.escapeKeyFallback.max -
                            CONFIG.replyDelays.escapeKeyFallback.min)
                    );
                  }
                } else {
                  console.log(
                    `⚠️ Could not find Draft.js editor for ${postType} - closing modal`
                  );
                  document.dispatchEvent(
                    new KeyboardEvent("keydown", {
                      key: "Escape",
                      code: "Escape",
                      keyCode: 27,
                      bubbles: true,
                    })
                  );
                  await sleep(
                    CONFIG.replyDelays.escapeKeyFallback.min +
                      Math.random() *
                        (CONFIG.replyDelays.escapeKeyFallback.max -
                          CONFIG.replyDelays.escapeKeyFallback.min)
                  );
                }
              } else {
                console.log(
                  `⚠️ Could not find reply box for ${postType} - closing modal`
                );
                document.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: "Escape",
                    code: "Escape",
                    keyCode: 27,
                    bubbles: true,
                  })
                );
                await sleep(
                  CONFIG.replyDelays.escapeKeyFallback.min +
                    Math.random() *
                      (CONFIG.replyDelays.escapeKeyFallback.max -
                        CONFIG.replyDelays.escapeKeyFallback.min)
                );
              }
            }
          }
        }

        // Dive into comments and like some replies (for all posts)
        // Note: Comment likes do NOT count toward processedCount/limit - only main posts do
        if (
          CONFIG.diveIntoComments.enabled &&
          Math.random() < CONFIG.diveIntoComments.chance &&
          post &&
          post.tagName.toLowerCase() === "article"
        ) {
          const likedRepliesCount = await diveIntoComments(post);
          if (likedRepliesCount > 0) {
            // Count replied likes toward action counter (for breathing breaks only)
            // This does NOT affect processedCount, so limit still refers to main posts only
            actionsSinceBreak += likedRepliesCount;
            console.log(
              `📊 Actions since break: ${actionsSinceBreak} (including ${likedRepliesCount} reply likes)`
            );
          }
        }

        // Check if post was deleted - skip it completely
        if (checkForDeletedPost()) {
          console.log("ℹ️ Deleted post - skipping");
          processedCount--;
          continue;
        }

        if (checkForAutomationWarning()) {
          shouldStop = true;
          return;
        }

        const wasLikeUndone = isButtonAlreadyLiked(nextButtonToLike) === false;

        if (wasLikeUndone) {
          console.log(
            "⚠️ WARNING: Like was automatically undone - stopping script"
          );
          return;
        }

        // Always call randomDelay after liking a post
        await randomDelay();

        // Increment action counter and check for breathing break
        actionsSinceBreak++;
        if (
          CONFIG.breathingBreak.enabled &&
          actionsSinceBreak >= nextBreakAt &&
          processedCount < limit
        ) {
          const breakDuration =
            CONFIG.breathingBreak.duration.min +
            Math.random() *
              (CONFIG.breathingBreak.duration.max -
                CONFIG.breathingBreak.duration.min);

          console.log(
            `\n💤 Taking a breathing break after ${actionsSinceBreak} actions...`
          );
          console.log(
            `⏰ Break duration: ${Math.round(breakDuration / 60000)} minutes`
          );
          console.log(
            `📊 Progress: ${processedCount}/${limit} posts completed\n`
          );

          await sleep(breakDuration);

          console.log("✅ Break complete - resuming automation...\n");

          // Click home icon to reset timeline
          console.log("🏠 Clicking home icon to refresh timeline...");
          const homeLink = document.querySelector<HTMLAnchorElement>(
            'a[href="/home"][aria-label="Home"]'
          );
          if (homeLink) {
            homeLink.click();
            console.log("✅ Timeline refreshed");
            await sleep(2000 + Math.random() * 2000); // Wait for timeline to load
          } else {
            console.log("⚠️ Could not find home icon, continuing anyway");
          }

          // Reset counter and randomize next break point
          actionsSinceBreak = 0;
          nextBreakAt =
            CONFIG.breathingBreak.afterActions.min +
            Math.floor(
              Math.random() *
                (CONFIG.breathingBreak.afterActions.max -
                  CONFIG.breathingBreak.afterActions.min)
            );
          console.log(`📅 Next break scheduled in ~${nextBreakAt} actions`);
        }
      } catch (error) {
        console.error("Error processing like button:", error);
      }
    }

    console.log(`Finished! Liked ${processedCount}/${limit} posts`);
  }

  function likeCurrentUserPosts(limit = 10): void {
    console.log(`Running direct like script with limit of ${limit} posts`);
    resetState();
    void likeAllPosts(limit);
  }

  // Export for use
  if (typeof window !== "undefined") {
    const w = window as unknown as WindowWithAutomation;
    w.likeCurrentUserPosts = likeCurrentUserPosts;
    w.resetState = resetState;
    w.stop = stop;
  }

  // Auto-run with default limit
  likeCurrentUserPosts(CONFIG.defaultPostLimit);
})();
