/**
 * Reply generation functions for GM/GN/GA/GE posts
 */

import { detectKeywordToEcho, detectWeekdayInPost } from "./reply-helpers";

// Get a variation of "degen" for variety in replies
function getDegenVariation(): string {
  const variations = [
    "degen",
    "degens",
    "degen",
    "degens",
    "degen ape",
    "degen alpha",
    "degen 🚀",
    "degens",
    "degen",
  ];
  // Mostly "degen" or "degens" (6/9 = 67%), but some fun variations (33%)
  return variations[Math.floor(Math.random() * variations.length)];
}
import {
  gaForeignGreetingsWeighted,
  gaGreetingsWeighted,
  gaHustlePhrases,
  gaWeekdayPhrases,
} from "./ga-patterns";
import {
  geForeignGreetingsWeighted,
  geGreetingsWeighted,
  geWeekdayPhrases,
  geWindDownPhrases,
} from "./ge-patterns";
import {
  gmBuildingPhrases,
  gmForeignGreetingsWeighted,
  gmGreetingsWeighted,
  gmWeekdayPhrases,
} from "./gm-patterns";
import {
  gnForeignGreetingsWeighted,
  gnGreetingsWeighted,
  gnRestingPhrases,
  gnWeekdayPhrases,
} from "./gn-patterns";
import {
  hbdCelebrationPhrases,
  hbdForeignGreetingsWeighted,
  hbdGreetingsWeighted,
} from "./hbd-patterns";

import { CONFIG } from "./config";
import { selectWeighted } from "./utils";
import { introduceTypo } from "./typo-generator";
import {
  isGMPost,
  isGNPost,
  isGAPost,
  isGEPost,
  isHBDPost,
} from "./post-detector";

// Check if post has "say it back" prompt
export function hasSayItBack(postText: string): boolean {
  const sayItBackPatterns = [
    /say it back/i,
    /say back/i,
    /reply back/i,
    /type it back/i,
  ];
  return sayItBackPatterns.some((pattern) => pattern.test(postText));
}

// Generate "say it back" response
export function generateSayItBackReply(postText: string): string {
  // 20% chance to just say "it back" without anything else
  if (Math.random() < 0.2) {
    return "it back";
  }

  // Otherwise, detect the post type and return the simple greeting
  if (isHBDPost(postText, CONFIG.hbdPatterns)) {
    return "hbd";
  } else if (isGMPost(postText, CONFIG.gmPatterns)) {
    return "gm";
  } else if (isGAPost(postText, CONFIG.gaPatterns)) {
    return "ga";
  } else if (isGEPost(postText, CONFIG.gePatterns)) {
    return "ge";
  } else if (isGNPost(postText, CONFIG.gnPatterns)) {
    return "gn";
  }

  // Fallback: just return "it back" if we can't detect the type
  return "it back";
}

// Normalize author names (remove fancy Unicode, emojis, etc.)
export function normalizeAuthorName(name: string): string {
  // Remove emojis
  let normalized = name.replaceAll(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ""
  );

  // Normalize fancy Unicode to regular ASCII
  normalized = normalized
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036F]/g, "") // Remove diacritics
    .replaceAll(/[^\u0020-\u007F]/g, ""); // Remove non-ASCII (except space)

  // Clean up whitespace
  normalized = normalized.trim();

  // Strip trailing/leading punctuation and termination characters FIRST
  // Remove: . , ; : ! ? - _ = + | / \ ( ) [ ] { } < > " ' ` ~ @ # $ % ^ & *
  normalized = normalized.replaceAll(
    /^[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~-]+|[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~-]+$/g,
    ""
  );
  normalized = normalized.trim();

  // Handle dotted names like "neon.something.something" → "neon"
  // Take only the first part before the first dot
  if (normalized.includes(".")) {
    normalized = normalized.split(".")[0].trim();
  }

  // Replace underscores with spaces (e.g., "something_something" → "something something")
  normalized = normalized.replaceAll("_", " ");

  // Handle spaced-out names like "H O L Y" → "HOLY"
  // Only collapse if ALL words are single characters (not "John Smith")
  const words = normalized.split(/\s+/);
  if (words.length > 1 && words.every((word) => word.length === 1)) {
    // All words are single letters, collapse them
    normalized = words.join("");
  }

  // Final trim to remove any whitespace
  normalized = normalized.trim();

  // If name is all caps, convert to only first letter capitalized
  // e.g., "JOHN" → "John", "STRONGG" → "Strongg"
  if (normalized.length >= 2 && normalized === normalized.toUpperCase()) {
    // Name is all caps, convert to title case (only first letter caps)
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }

  // If the name is now empty or too short, return empty (will trigger fallback)
  if (normalized.length < 2) {
    return "";
  }

  return normalized;
}

