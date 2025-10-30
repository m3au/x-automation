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
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

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
    return sleep(finalDelay);
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

          await humanLikeScroll(targetY);
          await sleep(
            CONFIG.scrollDelay.min +
              Math.random() * (CONFIG.scrollDelay.max - CONFIG.scrollDelay.min)
          );

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
        processedCount++;
        console.log(`Liked post ${processedCount}/${limit} by @${authorName}`);

        // Small delay after like to let DOM settle
        await sleep(
          CONFIG.afterClick.min +
            Math.random() * (CONFIG.afterClick.max - CONFIG.afterClick.min)
        );

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
              console.log(`💬 Opening ${postType} post reply box...`);
              replyButton.click();
              console.log("💬 Reply button clicked");
              await sleep(
                CONFIG.replyDelays.waitForReplyBox.min +
                  Math.random() *
                    (CONFIG.replyDelays.waitForReplyBox.max -
                      CONFIG.replyDelays.waitForReplyBox.min)
              ); // Wait for reply box to open

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
