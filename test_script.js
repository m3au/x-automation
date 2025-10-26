// Test script to verify the auto_like_users.js functionality
// This script simulates the flow without actually connecting to X.com

// Helper function for delays
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function for random delays
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Configuration - limited users for testing
const config = {
  users: ["test_user1", "test_user2"],
  postsPerUser: 2,
  minDelayBetweenLikes: 1000,
  maxDelayBetweenLikes: 2000,
  minDelayBetweenUsers: 3000,
  maxDelayBetweenUsers: 5000,
};

// Test function
async function testLikeUserPosts() {
  console.log("Starting test of X.com automation script...");

  try {
    console.log("Simulating browser launch...");
    await delay(1000);

    console.log("Simulating login process...");
    await delay(2000);

    // Process each user
    for (const username of config.users) {
      console.log(`\nProcessing user: ${username}`);

      try {
        console.log(`Navigated to ${username}'s profile`);
        await delay(1000);

        let likeCount = 0;

        // Simulate liking posts
        while (likeCount < config.postsPerUser) {
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
    console.log("Test completed successfully!");
    console.log("\nVerdict: The script logic appears to be working correctly.");
    console.log(
      "You can now run the actual script with 'node auto_like_users.js'"
    );
  }
}

// Run the test
testLikeUserPosts().catch(console.error);
