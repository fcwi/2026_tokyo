// Service Worker - 簡化版：只做導航請求離線支援
const CACHE_NAME = 'tokyo-trip-offline-v1';

// 安裝：立即激活
self.addEventListener('install', () => {
  self.skipWaiting();
});

// 激活：接管所有頁面
self.addEventListener('activate', () => {
  self.clients.claim();
});

// Fetch：只處理導航請求的離線 fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // 只處理 GET 導航請求
  if (request.method !== 'GET' || request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    fetch(request).catch(() => {
      // 網路失敗時，提示離線
      return new Response(
        '網路不可用，請檢查連線',
        { status: 503, statusText: 'Offline' }
      );
    })
  );
});