// Weighted selection helpers (using general utility function)
function selectWeightedGreeting(): string {
  return selectWeighted(gmGreetingsWeighted);
}

function selectWeightedForeignGreeting(): string {
  return selectWeighted(gmForeignGreetingsWeighted);
}

function selectWeightedBaseName(): string {
  return selectWeighted(CONFIG.baseNameWeighted);
}

// Select a fallback name when author name can't be determined (excludes "authorName")
function selectWeightedFallbackName(): string {
  // Filter out "authorName" from the options
  const fallbackOptions = CONFIG.baseNameWeighted.filter(
    (b) => b.text !== "authorName"
  );
  if (fallbackOptions.length === 0) {
    return "friend";
  }
  return selectWeighted(fallbackOptions);
}

function selectWeightedSuffix(): string {
  return selectWeighted(CONFIG.nameSuffixesWeighted);
}

// Weighted selection helpers for GN
function selectWeightedGNGreeting(): string {
  return selectWeighted(gnGreetingsWeighted);
}

function selectWeightedGNForeignGreeting(): string {
  return selectWeighted(gnForeignGreetingsWeighted);
}

// Weighted selection helpers for GA
function selectWeightedGAGreeting(): string {
  return selectWeighted(gaGreetingsWeighted);
}

function selectWeightedGAForeignGreeting(): string {
  return selectWeighted(gaForeignGreetingsWeighted);
}

// Weighted selection helpers for GE
function selectWeightedGEGreeting(): string {
  return selectWeighted(geGreetingsWeighted);
}

function selectWeightedGEForeignGreeting(): string {
  return selectWeighted(geForeignGreetingsWeighted);
}

