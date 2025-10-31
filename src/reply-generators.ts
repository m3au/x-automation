/**
 * Reply generation functions for GM/GN/GA/GE posts
 */

import { detectKeywordToEcho, detectWeekdayInPost } from "./reply-helpers";
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
import { introduceTypo } from "./typo-generator";

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
  let reply: string;
  let addHandshake = false;

  // 50% chance to be literal
  if (Math.random() < 0.5) {
    reply = "it back";
  } else {
    // Otherwise, extract and echo the greeting part
    // Remove "say it back" and similar phrases, keep the greeting
    const cleaned = postText
      .replaceAll(/say it back/gi, "")
      .replaceAll(/say back/gi, "")
      .replaceAll(/reply back/gi, "")
      .replaceAll(/type it back/gi, "")
      .trim();

    // If there's something left, return it with handshake, otherwise be literal
    if (cleaned.length > 0) {
      reply = cleaned;
      addHandshake = true;
    } else {
      reply = "it back";
    }
  }

  // Add handshake emoji at the start when echoing back
  if (addHandshake) {
    reply = `🤝 ${reply}`;
  }

  // Add a laugh emoji at the end
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const laughEmoji =
    CONFIG.laughEmojis[Math.floor(Math.random() * CONFIG.laughEmojis.length)];
  return `${reply} ${laughEmoji}`;
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

  // Handle spaced-out names like "H O L Y" → "HOLY"
  // Only collapse if ALL words are single characters (not "John Smith")
  const words = normalized.split(/\s+/);
  if (words.length > 1 && words.every((word) => word.length === 1)) {
    // All words are single letters, collapse them
    normalized = words.join("");
  }

  // Final trim to remove any whitespace
  normalized = normalized.trim();

  // If the name is now empty or too short, return empty (will trigger fallback)
  if (normalized.length < 2) {
    return "";
  }

  return normalized;
}

// Weighted random selection helpers
function selectWeightedGreeting(): string {
  const totalWeight = gmGreetingsWeighted.reduce((sum, g) => sum + g.weight, 0);
  let random = Math.random() * totalWeight;

  for (const greeting of gmGreetingsWeighted) {
    random -= greeting.weight;
    if (random <= 0) {
      return greeting.text;
    }
  }

  return gmGreetingsWeighted[0].text;
}

function selectWeightedForeignGreeting(): string {
  const totalWeight = gmForeignGreetingsWeighted.reduce(
    (sum, f) => sum + f.weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const foreign of gmForeignGreetingsWeighted) {
    random -= foreign.weight;
    if (random <= 0) {
      return foreign.text;
    }
  }

  return gmForeignGreetingsWeighted[0].text;
}

function selectWeightedBaseName(): string {
  const totalWeight = CONFIG.baseNameWeighted.reduce(
    (sum, b) => sum + b.weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const baseName of CONFIG.baseNameWeighted) {
    random -= baseName.weight;
    if (random <= 0) {
      return baseName.text;
    }
  }

  return CONFIG.baseNameWeighted[0].text;
}

function selectWeightedSuffix(): string {
  const totalWeight = CONFIG.nameSuffixesWeighted.reduce(
    (sum, s) => sum + s.weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const suffix of CONFIG.nameSuffixesWeighted) {
    random -= suffix.weight;
    if (random <= 0) {
      return suffix.text;
    }
  }

  return CONFIG.nameSuffixesWeighted[0].text;
}

// Weighted selection helpers for GN
function selectWeightedGNGreeting(): string {
  const totalWeight = gnGreetingsWeighted.reduce((sum, g) => sum + g.weight, 0);
  let random = Math.random() * totalWeight;
  for (const greeting of gnGreetingsWeighted) {
    random -= greeting.weight;
    if (random <= 0) {
      return greeting.text;
    }
  }
  return gnGreetingsWeighted[0].text;
}

