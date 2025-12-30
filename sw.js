// Service Worker - 離線支援與資源緩存
const CACHE_NAME = 'tokyo-trip-cache-v1';
const RUNTIME_CACHE = 'tokyo-trip-runtime-v1';

// 安全緩存封裝，避免重複使用已消耗的 Response
const tryCachePut = async (cacheName, request, responseClone) => {
  try {
    if (!responseClone) return;
    const cache = await caches.open(cacheName);
    await cache.put(request, responseClone);
  } catch (err) {
    // 低權限回應(opaqueredirect) 時跳過
    console.warn('Cache put skipped:', err);
  }
};

// 安裝事件
self.addEventListener('install', (event) => {
  // 不主動預緩存，讓首次訪問時動態緩存
  // 這樣可避免預緩存失敗導致整個 SW 安裝失敗
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
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const clone = response.clone();
            tryCachePut(RUNTIME_CACHE, request, clone);
          }
          return response;
        } catch (err) {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response(
              JSON.stringify({ error: '網路不可用，請檢查連線' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'application/json' }),
              },
            )
          );
        }
      })(),
    );
    return;
  }

  // 靜態資源（JS/CSS/圖片）：Cache First（緩存優先）
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2|woff|ttf)$/i) ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.ok) {
          const clone = response.clone();
          tryCachePut(RUNTIME_CACHE, request, clone);
        }
        return response;
      })(),
    );
    return;
  }

  // HTML 頁面：Network First（網路優先以取得最新內容）
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response) {
            const clone = response.clone();
            tryCachePut(RUNTIME_CACHE, request, clone);
          }
          return response;
        } catch (err) {
          const cached = await caches.match(request);
          const scopeRoot = new URL('./', self.registration.scope).pathname;
          return cached || (await caches.match(scopeRoot));
        }
      })(),
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
