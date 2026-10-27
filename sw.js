"use strict";

const CACHE_NAME = "f3nom-pwa-v2.2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./tokens.css",
  "./style.css",
  "./manifest.json",
  "./assets/f3nom-mark.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./fonts/BigShouldersDisplay-900.woff2",
  "./fonts/Barlow-400.woff2",
  "./js/i18n.js",
  "./js/data.js",
  "./js/names.js",
  "./js/state.js",
  "./js/theme.js",
  "./js/broadcast.js",
  "./js/identity.js",
  "./js/creation.js",
  "./js/engine.js",
  "./js/team-role.js",
  "./js/offseason-events.js",
  "./js/market.js",
  "./js/postseason.js",
  "./js/season-start.js",
  "./js/staff.js",
  "./js/duo.js",
  "./js/wealth.js",
  "./js/training.js",
  "./js/draft.js",
  "./js/season.js",
  "./js/adaptation.js",
  "./js/role-battle.js",
  "./js/leadership.js",
  "./js/family.js",
  "./js/lifestyle.js",
  "./js/injuries.js",
  "./js/shotmeter.js",
  "./js/key-games.js",
  "./js/sponsors.js",
  "./js/sound.js",
  "./js/contracts.js",
  "./js/standings.js",
  "./js/media.js",
  "./js/ui-core.js",
  "./js/ui-dashboard.js",
  "./js/ui-moment.js",
  "./js/stats.js",
  "./js/final.js",
  "./js/goals.js",
  "./js/veteran.js",
  "./js/legacy.js",
  "./js/share.js",
  "./js/after-career.js",
  "./js/biography.js",
  "./js/trophy-room.js",
  "./js/achievements.js",
  "./js/save.js",
  "./js/daily.js",
  "./js/guide.js",
  "./js/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Per navigazione o index.html: Network First con fallback su cache
  if (event.request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Per asset statici (JS, CSS, font, immagini): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

