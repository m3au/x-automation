/**
 * DOM utility functions for interacting with X.com UI
 */

export function isReplyPost(article: HTMLElement): boolean {
  // Only check for "Replying to" text - most reliable indicator
  const socialContext = article.querySelector('[data-testid="socialContext"]');
  if (socialContext?.textContent?.includes("Replying to")) {
    return true;
  }

  return false;
}

export function isOldVersionPost(article: HTMLElement): boolean {
  // Check if post has "There's a new version of this post" text
  const allText = article.textContent || "";
  return allText.includes("There's a new version of this post");
}

export function isLikeButtonDisabled(button: HTMLElement): boolean {
  // Check if the SVG inside the button has the "disabled" class
  const svg = button.querySelector("svg");
  if (svg && svg.classList.contains("r-12c3ph5")) {
    return true;
  }
  return false;
}

export function isButtonAlreadyLiked(button: HTMLElement): boolean {
  if (button.getAttribute("data-testid") === "unlike") {
    return true;
  }

  if (button.closest('[data-testid="unlike"]') !== null) {
    return true;
  }

  const article = button.closest("article");
  if (article) {
    const unlikeInArticle = article.querySelector('[data-testid="unlike"]');
    if (unlikeInArticle) {
      return true;
    }

    const parentGroup = button.closest('[role="group"]');
    if (parentGroup && parentGroup.querySelector('[data-testid="unlike"]')) {
      return true;
    }
  }

  const svgPaths = button.querySelectorAll("path");
  for (const path of svgPaths) {
    const fill = path.getAttribute("fill");
    if (
      fill &&
      (fill.toLowerCase() === "#f91880" ||
        fill.toLowerCase() === "rgb(249, 24, 128)")
    ) {
      return true;
    }
  }

  return false;
}

export function findAllLikeButtons(): HTMLElement[] {
  const allArticles = Array.from(document.querySelectorAll("article"));
  const likeButtons: HTMLElement[] = [];
  const alreadyLikedButtons: HTMLElement[] = [];

  for (const article of allArticles) {
    if (article.querySelector('[data-testid="unlike"]')) {
      continue;
    }

    // Skip old versions of edited posts
    if (isOldVersionPost(article)) {
      console.log("⚠️ Old version of edited post found - skipping...");
      continue;
    }

    let foundButton: HTMLElement | null = null;

    const interactionArea = article.querySelector('[role="group"]');
    if (interactionArea) {
      const buttons = Array.from(
        interactionArea.querySelectorAll<HTMLElement>("button")
      );
      if (buttons.length >= 3) {
        const potentialLikeButton = buttons[2];
        if (
          !isButtonAlreadyLiked(potentialLikeButton) &&
          !isLikeButtonDisabled(potentialLikeButton)
        ) {
          foundButton = potentialLikeButton;
        }
      }
    }

    if (!foundButton) {
      const directLikeButton = article.querySelector<HTMLElement>(
        '[data-testid="like"]'
      );
      if (
        directLikeButton &&
        !isButtonAlreadyLiked(directLikeButton) &&
        !isLikeButtonDisabled(directLikeButton)
      ) {
        foundButton = directLikeButton;
      }
    }

    if (!foundButton) {
      const allButtons = Array.from(
        article.querySelectorAll<HTMLElement>("button")
      );
      for (const button of allButtons) {
        if (isButtonAlreadyLiked(button) || isLikeButtonDisabled(button))
          continue;

        const paths = button.querySelectorAll("path");
        for (const path of paths) {
          const d = path.getAttribute("d");
          if (
            d &&
            (d.includes("16.697") ||
              d.includes("M16.697") ||
              d.includes("c-1.222") ||
              d.includes("-3.89 2.16") ||
              d.includes("5.5c-1.222") ||
              (d.includes("heart") && !d.includes("bookmark")))
          ) {
            foundButton = button;
            break;
          }
        }
        if (foundButton) break;
      }
    }

    if (foundButton) {
      likeButtons.push(foundButton);
    }
  }

  const allInteractionBars = document.querySelectorAll('[role="group"]');
  for (const bar of allInteractionBars) {
    if (!bar.closest("article")) continue;

    if (bar.querySelector('[data-testid="unlike"]')) {
      continue;
    }

    const barButtons = Array.from(bar.querySelectorAll<HTMLElement>("button"));
    if (barButtons.length >= 3) {
      const thirdButton = barButtons[2];

      if (
        likeButtons.includes(thirdButton) ||
        alreadyLikedButtons.includes(thirdButton)
      )
        continue;

      if (isButtonAlreadyLiked(thirdButton)) {
        alreadyLikedButtons.push(thirdButton);
        continue;
      }

      if (isLikeButtonDisabled(thirdButton)) {
        continue;
      }

      if (thirdButton.textContent && /\d+/.test(thirdButton.textContent)) {
        likeButtons.push(thirdButton);
      } else {
        const paths = thirdButton.querySelectorAll("path");
        if (paths.length > 0) {
          likeButtons.push(thirdButton);
        }
      }
    }
  }

  console.log(`Found ${likeButtons.length} like buttons to process`);

  likeButtons.sort((a, b) => {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    return rectA.top - rectB.top;
  });

  return likeButtons;
}

