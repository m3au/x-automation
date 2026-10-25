/**
 * Unfollow Inactive Users Script
 *
 * This script checks users in your Following list and unfollows them based on
 * configurable criteria (inactivity, verification status, following/followers ratio).
 *
 * Features:
 * - Checks each user's profile for recent activity
 * - Unfollows unverified users (if enabled)
 * - Unfollows users with high following/followers ratio (if enabled)
 * - Respects a daily limit of 20 unfollows
 * - Human-like delays and behavior
 */

import {
  clickUserCell,
  doesUserFollowBack,
  extractUserInfo,
  getAllUserCells,
  getFollowingFollowersCounts,
  getLastPostDate,
  goBackToFollowingList,
  hasOnlyReposts,
  isUserVerified,
  scrollToEndOfList,
  unfollowFromList,
  waitForProfileLoad,
} from "./dom-utils";
import { hasSuspiciousUsername, sleepRange } from "./utils";

// Unfollow configuration
const UNFOLLOW_CONFIG = {
  // Unfollow users who are not verified
  unfollowUnverified: false,

  // Unfollow users who follow X times more people than follow them (e.g., 10 means 10x more following than followers)
  unfollowHighFollowingRatio: false,
  followingToFollowersRatio: 10, // Unfollow if following >= (followers * this ratio)

  // Unfollow users who only repost (no original posts in first N posts)
  unfollowRepostOnly: false,
  repostCheckCount: 5, // Check first N posts

  // Unfollow users with suspicious username patterns (bots/spam)
  unfollowSuspiciousUsername: false,

  // Unfollow users who haven't posted in X months
  unfollowInactive: true,
  inactiveMonths: 3, // Unfollow if no posts in this many months

  // Start processing from top (true) or bottom (false)
  // If true: scrolls DOWN from top
  // If false: scrolls UP from bottom
  startFromTop: false,

  // Skip initial scroll to end (set to true if you're already at the bottom of the list)
  alreadyAtEnd: false,

  // Unfollow users who don't follow back (check directly from list, no profile needed)
  unfollowNotFollowingBack: false,

  // Whitelist of usernames to never unfollow (without @ symbol)
  whitelist: ["jack", "cowsay", "vxunderground"],
};

// Script state
let shouldStop = false;
let unfollowedCount = 0;
const MAX_UNFOLLOWS_PER_DAY = 10;
// Inactivity threshold calculated from config
const INACTIVITY_THRESHOLD_MS =
  UNFOLLOW_CONFIG.inactiveMonths * 30 * 24 * 60 * 60 * 1000;

/**
 * Get shouldStop function for passing to utilities
 */
function getShouldStop(): boolean {
  return shouldStop;
}

/**
 * Check if a user is inactive (no posts in last 2 months)
 */
async function isUserInactive(): Promise<boolean> {
  const lastPostDate = await getLastPostDate(getShouldStop);

  if (!lastPostDate) {
    // If we can't determine the date, check if there are truly no posts
    // If no posts found at all, consider them inactive
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    if (tweets.length === 0) {
      console.log("📭 User has no posts, considering inactive");
      return true;
    }

    // If we can't determine the date but posts exist, assume they're active (conservative approach)
    console.log("⚠️ Could not determine last post date, assuming active");
    return false;
  }

  const now = new Date();
  const timeSinceLastPost = now.getTime() - lastPostDate.getTime();
  const daysSinceLastPost = Math.floor(
    timeSinceLastPost / (24 * 60 * 60 * 1000)
  );

  console.log(`⏰ Days since last post: ${daysSinceLastPost}`);

  return timeSinceLastPost > INACTIVITY_THRESHOLD_MS;
}

/**
 * Check if user should be unfollowed based on all criteria
 */
