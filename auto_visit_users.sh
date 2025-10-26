#!/bin/bash

# Fully automated user processing script
# Uses Chrome's remote debugging to inject code automatically

# Create script directory if it doesn't exist
SCRIPT_DIR="$(pwd)/user_scripts"
mkdir -p "$SCRIPT_DIR"

# Chrome remote debugging port
CHROME_DEBUG_PORT=9222

# List of users to process
USERS=(
    "daanjiji"
    "SuperKash999"
    "the07Sk8boarder"
    "MichelleZi85043"
    "Whydoistrum"
    "DavePena11"
    "ItsEthanComedy"
    "swizzmontana"
)

# Function to create the liking script for a specific user
create_user_script() {
    local user="$1"
    local script_file="${SCRIPT_DIR}/${user}_like_script.js"

    cat >"$script_file" <<EOL
// Auto-like script for user: ${user}
// Modified from oomfie.js to focus on a single user
async function likePostsFor${user}(limit = 10) {
  console.log("Starting to like posts for ${user}...");

  const LIKE_SELECTOR = '[data-testid="like"]';
  const LIKED_SELECTOR = '[data-testid="unlike"]';

  let count = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 20;

  while (count < limit && scrollAttempts < maxScrollAttempts) {
    // Find all like buttons
    const likeButtons = Array.from(document.querySelectorAll(LIKE_SELECTOR));
    const notLikedButtons = likeButtons.filter(button => {
      // Check if the post is already liked
      return !button.closest('article').querySelector(LIKED_SELECTOR);
    });

    if (notLikedButtons.length > 0) {
      // Like a post
      const button = notLikedButtons[0];

      try {
        // Scroll to button to ensure it's in view
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Wait a random amount of time before clicking (0.5-2s)
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 1500) + 500));

        // Click the like button
        button.click();
        count++;
        console.log(\`Liked post \${count}/\${limit}\`);

        // Wait a random amount of time between likes (1-3s)
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 2000) + 1000));
      } catch (e) {
        console.error("Error liking post:", e);
      }
    } else {
      // Scroll down to find more posts
      window.scrollBy(0, 800);
      await new Promise(r => setTimeout(r, 1000));
      scrollAttempts++;
    }
  }

  console.log(\`Finished liking \${count} posts for ${user}\`);
  return count;
}

// Execute the function
likePostsFor${user}(10);
EOL

    echo "Created script for ${user} at ${script_file}"
    return 0
}

# Start Chrome with remote debugging enabled
start_chrome_with_debugging() {
    local url="$1"
    local chrome_app="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    if [[ -f "$chrome_app" ]]; then
        echo "Starting Chrome with remote debugging on port $CHROME_DEBUG_PORT"
        "$chrome_app" --remote-debugging-port=$CHROME_DEBUG_PORT "$url" &
        sleep 3 # Wait for Chrome to start
        return 0
    else
        echo "Chrome not found at $chrome_app"
        return 1
    fi
}

# Execute JavaScript in the active tab
execute_js_in_chrome() {
    local js_file="$1"
    local js_content=$(cat "$js_file")

    # Escape the JavaScript content for JSON
    js_content=$(echo "$js_content" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed 's/\n/\\n/g')

    # Get the current tab ID
    local tab_info=$(curl -s "http://localhost:$CHROME_DEBUG_PORT/json/list")
    local tab_id=$(echo "$tab_info" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -z "$tab_id" ]]; then
        echo "Failed to get tab ID"
        return 1
    fi

    # Execute the JavaScript in the tab
    local result=$(curl -s -X POST "http://localhost:$CHROME_DEBUG_PORT/json/new" \
        -H "Content-Type: application/json" \
        -d "{\"method\":\"Runtime.evaluate\",\"params\":{\"expression\":\"$js_content\"},\"id\":1}")

    echo "JavaScript executed in tab"
    return 0
}

# Process each user
process_users() {
    echo "Starting to process users"

    for user in "${USERS[@]}"; do
        echo "Processing user: $user"

        # Create the user script
        create_user_script "$user"

        # Open the user's profile in Chrome
        local user_url="https://x.com/$user"

        if [[ "$CHROME_PID" ]]; then
            # If Chrome is already running, navigate to new URL
            curl -s -X POST "http://localhost:$CHROME_DEBUG_PORT/json/new" \
                -H "Content-Type: application/json" \
                -d "{\"method\":\"Page.navigate\",\"params\":{\"url\":\"$user_url\"},\"id\":1}"
            sleep 3 # Wait for navigation
        else
            # Start Chrome for the first user
            start_chrome_with_debugging "$user_url"
            CHROME_PID=$!
        fi

        # Wait for page to load
        echo "Waiting for page to load..."
        sleep 5

        # Execute the script for this user
        local script_file="${SCRIPT_DIR}/${user}_like_script.js"
        execute_js_in_chrome "$script_file"

        # Wait for script completion (adjust time based on expected runtime)
        echo "Script running for $user... waiting 30 seconds"
        sleep 30

        # Random delay between users (10-20 seconds)
        local delay=$((RANDOM % 10 + 10))
        echo "Taking a ${delay}-second break before the next user..."
        sleep $delay
    done

    echo "Finished processing all users"
}

# Main execution
echo "=== X.com Automated User Processing ==="
echo "This script will automatically:"
echo "1. Open each user's profile in Chrome"
echo "2. Automatically inject and run the liking script"
echo "3. Process all users in sequence"
echo
echo "Users to process: ${#USERS[@]}"
echo "Press Enter to start, or Ctrl+C to cancel..."
read

# Start processing
process_users

# Clean up Chrome when done
if [[ "$CHROME_PID" ]]; then
    echo "Closing Chrome..."
    kill $CHROME_PID
fi

echo "All done!"
