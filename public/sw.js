const VERSION = '2026-03-05-1';
const STATIC_CACHE = `daily-static-${VERSION}`;
const PAGE_CACHE = `daily-page-${VERSION}`;
const RUNTIME_CACHE = `daily-runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/?source=pwa',
  '/list',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/css/components.css',
  '/css/toolbar.css',
  '/css/dark-mode.css',
  '/js/toolbar.js',
  '/js/route-transitions.js',
  '/js/pwa-register.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const validCaches = [STATIC_CACHE, PAGE_CACHE, RUNTIME_CACHE];

    await Promise.all(
      cacheNames
        .filter(name => !validCaches.includes(name))
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isStaticAssetRequest(request, url) {
  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    return true;
  }

  return url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/');
}

async function navigationNetworkFirst(request) {
  const pageCache = await caches.open(PAGE_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      await pageCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_error) {
    const cachedPage = await pageCache.match(request, { ignoreSearch: true });
    if (cachedPage) {
      return cachedPage;
    }

    const staticCache = await caches.open(STATIC_CACHE);
    const cachedShell = await staticCache.match(request, { ignoreSearch: true });
    if (cachedShell) {
      return cachedShell;
    }

    const offlinePage = await staticCache.match('/offline.html');

    if (offlinePage) {
      return offlinePage;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const cached = await runtimeCache.match(request);

  const networkPromise = fetch(request)
    .then(async response => {
      if (response && (response.ok || response.type === 'opaque')) {
        await runtimeCache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (isNavigationRequest(request)) {
    event.respondWith(navigationNetworkFirst(request));
    return;
  }

  if (isStaticAssetRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
