/**
 * Helper functions for reply generation
 * Extracted for testability
 */

// Detect if post contains obvious crypto/trading content
export function detectCryptoTradingContent(postText: string): boolean {
  const lowerText = postText.toLowerCase();

  // Common crypto/trading terms that indicate degen content
  const cryptoTerms = [
    "btc",
    "eth",
    "sol",
    "coin",
    "token",
    "nft",
    "crypto",
    "blockchain",
    "defi",
    "yield",
    "liquidity",
    "staking",
    "airdrop",
    "whitelist",
    "presale",
    "ico",
    "moon",
    "pump",
    "dump",
    "hodl",
    "to the moon",
    "wen",
    "bullish",
    "bearish",
    "trading",
    "chart",
    "technical analysis",
    "support",
    "resistance",
    "breakout",
    "altcoin",
    "alt coin",
    "shitcoin",
    "shit coin",
    "memecoin",
    "meme coin",
    "pump it",
    "buy the dip",
    "sell the news",
    "whale",
    "diamond hands",
    "paper hands",
    "rekt",
    "bagholder",
    "gas fees",
    "uniswap",
    "pancakeswap",
    "swap",
    "bridge",
    "satoshi",
    "wei",
    "gwei",
  ];

  // Check if any crypto terms are present
  for (const term of cryptoTerms) {
    if (lowerText.includes(term)) {
      return true;
    }
  }

  // Check for common patterns like "$COIN" or coin tickers
  // Pattern: $ followed by 2-5 uppercase letters (common for crypto tickers)
  if (/\$\b[A-Z]{2,5}\b/.test(postText)) {
    return true;
  }

  // Check for coin price mentions (e.g., "$0.0001", "up 100%", "+500%")
  if (/\$\d+\.?\d*\s*(?:usd|usdt|usdc)/i.test(lowerText)) {
    return true;
  }
  if (/(?:up|down|gained|lost)\s+\d+%/.test(lowerText)) {
    return true;
  }
  if (/\+\d+%/i.test(postText)) {
    return true;
  }

  return false;
}

// Detect special keywords in post text and return the keyword to echo back
export function detectKeywordToEcho(postText: string): string | null {
  const lowerText = postText.toLowerCase();

  // First, check if post contains crypto/trading content -> reply with "degen"
  if (detectCryptoTradingContent(postText)) {
    return "degen";
  }

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
