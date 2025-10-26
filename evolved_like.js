let shouldStop = false;

function resetState() {
  shouldStop = false;
  console.log("State reset - ready to run");
}

function stop() {
  shouldStop = true;
  console.log("Stopping script...");

  const articles = document.querySelectorAll("article");
  for (const article of articles) {
    article.style.outline = "none";
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function randomDelay() {
  const tweetText =
    document.querySelector('[data-testid="tweetText"]')?.textContent || "";
  const hasImage = !!document.querySelector('img[src*="/media/"]');
  const hasVideo = !!document.querySelector("video");
  const textLength = tweetText.length;

  // Base reading speed: 200-300 words per minute (average human reading speed)
  const wordsInTweet = tweetText.split(/\s+/).length;
  const baseReadingTime =
    (wordsInTweet / (200 + Math.random() * 100)) * 60 * 1000;

  // Add time for media consumption
  let mediaTime = 0;
  if (hasImage) {
    mediaTime += 2000 + Math.random() * 3000; // 2-5s for images
  }
  if (hasVideo) {
    mediaTime += 5000 + Math.random() * 10000; // 5-15s for videos
  }

  // Base delay calculation
  const baseDelayPerChar = 20 + Math.random() * 20; // 20-40ms per character
  const minDelay = 1500 + Math.random() * 1000; // 1.5-2.5s minimum
  const baseDelay = Math.max(minDelay, textLength * baseDelayPerChar);

  // Human behavior patterns
  const behaviorRoll = Math.random();
  let finalDelay = baseDelay;

  if (behaviorRoll < 0.1) {
    // Quick scroll-through (10% chance)
    finalDelay = Math.max(minDelay, finalDelay * 0.5);
    console.log("Quick skim through");
  } else if (behaviorRoll < 0.25) {
    // Interested reading (15% chance)
    finalDelay += baseReadingTime + mediaTime;
    console.log("Interested reading");
  } else if (behaviorRoll < 0.35) {
    // Distracted behavior (10% chance)
    finalDelay += Math.random() * 8000 + 4000;
    console.log("Distracted pause");
  } else if (behaviorRoll < 0.4) {
    // Very engaged (5% chance)
    finalDelay += baseReadingTime * 1.5 + mediaTime * 1.5;
    console.log("Engaged reading");
  }

  // Add micro-variations
  const microAdjustment = (Math.random() - 0.5) * 2000;
  finalDelay += microAdjustment;

  // Ensure minimum delay
  finalDelay = Math.max(minDelay, Math.floor(finalDelay));

  console.log(`Waiting for ${Math.round(finalDelay / 1000)} seconds...`);
  return delay(finalDelay);
}

function isButtonAlreadyLiked(button) {
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

function findAllLikeButtons() {
  const allButtons = Array.from(document.querySelectorAll("button"));
  const allArticles = Array.from(document.querySelectorAll("article"));
  const likeButtons = [];
  const alreadyLikedButtons = [];

  for (const article of allArticles) {
    const isPinned =
      article.querySelector('[data-testid="socialContext"]') &&
      article
        .querySelector('[data-testid="socialContext"]')
        .textContent.includes("Pinned");

    if (article.querySelector('[data-testid="unlike"]')) {
      continue;
    }

    let foundButton = null;

    const interactionArea = article.querySelector('[role="group"]');
    if (interactionArea) {
      const buttons = Array.from(interactionArea.querySelectorAll("button"));
      if (buttons.length >= 3) {
        const potentialLikeButton = buttons[2];
        if (!isButtonAlreadyLiked(potentialLikeButton)) {
          foundButton = potentialLikeButton;
        }
      }
    }

    if (!foundButton) {
      const directLikeButton = article.querySelector('[data-testid="like"]');
      if (directLikeButton && !isButtonAlreadyLiked(directLikeButton)) {
        foundButton = directLikeButton;
      }
    }

    if (!foundButton) {
      const allButtons = Array.from(article.querySelectorAll("button"));
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

    const article = bar.closest("article");
    if (bar.querySelector('[data-testid="unlike"]')) {
      continue;
    }

    const barButtons = Array.from(bar.querySelectorAll("button"));
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

function getButtonUniqueId(button) {
  const article = button.closest("article");
  if (!article) return button.outerHTML.substring(0, 100);

  const isPinned =
    article.querySelector('[data-testid="socialContext"]') &&
    article
      .querySelector('[data-testid="socialContext"]')
      .textContent.includes("Pinned");

  const idElement = article.querySelector('[data-testid="tweet"]');
  const tweetId = idElement ? idElement.getAttribute("data-tweet-id") : "";

  const tweetText =
    article.querySelector('[data-testid="tweetText"]')?.textContent || "";
  const textSample = tweetText.substring(0, 40);

  const rect = button.getBoundingClientRect();
  const position = `${Math.round(rect.top)}-${Math.round(rect.left)}`;

  return `${isPinned ? "pinned-" : ""}${tweetId}-${textSample}-${position}`;
}

async function humanLikeScroll(targetY, options = {}) {
  const {
    variation = "normal", // 'quick', 'normal', 'careful'
    maxDuration = 2000, // max time for the scroll
    shouldOvershoot = Math.random() < 0.3, // 30% chance to overshoot
  } = options;

  const startY = window.scrollY;
  const distance = targetY - startY;

  // Determine scroll characteristics based on variation
  let steps;
  let baseStepDelay;

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
    await delay(stepDelay);
  }

  // Handle overshoot and correction if needed
  if (shouldOvershoot) {
    window.scrollBy(0, overshootDistance);
    await delay(200 + Math.random() * 300);

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
      await delay(30 + Math.random() * 20);
    }
  }
}

async function likeAllPosts(limit = 10) {
  let processedCount = 0;
  const seenButtons = new Set();
  const alreadyLikedSet = new Set();
  let consecutiveNoNewButtons = 0;
  let lastScrollPosition = window.scrollY;
  let lastLikedPostPosition = null;
  let isPaused = false;

  function checkForAutomationWarning() {
    const toastElements = document.querySelectorAll('[data-testid="toast"]');
    for (const toast of toastElements) {
      const toastText = toast.textContent || "";
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
  function isDocumentVisible() {
    return !document.hidden;
  }

  // Function to wait for document to become visible
  async function waitForVisibility(maxWaitTime = 3600000) {
    // Default 1 hour max wait
    console.log("Page not active. Waiting for visibility...");

    if (isDocumentVisible()) {
      return true;
    }

    return new Promise((resolve) => {
      let waitTime = 0;
      const checkInterval = 2000; // Check every 2 seconds

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
      const handleVisibilityChange = () => {
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
  // Don't automatically scroll to the top, start from current position
  // window.scrollTo(0, 0);
  await delay(2000);

  // Initial scroll to find first unliked post
  let foundInitialPost = false;
  let initialScrollAttempts = 0;
  const maxInitialScrollAttempts = 20;
  let initialPosition = window.scrollY; // Save initial position

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
        "Found first unliked post after scrolling " +
          initialScrollAttempts +
          " times"
      );

      // Scroll to the first unliked post, but ensure we only go down, never up
      const nextButtonToLike = eligibleButtons[0];
      let post = nextButtonToLike;
      for (let i = 0; i < 10; i++) {
        if (!post) break;
        if (
          post.tagName.toLowerCase() === "article" ||
          post.getAttribute("role") === "article"
        ) {
          break;
        }
        post = post.parentElement;
      }

      if (post && post.tagName.toLowerCase() === "article") {
        const rect = post.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - window.innerHeight / 2;

        // Only scroll if target position is below our current position
        if (targetY > window.scrollY) {
          await humanLikeScroll(targetY);
          await delay(500 + Math.random() * 500);
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
        "Scrolling down to find unliked posts... (attempt " +
          initialScrollAttempts +
          ")"
      );

      // Ensure we're only scrolling downward, not upward
      const scrollAmount = window.innerHeight * (0.7 + Math.random() * 0.3);
      const newPosition = window.scrollY + scrollAmount;

      // Make sure we're always scrolling down from our starting position
      if (newPosition > initialPosition) {
        await humanLikeScroll(newPosition, {
          variation: "quick",
        });
        await delay(1000 + Math.random() * 500);
      } else {
        console.log("Warning: Attempted to scroll up, correcting course");
        await humanLikeScroll(initialPosition + scrollAmount, {
          variation: "quick",
        });
        await delay(1000 + Math.random() * 500);
      }
    }
  }

  if (!foundInitialPost && initialScrollAttempts >= maxInitialScrollAttempts) {
    console.log(
      "Could not find any unliked posts after " +
        maxInitialScrollAttempts +
        " scroll attempts"
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
      if (consecutiveNoNewButtons >= 15) {
        // Only check for tab activity if no eligible buttons are found
        // and we've tried scrolling multiple times
        if (!isDocumentVisible()) {
          console.log(
            "No posts found and browser tab inactive - pausing until active again"
          );
          consecutiveNoNewButtons = 0; // Reset counter
          isPaused = true;
          const becameVisible = await waitForVisibility();
          if (!becameVisible || shouldStop) {
            console.log("Stopping after visibility wait");
            return;
          }
          console.log("Tab active again - resuming operation");
          isPaused = false;
          // Give time for content to load after becoming visible
          await delay(3000);
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
      await delay(1500);
      continue;
    }

    consecutiveNoNewButtons = 0;

    const nextButtonToLike = eligibleButtons[0];
    const buttonId = getButtonUniqueId(nextButtonToLike);
    seenButtons.add(buttonId);

    try {
      let post = nextButtonToLike;
      for (let i = 0; i < 10; i++) {
        if (!post) break;
        if (
          post.tagName.toLowerCase() === "article" ||
          post.getAttribute("role") === "article"
        ) {
          break;
        }
        post = post.parentElement;
      }

      if (!document.body.contains(nextButtonToLike)) {
        continue;
      }

      if (isButtonAlreadyLiked(nextButtonToLike)) {
        alreadyLikedSet.add(buttonId);
        continue;
      }

      if (post && post.tagName.toLowerCase() === "article") {
        const rect = post.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - window.innerHeight / 2;
        await humanLikeScroll(targetY);
        await delay(500 + Math.random() * 500);
      }

      const buttonRect = nextButtonToLike.getBoundingClientRect();
      lastLikedPostPosition = {
        y: window.scrollY + buttonRect.top - window.innerHeight / 2,
        button: buttonId,
      };

      // Natural variable delay before clicking (300-1200ms)
      await delay(300 + Math.random() * 900);

      nextButtonToLike.click();
      processedCount++;
      console.log(`Liked post ${processedCount}/${limit}`);

      // Small delay after clicking to allow Twitter to process
      await delay(300 + Math.random() * 700);

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

function likeCurrentUserPosts(limit = 10) {
  console.log(`Running direct like script with limit of ${limit} posts`);
  resetState();
  likeAllPosts(limit);
}

likeCurrentUserPosts(69);
