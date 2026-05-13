const CACHE_NAME = 'captainnews-v2';
const STATIC_ASSETS = [
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
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
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

    // Images & fonts: cache first (they don't change)
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

    // HTML, CSS, JS: network first so updates are immediate
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
