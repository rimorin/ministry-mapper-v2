import { registerSW } from "virtual:pwa-register";
import { checkForNewVersion } from "./versionCheck";

const CHECK_THROTTLE_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const promptReload = () =>
  window.dispatchEvent(new CustomEvent("mm-sw-update"));

// Returns a cleanup for tests; the app keeps it running.
export const initAppUpdates = () => {
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
    checkForNewVersion().then((stale) => {
      if (!stale) return;
      // A reload now would get the old SW's cached shell; onNeedReload
      // prompts once the new SW takes over.
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready
          .then((reg) => reg.update())
          .catch(() => {});
      } else {
        versionStale = true;
        promptReload();
      }
    });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") checkFreshness();
  };
  // A bfcache or app-switcher resume skips the throttle.
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) checkFreshness(true);
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", onPageShow);
  const intervalId = setInterval(checkFreshness, CHECK_INTERVAL_MS);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onPageShow);
    clearInterval(intervalId);
  };
};
