/**
 * General utility functions shared across scripts
 */

/**
 * Sleep for a specified duration (in milliseconds)
 * Checks shouldStop every 100ms to allow interruption
 */
export async function sleep(
  ms: number,
  shouldStop?: () => boolean
): Promise<void> {
  return new Promise((resolve) => {
    if (shouldStop?.()) {
      resolve();
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (shouldStop?.() || Date.now() - startTime >= ms) {
        clearInterval(interval);
        resolve();
      }
    }, 100); // Check every 100ms for shouldStop
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, ms);
  });
}

/**
 * Sleep for a random duration within the given range (in milliseconds)
 * Checks shouldStop every 100ms to allow interruption
 */
export async function sleepRange(
  min: number,
  max: number,
  shouldStop?: () => boolean
): Promise<void> {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(duration, shouldStop);
}

/**
 * Parse relative time strings (e.g., "2h", "3d", "Jan 15") to Date
 */
export function parseRelativeTime(timeText: string): Date | null {
  const now = new Date();

  // Handle hours (e.g., "2h")
  const hoursMatch = timeText.match(/^(\d+)h$/);
  if (hoursMatch) {
    const hours = Number.parseInt(hoursMatch[1], 10);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  // Handle days (e.g., "3d")
  const daysMatch = timeText.match(/^(\d+)d$/);
  if (daysMatch) {
    const days = Number.parseInt(daysMatch[1], 10);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Handle "Jan 15" format (assumes current year unless specified)
  const monthDayMatch = timeText.match(/^([A-Z][a-z]{2})\s+(\d+)$/);
  if (monthDayMatch) {
    const monthStr = monthDayMatch[1];
    const day = Number.parseInt(monthDayMatch[2], 10);
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[monthStr];
    if (month !== undefined) {
      const year = now.getFullYear();
      const date = new Date(year, month, day);
      // If date is in the future, assume it's from last year
      if (date > now) {
        date.setFullYear(year - 1);
      }
      return date;
    }
  }

  // Handle "Jan 15, 2023" format
  const fullDateMatch = timeText.match(/^([A-Z][a-z]{2})\s+(\d+),\s+(\d{4})$/);
  if (fullDateMatch) {
    const monthStr = fullDateMatch[1];
    const day = Number.parseInt(fullDateMatch[2], 10);
    const year = Number.parseInt(fullDateMatch[3], 10);
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[monthStr];
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  console.warn(`⚠️ Could not parse time: "${timeText}"`);
  return null;
}

/**
 * Parse a number string that may contain abbreviations (K, M)
 * Examples: "12.1K" -> 12100, "1.5M" -> 1500000, "259" -> 259
 */
export function parseAbbreviatedNumber(text: string): number | null {
  const trimmed = text.trim().replaceAll(",", "");

  // Match number with optional decimal and optional K/M suffix
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([KMkm])?$/);
  if (!match) {
    return null;
  }

  const number = Number.parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();

  if (suffix === "K") {
    return Math.floor(number * 1000);
  }
  if (suffix === "M") {
    return Math.floor(number * 1_000_000);
  }

  return Math.floor(number);
}

/**
 * Check if a username matches suspicious bot patterns
 */
export function hasSuspiciousUsername(username: string): boolean {
  // Pattern 1: Many consecutive numbers (e.g., user123456, abc123456789)
  // Require 6+ consecutive digits (not 5) to be more tolerant
  if (/\d{6,}/.test(username)) {
    return true;
  }

  // Pattern 2: Random character sequences with numbers
  // Require 5+ consecutive digits (not 4) to avoid false positives like "Francesca333L"
  if (/[a-z]{3,}\d{5,}/i.test(username) || /\d{5,}[a-z]{3,}/i.test(username)) {
    return true;
  }

  // Pattern 3: Multiple underscores with numbers (e.g., user_123_456, abc_xyz_123)
  // Require 3+ underscores (not 2) to be more tolerant
  const underscoreCount = (username.match(/_/g) || []).length;
  if (underscoreCount >= 3 && /\d/.test(username)) {
    return true;
  }

  // Pattern 4: Very long usernames (> 25 chars, not 20) with numbers
  if (username.length > 25 && /\d/.test(username)) {
    return true;
  }

  // Pattern 5: Ends with 5+ numbers (not 4) to avoid false positives
  if (/\d{5,}$/.test(username)) {
    return true;
  }

  // Pattern 6: Random-looking sequences (mix of letters and numbers in random order)
  // Require 6+ alternations (not 5) to avoid false positives
  const letterNumberPattern = /[a-z]\d|\d[a-z]/gi;
  const matches = username.match(letterNumberPattern) || [];
  if (matches.length >= 6) {
    return true;
  }

  // Pattern 7: All numbers or mostly numbers (e.g., 1234567890, user123456789)
  // Require 70% digits (not 60%) to be more tolerant
  const digitCount = (username.match(/\d/g) || []).length;
  if (digitCount >= username.length * 0.7 && username.length > 5) {
    return true;
  }

  return false;
}

/**
 * Select a random item from a weighted array
 * @param items Array of items with weights: [{text: T, weight: number}, ...]
 * @returns The selected item's text property
 */
export function selectWeighted<T>(
  items: Array<{ text: T; weight: number }>
): T {
  if (items.length === 0) {
    throw new Error("Cannot select from empty array");
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.text;
    }
  }

  return items[0].text;
}

/**
 * Escape regex special characters in patterns and join them with |
 * Used for creating regex patterns from string arrays
 * @param patterns Array of pattern strings to escape and join
 * @returns Escaped and joined pattern string ready for regex
 */
export function escapeRegexPatterns(patterns: readonly string[]): string {
  return patterns
    .map((p) => p.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&"))
    .join("|");
}
