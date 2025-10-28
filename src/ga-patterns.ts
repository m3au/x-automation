/**
 * Good Afternoon (GA) post detection and reply patterns
 * Used to identify and reply to afternoon greeting posts on X/Twitter
 */

export const gaPatterns: readonly string[] = [
  // Core patterns
  "ga",
  "ga,",
  "good afternoon",
  "goodafternoon",
  "good pm",

  // Casual/Slang
  "afternoon, y'all",
  "afternoon, fam",
  "midday vibes",

  // Emotive/Positive
  "happy afternoon",
  "chill pm",
  "sun's up, vibes up",
  "great afternoon",
  "keep it rockin",

  // Crypto/NFT Community
  "midday wagmi",
  "bullish afternoon",

  // Meme-y/Playful
  "afternoon, apes",
  "midday grind",
  "sun's high",
  "pm pump",

  // Motivational/Inspirational
  "make this afternoon count",
  "grateful for the pm",
  "midday reset",
  "afternoon hustle",
  "keep shining",
];

// GA reply composition parts with weights
export const gaGreetingsWeighted = [
  { text: "ga", weight: 30 },
  { text: "gaga", weight: 10 },
  { text: "ga ga", weight: 10 },
  { text: "ga,", weight: 5 },
  { text: "good afternoon", weight: 15 },
  { text: "great afternoon", weight: 5 },
  { text: "happy afternoon", weight: 10 },
  { text: "afternoon", weight: 10 },
  { text: "good pm", weight: 5 },
];

export const gaForeignGreetingsWeighted = [
  { text: "buenas tardes", weight: 10 },
  { text: "bon après-midi", weight: 10 },
  { text: "guten nachmittag", weight: 10 },
  { text: "meow meow 🐈‍⬛", weight: 20 },
  { text: "mroar 🐈", weight: 20 },
  { text: "🌤️🐈", weight: 10 },
  { text: "hey there!", weight: 10 },
  { text: "afternoon vibes!", weight: 10 },
];

// Use same base name and suffix weights as GM
export const gaBaseNameWeighted = [
  { text: "authorName", weight: 50 },
  { text: "friend", weight: 21 },
  { text: "fam", weight: 7 },
  { text: "fren", weight: 7 },
  { text: "anon", weight: 5 },
  { text: "mf", weight: 5 },
  { text: "reatrd", weight: 3 },
  { text: "retard", weight: 2 },
];

export const gaNameSuffixesWeighted = [
  { text: "", weight: 70 },
  { text: "-chan", weight: 8 },
  { text: "-san", weight: 5 },
  { text: "-sama", weight: 3 },
  { text: "-senpai", weight: 4 },
  { text: "-tan", weight: 3 },
  { text: "-dono", weight: 2 },
  { text: "-nyan", weight: 5 },
];

export const gaAfternoonEmojis = ["🌤️", "☀️", "🌞", "😊", "🫂", "🥰"];
export const gaGestureEmojis = ["👋", "🙋🏻‍♂️", "👊🏼", "✌🏼", "🤜🏼🤛🏼"];

export const gaHustlePhrases = [
  "keep going!",
  "locked in!",
  "let's finish strong!",
  "midday energy!",
  "push through!",
  "keep building!",
  "afternoon grind!",
  "let's get it!",
  "stay focused!",
  "have a good afternoon!",
  "have an amazing afternoon!",
  "have a wonderful afternoon!",
  "have an excellent afternoon!",
];

// Weekday-specific phrases (0=Sunday through 6=Saturday)
export const gaWeekdayPhrases: { [key: number]: string[] } = {
  0: [
    "sunday chill!",
    "rest mode!",
    "easy sunday!",
    "have a good Sunday afternoon!",
    "have an amazing Sunday afternoon!",
    "have a blessed Sunday afternoon!",
    "have a wonderful Sunday afternoon!",
    "have an excellent Sunday afternoon!",
  ],
  1: [
    "monday momentum!",
    "keep the energy!",
    "strong start!",
    "have a good afternoon!",
    "have an amazing afternoon!",
    "have a blessed afternoon!",
    "have a wonderful afternoon!",
    "have an excellent afternoon!",
  ],
  2: [
    "taco tuesday vibes!",
    "tuesday hustle!",
    "keep building!",
    "have a good afternoon!",
    "have an amazing afternoon!",
    "have a blessed afternoon!",
    "have a wonderful afternoon!",
    "have an excellent afternoon!",
  ],
  3: [
    "hump day push!",
    "halfway there!",
    "wednesday grind!",
    "have a good afternoon!",
    "have an amazing afternoon!",
    "have a blessed afternoon!",
    "have a wonderful afternoon!",
    "have an excellent afternoon!",
  ],
  4: [
    "thursday power!",
    "almost friday!",
    "finish strong!",
    "have a good afternoon!",
    "have an amazing afternoon!",
    "have a blessed afternoon!",
    "have a wonderful afternoon!",
    "have an excellent afternoon!",
  ],
  5: [
    "friday afternoon!",
    "weekend incoming!",
    "almost there!",
    "have a good friday afternoon!",
    "have an amazing friday afternoon!",
    "have a blessed friday afternoon!",
    "have a wonderful friday afternoon!",
    "have an excellent friday afternoon!",
  ],
  6: [
    "saturday vibes!",
    "weekend mode!",
    "enjoy it!",
    "have a good weekend afternoon!",
    "have an amazing weekend afternoon!",
    "have a blessed weekend afternoon!",
    "have a wonderful weekend afternoon!",
    "have an excellent weekend afternoon!",
  ],
};
