import React, { useState, useRef, useEffect } from "react";
import {
  Sun,
  CloudSnow,
  MapPin,
  Train,
  ShoppingBag,
  Star,
  Camera,
  AlertCircle,
  Snowflake,
  Hotel,
  Utensils,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  QrCode,
  Plus,
  Trash2,
  RotateCcw,
  Calendar,
  Link as LinkIcon,
  Home,
  Clock,
  Store,
  Coffee,
  Map,
  BookOpen,
  FileText,
  Maximize,
  Minimize,
  Sparkles,
  Send,
  MessageSquare,
  Loader,
  User,
  Bot,
  Briefcase,
  Thermometer,
  Navigation,
  Shield,
  Scissors,
  Volume2,
  StopCircle,
  Mic,
  MicOff,
  CloudRain,
  Cloud,
  CloudFog,
  CloudLightning,
  Wind,
  ArrowRight,
  Check,
  X,
  Share2,
  LocateFixed,
  LayoutDashboard,
  ListTodo,
  Plane,
  History,
  Phone,
  Moon,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
import {
  itineraryData,
  guidesData,
  usefulLinks,
  shopGuideData,
  tripConfig,
  checklistData,
} from "./tripdata_2026_karuizawa.jsx";

// --- Native Web Crypto API Utilities (取代 crypto-js) ---
const CryptoUtils = {
  buffToHex: (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  hexToBuff: (hex) =>
    new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    ),

  // 使用 PBKDF2 + AES-GCM 進行加密
  encrypt: async (text, password) => {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );
    const key = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(text),
    );
    return `${CryptoUtils.buffToHex(salt.buffer)}:${CryptoUtils.buffToHex(iv.buffer)}:${CryptoUtils.buffToHex(encrypted)}`;
  },

  // 解密
  decrypt: async (packedData, password) => {
    try {
      const [saltHex, ivHex, cipherHex] = packedData.split(":");
      if (!saltHex || !ivHex || !cipherHex) throw new Error("Format Error");
      const salt = CryptoUtils.hexToBuff(saltHex);
      const iv = CryptoUtils.hexToBuff(ivHex);
      const ciphertext = CryptoUtils.hexToBuff(cipherHex);
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"],
      );
      const key = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext,
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      throw new Error("密碼錯誤或資料損毀");
    }
  },
};

// --- 請在此填入加密後的 API Key ---
// 1. 在鎖定畫面點選「加密工具」
// 2. 輸入真實 API Key 和想設定的密碼
// 3. 複製生成的字串並貼上到這裡
// const ENCRYPTED_API_KEY_PAYLOAD = "4ce8a18af7bf710deec098c6ede51461:6e916219785c7b117c29368c:e90feeed8fa696c1232c0a6b80fd766e963575676ecb53435087fa36952a5d086423301d77b215ff52ace77ef99bd62c4c8b1d82330df8";
const ENCRYPTED_API_KEY_PAYLOAD = (
  import.meta.env.VITE_ENCODED_KEY || ""
).trim();

