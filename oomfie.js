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
  "CharDeeDooDee",
  // "granttXIV",
  // "SolArdenti",
  // "cognitivetech_",
];

async function likePosts(limit = 10) {
  if (!users.length) {
    console.error("No users found");
    return;
  }

  const processedPosts = new Set();
  let processedCount = 0;

  async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function randomDelay() {
    // Get the tweet text content
    const tweetText =
      document.querySelector('[data-testid="tweetText"]')?.textContent || "";
    const textLength = tweetText.length;

    // Base delay calculation
    const baseDelayPerChar = 2000; // 2 seconds per character
    const minDelay = 3000; // minimum 30 seconds
    const baseDelay = Math.max(minDelay, textLength * baseDelayPerChar);

    // Add initial randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    let finalDelay = Math.floor(baseDelay * randomFactor);

    // Random events to simulate human behavior
    const roll = Math.random();

    if (roll < 0.15) {
      // 15% chance: Add "reading time" pause (30-75 seconds extra)
      const readingTime = Math.floor(Math.random() * 4500) + 3000;
      finalDelay += readingTime;
      console.log('Taking extra time to "read" content');
    } else if (roll < 0.2) {
      // 5% chance: Slightly faster interaction (but never below minimum)
      finalDelay = Math.max(minDelay, Math.floor(finalDelay * 0.7));
      console.log("Quick interaction");
    }

    // Add a small random offset (±5 seconds) for more natural timing
    const fineAdjustment = Math.random() * 10000 - 2000;
    finalDelay = Math.max(minDelay, Math.floor(finalDelay + fineAdjustment));

    console.log(`Waiting for ${Math.round(finalDelay / 1000)} seconds...`);
    return delay(finalDelay);
  }

  async function waitForPosts() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const posts = document.querySelectorAll('article[role="article"]');
      if (posts.length > 0) return true;

      console.log("Waiting for posts to load...");
      await delay(2000);
      attempts++;
    }
    return false;
  }

  async function processPost(article) {
    if (processedCount >= limit) return false;

    const postId = article.getAttribute("aria-labelledby");
    if (processedPosts.has(postId)) return true;
    processedPosts.add(postId);

    try {
      // Find the like button and its state
      const likeButton = article.querySelector('[data-testid="like"]');
      if (!likeButton) {
        console.log("Like button not found, skipping post");
        return true;
      }

      // Check if the post is already liked
      const isLiked =
        article.querySelector('[data-testid="like"][data-state="true"]') !==
        null;
      if (isLiked) {
        console.log("Post already liked, skipping");
        return true;
      }

      article.scrollIntoView({ behavior: "smooth", block: "center" });
      await delay(500);

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

  async function scrollAndProcess() {
    const posts = document.querySelectorAll('article[role="article"]');
    let foundUnlikedPost = false;

    for (const post of posts) {
      const isLiked =
        post.querySelector('[data-testid="like"][data-state="true"]') !== null;
      if (!isLiked) {
        foundUnlikedPost = true;
        const shouldContinue = await processPost(post);
        if (!shouldContinue) return;
      }
    }

    if (processedCount < limit && !foundUnlikedPost) {
      window.scrollTo(0, document.body.scrollHeight);
      await delay(100);

      const shouldContinue = document.body.scrollHeight > window.scrollY;
      if (shouldContinue) {
        await scrollAndProcess();
      }
    }
  }

  async function navigateToPath(path) {
    console.log(`Navigating to: ${path}`);
    history.pushState({}, "", path);

    const navigationEvent = new PopStateEvent("popstate");
    window.dispatchEvent(navigationEvent);

    await delay(2000);
  }

  async function processUserSection(username, section) {
    const path =
      section === "profile" ? `/${username}` : `/${username}/with_replies`;
    console.log(`Processing ${username}'s ${section}`);

    await navigateToPath(path);

    const postsLoaded = await waitForPosts();
    if (!postsLoaded) {
      console.error(`Failed to load posts for ${username} ${section}`);
      return;
    }

    processedCount = 0;
    processedPosts.clear();

    try {
      await scrollAndProcess();
      console.log(
        `Finished! Liked ${processedCount} posts for ${username} ${section}`
      );
    } catch (error) {
      console.error(`Error processing ${username} ${section}:`, error);
    }
  }

  // Process each user's profile and replies with 2-minute break
  for (const [index, username] of users.entries()) {
    // Process main profile first1
    await processUserSection(username, "profile");
    // Then process replies
    await processUserSection(username, "replies");

    // Add 2-minute break between users, except for the last user
    if (index < users.length - 1) {
      console.log(`Taking a 2-minute break before processing next user...`);
      await delay(120000 + Math.random() * 10000); // 2 minutes + random 0-10 seconds
    }
  }

  console.log("Finished processing all users and their replies!");
}

likePosts(50);
