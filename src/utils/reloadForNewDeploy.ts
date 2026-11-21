import * as Sentry from "@sentry/react";

// Errors thrown after a stale-deploy reload starts aren't worth reporting.
let reloading = false;

export const reloadForNewDeploy = () => {
  reloading = true;
  window.location.reload();
};

export const isReloadingForNewDeploy = () => reloading;

const ATTEMPTS_KEY = "mm:stale-deploy";

// A failure this long after the first attempt is a new problem, such as a
// later deployment, and gets fresh attempts.
const ATTEMPTS_WINDOW_MS = 2 * 60 * 1000;

// Removes the service worker and everything it cached, so the next load comes
// from the server. Work saved for later sending lives in IndexedDB and is not
// touched. Best effort: the reload that follows is still worth trying.
const dropCachedApp = async () => {
  try {
    const registrations =
      (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(registrations.map((r) => r.unregister()));
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // Nothing more to do here.
  }
};

// Recovers from a part of the app that failed to load, which after a
// deployment means this page is from the old build and that file is gone.
// Returns false when it has nothing left to try, so the error can show.
//
//   1. Reload. Enough when the new build is already what loads.
//   2. It failed again: the service worker is still answering with the old
//      page. Drop it and its cache, then reload, as a hard refresh would.
//   3. Still failing: stop.
//
// The attempts are counted in sessionStorage, which survives a reload. The
// count must not be cleared when a page starts: the failing file is often
// loaded only after the page is up, so a count cleared at start never passes
// 1 and the page reloads for as long as the file keeps failing.
export const recoverFromStaleDeploy = (now = Date.now()) => {
  // Offline, a reload brings nothing new, and dropping the cache would take
  // away the only copy of the app.
  if (!navigator.onLine) return false;
  let attempts: number;
  try {
    const last = JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) ?? "null") as {
      at: number;
      attempts: number;
    } | null;
    const recent = last && now - last.at < ATTEMPTS_WINDOW_MS ? last : null;
    attempts = recent?.attempts ?? 0;
    if (attempts >= 2) return false;
    sessionStorage.setItem(
      ATTEMPTS_KEY,
      JSON.stringify({ at: recent?.at ?? now, attempts: attempts + 1 })
    );
  } catch {
    // Without storage the attempts cannot be counted, so none is made.
    return false;
  }
  if (attempts === 0) {
    reloadForNewDeploy();
  } else {
    // Says how often a plain reload is not enough.
    Sentry.captureMessage("Dropped the cached app after a stale deploy");
    void dropCachedApp().finally(reloadForNewDeploy);
  }
  return true;
};
