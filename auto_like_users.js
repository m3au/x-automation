// Automated script to visit X.com user profiles and like posts
// Requirements: npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Configuration
const config = {
  headless: false, // Set to true for headless mode
  users: [
    // "daanjiji",
    "SuperKash999",
    "jjohnpotter",
    "lapwing37082",
    "_hakagie",
    "rmotafreitas",
    "brave",
    "IXeets",
    "m3aus",
    "tsotchke",
    "tsotchkecoin",
    "askmetmrw",
    "ViraXVespa",
    "operater404",
    "granttXIV",
    "SolArdenti",
    "cognitivetech_",
  ],
  postsPerUser: 5, // Number of posts to like per user
  minDelayBetweenLikes: 5000, // Minimum delay between likes (ms)
  maxDelayBetweenLikes: 15000, // Maximum delay between likes (ms)
  minDelayBetweenUsers: 60000, // Minimum delay between users (ms)
  maxDelayBetweenUsers: 120000, // Maximum delay between users (ms)
};

// Helper function for delays
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function for random delays
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Main function
async function likeUserPosts() {
  console.log("Starting X.com automated liking...");

  const browser = await puppeteer.launch({
    headless: config.headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // Set user agent to avoid detection
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  try {
    // Sign in to X.com first
    console.log("Please sign in to X.com when the browser opens");
    await page.goto("https://x.com/login");

    // Wait for manual login
    console.log("Waiting for you to login...");
    await page.waitForNavigation({ timeout: 120000 }); // 2 minute timeout for login

    // Process each user
    for (const username of config.users) {
      console.log(`\nProcessing user: ${username}`);

      try {
        // Navigate to user profile
        await page.goto(`https://x.com/${username}`, {
          waitUntil: "networkidle2",
        });
        console.log(`Navigated to ${username}'s profile`);

        // Wait for tweets to load
        await delay(3000);

        let likeCount = 0;
        let scrollCount = 0;
        const maxScrolls = 5;

        while (likeCount < config.postsPerUser && scrollCount < maxScrolls) {
          // Find all tweet articles
          const tweets = await page.$$('article[role="article"]');
          console.log(`Found ${tweets.length} tweets`);

          // Process tweets
          for (const tweet of tweets) {
            if (likeCount >= config.postsPerUser) break;

            try {
              // Check if tweet is already liked
              const isLiked = await tweet.$(
                '[data-testid="like"][data-state="true"]'
              );

              if (!isLiked) {
                // Scroll tweet into view
                await tweet.evaluate((t) =>
                  t.scrollIntoView({ behavior: "smooth", block: "center" })
                );
                await delay(500);

                // Find and click the like button
                const likeButton = await tweet.$('[data-testid="like"]');
                if (likeButton) {
                  await likeButton.click();
                  likeCount++;
                  console.log(
                    `Liked post ${likeCount}/${config.postsPerUser} for ${username}`
                  );

                  // Random delay between likes
                  const likeDelay = randomDelay(
                    config.minDelayBetweenLikes,
                    config.maxDelayBetweenLikes
                  );
                  console.log(
                    `Waiting ${likeDelay / 1000} seconds before next action...`
                  );
                  await delay(likeDelay);
                }
              }
            } catch (tweetError) {
              console.log("Error processing tweet:", tweetError.message);
              continue;
            }
          }

          // If we haven't liked enough posts yet, scroll down for more
          if (likeCount < config.postsPerUser) {
            console.log("Scrolling for more tweets...");
            await page.evaluate(() => window.scrollBy(0, 800));
            await delay(2000);
            scrollCount++;
          }
        }

        console.log(
          `Finished processing ${username}. Liked ${likeCount} posts.`
        );

        // Random delay between users
        if (username !== config.users[config.users.length - 1]) {
          const userDelay = randomDelay(
            config.minDelayBetweenUsers,
            config.maxDelayBetweenUsers
          );
          console.log(
            `Waiting ${userDelay / 1000} seconds before next user...`
          );
          await delay(userDelay);
        }
      } catch (userError) {
        console.error(`Error processing user ${username}:`, userError.message);
        continue; // Continue with the next user
      }
    }
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    // Close the browser after processing all users
    await browser.close();
    console.log("Process completed!");
  }
}

// Run the script
likeUserPosts().catch(console.error);