async function shouldUnfollowUser(username: string): Promise<{
  shouldUnfollow: boolean;
  reason: string;
}> {
  // Determine if we should skip inactivity check (to avoid unnecessary post checking)
  const skipInactivityCheck = !UNFOLLOW_CONFIG.unfollowInactive;

  // Check following/followers ratio FIRST (even if user is active)
  let followerCount = 0;
  if (UNFOLLOW_CONFIG.unfollowHighFollowingRatio) {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const counts = await getFollowingFollowersCounts(() => shouldStop);
    if (counts) {
      const { following, followers } = counts;
      followerCount = followers;
      console.log(`📊 Following: ${following}, Followers: ${followers}`);

      // Avoid division by zero
      if (followers > 0) {
        const ratio = following / followers;
        console.log(
          `📈 Ratio: ${ratio.toFixed(2)}x (threshold: ${UNFOLLOW_CONFIG.followingToFollowersRatio}x)`
        );
        if (ratio >= UNFOLLOW_CONFIG.followingToFollowersRatio) {
          return {
            shouldUnfollow: true,
            reason: `high following ratio (${following} following / ${followers} followers = ${ratio.toFixed(1)}x)`,
          };
        }
      } else if (following > 0 && followers === 0) {
        // If they follow people but have 0 followers, unfollow
        console.log(`📈 Ratio: ∞ (following: ${following}, followers: 0)`);
        return {
          shouldUnfollow: true,
          reason: `high following ratio (${following} following / 0 followers)`,
        };
      }
    } else {
      console.log("⚠️ Could not get following/followers counts");
    }
  } else if (UNFOLLOW_CONFIG.unfollowSuspiciousUsername) {
    // Get follower count for suspicious username check
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const counts = await getFollowingFollowersCounts(() => shouldStop);
    if (counts) {
      followerCount = counts.followers;
    }
  }

  // Check username pattern (skip if user has 1000+ followers)
  if (
    UNFOLLOW_CONFIG.unfollowSuspiciousUsername &&
    followerCount < 1000 &&
    hasSuspiciousUsername(username)
  ) {
    return {
      shouldUnfollow: true,
      reason: `suspicious username pattern (@${username})`,
    };
  }

  // Check if user only reposts (no original content)
  if (UNFOLLOW_CONFIG.unfollowRepostOnly) {
    const onlyReposts = await hasOnlyReposts(
      UNFOLLOW_CONFIG.repostCheckCount,
      getShouldStop
    );
    if (onlyReposts) {
      return {
        shouldUnfollow: true,
        reason: `only reposts (first ${UNFOLLOW_CONFIG.repostCheckCount} posts are all reposts)`,
      };
    }
  }

  // Check verification status
  if (UNFOLLOW_CONFIG.unfollowUnverified) {
    const verified = isUserVerified();
    if (!verified) {
      return { shouldUnfollow: true, reason: "not verified" };
    }
  }

  // Check inactivity if enabled
  if (!skipInactivityCheck) {
    const inactive = await isUserInactive();
    if (inactive) {
      return {
        shouldUnfollow: true,
        reason: `inactive (no posts or last post > ${UNFOLLOW_CONFIG.inactiveMonths} months)`,
      };
    }
  }

  return { shouldUnfollow: false, reason: "active user" };
}

/**
 * Unfollow a user
 */
