/*
 * Offline support. The app keeps its data on the device, so the only thing the
 * network is needed for is the app itself — cache it, and it opens on a plane.
 *
 * - Build assets (/_next/static) never change at a given URL: cache-first.
 * - Pages: network-first so a deploy shows up, falling back to the cached copy.
 */
const CACHE = "founderos-v2";
const PAGES = ["/", "/list", "/notes", "/archive"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PAGES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  // Drops the old app's cache (founderos-v1) along with anything else stale.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch sync traffic

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(url.pathname)) || caches.match("/")),
    );
  }
});
