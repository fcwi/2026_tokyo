import React from "react";
import { Camera, X, MicOff, Send, MapPin } from "lucide-react";

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
  return (
    <div
      className={`p-2 border-t backdrop-blur-md transition-colors duration-300 flex-shrink-0 z-10 
        ${isDarkMode ? "bg-neutral-800/90 border-neutral-700" : "bg-white/90 border-stone-200/80"}`}
    >
      {/* 圖片預覽區域 */}
      {selectedImage && (
        <div className="mb-2 px-1 relative w-fit group animate-slideUp">
          <img
            src={selectedImage}
            alt="Upload Preview"
            className="h-16 w-auto rounded-xl border shadow-md object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all active:scale-90"
            title="移除圖片"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 隱藏的檔案上傳元件 */}
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />

      {/* 主要輸入區 */}
      <div className="flex items-end gap-2">
        {/* 語音 + 圖片 */}
        <div className="flex gap-1 pb-0.5">
          {/* 中文語音 */}
          <button
            onClick={() => toggleListening("zh-TW")}
            className={`p-2.5 rounded-xl transition-all shadow-sm border flex-shrink-0 active:scale-95
              ${
                listeningLang === "zh-TW"
                  ? "bg-[#5D737E] text-white animate-pulse shadow-md border-[#4A606A]"
                  : isDarkMode
                    ? "bg-neutral-800 text-sky-400 hover:bg-neutral-700 border-neutral-600"
                    : "bg-white text-[#5D737E] hover:bg-stone-50 border-stone-200"
              }`}
            title="中文語音輸入"
          >
            {listeningLang === "zh-TW" ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">中</div>
            )}
          </button>

          {/* 外語語音（僅口譯模式顯示，交由父層控制）*/}
          {tripConfig?.language?.code && (
            <button
              onClick={() => toggleListening(tripConfig.language.code)}
              className={`p-2.5 rounded-xl transition-all shadow-sm border flex-shrink-0 active:scale-95
                ${
                  listeningLang === tripConfig.language.code
                    ? "bg-rose-400 text-white animate-pulse shadow-md border-rose-500"
                    : isDarkMode
                      ? "bg-neutral-800 text-rose-300 hover:bg-neutral-700 border-neutral-600"
                      : "bg-white text-[#BC8F8F] hover:bg-stone-50 border-stone-200"
                }`}
              title={`${tripConfig.language.name}語音輸入`}
            >
              {listeningLang === tripConfig.language.code ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">{tripConfig.language.label}</div>
              )}
            </button>
          )}

          {/* 圖片上傳 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-xl transition-all shadow-sm border flex-shrink-0 active:scale-95
              ${isDarkMode ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-600" : "bg-white text-stone-500 hover:bg-stone-50 border-stone-200"}`}
            title="上傳圖片"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* 文字輸入框 */}
        <textarea
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
              e.target.style.height = "auto";
            }
          }}
          rows={1}
          placeholder={
            listeningLang
              ? "正在聽取..."
              : tripConfig?.language?.name
                ? `輸入中文或${tripConfig.language.name}...`
                : "輸入問題或上傳照片..."
          }
          className={`flex-1 min-w-0 border rounded-2xl px-3 py-3 text-xs focus:outline-none focus:ring-2 transition-all shadow-inner placeholder:text-opacity-50 resize-none max-h-[120px] leading-relaxed tracking-wide
            ${
              isDarkMode
                ? "bg-neutral-900/50 border-neutral-600 text-neutral-200 focus:border-sky-500 focus:ring-sky-500/20 placeholder:text-neutral-500"
                : "bg-white border-stone-200 text-stone-700 focus:border-[#5D737E] focus:ring-[#5D737E]/20 placeholder:text-stone-400"
            }`}
        />

        {/* 發送按鈕 */}
        <button
          onClick={() => {
            handleSendMessage();
            const textarea = document.querySelector("textarea");
            if (textarea) textarea.style.height = "auto";
          }}
          disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
          className={`p-3 rounded-xl transition-all shadow-md flex-shrink-0 mb-0.5 font-bold active:scale-95
            ${
              isLoading || (!inputMessage.trim() && !selectedImage)
                ? isDarkMode
                  ? "bg-neutral-700 text-neutral-500 shadow-none cursor-not-allowed"
                  : "bg-stone-200 text-stone-400 shadow-none cursor-not-allowed"
                : isDarkMode
                  ? "bg-gradient-to-r from-sky-600 to-blue-700 text-white hover:shadow-lg"
                  : "bg-gradient-to-r from-[#5D737E] to-[#3F5561] text-white hover:shadow-lg"
            }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(ChatInput);