async function unfollowUser(username: string): Promise<boolean> {
  try {
    // Find the "Following" button by looking for the button with "Following" text
    const followingButton = Array.from(
      document.querySelectorAll('button[role="button"]')
    ).find((btn) => {
      const text = btn.textContent?.trim() || "";
      return text === "Following";
    }) as HTMLElement;

    if (!followingButton) {
      console.error("❌ Could not find Following button");
      return false;
    }

    // Hover over the Following button to reveal Unfollow
    console.log(`🖱️ Hovering over Following button...`);
    const mouseEnterEvent = new MouseEvent("mouseenter", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    followingButton.dispatchEvent(mouseEnterEvent);

    // Also trigger mouseover for good measure
    const mouseOverEvent = new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    followingButton.dispatchEvent(mouseOverEvent);

    // Wait for hover state to activate
    await sleepRange(300, 500, getShouldStop);

    // Now look for the Unfollow button (it should appear after hover)
    const unfollowButton = Array.from(
      document.querySelectorAll('button[role="button"]')
    ).find((btn) => {
      const text = btn.textContent?.trim() || "";
      return text === "Unfollow";
    }) as HTMLElement | undefined;

    // If Unfollow button found, click it; otherwise click Following button directly
    if (unfollowButton) {
      // Click the Unfollow button that appeared on hover
      console.log(`👆 Clicking Unfollow button...`);
      unfollowButton.click();
      await sleepRange(500, 1000, getShouldStop);
    } else {
      console.log(
        "👆 Unfollow button not visible, clicking Following button..."
      );
      followingButton.click();
      await sleepRange(500, 1000, getShouldStop);
    }

    // Wait for confirmation dialog to appear and click the confirm button
    const maxWait = 5000; // 5 seconds
    const startTime = Date.now();
    let confirmationButton: HTMLElement | null = null;

    while (Date.now() - startTime < maxWait && !shouldStop) {
      confirmationButton = document.querySelector(
        '[data-testid="confirmationSheetConfirm"]'
      ) as HTMLElement;
      if (confirmationButton) {
        break;
      }
      await sleepRange(200, 300, getShouldStop);
    }

    if (!confirmationButton) {
      console.error("❌ Could not find confirmation dialog");
      return false;
    }

    // Click the confirmation button
    console.log(`✅ Confirming unfollow...`);
    confirmationButton.click();

    await sleepRange(1000, 1500, getShouldStop);

    console.log(`✅ Unfollowed @${username}`);
    return true;
  } catch (error) {
    console.error(`❌ Error while unfollowing @${username}:`, error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log("🚀 Starting Unfollow Inactive Users Script");
  console.log(`📊 Max unfollows per day: ${MAX_UNFOLLOWS_PER_DAY}`);
  console.log(
    `⏰ Unfollow inactive: ${UNFOLLOW_CONFIG.unfollowInactive ? `✅ Enabled (${UNFOLLOW_CONFIG.inactiveMonths} months)` : "❌ Disabled"}`
  );
  console.log(
    `🔐 Unfollow unverified: ${UNFOLLOW_CONFIG.unfollowUnverified ? "✅ Enabled" : "❌ Disabled"}`
  );
  console.log(
    `📈 Unfollow high following ratio: ${UNFOLLOW_CONFIG.unfollowHighFollowingRatio ? `✅ Enabled (${UNFOLLOW_CONFIG.followingToFollowersRatio}x)` : "❌ Disabled"}`
  );
  console.log(
    `🔄 Unfollow repost-only users: ${UNFOLLOW_CONFIG.unfollowRepostOnly ? `✅ Enabled (checking first ${UNFOLLOW_CONFIG.repostCheckCount} posts)` : "❌ Disabled"}`
  );
  console.log(
    `👤 Unfollow suspicious usernames: ${UNFOLLOW_CONFIG.unfollowSuspiciousUsername ? "✅ Enabled" : "❌ Disabled"}`
  );
  console.log(
    `👥 Unfollow not following back: ${UNFOLLOW_CONFIG.unfollowNotFollowingBack ? "✅ Enabled" : "❌ Disabled"}`
  );
  console.log(
    `📜 Start position: ${UNFOLLOW_CONFIG.startFromTop ? "⬇️ Top (scrolling down)" : "⬆️ Bottom (scrolling up)"}`
  );
  console.log(
    `⏭️ Already at end: ${UNFOLLOW_CONFIG.alreadyAtEnd ? "✅ Yes (skipping scroll)" : "❌ No (will scroll)"}`
  );
  console.log(
    `🛡️ Whitelist: ${UNFOLLOW_CONFIG.whitelist.length > 0 ? UNFOLLOW_CONFIG.whitelist.map((u) => `@${u}`).join(", ") : "None"}`
  );

  let totalUsers: number;
  let userCells: Element[];
  const processedUsernames = new Set<string>(); // Track processed users to avoid duplicates

  if (UNFOLLOW_CONFIG.startFromTop) {
    // Start from top: don't scroll to end, just process users naturally as we scroll down
    console.log("⬆️ Starting from top, processing users naturally...");
    window.scrollTo({ top: 0, behavior: "auto" });
    await sleepRange(500, 800, getShouldStop);
    userCells = getAllUserCells();
    // We don't know the total count, so we'll process until we run out of users
    totalUsers = Number.MAX_SAFE_INTEGER; // Process until no more users found
  } else {
    // Start from bottom: scroll to end first to load all users and get count
    if (UNFOLLOW_CONFIG.alreadyAtEnd) {
      console.log("⏭️ Skipping scroll, already at end of list...");
      totalUsers = Number.MAX_SAFE_INTEGER; // Process until no more users found
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      totalUsers = await scrollToEndOfList(() => shouldStop);
      // Scroll to bottom to start processing
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
      await sleepRange(1000, 1500, getShouldStop);
    }
    userCells = getAllUserCells();
  }

  // Process users
  for (let index = 0; index < totalUsers; index++) {
    if (shouldStop) {
      console.log("🛑 Script stopped");
      break;
    }

    if (unfollowedCount >= MAX_UNFOLLOWS_PER_DAY) {
      console.log(
        `✅ Reached daily limit of ${MAX_UNFOLLOWS_PER_DAY} unfollows`
      );
      break;
    }

    // Re-fetch user cells to get current visible users
    userCells = getAllUserCells();
    if (userCells.length === 0) {
      console.log("⚠️ No user cells found, waiting...");
      await sleepRange(2000, 3000, getShouldStop);
      userCells = getAllUserCells();
      if (userCells.length === 0) {
        console.log("❌ Could not find user cells, skipping...");
        continue;
      }
    }

    // Find the user at the target position
    let cell: Element | undefined;
    if (UNFOLLOW_CONFIG.startFromTop) {
      // Process from top: find first unprocessed user
      cell = userCells.find((c) => {
        const info = extractUserInfo(c);
        return info && !processedUsernames.has(info.username);
      });

      if (!cell) {
        // No unprocessed users found, try scrolling down to load more
        const scrollHeightBefore = document.documentElement.scrollHeight;
        window.scrollBy({ top: 500, behavior: "smooth" });
        await sleepRange(1000, 1500, getShouldStop);
        userCells = getAllUserCells();
        cell = userCells.find((c) => {
          const info = extractUserInfo(c);
          return info && !processedUsernames.has(info.username);
        });

        // If still no cell and no new content loaded, we're done
        if (
          !cell &&
          document.documentElement.scrollHeight === scrollHeightBefore
        ) {
          console.log(
            "✅ Reached end of list (no more unprocessed users found)"
          );
          break;
        }

        if (!cell) {
          console.log(`⚠️ Could not find unprocessed cell, skipping...`);
          continue;
        }
      }
      // Scroll the cell into view (this will naturally scroll down if needed)
      cell.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleepRange(500, 800, getShouldStop);
    } else {
      // Process from bottom: find last unprocessed user and scroll up
      cell = [...userCells].reverse().find((c: Element) => {
        const info = extractUserInfo(c);
        return info && !processedUsernames.has(info.username);
      });

      if (!cell) {
        // No unprocessed users found, try scrolling up to load more
        const scrollTopBefore = window.scrollY;
        window.scrollBy({ top: -500, behavior: "smooth" });
        await sleepRange(1000, 1500, getShouldStop);
        userCells = getAllUserCells();
        cell = [...userCells].reverse().find((c: Element) => {
          const info = extractUserInfo(c);
          return info && !processedUsernames.has(info.username);
        });

        // If still no cell and we can't scroll up anymore, we're done
        if (!cell && window.scrollY >= scrollTopBefore) {
          console.log(
            "✅ Reached top of list (no more unprocessed users found)"
          );
          break;
        }

        if (!cell) {
          console.log(`⚠️ Could not find unprocessed cell, skipping...`);
          continue;
        }
      }
      // Scroll the cell into view
      cell.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleepRange(500, 800, getShouldStop);
    }

    if (!cell) {
      console.log(`⚠️ Could not find cell at index ${index}, skipping...`);
      continue;
    }

    const userInfo = extractUserInfo(cell);
    if (!userInfo) {
      console.log(`⚠️ Could not extract user info for index ${index}`);
      continue;
    }

    // Skip if already processed
    if (processedUsernames.has(userInfo.username)) {
      console.log(`⏭️ Skipping already processed user @${userInfo.username}`);
      // If starting from top, scroll past this user
      if (UNFOLLOW_CONFIG.startFromTop) {
        window.scrollBy({ top: 100, behavior: "smooth" });
        await sleepRange(500, 800, getShouldStop);
      }
      continue;
    }

    // Mark as processed
    processedUsernames.add(userInfo.username);

    // Check whitelist
    if (UNFOLLOW_CONFIG.whitelist.includes(userInfo.username)) {
      console.log(`\n🛡️ Skipping whitelisted user @${userInfo.username}`);
      continue;
    }

    console.log(
      `\n👤 Checking @${userInfo.username} (${userInfo.displayName})`
    );

    // Check if user doesn't follow back (from list, no profile needed)
    if (UNFOLLOW_CONFIG.unfollowNotFollowingBack) {
      const followsBack = doesUserFollowBack(cell);
      if (followsBack) {
        console.log(`✅ User follows back`);
      } else {
        console.log(`❌ User doesn't follow back, unfollowing from list...`);
        const success = await unfollowFromList(
          cell,
          userInfo.username,
          getShouldStop
        );
        if (success) {
          unfollowedCount++;
          console.log(
            `📊 Unfollowed ${unfollowedCount}/${MAX_UNFOLLOWS_PER_DAY} today`
          );
          // Wait a bit before continuing
          await sleepRange(1500, 2000, getShouldStop);
          continue; // Skip profile check, already unfollowed
        }
      }
    }

    // Scroll cell into view before clicking (if not already scrolled)
    if (!UNFOLLOW_CONFIG.startFromTop) {
      cell.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleepRange(500, 800, getShouldStop);
    }

    // Click UserCell button to open profile (without navigating)
    clickUserCell(cell);

    // Wait for profile to appear
    const loaded = await waitForProfileLoad(getShouldStop);
    if (!loaded) {
      console.log("⚠️ Profile did not load in time, skipping...");
      await sleepRange(1000, 1500, getShouldStop);
      continue;
    }

    // Check if user should be unfollowed based on all criteria
    const { shouldUnfollow, reason } = await shouldUnfollowUser(
      userInfo.username
    );

    if (shouldUnfollow) {
      console.log(`❌ User should be unfollowed: ${reason}`);
      const success = await unfollowUser(userInfo.username);

      if (success) {
        unfollowedCount++;
        console.log(
          `📊 Unfollowed ${unfollowedCount}/${MAX_UNFOLLOWS_PER_DAY} today`
        );
      }
    } else {
      console.log(`✅ User is active, keeping...`);
    }

    // Go back to Following list by clicking the back button
    await goBackToFollowingList(getShouldStop);

    // Wait for list to reload
    await sleepRange(1500, 2000, getShouldStop);

    // Add a human-like delay between checks
    await sleepRange(2000, 3000, getShouldStop);
  }

  console.log(`\n✅ Script completed!`);
  console.log(
    `📊 Total unfollowed: ${unfollowedCount}/${MAX_UNFOLLOWS_PER_DAY}`
  );
}

/**
 * Start the script
 */
export function start(): void {
  shouldStop = false;
  unfollowedCount = 0;
  main().catch((error) => {
    console.error("❌ Script error:", error);
  });
}

/**
 * Stop the script
 */
export function stop(): void {
  console.log("🛑 Stopping script...");
  shouldStop = true;
}

// Make functions available globally
interface WindowWithUnfollow {
  startUnfollowInactive: () => void;
  stopUnfollowInactive: () => void;
  stop: () => void;
}

(window as unknown as WindowWithUnfollow).startUnfollowInactive = start;
(window as unknown as WindowWithUnfollow).stopUnfollowInactive = stop;
(window as unknown as WindowWithUnfollow).stop = stop;

// Auto-start when loaded
console.log("✅ Unfollow Inactive Users Script loaded");
console.log("🚀 Starting automatically...");
console.log("📝 Run stop() or stopUnfollowInactive() to halt");
start();