export function generateGMReply(authorName: string, postText = ""): string {
  // Chance for foreign greeting (standalone)
  if (Math.random() < CONFIG.replyChances.foreignGreeting) {
    return introduceTypo(selectWeightedForeignGreeting(), CONFIG.typos);
  }

  // Pick greeting using weighted selection
  const greeting = selectWeightedGreeting();

  // Chance to return just the greeting (standalone)
  if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
    // Chance to add emoji to standalone greeting
    if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const emoji =
          CONFIG.gmEmojis[Math.floor(Math.random() * CONFIG.gmEmojis.length)];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      } else {
        const gestureEmoji =
          CONFIG.gestureEmojis[
            Math.floor(Math.random() * CONFIG.gestureEmojis.length)
          ];
        return introduceTypo(`${greeting} ${gestureEmoji}`, CONFIG.typos);
      }
    }
    return introduceTypo(greeting, CONFIG.typos);
  }

  // Check if post mentions a specific weekday
  const detectedWeekday = detectWeekdayInPost(postText);
  const currentDay = new Date().getDay();
  // Only use detected weekday if it matches current day, otherwise use current day (avoid old days)
  const dayOfWeek =
    detectedWeekday !== null && detectedWeekday === currentDay
      ? detectedWeekday
      : currentDay;

  // Check if post contains special keywords to echo back
  const keywordToEcho = detectKeywordToEcho(postText);
  if (keywordToEcho) {
    // Use the keyword from the post instead of author name or weighted selection
    // For "degen", add variations for variety
    const keywordVariation =
      keywordToEcho === "degen" ? getDegenVariation() : keywordToEcho;
    const reply = `${greeting} ${keywordVariation}`;

    // Still chance to add phrase and emoji
    if (Math.random() < CONFIG.replyChances.includePhrase) {
      let phrase: string;
      if (
        gmWeekdayPhrases[dayOfWeek] &&
        Math.random() < CONFIG.replyChances.weekdayPhrase
      ) {
        const dayPhrases = gmWeekdayPhrases[dayOfWeek];
        phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
      } else {
        phrase =
          gmBuildingPhrases[
            Math.floor(Math.random() * gmBuildingPhrases.length)
          ];
      }
      return introduceTypo(`${reply}, ${phrase}`, CONFIG.typos);
    }

    // Always add a laugh emoji for keyword posts (degen, mf, retard, etc.)
    const laughEmoji =
      CONFIG.laughEmojis[Math.floor(Math.random() * CONFIG.laughEmojis.length)];
    return introduceTypo(`${reply} ${laughEmoji}`, CONFIG.typos);
  }

  // Normalize and get first word of author name (no @)
  const normalizedName = normalizeAuthorName(authorName);
  const firstName = normalizedName.split(/\s+/)[0];

  // Select base name (authorName, friend, fam, anon, mf)
  let baseName = selectWeightedBaseName();

  // If name is "authorName" but normalized name is empty/invalid/Unknown, use fallback
  if (baseName === "authorName" && (!firstName || firstName.toLowerCase() === "unknown")) {
    baseName = selectWeightedFallbackName(); // Fallback to generic greeting (friend, fam, etc.)
  }

  let finalName: string;

  if (baseName === "authorName") {
    // Use author's name and potentially add a suffix
    const suffix = selectWeightedSuffix();
    finalName = `${firstName}${suffix}`;
  } else {
    // Use replacement word without suffix
    finalName = baseName;
  }

  // Build base reply: greeting + finalName
  let reply = `${greeting} ${finalName}`;

  // Chance to include phrase
  if (Math.random() < CONFIG.replyChances.includePhrase) {
    // Pick phrase based on day (use detected weekday from post, or current day)
    let phrase: string;
    if (
      gmWeekdayPhrases[dayOfWeek] &&
      Math.random() < CONFIG.replyChances.weekdayPhrase
    ) {
      // Chance to use weekday-specific phrase
      const dayPhrases = gmWeekdayPhrases[dayOfWeek];
      phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
    } else {
      // Otherwise use generic building phrases
      phrase =
        gmBuildingPhrases[Math.floor(Math.random() * gmBuildingPhrases.length)];
    }

    reply = `${reply}, ${phrase}`;
  }

  // Chance to add emoji at the end
  if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
    const emojiRoll = Math.random();
    if (emojiRoll < 0.7) {
      const emoji =
        CONFIG.gmEmojis[Math.floor(Math.random() * CONFIG.gmEmojis.length)];
      reply = `${reply} ${emoji}`;
    } else {
      const gestureEmoji =
        CONFIG.gestureEmojis[
          Math.floor(Math.random() * CONFIG.gestureEmojis.length)
        ];
      reply = `${reply} ${gestureEmoji}`;
    }
  }

  // Apply typo chance for human-like errors
  return introduceTypo(reply, CONFIG.typos);
}

