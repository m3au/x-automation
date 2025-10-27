/**
 * Good Night (GN) post detection and reply patterns
 * Used to identify and reply to night/bedtime greeting posts on X/Twitter
 */

export const gnPatterns: readonly string[] = [
  // Core patterns
  "gn",
  "gn,",
  "g to the n",
  "good night",
  "goodnight",
  "great night",
  "good nite",
  "g'night",

  // Casual/Slang
  "nite nite",
  "night, fam",
  "catch ya in the am",
  "catch you in the am",
  "sleep tight",

  // Emotive/Positive
  "sweet dreams",
  "rest easy",
  "night vibes",
  "peaceful night",
  "dream big",

  // Crypto/NFT Community
  "wagmi, tomorrow",
  "hodl the night",

  // Meme-y/Playful
  "night, apes",
  "catch those z's",
  "bedtime",
  "stack those dreams",

  // Spiritual/Inspirational
  "grateful for tonight",
  "sleep with purpose",
  "nightly blessings",
  "rest and reset",
  "thankful for this day",
];

// GN reply composition parts with weights
export const gnGreetingsWeighted = [
  { text: "gn", weight: 30 },
  { text: "gngn", weight: 10 },
  { text: "gn gn", weight: 10 },
  { text: "gn,", weight: 5 },
  { text: "good night", weight: 10 },
  { text: "great night", weight: 3 },
  { text: "good nite", weight: 5 },
  { text: "g'night", weight: 5 },
  { text: "nite nite", weight: 5 },
  { text: "sleep tight", weight: 5 },
  { text: "sweet dreams", weight: 7 },
  { text: "night", weight: 5 },
];

export const gnForeignGreetingsWeighted = [
  { text: "buenas noches", weight: 10 },
  { text: "bonne nuit", weight: 10 },
  { text: "gute nacht", weight: 10 },
  { text: "oyasumi", weight: 10 },
  { text: "meow meow 🐈‍⬛", weight: 20 },
  { text: "mroar 🐈", weight: 20 },
  { text: "🌙🐈", weight: 10 },
  { text: "sleep well!", weight: 10 },
];

// Use same base name and suffix weights as GM
export const gnBaseNameWeighted = [
  { text: "authorName", weight: 50 },
  { text: "friend", weight: 21 },
  { text: "fam", weight: 7 },
  { text: "fren", weight: 7 },
  { text: "anon", weight: 5 },
  { text: "mf", weight: 5 },
  { text: "reatrd", weight: 3 },
  { text: "retard", weight: 2 },
];

export const gnNameSuffixesWeighted = [
  { text: "", weight: 70 },
  { text: "-chan", weight: 8 },
  { text: "-san", weight: 5 },
  { text: "-sama", weight: 3 },
  { text: "-senpai", weight: 4 },
  { text: "-tan", weight: 3 },
  { text: "-dono", weight: 2 },
  { text: "-nyan", weight: 5 },
];

export const gnNightEmojis = ["🌙", "✨", "😴", "💤", "🫂", "🥰"];
export const gnGestureEmojis = ["👋", "🙋🏻‍♂️", "✌🏼", "🤜🏼🤛🏼"];

export const gnRestingPhrases = [
  "sleep well!",
  "rest up!",
  "dream big!",
  "recharge!",
  "catch those z's!",
  "peaceful sleep!",
  "have a good rest!",
  "have an amazing rest!",
  "have a blessed rest!",
  "have a wonderful rest!",
  "have an excellent rest!",
];

// Weekday-specific phrases (0=Sunday through 6=Saturday)
export const gnWeekdayPhrases: { [key: number]: string[] } = {
  0: [
    "rest well for monday!",
    "recharge for the week!",
    "sleep tight, new week tomorrow!",
    "have a good rest!",
    "have an amazing rest!",
    "have a blessed rest!",
    "have a wonderful rest!",
    "have an excellent rest!",
  ],
  1: [
    "sleep well, big week ahead!",
    "rest up for tuesday!",
    "dream big!",
    "have a good night!",
    "have an amazing night!",
    "have a blessed night!",
    "have a wonderful night!",
    "have an excellent night!",
  ],
  2: [
    "rest well!",
    "recharge for tomorrow!",
    "sleep tight!",
    "have a good night!",
    "have an amazing night!",
    "have a blessed night!",
    "have a wonderful night!",
    "have an excellent night!",
  ],
  3: [
    "halfway through, rest up!",
    "sleep well!",
    "recharge!",
    "have a good night!",
    "have an amazing night!",
    "have a blessed night!",
    "have a wonderful night!",
    "have an excellent night!",
  ],
  4: [
    "rest well, friday tomorrow!",
    "sleep tight!",
    "almost weekend!",
    "have a good night!",
    "have an amazing night!",
    "have a blessed night!",
    "have a wonderful night!",
    "have an excellent night!",
  ],
  5: [
    "weekend sleep!",
    "rest well!",
    "no alarm tomorrow!",
    "have a good weekend night!",
    "have an amazing weekend night!",
    "have a blessed weekend night!",
    "have a wonderful weekend night!",
    "have an excellent weekend night!",
  ],
  6: ["weekend vibes!", "sleep in tomorrow!", "rest well!"],
};
