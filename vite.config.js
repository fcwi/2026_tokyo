import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa"; // 🆕 引入 PWA 套件

// 🆕 生成構建版本號（使用當前時間）
const generateBuildVersion = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// https://vitejs.dev/config/
export default defineConfig({
  // 🆕 定義環境變數
  define: {
    'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(generateBuildVersion()),
  },
  
  // 🆕 在 plugins 陣列中加入 VitePWA
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // 自動更新模式：部署新版後，使用者重整即更新
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],

      // Manifest 設定：這決定了安裝到手機桌面時的樣子
      manifest: {
        name: "2026 東京輕井澤六日遊",
        short_name: "日本旅遊",
        description: "東京輕井澤家庭旅遊行程助手",
        theme_color: "#ffffff",
        display: "standalone", // 讓它看起來像原生 App (沒有瀏覽器網址列)
        icons: [
          {
            src: "pwa-192x192.png", // 注意：需要在 public 資料夾放入這些圖片，否則 Console 會報錯，但不影響運作
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      // 🛠️ Workbox 快取策略：這是「複雜快取」的核心
      workbox: {
        // 1. 靜態資源預先快取：讓 HTML, JS, CSS, 圖片在離線時也能載入
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],

        // 2. 執行時快取 (Runtime Caching)
        runtimeCaching: [
          // (A) Google Fonts 字型：很少變動，優先用快取，過期時間設很長 (1年)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // (B) 天氣 API (Open-Meteo)：資料需要新鮮
          // 使用 NetworkFirst (網路優先)：有網路抓最新的，沒網路才用舊資料
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: "StaleWhileRevalidate", // 👈 改成這招：有舊的先給舊的，背景再更新
            options: {
              cacheName: "weather-api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 延長到 24 小時，確保隔天沒網路也能看昨天的預報
              },
              cacheableResponse: {
                statuses: [0, 200], // 👈 關鍵：強制快取，避免因為 CORS 問題不存
              },
            },
          },
          // (C) 外部圖片或地圖圖磚 (如果有用到)
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
              },
            },
          },
        ],
      },
    }),
  ],

  base: "/2026_tokyo/", // ✅ 保留您的設定

  build: {
    // ✅ 保留您的優化設定
    chunkSizeWarningLimit: 1000,
    // 🆕 啟用 terser 壓縮優化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console.log 以便除錯
        drop_debugger: true, // 移除 debugger
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "motion-vendor": ["framer-motion"],
          "icons-vendor": ["lucide-react"],
          // 🆕 分離地圖相關庫（較大）
          "map-vendor": ["react-leaflet", "leaflet"],
          // Firebase 使用模塊化導出，會自動分割，無需手動配置
        },
      },
    },
  },
});
