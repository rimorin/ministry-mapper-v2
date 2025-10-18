import { KeyboardEvent } from "react";

/**
 * Handles keyboard navigation for interactive elements (Enter/Space)
 * @param e - Keyboard event
 * @param callback - Function to call when Enter or Space is pressed
 */
export const handleKeyboardActivation = (
  e: KeyboardEvent,
  callback: () => void
) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    callback();
  }
};
