// Chrome, Edge and Samsung Internet offer to install the app once, early in
// the page's life. The offer is kept so a button can make it later.
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let offer: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// Called at start-up, before the offer can go by.
export const listenForInstall = () => {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    offer = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    offer = null;
    notify();
  });
};

export const subscribeInstall = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const canOfferInstall = () => offer !== null;

// The browser allows each offer to be shown once.
export const offerInstall = async () => {
  const event = offer;
  if (!event) return false;
  offer = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
};

export const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPhones and iPads install only by hand, from the Share menu. iPadOS
// reports itself as a Mac, so a touch screen tells them apart.
export const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

export const isTouchScreen = () =>
  window.matchMedia("(pointer: coarse)").matches;
