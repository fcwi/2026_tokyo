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
