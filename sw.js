const CACHE = 'pamet-v1';
const STATIC = ['styles.css', 'styles/design-system.css', 'icons/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('index.html') || e.request.url.endsWith('/pamet/') || e.request.url.includes('app.js')) return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
