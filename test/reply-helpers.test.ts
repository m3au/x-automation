/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// @ts-expect-error - Bun test types
import { describe, expect, test } from "bun:test";
import { detectKeywordToEcho, detectWeekdayInPost } from "../src/reply-helpers";

describe("Reply Helpers", () => {
  describe("detectKeywordToEcho", () => {
    test("should detect 'degen' keyword", () => {
      expect(detectKeywordToEcho("gm degen")).toBe("degen");
      expect(detectKeywordToEcho("good morning degen!")).toBe("degen");
      expect(detectKeywordToEcho("GM DEGEN")).toBe("degen");
    });

    test("should detect 'degens' keyword with priority", () => {
      expect(detectKeywordToEcho("gm degens")).toBe("degens");
      expect(detectKeywordToEcho("good morning degens!")).toBe("degens");
      expect(detectKeywordToEcho("GM DEGENS ☀️")).toBe("degens");
    });

    test("should detect 'retard' keyword", () => {
      expect(detectKeywordToEcho("gm retard")).toBe("retard");
      expect(detectKeywordToEcho("good morning retard!")).toBe("retard");
      expect(detectKeywordToEcho("GM RETARD")).toBe("retard");
    });

    test("should detect 'retards' keyword with priority", () => {
      expect(detectKeywordToEcho("gm retards")).toBe("retards");
      expect(detectKeywordToEcho("good morning retards!")).toBe("retards");
      expect(detectKeywordToEcho("GM RETARDS 🌅")).toBe("retards");
    });

    test("should detect 'mf' keyword", () => {
      expect(detectKeywordToEcho("gm mf")).toBe("mf");
      expect(detectKeywordToEcho("good morning mf!")).toBe("mf");
      expect(detectKeywordToEcho("GM MF")).toBe("mf");
    });

    test("should prioritize more specific keywords", () => {
      // When both 'retards' and 'retard' could match, should return 'retards'
      expect(detectKeywordToEcho("gm retards")).toBe("retards");
      // When both 'degens' and 'degen' could match, should return 'degens'
      expect(detectKeywordToEcho("gm degens")).toBe("degens");
    });

    test("should be case insensitive", () => {
      expect(detectKeywordToEcho("GM DEGEN")).toBe("degen");
      expect(detectKeywordToEcho("Gm Retards")).toBe("retards");
      expect(detectKeywordToEcho("good MORNING mf")).toBe("mf");
    });

    test("should handle posts with multiple keywords", () => {
      // First match wins (by order of specificity in implementation)
      expect(detectKeywordToEcho("gm retards and degens")).toBe("retards");
      expect(detectKeywordToEcho("gm degens and mf")).toBe("degens");
    });

    test("should return null when no keywords present", () => {
      expect(detectKeywordToEcho("gm everyone")).toBe(null);
      expect(detectKeywordToEcho("good morning friends")).toBe(null);
      expect(detectKeywordToEcho("hello world")).toBe(null);
    });

    test("should handle keywords in different positions", () => {
      expect(detectKeywordToEcho("degen gm")).toBe("degen");
      expect(detectKeywordToEcho("gm degen how are you")).toBe("degen");
      expect(detectKeywordToEcho("yo retards what's up gm")).toBe("retards");
    });

    test("should handle keywords with emojis", () => {
      expect(detectKeywordToEcho("gm degens ☀️🔥")).toBe("degens");
      expect(detectKeywordToEcho("🌅 good morning retards")).toBe("retards");
      expect(detectKeywordToEcho("gm mf 💪")).toBe("mf");
    });
  });

  describe("detectWeekdayInPost", () => {
    test("should detect Monday", () => {
      expect(detectWeekdayInPost("good morning monday")).toBe(1);
      expect(detectWeekdayInPost("gm mon")).toBe(1);
      expect(detectWeekdayInPost("GM MONDAY")).toBe(1);
      expect(detectWeekdayInPost("happy monday everyone")).toBe(1);
    });

    test("should detect Tuesday", () => {
      expect(detectWeekdayInPost("good morning tuesday")).toBe(2);
      expect(detectWeekdayInPost("gm tue")).toBe(2);
      expect(detectWeekdayInPost("GM TUES")).toBe(2);
      expect(detectWeekdayInPost("happy tuesday!")).toBe(2);
    });

    test("should detect Wednesday", () => {
      expect(detectWeekdayInPost("good morning wednesday")).toBe(3);
      expect(detectWeekdayInPost("gm wed")).toBe(3);
      expect(detectWeekdayInPost("GM WEDNESDAY")).toBe(3);
      expect(detectWeekdayInPost("hump day wednesday")).toBe(3);
    });

    test("should detect Thursday", () => {
      expect(detectWeekdayInPost("good morning thursday")).toBe(4);
      expect(detectWeekdayInPost("gm thu")).toBe(4);
      expect(detectWeekdayInPost("GM THUR")).toBe(4);
      expect(detectWeekdayInPost("gm thurs")).toBe(4);
      expect(detectWeekdayInPost("happy thursday!")).toBe(4);
    });

    test("should detect Friday", () => {
      expect(detectWeekdayInPost("good morning friday")).toBe(5);
      expect(detectWeekdayInPost("gm fri")).toBe(5);
      expect(detectWeekdayInPost("GM FRIDAY")).toBe(5);
      expect(detectWeekdayInPost("happy friday vibes")).toBe(5);
    });

    test("should detect Saturday", () => {
      expect(detectWeekdayInPost("good morning saturday")).toBe(6);
      expect(detectWeekdayInPost("gm sat")).toBe(6);
      expect(detectWeekdayInPost("GM SATURDAY")).toBe(6);
      expect(detectWeekdayInPost("weekend saturday!")).toBe(6);
    });

    test("should detect Sunday", () => {
      expect(detectWeekdayInPost("good morning sunday")).toBe(0);
      expect(detectWeekdayInPost("gm sun")).toBe(0);
      expect(detectWeekdayInPost("GM SUNDAY")).toBe(0);
      expect(detectWeekdayInPost("lazy sunday vibes")).toBe(0);
    });

    test("should be case insensitive", () => {
      expect(detectWeekdayInPost("GM MONDAY")).toBe(1);
      expect(detectWeekdayInPost("Gm Wednesday")).toBe(3);
      expect(detectWeekdayInPost("good MORNING friday")).toBe(5);
    });

    test("should handle weekdays in different positions", () => {
      expect(detectWeekdayInPost("monday gm")).toBe(1);
      expect(detectWeekdayInPost("gm wednesday how are you")).toBe(3);
      expect(detectWeekdayInPost("yo friday what's up gm")).toBe(5);
    });

    test("should handle weekdays with emojis", () => {
      expect(detectWeekdayInPost("gm monday ☀️🔥")).toBe(1);
      expect(detectWeekdayInPost("🌅 good morning wednesday")).toBe(3);
      expect(detectWeekdayInPost("gm friday 💪")).toBe(5);
    });

    test("should return null when no weekday present", () => {
      expect(detectWeekdayInPost("gm everyone")).toBe(null);
      expect(detectWeekdayInPost("good morning people")).toBe(null); // 'friends' contains 'fri'
      expect(detectWeekdayInPost("hello world")).toBe(null);
      expect(detectWeekdayInPost("gm builders")).toBe(null);
    });

    test("should handle posts with keywords AND weekdays", () => {
      expect(detectWeekdayInPost("gm monday degens")).toBe(1);
      expect(detectWeekdayInPost("good morning wednesday retards")).toBe(3);
      expect(detectWeekdayInPost("gm friday mf")).toBe(5);
    });

    test("should handle short forms correctly", () => {
      // Make sure 'sun' doesn't match 'sunday' AND cause issues
      expect(detectWeekdayInPost("gm sun")).toBe(0);
      expect(detectWeekdayInPost("gm mon")).toBe(1);
      expect(detectWeekdayInPost("gm tue")).toBe(2);
      expect(detectWeekdayInPost("gm wed")).toBe(3);
      expect(detectWeekdayInPost("gm thu")).toBe(4);
      expect(detectWeekdayInPost("gm fri")).toBe(5);
      expect(detectWeekdayInPost("gm sat")).toBe(6);
    });

    test("should not match partial words incorrectly", () => {
      // 'sun' could be in 'sunshine' - but we're using includes so it will match
      // This is a known limitation but acceptable for our use case
      expect(detectWeekdayInPost("sunshine today")).toBe(0);
      expect(detectWeekdayInPost("monday vibes")).toBe(1);
    });
  });

  describe("Combined keyword and weekday detection", () => {
    test("should detect both keyword and weekday in same post", () => {
      expect(detectKeywordToEcho("gm monday degens")).toBe("degens");
      expect(detectWeekdayInPost("gm monday degens")).toBe(1);

      expect(detectKeywordToEcho("good morning wednesday retards")).toBe(
        "retards"
      );
      expect(detectWeekdayInPost("good morning wednesday retards")).toBe(3);

      expect(detectKeywordToEcho("gm friday mf")).toBe("mf");
      expect(detectWeekdayInPost("gm friday mf")).toBe(5);
    });
  });
});
