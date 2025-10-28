/**
 * X.com Like Automation Script
 * Browser console script for automated liking with human-like behavior
 */

import {
  isGAPost as detectGAPost,
  isGMPost as detectGMPost,
  isGNPost as detectGNPost,
} from "./post-detector";
import {
  gaBaseNameWeighted,
  gaForeignGreetingsWeighted,
  gaGreetingsWeighted,
  gaHustlePhrases,
  gaNameSuffixesWeighted,
  gaPatterns,
  gaWeekdayPhrases,
} from "./ga-patterns";
import {
  gmBaseNameWeighted,
  gmBuildingPhrases,
  gmForeignGreetingsWeighted,
  gmGreetingsWeighted,
  gmNameSuffixesWeighted,
  gmPatterns,
  gmWeekdayPhrases,
} from "./gm-patterns";
import {
  gnBaseNameWeighted,
  gnForeignGreetingsWeighted,
  gnGreetingsWeighted,
  gnNameSuffixesWeighted,
  gnPatterns,
  gnRestingPhrases,
  gnWeekdayPhrases,
} from "./gn-patterns";

(function () {
  "use strict";

  // ============================================
  // TIMING CONFIGURATION - Anti-detection mode
  // ============================================
  const CONFIG = {
    // Automation settings
    defaultPostLimit: 300, // Number of posts to like per run
    skipOwnPosts: true, // Skip your own posts
    ownUsername: "@mu", // Your username to skip

    // Reading delays (varied speeds to look human)
    readingSpeed: { min: 250, max: 500 }, // Wide range WPM
    delayPerChar: { min: 15, max: 50 }, // More variation
    baseDelay: { min: 1500, max: 3000 }, // 1.5-5s much wider range

    // Media consumption (more realistic viewing times)
    imageTime: { min: 1000, max: 5000 }, // 2-8s look at images
    videoTime: { min: 3000, max: 12000 }, // 3-12s watch videos (fallback)
    videoWatchPercentage: { min: 0.3, max: 1 }, // Watch 30-100% of video

    // GM post detection patterns (imported from gm-patterns.ts)
    gmPatterns: gmPatterns as readonly string[],

    // GN post detection patterns (imported from gn-patterns.ts)
    gnPatterns: gnPatterns as readonly string[],

    // GA post detection patterns (imported from ga-patterns.ts)
    gaPatterns: gaPatterns as readonly string[],

    // Micro variations (bigger randomness)
    microAdjustment: 4000, // ±2s random variation

    // Click timing (add hesitation)
    beforeClick: { min: 500, max: 2000 }, // 0.5-2s think before click
    afterClick: { min: 800, max: 2500 }, // 0.8-2.5s after click

    // Scroll timing (slower, more natural)
    scrollDelay: { min: 1000, max: 2500 }, // 1-2.5s pause after scroll
    scrollSearch: { min: 1500, max: 3000 }, // 1.5-3s search pauses

    // Visibility checks
    visibilityWait: 3000, // 3s resume after tab switch
    maxVisibilityWait: 900000, // 15min max
    visibilityCheckInterval: 2000, // Check every 2s

    // Other (slower, safer)
    initialDelay: 2000, // 2s start delay
    noButtonsMaxAttempts: 12, // More retries
    maxInitialScrollAttempts: 15, // More initial scrolls

    // Reply generation probabilities
    replyChances: {
      foreignGreeting: 0.05, // 5% chance for foreign greeting
      standaloneGreeting: 0.25, // 25% chance for greeting without name
      emojiInGreeting: 0.4, // 40% chance to add emoji to standalone greeting
      weekdayPhrase: 0.2, // 40% chance to use weekday-specific phrase
      emojiAtEnd: 0.3, // 40% chance to add emoji at end of full reply
    },

    // Reply typing/interaction delays
    replyDelays: {
      beforeReplyClick: { min: 500, max: 1500 }, // Delay before clicking reply button
      waitForReplyBox: { min: 2000, max: 4000 }, // Wait for reply modal to open
      afterFocus: { min: 300, max: 500 }, // Delay after focusing text editor
      perCharacter: { min: 50, max: 150 }, // Typing speed per character
      beforeSend: { min: 500, max: 1500 }, // Delay before clicking send
      waitForModalClose: { min: 1500, max: 3000 }, // Wait for modal to auto-close
      escapeKeyFallback: { min: 500, max: 1000 }, // Delay after escape key press
    },

    // Behavior patterns (probabilities for randomDelay)
    behaviorPatterns: {
      quickScroll: 0.2, // 10% chance for quick scroll-through
      interestedReading: 0.25, // 25% cumulative (15% actual) for interested reading
      distracted: 0.25, // 35% cumulative (10% actual) for distracted behavior
      veryEngaged: 0.4, // 40% cumulative (5% actual) for very engaged
      // Remaining 60% = normal behavior
    },

    // Scroll behavior
    scrollOvershotChance: 0.3, // 30% chance of overshooting and correcting
  };

  interface ScrollOptions {
    variation?: "quick" | "normal" | "careful";
    maxDuration?: number;
    shouldOvershoot?: boolean;
  }

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

  const sunEmojis = ["☀️", "🌞", "🌅", "😇", "🫂", "🥰"];
  const gestureEmojis = ["👋", "🙋🏻‍♂️", "👊🏼", "✌🏼", "🤜🏼🤛🏼"];

  // Weighted random selection helpers
  function selectWeightedGreeting(): string {
    const totalWeight = gmGreetingsWeighted.reduce(
      (sum, g) => sum + g.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const greeting of gmGreetingsWeighted) {
      random -= greeting.weight;
      if (random <= 0) {
        return greeting.text;
      }
    }

    return gmGreetingsWeighted[0].text;
  }

  function selectWeightedForeignGreeting(): string {
    const totalWeight = gmForeignGreetingsWeighted.reduce(
      (sum, f) => sum + f.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const foreign of gmForeignGreetingsWeighted) {
      random -= foreign.weight;
      if (random <= 0) {
        return foreign.text;
      }
    }

    return gmForeignGreetingsWeighted[0].text;
  }

  function selectWeightedBaseName(): string {
    const totalWeight = gmBaseNameWeighted.reduce(
      (sum, b) => sum + b.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const baseName of gmBaseNameWeighted) {
      random -= baseName.weight;
      if (random <= 0) {
        return baseName.text;
      }
    }

    return gmBaseNameWeighted[0].text;
  }

  function selectWeightedSuffix(): string {
    const totalWeight = gmNameSuffixesWeighted.reduce(
      (sum, s) => sum + s.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const suffix of gmNameSuffixesWeighted) {
      random -= suffix.weight;
      if (random <= 0) {
        return suffix.text;
      }
    }

    return gmNameSuffixesWeighted[0].text;
  }

  // Weighted selection helpers for GN
  function selectWeightedGNGreeting(): string {
    const totalWeight = gnGreetingsWeighted.reduce(
      (sum, g) => sum + g.weight,
      0
    );
    let random = Math.random() * totalWeight;
    for (const greeting of gnGreetingsWeighted) {
      random -= greeting.weight;
      if (random <= 0) {
        return greeting.text;
      }
    }
    return gnGreetingsWeighted[0].text;
  }

  function selectWeightedGNForeignGreeting(): string {
    const totalWeight = gnForeignGreetingsWeighted.reduce(
      (sum, f) => sum + f.weight,
      0
    );
    let random = Math.random() * totalWeight;
    for (const foreign of gnForeignGreetingsWeighted) {
      random -= foreign.weight;
      if (random <= 0) {
        return foreign.text;
      }
    }
    return gnForeignGreetingsWeighted[0].text;
  }

  // Weighted selection helpers for GA
  function selectWeightedGAGreeting(): string {
    const totalWeight = gaGreetingsWeighted.reduce(
      (sum, g) => sum + g.weight,
      0
    );
    let random = Math.random() * totalWeight;
    for (const greeting of gaGreetingsWeighted) {
      random -= greeting.weight;
      if (random <= 0) {
        return greeting.text;
      }
    }
    return gaGreetingsWeighted[0].text;
  }

  function selectWeightedGAForeignGreeting(): string {
    const totalWeight = gaForeignGreetingsWeighted.reduce(
      (sum, f) => sum + f.weight,
      0
    );
    let random = Math.random() * totalWeight;
    for (const foreign of gaForeignGreetingsWeighted) {
      random -= foreign.weight;
      if (random <= 0) {
        return foreign.text;
      }
    }
    return gaForeignGreetingsWeighted[0].text;
  }

  function generateGMReply(authorName: string): string {
    // Chance for foreign greeting (standalone)
    if (Math.random() < CONFIG.replyChances.foreignGreeting) {
      return selectWeightedForeignGreeting();
    }

    // Pick greeting using weighted selection
    const greeting = selectWeightedGreeting();

    // Chance to return just the greeting (standalone)
    if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
      // Chance to add emoji to standalone greeting
      if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
        const emojiRoll = Math.random();
        if (emojiRoll < 0.7) {
          const sunEmoji =
            sunEmojis[Math.floor(Math.random() * sunEmojis.length)];
          return `${greeting} ${sunEmoji}`;
        } else {
          const gestureEmoji =
            gestureEmojis[Math.floor(Math.random() * gestureEmojis.length)];
          return `${greeting} ${gestureEmoji}`;
        }
      }
      return greeting;
    }

    // Get first word of author name (no @)
    const firstName = authorName.split(/\s+/)[0];

    // Select base name (authorName, friend, fam, anon, mf)
    const baseName = selectWeightedBaseName();
    let finalName: string;

    if (baseName === "authorName") {
      // Use author's name and potentially add a suffix
      const suffix = selectWeightedSuffix();
      finalName = `${firstName}${suffix}`;
    } else {
      // Use replacement word without suffix
      finalName = baseName;
    }

    // Determine day of week (0 = Sunday, 1-6 = Mon-Sat)
    const dayOfWeek = new Date().getDay();

    // Pick phrase based on day
    let phrase: string;
    if (
      gmWeekdayPhrases[dayOfWeek] &&
      Math.random() < CONFIG.replyChances.weekdayPhrase
    ) {
      // Chance to use weekday-specific phrase
      const dayPhrases = gmWeekdayPhrases[dayOfWeek];
      phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
    } else {
      // Otherwise use generic building phrases
      phrase =
        gmBuildingPhrases[Math.floor(Math.random() * gmBuildingPhrases.length)];
    }

    // Build reply: greeting + finalName + phrase
    let reply = `${greeting} ${finalName}, ${phrase}`;

    // Chance to add emoji at the end
    if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const sunEmoji =
          sunEmojis[Math.floor(Math.random() * sunEmojis.length)];
        reply = `${reply} ${sunEmoji}`;
      } else {
        const gestureEmoji =
          gestureEmojis[Math.floor(Math.random() * gestureEmojis.length)];
        reply = `${reply} ${gestureEmoji}`;
      }
    }

    return reply;
  }

  function generateGNReply(authorName: string): string {
    // Chance for foreign greeting (standalone)
    if (Math.random() < CONFIG.replyChances.foreignGreeting) {
      return selectWeightedGNForeignGreeting();
    }

    // Pick greeting using weighted selection
    const greeting = selectWeightedGNGreeting();

    // Chance to return just the greeting (standalone)
    if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
      // Chance to add emoji to standalone greeting
      if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
        const emojiRoll = Math.random();
        if (emojiRoll < 0.7) {
          const emoji = sunEmojis[Math.floor(Math.random() * sunEmojis.length)];
          return `${greeting} ${emoji}`;
        } else {
          const emoji =
            gestureEmojis[Math.floor(Math.random() * gestureEmojis.length)];
          return `${greeting} ${emoji}`;
        }
      }
      return greeting;
    }

    // Get first word of author name (no @)
    const firstName = authorName.split(/\s+/)[0];

    // Select base name
    const totalWeight = gnBaseNameWeighted.reduce(
      (sum, b) => sum + b.weight,
      0
    );
    let random = Math.random() * totalWeight;
    let baseName = "authorName";
    for (const item of gnBaseNameWeighted) {
      random -= item.weight;
      if (random <= 0) {
        baseName = item.text;
        break;
      }
    }

    let finalName: string;
    if (baseName === "authorName") {
      // Use author's name and potentially add a suffix
      const suffixTotalWeight = gnNameSuffixesWeighted.reduce(
        (sum, s) => sum + s.weight,
        0
      );
      random = Math.random() * suffixTotalWeight;
      let suffix = "";
      for (const s of gnNameSuffixesWeighted) {
        random -= s.weight;
        if (random <= 0) {
          suffix = s.text;
          break;
        }
      }
      finalName = `${firstName}${suffix}`;
    } else {
      finalName = baseName;
    }

    // Determine day of week
    const dayOfWeek = new Date().getDay();

    // Pick phrase based on day
    let phrase: string;
    if (
      gnWeekdayPhrases[dayOfWeek] &&
      Math.random() < CONFIG.replyChances.weekdayPhrase
    ) {
      const dayPhrases = gnWeekdayPhrases[dayOfWeek];
      phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
    } else {
      phrase =
        gnRestingPhrases[Math.floor(Math.random() * gnRestingPhrases.length)];
    }

    // Build reply
    let reply = `${greeting} ${finalName}, ${phrase}`;

    // Chance to add emoji at the end
    if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const emoji = sunEmojis[Math.floor(Math.random() * sunEmojis.length)];
        reply = `${reply} ${emoji}`;
      } else {
        const emoji =
          gestureEmojis[Math.floor(Math.random() * gestureEmojis.length)];
        reply = `${reply} ${emoji}`;
      }
    }

    return reply;
  }

  function generateGAReply(authorName: string): string {
    // Chance for foreign greeting (standalone)
    if (Math.random() < CONFIG.replyChances.foreignGreeting) {
      return selectWeightedGAForeignGreeting();
    }

    // Pick greeting using weighted selection
    const greeting = selectWeightedGAGreeting();

    // Chance to return just the greeting (standalone)
    if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
      // Chance to add emoji to standalone greeting
      if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
        const emojiRoll = Math.random();
        if (emojiRoll < 0.7) {
          const emoji = sunEmojis[Math.floor(Math.random() * sunEmojis.length)];
          return `${greeting} ${emoji}`;
        } else {
          const emoji =
            gestureEmojis[Math.floor(Math.random() * gestureEmojis.length)];
          return `${greeting} ${emoji}`;
        }
      }
      return greeting;
    }

    // Get first word of author name (no @)
    const firstName = authorName.split(/\s+/)[0];

    // Select base name
    const totalWeight = gaBaseNameWeighted.reduce(
      (sum, b) => sum + b.weight,
      0
    );
    let random = Math.random() * totalWeight;
    let baseName = "authorName";
    for (const item of gaBaseNameWeighted) {
      random -= item.weight;
      if (random <= 0) {
        baseName = item.text;
        break;
      }
    }

    let finalName: string;
    if (baseName === "authorName") {
      const suffixTotalWeight = gaNameSuffixesWeighted.reduce(
        (sum, s) => sum + s.weight,
        0
      );
      random = Math.random() * suffixTotalWeight;
      let suffix = "";
      for (const s of gaNameSuffixesWeighted) {
        random -= s.weight;
        if (random <= 0) {
          suffix = s.text;
          break;
        }
      }
      finalName = `${firstName}${suffix}`;
    } else {
      finalName = baseName;
    }

    // Determine day of week
    const dayOfWeek = new Date().getDay();

    // Pick phrase based on day
    let phrase: string;
    if (
      gaWeekdayPhrases[dayOfWeek] &&
      Math.random() < CONFIG.replyChances.weekdayPhrase
    ) {
      const dayPhrases = gaWeekdayPhrases[dayOfWeek];
      phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
    } else {
      phrase =
        gaHustlePhrases[Math.floor(Math.random() * gaHustlePhrases.length)];
    }

    // Build reply
    let reply = `${greeting} ${finalName}, ${phrase}`;

    // Chance to add emoji at the end
    if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const emoji = sunEmojis[Math.floor(Math.random() * sunEmojis.length)];
        reply = `${reply} ${emoji}`;
      } else {
        const emoji =
          gestureEmojis[Math.floor(Math.random() * gestureEmojis.length)];
        reply = `${reply} ${emoji}`;
      }
    }

    return reply;
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

  function isReplyPost(article: HTMLElement): boolean {
    // Check for "Replying to" text
    const socialContext = article.querySelector(
      '[data-testid="socialContext"]'
    );
    if (socialContext?.textContent?.includes("Replying to")) {
      return true;
    }

    // Check parent container for reply-specific classes
    const parentDiv = article.closest(
      '[data-testid="cellInnerDiv"]'
    )?.firstElementChild;
    if (
      parentDiv?.classList.contains("r-1igl3o0") ||
      parentDiv?.classList.contains("r-qklmqi")
    ) {
      return true;
    }

    return false;
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

  function isButtonAlreadyLiked(button: HTMLElement): boolean {
    if (button.getAttribute("data-testid") === "unlike") {
      return true;
    }

    if (button.closest('[data-testid="unlike"]') !== null) {
      return true;
    }

    const article = button.closest("article");
    if (article) {
      const unlikeInArticle = article.querySelector('[data-testid="unlike"]');
      if (unlikeInArticle) {
        return true;
      }

      const parentGroup = button.closest('[role="group"]');
      if (parentGroup && parentGroup.querySelector('[data-testid="unlike"]')) {
        return true;
      }
    }

    const svgPaths = button.querySelectorAll("path");
    for (const path of svgPaths) {
      const fill = path.getAttribute("fill");
      if (
        fill &&
        (fill.toLowerCase() === "#f91880" ||
          fill.toLowerCase() === "rgb(249, 24, 128)")
      ) {
        return true;
      }
    }

    return false;
  }

  function findAllLikeButtons(): HTMLElement[] {
    const allArticles = Array.from(document.querySelectorAll("article"));
    const likeButtons: HTMLElement[] = [];
    const alreadyLikedButtons: HTMLElement[] = [];

    for (const article of allArticles) {
      if (article.querySelector('[data-testid="unlike"]')) {
        continue;
      }

      let foundButton: HTMLElement | null = null;

      const interactionArea = article.querySelector('[role="group"]');
      if (interactionArea) {
        const buttons = Array.from(
          interactionArea.querySelectorAll<HTMLElement>("button")
        );
        if (buttons.length >= 3) {
          const potentialLikeButton = buttons[2];
          if (!isButtonAlreadyLiked(potentialLikeButton)) {
            foundButton = potentialLikeButton;
          }
        }
      }

      if (!foundButton) {
        const directLikeButton = article.querySelector<HTMLElement>(
          '[data-testid="like"]'
        );
        if (directLikeButton && !isButtonAlreadyLiked(directLikeButton)) {
          foundButton = directLikeButton;
        }
      }

      if (!foundButton) {
        const allButtons = Array.from(
          article.querySelectorAll<HTMLElement>("button")
        );
        for (const button of allButtons) {
          if (isButtonAlreadyLiked(button)) continue;

          const paths = button.querySelectorAll("path");
          for (const path of paths) {
            const d = path.getAttribute("d");
            if (
              d &&
              (d.includes("16.697") ||
                d.includes("M16.697") ||
                d.includes("c-1.222") ||
                d.includes("-3.89 2.16") ||
                d.includes("5.5c-1.222") ||
                (d.includes("heart") && !d.includes("bookmark")))
            ) {
              foundButton = button;
              break;
            }
          }
          if (foundButton) break;
        }
      }

      if (foundButton) {
        likeButtons.push(foundButton);
      }
    }

    const allInteractionBars = document.querySelectorAll('[role="group"]');
    for (const bar of allInteractionBars) {
      if (!bar.closest("article")) continue;

      if (bar.querySelector('[data-testid="unlike"]')) {
        continue;
      }

      const barButtons = Array.from(
        bar.querySelectorAll<HTMLElement>("button")
      );
      if (barButtons.length >= 3) {
        const thirdButton = barButtons[2];

        if (
          likeButtons.includes(thirdButton) ||
          alreadyLikedButtons.includes(thirdButton)
        )
          continue;

        if (isButtonAlreadyLiked(thirdButton)) {
          alreadyLikedButtons.push(thirdButton);
          continue;
        }

        if (thirdButton.textContent && /\d+/.test(thirdButton.textContent)) {
          likeButtons.push(thirdButton);
        } else {
          const paths = thirdButton.querySelectorAll("path");
          if (paths.length > 0) {
            likeButtons.push(thirdButton);
          }
        }
      }
    }

    console.log(`Found ${likeButtons.length} like buttons to process`);

    likeButtons.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top;
    });

    return likeButtons;
  }

  function getButtonUniqueId(button: HTMLElement): string {
    const article = button.closest("article");
    if (!article) return button.outerHTML.substring(0, 100);

    const socialContext = article.querySelector(
      '[data-testid="socialContext"]'
    );
    const isPinned = socialContext?.textContent?.includes("Pinned") ?? false;

    const idElement = article.querySelector('[data-testid="tweet"]');
    const tweetId = idElement?.getAttribute("data-tweet-id") ?? "";

    const tweetText =
      article.querySelector<HTMLElement>('[data-testid="tweetText"]')
        ?.textContent || "";
    const textSample = tweetText.substring(0, 40);

    // Don't use position - it changes when scrolling
    return `${isPinned ? "pinned-" : ""}${tweetId}-${textSample}`;
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

    function checkForDeletedPost(): boolean {
      const toastElements = document.querySelectorAll('[data-testid="toast"]');
      for (const toast of toastElements) {
        const toastText = toast.textContent || "";
        if (
          toastText.includes("post has been deleted") ||
          toastText.includes("That post has been deleted") ||
          toastText.includes("Sorry, that post")
        ) {
          return true;
        }
      }
      return false;
    }

    function checkForAutomationWarning(): boolean {
      const toastElements = document.querySelectorAll('[data-testid="toast"]');
      for (const toast of toastElements) {
        const toastText = toast.textContent || "";

        // Ignore "post deleted" messages - these are normal and not automation warnings
        if (
          toastText.includes("post has been deleted") ||
          toastText.includes("That post has been deleted") ||
          toastText.includes("Sorry, that post")
        ) {
          console.log("ℹ️ Post deleted - continuing automation");
          continue;
        }

        // Check for actual automation warnings
        if (
          toastText.includes("automated") ||
          toastText.includes("spam") ||
          toastText.includes("malicious") ||
          toastText.includes("protect our users")
        ) {
          console.log(
            "⚠️ CRITICAL WARNING: Twitter automation detection triggered!"
          );
          console.log("Toast message detected: " + toastText);
          shouldStop = true;
          return true;
        }
      }

      const warningTexts = [
        "This request looks like it might be automated",
        "To protect our users from spam",
        "we can't complete this action right now",
        "Please try again later",
        "You're unable to perform this action",
      ];

      const allTextElements = document.querySelectorAll("div, span, p");
      for (const element of allTextElements) {
        const text = element.textContent || "";
        for (const warningText of warningTexts) {
          if (text.includes(warningText)) {
            console.log(
              "⚠️ CRITICAL WARNING: Twitter automation alert detected!"
            );
            console.log("Warning text found: " + text);
            shouldStop = true;
            return true;
          }
        }
      }

      return false;
    }

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

        let isGM = false;
        let isGN = false;
        let isGA = false;

        if (post && post.tagName.toLowerCase() === "article") {
          const rect = post.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - window.innerHeight / 2;

          // Check for media in this post (prioritize video over image)
          const hasVideo = !!post.querySelector("video");
          const hasImage =
            !hasVideo && !!post.querySelector('[data-testid="tweetPhoto"]');

          // Check if this is a GM/GA/GN post (but not a reply)
          const postText =
            post.querySelector('[data-testid="tweetText"]')?.textContent || "";
          if (!isReplyPost(post)) {
            if (isGMPost(postText)) {
              console.log("☀️ This is a GM post");
              isGM = true;
            } else if (isGAPost(postText)) {
              console.log("🌤️ This is a GA post");
              isGA = true;
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

          // Add extra viewing time for visual content (skip for GM/GN/GA posts - we'll reply instead)
          if (isGM || isGN || isGA) {
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

        await sleep(
          CONFIG.beforeClick.min +
            Math.random() * (CONFIG.beforeClick.max - CONFIG.beforeClick.min)
        );

        // Get author before clicking
        let authorName = "Unknown";
        if (post && post.tagName.toLowerCase() === "article") {
          const authorElement = post.querySelector(
            '[data-testid="User-Name"] a[role="link"]'
          );
          authorName = authorElement?.textContent?.trim() || "Unknown";
        }

        // Skip own posts
        if (
          CONFIG.skipOwnPosts &&
          authorName.toLowerCase().includes(CONFIG.ownUsername.toLowerCase())
        ) {
          console.log(`⏭️ Skipping own post by ${CONFIG.ownUsername}`);
          continue;
        }

        nextButtonToLike.click();
        processedCount++;
        console.log(`Liked post ${processedCount}/${limit} by @${authorName}`);

        // Small delay after like to let DOM settle
        await sleep(
          CONFIG.afterClick.min +
            Math.random() * (CONFIG.afterClick.max - CONFIG.afterClick.min)
        );

        // If it's a GM/GN/GA post, click reply and compose response
        if (
          (isGM || isGN || isGA) &&
          post &&
          post.tagName.toLowerCase() === "article"
        ) {
          let postType: string;
          if (isGM) {
            postType = "GM";
          } else if (isGN) {
            postType = "GN";
          } else {
            postType = "GA";
          }
          console.log(`🔍 Looking for reply button in ${postType} post...`);
          const replyButton = post.querySelector(
            '[data-testid="reply"]'
          ) as HTMLElement;
          console.log(`🔍 Reply button found: ${!!replyButton}`);
          if (replyButton) {
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
            if (isGM) {
              reply = generateGMReply(authorName);
              console.log(`💬 Generated GM reply: "${reply}"`);
            } else if (isGN) {
              reply = generateGNReply(authorName);
              console.log(`💬 Generated GN reply: "${reply}"`);
            } else {
              reply = generateGAReply(authorName);
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
                  console.log("💬 Modal auto-closed, continuing to next post");
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

        // Check if post was deleted - skip it completely
        if (checkForDeletedPost()) {
          console.log("ℹ️ Deleted post - skipping");
          processedCount--;
          continue;
        }

        if (checkForAutomationWarning()) {
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
