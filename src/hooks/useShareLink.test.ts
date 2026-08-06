import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
// Imported directly (not via the barrel): the barrel pulls in the test i18n
// instance, which cannot initialize under this file's react-i18next mock.
import {
  setNavigatorShare,
  setNavigatorClipboard,
  restoreBrowserStubs
} from "../utils/test/browser-stubs";

const { notifySuccessMock } = vi.hoisted(() => ({
  notifySuccessMock: vi.fn()
}));

vi.mock("./useNotification", () => ({
  default: () => ({
    notifySuccess: notifySuccessMock
  })
}));

vi.mock("../utils/pocketbase", () => ({
  isAbortError: (error: unknown) =>
    !!(error as { isAbort?: boolean })?.isAbort ||
    (error as { name?: string })?.name === "AbortError"
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
    i18n: { language: "en" }
  })
}));

const { default: useShareLink } = await import("./useShareLink");

describe("useShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreBrowserStubs();
  });

  it("shares the message and absolute map link via navigator.share", async () => {
    const shareMock = vi.fn(() => Promise.resolve());
    setNavigatorShare(shareMock);

    const { result } = renderHook(() => useShareLink());
    expect(result.current.shareButtonLabel).toBe("Share");

    let outcome;
    await act(async () => {
      outcome = await result.current.shareLink({
        linkId: "link123",
        message: "Hello publisher"
      });
    });

    expect(outcome).toBe("shared");
    expect(shareMock).toHaveBeenCalledWith({
      text: `Hello publisher\n${new URL("map/link123", window.location.href).toString()}`
    });
  });

  it("returns cancelled when the user dismisses the share sheet", async () => {
    const abortError = new Error("Share canceled");
    abortError.name = "AbortError";
    setNavigatorShare(vi.fn(() => Promise.reject(abortError)));

    const { result } = renderHook(() => useShareLink());

    let outcome;
    await act(async () => {
      outcome = await result.current.shareLink({
        linkId: "link123",
        message: "Hello"
      });
    });

    expect(outcome).toBe("cancelled");
  });

  it("rethrows genuine share failures", async () => {
    const error = new Error("boom");
    setNavigatorShare(vi.fn(() => Promise.reject(error)));

    const { result } = renderHook(() => useShareLink());

    await act(async () => {
      await expect(
        result.current.shareLink({ linkId: "link123", message: "Hello" })
      ).rejects.toThrow("boom");
    });
  });

  it("copies to the clipboard when Web Share is unavailable", async () => {
    const writeTextMock = vi.fn(() => Promise.resolve());
    setNavigatorClipboard({ writeText: writeTextMock });

    const { result } = renderHook(() => useShareLink());
    expect(result.current.shareButtonLabel).toBe("Copy link");

    let outcome;
    await act(async () => {
      outcome = await result.current.shareLink({
        linkId: "link123",
        message: "Hello publisher"
      });
    });

    expect(outcome).toBe("copied");
    expect(writeTextMock).toHaveBeenCalledWith(
      `Hello publisher\n${new URL("map/link123", window.location.href).toString()}`
    );
    expect(notifySuccessMock).toHaveBeenCalledWith("Link copied");
  });

  it("copyText writes the given text and notifies", async () => {
    const writeTextMock = vi.fn(() => Promise.resolve());
    setNavigatorClipboard({ writeText: writeTextMock });

    const { result } = renderHook(() => useShareLink());

    await act(async () => {
      await result.current.copyText("https://example.com/map/link123");
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      "https://example.com/map/link123"
    );
    expect(notifySuccessMock).toHaveBeenCalledWith("Link copied");
  });

  it("exposes isSharing while the share sheet is open", async () => {
    let resolveShare: () => void;
    setNavigatorShare(
      vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveShare = resolve;
          })
      )
    );

    const { result } = renderHook(() => useShareLink());

    let pending: Promise<unknown>;
    act(() => {
      pending = result.current.shareLink({ linkId: "link123", message: "Hi" });
    });
    expect(result.current.isSharing).toBe(true);

    await act(async () => {
      resolveShare!();
      await pending;
    });
    expect(result.current.isSharing).toBe(false);
  });
});
