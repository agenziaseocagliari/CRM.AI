// Service Worker for Guardian AI CRM
// Implements advanced caching strategies for performance optimization

const CACHE_NAME = 'guardian-ai-crm-v1';
const STATIC_CACHE = 'guardian-static-v1';
const DYNAMIC_CACHE = 'guardian-dynamic-v1';
const API_CACHE = 'guardian-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files after build
];

// API endpoints to cache (currently unused but available for future features)
// const API_ENDPOINTS = [
//   '/api/users',
//   '/api/contacts',
//   '/api/dashboard/stats',
//   '/api/activities',
// ];

// Cache duration settings (in seconds)
const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60, // 30 days
  DYNAMIC: 24 * 60 * 60,     // 1 day  
  API: 10 * 60,              // 10 minutes
  IMAGES: 7 * 24 * 60 * 60,  // 7 days
};

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error caching static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Cache with network-first strategy
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - Cache-first strategy
    event.respondWith(handleStaticAsset(request));
  } else if (isImageRequest(url.pathname)) {
    // Images - Cache-first with fallback
    event.respondWith(handleImageRequest(request));
  } else {
    // HTML pages - Network-first with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  // Skip unsupported schemes
  if (!request.url.startsWith('http')) {
    return fetch(request);
  }
  
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      const responseClone = networkResponse.clone();
      
      // Add timestamp for cache expiration
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      console.log('📡 API cached:', url.pathname);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Network failed, trying cache for:', url.pathname, error);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const age = cachedAt ? (Date.now() - parseInt(cachedAt)) / 1000 : Infinity;
      
      if (age < CACHE_DURATION.API) {
        console.log('✅ Serving from API cache:', url.pathname);
        return cachedResponse;
      } else {
        console.log('⏰ API cache expired for:', url.pathname);
      }
    }
    
    // Return error response if no cache available
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  // Skip unsupported schemes
  if (!request.url.startsWith('http')) {
    return fetch(request);
  }
  
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('⚡ Serving static asset from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('📦 Static asset cached:', request.url);
    }
    
    return networkResponse;
  } catch {
    console.error('❌ Failed to fetch static asset:', request.url);
    return new Response('Asset not available', { status: 404 });
  }
}

// Cache-first strategy for images with progressive enhancement
async function handleImageRequest(request) {
  // Skip unsupported schemes
  if (!request.url.startsWith('http')) {
    return fetch(request);
  }
  
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('🖼️ Serving image from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('🖼️ Image cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Image failed to load:', request.url, error);
    
    // Return placeholder image for failed requests
    return new Response(
      `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="#9ca3af" text-anchor="middle" dy=".3em">Image not available</text>
      </svg>`,
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Network-first strategy for HTML pages
async function handlePageRequest(request) {
  // Skip unsupported schemes
  if (!request.url.startsWith('http')) {
    return fetch(request);
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('📄 Page cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Network failed, trying cache for page:', request.url, error);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📄 Serving page from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline page if available
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Final fallback
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><title>Offline - Guardian AI CRM</title></head>
      <body>
        <h1>You are offline</h1>
        <p>Please check your internet connection and try again.</p>
      </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|woff|woff2|ttf|otf)$/);
}

function isImageRequest(pathname) {
  return pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when connection is restored
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      await processOfflineAction(action);
    }
    
    await clearOfflineActions();
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Cache management utilities
async function getOfflineActions() {
  // Retrieve offline actions from IndexedDB or localStorage
  return [];
}

async function processOfflineAction(action) {
  // Process queued offline actions
  console.log('Processing offline action:', action);
}

async function clearOfflineActions() {
  // Clear processed offline actions
  console.log('Clearing offline actions');
}

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupOldCache());
  }
});

async function cleanupOldCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedAt = response.headers.get('sw-cached-at');
        if (cachedAt) {
          const age = (Date.now() - parseInt(cachedAt)) / 1000;
          const maxAge = cacheName.includes('api') ? CACHE_DURATION.API : CACHE_DURATION.DYNAMIC;
          
          if (age > maxAge) {
            await cache.delete(request);
            console.log('🗑️ Deleted expired cache entry:', request.url);
          }
        }
      }
    }
  }
  
  console.log('✅ Cache cleanup completed');
}