import React, { useState } from "react";
import { Camera, X, Mic, MicOff, Send, MapPin, Plus } from "lucide-react";

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
  const theme = tripConfig?.theme || {};
  const cBase = theme.colorBase || "stone";

  // 🆕 使用主題系統配置
  const typography = theme.typography || {};
  const shadows = theme.shadows || {};
  const transitions = theme.transitions || {};
  const interactions = theme.interactions || {};
  const voiceBtn = theme.voiceButton || {};

  // 根據主題配置定義語義化顏色
  const sc = theme.semanticColors || {
    blue: { light: "text-[#5D737E]", dark: "text-sky-400" },
  };
  const blueText = isDarkMode
    ? sc.blue?.dark || "text-sky-400"
    : sc.blue?.light || "text-[#5D737E]";

  return (
    <div
      className={`p-4 transition-colors duration-300 flex-shrink-0 z-10 
        ${isDarkMode ? 'bg-black/20' : 'bg-[#F9F9F6]/50'}`}
    >
      {/* 圖片附件預覽：顯示已選擇但尚未發送的圖片 */}
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

      {/* 隱藏的檔案選擇器：由自定義按鈕觸發 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* 輸入控制區域 */}
      <div className="flex items-center gap-1.5">
        {/* 相機按鈕 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-2xl border transition-all flex-shrink-0 active:scale-95 ${
            isDarkMode
              ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
              : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-700'
          }`}
          title="上傳圖片"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* 功能選單按鈕：展開/收納語音功能 */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className={`p-2.5 rounded-2xl ${transitions.normal || "transition-all"} border flex-shrink-0 ${interactions.active || "active:scale-95"} z-20
              ${
                showActions
                  ? isDarkMode
                    ? 'bg-neutral-700 border-neutral-600 text-white rotate-45'
                    : 'bg-stone-200 border-stone-300 text-stone-600 rotate-45'
                  : isDarkMode
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-700'
              }`}
            title="展開/收納語音功能"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* 展開後的功能按鈕列表 */}
          {showActions && (
            <div className="flex gap-1 animate-fadeInLeft absolute left-12 bottom-0 bg-inherit p-1 rounded-xl border shadow-lg z-10 backdrop-blur-md">
              {/* 中文語音輸入 */}
              <button
                onClick={() => {
                  toggleListening("zh-TW");
                  setShowActions(false);
                }}
                className={`p-2.5 rounded-xl ${transitions.normal || "transition-all"} ${shadows.subtle || "shadow-sm"} border flex-shrink-0 ${interactions.active || "active:scale-95"}
                  ${
                    listeningLang === "zh-TW"
                      ? `${voiceBtn.chinese?.active?.[isDarkMode ? "dark" : "light"] || "bg-[#5D737E] text-white border-[#4A606A]"} animate-pulse ${shadows.card || "shadow-md"}`
                      : voiceBtn.chinese?.inactive?.[
                          isDarkMode ? "dark" : "light"
                        ] ||
                        (isDarkMode
                          ? `bg-${cBase}-800 ${blueText} hover:bg-${cBase}-700 border-${cBase}-600`
                          : `bg-white ${blueText} hover:bg-${cBase}-50 border-${cBase}-200`)
                  }`}
                title="中文語音輸入"
              >
                {listeningLang === "zh-TW" ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <Mic className="w-4 h-4" />
                    <span
                      className={`font-bold ${typography.label?.size || "text-xs"}`}
                    >
                      中
                    </span>
                  </div>
                )}
              </button>

              {/* 外語語音輸入 (如：日文) */}
              {tripConfig?.language?.code && (
                <button
                  onClick={() => {
                    toggleListening(tripConfig.language.code);
                    setShowActions(false);
                  }}
                  className={`p-2.5 rounded-xl ${transitions.normal || "transition-all"} ${shadows.subtle || "shadow-sm"} border flex-shrink-0 ${interactions.active || "active:scale-95"}
                    ${
                      listeningLang === tripConfig.language.code
                        ? `${voiceBtn.foreign?.active?.[isDarkMode ? "dark" : "light"] || "bg-rose-400 text-white border-rose-500"} animate-pulse ${shadows.card || "shadow-md"}`
                        : voiceBtn.foreign?.inactive?.[
                            isDarkMode ? "dark" : "light"
                          ] ||
                          (isDarkMode
                            ? "bg-neutral-800 text-rose-300 hover:bg-neutral-700 border-neutral-600"
                            : "bg-white text-[#BC8F8F] hover:bg-stone-50 border-stone-200")
                    }`}
                  title={`${tripConfig.language.name}語音輸入`}
                >
                  {listeningLang === tripConfig.language.code ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <Mic className="w-4 h-4" />
                      <span
                        className={`font-bold ${typography.label?.size || "text-xs"}`}
                      >
                        {tripConfig.language.label}
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 文字輸入框：支援自動增高與 Enter 發送 */}
        <div className={`flex-1 min-w-0 rounded-2xl overflow-hidden ${
          isDarkMode ? 'bg-neutral-800' : 'bg-stone-100'
        }`}>
          <textarea
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 40)}px`;
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
            className={`flex-1 w-full min-w-0 border-0 bg-transparent px-3 py-2.5 text-base focus:outline-none focus:ring-0 transition-all placeholder:text-opacity-60 resize-none max-h-[40px] leading-snug
              ${
                isDarkMode
                  ? "text-neutral-200 placeholder:text-neutral-500"
                  : "text-stone-700 placeholder:text-stone-400"
              }`}
          />
        </div>

        {/* 發送按鈕：根據輸入狀態動態啟用 */}
        <button
          onClick={() => {
            handleSendMessage();
            const textarea = document.querySelector("textarea");
            if (textarea) textarea.style.height = "auto";
          }}
          disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
          className={`p-2.5 rounded-2xl transition-all flex-shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isLoading || (!inputMessage.trim() && !selectedImage)
                ? isDarkMode
                  ? "bg-neutral-700 text-neutral-500"
                  : "bg-stone-300 text-stone-400"
                : isDarkMode
                  ? "bg-neutral-700 text-white hover:bg-neutral-600"
                  : "bg-stone-500 text-white hover:bg-stone-600"
            }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(ChatInput);
