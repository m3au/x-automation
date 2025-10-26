const users = [
  // "etriclearns",
  // "_kiyosh1",
  // "m3aus",
  // "ThuleanFuturist",
  // "ViraXVespa",
  // "prthgo",
  // "RuiCarrilho5",
  // "K19Unknown",
  // "IterIntellectus",
  // "opaeoh",
  // "voiisato",
  // "k_flowstate",
  // "Observer_ofyou",
  // "SavvaSmith",
  // "RyanEls4",
  // "ChasingMyTail_",
  // "AndreasRothe9",
  // "SageofSapien",
  // "melqtx",
  // "ludwigABAP",
  // "bozohar",
  // "tunahorse21",
  // "uncertainsys",
  // "rifatNFTs",
  // "operater404",
  // "psyKhimera",
  // "NyanpasuKA",
  // "0xIlyy",
  // "jaivinwylde",
  // "kimmonismus",
  // "KN_592",
  // "MagicHustler_",
  // "jesx64",
  // "AllaAisling",
  // "renzocarbonara",
  // Basedest
  // "hardanimeshits",
  // "daanjiji",
  // "SuperKash999",
  // "jjohnpotter",
  // "lapwing37082",
  // "_hakagie",
  // "rmotafreitas",
  // "brave",
  // "IXeets",
  // "m3aus",
  // "tsotchke",
  // "tsotchkecoin",
  // "askmetmrw",
  // "ViraXVespa",
  // "operater404",
  // "granttXIV",
  // "SolArdenti",
  // "cognitivetech_",
];

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
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const posts = document.querySelectorAll('article[role="article"]');
    if (posts.length > 0) return true;

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
  if (processedCount >= limit) return false;

  const postId = article.getAttribute("aria-labelledby");
  if (processedPosts.has(postId)) return true;
  processedPosts.add(postId);

  try {
    const likeButtons = await findLikeButton();
    if (likeButtons.length === 0) {
      console.log("Like button not found, skipping post");
      return true;
    }

    // Find the specific like button for this article
    const likeButton = Array.from(likeButtons).find((button) =>
      article.contains(button)
    );

    if (!likeButton) {
      console.log("Like button not found in this article, skipping");
      return true;
    }

    // Check if already liked
    const isLiked = likeButton.getAttribute("data-state") === "true";
    if (isLiked) {
      console.log("Post already liked, skipping");
      return true;
    }

    article.scrollIntoView({ behavior: "smooth", block: "center" });
    await delay(1000);

    console.log(`Liking post ${processedCount + 1} of ${limit}...`);
    likeButton.click();
    processedCount++;

    await randomDelay();
  } catch (error) {
    console.error("Error processing post:", error);
    return false;
  }

  return true;
}

async function scrollAndProcess(processedPosts, processedCount, limit) {
  const posts = document.querySelectorAll('article[role="article"]');
  let foundUnlikedPost = false;

  for (const post of posts) {
    const result = await processPost(
      post,
      processedPosts,
      processedCount,
      limit
    );
    if (!result) return;
    if (!processedPosts.has(post.getAttribute("aria-labelledby"))) {
      foundUnlikedPost = true;
    }
  }

  if (processedCount < limit && !foundUnlikedPost) {
    window.scrollTo(0, document.body.scrollHeight);
    await delay(2000); // Increased delay for scroll

    const shouldContinue = document.body.scrollHeight > window.scrollY;
    if (shouldContinue) {
      await scrollAndProcess(processedPosts, processedCount, limit);
    }
  }
}

async function navigateToPath(path) {
  console.log(`Navigating to: ${path}`);
  history.pushState({}, "", path);

  const navigationEvent = new PopStateEvent("popstate");
  window.dispatchEvent(navigationEvent);

  await delay(3000); // Increased navigation delay
}

async function processUserSection(username, section, limit) {
  // const path =
  //   section === "profile" ? `/${username}` : `/${username}/with_replies`;
  // console.log(`Processing ${username}'s ${section}`);

  // await navigateToPath(path);

  const postsLoaded = await waitForPosts();
  if (!postsLoaded) {
    console.error(`Failed to load posts for ${username} ${section}`);
    return;
  }

  const processedPosts = new Set();
  let processedCount = 0;

  try {
    await scrollAndProcess(processedPosts, processedCount, limit);
    console.log(
      `Finished! Liked ${processedCount} posts for ${username} ${section}`
    );
  } catch (error) {
    console.error(`Error processing ${username} ${section}:`, error);
  }
}

async function likePosts(limit = 50) {
  // if (!users.length) {
  //   console.error("No users found");
  //   return;
  // }

  // for (const [index, username] of users.entries()) {
  // Process main profile first
  await processUserSection(username, "profile", limit);
  // Then process replies
  // await processUserSection(username, "replies", limit);

  // Add break between users, except for the last user
  // if (index < users.length - 1) {
  // console.log(`Taking a break before processing next user...`);
  // await delay(30000 + Math.random() * 10000); // 30 seconds + random 0-10 seconds
  // }
}

// console.log("Finished processing all users and their replies!");
// }

// Start the process
likePosts(50);
