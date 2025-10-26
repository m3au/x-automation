// Simple like script for the currently opened X.com profile
// No navigation logic - just likes posts on the current page

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findLikeButton() {
  // More robust like button detection
  const possibleSelectors = [
    '[data-testid="like"]',
    '[data-testid="unlike"]',
    'div[role="button"][data-testid="like"]',
    'div[role="button"][data-testid="unlike"]',
    // Add timeline item selector to ensure we're finding all posts
    'div[data-testid="cellInnerDiv"]',
  ];

  // Try each selector
  for (const selector of possibleSelectors) {
    const buttons = document.querySelectorAll(selector);
    if (buttons.length > 0) return Array.from(buttons);
  }
  return [];
}

async function waitForPosts() {
  let attempts = 0;
  const maxAttempts = 20; // Increased from 10 to 20 attempts

  while (attempts < maxAttempts) {
    const posts = document.querySelectorAll('article[role="article"]');
    if (posts.length > 0) {
      console.log(`Found ${posts.length} posts initially`);
      return true;
    }

    console.log("Waiting for posts to load...");
    await delay(1000);
    attempts++;
  }
  return false;
}

async function randomDelay() {
  // Get the tweet text content
  const tweetText =
    document.querySelector('[data-testid="tweetText"]')?.textContent || "";
  const textLength = tweetText.length;

  // Base delay calculation
  const baseDelayPerChar = 30; // 30ms per character
  const minDelay = 2000; // minimum 2 seconds
  const baseDelay = Math.max(minDelay, textLength * baseDelayPerChar);

  // Add initial randomness (±20%)
  const randomFactor = 0.8 + Math.random() * 0.4;
  let finalDelay = Math.floor(baseDelay * randomFactor);

  // Random events with delays
  const roll = Math.random();

  if (roll < 0.15) {
    // 15% chance: Add reading pause (2-4 seconds extra)
    const readingTime = Math.floor(Math.random() * 2000) + 2000;
    finalDelay += readingTime;
    console.log("Adding reading pause");
  } else if (roll < 0.2) {
    // 5% chance: Quicker interaction
    finalDelay = Math.max(minDelay, Math.floor(finalDelay * 0.7));
    console.log("Quick interaction");
  }

  // Small random adjustment (±1.5 seconds)
  const fineAdjustment = Math.random() * 3000 - 1500;
  finalDelay = Math.max(minDelay, Math.floor(finalDelay + fineAdjustment));

  console.log(`Waiting for ${Math.round(finalDelay / 1000)} seconds...`);
  return delay(finalDelay);
}

async function processPost(article, processedPosts, processedCount, limit) {
  if (processedCount >= limit)
    return {
      continue: false,
      count: processedCount,
    };

  // Try both aria-labelledby and data-testid for post identification
  const postId =
    article.getAttribute("aria-labelledby") ||
    article.getAttribute("data-testid");
  if (!postId) {
    console.log("Could not find post ID, trying next post");
    return {
      continue: true,
      count: processedCount,
    };
  }

  if (processedPosts.has(postId)) {
    console.log("Post already processed, skipping");
    return {
      continue: true,
      count: processedCount,
    };
  }

  processedPosts.add(postId);

  try {
    const likeButtons = await findLikeButton();
    if (likeButtons.length === 0) {
      console.log("Like button not found, skipping post");
      return { continue: true, count: processedCount };
    }

    // Find the specific like button for this article
    const likeButton = Array.from(likeButtons).find((button) =>
      article.contains(button)
    );

    if (!likeButton) {
      console.log("Like button not found in this article, skipping");
      return { continue: true, count: processedCount };
    }

    // Check if already liked
    const isLiked =
      likeButton.getAttribute("data-testid") === "unlike" ||
      likeButton.getAttribute("data-state") === "true" ||
      likeButton.ariaPressed === "true";

    if (isLiked) {
      console.log("Post already liked, skipping");
      return { continue: true, count: processedCount };
    }

    article.scrollIntoView({ behavior: "smooth", block: "center" });
    await delay(1000);

    console.log(`Liking post ${processedCount + 1} of ${limit}...`);
    likeButton.click();
    processedCount++;

    await randomDelay();
  } catch (error) {
    console.error("Error processing post:", error);
    console.error(error.stack);
    return { continue: false, count: processedCount };
  }

  return { continue: true, count: processedCount };
}

