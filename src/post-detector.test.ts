import { describe, expect, test } from "bun:test";
import { isGAPost, isGMPost, isGNPost } from "./post-detector";

import { gaPatterns } from "./ga-patterns";
import { gmPatterns } from "./gm-patterns";
import { gnPatterns } from "./gn-patterns";

describe("Post Detection", () => {
  describe("isGMPost", () => {
    test("should detect 'gm' as GM post", () => {
      expect(isGMPost("gm everyone!", gmPatterns)).toBe(true);
      expect(isGMPost("GM fam", gmPatterns)).toBe(true);
      expect(isGMPost("gm gm", gmPatterns)).toBe(true);
    });

    test("should detect 'good morning' as GM post", () => {
      expect(isGMPost("good morning friends", gmPatterns)).toBe(true);
      expect(isGMPost("Good Morning everyone!", gmPatterns)).toBe(true);
    });

    test("should be case insensitive", () => {
      expect(isGMPost("GM", gmPatterns)).toBe(true);
      expect(isGMPost("Gm", gmPatterns)).toBe(true);
      expect(isGMPost("gM", gmPatterns)).toBe(true);
    });

    test("should require word boundaries", () => {
      expect(isGMPost("gmail is not a greeting", gmPatterns)).toBe(false);
      expect(isGMPost("dogma", gmPatterns)).toBe(false);
    });

    test("should not detect GN posts", () => {
      expect(isGMPost("gn everyone", gmPatterns)).toBe(false);
      expect(isGMPost("good night", gmPatterns)).toBe(false);
    });

    test("should not detect GA posts", () => {
      expect(isGMPost("ga fam", gmPatterns)).toBe(false);
      expect(isGMPost("good afternoon", gmPatterns)).toBe(false);
    });

    test("should handle emoji and special characters", () => {
      expect(isGMPost("gm ☀️", gmPatterns)).toBe(true);
      expect(isGMPost("🌅 good morning!", gmPatterns)).toBe(true);
    });
  });

  describe("isGNPost", () => {
    test("should detect 'gn' as GN post", () => {
      expect(isGNPost("gn everyone!", gnPatterns)).toBe(true);
      expect(isGNPost("GN fam", gnPatterns)).toBe(true);
      expect(isGNPost("gn gn", gnPatterns)).toBe(true);
    });

    test("should detect 'good night' as GN post", () => {
      expect(isGNPost("good night friends", gnPatterns)).toBe(true);
      expect(isGNPost("Good Night everyone!", gnPatterns)).toBe(true);
    });

    test("should be case insensitive", () => {
      expect(isGNPost("GN", gnPatterns)).toBe(true);
      expect(isGNPost("Gn", gnPatterns)).toBe(true);
      expect(isGNPost("gN", gnPatterns)).toBe(true);
    });

    test("should require word boundaries", () => {
      expect(isGNPost("gnarly is not a greeting", gnPatterns)).toBe(false);
      expect(isGNPost("design", gnPatterns)).toBe(false);
    });

    test("should not detect GM posts", () => {
      expect(isGNPost("gm everyone", gnPatterns)).toBe(false);
      expect(isGNPost("good morning", gnPatterns)).toBe(false);
    });

    test("should handle emoji and special characters", () => {
      expect(isGNPost("gn 🌙", gnPatterns)).toBe(true);
      expect(isGNPost("✨ good night!", gnPatterns)).toBe(true);
    });
  });

  describe("isGAPost", () => {
    test("should detect 'ga' as GA post", () => {
      expect(isGAPost("ga everyone!", gaPatterns)).toBe(true);
      expect(isGAPost("GA fam", gaPatterns)).toBe(true);
      expect(isGAPost("ga ga", gaPatterns)).toBe(true);
    });

    test("should detect 'good afternoon' as GA post", () => {
      expect(isGAPost("good afternoon friends", gaPatterns)).toBe(true);
      expect(isGAPost("Good Afternoon everyone!", gaPatterns)).toBe(true);
    });

    test("should be case insensitive", () => {
      expect(isGAPost("GA", gaPatterns)).toBe(true);
      expect(isGAPost("Ga", gaPatterns)).toBe(true);
      expect(isGAPost("gA", gaPatterns)).toBe(true);
    });

    test("should require word boundaries", () => {
      expect(isGAPost("gala is not a greeting", gaPatterns)).toBe(false);
      expect(isGAPost("yoga", gaPatterns)).toBe(false);
    });

    test("should not detect GM posts", () => {
      expect(isGAPost("gm everyone", gaPatterns)).toBe(false);
      expect(isGAPost("good morning", gaPatterns)).toBe(false);
    });

    test("should handle emoji and special characters", () => {
      expect(isGAPost("ga 🌤️", gaPatterns)).toBe(true);
      expect(isGAPost("☀️ good afternoon!", gaPatterns)).toBe(true);
    });
  });
});