export function generateGNReply(authorName: string, postText = ""): string {
  // Chance for foreign greeting (standalone)
  if (Math.random() < CONFIG.replyChances.foreignGreeting) {
    return introduceTypo(selectWeightedGNForeignGreeting(), CONFIG.typos);
  }

  // Pick greeting using weighted selection
  const greeting = selectWeightedGNGreeting();

  // Chance to return just the greeting (standalone)
  if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
    // Chance to add emoji to standalone greeting
    if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const emoji =
          CONFIG.gnEmojis[Math.floor(Math.random() * CONFIG.gnEmojis.length)];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      } else {
        const emoji =
          CONFIG.gestureEmojis[
            Math.floor(Math.random() * CONFIG.gestureEmojis.length)
          ];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      }
    }
    return introduceTypo(greeting, CONFIG.typos);
  }

  // Check if post mentions a specific weekday
  const detectedWeekday = detectWeekdayInPost(postText);
  const currentDay = new Date().getDay();
  // Only use detected weekday if it matches current day, otherwise use current day (avoid old days)
  const dayOfWeek =
    detectedWeekday !== null && detectedWeekday === currentDay
      ? detectedWeekday
      : currentDay;

  // Check if post contains special keywords to echo back
  const keywordToEcho = detectKeywordToEcho(postText);
  if (keywordToEcho) {
    // For "degen", add variations for variety
    const keywordVariation =
      keywordToEcho === "degen" ? getDegenVariation() : keywordToEcho;
    const reply = `${greeting} ${keywordVariation}`;

    if (Math.random() < CONFIG.replyChances.includePhrase) {
      let phrase: string;
      if (
        gnWeekdayPhrases[dayOfWeek] &&
        Math.random() < CONFIG.replyChances.weekdayPhrase
      ) {
        const dayPhrases = gnWeekdayPhrases[dayOfWeek];
        phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
      } else {
        phrase =
          gnRestingPhrases[Math.floor(Math.random() * gnRestingPhrases.length)];
      }
      return introduceTypo(`${reply}, ${phrase}`, CONFIG.typos);
    }

    // Always add a laugh emoji for keyword posts (degen, mf, retard, etc.)
    const laughEmoji =
      CONFIG.laughEmojis[Math.floor(Math.random() * CONFIG.laughEmojis.length)];
    return introduceTypo(`${reply} ${laughEmoji}`, CONFIG.typos);
  }

  // Normalize and get first word of author name (no @)
  const normalizedName = normalizeAuthorName(authorName);
  const firstName = normalizedName.split(/\s+/)[0];

  // Select base name (shared config)
  let baseName = selectWeightedBaseName();

  // If name is "authorName" but normalized name is empty/invalid/Unknown, use fallback
  if (baseName === "authorName" && (!firstName || firstName.toLowerCase() === "unknown")) {
    baseName = selectWeightedFallbackName(); // Fallback to generic greeting (friend, fam, etc.)
  }

  let finalName: string;

  if (baseName === "authorName") {
    // Use author's name and potentially add a suffix
    const suffix = selectWeightedSuffix();
    finalName = `${firstName}${suffix}`;
  } else {
    // Use replacement word without suffix
    finalName = baseName;
  }

  // Build base reply: greeting + finalName
  let reply = `${greeting} ${finalName}`;

  // Chance to include phrase
  if (Math.random() < CONFIG.replyChances.includePhrase) {
    // Pick phrase based on day (dayOfWeek already calculated at top)
    let phrase: string;
    if (
      gnWeekdayPhrases[dayOfWeek] &&
      Math.random() < CONFIG.replyChances.weekdayPhrase
    ) {
      const dayPhrases = gnWeekdayPhrases[dayOfWeek];
      phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
    } else {
      phrase =
        gnRestingPhrases[Math.floor(Math.random() * gnRestingPhrases.length)];
    }

    reply = `${reply}, ${phrase}`;
  }

  // Chance to add emoji at the end
  if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
    const emojiRoll = Math.random();
    if (emojiRoll < 0.7) {
      const emoji =
        CONFIG.gnEmojis[Math.floor(Math.random() * CONFIG.gnEmojis.length)];
      reply = `${reply} ${emoji}`;
    } else {
      const emoji =
        CONFIG.gestureEmojis[
          Math.floor(Math.random() * CONFIG.gestureEmojis.length)
        ];
      reply = `${reply} ${emoji}`;
    }
  }

  // Apply typo chance for human-like errors
  return introduceTypo(reply, CONFIG.typos);
}

