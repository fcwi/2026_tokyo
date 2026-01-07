import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Mic,
  Send,
  Globe,
  Bot,
  User,
  Image as ImageIcon,
  X,
  Volume2,
  StopCircle,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";
import { callGeminiSafe } from "../../utils/gemini.js";
import { useSpeech } from "../../hooks/useSpeech.js";
import {
  getMessageRegex,
  renderFormattedMessage,
} from "../../utils/formatters.jsx";

const AiTab = ({
  tripConfig,
  itineraryData,
  shopGuideData,
  guidesData,
  theme,
  isDarkMode,
  apiKey,
  userWeather,
}) => {
  const [aiMode, setAiMode] = useState("translate");
  const [inputMessage, setInputMessage] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Image handling
  const [selectedImage, setSelectedImage] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const fileInputRef = useRef(null);

  const chatEndRef = useRef(null);
  const geminiAbortControllerRef = useRef(null);

  // Use speech hook
  const {
    isSpeaking,
    handleSpeak,
    cancelSpeak,
    listeningLang,
    toggleListening,
  } = useSpeech({
    tripConfig,
    onTranscript: setInputMessage,
  });

  const getWelcomeMessage = (mode) => {
    const langName = tripConfig.language.name;
    const langLabel = tripConfig.language.label;

    if (mode === "translate") {
      return {
        role: "model",
        text: `您好！我是您的隨身 AI 口譯員 🌍\n\n💡 口譯模式功能：\n🎤 點「中」說話：我會將中文翻成${langName} (附拼音)。\n🎤 點「${langLabel}」說話：錄下對方說的${langName}，我會直接翻成中文！`,
      };
    } else {
      return {
        role: "model",
        text: `您好！我是您的專屬 AI 導遊 ✨\n我已經熟讀了您的行程。\n\n💡 導遊模式功能：\n🎤 點「中」說話：您可以詢問行程細節、交通方式或周邊推薦。\n(此模式專注於行程導覽，請切換模式以使用翻譯功能)`,
      };
    }
  };

  const getStorageKey = (mode) => `trip_chat_history_${mode}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey("translate"));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("讀取聊天紀錄失敗", e);
    }
    return [getWelcomeMessage("translate")];
  });

  // Save history
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const historyToSave = messages.map((msg) => ({
        ...msg,
        image: null, // Don't save images to localStorage
      }));
      localStorage.setItem(
        getStorageKey(aiMode),
        JSON.stringify(historyToSave),
      );
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [messages, aiMode]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Mode Switch
  const handleSwitchMode = (newMode) => {
    if (aiMode === newMode) return;
    setAiMode(newMode);
    cancelSpeak(); // Stop speaking when switching

    // Verify localStorage key usage logic: switch to new mode's history
    const saved = localStorage.getItem(getStorageKey(newMode));
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([getWelcomeMessage(newMode)]);
    }
  };

  const handleClearChat = () => {
    if (
      window.confirm(
        `確定要清除「${aiMode === "translate" ? "口譯" : "導遊"}」的所有紀錄嗎？`,
      )
    ) {
      const resetMsg = getWelcomeMessage(aiMode);
      setMessages([resetMsg]);
      localStorage.removeItem(getStorageKey(aiMode));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmImage = () => {
    setSelectedImage(tempImage);
    setTempImage(null);
  };

  const handleCancelImage = () => {
    setTempImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Generate Context (Copied logic)
  const flattenItinerary = (data) =>
    data
      .map((day) => {
        const events = day.events
          .map((e) => `  - ${e.time} ${e.title}: ${e.desc}`)
          .join("\n");
        return `📅 ${day.day} (${day.locationKey}):\n${events}`;
      })
      .join("\n\n");
  const flattenGuides = (data) =>
    data.map((g) => `📘 ${g.title}: ${g.summary}`).join("\n");
  const flattenShops = (data) =>
    data
      .map((area) => {
        const shops = area.mainShops
          .map((s) => `  * ${s.name}: ${s.note}`)
          .join("\n");
        return `🛍️ ${area.area}:\n${shops}`;
      })
      .join("\n\n");

  const itineraryFlat = useMemo(
    () => flattenItinerary(itineraryData),
    [itineraryData],
  );
  const guidesFlat = useMemo(() => flattenGuides(guidesData), [guidesData]);
  const shopsFlat = useMemo(() => flattenShops(shopGuideData), [shopGuideData]);

  const { keywordsSet, combinedRegex } = useMemo(() => {
    return getMessageRegex(itineraryData, shopGuideData);
  }, [itineraryData, shopGuideData]);

  const renderMessage = (text) =>
    renderFormattedMessage(text, combinedRegex, keywordsSet);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const tz = tripConfig.timeZone || "Asia/Taipei";
    const now = new Date(); // Use real time for now
    const localTimeStr = now.toLocaleString("zh-TW", {
      timeZone: tz,
      hour12: false,
    });

    // User message
    const userMsg = {
      role: "user",
      text: inputMessage,
      image: selectedImage,
    };

    // Loading Text
    let nextLoadingText = "";
    if (aiMode === "translate") {
      nextLoadingText = "正在進行雙向翻譯...";
    } else {
      const guideLoadingTexts = [
        "正在翻閱您的行程表...",
        "正在查詢當地的購物資訊...",
        "正在比對地圖位置...",
        "正在組織建議內容...",
        "正在思考最佳建議...",
      ];
      nextLoadingText =
        guideLoadingTexts[Math.floor(Math.random() * guideLoadingTexts.length)];
    }
    setLoadingText(nextLoadingText);

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setSelectedImage(null); // Clear used image
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    try {
      // 構建 Prompt
      let systemPrompt = "";
      if (aiMode === "translate") {
        systemPrompt = `
          你現在是專業的中日口譯員。你的目標是幫助使用中文的旅客與當地的日本人溝通。
          
          規則：
          1. 如果使用者輸入中文：請將其翻譯成自然的日文，並在下方提供羅馬拼音 (Romaji) 以便閱讀。
             格式範例：
             你好
             ----------------
             こんにちは
             (Konnichiwa)
          
          2. 如果使用者輸入日文 (或錄到的日文語音)：請將其翻譯成繁體中文。
          
          3. 如果使用者上傳了圖片（例如菜單或招牌）：請識別圖片中的文字並翻譯成中文，並簡單說明圖片內容。
          
          請保持語氣禮貌、親切且專業。
        `;
      } else {
        const weatherInfo = userWeather
          ? `目前天氣狀況：${userWeather.desc}，氣溫 ${userWeather.temp}°C，地點：${userWeather.locationName}。`
          : "無法取得目前天氣資訊。";

        systemPrompt = `
          你現在是「${tripConfig.title}」的專屬 AI 導遊。請根據以下資訊回答使用者的問題。
          
          【基本資訊】
          - 當地時間：${localTimeStr}
          - ${weatherInfo}
          
          【行程摘要】
          ${itineraryFlat}
          
          【重要參考指南】
          ${guidesFlat}
          
          【商家與周邊資訊】
          ${shopsFlat}
          
          【AI 導遊守則】
          1. 請優先參考上述行程與資訊來回答。如果問題超出範圍，請根據一般旅遊常識回答，但要註明「行程表中未提到」。
          2. 回答請簡潔明瞭，語氣活潑親切，適合旅遊場景。
          3. 如果使用者詢問推薦，請優先推薦【商家與周邊資訊】列出的店家。
          4. 支援圖片辨識：如果使用者上傳圖片，請協助辨識並結合行程資訊給予建議。
          5. 請使用繁體中文回答。
        `;
      }

      // 構建 History
      // 只取最近幾則對話以免 Context 過長 (例如最近 10 則)
      const recentHistory = messages
        .slice(-10)
        .filter((m) => m.role !== "error")
        .map((m) => {
          const parts = [{ text: m.text }];
          // Send image if exists (simplified, sending base64)
          // Gemini API expects inlineData for images
          if (m.image) {
            const base64Data = m.image.split(",")[1];
            const mimeType = m.image.split(";")[0].split(":")[1];
            parts.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            });
          }
          return {
            role: m.role === "model" ? "model" : "user",
            parts: parts,
          };
        });

      // User Input parts
      const currentParts = [{ text: userMsg.text }];
      if (userMsg.image) {
        const base64Data = userMsg.image.split(",")[1];
        const mimeType = userMsg.image.split(";")[0].split(":")[1];
        currentParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        });
      }

      const payload = {
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] }, // System Prompt trick for Gemini Flash
          ...recentHistory,
          { role: "user", parts: currentParts },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      };

      const result = await callGeminiSafe(
        apiKey,
        payload,
        geminiAbortControllerRef,
      );
      const replyText = result.candidates[0].content.parts[0].text;

      const modelMsg = {
        role: "model",
        text: replyText,
      };

      setMessages((prev) => [...prev, modelMsg]);

      // Auto-speak in translate mode if result is short enough
      if (aiMode === "translate" && replyText.length < 100) {
        handleSpeak(replyText);
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg = {
        role: "error",
        text: `抱歉，我現在有點累 (或網路不穩)，請稍後再試。\n錯誤代碼: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 px-4 pb-32 space-y-5 flex flex-col h-[calc(100vh-130px)] animate-fadeIn">
      <div
        className={`rounded-[2rem] shadow-xl flex-1 flex flex-col overflow-hidden max-w-full transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
      >
        {/* 對話視窗標題與模式切換 */}
        <div
          className={`p-4 border-b backdrop-blur-sm flex flex-col gap-3 ${isDarkMode ? "bg-neutral-800/60 border-neutral-700" : "bg-white/60 border-stone-200/50"}
          ${
            aiMode === "translate"
              ? isDarkMode
                ? "border-b-sky-900/50"
                : "border-b-sky-100"
              : isDarkMode
                ? "border-b-amber-900/50"
                : "border-b-amber-100"
          }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 模式頭像 */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-500
                  ${
                    aiMode === "translate"
                      ? "bg-gradient-to-br from-sky-400 to-blue-500"
                      : "bg-gradient-to-br from-amber-400 to-orange-500"
                  }`}
              >
                {aiMode === "translate" ? (
                  <Globe className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className={`text-base font-bold ${theme.text}`}>
                  {aiMode === "translate" ? "隨身口譯" : "AI 導遊"}
                </h2>
                <div className="flex gap-2 text-[10px] items-center opacity-60">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-emerald-400 animate-pulse" : "bg-stone-400"}`}
                  ></span>
                  {isLoading ? "思考中..." : "線上"}
                </div>
              </div>
            </div>

            {/* 模式切換按鈕 */}
            <div className="flex bg-stone-100/50 p-1 rounded-xl border border-stone-200/50 backdrop-blur-sm dark:bg-neutral-800/50 dark:border-neutral-700">
              <button
                onClick={() => handleSwitchMode("translate")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  aiMode === "translate"
                    ? "bg-white text-sky-600 shadow-sm dark:bg-neutral-700 dark:text-sky-300"
                    : "text-stone-400 hover:text-stone-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                }`}
              >
                口譯
              </button>
              <button
                onClick={() => handleSwitchMode("guide")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  aiMode === "guide"
                    ? "bg-white text-amber-600 shadow-sm dark:bg-neutral-700 dark:text-amber-300"
                    : "text-stone-400 hover:text-stone-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                }`}
              >
                導遊
              </button>
            </div>

            <button
              onClick={handleClearChat}
              className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-1 ${theme.textSec}`}
              title="清除對話紀錄"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 聊天訊息列表區域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isError = msg.role === "error";
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-slideUp`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm
                  ${
                    isUser
                      ? isDarkMode
                        ? "bg-neutral-700 text-neutral-300"
                        : "bg-white text-stone-600"
                      : isError
                        ? "bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-300"
                        : aiMode === "translate"
                          ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
                  }
                  `}
                >
                  {isUser ? (
                    <User className="w-5 h-5" />
                  ) : isError ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                <div
                  className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap
                    ${
                      isUser
                        ? isDarkMode
                          ? "bg-neutral-700 text-white rounded-tr-none"
                          : "bg-[#3B5998] text-white rounded-tr-none"
                        : isError
                          ? "bg-rose-50 text-rose-600 border border-rose-100 rounded-tl-none dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800/30"
                          : isDarkMode
                            ? "bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-none"
                            : "bg-white text-[#37474F] border border-stone-100 rounded-tl-none"
                    }
                    `}
                  >
                    {msg.image && (
                      <div className="mb-2">
                        <img
                          src={msg.image}
                          alt="User upload"
                          className="max-w-full h-auto rounded-lg border border-white/10"
                          style={{ maxHeight: "200px" }}
                        />
                      </div>
                    )}
                    {isUser || isError ? msg.text : renderMessage(msg.text)}
                  </div>

                  {/* Message Actions (Speak) */}
                  {!isUser && !isError && (
                    <div className="flex gap-2 px-1">
                      <button
                        onClick={() => handleSpeak(msg.text)}
                        className={`p-1 rounded-full transition-colors ${isSpeaking ? "text-sky-500 bg-sky-100 dark:bg-sky-900/30" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-800"}`}
                      >
                        {isSpeaking ? (
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 animate-pulse">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm
                ${
                  aiMode === "translate"
                    ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-sm shadow-sm rounded-tl-none flex items-center gap-2 ${isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-white text-stone-500 border border-stone-100"}`}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {loadingText || "思考中..."}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 底部輸入區域 */}
        <div
          className={`p-3 border-t backdrop-blur-sm ${isDarkMode ? "bg-neutral-800/80 border-neutral-700" : "bg-white/80 border-stone-200"}`}
        >
          {/* Image Preview */}
          {tempImage && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn">
              <div className="relative max-w-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={tempImage}
                  alt="Preview"
                  className="max-w-full max-h-[60vh] object-contain"
                />
                <button
                  onClick={handleCancelImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleCancelImage}
                  className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors backdrop-blur-md"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmImage}
                  className="px-6 py-2.5 rounded-xl bg-[#3B5998] text-white font-bold shadow-lg hover:brightness-110 transition-transform active:scale-95 flex items-center gap-2"
                >
                  確認發送 <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800/30 animate-scaleIn origin-bottom-left">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-sky-200 dark:border-sky-700">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-sky-700 dark:text-sky-300 truncate">
                  圖片已就緒
                </p>
                <p className="text-[10px] text-sky-500 dark:text-sky-400">
                  將隨訊息發送
                </p>
              </div>
              <button
                onClick={removeSelectedImage}
                className="p-1.5 rounded-full hover:bg-sky-100 dark:hover:bg-sky-800/50 text-sky-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* 圖片上傳按鈕 */}
            <label
              className={`w-10 h-10 rounded-full cursor-pointer transition-all active:scale-95 flex-shrink-0 border flex items-center justify-center shadow-sm ${isDarkMode ? "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200" : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700"}`}
              title="上傳圖片"
            >
              <ImageIcon className="w-4.5 h-4.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
            </label>

            {/* 輸入框 */}
            <div
              className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-offset-1 ${isDarkMode ? "bg-neutral-900 border-neutral-700 focus-within:ring-sky-500/30 focus-within:ring-offset-neutral-900" : "bg-white border-stone-200 focus-within:ring-sky-200"}`}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  handleSendMessage()
                }
                placeholder={
                  listeningLang
                    ? "聆聽中..."
                    : aiMode === "translate"
                      ? "輸入想翻譯的內容..."
                      : "問導遊行程問題..."
                }
                className={`flex-1 bg-transparent outline-none text-sm placeholder:text-stone-400 ${isDarkMode ? "text-white placeholder:text-neutral-500" : "text-stone-800"}`}
                disabled={!!listeningLang || isLoading}
              />

              {/* 語音輸入按鈕群 */}
              <div className="flex items-center gap-2 border-l pl-2.5 border-stone-200 dark:border-neutral-700">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleListening("zh-TW")}
                    className={`w-8 h-8 rounded-lg transition-all active:scale-90 flex items-center justify-center ${listeningLang === "zh-TW" ? "text-white bg-rose-500 shadow-md" : isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"}`}
                    title="中文語音輸入"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <span
                    className={`text-[10px] font-bold ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                  >
                    中
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleListening(tripConfig.language.code)}
                    className={`w-8 h-8 rounded-lg transition-all active:scale-90 flex items-center justify-center ${listeningLang === tripConfig.language.code ? "text-white bg-sky-500 shadow-md" : isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"}`}
                    title={`${tripConfig.language.label}語音輸入`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <Globe
                    className={`w-3 h-3 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                  />
                </div>
              </div>
            </div>

            {/* 發送按鈕 */}
            <button
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
              className={`p-3 rounded-xl shadow-lg transition-all active:scale-95 flex-shrink-0 flex items-center justify-center
                ${
                  (!inputMessage.trim() && !selectedImage) || isLoading
                    ? "bg-stone-300 text-stone-100 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500"
                    : "bg-[#3B5998] text-white hover:bg-[#2F477A] hover:shadow-xl dark:bg-sky-700 dark:hover:bg-sky-600"
                }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTab;
