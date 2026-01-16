import { useState, useEffect, useRef, useCallback } from "react";
import { getAiWelcomeTemplate } from "../utils/itineraryHelpers.js";
import { aiChatDB } from "../utils/indexedDBManager.js";

/**
 * useAiChat - AI 聊天與語音管理 Hook
 * 
 * 功能：
 * - AI 訊息管理（翻譯模式 / 導遊模式）
 * - Gemini API 呼叫（含重試機制）
 * - 語音輸入與朗讀
 * - 圖片上傳與壓縮
 * - 聊天記錄持久化（使用 IndexedDB）
 */
export const useAiChat = (apiKey, tripConfig, showToast, sleep, isTestMode, testDateTime, autoTimeZone, hasLocationPermission, userWeather, itineraryFlat, guidesFlat, shopsFlat, itineraryData) => {
  const [aiMode, setAiMode] = useState("translate");
  const [isDBReady, setIsDBReady] = useState(false);
  const isInitialLoadDoneRef = useRef(false); // 追蹤初始載入是否完成

  // 初始訊息設為空陣列，等待 IndexedDB 載入後再設定
  const [messages, setMessages] = useState([]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningLang, setListeningLang] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const fileInputRef = useRef(null);
  const geminiAbortControllerRef = useRef(null);
  const chatEndRef = useRef(null);
  const messageRefs = useRef([]);
  const prevMessageCount = useRef(0);

  // 初始化 IndexedDB 並載入聊天紀錄（包括圖片）
  // 邏輯：先檢查 IndexedDB 是否有快取，沒有才顯示預設歡迎訊息
  useEffect(() => {
    const initDB = async () => {
      try {
        await aiChatDB.init();

        // 1. 先從 IndexedDB 嘗試載入
        const savedMessages = await aiChatDB.loadMessages("translate");
        console.log("📦 IndexedDB 載入結果:", savedMessages?.length || 0, "則訊息");

        if (savedMessages && savedMessages.length > 0) {
          // IndexedDB 中有快取資料，載入訊息和圖片
          const messagesWithImages = await Promise.all(
            savedMessages.map(async (msg) => {
              if (msg.image && msg.image.id) {
                try {
                  const imageRecord = await aiChatDB.getImage(msg.image.id);
                  if (imageRecord) {
                    return {
                      ...msg,
                      image: {
                        id: imageRecord.id,
                        data: imageRecord.data,
                        filename: imageRecord.filename,
                      },
                    };
                  }
                } catch (error) {
                  console.warn(`無法加載圖片 ${msg.image.id}:`, error);
                }
              }
              return msg;
            })
          );

          console.log("✅ 從 IndexedDB 載入完成，共", messagesWithImages.length, "則訊息");
          setMessages(messagesWithImages);
        } else {
          // 2. IndexedDB 沒有資料，嘗試從 localStorage 遷移
          const oldData = localStorage.getItem("trip_chat_history_translate");
          if (oldData) {
            try {
              const oldMessages = JSON.parse(oldData);
              if (Array.isArray(oldMessages) && oldMessages.length > 0) {
                // 遷移至 IndexedDB
                const messagesToSave = oldMessages.map((msg) => ({
                  ...msg,
                  image: null,
                }));
                await aiChatDB.saveMessages("translate", messagesToSave);
                localStorage.removeItem("trip_chat_history_translate");

                setMessages(oldMessages);
                console.log("✅ 已將聊天記錄從 localStorage 遷移至 IndexedDB");
              } else {
                // localStorage 也沒有有效資料，顯示預設歡迎訊息
                setMessages([getAiWelcomeTemplate("translate", tripConfig)]);
              }
            } catch (error) {
              console.error("遷移 localStorage 數據失敗:", error);
              setMessages([getAiWelcomeTemplate("translate", tripConfig)]);
            }
          } else {
            // 3. IndexedDB 和 localStorage 都沒有資料，顯示預設歡迎訊息
            console.log("📭 無快取資料，顯示預設歡迎訊息");
            setMessages([getAiWelcomeTemplate("translate", tripConfig)]);
          }
        }

        isInitialLoadDoneRef.current = true;
        setIsDBReady(true);
      } catch (error) {
        console.error("IndexedDB 初始化失敗:", error);
        // 發生錯誤時也要顯示歡迎訊息，讓使用者可以正常使用
        setMessages([getAiWelcomeTemplate("translate", tripConfig)]);
        isInitialLoadDoneRef.current = true;
        setIsDBReady(true);
      }
    };

    initDB();
  }, [tripConfig]);

  // 儲存聊天紀錄到 IndexedDB（包括圖片）
  useEffect(() => {
    // 初始載入完成前不要保存，避免覆蓋已存的資料
    if (!isDBReady || !isInitialLoadDoneRef.current || messages.length === 0) return;

    const debounceTimer = setTimeout(() => {
      const saveMessages = async () => {
        try {
          // 1. 先保存消息（不包含圖片的 data，只保留圖片 ID）
          const historyToSave = messages.map((msg) => ({
            ...msg,
            image: msg.image ? { id: msg.image.id, filename: msg.image.filename } : null,
          }));

          await aiChatDB.saveMessages(aiMode, historyToSave);

          // 2. 然後分別保存圖片到 images store
          for (const msg of messages) {
            if (msg.image && msg.image.data && msg.id) {
              try {
                await aiChatDB.saveImage(msg.id, msg.image.data, msg.image.filename);
              } catch (error) {
                console.error(`保存圖片失敗 (msg: ${msg.id}):`, error);
              }
            }
          }
        } catch (error) {
          console.error("保存聊天紀錄到 IndexedDB 失敗:", error);
        }
      };

      saveMessages();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [messages, aiMode, isDBReady]);

  // 載入語音列表
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // 清理資源
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        } catch (error) {
          console.error("清理語音朗讀資源時出錯:", error);
        }
      }

      if (geminiAbortControllerRef.current) {
        geminiAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Gemini API 呼叫（含重試機制）
  const callGeminiSafe = async (payload) => {
    const currentKey = apiKey;
    const maxRetries = 3;
    let attempt = 0;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;

    while (attempt < maxRetries) {
      try {
        if (geminiAbortControllerRef.current) {
          geminiAbortControllerRef.current.abort();
        }
        geminiAbortControllerRef.current = new AbortController();

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: geminiAbortControllerRef.current.signal,
        });

        if (response.ok) {
          return await response.json();
        }

        // 處理流量限制
        if (response.status === 429 || response.status === 503) {
          console.warn(
            `API 忙碌中，嘗試進行指數退避... (嘗試 ${attempt + 1}/${maxRetries})`,
          );
          attempt++;
          await sleep(2000 * Math.pow(2, attempt));
          continue;
        }

        if (response.status === 400) {
          throw new Error("API 參數錯誤。");
        }
        if (response.status === 403) {
          throw new Error("API Key 無效或過期，請檢查加密設定。");
        }

        throw new Error(`API Error: ${response.status}`);
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("API 請求已被中止");
        }
        console.error("Fetch attempt error:", error);
        if (error.message.includes("API Key")) throw error;

        attempt++;
        if (attempt < maxRetries) {
          await sleep(2000 * Math.pow(2, attempt));
        } else {
          throw error;
        }
      }
    }
    throw new Error("API Max retries reached");
  };

  // 發送訊息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const tz = autoTimeZone || tripConfig.timeZone || "Asia/Taipei";
    const displayTime = isTestMode ? testDateTime : new Date();
    const localTimeStr = displayTime.toLocaleString("zh-TW", {
      timeZone: tz,
      hour12: false,
    });

    const messageText = inputMessage;
    const messageImage = selectedImage;
    setInputMessage("");
    setSelectedImage(null);

    // 為訊息生成唯一 ID
    const msgId = `user_${Date.now()}`;

    const userMsg = {
      id: msgId,
      role: "user",
      text: messageText,
      // 將圖片轉換為物件格式，包含 id、data 和 filename
      image: messageImage ? {
        id: `img_${msgId}`,
        data: messageImage,
        filename: `image_${Date.now()}.jpg`
      } : null,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 格式轉換
      const formatToGeminiPart = (msg) => {
        const parts = [];

        if (msg.text && msg.text.trim()) {
          parts.push({ text: msg.text });
        } else if (!msg.image) {
          parts.push({ text: "" });
        }

        if (msg.image) {
          // 處理圖片可能是字串或物件的情況
          const imageData = typeof msg.image === "string"
            ? msg.image
            : (msg.image.data || msg.image);

          if (imageData && typeof imageData === "string" && imageData.includes(",")) {
            const [meta, data] = imageData.split(",");
            const mimeType = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
            parts.push({
              inlineData: {
                mimeType: mimeType,
                data: data,
              },
            });
          }
        }

        return { role: msg.role, parts: parts };
      };

      let payload;

      if (aiMode === "translate") {
        const targetLang = tripConfig.language.name;
        const translateSystemPrompt = `
        你是一個專業的即時口譯員，負責「繁體中文」與「${targetLang}」之間的雙向翻譯。
        
        規則：
        1. 若使用者輸入中文 -> 翻譯成${targetLang}，並在後方附上羅馬拼音 (發音指南)。
           格式：[${targetLang}翻譯] ([羅馬拼音])
        2. 若使用者輸入${targetLang} (或英文/其他語言) -> 僅翻譯成繁體中文。
        3. **嚴禁廢話**：不要解釋語法，不要打招呼，只輸出翻譯結果。
        4. 如果使用者輸入的內容明顯是想聊天或問行程，請禮貌回覆：「目前為口譯模式，請切換至導遊模式以詢問行程。」
        `;

        payload = {
          systemInstruction: { parts: [{ text: translateSystemPrompt }] },
          contents: [
            ...messages
              .slice(-1)
              .filter((m) => m.role !== "system")
              .map((m) => ({ role: m.role, parts: [{ text: m.text || "" }] })),
            formatToGeminiPart(userMsg),
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          },
        };
      } else {
        // 導遊模式
        let locationInstruction = "";
        const isGpsAvailable =
          hasLocationPermission &&
          userWeather.locationName &&
          !userWeather.loading &&
          userWeather.locationName !== "定位中...";
        if (isGpsAvailable) {
          locationInstruction = `【使用者目前 GPS 位置】：${userWeather.locationName}。\n回答時請優先依據此位置 (例如：附近的超商)。`;
        } else {
          locationInstruction = `目前無 GPS，請假設使用者位於行程表中的地點。`;
        }

        const startDate = new Date(tripConfig.startDate);
        const displayTime = isTestMode ? testDateTime : new Date();
        const today = new Date(
          displayTime.toLocaleString("en-US", { timeZone: tz }),
        );
        const diffTime = today - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        let dayStatus = "";
        if (diffDays >= 1 && diffDays <= itineraryData.length) {
          dayStatus = `今天是行程的第 ${diffDays} 天 (Day ${diffDays})。`;
        } else if (diffDays < 1) {
          dayStatus = `旅程尚未開始 (預計 ${tripConfig.startDate} 出發)。`;
        } else {
          dayStatus = `旅程已經結束。`;
        }

        const guideSystemContext = `你是這趟「${tripConfig.title}」的專屬 AI 導遊。
        【目前目的地當地時間】：${localTimeStr} (時區: ${tz})。
        【行程進度】：${dayStatus}
        ${locationInstruction}
        
        【行程資訊】：
        ${itineraryFlat}
        
        【參考指南】：
        ${guidesFlat}
        
        【推薦商家】：
        ${shopsFlat}
        
        規則：
        1. 簡潔、親切、重點式回答。
        2. 若使用者上傳圖片，請辨識圖片內容並結合行程資訊給予建議 (例如：這是什麼菜？這是在哪裡？)。
        `;

        const history = messages
          .filter((m) => m.role !== "system")
          .slice(1)
          .slice(-4)
          .map(formatToGeminiPart);

        payload = {
          systemInstruction: { parts: [{ text: guideSystemContext }] },
          contents: [...history, formatToGeminiPart(userMsg)],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        };
      }

      const data = await callGeminiSafe(payload);
      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "抱歉，我沒看清楚，請再試一次。";
      setMessages((prev) => [...prev, { id: `model_${Date.now()}`, role: "model", text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      let errMsg = "連線發生錯誤或是系統忙碌中，請稍後再試。";
      if (error.message.includes("Key"))
        errMsg = "API Key 錯誤，請檢查加密設定。";
      if (error.message.includes("413"))
        errMsg = "圖片檔案過大，請試著縮小圖片後再傳送。";

      setMessages((prev) => [...prev, { id: `model_${Date.now()}`, role: "model", text: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 切換模式
  const handleSwitchMode = async (newMode) => {
    if (aiMode === newMode) return;
    setAiMode(newMode);

    try {
      // 1. 嘗試從 IndexedDB 加載
      let saved = await aiChatDB.loadMessages(newMode);

      // 2. 如果 IndexedDB 中沒有數據，嘗試從 localStorage 遷移
      if (!saved || saved.length === 0) {
        const oldData = localStorage.getItem(`trip_chat_history_${newMode}`);
        if (oldData) {
          try {
            const oldMessages = JSON.parse(oldData);
            if (Array.isArray(oldMessages) && oldMessages.length > 0) {
              // 將舊數據保存到 IndexedDB
              const messagesToSave = oldMessages.map((msg) => ({
                ...msg,
                image: null,
              }));
              await aiChatDB.saveMessages(newMode, messagesToSave);

              // 清除 localStorage
              localStorage.removeItem(`trip_chat_history_${newMode}`);

              saved = oldMessages;
              console.log(`✅ 已將 ${newMode === "guide" ? "導遊" : "口譯"}模式聊天記錄從 localStorage 遷移至 IndexedDB`);
            }
          } catch (error) {
            console.error(`遷移 ${newMode} 模式數據失敗:`, error);
          }
        }
      }

      // 3. 加載消息和圖片
      if (saved && saved.length > 0) {
        const messagesWithImages = await Promise.all(
          saved.map(async (msg) => {
            if (msg.image && msg.image.id) {
              try {
                const imageRecord = await aiChatDB.getImage(msg.image.id);
                if (imageRecord) {
                  return {
                    ...msg,
                    image: {
                      id: imageRecord.id,
                      data: imageRecord.data,
                      filename: imageRecord.filename,
                    },
                  };
                }
              } catch (error) {
                console.warn(`無法加載圖片 ${msg.image.id}:`, error);
              }
            }
            return msg;
          })
        );
        setMessages(messagesWithImages);
      } else {
        setMessages([getAiWelcomeTemplate(newMode, tripConfig)]);
      }
    } catch (error) {
      console.error("從 IndexedDB 載入失敗:", error);
      setMessages([getAiWelcomeTemplate(newMode, tripConfig)]);
    }
  };

  // 清除聊天紀錄
  const handleClearChat = async () => {
    if (
      window.confirm(
        `確定要清除「${aiMode === "translate" ? "口譯" : "導遊"}」的所有紀錄嗎？`,
      )
    ) {
      const resetMsg = getAiWelcomeTemplate(aiMode, tripConfig);
      setMessages([resetMsg]);

      try {
        // 從 IndexedDB 刪除
        await aiChatDB.deleteMessages(aiMode);
      } catch (error) {
        console.error("從 IndexedDB 刪除失敗，嘗試 localStorage:", error);
      }

      // 同時從 localStorage 刪除（以防萬一）
      localStorage.removeItem(`trip_chat_history_${aiMode}`);
    }
  };

  // 語音輸入
  const toggleListening = (lang) => {
    if (!("webkitSpeechRecognition" in window)) {
      showToast("抱歉，您的瀏覽器不支援語音輸入功能。", "error");
      return;
    }

    if (listeningLang) {
      setListeningLang(null);
      return;
    }

    setListeningLang(lang);
    setInputMessage("");

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setListeningLang(null);
    };

    recognition.start();
  };

  // 語音朗讀
  const handleSpeak = useCallback((text) => {
    if (!("speechSynthesis" in window)) {
      alert("抱歉，您的瀏覽器不支援語音朗讀功能。");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = text.replace(/\*\*/g, "");
    const configLangCode = tripConfig.language.code;

    const normalizeLang = (code) => code.replace("_", "-").toLowerCase();

    const targetVoice =
      availableVoices.find(
        (v) => normalizeLang(v.lang) === normalizeLang(configLangCode),
      ) ||
      availableVoices.find((v) =>
        normalizeLang(v.lang).includes(normalizeLang(configLangCode)),
      );

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (configLangCode !== "zh-TW") {
      utterance.lang = configLangCode;
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
    } else {
      utterance.lang = "zh-TW";
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsSpeaking(false);
      if (e.error !== "interrupted") {
        showToast("語音播放失敗，請檢查手機設定", "error");
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [availableVoices, isSpeaking, tripConfig, showToast]);

  return {
    // 狀態
    aiMode,
    messages,
    inputMessage,
    isLoading,
    isSpeaking,
    listeningLang,
    availableVoices,
    selectedImage,
    tempImage,
    fileInputRef,
    chatEndRef,
    messageRefs,
    prevMessageCount,

    // 設定函式
    setMessages,
    setInputMessage,
    setSelectedImage,
    setTempImage,

    // 動作函式
    handleSendMessage,
    handleSwitchMode,
    handleClearChat,
    toggleListening,
    handleSpeak,
  };
};
