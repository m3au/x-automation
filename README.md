# X.com User Interaction Scripts

This folder contains scripts to automate interactions with X.com user profiles.

## Option 1: Fully Automated Bash Script (Recommended)

The `auto_visit_users.sh` script uses Chrome's remote debugging protocol to automatically:

1. Open user profiles in a browser
2. Inject and run the liking JavaScript for each user
3. Process all users in sequence without any manual copying/pasting

### Usage

1. Make the script executable:

   ```bash
   chmod +x auto_visit_users.sh
   ```

2. Run the script:

   ```bash
   ./auto_visit_users.sh
   ```

3. The script will:
   - Start Chrome with remote debugging enabled
   - Visit each user profile
   - Automatically inject and run the liking script
   - Wait for completion before moving to the next user
   - Close Chrome when finished

### Requirements

- Google Chrome installed at the default location
- curl (already installed on macOS)

## Option 2: Fully Automated Node.js Script

The `auto_like_users.js` script uses Puppeteer to automate the entire process.

### Installation

1. Install Node.js dependencies:

   ```bash
   npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
   ```

2. Run the script:

   ```bash
   node auto_like_users.js
   ```

3. When the browser opens:
   - Log in to X.com manually
   - The script will wait for your login, then automatically process each user

### Configuration

You can modify these settings in the `config` object at the top of `auto_like_users.js`:

- `headless`: Set to `true` for background operation
- `postsPerUser`: Number of posts to like per user
- `minDelayBetweenLikes`/`maxDelayBetweenLikes`: Random delay range between likes (ms)
- `minDelayBetweenUsers`/`maxDelayBetweenUsers`: Random delay range between users (ms)

## Option 3: Semi-Automated Bash Script

The `visit_users.sh` script opens each user's profile in a browser and generates a per-user JavaScript file for you to paste into the console.

### Usage

1. Make the script executable:

   ```bash
   chmod +x visit_users.sh
   ```

2. Run the script:

   ```bash
   ./visit_users.sh
   ```

3. For each user:
   - The script will open a browser window to the user's profile
   - Copy the generated script from the console output and paste it into the browser's developer console
   - Press Enter in the terminal to continue to the next user after liking is complete

## Notes

- All scripts include random delays between actions to avoid detection
- The automated scripts require manual login for security reasons
- Adjust delay times as needed to make behavior appear more natural
- Use responsibly and be aware of X.com's usage policies
