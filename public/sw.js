/* GoEvee offline service worker.
 * - Page loads: network first, falling back to the cached page or the app shell.
 * - Hashed build assets and mock images: cache first (they never change in place).
 * - Everything else same-origin: stale-while-revalidate.
 * - API calls and cross-origin requests are never touched.
 * Bump VERSION to retire old caches.
 */
const VERSION = 'goevee-v1';
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const SHELL_URL = '/';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(PAGES).then(cache => cache.add(SHELL_URL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => !key.startsWith(VERSION)).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter(url => {
    try {
      return new URL(url).origin === self.location.origin;
    } catch {
      return false;
    }
  });
  event.waitUntil(caches.open(ASSETS).then(cache => Promise.all(urls.map(url => cache.add(url).catch(() => undefined)))));
});

const isImmutable = url => url.pathname.startsWith('/assets/') || url.pathname.startsWith('/mock/');

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/health') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(SHELL_URL)) || Response.error()),
    );
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(ASSETS).then(cache => cache.put(request, copy));
        }
        return response;
      })),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(ASSETS).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
