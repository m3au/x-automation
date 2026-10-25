/**
 * DOM utility functions for interacting with X.com UI
 */

import { parseAbbreviatedNumber, parseRelativeTime, sleepRange } from "./utils";

export function isReplyPost(article: HTMLElement): boolean {
  // Check for "Replying to" text in socialContext - most reliable indicator
  const socialContext = article.querySelector('[data-testid="socialContext"]');
  if (socialContext?.textContent?.includes("Replying to")) {
    return true;
  }

  // Additional check: look for "Replying to" anywhere in the article text
  // This catches cases where socialContext might not be present or formatted differently
  const articleText = article.textContent || "";
  if (articleText.includes("Replying to")) {
    return true;
  }

  return false;
}

export function isOldVersionPost(article: HTMLElement): boolean {
  // Check if post has "There's a new version of this post" text
  const allText = article.textContent || "";
  return allText.includes("There's a new version of this post");
}

export function isLikeButtonDisabled(button: HTMLElement): boolean {
  // Check if the SVG inside the button has the "disabled" class
  const svg = button.querySelector("svg");
  if (svg && svg.classList.contains("r-12c3ph5")) {
    return true;
  }
  return false;
}

export function isButtonAlreadyLiked(button: HTMLElement): boolean {
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

export function findAllLikeButtons(): HTMLElement[] {
  const allArticles = Array.from(document.querySelectorAll("article"));
  const likeButtons: HTMLElement[] = [];
  const alreadyLikedButtons: HTMLElement[] = [];

  for (const article of allArticles) {
    if (article.querySelector('[data-testid="unlike"]')) {
      continue;
    }

    // Skip old versions of edited posts
    if (isOldVersionPost(article)) {
      console.log("⚠️ Old version of edited post found - skipping...");
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
        if (
          !isButtonAlreadyLiked(potentialLikeButton) &&
          !isLikeButtonDisabled(potentialLikeButton)
        ) {
          foundButton = potentialLikeButton;
        }
      }
    }

    if (!foundButton) {
      const directLikeButton = article.querySelector<HTMLElement>(
        '[data-testid="like"]'
      );
      if (
        directLikeButton &&
        !isButtonAlreadyLiked(directLikeButton) &&
        !isLikeButtonDisabled(directLikeButton)
      ) {
        foundButton = directLikeButton;
      }
    }

    if (!foundButton) {
      const allButtons = Array.from(
        article.querySelectorAll<HTMLElement>("button")
      );
      for (const button of allButtons) {
        if (isButtonAlreadyLiked(button) || isLikeButtonDisabled(button))
          continue;

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

    const barButtons = Array.from(bar.querySelectorAll<HTMLElement>("button"));
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

      if (isLikeButtonDisabled(thirdButton)) {
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

export function getButtonUniqueId(button: HTMLElement): string {
  const article = button.closest("article");
  if (!article) return button.outerHTML.substring(0, 100);

  const socialContext = article.querySelector('[data-testid="socialContext"]');
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

export function checkForDeletedPost(): boolean {
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

export function checkForAutomationWarning(): boolean {
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
        console.log("⚠️ CRITICAL WARNING: Twitter automation alert detected!");
        console.log("Warning text found: " + text);
        return true;
      }
    }
  }

  return false;
}

export function isDocumentVisible(): boolean {
  return !document.hidden;
}

export async function waitForVisibility(maxWaitTime = 900000): Promise<boolean> {
  console.log("Page not active. Waiting for visibility...");

  if (isDocumentVisible()) {
    return true;
  }

  return new Promise((resolve) => {
    let waitTime = 0;
    const checkInterval = 2000;

    const visibilityInterval = setInterval(() => {
      waitTime += checkInterval;

      if (isDocumentVisible()) {
        console.log("Page became active again, continuing...");
        clearInterval(visibilityInterval);
        resolve(true);
      }

      if (waitTime >= maxWaitTime) {
        console.log("Max wait time reached");
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

export async function humanLikeScroll(
  targetY: number,
  options: {
    variation?: "quick" | "normal" | "careful";
    shouldOvershoot?: boolean;
  } = {}
): Promise<void> {
  const { variation = "normal", shouldOvershoot = Math.random() < 0.3 } =
    options;

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
    await new Promise((resolve) => setTimeout(resolve, stepDelay));
  }

  // Handle overshoot and correction if needed
  if (shouldOvershoot) {
    window.scrollBy(0, overshootDistance);
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300)
    );

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
      await new Promise((resolve) =>
        setTimeout(resolve, 30 + Math.random() * 20)
      );
    }
  }
}

/**
 * Get all user cells in the Following list
 */
export function getAllUserCells(): Element[] {
  return Array.from(document.querySelectorAll('[data-testid="UserCell"]'));
}

/**
 * Scroll to the end of the Following list to load all users
 * Returns the total number of users found
 */
export async function scrollToEndOfList(
  shouldStop?: () => boolean
): Promise<number> {
  console.log("📜 Scrolling to end of Following list to load all users...");

  let previousCount = 0;
  let currentCount = getAllUserCells().length;
  let noChangeCount = 0;
  const maxNoChangeIterations = 10; // Stop if no new users loaded after 10 scrolls
  let scrollIterations = 0;
  const minScrollIterations = 20; // Always scroll at least 20 times to ensure we load everything

  while (!shouldStop?.()) {
    scrollIterations++;

    // Scroll to bottom
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

    // Wait longer for new content to load (X.com can be slow)
    await sleepRange(1500, 2000, shouldStop);

    // Check if new users were loaded
    currentCount = getAllUserCells().length;

    if (currentCount === previousCount) {
      noChangeCount++;
      // Only stop if we've scrolled enough AND no new users for several iterations
      if (
        noChangeCount >= maxNoChangeIterations &&
        scrollIterations >= minScrollIterations
      ) {
        console.log(
          `✅ Reached end of list (${currentCount} users loaded after ${scrollIterations} scrolls)`
        );
        break;
      }
    } else {
      noChangeCount = 0;
      console.log(
        `📊 Loaded ${currentCount} users so far... (scroll ${scrollIterations})`
      );
    }

    previousCount = currentCount;

    // Small delay between scrolls
    await sleepRange(500, 800, shouldStop);
  }

  // Final check - scroll a few more times just to be sure
  console.log("🔄 Final scrolls to ensure all users are loaded...");
  for (let i = 0; i < 5 && !shouldStop?.(); i++) {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
    await sleepRange(1500, 2000, shouldStop);
    const finalCount = getAllUserCells().length;
    if (finalCount > currentCount) {
      console.log(`📊 Found ${finalCount} more users (total: ${finalCount})`);
      currentCount = finalCount;
    }
  }

  // Capture the final count BEFORE scrolling back (X.com virtualizes the list)
  const finalUserCount = getAllUserCells().length;
  console.log(`✅ Finished scrolling. Total users found: ${finalUserCount}`);

  // Scroll back to top (caller will handle starting position)
  console.log("⬆️ Scrolling back to top...");
  // Use instant scroll first to ensure we're at top
  window.scrollTo({ top: 0, behavior: "auto" });
  await sleepRange(500, 800, shouldStop);
  // Then smooth scroll to ensure it's stable
  window.scrollTo({ top: 0, behavior: "smooth" });
  await sleepRange(2000, 3000, shouldStop);

  return finalUserCount;
}

/**
 * Check if user follows back (has "Follows you" indicator)
 */
export function doesUserFollowBack(cell: Element): boolean {
  const followIndicator = cell.querySelector(
    '[data-testid="userFollowIndicator"]'
  );
  if (!followIndicator) {
    return false;
  }

  const text = followIndicator.textContent?.toLowerCase() || "";
  return text.includes("follows you");
}

/**
 * Unfollow user directly from the Following list (without opening profile)
 */
export async function unfollowFromList(
  cell: Element,
  username: string,
  shouldStop?: () => boolean
): Promise<boolean> {
  try {
    console.log(`🔓 Unfollowing @${username} from list...`);

    // Find the "Following" button
    const followingButton = cell.querySelector(
      'button[data-testid*="-unfollow"][aria-label*="Following"]'
    ) as HTMLElement;

    if (!followingButton) {
      console.log(`⚠️ Could not find Following button for @${username}`);
      return false;
    }

    // Hover over the button to reveal "Unfollow"
    followingButton.dispatchEvent(
      new MouseEvent("mouseenter", { bubbles: true })
    );
    await sleepRange(300, 500, shouldStop);

    // Click the button to open confirmation dialog
    followingButton.click();
    await sleepRange(500, 800, shouldStop);

    // Wait for confirmation dialog to appear
    const maxWait = 5000;
    const startTime = Date.now();
    let confirmationButton: HTMLElement | null = null;

    while (Date.now() - startTime < maxWait && !shouldStop?.()) {
      confirmationButton = document.querySelector(
        '[data-testid="confirmationSheetConfirm"]'
      ) as HTMLElement;
      if (confirmationButton) {
        break;
      }
      await sleepRange(200, 300, shouldStop);
    }

    if (!confirmationButton) {
      console.log(`⚠️ Confirmation dialog did not appear for @${username}`);
      return false;
    }

    // Click the "Unfollow" button in the confirmation dialog
    confirmationButton.click();
    await sleepRange(1000, 1500, shouldStop);

    console.log(`✅ Unfollowed @${username} from list`);
    return true;
  } catch (error) {
    console.error(`❌ Error unfollowing @${username} from list:`, error);
    return false;
  }
}

/**
 * Extract user info from a user cell
 */
export function extractUserInfo(
  cell: Element
): { username: string; displayName: string } | null {
  try {
    const link = cell.querySelector('a[href^="/"]');
    if (!link) return null;

    const href = link.getAttribute("href");
    if (!href) return null;

    const username = href.replace("/", "");
    const displayName =
      cell.querySelector('[dir="ltr"]')?.textContent?.trim() || username;

    return { username, displayName };
  } catch (error) {
    console.error("Error extracting user info:", error);
    return null;
  }
}

/**
 * Click the UserCell button to open profile (without navigating)
 */
export function clickUserCell(cell: Element): boolean {
  const userInfo = extractUserInfo(cell);
  const username = userInfo?.username || "unknown";
  console.log(`🔗 Clicking UserCell for @${username}`);

  // Click the UserCell button itself (not the links inside)
  const button = cell as HTMLElement;
  if (button && button.click) {
    button.click();
    return true;
  } else {
    console.error("❌ Could not click UserCell button");
    return false;
  }
}

/**
 * Wait for the profile to appear (without URL navigation)
 */
export async function waitForProfileLoad(
  shouldStop?: () => boolean
): Promise<boolean> {
  const maxWait = 15000; // 15 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait && !shouldStop?.()) {
    // Check for profile-specific elements (profile may appear without URL change)
    const userName = document.querySelector('[data-testid="UserName"]');
    const userDescription = document.querySelector(
      '[data-testid="UserDescription"]'
    );
    const followingButton = document.querySelector(
      '[data-testid*="unfollow"], [data-testid*="follow"]'
    );
    const userProfileHeader = document.querySelector(
      '[data-testid="UserProfileHeader_Items"]'
    );

    // Profile page should have at least userName or userDescription
    if (userName || userDescription || followingButton || userProfileHeader) {
      // Wait longer for content to fully load (including posts)
      await sleepRange(2000, 3000, shouldStop);
      console.log("✅ Profile loaded");
      return true;
    }

    await sleepRange(200, 300, shouldStop);
  }

  return false;
}

/**
 * Find the last post date on the profile (excluding pinned posts)
 */
export async function getLastPostDate(
  shouldStop?: () => boolean
): Promise<Date | null> {
  console.log("🔍 Checking for recent posts...");

  // Wait for posts to load (longer wait for slow connections)
  await sleepRange(3000, 5000, shouldStop);

  // Try scrolling down a bit to trigger lazy loading
  window.scrollBy(0, 200);
  await sleepRange(1000, 1500, shouldStop);

  // Get all tweets
  let tweets = Array.from(
    document.querySelectorAll('article[data-testid="tweet"]')
  );

  // If no tweets found, wait a bit more and try again
  if (tweets.length === 0) {
    console.log("⏳ No posts found yet, waiting longer...");
    await sleepRange(3000, 4000, shouldStop);
    tweets = Array.from(
      document.querySelectorAll('article[data-testid="tweet"]')
    );
  }

  if (tweets.length === 0) {
    console.log("❌ No posts found after waiting");
    return null;
  }

  // Filter out pinned posts
  const nonPinnedTweets = tweets.filter((tweet) => {
    // Check if tweet has pinned indicator
    const pinnedIndicator = tweet.querySelector(
      '[data-testid="socialContext"]'
    );
    if (pinnedIndicator) {
      const text = pinnedIndicator.textContent?.toLowerCase() || "";
      if (text.includes("pinned")) {
        console.log("📌 Skipping pinned post");
        return false;
      }
    }
    return true;
  });

  if (nonPinnedTweets.length === 0) {
    console.log("❌ No non-pinned posts found");
    return null;
  }

  // Get the first non-pinned tweet's timestamp
  const firstTweet = nonPinnedTweets[0];
  const timeElement = firstTweet.querySelector("time");

  if (!timeElement) {
    console.log("❌ Could not find timestamp");
    return null;
  }

  const datetime = timeElement.getAttribute("datetime");
  if (datetime) {
    // Use ISO datetime if available
    const date = new Date(datetime);
    console.log(`📅 Last post: ${date.toLocaleDateString()}`);
    return date;
  }

  // Fallback: parse the visible text
  const timeText = timeElement.textContent?.trim() || "";
  const date = parseRelativeTime(timeText);

  if (date) {
    console.log(
      `📅 Last post: ${date.toLocaleDateString()} (parsed from "${timeText}")`
    );
  }

  return date;
}

/**
 * Check if user is verified
 */
export function isUserVerified(): boolean {
  // Look for verified badge icon
  const verifiedIcon = document.querySelector('[data-testid="icon-verified"]');
  if (verifiedIcon) {
    return true;
  }

  // Also check for aria-label
  const verifiedByLabel = document.querySelector(
    '[aria-label="Verified account"]'
  );
  if (verifiedByLabel) {
    return true;
  }

  return false;
}

/**
 * Check if user only has reposts (no original posts) in first N posts
 */
export async function hasOnlyReposts(
  checkCount: number,
  shouldStop?: () => boolean
): Promise<boolean> {
  console.log(
    `🔍 Checking if user only reposts (checking first ${checkCount} posts)...`
  );

  // Wait for posts to load
  await sleepRange(2000, 3000, shouldStop);

  // Scroll down a bit to trigger lazy loading
  window.scrollBy(0, 300);
  await sleepRange(1000, 1500, shouldStop);

  // Get all tweets
  let tweets = Array.from(
    document.querySelectorAll('article[data-testid="tweet"]')
  );

  // If no tweets found, wait a bit more
  if (tweets.length === 0) {
    console.log("⏳ No posts found yet, waiting longer...");
    await sleepRange(2000, 3000, shouldStop);
    tweets = Array.from(
      document.querySelectorAll('article[data-testid="tweet"]')
    );
  }

  if (tweets.length === 0) {
    console.log("❌ No posts found");
    return false; // Can't determine, assume not repost-only
  }

  // Filter out pinned posts - on a profile page, all posts are by the profile owner
  const nonPinnedPosts = tweets.filter((tweet) => {
    const socialContext = tweet.querySelector('[data-testid="socialContext"]');
    if (socialContext) {
      const text = socialContext.textContent?.toLowerCase() || "";
      return !text.includes("pinned");
    }
    return true;
  });

  // Check first N non-pinned posts
  const postsToCheck = nonPinnedPosts.slice(0, checkCount);

  if (postsToCheck.length === 0) {
    console.log("❌ No non-pinned posts found");
    return false;
  }

  // Check if all posts have the "reposted" tag
  let repostCount = 0;
  for (const tweet of postsToCheck) {
    const socialContext = tweet.querySelector('[data-testid="socialContext"]');
    if (socialContext) {
      const text = socialContext.textContent?.toLowerCase() || "";
      if (text.includes("reposted")) {
        repostCount++;
      }
    }
  }

  const allReposts = repostCount === postsToCheck.length;
  console.log(
    `📊 Found ${repostCount}/${postsToCheck.length} reposts in first ${checkCount} posts`
  );

  return allReposts;
}

/**
 * Get following and followers counts from profile
 */
export async function getFollowingFollowersCounts(
  shouldStop?: () => boolean
): Promise<{
  following: number;
  followers: number;
} | null> {
  try {
    // Wait a bit for profile header to load
    await sleepRange(500, 800, shouldStop);

    let following = 0;
    let followers = 0;

    // Find links with "following" or "followers" in href
    // Note: followers link might be /verified_followers, so we match "followers" (not "/followers")
    const followingLink = document.querySelector(
      'a[href*="following"]:not([href*="followers"])'
    ) as HTMLElement;
    let followersLink = document.querySelector(
      'a[href*="followers"]'
    ) as HTMLElement;

    // Fallback: if followers link not found by href, try finding by text content
    if (!followersLink) {
      const allLinks = Array.from(document.querySelectorAll("a"));
      followersLink = allLinks.find((link) => {
        const text = link.textContent?.toLowerCase() || "";
        return text.includes("followers") && !text.includes("following");
      }) as HTMLElement;
    }

    // Parse following count from spans inside the link
    if (followingLink) {
      const allSpans = Array.from(followingLink.querySelectorAll("span"));
      let foundFollowing = false;
      for (const span of allSpans) {
        const text = span.textContent?.trim() || "";
        const parsed = parseAbbreviatedNumber(text);
        if (parsed !== null) {
          following = parsed;
          foundFollowing = true;
          break;
        }
      }

      // Fallback: parse from link textContent if span parsing failed
      if (!foundFollowing) {
        const text = followingLink.textContent || "";
        const numberMatch = text.match(/(\d+(?:\.\d+)?\s*[KMkm]?)/);
        if (numberMatch) {
          const parsed = parseAbbreviatedNumber(numberMatch[1]);
          if (parsed !== null) {
            following = parsed;
          }
        }
      }
    }

    // Parse followers count from spans inside the link
    if (followersLink) {
      const allSpans = Array.from(followersLink.querySelectorAll("span"));
      let foundFollowers = false;
      for (const span of allSpans) {
        const text = span.textContent?.trim() || "";
        const parsed = parseAbbreviatedNumber(text);
        if (parsed !== null) {
          followers = parsed;
          foundFollowers = true;
          break;
        }
      }

      // Fallback: parse from link textContent if span parsing failed
      if (!foundFollowers) {
        const text = followersLink.textContent || "";
        const numberMatch = text.match(/(\d+(?:\.\d+)?\s*[KMkm]?)/);
        if (numberMatch) {
          const parsed = parseAbbreviatedNumber(numberMatch[1]);
          if (parsed !== null) {
            followers = parsed;
          }
        }
      }
    }

    if (following === 0 && followers === 0) {
      console.log("⚠️ Could not parse following/followers counts (both are 0)");
      return null;
    }

    return { following, followers };
  } catch (error) {
    console.error("Error getting following/followers counts:", error);
    return null;
  }
}

/**
 * Go back to the Following list by clicking the back button
 */
export async function goBackToFollowingList(
  shouldStop?: () => boolean
): Promise<void> {
  console.log("⬅️ Going back to Following list...");

  // Find the app bar back button
  const backButton = document.querySelector(
    '[data-testid="app-bar-back"]'
  ) as HTMLElement;
  if (backButton) {
    backButton.click();
  } else {
    // Fallback: try aria-label
    const backButtonByLabel = document.querySelector(
      '[aria-label="Back"]'
    ) as HTMLElement;
    if (backButtonByLabel) {
      backButtonByLabel.click();
    } else {
      console.warn("⚠️ Could not find back button");
      return;
    }
  }

  // Wait for the Following list to be visible again
  const maxWait = 15000; // 15 seconds
  const startTime = Date.now();
  let consecutiveChecks = 0;
  const requiredConsecutiveChecks = 2; // Need to see cells 2 times in a row to confirm

  while (Date.now() - startTime < maxWait && !shouldStop?.()) {
    // Check if we're back on the Following list (UserCells should be visible)
    const userCells = document.querySelectorAll('[data-testid="UserCell"]');

    if (userCells.length > 0) {
      consecutiveChecks++;

      // If we've seen cells multiple times in a row, we're definitely back
      if (consecutiveChecks >= requiredConsecutiveChecks) {
        // Wait a bit more to ensure list is fully loaded and stable
        await sleepRange(1000, 1500, shouldStop);
        console.log(
          `✅ Back on Following list (found ${userCells.length} users)`
        );
        return;
      }
    } else {
      // Reset counter if cells disappear (might be transitioning)
      consecutiveChecks = 0;
    }

    await sleepRange(300, 500, shouldStop);
  }

  // Final check - maybe we're back but detection was slow
  const finalCheck = document.querySelectorAll('[data-testid="UserCell"]');
  if (finalCheck.length > 0) {
    console.log(`✅ Back on Following list (found ${finalCheck.length} users)`);
    return;
  }

  console.warn("⚠️ Following list did not reload in time");
}
