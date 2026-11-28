import { registerSW } from "virtual:pwa-register";
import { checkVersion } from "./versionCheck";
import {
  recoverFromStaleDeploy,
  reloadForNewDeploy
} from "./reloadForNewDeploy";

const CHECK_THROTTLE_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
// Someone back after this long starts afresh, so a waiting update loads then.
const RESUME_RELOAD_AFTER_MS = 30 * 60 * 1000;

let updateReady = false;

// For a listener that mounts after the "mm-sw-update" event already fired.
export const isUpdateReady = () => updateReady;

// Base UI gives toasts, the update toast included, a dialog role, and keeps a
// closing dialog (data-closed) on screen while it animates out, like the phone
// sidebar after one of its items is tapped.
const OPEN_DIALOG = ["dialog", "alertdialog"]
  .map((role) => `[role="${role}"]:not([data-slot="toast"]):not([data-closed])`)
  .join(", ");
// Chained :not() rather than a selector list, which older WebViews reject.
const TEXT_ENTRY = [
  "textarea",
  '[contenteditable]:not([contenteditable="false"])',
  "input" +
    ["checkbox", "radio", "button", "submit", "reset", "file", "range", "color"]
      .map((type) => `:not([type="${type}"])`)
      .join("")
].join(", ");

// An automatic reload must cost the user nothing: not the page itself
// (offline, with no service worker to serve it), not an open dialog, and not
// what they are typing.
const canReloadUnasked = () =>
  navigator.onLine &&
  !document.querySelector(OPEN_DIALOG) &&
  !document.activeElement?.matches(TEXT_ENTRY);

// Loads a waiting update at a natural break, such as a move to another
// screen. Returns whether it did.
export const applyWaitingUpdate = () => {
  if (!updateReady || !canReloadUnasked()) return false;
  reloadForNewDeploy();
  return true;
};

// Returns a cleanup for tests; the app keeps it running.
export const initAppUpdates = () => {
  updateReady = false;
  const promptReload = () => {
    updateReady = true;
    window.dispatchEvent(new CustomEvent("mm-sw-update"));
  };

  registerSW({
    immediate: true,
    // Fires once the new SW controls the page, so a reload gets the new build.
    onNeedReload: promptReload,
    // Some webviews refuse registration; the app works without it.
    onRegisterError: () => {}
  });

  // Suspended standalone windows may never recheck sw.js on their own.
  let lastVersionCheck = 0;
  let versionStale = false;
  const checkFreshness = (bypassThrottle = false) => {
    if (!navigator.onLine || versionStale) return;
    const now = Date.now();
    if (!bypassThrottle && now - lastVersionCheck < CHECK_THROTTLE_MS) return;
    lastVersionCheck = now;
    checkVersion().then((status) => {
      if (
        status === "required" &&
        recoverFromStaleDeploy({ dropFirst: true })
      ) {
        return;
      }
      // With a SW in control, sw.js is what tells builds apart: a deploy
      // without a version bump changes it too. A new SW installs in the
      // background and onNeedReload prompts once it takes over.
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready
          .then((reg) => reg.update())
          .catch(() => {});
      } else if (status !== "current") {
        versionStale = true;
        promptReload();
      }
    });
  };

  let hiddenAt = 0;
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      return;
    }
    if (
      hiddenAt &&
      Date.now() - hiddenAt >= RESUME_RELOAD_AFTER_MS &&
      applyWaitingUpdate()
    ) {
      return;
    }
    checkFreshness();
  };
  // A bfcache or app-switcher resume skips the throttle.
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) checkFreshness(true);
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", onPageShow);
  const intervalId = setInterval(checkFreshness, CHECK_INTERVAL_MS);
  // At start too, so a build below the minimum version is replaced at once.
  checkFreshness(true);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onPageShow);
    clearInterval(intervalId);
  };
};
