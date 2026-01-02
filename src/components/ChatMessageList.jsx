import React from "react";
import { Bot, User, Loader, Volume2 } from "lucide-react";

const ChatMessageList = ({
  messages,
  isDarkMode,
  theme,
  currentTheme, // 當前主題配置
  renderMessage,
  handleSpeak,
  isLoading,
  loadingText,
  chatEndRef,
  setFullPreviewImage,
}) => {
  // 根據主題配置定義聊天氣泡顏色
  const chatColors = currentTheme?.chatColors || {
    userBubble: {
      light: "bg-[#5D737E] text-white border-[#4A606A]",
      dark: "bg-sky-800 text-white border-sky-700"
    },
    modelBubble: {
      light: "bg-white/90 backdrop-blur-sm text-stone-700 border-stone-200",
      dark: "bg-neutral-800/90 backdrop-blur-sm text-neutral-200 border-neutral-700"
    },
    bg: {
      light: "bg-[#F9F9F6]/50",
      dark: "bg-black/20"
    }
  };

  return (
    <div
      className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 ${
        isDarkMode ? chatColors.bg.dark : chatColors.bg.light
      }`}
    >
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
        >
          {/* 頭像欄位：區分使用者與 AI */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border
                ${
                  msg.role === "user"
                    ? isDarkMode
                      ? "bg-sky-800 text-white border-sky-700"
                      : "bg-[#5D737E] text-white border-[#4A606A]"
                    : isDarkMode
                      ? "bg-neutral-800 text-sky-300 border-neutral-700"
                      : "bg-white text-[#5D737E] border-stone-200"
                }`}
            >
              {msg.role === "user" ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>

            {/* 朗讀按鈕：僅在 AI 回覆時顯示 */}
            {msg.role === "model" && (
              <button
                onClick={() => handleSpeak(msg.text)}
                className={`p-1 rounded-full transition-all ${
                  isDarkMode
                    ? "text-sky-300 hover:bg-neutral-700"
                    : "text-[#5D737E] hover:bg-stone-200"
                }`}
                title="朗讀訊息"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 訊息氣泡：包含圖片預覽與文字內容 */}
          <div
            className={`max-w-[75%] group relative transition-all duration-300`}
          >
            <div
              className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm border
                ${
                  msg.role === "user"
                    ? isDarkMode
                      ? chatColors.userBubble.dark + " rounded-tr-none"
                      : chatColors.userBubble.light + " rounded-tr-none"
                    : isDarkMode
                      ? chatColors.modelBubble.dark + " rounded-tl-none"
                      : chatColors.modelBubble.light + " rounded-tl-none"
                }`}
            >
              {/* 圖片附件預覽 */}
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Sent Image"
                  onClick={() => setFullPreviewImage(msg.image)}
                  className="mb-2 max-w-full h-auto rounded-lg border border-white/20 shadow-sm object-cover cursor-zoom-in active:scale-95 transition-transform"
                />
              )}
              {/* 渲染文字內容 (支援 Markdown 或特殊格式) */}
              {renderMessage(msg.text)}
            </div>
          </div>
        </div>
      ))}

      {/* 載入中狀態指示器 */}
      {isLoading && (
        <div className="flex gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border ${
              isDarkMode
                ? "bg-neutral-800 border-neutral-700"
                : "bg-white border-stone-200"
            }`}
          >
            <Bot
              className={`w-5 h-5 ${isDarkMode ? "text-sky-300" : "text-[#5D737E]"}`}
            />
          </div>
          <div
            className={`p-3 rounded-2xl rounded-tl-none border shadow-sm flex items-center gap-2 ${
              isDarkMode
                ? "bg-neutral-800/60 border-neutral-700"
                : "bg-white/80 border-stone-200"
            }`}
          >
            <Loader
              className={`w-4 h-4 animate-spin ${isDarkMode ? "text-sky-300" : "text-[#5D737E]"}`}
            />
            <span className={`text-xs ${theme.textSec}`}>
              {loadingText || "正在翻閱您的行程表..."}
            </span>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default React.memo(ChatMessageList);
