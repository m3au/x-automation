/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// @ts-expect-error - Bun test types
import { describe, expect, test } from "bun:test";

import { introduceTypo } from "../src/typo-generator";

describe("Typo Generator", () => {
  describe("introduceTypo", () => {
    test("should sometimes return original text (based on typoChance)", () => {
      // With 0% typo chance, should never modify
      const config = {
        typoChance: 0,
        proximityKeyChance: 1,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      for (let i = 0; i < 50; i++) {
        const result = introduceTypo("good morning friend", config);
        expect(result).toBe("good morning friend");
      }
    });

    test("should introduce typos with 100% chance", () => {
      const config = {
        typoChance: 1, // Always typo
        proximityKeyChance: 1,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      const results = new Set<string>();
      for (let i = 0; i < 30; i++) {
        const result = introduceTypo("good morning friend", config);
        results.add(result);
      }

      // Should have some variations (not all the same)
      expect(results.size).toBeGreaterThan(1);
    });

    test("should preserve emojis", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 1,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      for (let i = 0; i < 20; i++) {
        const result = introduceTypo("gm friend ☀️", config);
        expect(result).toContain("☀️"); // Emoji should be preserved
      }
    });

    test("should not modify very short messages", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 1,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      expect(introduceTypo("gm", config)).toBe("gm"); // Too short
      expect(introduceTypo("hi", config)).toBe("hi"); // Too short
    });

    test("should handle double letter typos", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 0,
        doubleLetterChance: 1, // Always double
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const result = introduceTypo("good morning", config);
        results.push(result);
      }

      // Should have some doubled letters
      const hasDoubles = results.some(
        (r) =>
          r.includes("oo") ||
          r.includes("dd") ||
          r.includes("mm") ||
          r.includes("rr") ||
          r.includes("nn") ||
          r.includes("ii") ||
          r.includes("gg")
      );
      expect(hasDoubles).toBe(true);
    });

    test("should handle missing letter typos", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 0,
        doubleLetterChance: 0,
        missedLetterChance: 1, // Always miss
        swappedLetterChance: 0,
      };

      for (let i = 0; i < 20; i++) {
        const result = introduceTypo("good morning", config);
        // Should be shorter (missing a letter)
        expect(result.replaceAll(/\s+/g, "").length).toBeLessThan(
          "goodmorning".length
        );
      }
    });

    test("should handle swapped letter typos", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 0,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 1, // Always swap
      };

      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const result = introduceTypo("good morning", config);
        results.push(result);
        // Length should stay the same (just swapped)
        expect(result.replaceAll(/\s+/g, "").length).toBe("goodmorning".length);
      }

      // Should have variations
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    test("should handle real-world reply examples", () => {
      const config = {
        typoChance: 1, // Always typo for testing
        proximityKeyChance: 0.6,
        doubleLetterChance: 0.25,
        missedLetterChance: 0.1,
        swappedLetterChance: 0.05,
      };

      const originalReplies = [
        "gm friend",
        "good morning degens",
        "gn retards",
        "ga fam",
        "good evening everyone",
      ];

      for (const original of originalReplies) {
        const results = new Set<string>();
        for (let i = 0; i < 30; i++) {
          const typoVersion = introduceTypo(original, config);
          results.add(typoVersion);
        }

        // Should have some variations
        expect(results.size).toBeGreaterThan(1);

        // Original might still appear (random chance)
        console.log(
          `"${original}" → samples: ${Array.from(results).slice(0, 5).join(", ")}`
        );
      }
    });

    test("should not break emoji-only messages", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 1,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      expect(introduceTypo("☀️ 🌞 😎", config)).toBe("☀️ 🌞 😎");
      expect(introduceTypo("😂", config)).toBe("😂");
    });

    test("should maintain reasonable readability", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 0.6,
        doubleLetterChance: 0.25,
        missedLetterChance: 0.1,
        swappedLetterChance: 0.05,
      };

      // Even with typos, should only affect one character per call
      for (let i = 0; i < 20; i++) {
        const result = introduceTypo("good morning", config);
        // Length difference should be at most 1 (or 0 for swaps/proximity)
        const lengthDiff = Math.abs(result.length - "good morning".length);
        expect(lengthDiff).toBeLessThanOrEqual(1);
      }
    });

    test("should handle uppercase letters", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 1,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const result = introduceTypo("GOOD MORNING", config);
        results.push(result);
      }

      // Should have variations and preserve some uppercase
      expect(new Set(results).size).toBeGreaterThan(1);
    });

    test("should avoid modifying very short words", () => {
      const config = {
        typoChance: 1,
        proximityKeyChance: 1,
        doubleLetterChance: 0,
        missedLetterChance: 0,
        swappedLetterChance: 0,
      };

      // Words with <3 chars should not be modified
      expect(introduceTypo("gm", config)).toBe("gm");
      expect(introduceTypo("hi", config)).toBe("hi");
      expect(introduceTypo("ok", config)).toBe("ok");
    });
  });
});

