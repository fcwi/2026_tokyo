import React from "react";
import { Bot, User, Loader, Volume2 } from "lucide-react";

const ChatMessageList = ({
  messages,
  isDarkMode,
  theme,
  renderMessage,
  handleSpeak,
  isLoading,
  loadingText,
  chatEndRef,
  setFullPreviewImage,
}) => {
  return (
    <div
      className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 ${
        isDarkMode ? "bg-black/20" : "bg-[#F9F9F6]/50"
      }`}
    >
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
        >
          {/* Avatar Column */}
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

            {/* Speak Button */}
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

          {/* Message Bubble */}
          <div
            className={`max-w-[75%] group relative transition-all duration-300`}
          >
            <div
              className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm border
                ${
                  msg.role === "user"
                    ? isDarkMode
                      ? "bg-sky-800 text-white border-sky-700 rounded-tr-none"
                      : "bg-[#5D737E] text-white rounded-tr-none border-[#4A606A]"
                    : isDarkMode
                      ? "bg-neutral-800/90 backdrop-blur-sm text-neutral-200 border-neutral-700 rounded-tl-none"
                      : "bg-white/90 backdrop-blur-sm text-stone-700 border-stone-200 rounded-tl-none"
                }`}
            >
              {/* 顯示圖片 */}
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Sent Image"
                  onClick={() => setFullPreviewImage(msg.image)}
                  className="mb-2 max-w-full h-auto rounded-lg border border-white/20 shadow-sm object-cover cursor-zoom-in active:scale-95 transition-transform"
                />
              )}
              {/* 顯示文字 */}
              {renderMessage(msg.text)}
            </div>
          </div>
        </div>
      ))}

      {/* Loading Indicator */}
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
