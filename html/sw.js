'use strict';

const CACHE_NAME = 'microchess-v2';
const SHELL = [
    '/',
    '/auth-frontend.js',
    '/rank-ui.js',
    '/replay-ui.js',
    '/manifest.json',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Only cache GET requests; pass through API/socket calls
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/socket.io')) return;
    if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/player') ||
        url.pathname.startsWith('/match') || url.pathname.startsWith('/leaderboard')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // Cache successful static responses
                if (response.ok && event.request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback: return cached root
                if (event.request.mode === 'navigate') return caches.match('/');
            });
        })
    );
});
