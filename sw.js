const CACHE = 'catch-log-v1';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Always go network-first for weather API calls
  if (e.request.url.includes('open-meteo.com') || e.request.url.includes('fonts.googleapis.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('')));
    return;
  }
  // Network-first for everything else, fall back to cache
  e.respondWith(
    fetch(e.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});
