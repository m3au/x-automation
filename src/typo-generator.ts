/**
 * Typo generator for human-like typing errors
 */

// QWERTY keyboard proximity map (adjacent keys for each key)
const KEYBOARD_PROXIMITY: Record<string, string[]> = {
  // Top row
  q: ["w", "a", "1", "2"],
  w: ["q", "e", "s", "a", "2", "3"],
  e: ["w", "r", "d", "s", "3", "4"],
  r: ["e", "t", "f", "d", "4", "5"],
  t: ["r", "y", "g", "f", "5", "6"],
  y: ["t", "u", "h", "g", "6", "7"],
  u: ["y", "i", "j", "h", "7", "8"],
  i: ["u", "o", "k", "j", "8", "9"],
  o: ["i", "p", "l", "k", "9", "0"],
  p: ["o", "l", "0", "-"],

  // Home row
  a: ["q", "w", "s", "z"],
  s: ["a", "w", "e", "d", "x", "z"],
  d: ["s", "e", "r", "f", "c", "x"],
  f: ["d", "r", "t", "g", "v", "c"],
  g: ["f", "t", "y", "h", "b", "v"],
  h: ["g", "y", "u", "j", "n", "b"],
  j: ["h", "u", "i", "k", "m", "n"],
  k: ["j", "i", "o", "l", "m"],
  l: ["k", "o", "p"],

  // Bottom row
  z: ["a", "s", "x"],
  x: ["z", "s", "d", "c"],
  c: ["x", "d", "f", "v"],
  v: ["c", "f", "g", "b"],
  b: ["v", "g", "h", "n"],
  n: ["b", "h", "j", "m"],
  m: ["n", "j", "k"],

  // Numbers
  "1": ["2", "q"],
  "2": ["1", "3", "q", "w"],
  "3": ["2", "4", "w", "e"],
  "4": ["3", "5", "e", "r"],
  "5": ["4", "6", "r", "t"],
  "6": ["5", "7", "t", "y"],
  "7": ["6", "8", "y", "u"],
  "8": ["7", "9", "u", "i"],
  "9": ["8", "0", "i", "o"],
  "0": ["9", "-", "o", "p"],

  // Common punctuation
  " ": [" "], // Space rarely typos to other keys
  ",": [".", "m", "k"],
  ".": [",", "m", "l"],
  "!": ["1"],
  "?": ["/"],
};

export interface TypoConfig {
  typoChance: number; // Overall chance to introduce a typo (e.g., 0.02 = 2% per message)
  proximityKeyChance: number; // Chance of proximity key typo (e.g., 0.6 = 60% of typos)
  doubleLetterChance: number; // Chance of doubled letter (e.g., 0.2 = 20% of typos)
  missedLetterChance: number; // Chance of missing letter (e.g., 0.15 = 15% of typos)
  swappedLetterChance: number; // Chance of swapped adjacent letters (e.g., 0.05 = 5% of typos)
}

export const DEFAULT_TYPO_CONFIG: TypoConfig = {
  typoChance: 0.015, // 1.5% chance per reply to have a typo
  proximityKeyChance: 0.6, // 60% of typos are fat-finger proximity
  doubleLetterChance: 0.25, // 25% of typos are doubled letters
  missedLetterChance: 0.1, // 10% of typos are missing letters
  swappedLetterChance: 0.05, // 5% of typos are swapped letters
};

/**
 * Introduce a proximity key typo (fat finger)
 */
function proximityKeyTypo(text: string, position: number): string {
  const char = text[position].toLowerCase();
  const adjacentKeys = KEYBOARD_PROXIMITY[char];

  if (!adjacentKeys || adjacentKeys.length === 0) {
    return text; // No proximity keys available
  }

  // Pick random adjacent key
  const typoChar =
    adjacentKeys[Math.floor(Math.random() * adjacentKeys.length)];

  // Preserve original case
  const replacement =
    text[position] === text[position].toUpperCase()
      ? typoChar.toUpperCase()
      : typoChar;

  return (
    text.substring(0, position) + replacement + text.substring(position + 1)
  );
}

/**
 * Double a letter
 */
function doubleLetterTypo(text: string, position: number): string {
  return (
    text.substring(0, position + 1) +
    text[position] +
    text.substring(position + 1)
  );
}

/**
 * Miss a letter
 */
function missedLetterTypo(text: string, position: number): string {
  if (text.length <= 3) return text; // Don't remove from very short words
  return text.substring(0, position) + text.substring(position + 1);
}

/**
 * Swap two adjacent letters
 */
function swappedLetterTypo(text: string, position: number): string {
  if (position >= text.length - 1) return text; // Can't swap at end
  return (
    text.substring(0, position) +
    text[position + 1] +
    text[position] +
    text.substring(position + 2)
  );
}

/**
 * Introduce a random typo into text
 */
export function introduceTypo(
  text: string,
  config: TypoConfig = DEFAULT_TYPO_CONFIG
): string {
  // Overall chance to introduce a typo
  if (Math.random() > config.typoChance) {
    return text; // No typo
  }

  // Don't introduce typos in very short messages
  if (text.length < 4) {
    return text;
  }

  // Split into words to avoid messing up emojis
  const words = text.split(" ");
  const textWords = words.filter((w) => !/^[\p{Emoji}]+$/u.test(w));

  if (textWords.length === 0) {
    return text; // All emojis, don't typo
  }

  // Pick a random text word to typo
  const targetWord = textWords[Math.floor(Math.random() * textWords.length)];
  const wordIndex = words.indexOf(targetWord);

  // Pick a random position in the word (avoid first/last char for readability)
  if (targetWord.length < 3) {
    return text; // Word too short
  }

  const position = 1 + Math.floor(Math.random() * (targetWord.length - 2)); // Middle positions only

  // Decide typo type based on weighted chances
  const typoRoll = Math.random();
  let typoWord: string;

  if (typoRoll < config.proximityKeyChance) {
    // Proximity key typo (fat finger)
    typoWord = proximityKeyTypo(targetWord, position);
  } else if (typoRoll < config.proximityKeyChance + config.doubleLetterChance) {
    // Double letter
    typoWord = doubleLetterTypo(targetWord, position);
  } else if (
    typoRoll <
    config.proximityKeyChance +
      config.doubleLetterChance +
      config.missedLetterChance
  ) {
    // Missing letter
    typoWord = missedLetterTypo(targetWord, position);
  } else {
    // Swapped letters
    typoWord = swappedLetterTypo(targetWord, position);
  }

  // Replace the word in the original text
  words[wordIndex] = typoWord;
  return words.join(" ");
}
