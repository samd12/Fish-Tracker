const CACHE = 'catch-log-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Inconsolata:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
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
  if (e.request.url.includes('open-meteo.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return response;
    }))
  );
});
