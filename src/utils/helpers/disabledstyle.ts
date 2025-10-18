/**
 * Returns inline styles for disabled state on links and interactive elements
 * @param isDisabled - Whether the element should be disabled
 * @returns CSS properties object
 */
export const getDisabledStyle = (isDisabled: boolean) => ({
  pointerEvents: isDisabled ? ("none" as const) : ("auto" as const),
  opacity: isDisabled ? 0.5 : 1
});

/**
 * Returns cursor style for interactive input group text
 * @param isDisabled - Whether the element should be disabled
 * @returns CSS properties object
 */
export const getCursorStyle = (isDisabled: boolean) => ({
  cursor: isDisabled ? ("not-allowed" as const) : ("pointer" as const)
});
