// Minimal service worker: this is what actually makes Masomo an installable
// PWA rather than just a page with a manifest — Chrome's install prompt
// requires a registered service worker with a fetch handler. Given that
// almost every page here is a live, per-request, authenticated server
// render, this deliberately does NOT try to cache and replay dashboard
// pages offline (that would risk showing stale or wrong-tenant data).
// What it does do: cache the small static shell, and if a navigation
// request fails while offline, show a real "you're offline" page instead
// of the browser's own error screen.

const CACHE_NAME = "masomo-shell-v1";
const SHELL_ASSETS = ["/offline.html", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline.html"))
  );
});
