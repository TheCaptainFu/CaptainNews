const CACHE_NAME = 'captainnews-v1';
const SHELL = [
    '/',
    '/index.html',
    '/contact.html',
    '/policy.html',
    '/src/output.css',
    '/src/main.css',
    '/js/main.js',
    '/js/cookieconsent-init.js',
    '/icons/logo.png',
    '/icons/favicon.png',
    '/manifest.json'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)));
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
    const url = e.request.url;

    // News data: network first (fresh news), fallback to cache
    if (url.includes('news.json') || url.includes('workers.dev')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }

    // Everything else: cache first, fallback to network
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
