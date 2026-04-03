// Killer service worker — replaces the cached SW from v1.24 (vite-plugin-pwa).
// Strategy recommended by Chrome Developers docs for removing buggy/stale SWs:
// https://developer.chrome.com/docs/workbox/remove-buggy-service-workers/
//
// 1. skipWaiting()  — activates immediately without waiting for tabs to close
// 2. Delete all caches — clears all precached assets from vite-plugin-pwa
// 3. unregister()   — removes this SW itself so no SW runs after this
// 4. clients.claim() + navigate — forces all open tabs to reload from network
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
