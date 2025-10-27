/**
 * X.com Unmute Utility
 * Browser console script to unmute all muted accounts
 */

(function () {
  "use strict";

  interface WindowWithUnmute extends Window {
    unmuteMassive: () => Promise<void>;
  }

  const sleep = async (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  async function unmuteMassive(): Promise<void> {
    // Find all buttons with "Unmute" in their aria-label
    const muteButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        'button[aria-label^="Unmute"]'
      )
    );

    console.log(`Found ${muteButtons.length} muted accounts to unmute`);

    // Click each button with a small delay to avoid rate limiting
    for (const [index, button] of muteButtons.entries()) {
      await sleep(500); // 500ms delay between clicks
      button.click();
      console.log(
        `Clicked unmute button ${index + 1} of ${muteButtons.length}`
      );
    }

    console.log("✅ Finished unmuting all accounts");
  }

  // Export for use
  if (typeof window !== "undefined") {
    (window as unknown as WindowWithUnmute).unmuteMassive = unmuteMassive;
  }

  // Run the function
  void unmuteMassive();
})();
