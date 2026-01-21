// 檔案說明：
// 應用啟動程式（entry point）
// - 主要職責：載入全域 CSS 並在 DOM#root 上 Mount `App` 元件
// - 不包含業務邏輯，僅作為 React 應用入口
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Loader } from "lucide-react";
import "./index.css";
import "@fontsource/noto-sans-tc"; // 預設載入 400 字重
import "@fontsource/noto-sans-tc/700.css"; // 需要粗體再額外引入
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#FDFBF7]">
          <Loader className="w-10 h-10 animate-spin text-stone-400" />
        </div>
      }
    >
      <App />
    </Suspense>
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
