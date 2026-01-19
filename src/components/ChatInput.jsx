import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Camera, X, Mic, MicOff, Send } from "lucide-react";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  listeningLang,
  toggleListening,
  fileInputRef,
  handleImageSelect,
  selectedImage,
  clearImage,
  handleSendMessage,
  isLoading,
  isDarkMode,
  tripConfig,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [sendAttempts, setSendAttempts] = useState(0);
  const [popupPosition, setPopupPosition] = useState({
    bottom: "80px",
    left: "16px",
  });
  const micButtonRef = useRef(null);

  // 計算語音按鈕列表位置 - 在 effect 中執行，避免 render 期間訪問 ref
  useEffect(() => {
    if (showActions && micButtonRef.current) {
      const rect = micButtonRef.current.getBoundingClientRect();
      setPopupPosition({
        bottom: `${window.innerHeight - rect.top + 12}px`,
        left: `${rect.left}px`,
      });
    }
  }, [showActions]);

  // 🚀 智慧重試包裝器：如果發送失敗，可在此層級進行簡單重試或狀態管理
  const onSendMessage = async () => {
    try {
      setSendAttempts((prev) => prev + 1);
      await handleSendMessage();
      setSendAttempts(0); // 成功後重置
    } catch (error) {
      console.error("Message send failed:", error);
      // 這裡可以實作自動重試邏輯，例如：
      if (sendAttempts < 2) {
        console.log(`自動重試中... 第 ${sendAttempts + 1} 次`);
        setTimeout(onSendMessage, 1000 * (sendAttempts + 1));
      }
    }
  };

  return (
    <div
      className={`shrink-0 border-t backdrop-blur-xl transition-all duration-300 z-20 
        ${
          isDarkMode
            ? "bg-neutral-900/70 border-white/20 ring-1 ring-white/5"
            : "bg-white/80 border-stone-200/60 ring-1 ring-black/5"
        }`}
    >
      <div className="px-3 py-2.5">
        {/* 圖片附件預覽 */}
        {selectedImage && (
          <div className="flex gap-2 mb-2 animate-slideUp">
            <div className="relative group">
              <img
                src={selectedImage}
                alt="Upload Preview"
                className="h-14 w-auto rounded-xl border border-white/20 shadow-sm object-cover"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-all active:scale-90 z-10"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}

        {/* 隱藏的檔案選擇器 */}
        <input
          type="file"
          id="chatImageUpload"
          name="chatImageUpload"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        {/* 輸入控制區域：精確對標記帳頁面 gap-1.5 */}
        <div className="flex items-center gap-1.5">
          {/* 相機按鈕 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-2xl border transition-all flex-shrink-0 active:scale-95
              ${
                isDarkMode
                  ? "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200"
                  : "bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-700"
              }`}
            title="上傳圖片"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* 功能選單按鈕 */}
          <div className="relative">
            <button
              ref={micButtonRef}
              onClick={() => setShowActions(!showActions)}
              className={`p-2.5 rounded-2xl border transition-all flex-shrink-0 active:scale-95 relative
                ${
                  showActions
                    ? isDarkMode
                      ? "bg-neutral-700 border-neutral-600 text-white rotate-45"
                      : "bg-stone-200 border-stone-300 text-stone-600 rotate-45"
                    : isDarkMode
                      ? "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200"
                      : "bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-700"
                }`}
              title="語音輸入選單"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* 語音按鈕列表 - 使用 Portal 渲染到 body，避免被任何容器遮擋 */}
            {showActions &&
              createPortal(
                <div
                  style={popupPosition}
                  className={`fixed flex gap-1.5 animate-fadeInLeft p-1.5 rounded-2xl border shadow-2xl z-[9999] backdrop-blur-2xl
                ${
                  isDarkMode
                    ? "bg-neutral-800/95 border-white/10"
                    : "bg-white/95 border-stone-200"
                }`}
                >
                  <button
                    onClick={() => {
                      toggleListening("zh-TW");
                      setShowActions(false);
                    }}
                    className={`px-3 py-2 rounded-xl transition-all border flex-shrink-0 active:scale-95 flex items-center gap-1.5
                    ${
                      listeningLang === "zh-TW"
                        ? "bg-sky-500 text-white border-sky-400"
                        : isDarkMode
                          ? "bg-neutral-700 border-neutral-600 text-sky-400"
                          : "bg-white border-stone-200 text-sky-600 shadow-sm"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span className="font-bold text-xs">中</span>
                  </button>

                  {tripConfig?.language?.code && (
                    <button
                      onClick={() => {
                        toggleListening(tripConfig.language.code);
                        setShowActions(false);
                      }}
                      className={`px-3 py-2 rounded-xl transition-all border flex-shrink-0 active:scale-95 flex items-center gap-1.5
                      ${
                        listeningLang === tripConfig.language.code
                          ? "bg-rose-500 text-white border-rose-400"
                          : isDarkMode
                            ? "bg-neutral-700 border-neutral-600 text-rose-300"
                            : "bg-white border-stone-200 text-rose-500 shadow-sm"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span className="font-bold text-xs">
                        {tripConfig.language.label}
                      </span>
                    </button>
                  )}
                </div>,
                document.body,
              )}
          </div>

          {/* 文字輸入框：對標記帳頁面，移除外邊框改用背景色區分 */}
          <div
            className={`flex-1 min-w-0 flex items-center rounded-2xl overflow-hidden transition-all duration-300
            ${isDarkMode ? "bg-neutral-900/80 border border-neutral-700" : "bg-stone-100"}`}
          >
            <textarea
              id="chatMessageInput"
              name="chatMessageInput"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                  e.target.style.height = "auto";
                }
              }}
              rows={1}
              placeholder={listeningLang ? "正在聽取聲音..." : "輸入問題..."}
              style={{ fontSize: "16px" }}
              className={`w-full bg-transparent px-3 py-2.5 focus:outline-none transition-all placeholder:text-opacity-50 resize-none max-h-[80px] leading-snug
                ${
                  isDarkMode
                    ? "text-white placeholder:text-neutral-400"
                    : "text-stone-700 placeholder:text-stone-400"
                }`}
            />
          </div>

          {/* 發送按鈕：配色對標記帳頁面 */}
          <button
            onClick={onSendMessage}
            disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
            className={`p-2.5 rounded-2xl transition-all flex-shrink-0 active:scale-95 disabled:opacity-50 disabled:grayscale
              ${
                isLoading || (!inputMessage.trim() && !selectedImage)
                  ? isDarkMode
                    ? "bg-neutral-800 border border-neutral-700 text-neutral-500"
                    : "bg-stone-300 text-stone-400"
                  : isDarkMode
                    ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500 shadow-lg"
                    : "bg-stone-500 text-white hover:bg-stone-600"
              }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatInput);
