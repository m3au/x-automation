/**
 * Good Evening (GE) post detection and reply patterns
 * Used to identify and reply to evening greeting posts on X/Twitter
 */

export const gePatterns: readonly string[] = [
  // Core patterns
  "ge",
  "ge,",
  "good evening",
  "goodevening",
  "evening",
  "evening, y'all",
  "evening, fam",

  // Casual/Slang
  "evening vibes",
  "chill evening",
  "sunset time",
  "golden hour",

  // Emotive/Positive
  "happy evening",
  "peaceful evening",
  "beautiful evening",
  "lovely evening",

  // Crypto/NFT Community
  "evening wagmi",
  "evening grind",

  // Meme-y/Playful
  "evening, apes",
  "let's wind down",
  "sunset szn",

  // Motivational/Inspirational
  "grateful for this evening",
  "evening reset",
  "peaceful eve",
];

// GE reply composition parts with weights
export const geGreetingsWeighted = [
  { text: "ge", weight: 30 },
  { text: "gege", weight: 10 },
  { text: "ge ge", weight: 10 },
  { text: "ge,", weight: 5 },
  { text: "good evening", weight: 15 },
  { text: "lovely evening", weight: 5 },
  { text: "happy evening", weight: 10 },
  { text: "evening", weight: 10 },
  { text: "beautiful evening", weight: 5 },
];

export const geForeignGreetingsWeighted = [
  { text: "buenas tardes", weight: 10 },
  { text: "bonsoir", weight: 10 },
  { text: "guten abend", weight: 10 },
  { text: "meow meow 🐈‍⬛", weight: 20 },
  { text: "mroar 🐈", weight: 20 },
  { text: "🌆🐈", weight: 10 },
  { text: "hey there!", weight: 10 },
  { text: "evening vibes!", weight: 10 },
];

// Note: baseNameWeighted, nameSuffixesWeighted, and emojis moved to CONFIG in like.ts

export const geWindDownPhrases = [
  "almost there!",
  "winding down!",
  "enjoy the evening!",
  "relax time!",
  "sunset vibes!",
  "peaceful evening!",
  "chill time!",
  "evening mode!",
  "have a good evening!",
  "have an amazing evening!",
  "have a wonderful evening!",
  "have a blessed evening!",
  "have a cozy evening!",
];

// Weekday-specific phrases (0=Sunday through 6=Saturday)
export const geWeekdayPhrases: { [key: number]: string[] } = {
  0: [
    "sunday evening chill!",
    "relax mode!",
    "easy sunday night!",
    "have a peaceful Sunday evening!",
    "have a blessed Sunday evening!",
    "have a wonderful Sunday evening!",
    "have a cozy Sunday evening!",
  ],
  1: [
    "monday evening!",
    "first day done!",
    "week started strong!",
    "have a good evening!",
    "have an amazing evening!",
    "have a wonderful evening!",
    "have a cozy evening!",
  ],
  2: [
    "tuesday evening!",
    "keep it going!",
    "strong week!",
    "have a good evening!",
    "have an amazing evening!",
    "have a wonderful evening!",
    "have a cozy evening!",
  ],
  3: [
    "hump day evening!",
    "halfway done!",
    "wednesday wind down!",
    "have a good evening!",
    "have an amazing evening!",
    "have a wonderful evening!",
    "have a cozy evening!",
  ],
  4: [
    "thursday evening!",
    "almost friday!",
    "one more day!",
    "have a good evening!",
    "have an amazing evening!",
    "have a wonderful evening!",
    "have a cozy evening!",
  ],
  5: [
    "friday evening!",
    "weekend starts now!",
    "let's go!",
    "have a great friday evening!",
    "have an amazing friday evening!",
    "have a wonderful friday evening!",
    "have a cozy friday evening!",
  ],
  6: [
    "saturday evening!",
    "weekend vibes!",
    "enjoy it!",
    "have a great weekend evening!",
    "have an amazing weekend evening!",
    "have a wonderful weekend evening!",
    "have a cozy weekend evening!",
  ],
};
