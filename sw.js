// Service Worker - 離線支援與資源緩存
const CACHE_NAME = 'tokyo-trip-cache-v1';
const RUNTIME_CACHE = 'tokyo-trip-runtime-v1';

// 需要預緩存的核心資源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 安裝事件：預緩存核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.log('預緩存失敗，部分資源可能不可用:', err);
      });
    }),
  );
  self.skipWaiting(); // 立即激活新 SW
});

// 激活事件：清理舊緩存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim(); // 立即接管所有頁面
});

// Fetch 事件：智能路由與緩存
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== 'GET') return;

  // 跳過 chrome 擴展和外部協議
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // API 請求：Network First（網路優先，失敗用緩存）
  if (
    url.pathname.includes('/api/') ||
    url.hostname.includes('maps.googleapis.com') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('api.open-meteo.com')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 快取成功回應
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // 網路失敗，回傳緩存或離線頁面
          return caches.match(request).then((cached) => {
            return (
              cached ||
              new Response(
                JSON.stringify({
                  error: '網路不可用，請檢查連線',
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'application/json',
                  }),
                },
              )
            );
          });
        }),
    );
    return;
  }

  // 靜態資源（JS/CSS/圖片）：Cache First（緩存優先）
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2|woff|ttf)$/i) ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
        );
      }),
    );
    return;
  }

  // HTML 頁面：Network First（網路優先以取得最新內容）
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches
            .open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        }),
    );
    return;
  }
});

// 監聽來自頁面的消息（例如：清除緩存）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
