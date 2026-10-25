/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// @ts-expect-error - Bun test types
import { describe, expect, test } from "bun:test";
import {
  generateGAReply,
  generateGEReply,
  generateGMReply,
  generateGNReply,
  generateHBDReply,
  generateSayItBackReply,
  hasSayItBack,
  normalizeAuthorName,
} from "../src/reply-generators";

describe("Reply Generators", () => {
  describe("normalizeAuthorName", () => {
    test("should handle spaced-out names like 'H O L Y'", () => {
      expect(normalizeAuthorName("H O L Y")).toBe("Holy");
      expect(normalizeAuthorName("M A X")).toBe("Max");
      expect(normalizeAuthorName("A B C D")).toBe("Abcd");
    });

    test("should preserve normal multi-word names", () => {
      expect(normalizeAuthorName("John Smith")).toBe("John Smith");
      expect(normalizeAuthorName("Sarah Connor")).toBe("Sarah Connor");
      expect(normalizeAuthorName("Alice Bob")).toBe("Alice Bob");
    });

    test("should preserve single-word names", () => {
      expect(normalizeAuthorName("Alice")).toBe("Alice");
      expect(normalizeAuthorName("Bob")).toBe("Bob");
      expect(normalizeAuthorName("HOLY")).toBe("Holy"); // All caps becomes title case
    });

    test("should handle mixed cases in spaced-out names", () => {
      expect(normalizeAuthorName("h o l y")).toBe("holy");
      expect(normalizeAuthorName("H o L y")).toBe("HoLy");
      expect(normalizeAuthorName("m A x")).toBe("mAx");
    });

    test("should remove emojis before processing", () => {
      expect(normalizeAuthorName("H 😊 O 🔥 L Y")).toBe("Holy"); // All caps becomes title case
      expect(normalizeAuthorName("🔥 Alice 💪")).toBe("Alice");
      expect(normalizeAuthorName("☀️ John Smith 🌞")).toBe("John Smith");
    });

    test("should handle fancy Unicode characters", () => {
      expect(normalizeAuthorName("Ｈ Ｏ Ｌ Ｙ")).toBe("Holy"); // All caps becomes title case
      expect(normalizeAuthorName("𝐇𝐎𝐋𝐘")).toBe("Holy"); // All caps becomes title case
      expect(normalizeAuthorName("𝓗𝓞𝓛𝓨")).toBe("Holy"); // All caps becomes title case
    });

    test("should handle dotted names by taking only first part", () => {
      expect(normalizeAuthorName("neon.something.something")).toBe("neon");
      expect(normalizeAuthorName("alice.eth.xyz")).toBe("alice");
      expect(normalizeAuthorName("bob.crypto")).toBe("bob");
      expect(normalizeAuthorName("user.name.here")).toBe("user");
    });

    test("should handle dotted names with emojis", () => {
      expect(normalizeAuthorName("🔥neon.something.something😊")).toBe("neon");
      expect(normalizeAuthorName("alice🌟.eth.xyz")).toBe("alice");
    });

    test("should handle dotted names with fancy Unicode", () => {
      expect(normalizeAuthorName("ｎｅｏｎ.something.something")).toBe("neon");
      expect(normalizeAuthorName("𝐀𝐥𝐢𝐜𝐞.eth.xyz")).toBe("Alice");
    });

    test("should preserve names without dots", () => {
      expect(normalizeAuthorName("neon")).toBe("neon");
      expect(normalizeAuthorName("alice123")).toBe("alice123");
      expect(normalizeAuthorName("BobTheBuilder")).toBe("BobTheBuilder");
    });

    test("should strip trailing punctuation", () => {
      expect(normalizeAuthorName("John.")).toBe("John");
      expect(normalizeAuthorName("Alice,")).toBe("Alice");
      expect(normalizeAuthorName("Bob...")).toBe("Bob");
      expect(normalizeAuthorName("Sarah!!!")).toBe("Sarah");
      expect(normalizeAuthorName("Mike???")).toBe("Mike");
    });

    test("should strip leading punctuation", () => {
      expect(normalizeAuthorName(".John")).toBe("John");
      expect(normalizeAuthorName("@Alice")).toBe("Alice");
      expect(normalizeAuthorName("(Bob)")).toBe("Bob");
      expect(normalizeAuthorName("[Sarah]")).toBe("Sarah");
      expect(normalizeAuthorName("{Mike}")).toBe("Mike");
    });

    test("should strip both leading and trailing punctuation", () => {
      expect(normalizeAuthorName("...John...")).toBe("John");
      expect(normalizeAuthorName("@@Alice@@")).toBe("Alice");
      expect(normalizeAuthorName("((Bob))")).toBe("Bob");
      expect(normalizeAuthorName("--Sarah--")).toBe("Sarah");
    });

    test("should handle complex punctuation combinations", () => {
      expect(normalizeAuthorName("John.,;!")).toBe("John");
      expect(normalizeAuthorName("@#$Alice%^&")).toBe("Alice");
      expect(normalizeAuthorName("+++Bob---")).toBe("Bob");
    });

    test("should remove diacritics", () => {
      expect(normalizeAuthorName("José García")).toBe("Jose Garcia");
      expect(normalizeAuthorName("François")).toBe("Francois");
      expect(normalizeAuthorName("Müller")).toBe("Muller");
    });

    test("should handle edge cases", () => {
      expect(normalizeAuthorName("")).toBe("");
      expect(normalizeAuthorName("   ")).toBe("");
      expect(normalizeAuthorName("A")).toBe(""); // Too short (< 2 chars)
      expect(normalizeAuthorName("AB")).toBe("Ab"); // All caps becomes title case
    });

    test("should trim whitespace", () => {
      expect(normalizeAuthorName("  Alice  ")).toBe("Alice");
      expect(normalizeAuthorName("  H O L Y  ")).toBe("Holy"); // All caps becomes title case
      expect(normalizeAuthorName("  John Smith  ")).toBe("John Smith");
    });

    test("should handle multiple spaces between letters", () => {
      expect(normalizeAuthorName("H  O  L  Y")).toBe("Holy"); // All caps becomes title case
      expect(normalizeAuthorName("A    B    C")).toBe("Abc"); // All caps becomes title case
    });

    test("should handle real-world examples", () => {
      // Spaced-out aesthetic names
      expect(normalizeAuthorName("V I B E S")).toBe("Vibes"); // All caps becomes title case
      expect(normalizeAuthorName("B U I L D")).toBe("Build"); // All caps becomes title case

      // Normal names stay normal
      expect(normalizeAuthorName("Crypto Builder")).toBe("Crypto Builder");
      expect(normalizeAuthorName("NFT Collector")).toBe("NFT Collector");
    });

    test("should handle names with emojis AND spaces", () => {
      expect(normalizeAuthorName("🔥 H O L Y 🔥")).toBe("Holy"); // All caps becomes title case
      expect(normalizeAuthorName("V 💪 I 🚀 B E S")).toBe("Vibes"); // All caps becomes title case
    });
  });

  describe("hasSayItBack", () => {
    test("should detect 'say it back'", () => {
      expect(hasSayItBack("gm say it back")).toBe(true);
      expect(hasSayItBack("Say it back!")).toBe(true);
      expect(hasSayItBack("GM ☀️ say it back")).toBe(true);
    });

    test("should detect 'say back'", () => {
      expect(hasSayItBack("gm say back")).toBe(true);
      expect(hasSayItBack("Say back!")).toBe(true);
    });

    test("should detect 'reply back'", () => {
      expect(hasSayItBack("gm reply back")).toBe(true);
      expect(hasSayItBack("Reply back!")).toBe(true);
    });

    test("should detect 'type it back'", () => {
      expect(hasSayItBack("gm type it back")).toBe(true);
      expect(hasSayItBack("Type it back!")).toBe(true);
    });

    test("should be case insensitive", () => {
      expect(hasSayItBack("GM SAY IT BACK")).toBe(true);
      expect(hasSayItBack("Gm Say It Back")).toBe(true);
    });

    test("should return false when prompt not present", () => {
      expect(hasSayItBack("gm everyone")).toBe(false);
      expect(hasSayItBack("good morning")).toBe(false);
      expect(hasSayItBack("just saying hello")).toBe(false);
    });
  });

  describe("generateSayItBackReply", () => {
    test("should return 'it back' ~20% of the time", () => {
      // Run multiple times to check that "it back" is returned sometimes
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        const reply = generateSayItBackReply("gm say it back");
        results.push(reply);
      }
      // Should have at least some "it back" replies (20% chance)
      const itBackCount = results.filter((r) => r === "it back").length;
      expect(itBackCount).toBeGreaterThan(0);
      // But not all should be "it back" (80% should be greetings)
      expect(itBackCount).toBeLessThan(100);
    });

    test("should return simple greeting for GM posts", () => {
      // Run multiple times - most should return "gm" (80% chance)
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        const reply = generateSayItBackReply("gm say it back");
        results.push(reply);
      }
      // Most should be "gm" (some might be "it back" due to 20% chance)
      const gmCount = results.filter((r) => r === "gm").length;
      expect(gmCount).toBeGreaterThan(50); // At least 50% should be "gm"
    });

    test("should return simple greeting for GN posts", () => {
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        const reply = generateSayItBackReply("gn say it back");
        results.push(reply);
      }
      const gnCount = results.filter((r) => r === "gn").length;
      expect(gnCount).toBeGreaterThan(50);
    });

    test("should return simple greeting for GA posts", () => {
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        const reply = generateSayItBackReply("ga say it back");
        results.push(reply);
      }
      const gaCount = results.filter((r) => r === "ga").length;
      expect(gaCount).toBeGreaterThan(50);
    });

    test("should return simple greeting for GE posts", () => {
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        const reply = generateSayItBackReply("ge say it back");
        results.push(reply);
      }
      const geCount = results.filter((r) => r === "ge").length;
      expect(geCount).toBeGreaterThan(50);
    });

    test("should return simple greeting for HBD posts", () => {
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        const reply = generateSayItBackReply("hbd say it back");
        results.push(reply);
      }
      const hbdCount = results.filter((r) => r === "hbd").length;
      expect(hbdCount).toBeGreaterThan(50);
    });

    test("should return only simple greetings or 'it back'", () => {
      const validReplies = ["gm", "gn", "ga", "ge", "hbd", "it back"];
      for (let i = 0; i < 50; i++) {
        const reply = generateSayItBackReply("gm say it back");
        expect(validReplies).toContain(reply);
      }
    });
  });

  describe("generateGMReply", () => {
    test("should return a non-empty string", () => {
      const reply = generateGMReply("Alice");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
    });

    test("should handle empty author name", () => {
      const reply = generateGMReply("");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
    });

    test("should include greeting in most cases", () => {
      const replies: string[] = [];
      for (let i = 0; i < 50; i++) {
        replies.push(generateGMReply("Alice"));
      }
      // At least some should contain common greetings
      const hasGreeting = replies.some(
        (r) =>
          r.toLowerCase().includes("gm") ||
          r.toLowerCase().includes("morning") ||
          r.toLowerCase().includes("good")
      );
      expect(hasGreeting).toBe(true);
    });

    test("should handle keyword echo in post text", () => {
      const replies: string[] = [];
      for (let i = 0; i < 50; i++) {
        replies.push(generateGMReply("Alice", "gm degen"));
      }
      // Some should echo the keyword
      const hasKeyword = replies.some((r) =>
        r.toLowerCase().includes("degen")
      );
      expect(hasKeyword).toBe(true);
    });
  });

  describe("generateGNReply", () => {
    test("should return a non-empty string", () => {
      const reply = generateGNReply("Alice");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
    });

    test("should handle empty author name", () => {
      const reply = generateGNReply("");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
    });

    test("should include greeting in most cases", () => {
      const replies: string[] = [];
      for (let i = 0; i < 50; i++) {
        replies.push(generateGNReply("Alice"));
      }
      const hasGreeting = replies.some(
        (r) =>
          r.toLowerCase().includes("gn") ||
          r.toLowerCase().includes("night") ||
          r.toLowerCase().includes("good")
      );
      expect(hasGreeting).toBe(true);
    });
  });

  describe("generateGAReply", () => {
    test("should return a non-empty string", () => {
      const reply = generateGAReply("Alice");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
    });

    test("should handle empty author name", () => {
      const reply = generateGAReply("");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
    });

    test("should include greeting in most cases", () => {
      const replies: string[] = [];
      for (let i = 0; i < 50; i++) {
        replies.push(generateGAReply("Alice"));
      }
      const hasGreeting = replies.some(
        (r) =>
          r.toLowerCase().includes("ga") ||
          r.toLowerCase().includes("afternoon") ||
          r.toLowerCase().includes("good")
      );
      expect(hasGreeting).toBe(true);
    });
  });

  describe("generateGEReply", () => {
    test("should return a non-empty string", () => {
      const reply = generateGEReply("Alice");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
    });

    test("should handle empty author name", () => {
      const reply = generateGEReply("");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
    });

    test("should include greeting in most cases", () => {
      const replies: string[] = [];
      for (let i = 0; i < 50; i++) {
        replies.push(generateGEReply("Alice"));
      }
      const hasGreeting = replies.some(
        (r) =>
          r.toLowerCase().includes("ge") ||
          r.toLowerCase().includes("evening") ||
          r.toLowerCase().includes("good")
      );
      expect(hasGreeting).toBe(true);
    });
  });

  describe("generateHBDReply", () => {
    test("should return a non-empty string", () => {
      const reply = generateHBDReply("Alice");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
    });

    test("should handle empty author name", () => {
      const reply = generateHBDReply("");
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe("string");
    });

    test("should include birthday greeting in most cases", () => {
      const replies: string[] = [];
      for (let i = 0; i < 50; i++) {
        replies.push(generateHBDReply("Alice"));
      }
      const hasGreeting = replies.some(
        (r) =>
          r.toLowerCase().includes("hbd") ||
          r.toLowerCase().includes("birthday") ||
          r.toLowerCase().includes("happy")
      );
      expect(hasGreeting).toBe(true);
    });
  });
});
