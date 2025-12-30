// 檔案說明：
// 應用啟動程式（entry point）
// - 主要職責：載入全域 CSS 並在 DOM#root 上 Mount `App` 元件
// - 不包含業務邏輯，僅作為 React 應用入口
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 註冊 Service Worker（離線支援與緩存）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // 相對於應用 base 路徑的 SW 位置
    const swPath = import.meta.env.BASE_URL + "sw.js";
    navigator.serviceWorker
      .register(swPath)
      .then((reg) => {
        console.log("✅ Service Worker 註冊成功:", reg.scope);
      })
      .catch((err) => {
        console.warn("⚠️ Service Worker 註冊失敗:", err);
      });
  });
}
