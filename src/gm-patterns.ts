/**
 * Good Morning (GM) post detection and reply patterns
 * Used to identify and reply to morning greeting posts on X/Twitter
 */

export const gmPatterns: readonly string[] = [
  // Core patterns
  "gm",
  "gm,",
  "g to the m",
  "good morning",
  "great morning",
  "good mornin",
  "gud morning",
  "g'morning",
  "gud mornin",
  "g'mornin",
  "goodmorning",

  // Casual/Slang
  "mornin'",
  "mornin",
  "rise n' grind",
  "rise and grind",
  "good am",

  // Emotive/Positive
  "blessed morning",
  "happy am",
  "new day, let's go",

  // Crypto/NFT Community
  "wagmi morning",
  "buidl morning",

  // Meme-y/Playful
  "morning, apes",
  "let's get this bread",

  // Spiritual/Inspirational
  "grateful for another morning",
  "peaceful am",
  "morning blessings",
  "rise with purpose",
  "thankful for today",
];

// GM reply composition parts with weights
export const gmGreetingsWeighted = [
  { text: "gm", weight: 34 },
  { text: "gmgm", weight: 10 },
  { text: "gm gm", weight: 12 },
  { text: "buon giorno", weight: 1 },
  { text: "bundinha", weight: 1 },
  { text: "good morning", weight: 4 },
  { text: "gooooood morning", weight: 3 },
  { text: "goood morning", weight: 3 },
  { text: "great morning 🌞", weight: 3 },
  { text: "good mornin", weight: 3 },
  { text: "amazing morning", weight: 2 },
  { text: "gud morning", weight: 3 },
  { text: "g'morning", weight: 3 },
  { text: "amazing morning", weight: 2 },
  { text: "gud mornin", weight: 3 },
  { text: "g'mornin", weight: 3 },
  { text: "mornin'", weight: 5 },
  { text: "mornin", weight: 5 },
  { text: "good am", weight: 1 },
];

export const gmForeignGreetingsWeighted = [
  { text: "guten morgen", weight: 10 },
  { text: "moinz", weight: 20 },
  { text: "moin moin", weight: 10 },
  { text: "meow meow 🐈‍⬛", weight: 20 },
  { text: "mroar 🐈", weight: 20 },
  { text: "☀️🐈", weight: 10 },
  { text: "hey there!", weight: 10 },
];

// Base name selection (use author name, or replace with these)
export const gmBaseNameWeighted = [
  { text: "authorName", weight: 50 }, // Use actual author name
  { text: "friend", weight: 21 },
  { text: "fam", weight: 7 },
  { text: "fren", weight: 7 },
  { text: "anon", weight: 5 },
  { text: "mf", weight: 5 },
  { text: "reatrd", weight: 3 },
  { text: "retard", weight: 2 },
];

// Suffixes to add to author name (only applied when base is "authorName")
export const gmNameSuffixesWeighted = [
  { text: "", weight: 66 }, // No suffix (most common)
  { text: " legend", weight: 8 },
  { text: "-chan", weight: 8 },
  { text: "-san", weight: 5 },
  { text: "-sama", weight: 3 },
  { text: "-senpai", weight: 2 },
  { text: "-tan", weight: 3 },
  { text: "-dono", weight: 2 },
  { text: "-nyan", weight: 3 },
];

export const gmSunEmojis = ["☀️", "🌞", "🌅", "😇", "🫂", "🥰"];
export const gmGestureEmojis = ["👋", "🙋🏻‍♂️", "👊🏼", "✌🏼", "🤜🏼🤛🏼"];

export const gmBuildingPhrases = [
  "let's go!",
  "locked in!",
  "let's get it!",
  "time to shine!",
  "today we build!",
  "time to ship!",
  "let's create!",
  "buidl mode!",
  "let's get this bread!",
  "have a good day!",
  "have an amazing day!",
  "have a wonderful day!",
  "have an excellent day!",
];

// Weekday-specific phrases (0=Sunday, 1=Monday through 6=Saturday)
export const gmWeekdayPhrases: { [key: number]: string[] } = {
  0: [
    "time to rest!",
    "recovery mode!",
    "recharge day!",
    "take it easy!",
    "let's recover!",
    "have a good Sunday!",
    "have an amazing Sunday!",
    "have a blessed Sunday!",
    "have a wonderful Sunday!",
    "have an excellent Sunday!",
  ],
  1: [
    "monday grind!",
    "new week energy!",
    "let's start strong!",
    "good start of the week!",
    "have an amazing start of the week!",
    "have a blessed start of the week!",
    "have a wonderful start of the week!",
    "have an excellent start of the week!",
  ],
  2: [
    "taco tuesday!",
    "tuesday vibes!",
    "keep building!",
    "have a good tuesday!",
    "have an amazing tuesday!",
    "have a blessed tuesday!",
    "have a wonderful tuesday!",
    "have an excellent tuesday!",
  ],
  3: [
    "wednesday hustle!",
    "hump day!",
    "halfway there!",
    "have a good wednesday!",
    "have an amazing wednesday!",
    "have a blessed wednesday!",
    "have a wonderful wednesday!",
    "have an excellent wednesday!",
  ],
  4: [
    "thursday momentum!",
    "almost friday!",
    "push through!",
    "have a good thursday!",
    "have an amazing thursday!",
    "have a blessed thursday!",
    "have a wonderful thursday!",
    "have an excellent thursday!",
  ],
  5: [
    "friday feeling!",
    "end strong!",
    "last push!",
    "have a good friday!",
    "have an amazing friday!",
    "have a blessed friday!",
    "have a wonderful friday!",
    "have an excellent friday!",
  ],
  6: [
    "saturday grind!",
    "weekend builder!",
    "no days off!",
    "weekend vibes!",
    "have a good weekend!",
    "have an amazing weekend!",
    "have a blessed weekend!",
    "have a wonderful weekend!",
    "have an excellent weekend!",
  ],
};
