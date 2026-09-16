/* Evet Kofte POS — sw.js
   Caches the app shell so the POS keeps working with no signal.
   Internet is only needed for the report email/Drive upload step. */

const CACHE_NAME = "evet-kofte-pos-v6";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/utils.js",
  "./js/icons.js",
  "./js/db.js",
  "./js/receipt.js",
  "./js/report.js",
  "./js/pos-modal.js",
  "./js/cashier.js",
  "./js/admin.js",
  "./js/app.js",
  "./lib/qrcode.min.js",
  "./lib/xlsx.full.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for app shell assets: always serve the latest deployed
// version when online (so updates like this one show up immediately),
// and fall back to the cached copy only when there's no connection.
// Requests to a different origin (e.g. the Apps Script upload) pass
// straight through and are never intercepted here.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
