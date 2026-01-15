// Minimal service worker for development
// This file overrides any stale production service worker to ensure fresh content during development

self.addEventListener('install', () => {
  // Skip waiting to immediately activate this SW
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear all caches to ensure fresh content in dev
      caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))),
    ])
  );
});

// Pass through all fetch requests - no caching in development
self.addEventListener('fetch', () => {
  // Let the browser handle the request normally
});