export function generateGAReply(authorName: string, postText = ""): string {
  // Chance for foreign greeting (standalone)
  if (Math.random() < CONFIG.replyChances.foreignGreeting) {
    return introduceTypo(selectWeightedGAForeignGreeting(), CONFIG.typos);
  }

  // Pick greeting using weighted selection
  const greeting = selectWeightedGAGreeting();

  // Chance to return just the greeting (standalone)
  if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
    // Chance to add emoji to standalone greeting
    if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const emoji =
          CONFIG.gaEmojis[Math.floor(Math.random() * CONFIG.gaEmojis.length)];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      } else {
        const emoji =
          CONFIG.gestureEmojis[
            Math.floor(Math.random() * CONFIG.gestureEmojis.length)
          ];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      }
    }
    return introduceTypo(greeting, CONFIG.typos);
  }

  // Check if post mentions a specific weekday
  const detectedWeekday = detectWeekdayInPost(postText);
  const currentDay = new Date().getDay();
  // Only use detected weekday if it matches current day, otherwise use current day (avoid old days)
  const dayOfWeek =
    detectedWeekday !== null && detectedWeekday === currentDay
      ? detectedWeekday
      : currentDay;

  // Check if post contains special keywords to echo back
  const keywordToEcho = detectKeywordToEcho(postText);
  if (keywordToEcho) {
    // For "degen", add variations for variety
    const keywordVariation =
      keywordToEcho === "degen" ? getDegenVariation() : keywordToEcho;
    const reply = `${greeting} ${keywordVariation}`;

    if (Math.random() < CONFIG.replyChances.includePhrase) {
      let phrase: string;
      if (
        gaWeekdayPhrases[dayOfWeek] &&
        Math.random() < CONFIG.replyChances.weekdayPhrase
      ) {
        const dayPhrases = gaWeekdayPhrases[dayOfWeek];
        phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
      } else {
        phrase =
          gaHustlePhrases[Math.floor(Math.random() * gaHustlePhrases.length)];
      }
      return introduceTypo(`${reply}, ${phrase}`, CONFIG.typos);
    }

    // Always add a laugh emoji for keyword posts (degen, mf, retard, etc.)
    const laughEmoji =
      CONFIG.laughEmojis[Math.floor(Math.random() * CONFIG.laughEmojis.length)];
    return introduceTypo(`${reply} ${laughEmoji}`, CONFIG.typos);
  }

  // Normalize and get first word of author name (no @)
  const normalizedName = normalizeAuthorName(authorName);
  const firstName = normalizedName.split(/\s+/)[0];

  // Select base name (shared config)
  let baseName = selectWeightedBaseName();

  // If name is "authorName" but normalized name is empty/invalid/Unknown, use fallback
  if (baseName === "authorName" && (!firstName || firstName.toLowerCase() === "unknown")) {
    baseName = selectWeightedFallbackName(); // Fallback to generic greeting (friend, fam, etc.)
  }

  let finalName: string;

  if (baseName === "authorName") {
    // Use author's name and potentially add a suffix
    const suffix = selectWeightedSuffix();
    finalName = `${firstName}${suffix}`;
  } else {
    // Use replacement word without suffix
    finalName = baseName;
  }

  // Build base reply: greeting + finalName
  let reply = `${greeting} ${finalName}`;

  // Chance to include phrase
  if (Math.random() < CONFIG.replyChances.includePhrase) {
    // Pick phrase based on day (dayOfWeek already calculated at top)
    let phrase: string;
    if (
      gaWeekdayPhrases[dayOfWeek] &&
      Math.random() < CONFIG.replyChances.weekdayPhrase
    ) {
      const dayPhrases = gaWeekdayPhrases[dayOfWeek];
      phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
    } else {
      phrase =
        gaHustlePhrases[Math.floor(Math.random() * gaHustlePhrases.length)];
    }

    reply = `${reply}, ${phrase}`;
  }

  // Chance to add emoji at the end
  if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
    const emojiRoll = Math.random();
    if (emojiRoll < 0.7) {
      const emoji =
        CONFIG.gaEmojis[Math.floor(Math.random() * CONFIG.gaEmojis.length)];
      reply = `${reply} ${emoji}`;
    } else {
      const emoji =
        CONFIG.gestureEmojis[
          Math.floor(Math.random() * CONFIG.gestureEmojis.length)
        ];
      reply = `${reply} ${emoji}`;
    }
  }

  // Apply typo chance for human-like errors
  return introduceTypo(reply, CONFIG.typos);
}

