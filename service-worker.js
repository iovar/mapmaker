const CACHE_NAME = 'mapmaker-v1';

// Assets to cache on install
const CACHED_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/css/main.css',
  '/src/js/main.js',
  '/src/js/canvas.js',
  '/src/js/assetManager.js',
  '/src/js/mapSaver.js',
  '/src/js/utils.js',
  '/src/assets/index.json',
  '/src/assets/Classic Dungeon/index.json',
  '/src/assets/Old School Blue Dungeon/index.json',
  '/img/site/favicon.ico',
  '/img/site/icon-192.png',
  '/img/site/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets');
        return cache.addAll(CACHED_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - respond with cached assets when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Cache successful responses for assets
              if (response.ok && 
                  (event.request.url.includes('/src/assets/') || 
                   event.request.url.includes('/img/'))) {
                
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            })
            .catch(error => {
              // Fallback for assets that aren't cached
              console.log('Fetch failed, returning offline page', error);
              
              // If it's an image request, provide a placeholder
              if (event.request.headers.get('Accept').includes('image')) {
                return caches.match('/img/site/placeholder.png');
              }
            });
        })
    );
  }
});