// 簡單的延遲函式
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ItineraryApp = () => {
  // --- Security State ---
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState(""); // 解密後的 Key 存這裡
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showEncryptTool, setShowEncryptTool] = useState(false); // 控制加密工具顯示

  // 新增：用來判斷「初始化定位」是否完成，預設為 false，等到定位有結果 (成功或失敗) 後才變成 true
  const [isAppReady, setIsAppReady] = useState(false);

  // --- Full Screen Logic ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 1. 偵測是否為手機裝置
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      // 簡單判斷：如果是 Android 或 iOS
      if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
        setIsMobile(true);
      } else {
        setIsMobile(window.innerWidth < 768); // 或者用寬度判斷
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. 監聽全螢幕狀態改變 (避免使用者用手機原生手勢退出後，按鈕狀態沒變)
  useEffect(() => {
    const handleFsChange = () => {
      const isFs =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      setIsFullscreen(!!isFs);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange); // iOS/Safari
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  // 3. 切換全螢幕函式
  const toggleFullScreen = async () => {
    const doc = document.documentElement;
    // 進入全螢幕
    if (!isFullscreen) {
      try {
        if (doc.requestFullscreen) await doc.requestFullscreen();
        else if (doc.webkitRequestFullscreen)
          await doc.webkitRequestFullscreen(); // Safari
        else if (doc.msRequestFullscreen) await doc.msRequestFullscreen(); // IE11
      } catch (err) {
        console.error("全螢幕切換失敗:", err);
        // iOS Safari 通常不支援 DOM 全螢幕，這裡可以選擇跳提示或忽略
      }
    }
    // 離開全螢幕
    else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen)
        await document.webkitExitFullscreen();
    }
  };

  // 加密工具用的 State
  const [toolKey, setToolKey] = useState("");
  const [toolPwd, setToolPwd] = useState("");
  const [toolResult, setToolResult] = useState("");

  // --- 輔助函式：解析 Markdown 粗體語法 ---
  // 將 "**文字**" 轉換為 <strong>文字</strong>
  const renderMessage = (text) => {
    if (!text) return null;
    // 使用正規表達式切割字串
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // 移除前後的 ** 並用 strong 包裹
        return (
          <strong key={index} className="font-bold text-inherit">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // 定義一個簡單的複製函式
  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(`已複製：${text}`);
      })
      .catch(() => {
        showToast("複製失敗", "error");
      });
  };

  // --- Theme Helpers ---
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auto-detect sunset (approx 17:00 in winter Japan)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 17 || hour < 6) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Dynamic Theme Logic ---
  // 從 Config 讀取設定，若無則使用預設值
  const currentTheme = tripConfig.theme || {
    colorBase: "stone",
    colorAccent: "amber",
    bgTexture: "url('...')", // (省略預設值)
    bgGradientLight:
      "bg-[#FDFBF7] from-stone-200/40 via-transparent to-transparent",
    bgGradientDark:
      "bg-[#0C0C0C] from-neutral-800/30 via-transparent to-transparent",
    blobs: {
      light: ["bg-stone-400/20", "bg-orange-300/20", "bg-gray-300/30"],
      dark: ["bg-blue-500/10", "bg-purple-500/10", "bg-emerald-500/10"],
    },
  };

  const cBase = currentTheme.colorBase; // e.g., "slate"
  const cAccent = currentTheme.colorAccent; // e.g., "sky"

  // --- Dynamic Theme Logic ---
  // 從 Config 讀取設定，若無則使用預設值
  const theme = {
    // 背景：結合 紋理 + 漸層
    bg: isDarkMode
      ? `${currentTheme.bgGradientDark} bg-[image:var(--bg-texture)] bg-fixed`
      : `${currentTheme.bgGradientLight} bg-[image:var(--bg-texture)] bg-fixed`,

    // 主要文字
    text: isDarkMode
      ? currentTheme.textColors?.dark || `text-${cBase}-200`
      : currentTheme.textColors?.light || `text-${cBase}-800`,

    // 次要文字
    textSec: isDarkMode
      ? currentTheme.textColors?.secDark || `text-${cBase}-400`
      : currentTheme.textColors?.secLight || `text-${cBase}-500`,

    // 卡片玻璃質感
    cardBg: isDarkMode
      ? `bg-${cBase}-900/40 backdrop-blur-xl backdrop-saturate-150 border-${cBase}-700/50`
      : `bg-white/60 backdrop-blur-xl backdrop-saturate-150 border-white/40`,

    cardBorder: isDarkMode
      ? `border-${cBase}-700/50`
      : `border-${cBase}-200/50`,

    cardShadow: isDarkMode
      ? "shadow-2xl shadow-black/40"
      : `shadow-xl shadow-${cBase}-500/5`,

    // 強調色 (按鈕、Icon)
    accent: isDarkMode ? `text-${cAccent}-300` : `text-${cAccent}-600`,
    accentBg: isDarkMode ? `bg-${cAccent}-500/20` : `bg-${cAccent}-100`,

    // 導覽列
    navBg: isDarkMode
      ? `bg-${cBase}-900/20 backdrop-blur-2xl border-${cBase}-700/30 shadow-lg`
      : `bg-white/30 backdrop-blur-2xl border-white/30 shadow-lg shadow-${cBase}-500/5`,

    // 裝飾光暈
    blob1: isDarkMode
      ? currentTheme.blobs.dark[0]
      : currentTheme.blobs.light[0],
    blob2: isDarkMode
      ? currentTheme.blobs.dark[1]
      : currentTheme.blobs.light[1],
    blob3: isDarkMode
      ? currentTheme.blobs.dark[2]
      : currentTheme.blobs.light[2],
  };

  // 重要：將紋理傳遞給 CSS 變數，解決 Tailwind string interpolation 的限制
  const containerStyle = {
    "--bg-texture": currentTheme.bgTexture,
  };

  const colors = {
    blue: isDarkMode ? "text-sky-300" : "text-[#5D737E]",
    green: isDarkMode ? "text-emerald-300" : "text-[#556B2F]",
    red: isDarkMode ? "text-red-300" : "text-[#A04040]",
    orange: isDarkMode ? "text-amber-300" : "text-[#CD853F]",
    pink: isDarkMode ? "text-rose-300" : "text-[#BC8F8F]",
  };

  // --- Auth Logic ---
  // 1. Check local storage on load
  useEffect(() => {
    const checkSavedPassword = async () => {
      const savedPwd = localStorage.getItem("trip_password");
      if (savedPwd && ENCRYPTED_API_KEY_PAYLOAD) {
        await attemptUnlock(savedPwd, true);
      } else if (!ENCRYPTED_API_KEY_PAYLOAD) {
        // 如果沒有設定加密 Key，直接解鎖 (開發模式或未設定)
        setIsVerified(true);
      }
    };
    checkSavedPassword();
  }, []);

  const attemptUnlock = async (inputPwd, isAuto = false) => {
    setIsAuthLoading(true);
    setAuthError("");
    try {
      if (!ENCRYPTED_API_KEY_PAYLOAD) {
        // 如果還沒設定 payload，但使用者按了解鎖，就當作測試模式
        setIsVerified(true);
        return;
      }

      const decryptedKey = await CryptoUtils.decrypt(
        ENCRYPTED_API_KEY_PAYLOAD,
        inputPwd,
      );

      // 簡單驗證 (Google API Key 通常以 AIza 開頭)
      if (decryptedKey && decryptedKey.length > 10) {
        setApiKey(decryptedKey);
        setIsVerified(true);
        localStorage.setItem("trip_password", inputPwd);
      } else {
        throw new Error("解密失敗");
      }
    } catch {
      if (!isAuto) setAuthError("密碼錯誤，請再試一次");
      if (isAuto) localStorage.removeItem("trip_password"); // 清除無效的舊密碼
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    attemptUnlock(password);

    // 🆕 新增：如果是手機，解鎖時順便嘗試進入全螢幕
    if (isMobile) {
      toggleFullScreen();
    }
  };

  const generateEncryptedString = async () => {
    if (!toolKey || !toolPwd) {
      setToolResult("請輸入 Key 與密碼");
      return;
    }
    try {
      const result = await CryptoUtils.encrypt(toolKey, toolPwd);
      setToolResult(result);
    } catch {
      setToolResult("加密失敗");
    }
  };

  // Tab state: 'itinerary', 'shops', 'guides', 'resources', 'ai'
  const [activeTab, setActiveTab] = useState("itinerary");
  // activeDay: -1 for Overview, 0-5 for Day 1-6
  const [activeDay, setActiveDay] = useState(-1);
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedGuides, setExpandedGuides] = useState({});
  const [expandedShops, setExpandedShops] = useState({});
  const [availableVoices, setAvailableVoices] = useState([]);

  // --- Checklist Logic ---
  const [newItemText, setNewItemText] = useState(""); // 🆕 新增：輸入框狀態

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem("trip_checklist_v1");
      if (saved) {
        // ✅ 改為：直接使用儲存的清單 (這樣才能包含使用者新增的項目)
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("讀取清單失敗", e);
    }
    return checklistData; // 如果沒存檔過，就用預設資料
  });

  // 當 checklist 改變時，自動存入 localStorage
  useEffect(() => {
    localStorage.setItem("trip_checklist_v1", JSON.stringify(checklist));
  }, [checklist]);

  // 新增：航班資訊收折狀態 (預設 false = 收折)
  const [isFlightInfoExpanded, setIsFlightInfoExpanded] = useState(false);

  const toggleCheckItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };
  // 🆕 新增項目
  const handleAddItem = () => {
    if (!newItemText.trim()) return; // 防止空字串
    const newItem = {
      id: Date.now(), // 使用時間戳記當作唯一 ID
      text: newItemText.trim(),
      checked: false,
    };
    setChecklist((prev) => [...prev, newItem]); // 加入清單末尾
    setNewItemText(""); // 清空輸入框
    showToast("已新增檢查項目");
  };
  // 🆕 刪除項目 (長按或點擊垃圾桶)
  const handleDeleteItem = (id) => {
    if (window.confirm("確定要刪除此項目嗎？")) {
      setChecklist((prev) => prev.filter((item) => item.id !== id));
      showToast("項目已刪除", "error"); // 使用 error 樣式顯示刪除提示
    }
  };
  // 🆕 重置檢查清單 (還原成預設值)
  const handleResetChecklist = () => {
    if (
      window.confirm(
        "確定要重置檢查清單嗎？\n這將會：\n1. 刪除所有您自訂的項目\n2. 將所有預設項目還原為「未勾選」狀態",
      )
    ) {
      // 使用 JSON 序列化來深拷貝 checklistData，確保是全新的狀態
      // (雖然直接用 checklistData 也可以，但這樣寫最保險)
      setChecklist(JSON.parse(JSON.stringify(checklistData)));
      showToast("清單已還原成預設值");
    }
  };

  // Weather State
  const [weatherForecast, setWeatherForecast] = useState({
    karuizawa: null,
    tokyo: null,
    loading: true,
  });

  // User Location Weather State
  const [userWeather, setUserWeather] = useState({
    temp: null,
    desc: "",
    locationName: "定位中...",
    weatherCode: null, // <--- 新增這行，用來存天氣代碼
    //icon: <Loader className={`w-5 h-5 animate-spin ${theme.textSec}`} />,
    loading: false,
    error: null,
  });

  // Permission State
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Chat State
  // 🆕 輔助函式：根據模式取得對應的歡迎詞 (更新版)
  const getWelcomeMessage = (mode) => {
    const langName = tripConfig.language.name;
    const langLabel = tripConfig.language.label;

    if (mode === "translate") {
      return {
        role: "model",
        text: `您好！我是您的隨身 AI 口譯員 🌍\n\n💡 口譯模式功能：\n🎤 點「中」說話：我會將中文翻成${langName} (附拼音)。\n🎤 點「${langLabel}」說話：錄下對方說的${langName}，我會直接翻成中文！`,
      };
    } else {
      // 導遊模式
      return {
        role: "model",
        text: `您好！我是您的專屬 AI 導遊 ✨\n我已經熟讀了您的行程。\n\n💡 導遊模式功能：\n🎤 點「中」說話：您可以詢問行程細節、交通方式或周邊推薦。\n(此模式專注於行程導覽，請切換模式以使用翻譯功能)`,
      };
    }
  };

  // State 初始化
  const [aiMode, setAiMode] = useState("translate"); // 預設為 'translate' (口譯模式)
  const [messages, setMessages] = useState([getWelcomeMessage("translate")]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningLang, setListeningLang] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // ... existing helper functions (toggleExpand, etc.) ...
  const toggleExpand = (dayIndex, eventIndex) => {
    const key = `${dayIndex}-${eventIndex}`;
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleGuide = (index) => {
    setExpandedGuides((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleShop = (index) => {
    setExpandedShops((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "ai") scrollToBottom();
  }, [messages, activeTab]);

  // Show Toast Helper
  const showToast = React.useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  // ... existing map and weather helpers ...
  // 1. Get Google Map Link
  const getMapLink = (query) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // 2. Get Weather Info from WMO Code
  const getWeatherInfo = (code) => {
    const iconClass = "w-7 h-7"; // Slightly larger icons
    const color = isDarkMode ? "text-neutral-300" : "text-neutral-600"; // Muted icons
    if (code === 0)
      return {
        icon: (
          <Sun
            className={`${iconClass} ${isDarkMode ? "text-amber-200" : "text-amber-500"}`}
          />
        ),
        text: "晴朗",
        advice: "天氣很好，注意防曬。",
      };
    if ([1, 2, 3].includes(code))
      return {
        icon: <Cloud className={`${iconClass} ${color}`} />,
        text: "多雲",
        advice: "舒適，適合戶外。",
      };
    if ([45, 48].includes(code))
      return {
        icon: <CloudFog className={`${iconClass} ${theme.textSec}`} />,
        text: "有霧",
        advice: "能見度低請小心。",
      };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
      return {
        icon: (
          <CloudRain
            className={`${iconClass} ${isDarkMode ? "text-sky-300" : "text-sky-600"}`}
          />
        ),
        text: "有雨",
        advice: "請務必攜帶雨具。",
      };
    if ([71, 73, 75, 77, 85, 86].includes(code))
      return {
        icon: (
          <Snowflake
            className={`${iconClass} ${isDarkMode ? "text-cyan-200" : "text-cyan-500"}`}
          />
        ),
        text: "降雪",
        advice: "請穿防滑雪靴。",
      };
    if ([95, 96, 99].includes(code))
      return {
        icon: (
          <CloudLightning
            className={`${iconClass} ${isDarkMode ? "text-yellow-200" : "text-yellow-600"}`}
          />
        ),
        text: "雷雨",
        advice: "請盡量待在室內。",
      };
    return {
      icon: <Sun className={`${iconClass} ${color}`} />,
      text: "晴時多雲",
      advice: "注意日夜溫差。",
    };
  };

  // 3. Determine Location based on Day Index
  const getDailyLocation = (dayIndex) => {
    // 如果是總覽 (-1) 或找不到資料，預設回傳第一個地點 (通常是主要城市)
    if (dayIndex === -1 || !itineraryData[dayIndex])
      return tripConfig.locations[0].key;
    // 回傳該日期設定的 locationKey
    return itineraryData[dayIndex].locationKey || tripConfig.locations[0].key;
  };

  // --- Trip Date Logic ---
  const tripStartDate = new Date(tripConfig.startDate);
  const tripEndDate = new Date(tripConfig.endDate);
  const today = new Date();

  let tripStatus = "before"; // 'before', 'during', 'after'
  let daysUntilTrip = 0;
  let currentTripDayIndex = -1;

  if (today < tripStartDate) {
    tripStatus = "before";
    const diffTime = Math.abs(tripStartDate - today);
    daysUntilTrip = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (today >= tripStartDate && today <= tripEndDate) {
    tripStatus = "during";
    const diffTime = Math.abs(today - tripStartDate);
    currentTripDayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else {
    tripStatus = "after";
  }

  // ... existing location fetch logic ...
  // --- User Location Weather Logic ---
  const getUserLocationWeather = React.useCallback(
    (isSilent = false) => {
      const KNOWN_LOCATIONS = [
        ...tripConfig.locations, // 直接展開我們的設定
        { name: "台北", lat: 25.033, lon: 121.5654 }, // 保留台北當作預設
        { name: "桃園機場", lat: 25.0796, lon: 121.2342 },
      ];

      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const fetchLocalWeather = async (
        latitude,
        longitude,
        customName = null,
      ) => {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&weathercode=true`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          let city = customName;
          if (!city) {
            const matchedLocation = KNOWN_LOCATIONS.find(
              (loc) => getDistance(latitude, longitude, loc.lat, loc.lon) < 20,
            );
            if (matchedLocation) city = matchedLocation.name;
          }

          if (!city) {
            try {
              const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`;
              const geoRes = await fetch(geoUrl);
              const geoData = await geoRes.json();
              if (geoData && geoData.address) {
                city =
                  geoData.address.city ||
                  geoData.address.town ||
                  geoData.address.village ||
                  geoData.address.county ||
                  geoData.address.state ||
                  "您的位置";
              }
            } catch {
              console.warn("Geo lookup failed, using default name");
              city = "目前位置";
            }
          }

          const info = getWeatherInfo(weatherData.current_weather.weathercode);

          setUserWeather({
            temp: Math.round(weatherData.current_weather.temperature),
            desc: info.text,
            weatherCode: weatherData.current_weather.weathercode,
            //icon: info.icon,
            locationName: city || "未知地點",
            lat: latitude,
            lon: longitude,
            loading: false,
            error: null,
          });
        } catch (err) {
          console.error("Weather Fetch Error:", err);
          setUserWeather((prev) => ({
            ...prev,
            loading: false,
            locationName: "天氣載入失敗",
            error: "無法連線",
          }));
        } finally {
          // 關鍵新增：無論成功或失敗，都標記「App 初始化完成」，這樣載入畫面才會消失，進入主畫面
          setIsAppReady(true);
        }
      };
      const fallbackLocation = {
        lat: 25.033,
        lng: 121.5654,
        name: "台北 (預設)",
      };
      if (!navigator.geolocation) {
        setHasLocationPermission(false);
        fetchLocalWeather(
          fallbackLocation.lat,
          fallbackLocation.lng,
          fallbackLocation.name,
        );
        return;
      }
      if (!isSilent) {
        setUserWeather((prev) => ({
          ...prev,
          loading: true,
          locationName: "定位中...",
        }));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // ✅ 成功：設定權限為 true，並更新天氣
          setHasLocationPermission(true);
          fetchLocalWeather(
            position.coords.latitude,
            position.coords.longitude,
          );
        },
        (err) => {
          console.warn("自動定位未成功:", err.code, err.message);

          // 🛑 關鍵修改：區分錯誤類型
          if (err.code === 1) {
            // 情況 A：使用者明確按下「封鎖」或「拒絕」 (PERMISSION_DENIED)
            // 這時候才把按鈕變紅
            setHasLocationPermission(false);
            showToast("您已封鎖定位權限", "error");
          } else {
            // 情況 B：逾時 (TIMEOUT) 或 位置不可用 (POSITION_UNAVAILABLE)
            // 這代表權限可能還在，只是暫時抓不到
            // 我們將狀態設為 null (中立)，讓按鈕保持藍色/灰色，允許使用者再次點擊
            setHasLocationPermission(null);

            // 選擇性：如果是手動點擊觸發的(loading狀態下)，才跳提示，避免自動重新整理時一直跳通知煩人
            // 這裡簡單處理：只在 console 留紀錄，UI 默默切回預設地點，以免打擾體驗
          }

          // 無論哪種錯誤，都切換回預設地點 (台北)
          fetchLocalWeather(
            fallbackLocation.lat,
            fallbackLocation.lng,
            fallbackLocation.name,
          );
        },
        {
          enableHighAccuracy: false, // 關閉高精準度，加速獲取
          timeout: 10000, // 10秒超時
          maximumAge: 600000, // 接受 10 分鐘內的快取
        },
      );
    },
    [showToast, getWeatherInfo],
  );

  // --- 定時更新位置與天氣邏輯 ---
  useEffect(() => {
    if (isVerified) {
      // 1. 首次載入：執行一般更新 (顯示 Loading)
      getUserLocationWeather(false);

      // 2. 設定定時器：每 10 分鐘 (600,000ms) 執行一次
      const intervalId = setInterval(() => {
        console.log("⏰ 自動更新位置與天氣...");
        // 使用「靜默模式」，後台更新不打擾使用者
        getUserLocationWeather(true);
      }, 600000);

      // 3. 清除定時器 (當元件卸載或重登時)
      return () => clearInterval(intervalId);
    }
  }, [isVerified, getUserLocationWeather]);

  const handleShareLocation = () => {
    // 1. 檢查是否有已儲存的位置資料
    if (!userWeather.lat || !userWeather.lon) {
      // 如果還沒定位完成，提示使用者，並嘗試觸發一次定位更新
      showToast("尚未取得定位資訊，正在更新中...", "error");
      getUserLocationWeather(); // 呼叫更新函式
      return;
    }
    // 2. 直接使用 State 裡的資料 (同步執行，瀏覽器不會擋)
    const lat = userWeather.lat;
    const lng = userWeather.lon;
    const mapUrl = `https://www.google.com/maps?q=$${lat},${lng}`; // 修正：您原本的網址結構可能有誤，這裡微調為標準格式
    // 或者維持您原本的格式: `https://www.google.com/maps?q=${lat},${lng}` 如果這是您想要的特殊格式
    // 建議使用標準 Google Maps 連結格式，相容性較好：
    // const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    const shareText = `我在這裡！點擊查看我的位置：${mapUrl}`;

    if (navigator.share) {
      navigator
        .share({
          title: "我的位置",
          text: "我在這裡！",
          url: mapUrl,
        })
        .then(() => showToast("分享成功"))
        .catch((error) => {
          // 使用者取消分享不算是錯誤，可以忽略
          if (error.name !== "AbortError") console.error("分享失敗:", error);
        });
    } else {
      // 電腦版或不支援 Share API 的 fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showToast("位置連結已複製！");
      } catch {
        showToast("複製失敗", "error");
      }
      document.body.removeChild(textArea);
    }
  };

  // ... existing weather fetch and voice logic ...
  // --- Weather API Integration ---
  useEffect(() => {
    if (!isVerified) return;

    const fetchWeather = async () => {
      try {
        const params =
          "daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=14"; // 抓長一點比較保險

        // 自動為 config 裡的每一個地點產生 fetch 請求
        const weatherPromises = tripConfig.locations.map(async (loc) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&${params}`;
          const res = await fetch(url);
          const data = await res.json();
          return { key: loc.key, data: data.daily };
        });

        const results = await Promise.all(weatherPromises);

        // 轉換成物件格式: { karuizawa: {...}, tokyo: {...} }
        const newForecast = {};
        results.forEach((item) => {
          newForecast[item.key] = item.data;
        });

        setWeatherForecast({
          ...newForecast,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch weather:", error);
        setWeatherForecast((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchWeather();
  }, [isVerified]);

  // --- Voice Input ---
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    // Chrome 需要監聽事件，Safari/Firefox 比較直接
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices(); // 嘗試立即執行一次

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "zh-TW";

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputMessage(transcript);
      };
      recognitionRef.current.onend = () => {
        setListeningLang(null);
      };
      recognitionRef.current.onerror = () => {
        setListeningLang(null);
      };
    }
  }, []);

  const toggleListening = (lang) => {
    if (!recognitionRef.current) {
      alert("抱歉，您的瀏覽器不支援語音輸入功能。");
      return;
    }
    if (listeningLang === lang) {
      recognitionRef.current.stop();
      setListeningLang(null);
    } else {
      if (listeningLang) recognitionRef.current.stop();
      setInputMessage("");
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setListeningLang(lang);
    }
  };

  // --- Text-to-Speech ---
  // 1. 定義各國語言的特徵與清理規則 (新增這段常數)
  const LANGUAGE_SPECS = {
    "ja-JP": {
      // 日文：含平假名或片假名
      checkRegex: /[\u3040-\u309F\u30A0-\u30FF]/,
      // 策略：移除括號內的拼音 (保留日文漢字與假名)
      cleanStrategy: "removeBrackets",
    },
    "th-TH": {
      // 泰文：含泰文 Unicode 區塊
      checkRegex: /[\u0E00-\u0E7F]/,
      // 策略：強力過濾 (只保留該國文字，刪除所有中文/英文/符號)
      // 泰文翻譯通常混雜很多說明，所以用這個策略最乾淨
      cleanStrategy: "keepOnlyMatches",
    },
    "ko-KR": {
      // 韓文：含諺文音節或字母
      checkRegex: /[\uAC00-\uD7AF\u1100-\u11FF]/,
      // 策略：韓文結構通常像日文 (文法類似)，拼音在括號內，所以移除括號即可
      cleanStrategy: "removeBrackets",
    },
    "vi-VN": {
      // 越南文：拉丁字母延伸 (這比較寬鬆，先做個範例)
      checkRegex: /[a-zA-Z\u00C0-\u1EF9]/,
      cleanStrategy: "removeBrackets",
    },
    // 未來如果要擴充其他語言，直接在這裡加即可，不用動函式邏輯
  };

  // 修改後的通用朗讀函式 (手機相容優化版)
  const handleSpeak = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("抱歉，您的瀏覽器不支援語音朗讀功能。");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = text.replace(/\*\*/g, ""); // 基礎清理
    const configLangCode = tripConfig.language.code; // 目標語言 (如 ja-JP)

    // 🆕 優化 1：正規化語言代碼 (解決 ja-JP 與 ja_JP 不匹配的問題)
    const normalizeLang = (code) => code.replace("_", "-").toLowerCase();

    // 🔍 嘗試尋找語音包 (比對 normalized 之後的代碼)
    const targetVoice =
      availableVoices.find(
        (v) => normalizeLang(v.lang) === normalizeLang(configLangCode),
      ) ||
      availableVoices.find((v) =>
        normalizeLang(v.lang).includes(normalizeLang(configLangCode)),
      );

    // 🆕 優化 2：放寬判定標準
    // 只要是「非中文」的目標語言，即使找不到 voice 物件，我們也假設手機系統支援該語言 (Blind Try)
    // 這樣可以解決 iOS/Android 瀏覽器不回傳 voice 列表的問題
    const shouldTryForeign = configLangCode !== "zh-TW";

    const spec = LANGUAGE_SPECS[configLangCode] || {
      checkRegex: /.*/,
      cleanStrategy: "removeBrackets",
    };

    // 決定清理策略
    if (shouldTryForeign) {
      // ✅ 嘗試使用外語模式 (不管有沒有找到 voice 物件，都先執行清理)
      if (spec.cleanStrategy === "keepOnlyMatches") {
        // 泰文：強力過濾
        const matches = textToSpeak.match(new RegExp(spec.checkRegex, "g"));
        if (matches) textToSpeak = matches.join(" ");
      } else {
        // 日/韓：移除括號拼音
        textToSpeak = textToSpeak.replace(/\s*[()（].*?[)）]/g, "");
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // 設定語言
    if (shouldTryForeign) {
      // ⚠️ 關鍵：即使 targetVoice 是 undefined，也要設定 lang，讓手機系統自己去抓預設語音
      utterance.lang = configLangCode;

      if (targetVoice) {
        utterance.voice = targetVoice; // 如果有找到特定語音包，就指定使用
      } else {
        // 如果找不到，不跳錯誤，改為顯示「嘗試中」的溫和提示
        // 這樣才不會因為手機列表不全而導致功能被鎖死
        // showToast(`嘗試使用系統預設${configLangName}發音`, 'success');
        console.warn("未找到特定語音包，嘗試使用系統預設語言");
      }
    } else {
      utterance.lang = "zh-TW";
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsSpeaking(false);
      // 如果真的發生錯誤 (例如系統完全不支援)，再跳出提示
      if (e.error !== "interrupted") {
        showToast("語音播放失敗，請檢查手機設定", "error");
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // --- Gemini API Safe Call Function (New Implementation) ---
  const callGeminiSafe = async (payload) => {
    // 使用解密後的 Key，如果沒有則使用空字串 (會失敗)
    const currentKey = apiKey;

    const maxRetries = 3;
    let attempt = 0;
    // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${currentKey}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // 成功回應
        if (response.ok) {
          return await response.json();
        }

        // 偵測是否因為打太快被擋 (HTTP 429) 或 服務暫時不可用 (503)
        if (response.status === 429 || response.status === 503) {
          console.warn(
            `API 忙碌中，暫停一下... (嘗試 ${attempt + 1}/${maxRetries})`,
          );
          attempt++;
          // 指數退避：2s, 4s, 8s...
          await sleep(2000 * Math.pow(2, attempt));
          continue; // 重新進入迴圈
        }

        // Key 錯誤
        if (response.status === 400 || response.status === 403) {
          throw new Error("API Key 無效或過期，請檢查加密設定。");
        }

        // 其他 API 錯誤直接拋出
        throw new Error(`API Error: ${response.status}`);
      } catch (error) {
        console.error("Fetch attempt error:", error);
        if (error.message.includes("API Key")) throw error; // Key 錯就不重試了

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

  // ... handleSendMessage logic updated to use systemInstruction ...
  const handleSwitchMode = (newMode) => {
    if (aiMode === newMode) return; // 如果模式沒變就不動作
    setAiMode(newMode); // 設定新模式
    setMessages([getWelcomeMessage(newMode)]); // 關鍵：重置聊天紀錄並換上新問候語
  };
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = { role: "user", text: inputMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      let payload;

      // 🛑 分流邏輯
      if (aiMode === "translate") {
        // === 模式 A：口譯模式 ===
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
          contents: [{ role: "user", parts: [{ text: userMsg.text }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000, // ⬆️ 提高上限，避免長句翻譯被切斷
          },
        };
      } else {
        // === 模式 B：導遊模式 (GPS 優先版) ===

        // 1. 資料轉換函式 (保持不變)
        const flattenItinerary = (data) => {
          return data
            .map((day) => {
              const events = day.events
                .map((e) => `  - ${e.time} ${e.title}: ${e.desc}`)
                .join("\n");
              return `📅 ${day.day} (${day.locationKey}):\n${events}`;
            })
            .join("\n\n");
        };

        const flattenGuides = (data) => {
          return data.map((g) => `📘 ${g.title}: ${g.summary}`).join("\n");
        };

        const flattenShops = (data) => {
          return data
            .map((area) => {
              const shops = area.mainShops
                .map((s) => `  * ${s.name}: ${s.note}`)
                .join("\n");
              const nearby = area.nearbyChains
                .map((c) => `  - ${c.name} (${c.location})`)
                .join(", ");
              return `🛍️ ${area.area}:\n${shops}\n  (周邊連鎖: ${nearby})`;
            })
            .join("\n\n");
        };

        // 2. 📍 關鍵修改：位置判斷邏輯 (GPS > 行程分頁)
        let locationInstruction = "";
        const isGpsAvailable =
          hasLocationPermission &&
          userWeather.locationName &&
          !userWeather.loading &&
          userWeather.locationName !== "定位中...";

        if (isGpsAvailable) {
          // ✅ 情況 A：有 GPS -> 強制以 GPS 為主
          locationInstruction = `
          【最高優先級位置資訊】
          使用者目前真實 GPS 位置：${userWeather.locationName}。
          
          ⚠️ 答題規則：
          1. 當使用者詢問「這附近」、「最近的超商」、「天氣如何」時，**必須** 依據上述 GPS 位置回答。
          2. 請**忽略**使用者目前在 App 中點選的行程分頁地點，除非使用者明確指定 (例如問「輕井澤的超商」)。
          3. 若 GPS 顯示在台灣，而使用者問日本店家，請提示使用者「您目前定位在台灣，以下是該日本店家的資訊...」。
          `;
        } else {
          // ⚠️ 情況 B：無 GPS -> 降級使用行程分頁地點
          let currentView = "行程總覽";
          if (activeDay >= 0 && itineraryData[activeDay]) {
            currentView = `${itineraryData[activeDay].day} (${itineraryData[activeDay].locationKey})`;
          }

          locationInstruction = `
          【位置資訊】
          目前無法取得 GPS 定位。
          使用者正在查看行程分頁：${currentView}。
          請假設使用者位於該行程地點進行回答。
          `;
        }

        // 3. 組合 Prompt
        const textData = `
        【行程表】
        ${flattenItinerary(itineraryData)}
        
        【參考指南】
        ${flattenGuides(guidesData)}
        
        【推薦商家】
        ${flattenShops(shopGuideData)}
        `;

        const guideSystemContext = `你是這趟「${tripConfig.title}」的專屬 AI 導遊。
        
        ${locationInstruction}  <-- ⚠️ 這裡已植入 GPS 優先指令
        
        以下是行程與資訊摘要：
        ${textData}
        
        請嚴格遵守以下回應規則：
        1. **簡潔模式**：回答直擊重點，不廢話。
        2. **排版**：禁用 Markdown 列表，僅標題可粗體。
        3. **導遊模式**：依提供的文字資料回答。風格親切、親子遊。
        4. 若使用者要求翻譯，請建議切換至「口譯模式」。
        `;

        // 4. 準備歷史訊息
        const history = messages
          .filter((m) => m.role !== "system")
          .slice(1)
          .slice(-4)
          .map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          }));

        payload = {
          systemInstruction: { parts: [{ text: guideSystemContext }] },
          contents: [
            ...history,
            { role: "user", parts: [{ text: userMsg.text }] },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        };
      }
      const data = await callGeminiSafe(payload);
      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "抱歉，我現在有點忙，請稍後再試。";
      setMessages((prev) => [...prev, { role: "model", text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      let errMsg = "連線發生錯誤或是系統忙碌中，請稍後再試。";
      if (error.message.includes("Key"))
        errMsg = "API Key 錯誤，請檢查加密設定。";
      setMessages((prev) => [...prev, { role: "model", text: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Weather Determination ---
  const current = activeDay === -1 ? null : itineraryData[activeDay];

  // Determine current weather based on day
  const currentLocation = getDailyLocation(activeDay);
  const weatherData = weatherForecast[currentLocation];

  let displayWeather = {
    icon: <Sun className="w-7 h-7 text-amber-500" />,
    temp: "N/A",
    desc: "載入中...",
    advice: "請稍候",
  };

  if (!weatherForecast.loading && weatherData) {
    const dayIndex = activeDay === -1 ? 0 : activeDay;
    const forecastIndex = dayIndex < weatherData.time.length ? dayIndex : 0;
    const maxTemp = Math.round(weatherData.temperature_2m_max[forecastIndex]);
    const minTemp = Math.round(weatherData.temperature_2m_min[forecastIndex]);
    const weatherCode = weatherData.weathercode[forecastIndex];
    const info = getWeatherInfo(weatherCode);

    displayWeather = {
      icon: info.icon,
      temp: `${minTemp}°C / ${maxTemp}°C`,
      desc: info.text,
      advice: info.advice,
    };
  } else if (!weatherForecast.loading && !weatherData) {
    // 抓不到資料時的通用顯示
    displayWeather = {
      icon: <Cloud className="w-7 h-7 text-stone-300" />,
      temp: "--",
      desc: "無資料",
      advice: "無法取得預報，請稍後再試",
    };
  }

  // --- Lock Screen Render ---
  if (!isVerified) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden ${isDarkMode ? "bg-[#1A1A1A] text-neutral-200" : "bg-[#F0F2F5] text-slate-700"}`}
      >
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div
            className={`absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob opacity-20 ${theme.blob1}`}
          ></div>
          <div
            className={`absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob animation-delay-4000 opacity-20 ${theme.blob2}`}
          ></div>
        </div>

        <div
          className={`max-w-md w-full backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative z-10 ${theme.cardBg} ${theme.cardBorder}`}
        >
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg ${isDarkMode ? "bg-neutral-800 text-sky-300" : "bg-white text-indigo-500"}`}
            >
              {isAuthLoading ? (
                <Loader className="w-8 h-8 animate-spin" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">行程表已鎖定</h2>
            <p className={`text-sm ${theme.textSec}`}>
              請輸入家族通關密語以解鎖並解密 API Key
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入密碼..."
                className={`w-full px-4 py-3.5 rounded-xl border text-center text-lg tracking-widest focus:outline-none focus:ring-2 transition-all shadow-inner ${isDarkMode ? "bg-neutral-900 border-neutral-700 focus:border-sky-500 focus:ring-sky-500/20 placeholder:tracking-normal" : "bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder:tracking-normal"}`}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isAuthLoading || !password}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 
                 ${
                   isAuthLoading || !password
                     ? "bg-slate-400 cursor-not-allowed opacity-70"
                     : isDarkMode
                       ? "bg-gradient-to-r from-sky-600 to-blue-700 hover:shadow-sky-500/20"
                       : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-500/20"
                 }`}
            >
              {isAuthLoading ? (
                "解鎖與解密中..."
              ) : (
                <>
                  <Unlock className="w-5 h-5" /> 解鎖行程
                </>
              )}
            </button>
            {authError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium animate-shake">
                {authError}
              </div>
            )}
          </form>

          {/* Encryption Tool Toggle */}
          <div className="mt-8 pt-6 border-t border-dashed border-slate-200/20">
            <button
              onClick={() => setShowEncryptTool(!showEncryptTool)}
              className={`w-full text-xs flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity ${theme.textSec}`}
            >
              <Key className="w-3 h-3" />{" "}
              {showEncryptTool
                ? "隱藏加密工具"
                : "設定/加密 API Key (首次使用請點此)"}
            </button>

            {showEncryptTool && (
              <div
                className={`mt-4 p-4 rounded-xl border space-y-3 text-sm ${isDarkMode ? "bg-black/30 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
              >
                <p className={`text-xs font-bold mb-2 ${theme.text}`}>
                  1. 輸入真實 API Key 與自訂密碼：
                </p>
                <input
                  type="text"
                  placeholder="Google Gemini API Key (AIza...)"
                  value={toolKey}
                  onChange={(e) => setToolKey(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-slate-300"}`}
                />
                <input
                  type="text"
                  placeholder="設定您的通關密碼"
                  value={toolPwd}
                  onChange={(e) => setToolPwd(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-slate-300"}`}
                />
                <button
                  onClick={generateEncryptedString}
                  className={`w-full py-2 rounded-lg text-xs font-bold text-white ${isDarkMode ? "bg-sky-600" : "bg-indigo-500"}`}
                >
                  2. 生成加密字串
                </button>

                {toolResult && (
                  <div className="mt-2">
                    <p className={`text-xs font-bold mb-1 ${theme.text}`}>
                      3. 請複製下方字串到程式碼的 payload 變數：
                    </p>
                    <div
                      className={`p-2 rounded border break-all font-mono text-[10px] select-all cursor-text ${isDarkMode ? "bg-neutral-900 border-neutral-700 text-green-400" : "bg-white border-slate-300 text-slate-600"}`}
                    >
                      {toolResult}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🆕 新增：初始化載入畫面 (Splash Screen)
  // 當已解鎖 (isVerified=true) 但定位還沒跑完 (!isAppReady) 時顯示
  if (!isAppReady) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-[#1A1A1A] text-neutral-200" : "bg-[#F0F2F5] text-slate-700"}`}
      >
        {/* 背景裝飾 (與主畫面一致) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div
            className={`absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob opacity-20 ${theme.blob1}`}
          ></div>
          <div
            className={`absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob animation-delay-4000 opacity-20 ${theme.blob3}`}
          ></div>
        </div>

        {/* 載入中內容 */}
        <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
          <div
            className={`p-4 rounded-full shadow-xl ${isDarkMode ? "bg-neutral-800" : "bg-white"}`}
          >
            {/* 這裡可以換成您喜歡的 Icon，例如飛機 Plane 或地圖 MapPin */}
            <LocateFixed
              className={`w-8 h-8 animate-spin ${isDarkMode ? "text-sky-400" : "text-[#5D737E]"}`}
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-widest mb-2">
              準備旅程中...
            </h2>
            <p className={`text-xs font-medium ${theme.textSec}`}>
              正在確認您的位置與天氣資訊
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App Render (Authenticated) ---
  return (
    <div
      style={containerStyle}
      className={`min-h-screen font-sans pb-24 overflow-x-hidden transition-colors duration-500 ease-in-out ${theme.bg} ${theme.text}`}
    >
      {/* Decorative Blobs - Subtle & Natural */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl animate-blob transition-colors duration-700 ${theme.blob1}`}
        ></div>
        <div
          className={`absolute top-[20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-3xl animate-blob animation-delay-2000 transition-colors duration-700 ${theme.blob2}`}
        ></div>
        <div
          className={`absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full blur-3xl animate-blob animation-delay-4000 transition-colors duration-700 ${theme.blob3}`}
        ></div>
      </div>

      <div className="max-w-md mx-auto relative min-h-screen flex flex-col z-10">
        {/* 🆕 全螢幕按鈕 (透明度優化版) */}
        {isMobile && (
          <button
            onClick={toggleFullScreen}
            // 修改重點：
            // 1. opacity-50: 平時半透明
            // 2. hover:opacity-100: 碰到時變清楚
            // 3. bg-xxx/30: 背景色改為 30% 濃度，大幅降低遮蔽感
            className={`fixed top-5 left-4 z-50 p-2 rounded-full shadow-sm border backdrop-blur-md transition-all active:scale-90 opacity-50 hover:opacity-100
              ${
                isDarkMode
                  ? "bg-neutral-800/30 border-neutral-700/50 text-neutral-300"
                  : "bg-white/30 border-stone-200/50 text-stone-500"
              }`}
            style={{ marginTop: "0px" }}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Header Title with Material Glass */}
        <div className="flex justify-between items-center px-4 pt-5 pb-2 relative z-20">
          <div
            className={`px-4 py-2 rounded-2xl backdrop-blur-md shadow-sm border transition-all duration-300 ${theme.cardBg} ${theme.cardBorder}`}
          >
            <h1
              className={`text-lg font-bold tracking-wide transition-colors ${theme.text}`}
            >
              {tripConfig.title}
            </h1>
            <p
              className={`text-xs mt-0.5 font-medium tracking-widest ${theme.textSec}`}
            >
              {tripConfig.subTitle}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Lock Button */}
            <button
              onClick={() => {
                setIsVerified(false);
                localStorage.removeItem("trip_password");
              }}
              className={`p-2 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 active:scale-90 ${theme.cardBg} ${theme.cardBorder} ${theme.accent}`}
              title="鎖定行程"
            >
              <Lock className="w-5 h-5 fill-current" />
            </button>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 active:scale-90 ${theme.cardBg} ${theme.cardBorder} ${theme.accent}`}
            >
              {isDarkMode ? (
                <Moon className="w-5 h-5 fill-current" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500 fill-current" />
              )}
            </button>
          </div>
        </div>

        {/* --- Tab Content --- */}

        {/* 1. 行程分頁 (Itinerary Tab) */}
        {activeTab === "itinerary" && (
          <div className="flex-1 space-y-4 px-4 pb-4 animate-fadeIn">
            {/* Navigation Buttons */}
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide py-1 px-1">
              {/* Overview Button */}
              <button
                onClick={() => setActiveDay(-1)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 border backdrop-blur-sm flex items-center gap-1.5 shadow-sm
                  ${
                    activeDay === -1
                      ? `${theme.accentBg} ${theme.accent} ${isDarkMode ? "border-neutral-600" : "border-stone-300"} scale-105 shadow-md`
                      : `${theme.cardBg} ${theme.textSec} border-transparent hover:bg-black/5`
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" /> 總覽
              </button>

              {itineraryData.map((data, index) => (
                <button
                  key={index}
                  onClick={() => setActiveDay(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 border backdrop-blur-sm shadow-sm
                    ${
                      activeDay === index
                        ? `${theme.accentBg} ${theme.text} ${isDarkMode ? "border-neutral-600" : "border-stone-300"} scale-105 shadow-md`
                        : `${theme.cardBg} ${theme.textSec} border-transparent hover:bg-black/5`
                    }`}
                >
                  {data.day}
                </button>
              ))}
            </div>

            {/* OVERVIEW CONTENT (ActiveDay === -1) */}
            {activeDay === -1 && (
              <div className="space-y-4">
                {/* 1. User Location Weather Card (Compact Layout) */}
                <div
                  className={`backdrop-blur-xl border rounded-3xl p-5 ${theme.cardShadow} flex items-center justify-between relative overflow-hidden transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                >
                  {/* Left: Location & Temp */}
                  <div className="relative z-10 flex flex-col justify-center">
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSec}`}
                    >
                      <LocateFixed className={`w-4 h-4 ${theme.accent}`} />{" "}
                      {userWeather.locationName}
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2.5 rounded-2xl shadow-inner ${isDarkMode ? "bg-black/30" : "bg-white/60"}`}
                      >
                        {userWeather.loading ? (
                          <Loader
                            className={`w-7 h-7 animate-spin ${theme.textSec}`}
                          />
                        ) : // 這裡改為：如果有代碼，就現場產生圖示；否則顯示載入中或預設圖示
                        userWeather.weatherCode !== null ? (
                          getWeatherInfo(userWeather.weatherCode).icon
                        ) : (
                          <Loader
                            className={`w-7 h-7 animate-spin ${theme.textSec}`}
                          />
                        )}
                      </div>
                      <div>
                        {userWeather.temp !== null ? (
                          <div className={`text-3xl font-bold ${theme.text}`}>
                            {userWeather.temp}
                            <span className={`text-sm ml-1 ${theme.textSec}`}>
                              °C
                            </span>
                          </div>
                        ) : (
                          <div className={`text-xs ${theme.textSec}`}>--</div>
                        )}
                        <div className={`text-xs mt-0.5 ${theme.textSec}`}>
                          {userWeather.desc || "載入中"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Advice & Update Button */}
                  <div className="relative z-10 text-right max-w-[50%] flex flex-col items-end">
                    <button
                      onClick={getUserLocationWeather}
                      className={`mb-2 text-xs px-3 py-1.5 rounded-full border transition-all shadow-sm flex items-center gap-1.5 active:scale-95 ${theme.accent} ${isDarkMode ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700" : "bg-white border-stone-200 hover:bg-stone-50"}`}
                    >
                      更新位置 <Share2 className="w-3 h-3" />
                    </button>
                    <p
                      className={`text-xs leading-relaxed font-medium ${theme.textSec}`}
                    >
                      {userWeather.error
                        ? "無法獲取天氣"
                        : "比較目前與當地的溫差，方便準備衣物。"}
                    </p>
                  </div>
                </div>

                {/* 2. Flight & Emergency Info */}
                <div
                  className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                >
                  {/* Header：點擊可切換收折狀態 */}
                  <div
                    onClick={() =>
                      setIsFlightInfoExpanded(!isFlightInfoExpanded)
                    }
                    className={`flex items-center justify-between cursor-pointer group ${isFlightInfoExpanded ? "mb-4 border-b pb-2" : ""} ${isDarkMode ? "border-neutral-700/50" : "border-stone-200/50"}`}
                  >
                    <h3
                      className={`text-sm font-bold flex items-center gap-2 ${theme.text}`}
                    >
                      <Plane className={`w-4 h-4 ${theme.accent}`} />{" "}
                      航班與緊急資訊
                    </h3>
                    <div
                      className={`p-1 rounded-full transition-colors ${isDarkMode ? "group-hover:bg-neutral-700" : "group-hover:bg-stone-100"}`}
                    >
                      {isFlightInfoExpanded ? (
                        <ChevronUp className={`w-4 h-4 ${theme.textSec}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${theme.textSec}`} />
                      )}
                    </div>
                  </div>

                  {/* Content：只在展開時顯示 */}
                  {isFlightInfoExpanded && (
                    <div className="animate-fadeIn">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Flight Info */}
                        <div
                          className={`rounded-xl p-3 border flex flex-col gap-2 transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                        >
                          <div className={`text-xs font-bold ${theme.textSec}`}>
                            去程 ({tripConfig.flights.outbound.code})
                          </div>
                          <div
                            className={`text-sm font-bold tracking-wide ${theme.text}`}
                          >
                            {tripConfig.flights.outbound.time}
                          </div>
                          <div
                            className={`w-full h-px my-0.5 ${isDarkMode ? "bg-neutral-700" : "bg-stone-200"}`}
                          ></div>
                          <div className={`text-xs font-bold ${theme.textSec}`}>
                            回程 ({tripConfig.flights.inbound.code})
                          </div>
                          <div
                            className={`text-sm font-bold tracking-wide ${theme.text}`}
                          >
                            {tripConfig.flights.inbound.time}
                          </div>
                        </div>

                        {/* Hotel Info (包含地址複製功能) */}
                        <div
                          className={`rounded-xl p-3 border flex flex-col justify-center gap-2 transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                        >
                          {tripConfig.hotels.map((hotel, index) => (
                            <React.Fragment key={index}>
                              <div className="flex flex-col gap-1">
                                <div
                                  className={`text-xs font-bold ${theme.textSec}`}
                                >
                                  {hotel.name}
                                </div>
                                <div
                                  className={`text-xs font-bold flex items-center gap-1.5 ${theme.text}`}
                                >
                                  <Phone className="w-3 h-3" />
                                  <a href={`tel:${hotel.phone}`}>
                                    {hotel.phone}
                                  </a>
                                </div>
                                <button
                                  onClick={() => handleCopy(hotel.address)}
                                  className={`text-[10px] flex items-start gap-1.5`}
                                  title="點擊複製地址"
                                >
                                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  <span className="underline decoration-dotted underline-offset-2">
                                    {hotel.address}
                                  </span>
                                  <span className="text-[9px] px-1 border rounded ml-1 opacity-60">
                                    複製
                                  </span>
                                </button>
                              </div>
                              {/* 如果不是最後一個，就加分隔線 */}
                              {index < tripConfig.hotels.length - 1 && (
                                <div
                                  className={`w-full h-px my-0.5 ${isDarkMode ? "bg-neutral-700" : "bg-stone-200"}`}
                                ></div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div
                        className={`rounded-xl p-3 border flex items-start gap-2.5 ${isDarkMode ? "bg-red-900/10 border-red-900/20" : "bg-red-50/40 border-red-100"}`}
                      >
                        <AlertCircle
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.red}`}
                        />
                        <div
                          className={`text-xs leading-relaxed ${isDarkMode ? "text-red-200/80" : "text-red-800/80"}`}
                        >
                          <span className="font-bold block mb-0.5">
                            緊急聯絡：
                          </span>
                          報警 110 | 救護車 119 <br />
                          旅外國人急難救助：+81-3-3280-7917
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Trip Status & Checklist */}
                {/* STATUS: BEFORE TRIP */}
                {tripStatus === "before" && (
                  <div
                    className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                  >
                    <div className="text-center mb-5">
                      <div
                        className={`text-xs font-medium mb-1 ${theme.textSec}`}
                      >
                        距離{tripConfig.title}還有
                      </div>
                      <div
                        className={`text-5xl font-black tracking-tight drop-shadow-sm flex justify-center items-baseline gap-2 ${theme.accent}`}
                      >
                        {daysUntilTrip}{" "}
                        <span className={`text-lg font-bold ${theme.textSec}`}>
                          天
                        </span>
                      </div>
                    </div>

                    <div
                      className={`rounded-2xl p-4 border transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                    >
                      <h3
                        className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}
                      >
                        <ListTodo className={`w-4 h-4 ${colors.pink}`} />{" "}
                        出發前檢查清單
                      </h3>
                      {/* 🆕 重置按鈕 */}
                      <button
                        onClick={handleResetChecklist}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100 ${isDarkMode ? "text-neutral-400 hover:bg-neutral-700 hover:text-white" : "text-stone-400 hover:bg-stone-200 hover:text-stone-600"}`}
                        title="還原預設值"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> 重置
                      </button>
                      {/* 🆕 新增：輸入框區域 */}
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder="新增檢查項目..."
                          className={`flex-1 px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-all ${isDarkMode ? "bg-neutral-900 border-neutral-600 focus:border-sky-500 focus:ring-sky-500/20" : "bg-white border-stone-200 focus:border-[#5D737E] focus:ring-[#5D737E]/20"}`}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleAddItem()
                          }
                        />
                        <button
                          onClick={handleAddItem}
                          disabled={!newItemText.trim()}
                          className={`p-2 rounded-xl border transition-all ${!newItemText.trim() ? "opacity-50 cursor-not-allowed" : "active:scale-95"} ${isDarkMode ? "bg-neutral-700 border-neutral-600 text-sky-300" : "bg-white border-stone-200 text-[#5D737E]"}`}
                        >
                          <Plus className="w-5 h-5" />{" "}
                          {/* 記得在上方 import Plus icon */}
                        </button>
                      </div>

                      <div className="space-y-1">
                        {checklist.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all group/item
                              ${
                                item.checked
                                  ? isDarkMode
                                    ? "bg-green-900/10"
                                    : "bg-green-50/50"
                                  : isDarkMode
                                    ? "hover:bg-neutral-700/30"
                                    : "hover:bg-black/5"
                              }`}
                          >
                            {/* 點擊文字或 Checkbox 觸發切換 */}
                            <div
                              onClick={() => toggleCheckItem(item.id)}
                              className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                            >
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all duration-300 flex-shrink-0
                                ${
                                  item.checked
                                    ? "bg-emerald-500 border-emerald-500 text-white scale-110"
                                    : `bg-transparent ${isDarkMode ? "border-neutral-500" : "border-stone-400"} group-hover/item:border-emerald-500`
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </div>
                              <span
                                className={`text-sm font-medium transition-colors leading-normal tracking-wide
                                ${
                                  item.checked
                                    ? "text-emerald-600/70 line-through decoration-emerald-600/30"
                                    : theme.textSec
                                }`}
                              >
                                {item.text}
                              </span>
                            </div>

                            {/* 🆕 刪除按鈕 (只在該項目未完成或是 hover 時顯示，或是一直顯示但淡化) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              className={`p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity ${isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-400 hover:bg-red-50"}`}
                              title="刪除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />{" "}
                              {/* 記得在上方 import Trash2 icon */}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STATUS: DURING TRIP */}
                {tripStatus === "during" && currentTripDayIndex >= 0 && (
                  <div
                    className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                  >
                    <div
                      className={`flex items-center justify-between mb-4 border-b pb-3 ${isDarkMode ? "border-neutral-700/50" : "border-stone-200/50"}`}
                    >
                      <div>
                        <div
                          className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-1 ${theme.accent} ${theme.accentBg}`}
                        >
                          旅途中
                        </div>
                        <h2 className={`text-2xl font-bold ${theme.text}`}>
                          今天是 Day {currentTripDayIndex + 1}
                        </h2>
                      </div>
                      <div
                        className={`p-2.5 rounded-full animate-pulse ${theme.accentBg}`}
                      >
                        <Plane className={`w-6 h-6 ${theme.accent}`} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div
                        className={`bg-gradient-to-r from-[#5D737E] to-[#3F5561] text-white p-4 rounded-2xl shadow-lg relative overflow-hidden`}
                      >
                        <div className="relative z-10">
                          <h3 className="text-lg font-bold mb-1">
                            {itineraryData[currentTripDayIndex].title}
                          </h3>
                          <div className="text-stone-200 text-xs flex items-center gap-1.5">
                            <Hotel className="w-3.5 h-3.5" />
                            {itineraryData[currentTripDayIndex].stay}
                          </div>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10">
                          <MapPin className="w-20 h-20 text-white" />
                        </div>
                      </div>

                      <div
                        className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                      >
                        <h4
                          className={`text-xs font-bold mb-3 flex items-center gap-1.5 ${theme.textSec}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${colors.orange}`} />{" "}
                          今日亮點快速導覽
                        </h4>
                        <div className="space-y-3">
                          {itineraryData[currentTripDayIndex].events
                            .filter((e) => e.highlights)
                            .slice(0, 3)
                            .map((e, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <div
                                  className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 ${isDarkMode ? "bg-neutral-700 text-neutral-300" : "bg-stone-200 text-stone-600"}`}
                                >
                                  {e.time}
                                </div>
                                <div>
                                  <div
                                    className={`text-sm font-bold ${theme.text}`}
                                  >
                                    {e.title}
                                  </div>
                                  <div
                                    className={`text-xs mt-0.5 leading-relaxed ${theme.textSec}`}
                                  >
                                    {e.desc}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        <button
                          onClick={() => setActiveDay(currentTripDayIndex)}
                          className={`w-full mt-4 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${isDarkMode ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-200" : "bg-stone-200 hover:bg-stone-300 text-stone-600"}`}
                        >
                          查看今日完整行程{" "}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STATUS: AFTER TRIP */}
                {tripStatus === "after" && (
                  <div
                    className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                  >
                    <div className="text-center mb-5">
                      <div className="p-3.5 bg-amber-100/30 rounded-full w-14 h-14 mx-auto flex items-center justify-center mb-3 border border-amber-200/50">
                        <History className="w-7 h-7 text-amber-500" />
                      </div>
                      <h2 className={`text-xl font-bold ${theme.text}`}>
                        旅程圓滿結束！
                      </h2>
                      <p className={`text-sm mt-1 ${theme.textSec}`}>
                        感謝您這{itineraryData.length}
                        天的陪伴，希望留下美好的回憶。
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-4 border transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                    >
                      <h3
                        className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.textSec}`}
                      >
                        <MapPin className={`w-4 h-4 ${colors.pink}`} /> 足跡回顧
                      </h3>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {/* 讀取 tripConfig.tripHighlights，若沒設定則顯示空陣列以免報錯 */}
                          {(tripConfig.tripHighlights || []).map((spot, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border shadow-sm ${isDarkMode ? "bg-neutral-700 border-neutral-600 text-neutral-300" : "bg-white border-stone-200 text-stone-600"}`}
                            >
                              {spot}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MAIN ITINERARY CONTENT (ActiveDay >= 0) */}
            {activeDay >= 0 && current && (
              <>
                {/* Weather Card */}
                <div
                  className={`backdrop-blur-xl border rounded-3xl p-5 ${theme.cardShadow} flex items-center justify-between relative overflow-hidden transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                >
                  <div className="relative z-10">
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 uppercase tracking-wide ${theme.textSec}`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> 預報 (
                      {tripConfig.locations.find(
                        (l) => l.key === currentLocation,
                      )?.name || "當地"}
                      )
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2.5 rounded-full shadow-inner ${isDarkMode ? "bg-black/30" : "bg-white/40"}`}
                      >
                        {displayWeather.icon}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-2xl font-bold ${theme.text}`}>
                            {displayWeather.temp.split("/")[0]}
                          </span>
                          <span className={`text-sm ${theme.textSec}`}>/</span>
                          <span className={`text-2xl font-bold ${theme.text}`}>
                            {displayWeather.temp.split("/")[1]}
                          </span>
                        </div>
                        <div
                          className={`text-sm font-medium mt-0.5 ${theme.textSec}`}
                        >
                          {displayWeather.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 text-right max-w-[50%] flex flex-col items-end">
                    <div
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold mb-1.5 border shadow-sm backdrop-blur-md ${isDarkMode ? "bg-sky-900/30 text-sky-200 border-sky-800/50" : "bg-[#E0F7FA]/80 text-[#006064] border-[#B2EBF2]"}`}
                    >
                      💡 穿搭建議
                    </div>
                    <p
                      className={`text-xs leading-relaxed font-medium ${theme.textSec}`}
                    >
                      {displayWeather.advice}
                    </p>
                  </div>
                </div>

                {/* Main Itinerary Content */}
                <div
                  className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] relative transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                >
                  {/* Day Header (修改後：住宿地點增加導航連結) */}
                  <div
                    className={`mb-5 border-b pb-4 ${isDarkMode ? "border-neutral-700/50" : "border-stone-200/50"}`}
                  >
                    <div
                      className={`text-xs font-semibold mb-1.5 flex items-center gap-2 ${theme.textSec}`}
                    >
                      <span
                        className={`px-2.5 py-0.5 rounded-md ${isDarkMode ? "bg-neutral-800" : "bg-white/50"}`}
                      >
                        {current.date}
                      </span>
                    </div>
                    <h2
                      className={`text-2xl font-extrabold mb-3 leading-tight drop-shadow-sm ${theme.text}`}
                    >
                      {current.title}
                    </h2>

                    {/* Hotel Link Block */}
                    <div
                      className={`flex items-start gap-2 text-xs p-3 rounded-xl border transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700 text-neutral-300" : "bg-blue-50/30 border-blue-100/50 text-stone-600"}`}
                    >
                      <Hotel
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme.accent}`}
                      />

                      {current.stay.includes("溫暖的家") ? (
                        <span className="font-medium leading-relaxed tracking-wide">
                          {current.stay}
                        </span>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(current.stay.split("(")[0])}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-medium leading-relaxed tracking-wide hover:underline underline-offset-4 decoration-2 flex items-center gap-1 ${isDarkMode ? "decoration-sky-400 hover:text-sky-300" : "decoration-[#5D737E] hover:text-[#3B5998]"}`}
                          title="在 Google Maps 開啟導航"
                        >
                          {current.stay}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Timeline Events */}
                  <div className="space-y-3.5">
                    {current.events.map((event, idx) => {
                      const isOpen = expandedItems[`${activeDay}-${idx}`];
                      return (
                        <div
                          key={idx}
                          className={`group rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden ${isDarkMode ? "bg-neutral-800/30 border-neutral-700 hover:bg-neutral-800/50" : "bg-white/60 border-white/60 hover:bg-white/80 hover:shadow-md"}`}
                        >
                          {/* Header Row */}
                          <div
                            className="p-4 flex gap-4 cursor-pointer"
                            onClick={() => toggleExpand(activeDay, idx)}
                          >
                            <div className="flex flex-col items-center pt-1">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105
                              ${
                                event.title.includes("交通")
                                  ? isDarkMode
                                    ? "bg-emerald-900/20 text-emerald-400"
                                    : "bg-[#F0F5E5] text-[#556B2F]"
                                  : isDarkMode
                                    ? "bg-sky-900/20 text-sky-400"
                                    : "bg-[#E8F0FE] text-[#3B5998]"
                              }`}
                              >
                                {React.cloneElement(event.icon, {
                                  className: "w-5 h-5",
                                })}
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div
                                    className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full ${isDarkMode ? "bg-neutral-700 text-neutral-300" : "bg-stone-200/50 text-stone-600"}`}
                                  >
                                    <Clock className="w-3 h-3" /> {event.time}
                                  </div>
                                  {/* Title and Map Link */}
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h3
                                      className={`text-base font-bold leading-tight ${theme.text}`}
                                    >
                                      {event.title}
                                    </h3>
                                    <a
                                      href={getMapLink(
                                        event.mapQuery || event.title,
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`p-1.5 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 ${isDarkMode ? "bg-neutral-700 border-neutral-600 text-sky-300 hover:bg-neutral-600" : "bg-white border-stone-200 text-[#3B5998] hover:bg-blue-50"}`}
                                      title="在 Google Maps 查看"
                                    >
                                      <MapPin className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                                {isOpen ? (
                                  <ChevronUp
                                    className={`w-5 h-5 ${theme.textSec}`}
                                  />
                                ) : (
                                  <ChevronDown
                                    className={`w-5 h-5 ${theme.textSec}`}
                                  />
                                )}
                              </div>
                              <p
                                className={`text-sm leading-relaxed ${theme.textSec}`}
                              >
                                {event.desc}
                              </p>

                              {!isOpen && event.transport && (
                                <div
                                  className={`mt-2.5 flex items-center gap-1.5 text-xs w-fit px-2.5 py-1 rounded-lg border ${isDarkMode ? "bg-emerald-900/10 text-emerald-400 border-emerald-800/30" : "bg-[#F0F5E5] text-[#556B2F] border-[#E2E8D5]"}`}
                                >
                                  <Train className="w-3 h-3" />
                                  <span className="font-medium">
                                    {event.transport.mode}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isOpen && (
                            <div
                              className={`px-5 pb-5 pt-1 space-y-3 border-t ${isDarkMode ? "bg-black/20 border-neutral-700" : "bg-white/40 border-stone-200/50"}`}
                            >
                              {event.transport && (
                                <div
                                  className={`mt-2 p-3 rounded-xl border ${isDarkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-[#F0F5E5] border-[#E2E8D5]"}`}
                                >
                                  <h4
                                    className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${isDarkMode ? "text-emerald-400" : "text-[#556B2F]"}`}
                                  >
                                    <Train className="w-3.5 h-3.5" /> 交通詳情
                                  </h4>
                                  <div
                                    className={`space-y-1.5 text-xs leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-stone-600"}`}
                                  >
                                    <div className="flex gap-2">
                                      <span
                                        className={`${theme.textSec} min-w-[30px]`}
                                      >
                                        方式
                                      </span>{" "}
                                      <span className="font-medium">
                                        {event.transport.mode}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span
                                        className={`${theme.textSec} min-w-[30px]`}
                                      >
                                        時間
                                      </span>{" "}
                                      <span>{event.transport.duration}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span
                                        className={`${theme.textSec} min-w-[30px]`}
                                      >
                                        路線
                                      </span>{" "}
                                      <span>{event.transport.route}</span>
                                    </div>
                                    {event.transport.note && (
                                      <p
                                        className={`font-medium mt-1.5 flex gap-1.5 items-start ${isDarkMode ? "text-amber-400" : "text-[#CD853F]"}`}
                                      >
                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
                                        {event.transport.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {event.highlights && (
                                <div>
                                  <h4
                                    className={`text-xs font-bold flex items-center gap-1.5 mb-2 mt-2 ${isDarkMode ? "text-rose-300" : "text-[#BC8F8F]"}`}
                                  >
                                    <Star className="w-3.5 h-3.5" /> 必玩 / 必吃
                                  </h4>
                                  <ul className="space-y-1.5 pl-1">
                                    {event.highlights.map((item, i) => (
                                      <li
                                        key={i}
                                        className={`text-sm flex gap-2 items-start leading-relaxed ${theme.textSec}`}
                                      >
                                        <span
                                          className={`${isDarkMode ? "text-rose-300" : "text-[#BC8F8F]"} mt-1`}
                                        >
                                          •
                                        </span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {event.tips && (
                                <div>
                                  <h4
                                    className={`text-xs font-bold flex items-center gap-1.5 mb-2 mt-2 ${isDarkMode ? "text-amber-300" : "text-[#CD853F]"}`}
                                  >
                                    <Info className="w-3.5 h-3.5" /> 溫馨提醒
                                  </h4>
                                  <ul className="space-y-1.5 pl-1">
                                    {event.tips.map((item, i) => (
                                      <li
                                        key={i}
                                        className={`text-sm flex gap-2 items-start leading-relaxed ${theme.textSec}`}
                                      >
                                        <span
                                          className={`${isDarkMode ? "text-amber-300" : "text-[#CD853F]"} mt-1`}
                                        >
                                          •
                                        </span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Route Map Section */}
                  {current.routeInfo && (
                    <div
                      className={`mt-6 backdrop-blur-md rounded-2xl border p-4 shadow-sm transition-colors ${isDarkMode ? "bg-neutral-800/30 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className={`p-1.5 rounded-lg ${theme.accentBg}`}>
                          <Map className={`w-4 h-4 ${theme.accent}`} />
                        </div>
                        <h3 className={`text-sm font-bold ${theme.text}`}>
                          當日路線導航
                        </h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div
                          className={`text-xs p-3 rounded-xl border leading-relaxed ${isDarkMode ? "bg-black/20 border-neutral-700 text-neutral-300" : "bg-white/50 border-stone-200 text-stone-600"}`}
                        >
                          <span
                            className={`font-bold mr-1.5 block mb-1 ${theme.accent}`}
                          >
                            路線摘要
                          </span>
                          {current.routeInfo.summary}
                        </div>
                        <a
                          href={current.routeInfo.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 ${isDarkMode ? "bg-gradient-to-r from-sky-800 to-blue-900" : "bg-gradient-to-r from-[#5D737E] to-[#3F5561]"}`}
                        >
                          <Navigation className="w-4 h-4" />
                          開啟 Google Maps 查看路線
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 修改後：通用的當日提醒卡片 */}
                  {current.notice && (
                    <div
                      className={`mt-5 rounded-xl p-3.5 text-xs flex gap-2.5 items-start shadow-sm border 
                    ${
                      current.notice.type === "alert"
                        ? isDarkMode
                          ? "bg-rose-900/10 border-rose-800/30 text-rose-200"
                          : "bg-[#FFF0F5] border-rose-100 text-[#BC8F8F]"
                        : isDarkMode
                          ? "bg-blue-900/10 border-blue-800/30 text-blue-200"
                          : "bg-blue-50 border-blue-100 text-slate-600"
                    }`}
                    >
                      <AlertCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${current.notice.type === "alert" ? colors.pink : colors.blue}`}
                      />
                      <span className="leading-relaxed font-medium tracking-wide">
                        {current.notice.text}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ... (Guides, Shops, Resources Tab - content same as before but wrapped in if (!isVerified) else) ... */}
        {/* 為了節省長度，這裡隱含了 Guides, Shops, Resources 的渲染邏輯，它們會在 isVerified 為 true 時正常顯示 */}

        {/* 2. 參考指南 (Guides Tab) */}
        {activeTab === "guides" && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
            >
              <h2
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
              >
                <div
                  className={`p-1.5 rounded-xl ${isDarkMode ? "bg-purple-900/20" : "bg-[#E6E6FA]/50"}`}
                >
                  <BookOpen
                    className={`w-4 h-4 ${isDarkMode ? "text-purple-300" : "text-[#9370DB]"}`}
                  />
                </div>
                實用參考指南
              </h2>
              <div className="space-y-3">
                {guidesData.map((guide, idx) => {
                  const isGuideOpen = expandedGuides[idx];
                  return (
                    <div
                      key={idx}
                      className={`backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/70 border-white/60"}`}
                    >
                      {/* Guide Header - Clickable */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() => toggleGuide(idx)}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-stone-100"}`}
                        >
                          {guide.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-sm font-bold break-words ${theme.text}`}
                          >
                            {guide.title}
                          </h3>
                          {!isGuideOpen && (
                            <p
                              className={`text-xs mt-0.5 leading-relaxed truncate ${theme.textSec}`}
                            >
                              {guide.summary}
                            </p>
                          )}
                        </div>
                        {isGuideOpen ? (
                          <ChevronUp
                            className={`w-4 h-4 flex-shrink-0 ${theme.textSec}`}
                          />
                        ) : (
                          <ChevronDown
                            className={`w-4 h-4 flex-shrink-0 ${theme.textSec}`}
                          />
                        )}
                      </div>

                      {/* Collapsible Content */}
                      {isGuideOpen && (
                        <div className="px-5 pb-5 animate-fadeIn">
                          <p
                            className={`text-sm mb-4 leading-relaxed ${theme.textSec}`}
                          >
                            {guide.summary}
                          </p>
                          <div
                            className={`rounded-xl p-3.5 my-3 border ${isDarkMode ? "bg-black/20 border-neutral-700" : "bg-[#F9F9F6] border-stone-200"}`}
                          >
                            <h4
                              className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                            >
                              <FileText className="w-3.5 h-3.5" /> 操作重點
                            </h4>
                            <ol
                              className={`list-decimal list-inside text-sm space-y-2 pl-1 ${theme.textSec} ${isDarkMode ? "marker:text-sky-300" : "marker:text-[#5D737E]"} marker:font-bold`}
                            >
                              {guide.steps.map((step, i) => (
                                <li key={i} className="leading-relaxed pl-1">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="space-y-3">
                            <a
                              href={guide.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block w-full text-center text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${isDarkMode ? "bg-sky-900/20 text-sky-300 hover:bg-sky-900/30" : "bg-[#E8F0FE] text-[#3B5998] hover:bg-[#D0E0FC]"}`}
                            >
                              {guide.link.text}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            {guide.blogs && guide.blogs.length > 0 && (
                              <div
                                className={`mt-3 border-t pt-3 ${isDarkMode ? "border-neutral-700" : "border-stone-200"}`}
                              >
                                <h4
                                  className={`text-[11px] font-bold mb-2 uppercase tracking-wide ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                                >
                                  相關圖文教學
                                </h4>
                                <div className="space-y-1.5">
                                  {guide.blogs.map((blog, bIdx) => (
                                    <a
                                      key={bIdx}
                                      href={blog.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 text-xs transition-colors p-1.5 rounded-lg ${isDarkMode ? "text-neutral-400 hover:text-sky-300 hover:bg-neutral-700/50" : "text-stone-500 hover:text-[#3B5998] hover:bg-stone-100"}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-neutral-600" : "bg-stone-300"}`}
                                      ></span>
                                      <span className="truncate underline decoration-stone-300 underline-offset-4 decoration-1">
                                        {blog.title}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. 商家導覽 (Shops Tab) */}
        {activeTab === "shops" && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
            >
              <h2
                className={`text-lg font-bold mb-1.5 flex items-center gap-2 ${theme.text}`}
              >
                <div
                  className={`p-1.5 rounded-xl ${isDarkMode ? "bg-orange-900/20" : "bg-[#FFF8E1]/60"}`}
                >
                  <Store
                    className={`w-4 h-4 ${isDarkMode ? "text-amber-300" : "text-[#CD853F]"}`}
                  />
                </div>
                商家與周邊指南
              </h2>
              <p
                className={`text-xs mb-4 ml-1 flex items-center gap-1.5 ${theme.textSec}`}
              >
                <Info className="w-3 h-3" /> 點擊商家名稱即可開啟 Google Maps
              </p>

              <div className="space-y-3">
                {shopGuideData.map((areaData, idx) => {
                  const isShopOpen = expandedShops[idx];
                  return (
                    <div
                      key={idx}
                      className={`backdrop-blur-sm border rounded-2xl shadow-sm transition-colors duration-300 ${isDarkMode ? "bg-neutral-800/30 border-neutral-700" : "bg-white/60 border-stone-200"}`}
                    >
                      {/* Shop Header - Clickable */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => toggleShop(idx)}
                      >
                        <div>
                          <h3 className={`text-base font-bold ${theme.accent}`}>
                            {areaData.area}
                          </h3>
                          {!isShopOpen && (
                            <p
                              className={`text-xs mt-0.5 truncate ${theme.textSec}`}
                            >
                              {areaData.desc}
                            </p>
                          )}
                        </div>
                        {isShopOpen ? (
                          <ChevronUp className={`w-4 h-4 ${theme.textSec}`} />
                        ) : (
                          <ChevronDown className={`w-4 h-4 ${theme.textSec}`} />
                        )}
                      </div>

                      {/* Collapsible Content */}
                      {isShopOpen && (
                        <div className="px-5 pb-5 animate-fadeIn">
                          <p className={`text-sm mb-4 ${theme.textSec}`}>
                            {areaData.desc}
                          </p>

                          {/* 重點商家 */}
                          <div className="mb-5">
                            <h4
                              className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${colors.orange}`}
                              />{" "}
                              行程重點商家
                            </h4>
                            <div className="grid grid-cols-1 gap-2.5">
                              {areaData.mainShops.map((shop, i) => (
                                <div
                                  key={i}
                                  className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${isDarkMode ? "bg-amber-900/10 border-amber-800/30 hover:bg-amber-900/20" : "bg-[#FFF8E1]/50 border-amber-100 hover:bg-[#FFF8E1]"}`}
                                >
                                  <a
                                    href={getMapLink(
                                      `${shop.name} ${areaData.mapQuerySuffix}`,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 group flex-1"
                                  >
                                    <MapPin
                                      className={`w-4 h-4 ${isDarkMode ? "text-amber-500" : "text-[#CD853F]"} group-hover:scale-125 transition-transform`}
                                    />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-sm font-bold transition-colors ${isDarkMode ? "text-neutral-200 group-hover:text-amber-300" : "text-[#37474F] group-hover:text-[#CD853F]"}`}
                                        >
                                          {shop.name}
                                        </span>
                                        <span
                                          className={`text-[11px] px-1.5 py-0.5 rounded-md border shadow-sm ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-white text-stone-500 border-stone-200"}`}
                                        >
                                          {shop.tag}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-xs mt-0.5 ${theme.textSec}`}
                                      >
                                        {shop.note}
                                      </span>
                                    </div>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 童裝與文具 */}
                          {areaData.specialShops && (
                            <div className="mb-5">
                              <h4
                                className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                              >
                                <Scissors
                                  className={`w-3.5 h-3.5 ${colors.pink}`}
                                />{" "}
                                童裝與文具推薦
                              </h4>
                              <div className="grid grid-cols-1 gap-2.5">
                                {areaData.specialShops.map((shop, i) => (
                                  <div
                                    key={i}
                                    className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${isDarkMode ? "bg-rose-900/10 border-rose-800/30 hover:bg-rose-900/20" : "bg-[#FFF0F5]/60 border-rose-100 hover:bg-[#FFF0F5]"}`}
                                  >
                                    <a
                                      href={getMapLink(
                                        `${shop.name} ${areaData.mapQuerySuffix}`,
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 group flex-1"
                                    >
                                      <MapPin
                                        className={`w-4 h-4 ${isDarkMode ? "text-rose-400" : "text-[#BC8F8F]"} group-hover:scale-125 transition-transform`}
                                      />
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-sm font-bold transition-colors ${isDarkMode ? "text-neutral-200 group-hover:text-rose-300" : "text-[#37474F] group-hover:text-[#BC8F8F]"}`}
                                          >
                                            {shop.name}
                                          </span>
                                          <span
                                            className={`text-[11px] px-1.5 py-0.5 rounded-md border shadow-sm ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-white text-stone-500 border-stone-200"}`}
                                          >
                                            {shop.tag}
                                          </span>
                                        </div>
                                        <span
                                          className={`text-xs mt-0.5 ${theme.textSec}`}
                                        >
                                          {shop.note}
                                        </span>
                                      </div>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 周邊連鎖 */}
                          <div>
                            <h4
                              className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                            >
                              <Coffee className="w-3.5 h-3.5 text-stone-400" />{" "}
                              附近常見連鎖 (1km內)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {areaData.nearbyChains.map((chain, i) => (
                                <a
                                  key={i}
                                  href={getMapLink(
                                    `${chain.name} ${areaData.mapQuerySuffix}`,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm transition-all ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-sky-300 hover:border-sky-800" : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-[#5D737E] hover:border-[#5D737E]/30"}`}
                                >
                                  <span className="font-bold">
                                    {chain.name}
                                  </span>
                                  <span
                                    className={`text-[10px] border-l pl-2 ${isDarkMode ? "border-neutral-600 text-neutral-500" : "text-stone-400 border-stone-200"}`}
                                  >
                                    {chain.location}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. AI 導遊 (AI Tab) */}
        {activeTab === "ai" && (
          <div className="flex-1 px-4 pb-4 space-y-4 flex flex-col h-[calc(100vh-130px)] animate-fadeIn">
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] shadow-xl flex-1 flex flex-col overflow-hidden max-w-full transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
            >
              {/* Chat Header (修改：加入導遊/翻譯模式切換) */}
              <div
                className={`p-4 border-b backdrop-blur-sm flex flex-col gap-3 ${isDarkMode ? "bg-neutral-800/60 border-neutral-700" : "bg-white/60 border-stone-200/50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-base font-bold ${theme.text}`}>
                        AI 專屬導遊
                      </h2>
                      <p
                        className={`text-xs flex items-center gap-1.5 ${theme.textSec}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-pulse ${aiMode === "translate" ? "bg-blue-500" : "bg-emerald-500"}`}
                        ></span>
                        {aiMode === "translate" ? "口譯模式" : "導遊模式"}
                        {isSpeaking && (
                          <span className="ml-2 text-amber-600 font-bold flex items-center bg-amber-50 px-2 py-0.5 rounded-full">
                            <Volume2 className="w-3 h-3 mr-1" /> 朗讀中...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 🆕 模式切換開關 (使用 handleSwitchMode) */}
                  <div
                    className={`flex p-1 rounded-lg border ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-stone-100 border-stone-200"}`}
                  >
                    <button
                      onClick={() => handleSwitchMode("guide")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${aiMode === "guide" ? (isDarkMode ? "bg-neutral-700 text-white shadow-sm" : "bg-white text-stone-800 shadow-sm") : isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                    >
                      導遊
                    </button>
                    <button
                      onClick={() => handleSwitchMode("translate")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${aiMode === "translate" ? (isDarkMode ? "bg-sky-700 text-white shadow-sm" : "bg-white text-sky-600 shadow-sm") : isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                    >
                      口譯
                    </button>
                  </div>
                </div>

                {/* 停止朗讀按鈕 (移到這裡比較整齊) */}
                {isSpeaking && (
                  <button
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }}
                    className="w-full py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100 flex items-center justify-center gap-2 text-xs font-bold"
                  >
                    <StopCircle className="w-4 h-4" /> 停止朗讀
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div
                className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 ${isDarkMode ? "bg-black/20" : "bg-[#F9F9F6]/50"}`}
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

                      {/* Speak Button - Moved here */}
                      {msg.role === "model" && (
                        <button
                          onClick={() => handleSpeak(msg.text)}
                          className={`p-1 rounded-full transition-all ${isDarkMode ? "text-sky-300 hover:bg-neutral-700" : "text-[#5D737E] hover:bg-stone-200"}`}
                          title="朗讀訊息"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                        {/* {msg.text} */}
                        {renderMessage(msg.text)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-stone-200"}`}
                    >
                      <Bot
                        className={`w-5 h-5 ${isDarkMode ? "text-sky-300" : "text-[#5D737E]"}`}
                      />
                    </div>
                    <div
                      className={`p-3 rounded-2xl rounded-tl-none border shadow-sm flex items-center gap-2 ${isDarkMode ? "bg-neutral-800/60 border-neutral-700" : "bg-white/80 border-stone-200"}`}
                    >
                      <Loader
                        className={`w-4 h-4 animate-spin ${isDarkMode ? "text-sky-300" : "text-[#5D737E]"}`}
                      />
                      <span className={`text-xs ${theme.textSec}`}>
                        正在思考中...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions */}
              <div
                className={`px-4 py-3 border-t flex gap-2.5 overflow-x-auto scrollbar-hide backdrop-blur-sm ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/60 border-stone-200/50"}`}
              >
                {/* 根據 aiMode 切換顯示的問題列表 */}
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
                    className={`flex-shrink-0 text-xs px-3 py-2 rounded-full border shadow-sm transition-all ${isDarkMode ? "bg-neutral-700/60 hover:bg-neutral-600 text-neutral-300 hover:text-sky-200 border-neutral-600" : "bg-white/80 hover:bg-[#F0F5E5] text-stone-600 hover:text-[#556B2F] border-stone-200"}`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div
                className={`p-3 border-t backdrop-blur-md ${isDarkMode ? "bg-neutral-800/60 border-neutral-700" : "bg-white/80 border-stone-200/50"}`}
              >
                <div className="flex gap-3">
                  {/* 1. 中文按鈕 (永遠顯示) */}
                  <button
                    onClick={() => toggleListening("zh-TW")}
                    className={`p-2.5 rounded-xl transition-all shadow-sm border ${
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
                      <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">
                        中
                      </div>
                    )}
                  </button>

                  {/* 2. 外語按鈕 (⚠️ 修改：只在 translate 模式顯示) */}
                  {aiMode === "translate" && (
                    <button
                      onClick={() => toggleListening(tripConfig.language.code)}
                      className={`p-2.5 rounded-xl transition-all shadow-sm border ${
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
                        <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">
                          {tripConfig.language.label}
                        </div>
                      )}
                    </button>
                  )}

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    // 🆕 動態 Placeholder
                    placeholder={
                      listeningLang
                        ? listeningLang === "zh-TW"
                          ? "聽取中文中..."
                          : `聽取${tripConfig.language.name}中...`
                        : aiMode === "translate"
                          ? `輸入中文或${tripConfig.language.name}進行翻譯...`
                          : "輸入問題詢問行程..."
                    }
                    className={`flex-1 min-w-0 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all shadow-inner placeholder:text-opacity-50 ${isDarkMode ? "bg-neutral-900/50 border-neutral-600 text-neutral-200 focus:border-sky-500 focus:ring-sky-500/20 placeholder:text-neutral-500" : "bg-white border-stone-200 text-stone-700 focus:border-[#5D737E] focus:ring-[#5D737E]/20 placeholder:text-stone-400"}`}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className={`p-2.5 rounded-xl transition-all shadow-md ${isLoading || !inputMessage.trim() ? (isDarkMode ? "bg-neutral-700 text-neutral-500 shadow-none" : "bg-stone-200 text-stone-400 shadow-none") : isDarkMode ? "bg-gradient-to-r from-sky-700 to-blue-800 text-white hover:shadow-lg active:scale-95" : "bg-gradient-to-r from-[#5D737E] to-[#3F5561] text-white hover:shadow-lg active:scale-95"}`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 實用連結 (Resources Tab) */}
        {activeTab === "resources" && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] p-5 shadow-xl min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
            >
              <h2
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
              >
                <div
                  className={`p-1.5 rounded-xl ${isDarkMode ? "bg-blue-900/20" : "bg-[#E8F0FE]"}`}
                >
                  <LinkIcon
                    className={`w-4 h-4 ${isDarkMode ? "text-blue-300" : "text-[#3B5998]"}`}
                  />
                </div>
                實用連結百寶箱
              </h2>

              <div className="space-y-4">
                {usefulLinks.map((section, idx) => (
                  <div key={idx}>
                    <h3
                      className={`text-xs font-bold mb-2.5 px-3 py-1.5 rounded-lg w-fit border ${isDarkMode ? "text-blue-300 bg-blue-900/20 border-blue-800/30" : "text-[#3B5998] bg-[#E8F0FE] border-blue-100"}`}
                    >
                      {section.category}
                    </h3>
                    <div className="space-y-3">
                      {section.items.map((item, i) => (
                        <a
                          key={i}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 p-4 backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 group ${isDarkMode ? "bg-neutral-800/30 border-neutral-700" : "bg-white/60 border-stone-200"}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner group-hover:scale-105 transition-transform ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-stone-100"}`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`text-sm font-bold flex items-center gap-1.5 group-hover:text-opacity-80 transition-colors ${isDarkMode ? "text-neutral-200 group-hover:text-sky-300" : "text-[#37474F] group-hover:text-[#5D737E]"}`}
                            >
                              {item.title}
                              <ExternalLink
                                className={`w-3 h-3 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                              />
                            </div>
                            <p className={`text-xs mt-0.5 ${theme.textSec}`}>
                              {item.desc}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation (Floating Glass Bar) */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm z-50">
          <div
            className={`backdrop-blur-xl border rounded-full shadow-2xl p-1.5 flex justify-between items-center transition-all duration-300 ${theme.navBg}`}
          >
            <button
              onClick={() => setActiveTab("itinerary")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === "itinerary" ? (isDarkMode ? "bg-neutral-700 text-white shadow-lg scale-105" : "bg-[#5D737E] text-white shadow-lg scale-105") : isDarkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-stone-400 hover:bg-stone-100"}`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold">行程</span>
            </button>
            <button
              onClick={() => setActiveTab("guides")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === "guides" ? (isDarkMode ? "bg-neutral-700 text-white shadow-lg scale-105" : "bg-[#5D737E] text-white shadow-lg scale-105") : isDarkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-stone-400 hover:bg-stone-100"}`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold">指南</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex flex-col items-center justify-center w-16 h-16 -mt-6 rounded-full transition-all duration-300 border-4 ${isDarkMode ? "bg-gradient-to-r from-amber-600 to-orange-700 border-neutral-800" : "bg-gradient-to-r from-[#D4AF37] to-[#C5A028] border-[#F9F9F6]"} text-white shadow-xl scale-110 shadow-md hover:scale-105`}
            >
              <MessageSquare className="w-7 h-7" />
            </button>
            <button
              onClick={() => setActiveTab("shops")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === "shops" ? (isDarkMode ? "bg-neutral-700 text-white shadow-lg scale-105" : "bg-[#5D737E] text-white shadow-lg scale-105") : isDarkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-stone-400 hover:bg-stone-100"}`}
            >
              <Store className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold">商家</span>
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === "resources" ? (isDarkMode ? "bg-neutral-700 text-white shadow-lg scale-105" : "bg-[#5D737E] text-white shadow-lg scale-105") : isDarkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-stone-400 hover:bg-stone-100"}`}
            >
              <LinkIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold">連結</span>
            </button>
          </div>
        </div>

        {/* Floating Location Button (透明度優化版) */}
        <button
          onClick={handleShareLocation}
          // 修改重點：
          // 1. 加入 opacity-60 hover:opacity-100 (閒置時變淡)
          // 2. 背景色從 /90 改為 /40 (更透)
          className={`fixed bottom-40 right-5 w-12 h-12 backdrop-blur-md border rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-all opacity-60 hover:opacity-100
            ${
              hasLocationPermission === false
                ? "border-red-400 text-red-500 animate-pulse hover:bg-red-50"
                : isDarkMode
                  ? "bg-neutral-800/40 border-neutral-600 text-sky-300 hover:bg-neutral-800/90"
                  : "bg-white/40 border-stone-200 text-[#5D737E] hover:bg-white/90"
            }`}
          aria-label="分享位置"
        >
          <LocateFixed className="w-6 h-6" />
        </button>

        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed top-24 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-full shadow-xl z-[60] flex items-center gap-2 animate-bounce backdrop-blur-md border 
            ${
              toast.type === "error"
                ? isDarkMode
                  ? "bg-red-900/90 text-white border-red-700"
                  : "bg-red-500/90 text-white border-white/20"
                : isDarkMode
                  ? "bg-green-800/90 text-white border-green-700"
                  : "bg-emerald-600/90 text-white border-white/20"
            }`}
          >
            {toast.type === "error" ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="text-sm font-bold tracking-wide">
              {toast.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryApp;
