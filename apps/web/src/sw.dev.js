// Minimal service worker for development
// Replaces any stale production service worker and does nothing else
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