export function generateGEReply(authorName: string, postText = ""): string {
  // Chance for foreign greeting (standalone)
  if (Math.random() < CONFIG.replyChances.foreignGreeting) {
    return introduceTypo(selectWeightedGEForeignGreeting(), CONFIG.typos);
  }

  // Pick greeting using weighted selection
  const greeting = selectWeightedGEGreeting();

  // Chance to return just the greeting (standalone)
  if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
    // Chance to add emoji to standalone greeting
    if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const emoji =
          CONFIG.geEmojis[Math.floor(Math.random() * CONFIG.geEmojis.length)];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      } else {
        const emoji =
          CONFIG.gestureEmojis[
            Math.floor(Math.random() * CONFIG.gestureEmojis.length)
          ];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      }
    }
    return introduceTypo(greeting, CONFIG.typos);
  }

  // Check if post mentions a specific weekday
  const detectedWeekday = detectWeekdayInPost(postText);
  const currentDay = new Date().getDay();
  // Only use detected weekday if it matches current day, otherwise use current day (avoid old days)
  const dayOfWeek =
    detectedWeekday !== null && detectedWeekday === currentDay
      ? detectedWeekday
      : currentDay;

  // Check if post contains special keywords to echo back
  const keywordToEcho = detectKeywordToEcho(postText);
  if (keywordToEcho) {
    // For "degen", add variations for variety
    const keywordVariation =
      keywordToEcho === "degen" ? getDegenVariation() : keywordToEcho;
    const reply = `${greeting} ${keywordVariation}`;

    if (Math.random() < CONFIG.replyChances.includePhrase) {
      let phrase: string;
      if (
        geWeekdayPhrases[dayOfWeek] &&
        Math.random() < CONFIG.replyChances.weekdayPhrase
      ) {
        const dayPhrases = geWeekdayPhrases[dayOfWeek];
        phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
      } else {
        phrase =
          geWindDownPhrases[
            Math.floor(Math.random() * geWindDownPhrases.length)
          ];
      }
      return introduceTypo(`${reply}, ${phrase}`, CONFIG.typos);
    }

    // Always add a laugh emoji for keyword posts (degen, mf, retard, etc.)
    const laughEmoji =
      CONFIG.laughEmojis[Math.floor(Math.random() * CONFIG.laughEmojis.length)];
    return introduceTypo(`${reply} ${laughEmoji}`, CONFIG.typos);
  }

  // Normalize and get first word of author name (no @)
  const normalizedName = normalizeAuthorName(authorName);
  const firstName = normalizedName.split(/\s+/)[0];

  // Select base name (shared config)
  let baseName = selectWeightedBaseName();

  // If name is "authorName" but normalized name is empty/invalid/Unknown, use fallback
  if (baseName === "authorName" && (!firstName || firstName.toLowerCase() === "unknown")) {
    baseName = selectWeightedFallbackName(); // Fallback to generic greeting (friend, fam, etc.)
  }

  let finalName: string;

  if (baseName === "authorName") {
    // Use author's name and potentially add a suffix
    const suffix = selectWeightedSuffix();
    finalName = `${firstName}${suffix}`;
  } else {
    // Use replacement word without suffix
    finalName = baseName;
  }

  // Build base reply: greeting + finalName
  let reply = `${greeting} ${finalName}`;

  // Chance to include phrase
  if (Math.random() < CONFIG.replyChances.includePhrase) {
    // Pick phrase based on day (dayOfWeek already calculated at top)
    let phrase: string;
    if (
      geWeekdayPhrases[dayOfWeek] &&
      Math.random() < CONFIG.replyChances.weekdayPhrase
    ) {
      const dayPhrases = geWeekdayPhrases[dayOfWeek];
      phrase = dayPhrases[Math.floor(Math.random() * dayPhrases.length)];
    } else {
      phrase =
        geWindDownPhrases[Math.floor(Math.random() * geWindDownPhrases.length)];
    }

    reply = `${reply}, ${phrase}`;
  }

  // Chance to add emoji at the end
  if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
    const emojiRoll = Math.random();
    if (emojiRoll < 0.7) {
      const emoji =
        CONFIG.geEmojis[Math.floor(Math.random() * CONFIG.geEmojis.length)];
      reply = `${reply} ${emoji}`;
    } else {
      const emoji =
        CONFIG.gestureEmojis[
          Math.floor(Math.random() * CONFIG.gestureEmojis.length)
        ];
      reply = `${reply} ${emoji}`;
    }
  }

  // Apply typo chance for human-like errors
  return introduceTypo(reply, CONFIG.typos);
}

// Weighted selection helpers for HBD
function selectWeightedHBDGreeting(): string {
  return selectWeighted(hbdGreetingsWeighted);
}

