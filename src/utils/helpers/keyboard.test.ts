import { describe, it, expect, vi } from "vitest";
import { handleKeyboardActivation } from "./keyboard";

describe("handleKeyboardActivation", () => {
  it("should call callback when Enter key is pressed", () => {
    const callback = vi.fn();
    const event = {
      key: "Enter",
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    handleKeyboardActivation(event, callback);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it("should call callback when Space key is pressed", () => {
    const callback = vi.fn();
    const event = {
      key: " ",
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    handleKeyboardActivation(event, callback);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it("should not call callback when other keys are pressed", () => {
    const callback = vi.fn();
    const event = {
      key: "Escape",
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    handleKeyboardActivation(event, callback);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it("should not call callback for Tab key", () => {
    const callback = vi.fn();
    const event = {
      key: "Tab",
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    handleKeyboardActivation(event, callback);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});
