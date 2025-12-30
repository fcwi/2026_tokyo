// Service Worker - 極簡版：只提供離線導航支援
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Fetch：只攔截導航請求，無複雜快取邏輯
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // 只處理 GET 導航請求
  if (request.method !== 'GET' || request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    fetch(request).catch(() => {
      return new Response('離線模式：網路不可用', { status: 503 });
    })
  );
});
