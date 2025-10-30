/**
 * X.com Like Automation Script
 * Browser console script for automated liking with human-like behavior
 */

import {
  checkForAutomationWarning,
  checkForDeletedPost,
  findAllLikeButtons,
  getButtonUniqueId,
  humanLikeScroll,
  isButtonAlreadyLiked,
  isDocumentVisible,
  isLikeButtonDisabled,
  isOldVersionPost,
  isReplyPost,
  waitForVisibility,
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

import { CONFIG } from "./config";

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

  // Dive into comments and like some replies
  async function diveIntoComments(post: HTMLElement): Promise<number> {
    console.log("🏊 Diving into comments to like some replies...");

    // Check how many replies this post has
    const replyButton = post.querySelector('[data-testid="reply"]');
    let replyCount = 0;
    if (replyButton) {
      const ariaLabel = replyButton.getAttribute("aria-label") || "";
      const match = ariaLabel.match(/(\d+)\s+Repl/i);
      if (match) {
        replyCount = parseInt(match[1], 10);
        console.log(`📊 Post has ${replyCount} replies`);
      }
    }

    // If no replies or couldn't determine, skip
    if (replyCount === 0) {
      console.log("⚠️ No replies found in post, skipping dive");
      return 0;
    }

    // Find the timestamp link to click (safer than clicking the whole post)
    const timeLink = post.querySelector<HTMLAnchorElement>(
      'a[role="link"][href*="/status/"]'
    );
    if (!timeLink) {
      console.log("⚠️ Could not find timestamp link to open post");
      return 0;
    }

    // Click the post to open it
    timeLink.click();
    console.log("📖 Opened post");

    // Wait for comments to load
    const waitTime =
      CONFIG.diveIntoComments.waitForLoad.min +
      Math.random() *
        (CONFIG.diveIntoComments.waitForLoad.max -
          CONFIG.diveIntoComments.waitForLoad.min);
    await sleep(waitTime);

    // Find all reply posts (articles that are replies)
    const allArticles = Array.from(document.querySelectorAll("article"));
    const replyArticles = allArticles.filter((article) => isReplyPost(article));

    console.log(`Found ${replyArticles.length} replies in comments`);

    if (replyArticles.length === 0) {
      console.log("⚠️ No replies found, going back");
      const backButton = document.querySelector<HTMLElement>(
        '[data-testid="app-bar-back"]'
      );
      if (backButton) {
        await sleep(
          CONFIG.diveIntoComments.beforeBack.min +
            Math.random() *
              (CONFIG.diveIntoComments.beforeBack.max -
                CONFIG.diveIntoComments.beforeBack.min)
        );
        backButton.click();
        await sleep(
          CONFIG.diveIntoComments.afterBack.min +
            Math.random() *
              (CONFIG.diveIntoComments.afterBack.max -
                CONFIG.diveIntoComments.afterBack.min)
        );
      }
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

      // Small delay before liking
      await sleep(
        CONFIG.beforeClick.min +
          Math.random() * (CONFIG.beforeClick.max - CONFIG.beforeClick.min)
      );

      // Like the reply
      likeButton.click();
      likedCount++;
      console.log(`💙 Liked reply ${i + 1}/${targetCount}`);

      // Small delay after liking
      await sleep(
        CONFIG.afterClick.min +
          Math.random() * (CONFIG.afterClick.max - CONFIG.afterClick.min)
      );
    }

    console.log(`✅ Liked ${likedCount} replies in comments`);

    // Find and click the back button
    const backButton = document.querySelector<HTMLElement>(
      '[data-testid="app-bar-back"]'
    );
    if (backButton) {
      await sleep(
        CONFIG.diveIntoComments.beforeBack.min +
          Math.random() *
            (CONFIG.diveIntoComments.beforeBack.max -
              CONFIG.diveIntoComments.beforeBack.min)
      );
      backButton.click();
      console.log("⬅️ Clicked back button");

      // Wait for timeline to load
      await sleep(
        CONFIG.diveIntoComments.afterBack.min +
          Math.random() *
            (CONFIG.diveIntoComments.afterBack.max -
              CONFIG.diveIntoComments.afterBack.min)
      );
    } else {
      console.log("⚠️ Could not find back button");
    }

    return likedCount;
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
            const becameVisible = await waitForVisibility(
              CONFIG.maxVisibilityWait
            );
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

        // Occasionally dive into comments and like some replies (only for non-GM/GN/GA/GE/HBD posts)
        if (
          CONFIG.diveIntoComments.enabled &&
          !(isGM || isGN || isGA || isGE || isHBD) &&
          Math.random() < CONFIG.diveIntoComments.chance &&
          post &&
          post.tagName.toLowerCase() === "article"
        ) {
          const likedRepliesCount = await diveIntoComments(post);
          if (likedRepliesCount > 0) {
            // Count replied likes toward action counter
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
