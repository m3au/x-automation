/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// @ts-expect-error - Bun test types
import { describe, expect, test } from "bun:test";
import {
  escapeRegexPatterns,
  hasSuspiciousUsername,
  parseAbbreviatedNumber,
  parseRelativeTime,
  selectWeighted,
  sleep,
  sleepRange,
} from "../src/utils";

describe("Utils", () => {
  describe("sleep", () => {
    test("should sleep for specified duration", async () => {
      const start = Date.now();
      await sleep(50);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(45); // Allow some variance
      expect(duration).toBeLessThan(100); // Should not be too long
    });

    test("should respect shouldStop callback", async () => {
      let stopCalled = false;
      const shouldStop = () => stopCalled;

      const start = Date.now();
      // Start sleep but stop it after 10ms
      setTimeout(() => {
        stopCalled = true;
      }, 10);

      await sleep(1000, shouldStop);
      const duration = Date.now() - start;

      // Should stop much earlier than 1000ms
      expect(duration).toBeLessThan(200);
    });

    test("should complete even if shouldStop never returns true", async () => {
      const shouldStop = () => false;
      const start = Date.now();
      await sleep(50, shouldStop);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(45);
    });
  });

  describe("sleepRange", () => {
    test("should sleep within the specified range", async () => {
      const min = 50;
      const max = 100;
      const durations: number[] = [];

      // Run multiple times to check it varies
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await sleepRange(min, max);
        const duration = Date.now() - start;
        durations.push(duration);
      }

      // At least some should be different (random)
      const uniqueDurations = new Set(durations.map((d) => Math.floor(d / 10)));
      expect(uniqueDurations.size).toBeGreaterThan(1);

      // All should be roughly within range (allowing for timing variance)
      for (const duration of durations) {
        expect(duration).toBeGreaterThanOrEqual(40);
        expect(duration).toBeLessThan(150);
      }
    });

    test("should respect shouldStop callback", async () => {
      let stopCalled = false;
      const shouldStop = () => stopCalled;

      const start = Date.now();
      setTimeout(() => {
        stopCalled = true;
      }, 10);

      await sleepRange(100, 1000, shouldStop);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe("parseRelativeTime", () => {
    test("should parse hours format (e.g., '2h')", () => {
      const result = parseRelativeTime("2h");
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Date);

      const now = new Date();
      const expectedTime = now.getTime() - 2 * 60 * 60 * 1000;
      const diff = Math.abs(result!.getTime() - expectedTime);
      expect(diff).toBeLessThan(5000); // Allow 5 second variance
    });

    test("should parse days format (e.g., '3d')", () => {
      const result = parseRelativeTime("3d");
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Date);

      const now = new Date();
      const expectedTime = now.getTime() - 3 * 24 * 60 * 60 * 1000;
      const diff = Math.abs(result!.getTime() - expectedTime);
      expect(diff).toBeLessThan(5000);
    });

    test("should parse month-day format (e.g., 'Jan 15')", () => {
      const result = parseRelativeTime("Jan 15");
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Date);

      // Should be in current year or last year if date hasn't happened yet
      const now = new Date();
      const year = result!.getFullYear();
      expect([now.getFullYear(), now.getFullYear() - 1]).toContain(year);
      expect(result!.getMonth()).toBe(0); // January is month 0
      expect(result!.getDate()).toBe(15);
    });

    test("should parse full date format (e.g., 'Jan 15, 2023')", () => {
      const result = parseRelativeTime("Jan 15, 2023");
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2023);
      expect(result!.getMonth()).toBe(0); // January
      expect(result!.getDate()).toBe(15);
    });

    test("should handle invalid formats gracefully", () => {
      expect(parseRelativeTime("invalid")).toBeNull();
      expect(parseRelativeTime("")).toBeNull();
      expect(parseRelativeTime("abc")).toBeNull();
      expect(parseRelativeTime("12")).toBeNull();
    });

    test("should handle edge cases", () => {
      // Very large hours
      const result1 = parseRelativeTime("1000h");
      expect(result1).not.toBeNull();

      // Very large days
      const result2 = parseRelativeTime("365d");
      expect(result2).not.toBeNull();

      // Future month-day should use previous year
      const now = new Date();
      const futureMonth = now.getMonth() + 2; // 2 months from now
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[futureMonth % 12];
      const result3 = parseRelativeTime(`${monthName} 15`);
      if (result3) {
        // Should be in past (last year if in future)
        expect(result3.getTime()).toBeLessThanOrEqual(now.getTime());
      }
    });
  });

  describe("parseAbbreviatedNumber", () => {
    test("should parse plain numbers", () => {
      expect(parseAbbreviatedNumber("259")).toBe(259);
      expect(parseAbbreviatedNumber("1000")).toBe(1000);
      expect(parseAbbreviatedNumber("0")).toBe(0);
      expect(parseAbbreviatedNumber("12345")).toBe(12345);
    });

    test("should parse K suffix", () => {
      expect(parseAbbreviatedNumber("12K")).toBe(12000);
      expect(parseAbbreviatedNumber("1.5K")).toBe(1500);
      expect(parseAbbreviatedNumber("0.5K")).toBe(500);
      expect(parseAbbreviatedNumber("999K")).toBe(999000);
    });

    test("should parse M suffix", () => {
      expect(parseAbbreviatedNumber("1M")).toBe(1000000);
      expect(parseAbbreviatedNumber("1.5M")).toBe(1500000);
      expect(parseAbbreviatedNumber("2.3M")).toBe(2300000);
      expect(parseAbbreviatedNumber("0.1M")).toBe(100000);
    });

    test("should be case insensitive for suffixes", () => {
      expect(parseAbbreviatedNumber("12k")).toBe(12000);
      expect(parseAbbreviatedNumber("1m")).toBe(1000000);
      expect(parseAbbreviatedNumber("12K")).toBe(12000);
      expect(parseAbbreviatedNumber("1M")).toBe(1000000);
    });

    test("should handle numbers with commas", () => {
      expect(parseAbbreviatedNumber("1,234")).toBe(1234);
      expect(parseAbbreviatedNumber("12,345K")).toBe(12345000);
      expect(parseAbbreviatedNumber("1,234.5K")).toBe(1234500);
    });

    test("should handle whitespace", () => {
      expect(parseAbbreviatedNumber(" 12K ")).toBe(12000);
      expect(parseAbbreviatedNumber("12 K")).toBe(12000);
      expect(parseAbbreviatedNumber("  1.5M  ")).toBe(1500000);
    });

    test("should return null for invalid formats", () => {
      expect(parseAbbreviatedNumber("abc")).toBeNull();
      expect(parseAbbreviatedNumber("K")).toBeNull();
      expect(parseAbbreviatedNumber("M")).toBeNull();
      expect(parseAbbreviatedNumber("")).toBeNull();
      expect(parseAbbreviatedNumber("12X")).toBeNull(); // Invalid suffix
      expect(parseAbbreviatedNumber("abc123")).toBeNull();
    });

    test("should floor decimal results", () => {
      expect(parseAbbreviatedNumber("12.7K")).toBe(12700); // Not 12700.0
      expect(parseAbbreviatedNumber("1.234M")).toBe(1234000);
    });
  });

  describe("hasSuspiciousUsername", () => {
    test("should detect 6+ consecutive digits", () => {
      expect(hasSuspiciousUsername("user123456")).toBe(true);
      expect(hasSuspiciousUsername("abc123456789")).toBe(true);
      expect(hasSuspiciousUsername("1234567890")).toBe(true);
    });

    test("should NOT detect less than 5 consecutive digits", () => {
      expect(hasSuspiciousUsername("user1234")).toBe(false); // 4 digits
      expect(hasSuspiciousUsername("abc1234def")).toBe(false); // 4 digits in middle
      // Note: 5+ consecutive digits anywhere will be detected by Pattern 2
      // Note: 5+ digits at end will be detected by Pattern 5
    });

    test("should detect random character sequences with 5+ digits", () => {
      expect(hasSuspiciousUsername("abc12345xyz")).toBe(true);
      expect(hasSuspiciousUsername("12345abc")).toBe(true);
      expect(hasSuspiciousUsername("xyz123456")).toBe(true);
    });

    test("should NOT detect sequences with less than 5 consecutive digits", () => {
      expect(hasSuspiciousUsername("abc1234xyz")).toBe(false);
      expect(hasSuspiciousUsername("Francesca333L")).toBe(false); // Example from code
    });

    test("should detect 3+ underscores with numbers", () => {
      expect(hasSuspiciousUsername("user_123_456_789")).toBe(true); // 3 underscores
      expect(hasSuspiciousUsername("abc_xyz_123_456")).toBe(true); // 3 underscores
      expect(hasSuspiciousUsername("a_1_b_2_c_3")).toBe(true); // 5 underscores
    });

    test("should NOT detect 2 underscores", () => {
      expect(hasSuspiciousUsername("user_123_abc")).toBe(false);
    });

    test("should detect very long usernames (>25 chars) with numbers", () => {
      expect(hasSuspiciousUsername("verylongusernamethat12345")).toBe(true); // 26 chars with numbers
      expect(hasSuspiciousUsername("a".repeat(26) + "123")).toBe(true); // 29 chars with numbers
      expect(hasSuspiciousUsername("verylongusernamethat1234")).toBe(false); // Exactly 25 chars, need >25
    });

    test("should NOT detect long usernames without numbers", () => {
      expect(hasSuspiciousUsername("a".repeat(30))).toBe(false);
    });

    test("should detect usernames ending with 5+ numbers", () => {
      expect(hasSuspiciousUsername("user12345")).toBe(true);
      expect(hasSuspiciousUsername("abc123456")).toBe(true);
    });

    test("should NOT detect usernames ending with less than 5 numbers", () => {
      expect(hasSuspiciousUsername("user1234")).toBe(false);
    });

    test("should detect random-looking letter-number alternations (6+)", () => {
      expect(hasSuspiciousUsername("a1b2c3d4e5f6")).toBe(true);
      expect(hasSuspiciousUsername("1a2b3c4d5e6f")).toBe(true);
    });

    test("should NOT detect fewer alternations", () => {
      expect(hasSuspiciousUsername("a1b2c3")).toBe(false);
    });

    test("should detect mostly numeric usernames (70%+)", () => {
      expect(hasSuspiciousUsername("1234567890")).toBe(true);
      expect(hasSuspiciousUsername("user1234567890")).toBe(true); // 10/14 digits = 71%
      expect(hasSuspiciousUsername("abc1234567")).toBe(true); // 7/10 digits = 70%
    });

    test("should NOT detect usernames with less than 70% digits", () => {
      expect(hasSuspiciousUsername("user1234")).toBe(false); // 4/8 = 50%
      expect(hasSuspiciousUsername("abc123")).toBe(false); // 3/6 = 50%
    });

    test("should allow normal usernames", () => {
      expect(hasSuspiciousUsername("alice")).toBe(false);
      expect(hasSuspiciousUsername("bob123")).toBe(false);
      expect(hasSuspiciousUsername("john_doe")).toBe(false);
      expect(hasSuspiciousUsername("sarah123")).toBe(false);
      expect(hasSuspiciousUsername("user_name")).toBe(false);
    });
  });

  describe("selectWeighted", () => {
    test("should select from weighted array", () => {
      const items = [
        { text: "a", weight: 1 },
        { text: "b", weight: 1 },
        { text: "c", weight: 1 },
      ];

      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(selectWeighted(items));
      }

      // Should have selected all items at least once
      expect(results.has("a")).toBe(true);
      expect(results.has("b")).toBe(true);
      expect(results.has("c")).toBe(true);
    });

    test("should respect weights", () => {
      const items = [
        { text: "rare", weight: 1 },
        { text: "common", weight: 99 },
      ];

      const results: string[] = [];
      for (let i = 0; i < 1000; i++) {
        results.push(selectWeighted(items));
      }

      const rareCount = results.filter((r) => r === "rare").length;
      const commonCount = results.filter((r) => r === "common").length;

      // Common should be selected much more often
      expect(commonCount).toBeGreaterThan(rareCount * 50);
    });

    test("should handle single item", () => {
      const items = [{ text: "only", weight: 1 }];
      expect(selectWeighted(items)).toBe("only");
    });

    test("should throw error on empty array", () => {
      expect(() => selectWeighted([])).toThrow(
        "Cannot select from empty array"
      );
    });

    test("should handle zero weights", () => {
      const items = [
        { text: "a", weight: 0 },
        { text: "b", weight: 1 },
        { text: "c", weight: 0 },
      ];

      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(selectWeighted(items));
      }

      // Should only select 'b'
      expect(results.has("a")).toBe(false);
      expect(results.has("b")).toBe(true);
      expect(results.has("c")).toBe(false);
    });

    test("should work with different types", () => {
      const stringItems = [
        { text: "hello", weight: 1 },
        { text: "world", weight: 1 },
      ];
      const result1 = selectWeighted(stringItems);
      expect(["hello", "world"]).toContain(result1);

      const numberItems = [
        { text: 1, weight: 1 },
        { text: 2, weight: 1 },
      ];
      const result2 = selectWeighted(numberItems);
      expect([1, 2]).toContain(result2);
    });
  });

  describe("escapeRegexPatterns", () => {
    test("should escape special regex characters", () => {
      const patterns = ["hello", "world"];
      const result = escapeRegexPatterns(patterns);
      expect(result).toBe("hello|world");
    });

    test("should escape special characters in patterns", () => {
      const patterns = ["test.com", "user@domain"];
      const result = escapeRegexPatterns(patterns);
      expect(result).toBe("test\\.com|user@domain");
    });

    test("should handle all regex special characters", () => {
      const patterns = [
        "test$",
        "(group)",
        "*star",
        "+plus",
        ".dot",
        "?optional",
        "[bracket]",
        "\\backslash",
        "^start",
        "{brace}",
        "|pipe",
      ];

      const result = escapeRegexPatterns(patterns);
      // All special chars should be escaped
      expect(result).toContain("test\\$");
      expect(result).toContain("\\(group\\)");
      expect(result).toContain("\\*star");
      expect(result).toContain("\\+plus");
      expect(result).toContain("\\.dot");
      expect(result).toContain("\\?optional");
      expect(result).toContain("\\[bracket\\]");
      expect(result).toContain("\\\\backslash");
      expect(result).toContain("\\^start");
      expect(result).toContain("\\{brace\\}");
      expect(result).toContain("\\|pipe");
    });

    test("should handle empty array", () => {
      expect(escapeRegexPatterns([])).toBe("");
    });

    test("should handle single pattern", () => {
      expect(escapeRegexPatterns(["test"])).toBe("test");
      expect(escapeRegexPatterns(["test.com"])).toBe("test\\.com");
    });

    test("should join multiple patterns with |", () => {
      const patterns = ["a", "b", "c"];
      const result = escapeRegexPatterns(patterns);
      expect(result.split("|")).toHaveLength(3);
    });

    test("should preserve non-special characters", () => {
      const patterns = ["hello123", "world_abc"];
      const result = escapeRegexPatterns(patterns);
      expect(result).toBe("hello123|world_abc");
    });
  });
});