function selectWeightedGNForeignGreeting(): string {
  const totalWeight = gnForeignGreetingsWeighted.reduce(
    (sum, f) => sum + f.weight,
    0
  );
  let random = Math.random() * totalWeight;
  for (const foreign of gnForeignGreetingsWeighted) {
    random -= foreign.weight;
    if (random <= 0) {
      return foreign.text;
    }
  }
  return gnForeignGreetingsWeighted[0].text;
}

// Weighted selection helpers for GA
function selectWeightedGAGreeting(): string {
  const totalWeight = gaGreetingsWeighted.reduce((sum, g) => sum + g.weight, 0);
  let random = Math.random() * totalWeight;
  for (const greeting of gaGreetingsWeighted) {
    random -= greeting.weight;
    if (random <= 0) {
      return greeting.text;
    }
  }
  return gaGreetingsWeighted[0].text;
}

function selectWeightedGAForeignGreeting(): string {
  const totalWeight = gaForeignGreetingsWeighted.reduce(
    (sum, f) => sum + f.weight,
    0
  );
  let random = Math.random() * totalWeight;
  for (const foreign of gaForeignGreetingsWeighted) {
    random -= foreign.weight;
    if (random <= 0) {
      return foreign.text;
    }
  }
  return gaForeignGreetingsWeighted[0].text;
}

// Weighted selection helpers for GE
function selectWeightedGEGreeting(): string {
  const totalWeight = geGreetingsWeighted.reduce((sum, g) => sum + g.weight, 0);
  let random = Math.random() * totalWeight;
  for (const greeting of geGreetingsWeighted) {
    random -= greeting.weight;
    if (random <= 0) {
      return greeting.text;
    }
  }
  return geGreetingsWeighted[0].text;
}

function selectWeightedGEForeignGreeting(): string {
  const totalWeight = geForeignGreetingsWeighted.reduce(
    (sum, f) => sum + f.weight,
    0
  );
  let random = Math.random() * totalWeight;
  for (const foreign of geForeignGreetingsWeighted) {
    random -= foreign.weight;
    if (random <= 0) {
      return foreign.text;
    }
  }
  return geForeignGreetingsWeighted[0].text;
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
    const reply = `${greeting} ${keywordToEcho}`;

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

  // If name is "authorName" but normalized name is empty/invalid, use fallback
  if (baseName === "authorName" && !firstName) {
    baseName = "friend"; // Fallback to generic greeting
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
    const reply = `${greeting} ${keywordToEcho}`;

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

  // If name is "authorName" but normalized name is empty/invalid, use fallback
  if (baseName === "authorName" && !firstName) {
    baseName = "friend"; // Fallback to generic greeting
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
    const reply = `${greeting} ${keywordToEcho}`;

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

  // If name is "authorName" but normalized name is empty/invalid, use fallback
  if (baseName === "authorName" && !firstName) {
    baseName = "friend"; // Fallback to generic greeting
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
    const reply = `${greeting} ${keywordToEcho}`;

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

  // If name is "authorName" but normalized name is empty/invalid, use fallback
  if (baseName === "authorName" && !firstName) {
    baseName = "friend"; // Fallback to generic greeting
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
  const totalWeight = hbdGreetingsWeighted.reduce(
    (sum, g) => sum + g.weight,
    0
  );
  let random = Math.random() * totalWeight;
  for (const greeting of hbdGreetingsWeighted) {
    random -= greeting.weight;
    if (random <= 0) {
      return greeting.text;
    }
  }
  return hbdGreetingsWeighted[0].text;
}

function selectWeightedHBDForeignGreeting(): string {
  const totalWeight = hbdForeignGreetingsWeighted.reduce(
    (sum, f) => sum + f.weight,
    0
  );
  let random = Math.random() * totalWeight;
  for (const foreign of hbdForeignGreetingsWeighted) {
    random -= foreign.weight;
    if (random <= 0) {
      return foreign.text;
    }
  }
  return hbdForeignGreetingsWeighted[0].text;
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
    const reply = `${greeting} ${keywordToEcho}`;

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

  // If name is "authorName" but normalized name is empty/invalid, use fallback
  if (baseName === "authorName" && !firstName) {
    baseName = "friend"; // Fallback to generic greeting
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
