import React, { Suspense } from "react";
import useSwipeGesture from "../../hooks/useSwipeGesture.js";
import {
  Languages,
  Sparkles,
  Volume2,
  Search,
  Trash2,
  X,
  User,
  Bot,
  StopCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ChatInput from "../ChatInput.jsx";
// ChatMessageList 採用 lazy import 以保持原始 App.jsx 的載入邏輯
const ChatMessageList = React.lazy(() => import("../ChatMessageList.jsx"));

const AIPanel = ({
  isDarkMode,
  theme,
  currentTheme,
  componentStyles,
  aiMode,
  handleSwitchMode,
  isSpeaking,
  setIsSpeaking,
  showAiSearch,
  setShowAiSearch,
  aiSearchQuery,
  setAiSearchQuery,
  getSearchResults,
  scrollToMessage,
  handleClearChat,
  messages,
  renderMessage,
  handleSpeak,
  isLoading,
  loadingText,
  chatEndRef,
  setFullPreviewImage,
  expandedMessages,
  toggleMessageExpand,
  messageRefs,
  tripConfig,
  inputMessage,
  setInputMessage,
  listeningLang,
  toggleListening,
  fileInputRef,
  handleImageSelect,
  selectedImage,
  clearImage,
  handleSendMessage,
}) => {
  // 滑動手勢切換模式
  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
    swipeDistance,
  } = useSwipeGesture({
    onSwipeLeft: () => handleSwitchMode("translate"), // 往左滑（頁面往右）→ 口譯
    onSwipeRight: () => handleSwitchMode("guide"), // 往右滑（頁面往左）→ 導遊
    threshold: 50,
  });

  return (
    <div
      className="flex-1 px-4 pb-32 space-y-5 flex flex-col h-[calc(100vh-130px)] animate-fadeIn relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 滑動箭頭指示器 - 往左滑時顯示右側箭頭 */}
      <div
        className={`fixed right-2 top-1/2 z-50 pointer-events-none transition-all duration-200 ${
          swipeDirection === "left"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75"
        }`}
        style={{
          transform: `translateY(-50%) translateX(${swipeDirection === "left" ? -swipeDistance * 0.3 : 0}px)`,
        }}
      >
        <div
          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "bg-sky-500/90 ring-1 ring-sky-400/30"
              : "bg-sky-500/90 ring-1 ring-sky-400/50"
          }`}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* 滑動箭頭指示器 - 往右滑時顯示左側箭頭 */}
      <div
        className={`fixed left-2 top-1/2 z-50 pointer-events-none transition-all duration-200 ${
          swipeDirection === "right"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75"
        }`}
        style={{
          transform: `translateY(-50%) translateX(${swipeDirection === "right" ? swipeDistance * 0.3 : 0}px)`,
        }}
      >
        <div
          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "bg-sky-500/90 ring-1 ring-sky-400/30"
              : "bg-sky-500/90 ring-1 ring-sky-400/50"
          }`}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </div>
      </div>
      <div
        className={`backdrop-blur-2xl border rounded-[2rem] flex-1 flex flex-col overflow-hidden max-w-full transition-all duration-300 ${isDarkMode ? "bg-slate-900/60 border-white/10 ring-1 ring-white/10 shadow-lg shadow-black/5" : "bg-white/70 border-white/40 ring-1 ring-black/5 shadow-lg shadow-black/5"} ${componentStyles.itineraryCard}`}
      >
        {/* 對話視窗標題與模式切換 */}
        <div
          className={`p-4 border-b backdrop-blur-lg transition-all duration-300 ${isDarkMode ? "bg-neutral-800/60 border-white/10" : "bg-white/60 border-stone-200/50"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 模式頭像：隨導遊/口譯模式切換顏色與圖示 */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-white/50 transition-all duration-500
                  ${
                    aiMode === "translate"
                      ? "bg-gradient-to-br from-sky-400 to-blue-500"
                      : "bg-gradient-to-br from-amber-200 to-orange-300"
                  }
                `}
              >
                {aiMode === "translate" ? (
                  <Languages className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>

              <div className="flex flex-col">
                <div
                  className={`text-base font-bold transition-colors duration-300 ${theme.text}`}
                >
                  {aiMode === "translate" ? "AI 隨身口譯" : "AI 專屬導遊"}
                </div>
                {isSpeaking && (
                  <p
                    className={`text-[10px] flex items-center gap-1 mt-0.5 ${theme.textSec}`}
                  >
                    <Volume2 className="w-2.5 h-2.5" /> 朗讀中...
                  </p>
                )}
              </div>
            </div>

            {/* 按鈕組 - 重新排列 */}
            <div className="flex flex-col items-end gap-1.5">
              {/* 模式切換開關 */}
              <div
                className={`flex p-1 rounded-xl border gap-1 backdrop-blur-md transition-all duration-300 ${
                  isDarkMode
                    ? "bg-neutral-900/60 border-white/10 ring-1 ring-white/5"
                    : "bg-white/70 border-white/40 ring-1 ring-black/5"
                }`}
              >
                <button
                  onClick={() => handleSwitchMode("guide")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                    aiMode === "guide"
                      ? isDarkMode
                        ? "bg-amber-600/90 backdrop-blur-md text-white ring-1 ring-amber-500/30 shadow-lg shadow-amber-900/20 hover:bg-amber-700/95 hover:scale-105 active:scale-95"
                        : "bg-amber-500/90 backdrop-blur-md text-white ring-1 ring-amber-400/30 shadow-md shadow-amber-500/20 hover:bg-amber-600/95 hover:scale-105 active:scale-95"
                      : isDarkMode
                        ? "text-neutral-400 bg-transparent hover:text-neutral-200 hover:bg-neutral-700/40 hover:scale-105 active:scale-95"
                        : "text-stone-600 bg-transparent hover:text-stone-700 hover:bg-white/50 hover:scale-105 active:scale-95"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-0.5" />
                  導遊
                </button>
                <button
                  onClick={() => handleSwitchMode("translate")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                    aiMode === "translate"
                      ? isDarkMode
                        ? "bg-sky-600/90 backdrop-blur-md text-white ring-1 ring-sky-500/30 shadow-lg shadow-sky-900/20 hover:bg-sky-700/95 hover:scale-105 active:scale-95"
                        : "bg-sky-500/90 backdrop-blur-md text-white ring-1 ring-sky-400/30 shadow-md shadow-sky-500/20 hover:bg-sky-600/95 hover:scale-105 active:scale-95"
                      : isDarkMode
                        ? "text-neutral-400 bg-transparent hover:text-neutral-200 hover:bg-neutral-700/40 hover:scale-105 active:scale-95"
                        : "text-stone-600 bg-transparent hover:text-stone-700 hover:bg-white/50 hover:scale-105 active:scale-95"
                  }`}
                >
                  <Languages className="w-3.5 h-3.5 inline mr-0.5" />
                  口譯
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiSearch(!showAiSearch)}
                  className={`p-1.5 rounded-lg border backdrop-blur-md transition-all duration-300 active:scale-95 hover:scale-105 ${
                    showAiSearch
                      ? isDarkMode
                        ? "bg-sky-600/90 border-sky-500/60 text-white ring-1 ring-sky-400/30 shadow-md"
                        : "bg-sky-500/90 border-sky-400/60 text-white ring-1 ring-sky-300/30 shadow-md"
                      : isDarkMode
                        ? "bg-neutral-800/60 border-white/10 text-neutral-400 hover:text-sky-400 hover:bg-neutral-700/80 hover:border-sky-500/50 ring-1 ring-white/5"
                        : "bg-white/70 border-white/40 text-stone-500 hover:text-sky-600 hover:bg-white/90 hover:border-sky-400/50 ring-1 ring-black/5"
                  }`}
                  title="搜尋對話"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleClearChat}
                  className={`p-1.5 rounded-lg border backdrop-blur-md transition-all duration-300 active:scale-95 hover:scale-105 ${
                    isDarkMode
                      ? "bg-neutral-800/60 border-white/10 text-neutral-400 hover:text-red-400 hover:bg-neutral-700/80 hover:border-red-500/50 ring-1 ring-white/5"
                      : "bg-white/70 border-white/40 text-stone-500 hover:text-red-600 hover:bg-white/90 hover:border-red-400/50 ring-1 ring-black/5"
                  }`}
                  title="清除聊天紀錄"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 搜尋框 */}
          {showAiSearch && (
            <div className="mt-3 space-y-2">
              <div
                className={`flex items-center gap-2 p-2 rounded-xl border backdrop-blur-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-neutral-900/60 border-white/10 ring-1 ring-white/5 shadow-md"
                    : "bg-white/80 border-white/40 ring-1 ring-black/5 shadow-md"
                }`}
              >
                <Search
                  className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? "text-neutral-400" : "text-stone-500"}`}
                />
                <input
                  type="text"
                  id="aiSearchQuery"
                  name="aiSearchQuery"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder="搜尋對話內容..."
                  className={`flex-1 bg-transparent border-0 outline-none text-sm ${
                    isDarkMode
                      ? "text-neutral-200 placeholder:text-neutral-500"
                      : "text-stone-700 placeholder:text-stone-400"
                  }`}
                />
                {aiSearchQuery && (
                  <button
                    onClick={() => setAiSearchQuery("")}
                    className={`p-1 rounded-lg hover:bg-black/10 transition-all backdrop-blur-md ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10"}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {aiSearchQuery && (
                <div
                  className={`max-h-40 overflow-y-auto rounded-xl border backdrop-blur-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-neutral-900/70 border-white/10 ring-1 ring-white/5 shadow-md"
                      : "bg-white/85 border-white/40 ring-1 ring-black/5 shadow-md"
                  }`}
                >
                  {getSearchResults().length > 0 ? (
                    <div className="p-2 space-y-1">
                      {getSearchResults().map((result) => (
                        <button
                          key={result.index}
                          onClick={() => {
                            scrollToMessage(result.index);
                            setShowAiSearch(false);
                            setAiSearchQuery("");
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-all hover:scale-[1.02] ${
                            isDarkMode
                              ? "hover:bg-neutral-800 text-neutral-300"
                              : "hover:bg-stone-100 text-stone-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {result.role === "user" ? (
                              <User className="w-3 h-3 text-sky-500" />
                            ) : (
                              <Bot className="w-3 h-3 text-amber-500" />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                isDarkMode
                                  ? "text-neutral-400"
                                  : "text-stone-500"
                              }`}
                            >
                              {result.role === "user" ? "你" : "AI"}
                            </span>
                          </div>
                          <p className="text-xs line-clamp-2">
                            {result.text?.substring(0, 100)}
                            {result.text?.length > 100 ? "..." : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`p-4 text-center text-xs ${
                        isDarkMode ? "text-neutral-500" : "text-stone-400"
                      }`}
                    >
                      沒有找到符合的對話
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 停止朗讀控制項 */}
          {isSpeaking && (
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }}
              className="w-full py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100 flex items-center justify-center gap-2 text-xs font-bold"
            >
              <StopCircle className="w-4 h-4" /> 停止朗讀
            </button>
          )}
        </div>

        {/* 聊天訊息列表 */}
        <Suspense
          fallback={
            <div
              className={`px-4 py-6 text-center text-xs font-semibold border rounded-2xl ${isDarkMode ? "bg-neutral-900/40 border-neutral-800 text-neutral-300" : "bg-white/80 border-stone-200 text-stone-500"}`}
            >
              聊天記錄載入中…
            </div>
          }
        >
          <ChatMessageList
            messages={messages}
            isDarkMode={isDarkMode}
            theme={theme}
            currentTheme={currentTheme}
            renderMessage={renderMessage}
            handleSpeak={handleSpeak}
            isLoading={isLoading}
            loadingText={loadingText}
            chatEndRef={chatEndRef}
            setFullPreviewImage={setFullPreviewImage}
            expandedMessages={expandedMessages}
            toggleMessageExpand={toggleMessageExpand}
            messageRefs={messageRefs}
          />
        </Suspense>

        {/* 快速建議問題：根據當前模式動態切換 */}
        <div
          className={`px-4 py-3 border-t flex gap-2.5 overflow-x-auto scrollbar-hide backdrop-blur-xl transition-colors duration-300 ${isDarkMode ? "bg-black/15 border-white/20 ring-1 ring-white/5" : "bg-[#F9F9F6]/70 border-stone-200/60 ring-1 ring-black/5"}`}
        >
          {(aiMode === "translate"
            ? tripConfig.translationQuestions || [
                "翻譯「謝謝」",
                "翻譯「廁所在哪」",
                "翻譯「多少錢」",
                "翻譯「請給我水」",
              ]
            : tripConfig.aiQuestions
          ).map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setInputMessage(q);
              }}
              className={`flex-shrink-0 text-xs px-3 py-2 rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${isDarkMode ? "bg-neutral-700/60 hover:bg-neutral-600/80 text-neutral-300 hover:text-sky-200 border-white/10 ring-1 ring-white/5 shadow-md" : "bg-white/80 hover:bg-white/95 text-stone-600 hover:text-[#556B2F] border-white/40 ring-1 ring-black/5 shadow-sm hover:shadow-md"}`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* 訊息輸入區 */}
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          listeningLang={listeningLang}
          toggleListening={
            aiMode === "translate"
              ? toggleListening
              : () => toggleListening("zh-TW")
          }
          fileInputRef={fileInputRef}
          handleImageSelect={handleImageSelect}
          selectedImage={selectedImage}
          clearImage={clearImage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          theme={theme}
          tripConfig={aiMode === "translate" ? tripConfig : {}}
        />
      </div>
    </div>
  );
};

export default AIPanel;
