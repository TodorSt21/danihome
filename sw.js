const CACHE = 'pamet-v31';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never intercept Supabase
  if (event.request.url.includes('supabase.co')) return;

  // Never cache app core files - always fetch from network
  const url = new URL(event.request.url);
  const neverCache = ['/pamet/', '/pamet/index.html', '/pamet/app.js'];
  if (neverCache.some(p => url.pathname === p || url.pathname.endsWith('/pamet/'))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests - always network
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets (fonts, icons, MapTiler) - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