function selectWeightedHBDForeignGreeting(): string {
  return selectWeighted(hbdForeignGreetingsWeighted);
}

export function generateHBDReply(authorName: string, postText = ""): string {
  // Chance for foreign greeting (standalone)
  if (Math.random() < CONFIG.replyChances.foreignGreeting) {
    return introduceTypo(selectWeightedHBDForeignGreeting(), CONFIG.typos);
  }

  // Pick greeting using weighted selection
  const greeting = selectWeightedHBDGreeting();

  // Chance to return just the greeting (standalone)
  if (Math.random() < CONFIG.replyChances.standaloneGreeting) {
    // Chance to add emoji to standalone greeting
    if (Math.random() < CONFIG.replyChances.emojiInGreeting) {
      const emojiRoll = Math.random();
      if (emojiRoll < 0.7) {
        const emoji =
          CONFIG.hbdEmojis[Math.floor(Math.random() * CONFIG.hbdEmojis.length)];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      } else {
        const emoji =
          CONFIG.gestureEmojis[
            Math.floor(Math.random() * CONFIG.gestureEmojis.length)
          ];
        return introduceTypo(`${greeting} ${emoji}`, CONFIG.typos);
      }
    }
    return introduceTypo(greeting, CONFIG.typos);
  }

  // Check if post contains special keywords to echo back
  const keywordToEcho = detectKeywordToEcho(postText);
  if (keywordToEcho) {
    // For "degen", add variations for variety
    const keywordVariation =
      keywordToEcho === "degen" ? getDegenVariation() : keywordToEcho;
    const reply = `${greeting} ${keywordVariation}`;

    if (Math.random() < CONFIG.replyChances.includePhrase) {
      const phrase =
        hbdCelebrationPhrases[
          Math.floor(Math.random() * hbdCelebrationPhrases.length)
        ];
      return introduceTypo(`${reply}, ${phrase}`, CONFIG.typos);
    }

    // Always add a laugh emoji for keyword posts (degen, mf, retard, etc.)
    const laughEmoji =
      CONFIG.laughEmojis[Math.floor(Math.random() * CONFIG.laughEmojis.length)];
    return introduceTypo(`${reply} ${laughEmoji}`, CONFIG.typos);
  }

  // Normalize and get first word of author name (no @)
  const normalizedName = normalizeAuthorName(authorName);
  const firstName = normalizedName.split(/\s+/)[0];

  // Select base name (shared config)
  let baseName = selectWeightedBaseName();

  // If name is "authorName" but normalized name is empty/invalid/Unknown, use fallback
  if (baseName === "authorName" && (!firstName || firstName.toLowerCase() === "unknown")) {
    baseName = selectWeightedFallbackName(); // Fallback to generic greeting (friend, fam, etc.)
  }

  let finalName: string;

  if (baseName === "authorName") {
    // Use author's name and potentially add a suffix
    const suffix = selectWeightedSuffix();
    finalName = `${firstName}${suffix}`;
  } else {
    // Use replacement word without suffix
    finalName = baseName;
  }

  // Build base reply: greeting + finalName
  let reply = `${greeting} ${finalName}`;

  // Chance to include celebration phrase
  if (Math.random() < CONFIG.replyChances.includePhrase) {
    const phrase =
      hbdCelebrationPhrases[
        Math.floor(Math.random() * hbdCelebrationPhrases.length)
      ];
    reply = `${reply}, ${phrase}`;
  }

  // Chance to add emoji at the end
  if (Math.random() < CONFIG.replyChances.emojiAtEnd) {
    const emojiRoll = Math.random();
    if (emojiRoll < 0.7) {
      const emoji =
        CONFIG.hbdEmojis[Math.floor(Math.random() * CONFIG.hbdEmojis.length)];
      reply = `${reply} ${emoji}`;
    } else {
      const emoji =
        CONFIG.gestureEmojis[
          Math.floor(Math.random() * CONFIG.gestureEmojis.length)
        ];
      reply = `${reply} ${emoji}`;
    }
  }

  // Apply typo chance for human-like errors
  return introduceTypo(reply, CONFIG.typos);
}