async function scrollAndProcess(processedPosts, processedCount, limit) {
  // Get both article elements and timeline items to ensure we catch all posts
  const posts = Array.from(
    document.querySelectorAll('article[role="article"]')
  );
  const timelineItems = Array.from(
    document.querySelectorAll('div[data-testid="cellInnerDiv"]')
  );

  // Combine and deduplicate posts
  const allPosts = [...new Set([...posts, ...timelineItems])];
  let foundUnprocessedPost = false;

  console.log(
    `Found ${posts.length} article posts and ${timelineItems.length} timeline items`
  );
  console.log(
    `Processing ${allPosts.length} total posts (${processedCount}/${limit} processed so far)`
  );

  for (const post of allPosts) {
    // Skip if this isn't actually a post (some timeline items might be other content)
    if (!post.querySelector('[data-testid="like"], [data-testid="unlike"]')) {
      continue;
    }

    const result = await processPost(
      post,
      processedPosts,
      processedCount,
      limit
    );

    processedCount = result.count;

    if (!result.continue) return processedCount;

    if (!processedPosts.has(post.getAttribute("aria-labelledby"))) {
      foundUnprocessedPost = true;
    }
  }

  if (processedCount < limit) {
    console.log("Scrolling to load more posts...");
    const previousHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    await delay(4000); // Wait for new posts to load

    // Check if the scroll actually loaded new content
    const newHeight = document.body.scrollHeight;
    const heightChanged = newHeight > previousHeight;

    // Get new post counts
    const newPosts = document.querySelectorAll('article[role="article"]');
    const newTimelineItems = document.querySelectorAll(
      'div[data-testid="cellInnerDiv"]'
    );
    const hasNewPosts =
      newPosts.length > posts.length ||
      newTimelineItems.length > timelineItems.length;

    console.log(
      `After scrolling: ${newPosts.length} posts, ${newTimelineItems.length} timeline items`
    );
    console.log(
      `Scroll height changed: ${heightChanged} (${previousHeight} -> ${newHeight})`
    );

    // Continue if we either found new posts or the page height changed
    if (hasNewPosts || heightChanged) {
      console.log("New content detected, continuing...");
      return await scrollAndProcess(processedPosts, processedCount, limit);
    } else {
      console.log("No new content detected after scrolling");
      // Try one more scroll before giving up
      if (processedCount < limit) {
        console.log("Attempting one final scroll...");
        window.scrollTo(0, 0); // Scroll to top
        await delay(1000);
        window.scrollTo(0, document.body.scrollHeight); // Scroll to bottom
        await delay(4000);
        return await scrollAndProcess(processedPosts, processedCount, limit);
      }
    }
  }

  return processedCount;
}

async function likeCurrentUserPosts(limit = 10) {
  console.log(`Starting to like posts on current page, limit: ${limit}`);

  const postsLoaded = await waitForPosts();
  if (!postsLoaded) {
    console.error("Failed to load posts");
    return;
  }

  const processedPosts = new Set();
  let processedCount = 0;

  try {
    processedCount = await scrollAndProcess(
      processedPosts,
      processedCount,
      limit
    );
    console.log(
      `Finished! Liked ${processedCount}/${limit} posts on current page`
    );
    if (processedCount < limit) {
      console.log(
        "Note: Stopped before reaching limit - no more posts found to process"
      );
    }
  } catch (error) {
    console.error("Error processing posts:", error);
    console.error(error.stack); // Add stack trace for better debugging
  }
}

// Get username from URL
function getCurrentUsername() {
  const path = window.location.pathname;
  const username = path.split("/")[1];
  return username || "unknown";
}

// Start the process - adjust the limit as needed
console.log(`Running like script for: ${getCurrentUsername()}`);
likeCurrentUserPosts(50);
