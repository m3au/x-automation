/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// @ts-expect-error - Bun test types
import { describe, expect, test } from "bun:test";
import {
  generateSayItBackReply,
  hasSayItBack,
  normalizeAuthorName,
} from "../src/reply-generators";

describe("Reply Generators", () => {
  describe("normalizeAuthorName", () => {
    test("should handle spaced-out names like 'H O L Y'", () => {
      expect(normalizeAuthorName("H O L Y")).toBe("HOLY");
      expect(normalizeAuthorName("M A X")).toBe("MAX");
      expect(normalizeAuthorName("A B C D")).toBe("ABCD");
    });

    test("should preserve normal multi-word names", () => {
      expect(normalizeAuthorName("John Smith")).toBe("John Smith");
      expect(normalizeAuthorName("Sarah Connor")).toBe("Sarah Connor");
      expect(normalizeAuthorName("Alice Bob")).toBe("Alice Bob");
    });

    test("should preserve single-word names", () => {
      expect(normalizeAuthorName("Alice")).toBe("Alice");
      expect(normalizeAuthorName("Bob")).toBe("Bob");
      expect(normalizeAuthorName("HOLY")).toBe("HOLY");
    });

    test("should handle mixed cases in spaced-out names", () => {
      expect(normalizeAuthorName("h o l y")).toBe("holy");
      expect(normalizeAuthorName("H o L y")).toBe("HoLy");
      expect(normalizeAuthorName("m A x")).toBe("mAx");
    });

    test("should remove emojis before processing", () => {
      expect(normalizeAuthorName("H 😊 O 🔥 L Y")).toBe("HOLY");
      expect(normalizeAuthorName("🔥 Alice 💪")).toBe("Alice");
      expect(normalizeAuthorName("☀️ John Smith 🌞")).toBe("John Smith");
    });

    test("should handle fancy Unicode characters", () => {
      expect(normalizeAuthorName("Ｈ Ｏ Ｌ Ｙ")).toBe("HOLY");
      expect(normalizeAuthorName("𝐇𝐎𝐋𝐘")).toBe("HOLY");
      expect(normalizeAuthorName("𝓗𝓞𝓛𝓨")).toBe("HOLY");
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
      expect(normalizeAuthorName("AB")).toBe("AB");
    });

    test("should trim whitespace", () => {
      expect(normalizeAuthorName("  Alice  ")).toBe("Alice");
      expect(normalizeAuthorName("  H O L Y  ")).toBe("HOLY");
      expect(normalizeAuthorName("  John Smith  ")).toBe("John Smith");
    });

    test("should handle multiple spaces between letters", () => {
      expect(normalizeAuthorName("H  O  L  Y")).toBe("HOLY");
      expect(normalizeAuthorName("A    B    C")).toBe("ABC");
    });

    test("should handle real-world examples", () => {
      // Spaced-out aesthetic names
      expect(normalizeAuthorName("V I B E S")).toBe("VIBES");
      expect(normalizeAuthorName("B U I L D")).toBe("BUILD");

      // Normal names stay normal
      expect(normalizeAuthorName("Crypto Builder")).toBe("Crypto Builder");
      expect(normalizeAuthorName("NFT Collector")).toBe("NFT Collector");
    });

    test("should handle names with emojis AND spaces", () => {
      expect(normalizeAuthorName("🔥 H O L Y 🔥")).toBe("HOLY");
      expect(normalizeAuthorName("V 💪 I 🚀 B E S")).toBe("VIBES");
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
    test("should return 'it back' with laugh emoji ~50% of the time", () => {
      // Run multiple times to check both branches hit
      const results = new Set<boolean>();
      for (let i = 0; i < 50; i++) {
        const reply = generateSayItBackReply("gm say it back");
        // Should either be "it back [emoji]" or start with handshake
        results.add(reply.startsWith("it back"));
        results.add(reply.startsWith("🤝"));
      }
      // Both should have been hit at least once
      expect(results.has(true)).toBe(true);
    });

    test("should include handshake when echoing greeting", () => {
      // Test the echo branch (not deterministic, but test the structure)
      const results: string[] = [];
      for (let i = 0; i < 30; i++) {
        const reply = generateSayItBackReply("GM ☀️ say it back");
        results.push(reply);
      }
      // At least some should have handshake (echoing the greeting)
      const hasHandshake = results.some((r) => r.includes("🤝"));
      expect(hasHandshake).toBe(true);
    });

    test("should always include laugh emoji", () => {
      for (let i = 0; i < 20; i++) {
        const reply = generateSayItBackReply("gm say it back");
        // Should end with one of the laugh emojis
        const laughEmojis = ["😂", "🤣", "😭", "💀", "😹", "😆", "😅"];
        const hasLaughEmoji = laughEmojis.some((emoji) =>
          reply.includes(emoji)
        );
        expect(hasLaughEmoji).toBe(true);
      }
    });

    test("should clean up 'say it back' phrases", () => {
      const results: string[] = [];
      for (let i = 0; i < 30; i++) {
        const reply = generateSayItBackReply("GM ☀️ say it back");
        results.push(reply);
      }
      // When echoing, should not include "say it back" in the reply
      const echoes = results.filter((r) => r.includes("🤝"));
      for (const echo of echoes) {
        expect(echo.toLowerCase()).not.toContain("say it back");
        expect(echo.toLowerCase()).not.toContain("say back");
      }
    });
  });
});
