// sw.js — Service Worker untuk Misha AI
const CACHE_NAME = "misha-ai-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "https://i.postimg.cc/g0mCyGxs/1000103723-removebg-preview.png"
];

// Install service worker dan simpan file ke cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Aktifkan dan hapus cache lama
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

// Ambil file dari cache terlebih dahulu, baru jaringan
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() =>
        caches.match("./index.html")
      );
    })
  );
});