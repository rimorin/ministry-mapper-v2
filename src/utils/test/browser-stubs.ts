import { vi } from "vitest";

const originalMatchMedia = window.matchMedia;

export const setNavigatorShare = (impl: unknown) => {
  Object.defineProperty(window.navigator, "share", {
    value: impl,
    configurable: true,
    writable: true
  });
};

export const setNavigatorClipboard = (impl: unknown) => {
  Object.defineProperty(window.navigator, "clipboard", {
    value: impl,
    configurable: true,
    writable: true
  });
};

export const setNavigatorGeolocation = (impl: unknown) => {
  Object.defineProperty(window.navigator, "geolocation", {
    value: impl,
    configurable: true,
    writable: true
  });
};

export const setViewport = (isMobile: boolean) => {
  window.matchMedia = vi.fn(() => ({
    matches: isMobile,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })) as unknown as typeof window.matchMedia;
};

export const restoreBrowserStubs = () => {
  delete (window.navigator as { share?: unknown }).share;
  delete (window.navigator as { clipboard?: unknown }).clipboard;
  delete (window.navigator as { geolocation?: unknown }).geolocation;
  window.matchMedia = originalMatchMedia;
};
