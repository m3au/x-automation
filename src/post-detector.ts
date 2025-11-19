/**
 * Post detection utilities for identifying GM, GN, GA, GE, and HBD posts
 */

import { escapeRegexPatterns } from "./utils";

/**
 * Checks if a post is a GM (Good Morning) post
 */
export function isGMPost(
  postText: string,
  patterns: readonly string[]
): boolean {
  const escapedPatterns = escapeRegexPatterns(patterns);
  const gmPattern = new RegExp(`\\b(?:${escapedPatterns})\\b`, "i");
  return gmPattern.test(postText);
}

/**
 * Checks if a post is a GN (Good Night) post
 */
export function isGNPost(
  postText: string,
  patterns: readonly string[]
): boolean {
  const escapedPatterns = escapeRegexPatterns(patterns);
  const gnPattern = new RegExp(`\\b(?:${escapedPatterns})\\b`, "i");
  return gnPattern.test(postText);
}

/**
 * Checks if a post is a GA (Good Afternoon) post
 */
export function isGAPost(
  postText: string,
  patterns: readonly string[]
): boolean {
  const escapedPatterns = escapeRegexPatterns(patterns);
  const gaPattern = new RegExp(`\\b(?:${escapedPatterns})\\b`, "i");
  return gaPattern.test(postText);
}

/**
 * Checks if a post is a GE (Good Evening) post
 */
export function isGEPost(
  postText: string,
  patterns: readonly string[]
): boolean {
  const escapedPatterns = escapeRegexPatterns(patterns);
  const gePattern = new RegExp(`\\b(?:${escapedPatterns})\\b`, "i");
  return gePattern.test(postText);
}

/**
 * Checks if a post is a HBD (Happy Birthday) post
 */
export function isHBDPost(
  postText: string,
  patterns: readonly string[]
): boolean {
  const escapedPatterns = escapeRegexPatterns(patterns);
  const hbdPattern = new RegExp(`\\b(?:${escapedPatterns})\\b`, "i");
  return hbdPattern.test(postText);
}
