/**
 * Helper functions for reply generation
 * Extracted for testability
 */

// Detect special keywords in post text and return the keyword to echo back
export function detectKeywordToEcho(postText: string): string | null {
  const lowerText = postText.toLowerCase();

  // Check for these keywords in order of specificity
  if (lowerText.includes("retards")) return "retards";
  if (lowerText.includes("retard")) return "retard";
  if (lowerText.includes("degens")) return "degens";
  if (lowerText.includes("degen")) return "degen";
  if (lowerText.includes("mf")) return "mf";

  return null;
}

// Detect weekday mentioned in post text and return day index (0=Sunday, 1=Monday, etc.)
export function detectWeekdayInPost(postText: string): number | null {
  const lowerText = postText.toLowerCase();

  // Check for weekday names (in order: Sunday=0, Monday=1, ..., Saturday=6)
  if (lowerText.includes("sunday") || lowerText.includes("sun")) return 0;
  if (lowerText.includes("monday") || lowerText.includes("mon")) return 1;
  if (
    lowerText.includes("tuesday") ||
    lowerText.includes("tue") ||
    lowerText.includes("tues")
  )
    return 2;
  if (lowerText.includes("wednesday") || lowerText.includes("wed")) return 3;
  if (
    lowerText.includes("thursday") ||
    lowerText.includes("thu") ||
    lowerText.includes("thur") ||
    lowerText.includes("thurs")
  )
    return 4;
  if (lowerText.includes("friday") || lowerText.includes("fri")) return 5;
  if (lowerText.includes("saturday") || lowerText.includes("sat")) return 6;

  return null;
}