export function getButtonUniqueId(button: HTMLElement): string {
  const article = button.closest("article");
  if (!article) return button.outerHTML.substring(0, 100);

  const socialContext = article.querySelector('[data-testid="socialContext"]');
  const isPinned = socialContext?.textContent?.includes("Pinned") ?? false;

  const idElement = article.querySelector('[data-testid="tweet"]');
  const tweetId = idElement?.getAttribute("data-tweet-id") ?? "";

  const tweetText =
    article.querySelector<HTMLElement>('[data-testid="tweetText"]')
      ?.textContent || "";
  const textSample = tweetText.substring(0, 40);

  // Don't use position - it changes when scrolling
  return `${isPinned ? "pinned-" : ""}${tweetId}-${textSample}`;
}

export function checkForDeletedPost(): boolean {
  const toastElements = document.querySelectorAll('[data-testid="toast"]');
  for (const toast of toastElements) {
    const toastText = toast.textContent || "";
    if (
      toastText.includes("post has been deleted") ||
      toastText.includes("That post has been deleted") ||
      toastText.includes("Sorry, that post")
    ) {
      return true;
    }
  }
  return false;
}

export function checkForAutomationWarning(): boolean {
  const toastElements = document.querySelectorAll('[data-testid="toast"]');
  for (const toast of toastElements) {
    const toastText = toast.textContent || "";

    // Ignore "post deleted" messages - these are normal and not automation warnings
    if (
      toastText.includes("post has been deleted") ||
      toastText.includes("That post has been deleted") ||
      toastText.includes("Sorry, that post")
    ) {
      console.log("ℹ️ Post deleted - continuing automation");
      continue;
    }

    // Check for actual automation warnings
    if (
      toastText.includes("automated") ||
      toastText.includes("spam") ||
      toastText.includes("malicious") ||
      toastText.includes("protect our users")
    ) {
      console.log(
        "⚠️ CRITICAL WARNING: Twitter automation detection triggered!"
      );
      console.log("Toast message detected: " + toastText);
      return true;
    }
  }

  const warningTexts = [
    "This request looks like it might be automated",
    "To protect our users from spam",
    "we can't complete this action right now",
    "Please try again later",
    "You're unable to perform this action",
  ];

  const allTextElements = document.querySelectorAll("div, span, p");
  for (const element of allTextElements) {
    const text = element.textContent || "";
    for (const warningText of warningTexts) {
      if (text.includes(warningText)) {
        console.log("⚠️ CRITICAL WARNING: Twitter automation alert detected!");
        console.log("Warning text found: " + text);
        return true;
      }
    }
  }

  return false;
}
