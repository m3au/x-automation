# X.com Automation Utilities

TypeScript utilities for X.com (Twitter) browser console automation.

## ⚠️ Disclaimer

These scripts are for personal use only. Use at your own risk and be aware of X.com's Terms of Service. Automated actions may result in account restrictions.

## 📦 Scripts

### Like Script (`like.ts`)

Advanced like automation with human-like behavior patterns:

- **Natural delays** based on content type (text, images, videos)
- **Human reading patterns** simulation
- **Scroll behavior** with easing and occasional overshoots
- **Automation detection** warnings
- **Tab visibility detection** (pauses when inactive)
- **Anti-detection features**

**Usage in Browser Console:**

1. Build the TypeScript:

   ```bash
   npm run build
   ```

2. Copy the contents of `dist/like.js` and paste into X.com browser console

3. Run with:

   ```javascript
   likeCurrentUserPosts(200); // Like up to 200 posts
   ```

**Available Commands:**

- `likeCurrentUserPosts(limit)` - Start liking posts (default: 200)
- `stop()` - Stop the script immediately
- `resetState()` - Reset script state

### Unmute Script (`unmute.ts`)

Simple utility to unmute all muted accounts at once.

**Usage in Browser Console:**

1. Build the TypeScript:

   ```bash
   npm run build
   ```

2. Navigate to your muted accounts page on X.com

3. Copy the contents of `dist/unmute.js` and paste into browser console

4. The script will automatically unmute all visible accounts

## 🛠️ Development

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
npm run format:check
```

### Clean Build

```bash
npm run clean
npm run rebuild
```

## 📁 Project Structure

```text
x-automation/
├── src/
│   ├── like.ts      # Like automation script
│   └── unmute.ts    # Unmute utility script
├── dist/            # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── .eslintrc.json
└── README.md
```

## 🔧 Configuration

### TypeScript

The project uses strict TypeScript with full type safety. Configuration in `tsconfig.json`.

### ESLint

ESLint is configured with:

- `eslint:recommended`
- `@typescript-eslint/recommended`
- `plugin:unicorn/recommended`

### Features

- **Human-like delays**: Variable delays based on content complexity
- **Reading time simulation**: Calculates realistic reading times
- **Media consumption time**: Adds extra time for images/videos
- **Behavioral patterns**: Simulates different user behaviors (quick skim, interested reading, distracted, engaged)
- **Scroll behavior**: Natural scrolling with easing, wobble, and occasional overshoots
- **Automation detection**: Monitors for X.com warning messages
- **Visibility handling**: Pauses when browser tab is inactive
- **Error handling**: Graceful error recovery

## 🚨 Safety Features

1. **Detection Monitoring**: Automatically stops if automation warnings detected
2. **Rate Limiting**: Built-in delays to avoid triggering rate limits
3. **Graceful Degradation**: Handles missing elements and errors
4. **Manual Control**: Stop functionality to halt execution anytime
5. **Tab Visibility**: Pauses when tab is not active

## 📝 Notes

- Scripts are designed for browser console execution only
- Requires manual login for security
- All timing delays are randomized for natural behavior
- Use responsibly and in accordance with X.com's policies

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

m3au - GitHub: [@m3au](https://github.com/m3au)
