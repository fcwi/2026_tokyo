import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/2026_tokyo/", // 👈 這裡一定要改成這樣！
  build: {
    // 提高警告閾值到 1000 kB（gzip 後的大小仍在可接受範圍內）
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手動分塊：將第三方庫分離出來
        manualChunks: {
          // React 相關庫
          'react-vendor': ['react', 'react-dom'],
          // 動畫庫
          'motion-vendor': ['framer-motion'],
          // 圖標庫
          'icons-vendor': ['lucide-react'],
        },
      },
    },
  },
});
