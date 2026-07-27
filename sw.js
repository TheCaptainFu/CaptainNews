const CACHE_NAME = 'captainnews-v4';
const PRECACHE = [
    '/',
    '/contact/',
    '/policy/',
    '/manifest.json',
    '/icons/logo.png?v=2',
    '/icons/favicon.png?v=2'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // News data: network only
    if (url.href.includes('news.json') || url.href.includes('workers.dev')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }

    // CSS και JS: network always (ώστε οι αλλαγές να φαίνονται αμέσως)
    if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/js/')) {
        e.respondWith(fetch(e.request));
        return;
    }

    // HTML: network first, fallback cache
    if (e.request.destination === 'document') {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // Εικόνες/fonts: cache first
    if (e.request.destination === 'image' || e.request.destination === 'font') {
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return res;
            }))
        );
        return;
    }

    // Υπόλοιπα: network first
    e.respondWith(
        fetch(e.request)
            .then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});
