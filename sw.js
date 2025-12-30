// Service Worker - 簡化快取版：離線瀏覽已訪問的行程
const CACHE_NAME = 'tokyo-trip-offline-v1';

// 安裝：立即激活
self.addEventListener('install', () => {
  self.skipWaiting();
});

// 激活：接管所有頁面
self.addEventListener('activate', () => {
  self.clients.claim();
});

// Fetch：導航用 Network First，靜態資源用 Cache First
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只處理 GET 請求
  if (request.method !== 'GET') return;

  // 靜態資源（JS/CSS/圖片）：Cache First
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2|woff)$$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        // 快取命中，直接返回
        if (cached) return cached;
        
        // 快取未命中，fetch 並在背景快取（不阻塞返回）
        return fetch(request).then((response) => {
          if (response && response.ok && response.type !== 'opaque') {
            // 背景非同步快取（不等待）
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone()).catch(() => {});
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 導航（HTML）：Network First
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功時在背景快取
          if (response && response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone()).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => {
          // 網路失敗，返回快取
          return caches
            .match(request)
            .then((cached) => cached || new Response('離線模式：網路不可用'));
        })
    );
    return;
  }
});
