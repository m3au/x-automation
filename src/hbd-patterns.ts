/**
 * Happy Birthday (HBD) post detection and reply patterns
 * Used to identify and reply to birthday posts on X/Twitter
 */

export const hbdPatterns: readonly string[] = [
  // Core patterns
  "hbd",
  "hbd,",
  "happy birthday",
  "happy bday",
  "happy b-day",
  "happybirthday",

  // Casual/Slang
  "bday",
  "b-day",
  "birthday vibes",
  "birthday mode",
  "birthday szn",

  // Emotive/Positive
  "blessed birthday",
  "amazing birthday",
  "special day",
  "birth anniversary",

  // Crypto/NFT Community
  "wagmi birthday",
  "birthday king",
  "birthday queen",
  "another trip around the sun",

  // Meme-y/Playful
  "new age unlocked",
  "age up",
  "+1 year",
];

// HBD reply composition parts with weights
export const hbdGreetingsWeighted = [
  { text: "hbd", weight: 30 },
  { text: "hbd!", weight: 15 },
  { text: "happy birthday", weight: 20 },
  { text: "happy bday", weight: 15 },
  { text: "happy birthday!", weight: 10 },
  { text: "happy bday!", weight: 5 },
  { text: "birthday blessings", weight: 3 },
  { text: "many happy returns", weight: 2 },
];

export const hbdForeignGreetingsWeighted = [
  { text: "🎂🐈‍", weight: 15 }, // black cat
  { text: "🎉🐱", weight: 12 }, // cat face
  { text: "🎊", weight: 12 }, // smiling cat
  { text: "🎈🐈", weight: 10 }, // regular cat
  { text: "🥳", weight: 10 }, // grinning cat
  { text: "🎁😻", weight: 8 }, // heart eyes cat
  { text: "🍰🐈‍", weight: 8 }, // black cat
  { text: "🎂✨", weight: 10 }, // no cat
  { text: "🎉🎊", weight: 8 }, // no cat
  { text: "🥳🎈", weight: 7 }, // no cat
];

// Note: baseNameWeighted, nameSuffixesWeighted, and emojis moved to CONFIG in like.ts

export const hbdCelebrationPhrases = [
  // Wishes and blessings
  "have an amazing day!",
  "enjoy your day!",
  "have a blessed day!",
  "may all your wishes come true!",
  "wishing you the best!",
  "best wishes!",
  "enjoy every moment!",

  // Celebratory
  "celebrate big!",
  "celebration time!",
  "let's celebrate!",
  "party time!",
  "party mode!",
  "cheers to you!",

  // Motivational
  "make it count!",
  "your year ahead!",
  "level up!",
  "another year wiser!",
  "another trip around the sun!",

  // Descriptive
  "special day!",
  "big day!",
  "your day!",
  "special one!",
  "congrats!",
];
