/**
 * Utility functions for unfollow script
 */

/**
 * Sleep for a random duration within the given range
 * Checks shouldStop every 100ms to allow interruption
 */
export async function sleep(
  min: number,
  max: number,
  shouldStop?: () => boolean
): Promise<void> {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  const checkInterval = 100; // Check every 100ms
  const iterations = Math.floor(duration / checkInterval);

  for (let i = 0; i < iterations; i++) {
    if (shouldStop?.()) return;
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  // Sleep remaining time
  const remaining = duration % checkInterval;
  if (remaining > 0 && !shouldStop?.()) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

/**
 * Parse relative time strings (e.g., "2h", "3d", "Jan 15") to Date
 */
export function parseRelativeTime(timeText: string): Date | null {
  const now = new Date();

  // Handle hours (e.g., "2h")
  const hoursMatch = timeText.match(/^(\d+)h$/);
  if (hoursMatch) {
    const hours = Number.parseInt(hoursMatch[1], 10);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  // Handle days (e.g., "3d")
  const daysMatch = timeText.match(/^(\d+)d$/);
  if (daysMatch) {
    const days = Number.parseInt(daysMatch[1], 10);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Handle "Jan 15" format (assumes current year unless specified)
  const monthDayMatch = timeText.match(/^([A-Z][a-z]{2})\s+(\d+)$/);
  if (monthDayMatch) {
    const monthStr = monthDayMatch[1];
    const day = Number.parseInt(monthDayMatch[2], 10);
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[monthStr];
    if (month !== undefined) {
      const year = now.getFullYear();
      const date = new Date(year, month, day);
      // If date is in the future, assume it's from last year
      if (date > now) {
        date.setFullYear(year - 1);
      }
      return date;
    }
  }

  // Handle "Jan 15, 2023" format
  const fullDateMatch = timeText.match(/^([A-Z][a-z]{2})\s+(\d+),\s+(\d{4})$/);
  if (fullDateMatch) {
    const monthStr = fullDateMatch[1];
    const day = Number.parseInt(fullDateMatch[2], 10);
    const year = Number.parseInt(fullDateMatch[3], 10);
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[monthStr];
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  console.warn(`⚠️ Could not parse time: "${timeText}"`);
  return null;
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
    await sleep(1500, 2000, shouldStop);

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
    await sleep(500, 800, shouldStop);
  }

  // Final check - scroll a few more times just to be sure
  console.log("🔄 Final scrolls to ensure all users are loaded...");
  for (let i = 0; i < 5 && !shouldStop?.(); i++) {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
    await sleep(1500, 2000, shouldStop);
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
  await sleep(500, 800, shouldStop);
  // Then smooth scroll to ensure it's stable
  window.scrollTo({ top: 0, behavior: "smooth" });
  await sleep(2000, 3000, shouldStop);

  return finalUserCount;
}

/**
 * Check if a username matches suspicious bot patterns
 */
export function hasSuspiciousUsername(username: string): boolean {
  // Pattern 1: Many consecutive numbers (e.g., user123456, abc123456789)
  // Require 6+ consecutive digits (not 5) to be more tolerant
  if (/\d{6,}/.test(username)) {
    return true;
  }

  // Pattern 2: Random character sequences with numbers
  // Require 5+ consecutive digits (not 4) to avoid false positives like "Francesca333L"
  if (/[a-z]{3,}\d{5,}/i.test(username) || /\d{5,}[a-z]{3,}/i.test(username)) {
    return true;
  }

  // Pattern 3: Multiple underscores with numbers (e.g., user_123_456, abc_xyz_123)
  // Require 3+ underscores (not 2) to be more tolerant
  const underscoreCount = (username.match(/_/g) || []).length;
  if (underscoreCount >= 3 && /\d/.test(username)) {
    return true;
  }

  // Pattern 4: Very long usernames (> 25 chars, not 20) with numbers
  if (username.length > 25 && /\d/.test(username)) {
    return true;
  }

  // Pattern 5: Ends with 5+ numbers (not 4) to avoid false positives
  if (/\d{5,}$/.test(username)) {
    return true;
  }

  // Pattern 6: Random-looking sequences (mix of letters and numbers in random order)
  // Require 6+ alternations (not 5) to avoid false positives
  const letterNumberPattern = /[a-z]\d|\d[a-z]/gi;
  const matches = username.match(letterNumberPattern) || [];
  if (matches.length >= 6) {
    return true;
  }

  // Pattern 7: All numbers or mostly numbers (e.g., 1234567890, user123456789)
  // Require 70% digits (not 60%) to be more tolerant
  const digitCount = (username.match(/\d/g) || []).length;
  if (digitCount >= username.length * 0.7 && username.length > 5) {
    return true;
  }

  return false;
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
    await sleep(300, 500, shouldStop);

    // Click the button to open confirmation dialog
    followingButton.click();
    await sleep(500, 800, shouldStop);

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
      await sleep(200, 300, shouldStop);
    }

    if (!confirmationButton) {
      console.log(`⚠️ Confirmation dialog did not appear for @${username}`);
      return false;
    }

    // Click the "Unfollow" button in the confirmation dialog
    confirmationButton.click();
    await sleep(1000, 1500, shouldStop);

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
      await sleep(2000, 3000, shouldStop);
      console.log("✅ Profile loaded");
      return true;
    }

    await sleep(200, 300, shouldStop);
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
  await sleep(3000, 5000, shouldStop);

  // Try scrolling down a bit to trigger lazy loading
  window.scrollBy(0, 200);
  await sleep(1000, 1500, shouldStop);

  // Get all tweets
  let tweets = Array.from(
    document.querySelectorAll('article[data-testid="tweet"]')
  );

  // If no tweets found, wait a bit more and try again
  if (tweets.length === 0) {
    console.log("⏳ No posts found yet, waiting longer...");
    await sleep(3000, 4000, shouldStop);
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
  await sleep(2000, 3000, shouldStop);

  // Scroll down a bit to trigger lazy loading
  window.scrollBy(0, 300);
  await sleep(1000, 1500, shouldStop);

  // Get all tweets
  let tweets = Array.from(
    document.querySelectorAll('article[data-testid="tweet"]')
  );

  // If no tweets found, wait a bit more
  if (tweets.length === 0) {
    console.log("⏳ No posts found yet, waiting longer...");
    await sleep(2000, 3000, shouldStop);
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
 * Parse a number string that may contain abbreviations (K, M)
 * Examples: "12.1K" -> 12100, "1.5M" -> 1500000, "259" -> 259
 */
function parseAbbreviatedNumber(text: string): number | null {
  const trimmed = text.trim().replaceAll(",", "");

  // Match number with optional decimal and optional K/M suffix
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([KMkm])?$/);
  if (!match) {
    return null;
  }

  const number = Number.parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();

  if (suffix === "K") {
    return Math.floor(number * 1000);
  }
  if (suffix === "M") {
    return Math.floor(number * 1_000_000);
  }

  return Math.floor(number);
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
    await sleep(500, 800, shouldStop);

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
        await sleep(1000, 1500, shouldStop);
        console.log(
          `✅ Back on Following list (found ${userCells.length} users)`
        );
        return;
      }
    } else {
      // Reset counter if cells disappear (might be transitioning)
      consecutiveChecks = 0;
    }

    await sleep(300, 500, shouldStop);
  }

  // Final check - maybe we're back but detection was slow
  const finalCheck = document.querySelectorAll('[data-testid="UserCell"]');
  if (finalCheck.length > 0) {
    console.log(`✅ Back on Following list (found ${finalCheck.length} users)`);
    return;
  }

  console.warn("⚠️ Following list did not reload in time");
}
