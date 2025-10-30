/**
 * Configuration for X.com automation
 */

import { gaPatterns } from "./ga-patterns";
import { gePatterns } from "./ge-patterns";
import { gmPatterns } from "./gm-patterns";
import { gnPatterns } from "./gn-patterns";
import { hbdPatterns } from "./hbd-patterns";

export const CONFIG = {
  // Automation settings
  defaultPostLimit: 1000, // Number of posts to like per run
  skipOwnPosts: true, // Skip your own posts
  ownUsername: "m3aus", // Your username handle (with or without @)

  // Reading delays (varied speeds to look human)
  readingSpeed: { min: 250, max: 500 }, // Wide range WPM
  delayPerChar: { min: 15, max: 35 }, // More variation
  baseDelay: { min: 1500, max: 2500 }, // 1.5-5s much wider range

  // Media consumption (more realistic viewing times)
  imageTime: { min: 500, max: 3000 }, // 2-8s look at images
  videoTime: { min: 3000, max: 12000 }, // 3-12s watch videos (fallback)
  videoWatchPercentage: { min: 0.3, max: 1 }, // Watch 30-100% of video

  // GM post detection patterns (imported from gm-patterns.ts)
  gmPatterns: gmPatterns as readonly string[],

  // GN post detection patterns (imported from gn-patterns.ts)
  gnPatterns: gnPatterns as readonly string[],

  // GA post detection patterns (imported from ga-patterns.ts)
  gaPatterns: gaPatterns as readonly string[],

  // GE post detection patterns (imported from ge-patterns.ts)
  gePatterns: gePatterns as readonly string[],

  // HBD post detection patterns (imported from hbd-patterns.ts)
  hbdPatterns: hbdPatterns as readonly string[],

  // Micro variations (bigger randomness)
  microAdjustment: 4000, // ±2s random variation

  // Click timing (add hesitation)
  beforeClick: { min: 500, max: 2000 }, // 0.5-2s think before click
  afterClick: { min: 800, max: 2500 }, // 0.8-2.5s after click

  // Scroll timing (slower, more natural)
  scrollDelay: { min: 1000, max: 2500 }, // 1-2.5s pause after scroll
  scrollSearch: { min: 1500, max: 3000 }, // 1.5-3s search pauses

  // Visibility checks
  visibilityWait: 3000, // 3s resume after tab switch
  maxVisibilityWait: 900000, // 15min max
  visibilityCheckInterval: 2000, // Check every 2s

  // Other (slower, safer)
  initialDelay: 2000, // 2s start delay
  noButtonsMaxAttempts: 12, // More retries
  maxInitialScrollAttempts: 15, // More initial scrolls

  // Reply generation probabilities
  replyChances: {
    foreignGreeting: 0.05, // 5% chance for foreign greeting
    standaloneGreeting: 0.25, // 25% chance for greeting without name (75% will include name)
    emojiInGreeting: 0.35, // 35% chance to add emoji to standalone greeting (increased from 25%)
    includePhrase: 0.1, // 10% chance to include phrase in full reply (vs just greeting + name)
    weekdayPhrase: 0.2, // 20% chance to use weekday-specific phrase
    emojiAtEnd: 0.45, // 45% chance to add emoji at end of full reply (increased from 30%)
  },

  // Shared reply components (used for GM/GN/GA/HBD)
  baseNameWeighted: [
    { text: "authorName", weight: 80 }, // Use actual author name (increased from 60)
    { text: "friend", weight: 8 },
    { text: "fam", weight: 4 },
    { text: "fren", weight: 3 },
    { text: "anon", weight: 2 },
    { text: "mf", weight: 2 },
    { text: "reatrd", weight: 1 },
  ],

  nameSuffixesWeighted: [
    { text: "", weight: 75 }, // No suffix (most common)
    { text: " legend", weight: 8 },
    { text: "-chan", weight: 4 },
    { text: "-san", weight: 4 },
    { text: "-sama", weight: 2 },
    { text: "-senpai", weight: 2 },
    { text: "-tan", weight: 1 },
    { text: "-dono", weight: 1 },
    { text: "-nyan", weight: 3 },
  ],

  // Reply typing/interaction delays0
  replyDelays: {
    beforeReplyClick: { min: 500, max: 1500 }, // Delay before clicking reply button
    waitForReplyBox: { min: 2000, max: 4000 }, // Wait for reply modal to open
    afterFocus: { min: 300, max: 500 }, // Delay after focusing text editor
    perCharacter: { min: 50, max: 150 }, // Typing speed per character
    beforeSend: { min: 500, max: 1500 }, // Delay before clicking send
    waitForModalClose: { min: 1500, max: 3000 }, // Wait for modal to auto-close
    escapeKeyFallback: { min: 500, max: 1000 }, // Delay after escape key press
  },

  // Behavior patterns (probabilities for randomDelay)
  behaviorPatterns: {
    quickScroll: 0.2, // 10% chance for quick scroll-through
    interestedReading: 0.25, // 25% cumulative (15% actual) for interested reading
    distracted: 0.25, // 35% cumulative (10% actual) for distracted behavior
    veryEngaged: 0.4, // 40% cumulative (5% actual) for very engaged
    // Remaining 60% = normal behavior
  },

  // Scroll behavior
  scrollOvershotChance: 0.3, // 30% chance of overshooting and correcting

  // Typo generation (human-like typing errors)
  typos: {
    typoChance: 0.015, // 1.5% chance per reply to have a typo
    proximityKeyChance: 0.6, // 60% of typos are fat-finger proximity
    doubleLetterChance: 0.25, // 25% of typos are doubled letters
    missedLetterChance: 0.1, // 10% of typos are missing letters
    swappedLetterChance: 0.05, // 5% of typos are swapped letters
  },

  // Breathing breaks (anti-detection)
  breathingBreak: {
    enabled: true,
    afterActions: { min: 30, max: 50 }, // Take a break after 30-50 actions
    duration: { min: 180000, max: 300000 }, // 3-5 minutes (in milliseconds)
  },

  // Emojis for replies (time-of-day specific)
  gmEmojis: [
    "☀️",
    "🌞",
    "😇",
    "🫂",
    "🥰",
    "🤗",
    "❤️",
    "😎",
    "🙃",
    "🫶",
    "🍀",
    "🚀",
  ], // Morning emojis
  gnEmojis: [
    "🌙",
    "🌑",
    "🌒",
    "🌓",
    "🌔",
    "🌕",
    "🌖",
    "🌗",
    "🌘",
    "✨",
    "😴",
    "💤",
    "🫂",
    "🥰",
    "🤗",
    "🥱",
    "☄️",
    "❤️",
    "🙃",
    "🫶",
    "👻",
    "🦉",
    "🛸",
  ], // Night emojis
  gaEmojis: ["🌤️", "☀️", "🌞", "😊", "🫂", "🥰", "🤗", "❤️", "🙃", "🫶"], // Afternoon emojis
  geEmojis: [
    "🌆",
    "🌇",
    "🌃",
    "✨",
    "🫂",
    "🥰",
    "🤗",
    "❤️",
    "🙃",
    "🫶",
    "🦉",
    "🛸",
  ], // Evening emojis
  hbdEmojis: ["🎂", "🎉", "🎊", "🎁", "🎈", "🥳", "🍰", "🫶", "❤️", "🥰", "🤗"], // Birthday emojis
  gestureEmojis: [
    "👋",
    "👊🏼",
    "✌🏼",
    "🤜🏼🤛🏼",
    "o7",
    "🫡",
    "🖖",
    "🥰",
    "🤗",
    "👉👌",
  ],
  laughEmojis: ["😂", "🤣", "😭", "💀", "😹", "😆", "😅"],
} as const;

export interface ScrollOptions {
  variation?: "quick" | "normal" | "careful";
  maxDuration?: number;
  shouldOvershoot?: boolean;
}
