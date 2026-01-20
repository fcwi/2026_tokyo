import React from "react";
import { Home, DollarSign, MessageSquare, Store, BookOpen } from "lucide-react";

/**
 * BottomNav 組件
 * 提取自 App.jsx，負責底部導覽切換。
 *
 * Props:
 * - activeTab: 當前啟動的分頁 (string)
 * - onTabChange: 切換分頁的回呼函式 (映射自原始 handleTabChange)
 * - handleInterruptClick: 點擊中斷邏輯函式
 * - isDarkMode: 是否為深色模式 (boolean)
 * - theme: 包含顏色配置的物件 (映射自原始 currentTheme)
 */
const BottomNav = ({
  activeTab,
  onTabChange,
  handleInterruptClick,
  isDarkMode,
  theme,
}) => {
  // 為了保持 JSX 內容 100% 不變，將 Props 映射回原始代碼中的變數名
  const handleTabChange = onTabChange;
  const cBase = theme.colorBase;
  const cAccent = theme.colorAccent;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto pb-[env(safe-area-inset-bottom)]">
      <div
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-2xl border transition-all duration-300
        ${
          isDarkMode
            ? `bg-${cBase}-900/60 border-white/10 ring-1 ring-white/5 shadow-lg shadow-black/20`
            : "bg-white/70 border-white/40 ring-1 ring-black/5 shadow-lg shadow-black/5"
        }`}
      >
        {/* 1. 行程 (Itinerary) */}
        <button
          onClick={() => {
            handleInterruptClick();
            handleTabChange("itinerary");
          }}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group backdrop-blur-lg border
            ${
              activeTab === "itinerary"
                ? isDarkMode
                  ? `bg-${cBase}-800/60 text-${cAccent}-400 border-${cBase}-600/30 ring-1 ring-${cAccent}-500/20 shadow-lg shadow-black/10 -translate-y-0.5`
                  : `bg-white/90 text-${cBase}-800 border-white/60 ring-1 ring-black/5 shadow-lg shadow-black/10 -translate-y-0.5`
                : isDarkMode
                  ? `border-white/5 text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/30 hover:border-white/10`
                  : `border-white/20 text-${cBase}-400 hover:text-${cBase}-700 hover:bg-white/40 hover:border-white/30`
            }`}
        >
          <Home
            className={`w-5 h-5 transition-all ${activeTab === "itinerary" ? "stroke-[2.5px]" : "stroke-2"}`}
          />
          {activeTab === "itinerary" && (
            <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
          )}
        </button>

        {/* 2. 記帳記事 (Finance) */}
        <button
          onClick={() => {
            handleInterruptClick();
            handleTabChange("finance");
          }}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-lg border
            ${
              activeTab === "finance"
                ? isDarkMode
                  ? `bg-${cBase}-800/60 text-${cAccent}-400 border-${cBase}-600/30 ring-1 ring-${cAccent}-500/20 shadow-lg shadow-black/10 -translate-y-0.5`
                  : `bg-white/90 text-${cBase}-800 border-white/60 ring-1 ring-black/5 shadow-lg shadow-black/10 -translate-y-0.5`
                : isDarkMode
                  ? `border-white/5 text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/30 hover:border-white/10`
                  : `border-white/20 text-${cBase}-400 hover:text-${cBase}-700 hover:bg-white/40 hover:border-white/30`
            }`}
        >
          <DollarSign
            className={`w-5 h-5 transition-all ${activeTab === "finance" ? "stroke-[2.5px]" : "stroke-2"}`}
          />
          {activeTab === "finance" && (
            <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
          )}
        </button>

        {/* 3. AI 核心按鈕 (使用查表法確保 Tailwind 類名完整) */}
        <button
          onClick={() => {
            handleInterruptClick();
            handleTabChange("ai");
          }}
          className={`mx-1 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-md active:scale-95 border
            ${
              activeTab === "ai"
                ? "scale-110 ring-4 ring-opacity-20 -translate-y-1"
                : "hover:scale-105"
            }
            ${(() => {
              const styles = {
                amber: isDarkMode
                  ? "bg-gradient-to-tr from-amber-600/90 to-amber-500/90 ring-amber-500/40 border-amber-400/20 shadow-amber-900/40"
                  : "bg-gradient-to-tr from-amber-400 to-amber-500 ring-amber-400/40 border-amber-300/40 shadow-amber-500/40",
                sky: isDarkMode
                  ? "bg-gradient-to-tr from-sky-600/90 to-sky-500/90 ring-sky-500/40 border-sky-400/20 shadow-sky-900/40"
                  : "bg-gradient-to-tr from-sky-400 to-sky-500 ring-sky-400/40 border-sky-300/40 shadow-sky-500/40",
                default: isDarkMode
                  ? "bg-gradient-to-tr from-stone-600 to-stone-500 ring-stone-500/40 border-stone-400/20"
                  : "bg-gradient-to-tr from-stone-400 to-stone-500 ring-stone-400/40 border-stone-300/40",
              };
              return styles[cAccent] || styles.default;
            })()}
          `}
        >
          <MessageSquare className="w-6 h-6 text-white drop-shadow-md" />
        </button>

        {/* 4. 商家 (Shops) */}
        <button
          onClick={() => {
            handleInterruptClick();
            handleTabChange("shops");
          }}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-lg border
            ${
              activeTab === "shops"
                ? isDarkMode
                  ? `bg-${cBase}-800/60 text-${cAccent}-400 border-${cBase}-600/30 ring-1 ring-${cAccent}-500/20 shadow-lg shadow-black/10 -translate-y-0.5`
                  : `bg-white/90 text-${cBase}-800 border-white/60 ring-1 ring-black/5 shadow-lg shadow-black/10 -translate-y-0.5`
                : isDarkMode
                  ? `border-white/5 text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/30 hover:border-white/10`
                  : `border-white/20 text-${cBase}-400 hover:text-${cBase}-700 hover:bg-white/40 hover:border-white/30`
            }`}
        >
          <Store
            className={`w-5 h-5 ${activeTab === "shops" ? "stroke-[2.5px]" : "stroke-2"}`}
          />
          {activeTab === "shops" && (
            <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
          )}
        </button>

        {/* 5. 指南與連結 (Guides) */}
        <button
          onClick={() => {
            handleInterruptClick();
            handleTabChange("guides");
          }}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-lg border
            ${
              activeTab === "guides"
                ? isDarkMode
                  ? `bg-${cBase}-800/60 text-${cAccent}-400 border-${cBase}-600/30 ring-1 ring-${cAccent}-500/20 shadow-lg shadow-black/10 -translate-y-0.5`
                  : `bg-white/90 text-${cBase}-800 border-white/60 ring-1 ring-black/5 shadow-lg shadow-black/10 -translate-y-0.5`
                : isDarkMode
                  ? `border-white/5 text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/30 hover:border-white/10`
                  : `border-white/20 text-${cBase}-400 hover:text-${cBase}-700 hover:bg-white/40 hover:border-white/30`
            }`}
        >
          <BookOpen
            className={`w-5 h-5 transition-all ${activeTab === "guides" ? "stroke-[2.5px]" : "stroke-2"}`}
          />
          {activeTab === "guides" && (
            <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
