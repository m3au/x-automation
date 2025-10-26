function unmuteMassive() {
  // Find all buttons with "Unmute" in their aria-label
  const muteButtons = Array.from(
    document.querySelectorAll('button[aria-label^="Unmute"]')
  );

  // Click each button with a small delay to avoid rate limiting
  muteButtons.forEach((button, index) => {
    setTimeout(() => {
      button.click();
      console.log(
        `Clicked unmute button ${index + 1} of ${muteButtons.length}`
      );
    }, index * 500); // 500ms delay between clicks
  });

  console.log(`Found ${muteButtons.length} muted accounts to unmute`);
}

// Run the function
unmuteMassive();
