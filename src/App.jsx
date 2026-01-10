import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
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
  Calculator,
  Sparkles,
  Languages,
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
  DollarSign,
} from "lucide-react";
import {
  itineraryData,
  guidesData,
  usefulLinks,
  shopGuideData,
  tripConfig,
  checklistData,
} from "./tripdata_2026_karuizawa.jsx";
import { 
  flattenItinerary, 
  flattenGuides, 
  flattenShops, 
  escapeRegex, 
  getWeatherData,
  getDailyLocationKey,    // 新增
  getAiWelcomeTemplate,  // 新增
  buildShareTextLogic    // 新增
} from "./utils/itineraryHelpers.js";


// 抑制 ESLint 對於 JSX 中 motion 未使用的誤判
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import ChatInput from "./components/ChatInput.jsx";
import CurrencyWidget from "./components/CurrencyWidget.jsx";
import CalculatorModal from "./components/CalculatorModal.jsx";
import TestModePanel from "./components/TestModePanel.jsx";
import WeatherDetail from "./components/WeatherDetail.jsx";

// 財務管理主畫面
import FinanceNote from "./components/FinanceNote.jsx";

const ChatMessageList = lazy(() => import("./components/ChatMessageList.jsx"));
import DayMap from "./components/DayMap.jsx";

import WeatherParticles from "./components/Background/WeatherParticles.jsx";
import { getParticleType, getSkyCondition } from "./utils/weatherHelpers.js";

import SkyObjects from "./components/Background/SkyObjects.jsx";

// 使用 Web Crypto API 實作加密工具，取代外部依賴以提升安全性與效能
import { CryptoUtils } from "./utils/crypto.js";
const ENCRYPTED_API_KEY_PAYLOAD = (
  import.meta.env.VITE_ENCODED_KEY || ""
).trim();
const ENCRYPTED_MAPS_KEY_PAYLOAD = (
  import.meta.env.VITE_ENCODED_MAPS_KEY || ""
).trim();
const ENCRYPTED_GAS_URL_PAYLOAD = (
  import.meta.env.VITE_ENCODED_GAS_URL || ""
).trim();
const ENCRYPTED_GAS_TOKEN_PAYLOAD = (
  import.meta.env.VITE_ENCODED_GAS_TOKEN || ""
).trim();

//  FlightInfoCard 組件
import FlightInfoCard from "./components/FlightInfoCard.jsx";
// ChecklistCard 組件
import ChecklistCard from "./components/ChecklistCard.jsx";

// 自定義 Hook：匯率管理
import { useCurrency } from "./hooks/useCurrency.js";

// 開發環境偵錯開關
const isDev = true;

const debugLog = (message, data = null) => {
  if (isDev) {
    if (data === null) {
      console.log(message);
    } else {
      console.log(message, data);
    }
  }
};

const debugGroup = (label) => {
  if (isDev) console.group(label);
};

const debugGroupEnd = () => {
  if (isDev) console.groupEnd();
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ItineraryApp = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [mapsApiKey, setMapsApiKey] = useState("");
  const [gasUrl, setGasUrl] = useState(""); 
  const [gasToken, setGasToken] = useState("");
  // const [gasUrl] = useState("https://script.google.com/macros/s/AKfycbzT2nqj-bq5OUoRT6M2j7V4rxa6bTE5DWCxCpey65C54AG_Mnzz1XMFIwxXlsro8whR/exec"); // 部署後的 URL (正式版建議加密)
  // const [gasToken] = useState("GAS_TOKEN_FCWI");     // 設定的密碼 (正式版建議加密)
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showEncryptTool, setShowEncryptTool] = useState(false);
  const [fullPreviewImage, setFullPreviewImage] = useState(null);
  const scrollContainerRef = useRef(null);
  const [loadingText, setLoadingText] = useState("");
  const [autoTimeZone, setAutoTimeZone] = useState("Asia/Taipei");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  useEffect(() => {
    if (fullPreviewImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [fullPreviewImage]);

  // 優先從快取讀取天氣資訊，若無則顯示啟動畫面進行定位
  const [isAppReady, setIsAppReady] = useState(() => {
    const cached = localStorage.getItem("cached_user_weather");
    return !!cached;
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false); // 新增：追蹤地圖彈窗狀態
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
        setIsMobile(true);
      } else {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

    // 使用自定義 Hook 簡化狀態管理
  const { code, target } = tripConfig.currency;
  const rateData = useCurrency(code, target, isOnline);

  const [toolKey, setToolKey] = useState("");
  const [toolPwd, setToolPwd] = useState("");
  const [toolResult, setToolResult] = useState("");
  const [keyType, setKeyType] = useState("gemini");

  const { keywordsSet, combinedRegex } = React.useMemo(() => {
    const allKeywordsRaw = [
      ...itineraryData.flatMap((day) => day.events.map((e) => e.title)),
      ...shopGuideData.flatMap((area) => area.mainShops.map((s) => s.name)),
    ];
    const filtered = allKeywordsRaw.filter((k) => k && k.length >= 2);
    const set = new Set(filtered);
    const pattern = filtered.map(escapeRegex).join("|");
    const regex = new RegExp(
      `(https?://[^\\s]+)|(${pattern})|(\\*\\*.*?\\*\\*)`,
      "g",
    );
    return { keywordsSet: set, combinedRegex: regex };
  }, []);

  const renderMessage = (text) => {
    if (!text) return null;

    return text.split(combinedRegex).map((part, index) => {
      if (!part) return null;

      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 underline"
          >
            {part}
          </a>
        );
      }

      if (keywordsSet.has(part)) {
        return (
          <a
            key={index}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(part)}`}
            className="text-orange-500 font-bold border-b border-dashed border-orange-400 hover:text-orange-400"
          >
            {part}
          </a>
        );
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      showToast("圖片檔案過大（超過 5MB），請選擇較小的圖片", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;

      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            processImageCompression(imageData);
          },
          { timeout: 2000 },
        );
      } else {
        setTimeout(() => {
          processImageCompression(imageData);
        }, 100);
      }
    };
    reader.readAsDataURL(file);
  };

  const processImageCompression = (imageData) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      const MAX_SIDE = 1600;
      if (width > height) {
        if (width > MAX_SIDE) {
          height *= MAX_SIDE / width;
          width = MAX_SIDE;
        }
      } else {
        if (height > MAX_SIDE) {
          width *= MAX_SIDE / height;
          height = MAX_SIDE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
      setTempImage(compressedBase64);
    };
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyToClipboard = async (text, successMsg = "已複製到剪貼簿") => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast(successMsg);
        return true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          showToast(successMsg);
          return true;
        } else {
          throw new Error("複製命令失敗");
        }
      }
    } catch (err) {
      console.error("複製失敗:", err);
      showToast("複製失敗", "error");
      return false;
    }
  };

  const handleCopy = (text) => {
    copyToClipboard(text, `已複製：${text}`);
  };

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 17 || hour < 6) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const currentTheme = React.useMemo(() => {
    const theme = tripConfig.theme || {};
    return {
      colorBase: theme.colorBase || "stone",
      colorAccent: theme.colorAccent || "amber",
      bgTexture:
        theme.bgTexture ||
        `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
      bgGradientLight:
        theme.bgGradientLight ||
        "bg-[#FDFBF7] from-stone-100/50 via-white to-transparent",
      bgGradientDark:
        theme.bgGradientDark ||
        "bg-[#1A1A1A] from-[#252525] via-[#1A1A1A]/80 to-transparent",
      blobs: theme.blobs || {
        light: ["bg-orange-200/30", "bg-stone-200/30", "bg-amber-100/40"],
        dark: ["bg-amber-500/10", "bg-purple-500/10", "bg-blue-500/10"],
      },
      textColors: theme.textColors || {
        light: "text-stone-800",
        dark: "text-stone-100",
        secLight: "text-stone-500",
        secDark: "text-stone-300",
      },
      semanticColors: theme.semanticColors || {
        blue: { light: "text-[#5D737E]", dark: "text-sky-300" },
        green: { light: "text-[#556B2F]", dark: "text-emerald-300" },
        red: { light: "text-[#A04040]", dark: "text-red-300" },
        orange: { light: "text-[#CD853F]", dark: "text-amber-300" },
        pink: { light: "text-[#BC8F8F]", dark: "text-rose-300" },
      },
      weatherIconColors: theme.weatherIconColors || {
        sun: "text-amber-400",
        moon: "text-indigo-300",
        cloud: "text-gray-400",
        fog: "text-slate-400",
        rain: "text-blue-400",
        snow: "text-cyan-300",
        lightning: "text-yellow-500",
      },
      weatherColors: theme.weatherColors || {
        rain: "#94a3b8",
        cloud: "#cbd5e1",
        snow: "#94a3b8",
      },
      glassColors: theme.glassColors || {
        card: {
          light:
            "bg-white/90 backdrop-blur-md backdrop-saturate-150 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]",
          dark: "bg-[#262626]/90 backdrop-blur-md backdrop-saturate-150 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
        },
        nav: {
          light:
            "bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border-white/20 shadow-lg",
          dark: "bg-[#2A2A2A]/60 backdrop-blur-2xl backdrop-saturate-150 border-white/10 shadow-2xl shadow-black/30",
        },
      },
      tagColors: theme.tagColors || {
        transport: {
          light: "bg-[#E8F0FE] text-[#3B5998]",
          dark: "bg-sky-900/30 text-sky-200",
        },
        food: {
          light: "bg-[#F0F5E5] text-[#556B2F]",
          dark: "bg-emerald-900/30 text-emerald-200",
        },
        shopping: {
          light: "bg-[#FFF8E1] text-[#8B6B23]",
          dark: "bg-amber-900/30 text-amber-200",
        },
        hotel: {
          light: "bg-[#E6E6FA] text-[#6A5ACD]",
          dark: "bg-purple-900/30 text-purple-200",
        },
        spot: {
          light: "bg-[#FFF0F5] text-[#BC8F8F]",
          dark: "bg-rose-900/30 text-rose-200",
        },
      },
      chatColors: theme.chatColors || {
        userBubble: {
          light: "bg-[#5D737E] text-white border-[#4A606A]",
          dark: "bg-sky-800 text-white border-sky-700",
        },
        modelBubble: {
          light: "bg-white/90 backdrop-blur-sm text-stone-700 border-stone-200",
          dark: "bg-neutral-800/90 backdrop-blur-sm text-neutral-200 border-neutral-700",
        },
        bg: {
          light: "bg-[#F9F9F6]/50",
          dark: "bg-black/20",
        },
      },
      mainBg: theme.mainBg || {
        light: "bg-[#F0F2F5] text-slate-700",
        dark: "bg-[#1A1A1A] text-neutral-200",
      },
      particleColors: theme.particleColors || {
        rain: {
          light: "rgba(100, 149, 237, 0.6)",
          dark: "rgba(255, 255, 255, 0.5)",
        },
        snow: "rgba(255, 255, 255, 0.8)",
        stars: "rgba(255, 255, 255, ALPHA)",
        fog: "rgba(200, 200, 200, ALPHA)",
        lightning: "rgba(255, 255, 200, BRIGHTNESS)",
      },
      cloudColors: theme.cloudColors || {
        heavy: "#bdc3c7",
        medium: "#d1d5db",
        light: "#ecf0f1",
      },
      celestialColors: theme.celestialColors || {
        sun: "#f1c40f",
        sunGlow: "#f39c12",
        moon: "#f5f6fa",
        moonShadow: "rgba(245, 246, 250, 0.4)",
      },
      ambientColors: theme.ambientColors || {
        clear: {
          light: "rgba(255, 255, 255, 0.8)",
          dark: "rgba(30, 41, 59, 0.5)",
        },
        cloudy: {
          light: "rgba(241, 245, 249, 0.85)",
          dark: "rgba(51, 65, 85, 0.6)",
        },
        rain: {
          light: "rgba(219, 234, 254, 0.85)",
          dark: "rgba(30, 58, 138, 0.4)",
        },
        snow: {
          light: "rgba(248, 250, 252, 0.9)",
          dark: "rgba(71, 85, 105, 0.5)",
        },
        thunderstorm: {
          light: "rgba(200, 200, 220, 0.85)",
          dark: "rgba(30, 30, 50, 0.7)",
        },
        fog: {
          light: "rgba(226, 232, 240, 0.85)",
          dark: "rgba(71, 85, 105, 0.4)",
        },
      },
      dynamicBg: theme.dynamicBg || {
        rain: { light: "#c7d2e0", dark: "#4a5568" },
        cloud: "#cbd5e1",
      },
      buttonGradients: theme.buttonGradients || {
        primary: {
          light: "from-[#5D737E] to-[#3F5561]",
          dark: "from-sky-800 to-blue-900",
        },
      },
      inputColors: theme.inputColors || {
        focusBorder: { light: "#5D737E", dark: "sky-500" },
        focusRing: {
          light: "rgba(93, 115, 126, 0.2)",
          dark: "rgba(14, 165, 233, 0.2)",
        },
      },
      linkColors: theme.linkColors || {
        hover: { light: "#5D737E", dark: "sky-300" },
      },
      textShadow: theme.textShadow || {
        light: "0 1px 1px rgba(255,255,255,0.5)",
        dark: "0 2px 4px rgba(0,0,0,0.3)",
      },
      borderRadius: theme.borderRadius || {
        small: "rounded-xl",
        card: "rounded-2xl",
        modal: "rounded-3xl",
        full: "rounded-full",
      },
      spacing: theme.spacing || {
        cardSmall: "p-3",
        card: "p-4",
        cardLarge: "p-5",
      },
    };
  }, []);

  const cBase = currentTheme.colorBase;
  const cAccent = currentTheme.colorAccent;

  const containerStyle = React.useMemo(
    () => ({
      "--bg-texture": currentTheme.bgTexture,
    }),
    [currentTheme.bgTexture],
  );

  const colors = React.useMemo(() => {
    const sc = currentTheme.semanticColors;
    return {
      blue: isDarkMode ? sc.blue.dark : sc.blue.light,
      green: isDarkMode ? sc.green.dark : sc.green.light,
      red: isDarkMode ? sc.red.dark : sc.red.light,
      orange: isDarkMode ? sc.orange.dark : sc.orange.light,
      pink: isDarkMode ? sc.pink.dark : sc.pink.light,
    };
  }, [isDarkMode, currentTheme.semanticColors]);

  useEffect(() => {
    const checkSavedPassword = async () => {
      const savedPwd = localStorage.getItem("trip_password");
      if (savedPwd && ENCRYPTED_API_KEY_PAYLOAD) {
        await attemptUnlock(savedPwd, true);
      } else if (!ENCRYPTED_API_KEY_PAYLOAD) {
        setIsVerified(true);
      }
    };
    checkSavedPassword();
  }, []);

  const attemptUnlock = async (inputPwd, isAuto = false) => {
    setIsAuthLoading(true);
    setAuthError("");
    try {
      if (ENCRYPTED_API_KEY_PAYLOAD) {
        const decryptedGemini = await CryptoUtils.decrypt(
          ENCRYPTED_API_KEY_PAYLOAD,
          inputPwd,
        );
        if (decryptedGemini && decryptedGemini.length > 10) {
          setApiKey(decryptedGemini);
        } else {
          throw new Error("Gemini Key 解密失敗");
        }
      }

      if (ENCRYPTED_MAPS_KEY_PAYLOAD) {
        try {
          const decryptedMaps = await CryptoUtils.decrypt(
            ENCRYPTED_MAPS_KEY_PAYLOAD,
            inputPwd,
          );
          if (decryptedMaps && decryptedMaps.length > 5) {
            setMapsApiKey(decryptedMaps);
          }
        } catch (e) {
          console.warn("Maps Key 解密失敗", e);
        }
      }
      if (ENCRYPTED_GAS_URL_PAYLOAD) {
        try {
          const decryptedUrl = await CryptoUtils.decrypt(ENCRYPTED_GAS_URL_PAYLOAD, inputPwd);
          if (decryptedUrl && decryptedUrl.startsWith("http")) {
            setGasUrl(decryptedUrl);
          }
        } catch (e) { console.warn("GAS URL 解密失敗", e); }
      }

      if (ENCRYPTED_GAS_TOKEN_PAYLOAD) {
        try {
          const decryptedToken = await CryptoUtils.decrypt(ENCRYPTED_GAS_TOKEN_PAYLOAD, inputPwd);
          if (decryptedToken) {
            setGasToken(decryptedToken);
          }
        } catch (e) { console.warn("GAS Token 解密失敗", e); }
      }

      setIsVerified(true);
      localStorage.setItem("trip_password", inputPwd);
    } catch {
      if (!isAuto) setAuthError("密碼錯誤，請再試一次");
      if (isAuto) localStorage.removeItem("trip_password");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    attemptUnlock(password);
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

  // 導覽列自動捲動用的 Ref
  const navContainerRef = useRef(null);
  const navItemsRef = useRef({}); // 用物件來存每一顆按鈕的 ref

  useEffect(() => {
    // 取得當前 activeDay 對應的按鈕 DOM 元素
    const currentTab = navItemsRef.current[activeDay];

    if (currentTab) {
      // 使用原生 API 讓它平滑捲動到視野中央
      currentTab.scrollIntoView({
        behavior: "smooth", // 平滑動畫
        block: "nearest", // 垂直方向不動
        inline: "center", // 水平方向置中 (關鍵！)
      });
    }
  }, [activeDay]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth", // 使用平滑捲動
      });
    }
  }, [activeDay]); // 💡 偵測 activeDay 的變化

  // 新增：滑動手勢偵測 State 與函式
  const [touchStart, setTouchStart] = useState(null);
  // Pull to Refresh logic
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullThreshold = 80;
  const startYRef = useRef(0);

  const handleMainTouchStart = (e) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].pageY;
    }
  };

  const handleMainTouchMove = (e) => {
    if (startYRef.current === 0) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startYRef.current;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.4, pullThreshold + 20));
    }
  };

  const handleMainTouchEnd = () => {
    if (pullDistance > pullThreshold) {
      triggerRefresh();
    }
    setPullDistance(0);
    startYRef.current = 0;
  };

  const triggerRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        getUserLocationWeather({ isSilent: true, highAccuracy: false }),
      ]);
      showToast("資訊已更新 ✨");
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error("更新失敗:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const [[, direction], setPage] = useState([activeDay, 0]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute",
      width: "100%",
      z: 0,
      willChange: "transform, opacity",
      backfaceVisibility: "hidden",
      WebkitFontSmoothing: "antialiased",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative",
      z: 0,
      zIndex: 1,
      willChange: "auto",
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1],
        opacity: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
      },
    },
    exit: (direction) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute",
      width: "100%",
      willChange: "transform, opacity",
      backfaceVisibility: "hidden",
      transition: {
        duration: 0.2,
        ease: "easeIn",
        opacity: { duration: 0.15 },
      },
    }),
  };

  const onTouchStart = (e) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = (e) => {
    if (!touchStart) return;

    // 如果任何全螢幕彈窗開啟中，則完全停用滑動換頁功能
    if (showWeatherDetail || isCalculatorOpen || isMapModalOpen) {
      setTouchStart(null);
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const distanceX = touchStart.x - endX;
    const distanceY = touchStart.y - endY;

    const absX = Math.abs(distanceX);
    const absY = Math.abs(distanceY);

    const minSwipeDistance = 75;
    const slopeThreshold = 2.5;

    // 判斷是否為有效的水平滑動，並排除垂直捲動的干擾
    if (absX > minSwipeDistance && absX > absY * slopeThreshold) {
      if (testModeClickCount > 0) {
        setTestModeClickCount(0);
        showToast("連續點擊計數已重置，請重新開始", "info");
      }

      if (distanceX > 0) {
        if (activeDay < itineraryData.length - 1) {
          changeDay(activeDay + 1);
        }
      } else {
        if (activeDay > -1) {
          changeDay(activeDay - 1);
        }
      }
    }

    setTouchStart(null);
  };

  const changeDay = (newDay) => {
    const newDirection = newDay > activeDay ? 1 : -1;
    setPage([newDay, newDirection]);
    setActiveDay(newDay);
  };

  const [isFlightInfoExpanded, setIsFlightInfoExpanded] = useState(false);
  const [weatherForecast, setWeatherForecast] = useState({
    karuizawa: null,
    tokyo: null,
    loading: true,
  });

  const [showWeatherDetail, setShowWeatherDetail] = useState(false);

  const [userWeather, setUserWeather] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_user_weather");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.locationName) {
          debugLog("🚀 State 初始化：直接載入快取資料", parsed.locationName);
          return parsed;
        }
      }
    } catch (e) {
      console.error("快取初始化解析失敗", e);
    }

    return {
      temp: null,
      desc: "",
      locationName: "定位中...",
      landmark: "",
      weatherCode: null,
      loading: false,
      error: null,
    };
  });

  // 讓開發者可以透過 Console 快速測試不同天氣與日夜效果
  useEffect(() => {
    window.setTestWeather = (code, isDark) => {
      if (code !== undefined) {
        setUserWeather((prev) => ({ ...prev, weatherCode: code }));
      }
      if (isDark !== undefined) {
        setIsDarkMode(isDark);
      }
      console.log(`🧪 測試模式啟動: Code=${code}, DarkMode=${isDark}`);
    };

    return () => {
      delete window.setTestWeather;
    };
  }, []);

  const [locationSource, setLocationSource] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_user_weather");
      return cached ? "cache" : null;
    } catch {
      return null;
    }
  });

  const lastHighPrecisionAtRef = useRef(null);
  const isFetchingLocationRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const [isSharing, setIsSharing] = useState(false);

  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const [isTestMode, setIsTestMode] = useState(false);
  const isTestModeRef = useRef(false);
  useEffect(() => {
    isTestModeRef.current = isTestMode;
  }, [isTestMode]);
  const [testModeClickCount, setTestModeClickCount] = useState(0);
  const [testDateTime, setTestDateTime] = useState(new Date());
  const [testLatitude, setTestLatitude] = useState(35.4437);
  const [testLongitude, setTestLongitude] = useState(138.3919);
  const [testWeatherOverride, setTestWeatherOverride] = useState({
    overview: null,
    days: {},
  });
  const [frozenTestDateTime, setFrozenTestDateTime] = useState(null);
  const [frozenTestWeatherOverride, setFrozenTestWeatherOverride] =
    useState(null);

  const freezeTestSettings = () => {
    setFrozenTestDateTime(new Date(testDateTime));
    setFrozenTestWeatherOverride(
      JSON.parse(JSON.stringify(testWeatherOverride)),
    );
    console.log(
      `🔒 凍結測試設定 - dateTime=${testDateTime.toLocaleString("zh-TW")}, weather=`,
      testWeatherOverride,
    );
    showToast("✅ 測試設定已凍結，不會被覆蓋", "success");
  };

  const unfreezeTestSettings = () => {
    setFrozenTestDateTime(null);
    setFrozenTestWeatherOverride(null);
    console.log(`🔓 解凍測試設定`);
    showToast("測試設定已解凍", "success");
  };

  useEffect(() => {
    if (isTestMode) {
      const hour = testDateTime.getHours();
      if (hour >= 17 || hour < 6) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    }
  }, [isTestMode, testDateTime]);

  const geminiAbortControllerRef = useRef(null);
  const mapsAbortControllerRef = useRef(null);

  const googlePlacesCacheRef = useRef({});
  const geoNamesCacheRef = useRef({});
  const CACHE_MAX_SIZE = 50;
  const CACHE_EXPIRY_MS = 3600000;

  const [aiMode, setAiMode] = useState("translate");
  const getStorageKey = (mode) => `trip_chat_history_${mode}`;
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey("translate"));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("讀取聊天紀錄失敗", e);
    }
    return [getAiWelcomeTemplate("translate", tripConfig)];
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const historyToSave = messages.map((msg) => ({
        ...msg,
        image: null,
      }));
      localStorage.setItem(
        getStorageKey(aiMode),
        JSON.stringify(historyToSave),
      );
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [messages, aiMode]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningLang, setListeningLang] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleConfirmImage = () => {
    setSelectedImage(tempImage);
    setTempImage(null);
  };
  const handleCancelImage = () => {
    setTempImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  const showToast = React.useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  const itineraryFlat = React.useMemo(
    () => flattenItinerary(itineraryData),
    [],
  );
  const guidesFlat = React.useMemo(() => flattenGuides(guidesData), []);
  const shopsFlat = React.useMemo(() => flattenShops(shopGuideData), []);

  // ... existing map and weather helpers ...
  // 1. Get Google Map Link
  const getMapLink = (query) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // 2. Get Weather Info from WMO Code
  // UI 版本，包含圖示和顏色（依賴 isDarkMode，用於顯示層）
  const getWeatherInfo = React.useCallback(
    (code) => {
      const iconClass = "w-7 h-7"; // Slightly larger icons
      const color = isDarkMode ? "text-neutral-300" : "text-neutral-600"; // Muted icons
      const textSecColor = isDarkMode
        ? currentTheme.textColors?.secDark || `text-${cBase}-300`
        : currentTheme.textColors?.secLight || `text-${cBase}-600`;
      const data = getWeatherData(code);

      let icon;
      if (code === 0)
        icon = (
          <Sun
            className={`${iconClass} ${isDarkMode ? "text-amber-200" : "text-amber-500"}`}
          />
        );
      else if ([1, 2, 3].includes(code))
        icon = <Cloud className={`${iconClass} ${color}`} />;
      else if ([45, 48].includes(code))
        icon = <CloudFog className={`${iconClass} ${textSecColor}`} />;
      else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
        icon = (
          <CloudRain
            className={`${iconClass} ${isDarkMode ? "text-sky-300" : "text-sky-600"}`}
          />
        );
      else if ([71, 73, 75, 77, 85, 86].includes(code))
        icon = (
          <Snowflake
            className={`${iconClass} ${isDarkMode ? "text-cyan-200" : "text-cyan-500"}`}
          />
        );
      else if ([95, 96, 99].includes(code))
        icon = (
          <CloudLightning
            className={`${iconClass} ${isDarkMode ? "text-yellow-200" : "text-yellow-600"}`}
          />
        );
      else icon = <Sun className={`${iconClass} ${color}`} />;

      return {
        icon,
        text: data.text,
        advice: data.advice,
      };
    },
    [isDarkMode, cBase, currentTheme],
  );

  const { tripStatus, daysUntilTrip, currentTripDayIndex } =
    React.useMemo(() => {
      const tripStartDate = new Date(tripConfig.startDate);
      const tripEndDate = new Date(tripConfig.endDate);
      // 優先順序：凍結的測試時間 > 測試模式時間 > 系統當前時間
      const displayDateTime =
        frozenTestDateTime || (isTestMode ? testDateTime : new Date());

      console.log(
        `🧪 行程狀態計算 - isTestMode=${isTestMode}, isFrozen=${!!frozenTestDateTime}, displayDateTime=${displayDateTime.toLocaleString("zh-TW")}`,
      );

      let calculatedTripStatus = "before";
      let calculatedDaysUntilTrip = 0;
      let calculatedCurrentTripDayIndex = -1;

      if (displayDateTime < tripStartDate) {
        calculatedTripStatus = "before";
        const diffTime = Math.abs(tripStartDate - displayDateTime);
        calculatedDaysUntilTrip = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else if (
        displayDateTime >= tripStartDate &&
        displayDateTime <= tripEndDate
      ) {
        calculatedTripStatus = "during";
        const diffTime = Math.abs(displayDateTime - tripStartDate);
        calculatedCurrentTripDayIndex = Math.floor(
          diffTime / (1000 * 60 * 60 * 24),
        );
        console.log(
          `🧪 正在行程中 - currentTripDayIndex=${calculatedCurrentTripDayIndex}`,
        );
      } else {
        calculatedTripStatus = "after";
      }

      return {
        tripStatus: calculatedTripStatus,
        daysUntilTrip: calculatedDaysUntilTrip,
        currentTripDayIndex: calculatedCurrentTripDayIndex,
      };
    }, [isTestMode, testDateTime, frozenTestDateTime]);

  const getUserLocationWeather = React.useCallback(
    async (options = {}) => {
      const {
        isSilent = false,
        highAccuracy = false,
        timeout = 10000,
        coords = null,
      } = options;

      // 避免短時間內重複觸發定位請求，減少 API 消耗與效能負擔
      const now = Date.now();
      // 放寬冷卻時間，避免短時間重複刷新造成過多外部請求
      const minGapMs = isSilent ? 10000 : 30000;
      if (!highAccuracy) {
        if (
          isFetchingLocationRef.current ||
          now - lastFetchAtRef.current < minGapMs
        ) {
          debugLog("⏳ 略過重複定位請求 (節流中)");
          return null;
        }
      }
      isFetchingLocationRef.current = true;
      if (!isSilent && !highAccuracy) setIsUpdatingLocation(true);

      // 測試模式處理：若未提供 explicit coords 則使用測試設定座標
      let effectiveCoords = coords;
      if (isTestMode && !effectiveCoords) {
        effectiveCoords = { latitude: testLatitude, longitude: testLongitude };
        debugLog("🧪 測試模式：使用設定的測試位置座標");
      }

      const fetchLocalWeather = async (
        latitude,
        longitude,
        customName = null,
      ) => {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weathercode,uv_index,uv_index_clear_sky,wind_speed_10m,wind_gusts_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,uv_index_clear_sky_max,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,sunrise,sunset&forecast_days=7&timezone=auto`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          if (weatherData.error) {
            throw new Error(weatherData.reason || "Weather API error");
          }

          let city = customName;
          let landmark = "";
          let isGeneric = true;

          if (!city) {
            try {
              // 使用座標作為 Key 進行地名快取，避免重複查詢 Nominatim API
              const geoKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
              let geoData = geoNamesCacheRef.current[geoKey]?.data;

              if (
                !geoData ||
                Date.now() -
                  (geoNamesCacheRef.current[geoKey]?.timestamp || 0) >
                  CACHE_EXPIRY_MS
              ) {
                const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW&zoom=18`;
                const geoRes = await fetch(geoUrl);
                geoData = await geoRes.json();

                geoNamesCacheRef.current[geoKey] = {
                  data: geoData,
                  timestamp: Date.now(),
                };
                debugLog(`🌍 [地名查詢] 新查詢: ${geoKey}`);
              } else {
                debugLog(`🌍 [地名快取命中] ${geoKey}`);
              }

              if (geoData) {
                const addr = geoData.address || {};
                city =
                  addr.city ||
                  addr.town ||
                  addr.village ||
                  addr.county ||
                  addr.state ||
                  "您的位置";

                // 判斷是否為具體地標（如建築物名稱），若無則回退至路名
                if (geoData.name) {
                  landmark = geoData.name;
                  isGeneric = false;
                } else {
                  isGeneric = true;
                  if (addr.road) {
                    landmark = addr.road;
                    if (addr.house_number) landmark += ` ${addr.house_number}`;
                  }
                }
              }
            } catch (e) {
              console.warn("Geo lookup failed:", e);
              city = "目前位置";
            }
          }

          const info = getWeatherData(weatherData.current_weather.weathercode);
          const newWeatherData = {
            temp: Math.round(weatherData.current_weather.temperature),
            desc: info.text,
            weatherCode: weatherData.current_weather.weathercode,
            hourly: weatherData.hourly,
            daily: weatherData.daily,
            locationName: city || "未知地點",
            landmark: landmark,
            isGeneric: isGeneric,
            lat: latitude,
            lon: longitude,
            loading: false,
            error: null,
          };

          localStorage.setItem(
            "cached_user_weather",
            JSON.stringify({ ...newWeatherData, timestamp: Date.now() }),
          );
          setUserWeather(newWeatherData);
          if (weatherData.timezone) setAutoTimeZone(weatherData.timezone);

          return newWeatherData;
        } catch (err) {
          console.error("定位失敗:", err);
          if (!isAppReady)
            setUserWeather((prev) => ({
              ...prev,
              loading: false,
              error: "連線失敗",
            }));
          return null;
        } finally {
          setIsAppReady(true);
          setIsUpdatingLocation(false);
          isFetchingLocationRef.current = false;
          lastFetchAtRef.current = Date.now();
        }
      };

      // 優先載入快取資料以提供即時反饋
      const cached = localStorage.getItem("cached_user_weather");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUserWeather(parsed);
          setLocationSource("cache");
          setIsAppReady(true);
          debugLog("🚀 快取載入成功");
        } catch (e) {
          console.error("快取解析失敗", e);
        }
      }

      // 若無快取且非靜默更新，嘗試使用 IP 定位作為初步位置參考
      if (!cached && !isSilent && !effectiveCoords) {
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();
          if (ipData.latitude) {
            debugLog("📡 IP 定位補位成功");
            await fetchLocalWeather(
              ipData.latitude,
              ipData.longitude,
              ipData.city,
            );
            setLocationSource("low");
          }
        } catch {
          console.warn("IP 定位失敗");
          if (!cached) {
            await fetchLocalWeather(25.033, 121.5654, "台北");
            setLocationSource("low");
          }
        }
      }

      if (
        effectiveCoords &&
        effectiveCoords.latitude &&
        effectiveCoords.longitude
      ) {
        try {
          setHasLocationPermission(true);
          if (highAccuracy || isTestMode) {
            lastHighPrecisionAtRef.current = Date.now();
            setLocationSource("high");
          } else {
            // 測試模式下即便是低精度也視同提供有效座標，由呼叫端決定是否需再提升精確度
            setLocationSource("low");
          }
          return await fetchLocalWeather(
            effectiveCoords.latitude,
            effectiveCoords.longitude,
            effectiveCoords.name || null,
          );
        } catch (e) {
          console.error("使用提供的座標抓取失敗", e);
        }
      }

      // 啟動瀏覽器原生定位以獲取更精確的座標 (測試模式下跳過，除非明確傳入 coords)
      if (navigator.geolocation && !isTestMode) {
        const geoOptions = {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: highAccuracy ? 0 : 600000,
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isTestModeRef.current) {
              debugLog("🚫 略過 GPS 回傳 (處於測試模式中)");
              return;
            }
            setHasLocationPermission(true);
            if (highAccuracy) {
              lastHighPrecisionAtRef.current = Date.now();
              setLocationSource("high");
            } else {
              setLocationSource("low");
            }
            fetchLocalWeather(
              position.coords.latitude,
              position.coords.longitude,
            );
            if (!highAccuracy) {
              isFetchingLocationRef.current = false;
              lastFetchAtRef.current = Date.now();
            }
          },
          (err) => {
            console.warn("GPS 定位未成功", err.code, err.message);

            if (err.code === 1) {
              setHasLocationPermission(false);
              if (!isSilent) showToast("您已封鎖定位權限", "error");
            } else {
              setHasLocationPermission(null);
            }

            if (!cached && !isAppReady) {
              fetchLocalWeather(25.033, 121.5654, "台北");
              setLocationSource("low");
            }
            isFetchingLocationRef.current = false;
          },
          geoOptions,
        );
      } else {
        setHasLocationPermission(false);
        if (!cached && !isAppReady) {
          fetchLocalWeather(25.033, 121.5654, "台北");
          setLocationSource("low");
        }
        isFetchingLocationRef.current = false;
      }

      // 若當前非高精度請求且已過一段時間，則在背景嘗試獲取一次高精度位置
      if (!highAccuracy && !isTestMode) {
        const tenMinutes = 10 * 60 * 1000;
        const last = lastHighPrecisionAtRef.current || 0;
        if (Date.now() - last > tenMinutes && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (isTestModeRef.current) return;
              try {
                const newData = await fetchLocalWeather(
                  pos.coords.latitude,
                  pos.coords.longitude,
                );
                if (newData) {
                  lastHighPrecisionAtRef.current = Date.now();
                  setLocationSource("high");
                  debugLog(
                    "Background high-precision update completed (silent)",
                    newData.locationName,
                  );
                }
              } catch {
                console.warn("Background high-precision fetch failed");
              }
            },
            (err) => {
              console.warn(
                "Background high-precision geolocation failed:",
                err,
              );
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
          );
        }
      }
    },
    [
      showToast,
      isAppReady,
      isTestMode,
      testLatitude,
      testLongitude,
    ],
  );

  useEffect(() => {
    const alreadyHasData =
      userWeather.temp !== null && userWeather.locationName !== "定位中...";

    getUserLocationWeather({ isSilent: alreadyHasData, highAccuracy: false });

    // 每 10 分鐘自動更新一次天氣資訊，確保資料時效性
    const intervalId = setInterval(() => {
      debugLog("⏰ 自動更新位置與天氣...");
      getUserLocationWeather({ isSilent: true, highAccuracy: false });
    }, 600000);

    return () => clearInterval(intervalId);
  }, [getUserLocationWeather, userWeather.locationName, userWeather.temp]);

  const handleShareLocation = async () => {
    // 測試模式優先處理：直接使用測試設定的位置分享，不觸發實際定位
    if (isTestMode) {
      const shareLat = testLatitude;
      const shareLng = testLongitude;
      const shareLandmark = userWeather.landmark || "";
      const shareLocationName = userWeather.locationName || "測試地點";
      const shareIsGeneric = userWeather.isGeneric;

      const composed = await buildShareText(
        shareLat,
        shareLng,
        shareLandmark,
        shareLocationName,
        shareIsGeneric,
      );
      const { baseMessage, fullText, tag } = composed;
      const mapUrl = `https://www.google.com/maps?q=${shareLat},${shareLng}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "我的位置 (測試模式)",
            text: baseMessage,
            url: mapUrl,
          });
          showToast(`分享成功 (測試) — 來源: ${tag}`);
          return;
        } catch (err) {
          if (
            err &&
            (err.name === "AbortError" || err.name === "NotAllowedError")
          ) {
            showToast("使用者取消分享", "info");
            return;
          }
        }
      }
      await copyToClipboard(fullText, "測試位置已複製到剪貼簿");
      return;
    }

    if (!navigator.geolocation) {
      const lat = userWeather.lat;
      const lng = userWeather.lon;
      const landmark = userWeather.landmark || "";

      if (lat && lng) {
        const composed = await buildShareText(
          lat,
          lng,
          landmark,
          userWeather.locationName,
          userWeather.isGeneric,
        );
        const { baseMessage, fullText, tag } = composed;

        if (navigator.share) {
          try {
            await navigator.share({
              title: "我的位置",
              text: baseMessage,
              url: `https://www.google.com/maps?q=${lat},${lng}`,
            });
            showToast(`分享成功 — 來源: ${tag}`);
            return;
          } catch (err) {
            if (
              err &&
              (err.name === "AbortError" || err.name === "NotAllowedError")
            ) {
              showToast("使用者取消分享", "info");
              return;
            }
            await copyToClipboard(fullText, "分享失敗，但位置已複製到剪貼簿");
            return;
          }
        } else {
          await copyToClipboard(fullText, "位置與地標資訊已複製！");
          return;
        }
      }

      showToast("您的瀏覽器不支援定位功能", "error");
      return;
    }

    const twoMinutes = 2 * 60 * 1000;
    const hasRecentHigh =
      isTestMode || // 測試模式下視同擁有精準座標，不重新抓取以免覆蓋
      (locationSource === "high" &&
        lastHighPrecisionAtRef.current &&
        Date.now() - lastHighPrecisionAtRef.current <= twoMinutes);

    if (userWeather.lat && userWeather.lon) {
      const lat = userWeather.lat;
      const lng = userWeather.lon;
      const landmark = userWeather.landmark || "";
      const composed = await buildShareText(
        lat,
        lng,
        landmark,
        userWeather.locationName,
        userWeather.isGeneric,
      );
      const { baseMessage, fullText, tag } = composed;
      const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      if (hasRecentHigh) {
        if (navigator.share) {
          try {
            await navigator.share({
              title: "我的位置",
              text: baseMessage,
              url: mapUrl,
            });
            showToast(`分享成功 — 來源: ${tag}`);
            return;
          } catch (err) {
            if (
              err &&
              (err.name === "AbortError" || err.name === "NotAllowedError")
            ) {
              showToast("使用者取消分享", "info");
              return;
            }
            console.error("分享失敗，改為複製到剪貼簿:", err);
            await copyToClipboard(fullText, "分享失敗，但位置已複製到剪貼簿");
            return;
          }
        } else {
          await copyToClipboard(fullText, "位置與地標資訊已複製！");
          return;
        }
      }

      setIsSharing(true);
      showToast("正在取得精準位置...", "success");

      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });

        // 成功拿到高精度座標並更新（會同步完成，接著分享）
        const newData = await getUserLocationWeather({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          isSilent: false,
          highAccuracy: true,
          timeout: 15000,
        });
        const shareLat = (newData && newData.lat) || pos.coords.latitude;
        const shareLng = (newData && newData.lon) || pos.coords.longitude;
        const shareLandmark = (newData && newData.landmark) || "";
        const mapUrl2 = `https://www.google.com/maps?q=${shareLat},${shareLng}`;
        const currentGenericStatus =
          newData && newData.isGeneric !== undefined ? newData.isGeneric : true;
        const composed2 = await buildShareText(
          shareLat,
          shareLng,
          shareLandmark,
          (newData && newData.locationName) || userWeather.locationName,
          currentGenericStatus,
        );
        const {
          baseMessage: baseMessage2,
          fullText: fullText2,
          tag: tag2,
        } = composed2;

        if (navigator.share) {
          try {
            await navigator.share({
              title: "我的位置",
              text: baseMessage2,
              url: mapUrl2,
            });
            showToast(`分享成功 — 來源: ${tag2}`);
          } catch (err) {
            if (
              err &&
              (err.name === "AbortError" || err.name === "NotAllowedError")
            ) {
              showToast("使用者取消分享", "info");
            } else {
              console.error("分享失敗，改為複製到剪貼簿:", err);
              await copyToClipboard(
                fullText2,
                "分享失敗，但位置已複製到剪貼簿",
              );
            }
          }
        } else {
          await copyToClipboard(fullText2, "位置與地標資訊已複製！");
        }

        return;
      } catch (err) {
        console.warn("高精度定位失敗，使用既有座標分享：", err);
        if (navigator.share) {
          try {
            await navigator.share({
              title: "我的位置",
              text: baseMessage,
              url: mapUrl,
            });
            showToast(`分享成功 — 來源: ${tag}`);
          } catch (err2) {
            if (
              err2 &&
              (err2.name === "AbortError" || err2.name === "NotAllowedError")
            ) {
              showToast("使用者取消分享", "info");
            } else {
              console.error("分享失敗，改為複製到剪貼簿:", err2);
              await copyToClipboard(fullText, "分享失敗，但位置已複製到剪貼簿");
            }
          }
        } else {
          await copyToClipboard(fullText, "位置與地標資訊已複製！");
        }

        return;
      } finally {
        setIsSharing(false);
      }
    }

    // 若完全沒有既有座標，則強制等待高精度定位結果後再分享
    setIsSharing(true);
    showToast("正在取得精準位置...", "success");

    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const newData = await getUserLocationWeather({
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
        isSilent: false,
        highAccuracy: true,
        timeout: 15000,
      });

      const lat = (newData && newData.lat) || pos.coords.latitude;
      const lng = (newData && newData.lon) || pos.coords.longitude;
      const landmark = (newData && newData.landmark) || "";

      const composed = await buildShareText(
        lat,
        lng,
        landmark,
        (newData && newData.locationName) || userWeather.locationName,
        (newData && newData.isGeneric) || false,
      );
      const { baseMessage, fullText, tag } = composed;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "我的位置",
            text: baseMessage,
            url: `https://www.google.com/maps?q=${lat},${lng}`,
          });
          showToast(`分享成功 — 來源: ${tag}`);
        } catch (err) {
          if (
            err &&
            (err.name === "AbortError" || err.name === "NotAllowedError")
          ) {
            showToast("使用者取消分享", "info");
          } else {
            console.error("分享失敗，改為複製到剪貼簿:", err);
            await copyToClipboard(fullText, "分享失敗，但位置已複製到剪貼簿");
          }
        }
      } else {
        await copyToClipboard(fullText, "位置與地標資訊已複製！");
      }
    } catch (err) {
      console.error("分享取得位置失敗:", err);
      showToast("無法取得精準位置", "error");
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    return () => {
      // 組件卸載時立即停止語音與 API 請求，避免記憶體洩漏或狀態更新錯誤
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
      if (mapsAbortControllerRef.current) {
        mapsAbortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isVerified) return;

    const controller = new AbortController();
    let cancelled = false;

    const loadCachedForecast = () => {
      try {
        const cached = localStorage.getItem("trip_weather_forecast");
        if (cached) {
          const parsed = JSON.parse(cached);
          setWeatherForecast({ ...parsed, loading: false });
          debugLog("📦 已載入 Day1~6 天氣快取");
        }
      } catch (e) {
        console.error("讀取天氣快取失敗", e);
      }
    };

    loadCachedForecast();

    const fetchWeather = async () => {
      try {
        const params = `hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weathercode,uv_index,uv_index_clear_sky,wind_speed_10m,wind_gusts_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,uv_index_clear_sky_max,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,sunrise,sunset&forecast_days=7&timezone=auto`;

        const weatherPromises = tripConfig.locations.map(async (loc) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&${params}`;
          const res = await fetch(url, { signal: controller.signal });
          const data = await res.json();

          if (data.error) {
            console.error(`Weather API error for ${loc.key}:`, data.reason);
            return { key: loc.key, data: null };
          }

          if (!cancelled && data.timezone) {
            setAutoTimeZone(data.timezone);
          }
          return {
            key: loc.key,
            data: {
              ...data.daily,
              hourly: data.hourly,
            },
          };
        });

        const results = await Promise.all(weatherPromises);

        if (cancelled) return;

        const newForecast = {};
        results.forEach((item) => {
          newForecast[item.key] = item.data;
        });

        localStorage.setItem(
          "trip_weather_forecast",
          JSON.stringify(newForecast),
        );

        setWeatherForecast({
          ...newForecast,
          loading: false,
        });
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("Failed to fetch weather:", error);
        setWeatherForecast((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchWeather();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isVerified]);

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

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current = null;
          setListeningLang(null);
        } catch (error) {
          console.error("清理語音識別資源時出錯:", error);
        }
      }
    };
  }, []);

  const toggleListening = (lang) => {
    if (!recognitionRef.current) {
      alert("抱歉，您的瀏覽器不支援語音輸入功能。");
      return;
    }

    try {
      if (listeningLang === lang) {
        recognitionRef.current.stop();
        setListeningLang(null);
      } else {
        if (listeningLang) {
          recognitionRef.current.stop();
        }
        setInputMessage("");
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setListeningLang(lang);
      }
    } catch (error) {
      console.error("語音識別操作出錯:", error);
      setListeningLang(null);
      showToast("語音輸入出現問題，請重試", "error");
    }
  };

  const LANGUAGE_SPECS = {
    "ja-JP": {
      checkRegex: /[\u3040-\u309F\u30A0-\u30FF]/,
      cleanStrategy: "removeBrackets",
    },
    "th-TH": {
      checkRegex: /[\u0E00-\u0E7F]/,
      cleanStrategy: "keepOnlyMatches",
    },
    "ko-KR": {
      checkRegex: /[\uAC00-\uD7AF\u1100-\u11FF]/,
      cleanStrategy: "removeBrackets",
    },
    "vi-VN": {
      checkRegex: /[a-zA-Z\u00C0-\u1EF9]/,
      cleanStrategy: "removeBrackets",
    },
  };

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

    const shouldTryForeign = configLangCode !== "zh-TW";

    const spec = LANGUAGE_SPECS[configLangCode] || {
      checkRegex: /.*/,
      cleanStrategy: "removeBrackets",
    };

    if (shouldTryForeign) {
      if (spec.cleanStrategy === "keepOnlyMatches") {
        const matches = textToSpeak.match(new RegExp(spec.checkRegex, "g"));
        if (matches) textToSpeak = matches.join(" ");
      } else {
        textToSpeak = textToSpeak.replace(/\s*[()（].*?[)）]/g, "");
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (shouldTryForeign) {
      utterance.lang = configLangCode;
      if (targetVoice) {
        utterance.voice = targetVoice;
      } else {
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
      if (e.error !== "interrupted") {
        showToast("語音播放失敗，請檢查手機設定", "error");
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const fetchGooglePlaces = async (lat, lng, initialRadius = 100) => {
    const performSearch = async (radius) => {
      const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radius}`;
      const cached = googlePlacesCacheRef.current[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        return cached.data;
      }

      if (!mapsApiKey) return null;

      const url = `https://places.googleapis.com/v1/places:searchNearby`;
      const validTypes = [
        "restaurant",
        "cafe",
        "convenience_store",
        "tourist_attraction",
        "park",
        "store",
        "lodging",
        "transit_station",
        "museum",
        "shopping_mall",
      ];

      const body = {
        includedTypes: validTypes,
        maxResultCount: 1,
        locationRestriction: {
          circle: {
            center: { latitude: Number(lat), longitude: Number(lng) },
            radius: Number(radius),
          },
        },
        languageCode: "zh-TW",
      };

      try {
        if (mapsAbortControllerRef.current)
          mapsAbortControllerRef.current.abort();
        mapsAbortControllerRef.current = new AbortController();

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": mapsApiKey,
            "X-Goog-FieldMask": "places.displayName,places.addressDescriptor",
          },
          body: JSON.stringify(body),
          signal: mapsAbortControllerRef.current.signal,
        });

        if (!res.ok) return null;

        const data = await res.json();
        let foundName = "";

        if (data.places && data.places.length > 0) {
          const firstPlace = data.places[0];
          const landmarks = firstPlace.addressDescriptor?.landmarks;
          // 優先取地標描述，次取店名
          foundName =
            landmarks?.[0]?.displayName?.text ||
            firstPlace.displayName?.text ||
            "";
        }

        if (foundName) {
          googlePlacesCacheRef.current[cacheKey] = {
            data: foundName,
            timestamp: Date.now(),
          };
        }
        return foundName;
      } catch (error) {
        if (error.name === "AbortError") return null;
        console.error(`❌ [Maps API] 錯誤:`, error);
        return null;
      }
    };

    // 2. 核心重試邏輯
    // 第一跳：嘗試精準半徑 (預設 100m)
    let placeName = await performSearch(initialRadius);

    // 第二跳：如果沒結果，且初次搜尋半徑小於 300m，則擴大範圍再試一次
    if (!placeName && initialRadius < 300) {
      debugLog(`🔍 [Maps API] ${initialRadius}m 無結果，擴大至 300m 重試...`);
      placeName = await performSearch(300);
    }

    return placeName || "";
  };

  // --- Gemini API Safe Call Function (New Implementation + AbortController) ---
  const callGeminiSafe = async (payload) => {
    // 使用解密後的 Key，如果沒有則使用空字串 (會失敗)
    const currentKey = apiKey;

    const maxRetries = 3;
    let attempt = 0;
    // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${currentKey}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;

    while (attempt < maxRetries) {
      try {
        // 🆕 中止上一個未完成的 Gemini API 請求
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

        // 處理流量限制 (429) 或服務暫時不可用 (503)
        if (response.status === 429 || response.status === 503) {
          console.warn(
            `API 忙碌中，嘗試進行指數退避... (嘗試 ${attempt + 1}/${maxRetries})`,
          );
          attempt++;
          // 指數退避：2s, 4s, 8s... 避免短時間內重複請求加重伺服器負擔
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
        // 中止請求通常是使用者切換頁面或手動停止，不視為錯誤
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

  // --- 周邊地標輔助：直接呼叫 Google Maps API ---
  const getBestPOI = async (latitude, longitude) => {
    if (!mapsApiKey) {
      debugLog("🗺️ [Google Maps] 略過：未設定 API Key");
      return null;
    }

    try {
      debugLog(
        `🗺️ [Google Maps] 查詢周邊 POI... (Lat: ${latitude}, Lng: ${longitude})`,
      );
      // 預設搜尋半徑 100m，優先尋找最接近的具體地標
      const places = await fetchGooglePlaces(latitude, longitude, 100);
      debugLog("🗺️ [Google Maps] API 回傳結果:", places);

      if (places) {
        debugLog(`🗺️ [Google Maps] 找到最佳地標: "${places}"`);
        return { name: places, source: "maps-direct" };
      }
    } catch (e) {
      console.warn("getBestPOI 執行失敗:", e);
    }
    return null;
  };

  // --- 建立分享文字 (決策核心) ---
  const buildShareText = async (
    latitude,
    longitude,
    currentLandmark,
    locationName,
    isGeneric,
  ) => {
    debugGroup("🚀 [分享流程決策樹]");
    debugLog("1. 狀態輸入:", {
      landmark: currentLandmark || "(無)",
      isGeneric: isGeneric,
      city: locationName,
    });

    let finalLandmark = currentLandmark || "";
    let tag = currentLandmark ? "Street(OSM)" : "Unknown";

    // 決策邏輯：若 OSM 提供的地標為空，或是被判定為通用路名 (isGeneric)，則呼叫 Google Maps 補強
    if (!finalLandmark || isGeneric === true) {
      debugLog("2. 判定需要補強 (無地標或僅有路名)，呼叫 Google Maps...");

      const poi = await getBestPOI(latitude, longitude);

      if (poi && poi.name) {
        finalLandmark = poi.name;
        tag = "POI(GoogleMaps)";
        debugLog("3. Google Maps 救援成功！更新為:", finalLandmark);

        // 同步更新 UI 上的地標資訊，讓使用者看到更精準的結果
        setUserWeather((prev) => ({
          ...prev,
          landmark: finalLandmark,
          isGeneric: false,
        }));
      } else {
        debugLog("3. Google Maps 無結果，維持 OSM 路名。");
      }
    } else {
      debugLog("2. OSM 已是精準地標，跳過 Google Maps。");
    }

    debugLog(`🏁 [最終輸出] Landmark: "${finalLandmark}"`);
    debugGroupEnd();

    const { baseMessage, fullText } = buildShareTextLogic(
      latitude, 
      longitude, 
      finalLandmark, 
      locationName
    );
    return {
      baseMessage,
      fullText,
      finalLandmark,
      tag, // tag 保留在主組件處理，因為它與 POI 來源狀態有關
    };
  };

  const handleSwitchMode = (newMode) => {
    if (aiMode === newMode) return;
    setAiMode(newMode);

    // 切換模式時載入對應的對話紀錄，確保上下文連貫
    const saved = localStorage.getItem(getStorageKey(newMode));
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([getAiWelcomeTemplate(newMode, tripConfig)]);
    }
  };

  // --- 測試模式觸發邏輯 (彩蛋) ---
  const handleTitleClick = () => {
    if (testModeClickCount === 0) {
      setTestModeClickCount(1);
    } else if (testModeClickCount < 9) {
      setTestModeClickCount(testModeClickCount + 1);
    } else if (testModeClickCount === 9) {
      setTestModeClickCount(10);
      showToast("🩷", "success");
    }
  };

  const handleInterruptClick = () => {
    if (testModeClickCount > 0) {
      setTestModeClickCount(0);
      showToast("連續點擊計數已重置", "info");
    }
  };

  const handleLockButtonClick = () => {
    // 若已達成彩蛋條件，則進入測試模式；否則執行正常的登出/鎖定
    if (testModeClickCount === 10) {
      setTestDateTime(new Date());
      setTestLatitude(userWeather?.lat || 35.6762);
      setTestLongitude(userWeather?.lon || 139.6503);
      setTestWeatherOverride({ overview: null, days: {} });
      setIsTestMode(true);
      setTestModeClickCount(0);
      showToast("🩷 進入測試模式！", "success");
    } else {
      setIsVerified(false);
      localStorage.removeItem("trip_password");
    }
  };

  const handleClearChat = () => {
    if (
      window.confirm(
        `確定要清除「${aiMode === "translate" ? "口譯" : "導遊"}」的所有紀錄嗎？`,
      )
    ) {
      const resetMsg = getAiWelcomeTemplate(aiMode, tripConfig);
      setMessages([resetMsg]);
      localStorage.removeItem(getStorageKey(aiMode));
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const tz = autoTimeZone || tripConfig.timeZone || "Asia/Taipei";
    const displayTime = isTestMode ? testDateTime : new Date();
    const localTimeStr = displayTime.toLocaleString("zh-TW", {
      timeZone: tz,
      hour12: false,
    });

    const userMsg = {
      role: "user",
      text: inputMessage,
      image: selectedImage,
    };

    // 根據模式設定隨機的 Loading 提示，增加互動感
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
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // 將內部訊息格式轉換為 Gemini API 要求的格式 (支援多模態)
      const formatToGeminiPart = (msg) => {
        const parts = [];

        if (msg.text && msg.text.trim()) {
          parts.push({ text: msg.text });
        } else if (!msg.image) {
          parts.push({ text: "" });
        }

        if (msg.image) {
          const [meta, data] = msg.image.split(",");
          const mimeType = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: data,
            },
          });
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
        // 導遊模式：結合 GPS 位置、行程表與參考指南
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
      setMessages((prev) => [...prev, { role: "model", text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      let errMsg = "連線發生錯誤或是系統忙碌中，請稍後再試。";
      if (error.message.includes("Key"))
        errMsg = "API Key 錯誤，請檢查加密設定。";
      if (error.message.includes("413"))
        errMsg = "圖片檔案過大，請試著縮小圖片後再傳送。";

      setMessages((prev) => [...prev, { role: "model", text: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 天氣狀態判定 ---
  const current = activeDay === -1 ? null : itineraryData[activeDay];
  // 固定傳給 DayMap 的 events 參考，避免每次 render 觸發額外 fetch
  const dayMapEvents = React.useMemo(
    () => (current?.events ? current.events : []),
    [current?.events],
  );
  const currentLocation = getDailyLocationKey(activeDay, itineraryData, tripConfig);

  // 使用 useMemo 鎖定天氣資料，優化滑動效能並處理測試模式覆蓋
  const displayWeather = React.useMemo(() => {
    const currentLocation = getDailyLocationKey(activeDay, itineraryData, tripConfig);
    const weatherData = weatherForecast[currentLocation];
    const effectiveWeatherOverride =
      frozenTestWeatherOverride || testWeatherOverride;

    if (!weatherForecast.loading && weatherData && weatherData.time) {
      const dayIndex = activeDay === -1 ? 0 : activeDay;
      const forecastIndex = dayIndex < weatherData.time.length ? dayIndex : 0;
      const maxTemp = Math.round(weatherData.temperature_2m_max[forecastIndex]);
      const minTemp = Math.round(weatherData.temperature_2m_min[forecastIndex]);

      let weatherCode;
      if (isTestMode) {
        if (activeDay === -1) {
          weatherCode =
            effectiveWeatherOverride.overview !== null
              ? effectiveWeatherOverride.overview
              : weatherData.weathercode[forecastIndex];
        } else {
          weatherCode =
            effectiveWeatherOverride.days[activeDay] !== undefined
              ? effectiveWeatherOverride.days[activeDay]
              : weatherData.weathercode[forecastIndex];
        }
      } else {
        weatherCode = weatherData.weathercode[forecastIndex];
      }

      const info = getWeatherInfo(weatherCode);

      return {
        icon: info.icon,
        temp: `${minTemp}°C / ${maxTemp}°C`,
        desc: info.text,
        advice: info.advice,
        code: weatherCode,
      };
    }

    return {
      icon: <Cloud className="w-7 h-7 text-stone-300" />,
      temp: "--",
      desc: weatherForecast.loading ? "載入中..." : "無資料",
      advice: weatherForecast.loading ? "請稍候" : "無法取得預報，請稍後再試",
    };
  }, [
    activeDay,
    weatherForecast,
    getWeatherInfo,
    isTestMode,
    testWeatherOverride,
    frozenTestWeatherOverride,
  ]);

  // 統一主題風格，根據天氣狀況動態調整環境色
  const theme = React.useMemo(() => {
    const currentCode =
      activeDay === -1 ? userWeather.weatherCode : displayWeather.code;
    const sky = getSkyCondition(currentCode);

    const ambientColors = {
      clear: isDarkMode
        ? currentTheme.ambientColors.clear.dark
        : currentTheme.ambientColors.clear.light,
      cloudy: isDarkMode
        ? currentTheme.ambientColors.cloudy.dark
        : currentTheme.ambientColors.cloudy.light,
      rain: isDarkMode
        ? currentTheme.ambientColors.rain.dark
        : currentTheme.ambientColors.rain.light,
      snow: isDarkMode
        ? currentTheme.ambientColors.snow.dark
        : currentTheme.ambientColors.snow.light,
      thunderstorm: isDarkMode
        ? currentTheme.ambientColors.thunderstorm.dark
        : currentTheme.ambientColors.thunderstorm.light,
      fog: isDarkMode
        ? currentTheme.ambientColors.fog.dark
        : currentTheme.ambientColors.fog.light,
    };

    const ambient = ambientColors[sky] || ambientColors.clear;

    return {
      bg: isDarkMode
        ? `${currentTheme.bgGradientDark} bg-[image:var(--bg-texture)] bg-fixed`
        : `${currentTheme.bgGradientLight} bg-[image:var(--bg-texture)] bg-fixed`,

      text: isDarkMode
        ? currentTheme.textColors?.dark || `text-${cBase}-100`
        : currentTheme.textColors?.light || `text-${cBase}-800`,

      textSec: isDarkMode
        ? currentTheme.textColors?.secDark || `text-${cBase}-300`
        : currentTheme.textColors?.secLight || `text-${cBase}-600`,

      cardBg: isDarkMode
        ? currentTheme.glassColors.card.dark
        : currentTheme.glassColors.card.light,

      // 邊框
      cardBorder: isDarkMode ? `border-white/10` : `border-${cBase}-200/40`,

      // 陰影系統（分層次）
      cardShadow: isDarkMode
        ? "shadow-2xl shadow-black/40"
        : `shadow-xl shadow-${cBase}-500/5`,

      // 額外陰影層級
      shadowSm: isDarkMode
        ? "shadow-sm shadow-black/30"
        : "shadow-sm shadow-stone-200/50",
      shadowMd: isDarkMode
        ? "shadow-lg shadow-black/35"
        : `shadow-md shadow-${cBase}-300/30`,
      shadowLg: isDarkMode
        ? "shadow-2xl shadow-black/40"
        : `shadow-lg shadow-${cBase}-400/20`,
      shadowXl: isDarkMode
        ? "shadow-2xl shadow-black/50"
        : `shadow-xl shadow-${cBase}-500/25`,

      // 強調色
      accent: isDarkMode ? `text-${cAccent}-300` : `text-${cAccent}-600`,
      accentBg: isDarkMode ? `bg-${cAccent}-500/20` : `bg-${cAccent}-100`,

      // 導覽列
      navBg: isDarkMode
        ? currentTheme.glassColors.nav.dark
        : currentTheme.glassColors.nav.light,

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

      // 環境色樣式
      ambientStyle: { backgroundColor: ambient },
    };
  }, [
    isDarkMode,
    cBase,
    cAccent,
    currentTheme,
    activeDay,
    userWeather.weatherCode,
    displayWeather.code,
  ]);

  // Weather detail payload for the new page/component
  const detailWeatherData = React.useMemo(() => {
    if (activeDay === -1) {
      const desc =
        userWeather?.desc ||
        (userWeather?.weatherCode != null
          ? getWeatherData(userWeather.weatherCode)?.text
          : "");
      return userWeather
        ? { ...userWeather, desc, loading: userWeather.loading }
        : null;
    }

    const locKey = getDailyLocationKey(activeDay, itineraryData, tripConfig);
    const forecast = weatherForecast[locKey];
    if (!forecast) return null;

    const code = forecast.weathercode?.[activeDay] ?? forecast.weathercode?.[0];
    const info = code != null ? getWeatherData(code) : null;
    const locName =
      tripConfig.locations.find((l) => l.key === locKey)?.name || locKey;

    return {
      temp:
        forecast.temperature_2m_max?.[activeDay] ??
        forecast.temperature_2m_max?.[0] ??
        null,
      desc: info?.text || "",
      locationName: locName,
      weatherCode: code,
      hourly: forecast.hourly,
      daily: forecast,
      loading: weatherForecast.loading,
    };
  }, [
    activeDay,
    userWeather,
    weatherForecast,
  ]);

  const weatherDetailLoading =
    !isAppReady ||
    (activeDay === -1 ? userWeather?.loading : weatherForecast.loading);

  // --- 鎖定畫面渲染 (未驗證密碼時) ---
  if (!isVerified) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden ${isDarkMode ? currentTheme.mainBg.dark : currentTheme.mainBg.light}`}
      >
        {/* 背景裝飾：使用模糊圓形營造層次感 */}
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
              請輸入通關密語以解鎖並解密 API Key
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
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium animate-shake">
                {authError}
              </div>
            )}
          </form>

          {/* 加密工具：供開發者或首次使用者生成加密字串 */}
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
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      setKeyType("gemini");
                      setToolResult("");
                    }}
                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
                      keyType === "gemini"
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-gray-400"
                    }`}
                  >
                    1. Gemini Key
                  </button>
                  <button
                    onClick={() => {
                      setKeyType("maps");
                      setToolResult("");
                    }}
                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
                      keyType === "maps"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-gray-400"
                    }`}
                  >
                    2. Maps Key
                  </button>
                </div>

                <p className={`text-xs font-bold mb-2 ${theme.text}`}>
                  {keyType === "gemini"
                    ? "輸入 Google Gemini API Key (AIza...):"
                    : "輸入 Google Maps Places API Key (AIza...):"}
                </p>

                <input
                  type="text"
                  placeholder={
                    keyType === "gemini"
                      ? "貼上 Gemini Key..."
                      : "貼上 Maps Key..."
                  }
                  value={toolKey}
                  onChange={(e) => setToolKey(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-base ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-slate-300"}`}
                />
                <input
                  type="text"
                  placeholder="設定您的通關密碼"
                  value={toolPwd}
                  onChange={(e) => setToolPwd(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-base ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-slate-300"}`}
                />
                <button
                  onClick={generateEncryptedString}
                  className={`w-full py-2 rounded-xl text-xs font-bold text-white ${isDarkMode ? "bg-sky-600" : "bg-indigo-500"}`}
                >
                  生成加密字串
                </button>

                {toolResult && (
                  <div className="mt-2 animate-fadeIn">
                    <p className={`text-xs font-bold mb-1 ${theme.text}`}>
                      請複製下方字串到程式碼上方的變數：
                      <br />
                      <span className="text-indigo-500">
                        {keyType === "gemini"
                          ? "ENCRYPTED_API_KEY_PAYLOAD"
                          : "ENCRYPTED_MAPS_KEY_PAYLOAD"}
                      </span>
                    </p>
                    <div
                      className={`p-2 rounded border break-all font-mono text-xs select-all cursor-text ${isDarkMode ? "bg-neutral-900 border-neutral-700 text-green-400" : "bg-white border-slate-300 text-slate-600"}`}
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

  // --- 初始化載入畫面 (Splash Screen) ---
  // 當已解鎖但定位或初始資料尚未就緒時顯示
  if (!isAppReady) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 ${isDarkMode ? currentTheme.mainBg.dark : currentTheme.mainBg.light}`}
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div
            className={`absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob opacity-20 ${theme.blob1}`}
          ></div>
          <div
            className={`absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob animation-delay-4000 opacity-20 ${theme.blob3}`}
          ></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
          <div
            className={`p-4 rounded-full shadow-xl ${isDarkMode ? "bg-neutral-800" : "bg-white"}`}
          >
            <LocateFixed className={`w-8 h-8 animate-spin ${colors.blue}`} />
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

  // 決定當前應顯示的天氣特效代碼
  let currentEffectCode =
    activeDay === -1 ? userWeather.weatherCode : displayWeather.code;

  // 應用測試模式或凍結的天氣覆寫
  const effectiveWeatherOverride =
    frozenTestWeatherOverride || testWeatherOverride;
  if (activeDay === -1 && effectiveWeatherOverride.overview !== null) {
    currentEffectCode = effectiveWeatherOverride.overview;
  } else if (
    activeDay >= 0 &&
    effectiveWeatherOverride.days[activeDay] !== undefined
  ) {
    currentEffectCode = effectiveWeatherOverride.days[activeDay];
  }

  const particleType = getParticleType(currentEffectCode, isDarkMode);
  const skyCondition = getSkyCondition(currentEffectCode);
  const isDayTime = !isDarkMode;
  let dynamicBgStyle = {};

  const weatherColors = currentTheme.weatherColors;

  // 根據天氣狀況動態調整背景色，增強沉浸感
  if (isDayTime) {
    const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(
      currentEffectCode,
    );
    const isSnowing = [71, 73, 75, 77, 85, 86].includes(currentEffectCode);
    const isFoggy = [45, 48].includes(currentEffectCode);
    const isThunderstorm = [95, 96, 99].includes(currentEffectCode);
    const isCloudy = [1, 2, 3].includes(currentEffectCode);

    if (isThunderstorm) {
      dynamicBgStyle = { backgroundColor: currentTheme.dynamicBg.rain.dark };
    } else if (isRaining) {
      dynamicBgStyle = { backgroundColor: weatherColors.rain };
    } else if (isSnowing) {
      dynamicBgStyle = { backgroundColor: weatherColors.snow };
    } else if (isFoggy) {
      dynamicBgStyle = { backgroundColor: currentTheme.dynamicBg.rain.light };
    } else if (isCloudy) {
      dynamicBgStyle = { backgroundColor: currentTheme.dynamicBg.cloud };
    }
  }

  return (
    <div
      style={{ ...containerStyle, ...dynamicBgStyle }}
      className={`min-h-screen transition-colors duration-500 ${theme.bg} ${theme.text} relative overflow-hidden font-sans touch-pan-y`}
      onTouchStart={handleMainTouchStart}
      onTouchMove={handleMainTouchMove}
      onTouchEnd={handleMainTouchEnd}
    >
      {/* 下拉重新整理指示器 */}
      <div
        className="fixed top-0 left-0 w-full flex justify-center pointer-events-none z-[100] transition-opacity duration-300"
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: pullDistance > 20 ? 1 : 0,
        }}
      >
        <div
          className={`p-2 rounded-full shadow-lg backdrop-blur-md border ${theme.cardBg} ${theme.cardBorder}`}
        >
          <RotateCcw
            className={`w-5 h-5 ${theme.accent} ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>

      {/* 背景裝飾球：隨主題與天氣變換顏色 */}
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

      <style>{`
      @keyframes cloudFloat {
          from { transform: translateX(-100%); }
          to { transform: translateX(100vw); }
      }
      @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
      }
      @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
      }
      .animate-success-glow { animation: successGlow 0.8s ease-out; }
      .animate-slide-up { animation: slideUp 0.3s ease-out; }
      .animate-fadeInLeft { animation: fadeInLeft 0.2s ease-out; }
      .animate-slide-down { animation: slideDown 0.3s ease-out; }
      .animate-scale-in { animation: scaleIn 0.25s ease-out; }
      .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
      `}</style>

      <SkyObjects isDay={!isDarkMode} condition={skyCondition} />
      <WeatherParticles type={particleType} isDay={!isDarkMode} />
      {/* 雷雨時疊加雨滴特效 */}
      {particleType === "lightning" && (
        <WeatherParticles type="rain" isDay={!isDarkMode} />
      )}

      <div className="max-w-md mx-auto relative min-h-screen flex flex-col z-10">
        {/* 頂部標題與功能列 */}
        <div className="flex justify-between items-end px-4 pt-5 pb-2 relative z-20 gap-4">
          {/* 左側：行程標題 (點擊觸發測試模式彩蛋) */}
          <div
            className={`px-3 py-2.5 rounded-2xl backdrop-blur-md shadow-sm border transition-all duration-300 min-w-0 cursor-pointer select-none active:scale-95 ${theme.cardBg} ${theme.cardBorder}`}
            onClick={handleTitleClick}
          >
            <h1
              className={`text-base font-bold tracking-wide transition-colors whitespace-nowrap drop-shadow-sm ${theme.text}`}
              style={{
                textShadow: isDarkMode
                  ? "0 1px 2px rgba(0,0,0,0.5)"
                  : "0 1px 1px rgba(255,255,255,0.5)",
              }}
            >
              {tripConfig.title}
            </h1>
            <p
              className={`text-[10px] mt-0.5 font-medium tracking-widest whitespace-nowrap opacity-70 ${theme.textSec}`}
            >
              {tripConfig.subTitle}
            </p>
          </div>

          {/* 右側：功能按鈕與匯率卡片 */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLockButtonClick();
                }}
                className={`p-2 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 active:scale-90 ${theme.cardBg} ${theme.cardBorder} ${theme.accent}`}
                title={testModeClickCount === 10 ? "進入測試模式" : "鎖定行程"}
              >
                {testModeClickCount === 10 ? (
                  <Key className="w-4 h-4 fill-current text-pink-500 animate-bounce" />
                ) : (
                  <Lock className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInterruptClick();
                  toggleTheme();
                }}
                className={`p-2 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 active:scale-90 ${theme.cardBg} ${theme.cardBorder} ${theme.accent}`}
                aria-label={`切換到${isDarkMode ? "亮色" : "深色"}模式`}
              >
                {isDarkMode ? (
                  <Moon className="w-4 h-4 fill-current" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500 fill-current" />
                )}
              </button>
            </div>

            <CurrencyWidget
              isDarkMode={isDarkMode}
              theme={theme}
              rateData={rateData}
              isOnline={isOnline}
            />
          </div>
        </div>

        {/* --- 分頁內容 --- */}

        {/* 1. 行程分頁 (Itinerary Tab) */}
        {activeTab === "itinerary" && (
          <div
            className="flex-1 space-y-5 px-4 pb-32 overflow-x-hidden relative"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            ref={scrollContainerRef}
            // 應用 GPU 加速，確保在行動裝置上滑動順暢
            style={{
              willChange: "scroll-position",
              transform: "translateZ(0)",
              WebkitPerspective: "1000px",
              perspective: "1000px",
            }}
          >
            {/* 天數導覽列 */}
            <div
              ref={navContainerRef}
              className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide py-1 px-1 relative z-10"
            >
              <button
                ref={(el) => (navItemsRef.current[-1] = el)}
                onClick={() => changeDay(-1)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border backdrop-blur-2xl flex items-center gap-1.5 shadow-sm active:scale-95 hover:scale-105
                  ${
                    activeDay === -1
                      ? `${theme.accentBg} ${theme.accent} ${isDarkMode ? "border-white/10" : "border-white/20"} scale-105 shadow-md`
                      : `${theme.cardBg} ${theme.textSec} border-transparent hover:bg-black/5 hover:shadow-md`
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" /> 總覽
              </button>

              {itineraryData.map((data, index) => (
                <button
                  key={index}
                  ref={(el) => (navItemsRef.current[index] = el)}
                  onClick={() => changeDay(index)}
                  aria-label={`查看${data.day}`}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border backdrop-blur-2xl shadow-sm active:scale-95 hover:scale-105
                    ${
                      activeDay === index
                        ? `${theme.accentBg} ${theme.text} ${isDarkMode ? "border-white/10" : "border-white/20"} scale-105 shadow-md`
                        : `${theme.cardBg} ${theme.textSec} border-transparent hover:bg-black/5 hover:shadow-md`
                    }`}
                >
                  {data.day}
                </button>
              ))}
            </div>

            {/* Animation Wrapper */}
            {/* 🆕 優化：添加 GPU 加速容器用於毛玻璃過渡 */}
            <div
              className="relative w-full h-full"
              style={{
                // 強制 GPU 加速，確保 backdrop-filter 在動畫中穩定
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
                // 建立新的堆疊上下文，避免毛玻璃效果與其他元素衝突
                isolation: "isolate",
              }}
            >
              <AnimatePresence initial={false} custom={direction} mode="wait">
                {/* === 分支 1: 總覽頁面 (activeDay === -1) === */}
                {activeDay === -1 ? (
                  <motion.div
                    key="overview"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-5"
                  >
                    {/* --- 總覽頁面：即時天氣與預報卡片 --- */}
                    <div
                      className={`backdrop-blur-xl border rounded-[1.5rem] p-4 ${theme.cardShadow} transition-colors duration-300 relative overflow-hidden ${theme.cardBg} ${theme.cardBorder}`}
                      style={theme.ambientStyle}
                    >
                      {/* 上半部：目前天氣與地點資訊 */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-4">
                          {/* 目前氣溫 */}
                          <div
                            className={`text-5xl font-medium tracking-tighter drop-shadow-sm ${theme.text}`}
                            style={{
                              textShadow: isDarkMode
                                ? "0 2px 4px rgba(0,0,0,0.3)"
                                : "none",
                            }}
                          >
                            {userWeather.temp !== null
                              ? userWeather.temp
                              : "--"}
                            °
                          </div>

                          {/* 地點與天氣描述 */}
                          <div className="flex flex-col justify-center gap-0.5">
                            <div
                              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-90 ${theme.textSec}`}
                            >
                              <LocateFixed
                                className={`w-3.5 h-3.5 ${theme.accent}`}
                              />{" "}
                              <span className="flex items-center gap-1">
                                {userWeather.locationName}
                                <button
                                  onClick={() => setShowWeatherDetail(true)}
                                  className={`p-2 rounded-xl transition-all hover:scale-125 active:scale-95 ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/5 text-stone-400 hover:text-stone-600"}`}
                                  title="查看詳細氣象資訊"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span
                                className={`text-base font-bold leading-tight drop-shadow-sm ${theme.text}`}
                              >
                                {userWeather.desc || "載入中"}
                              </span>
                              <span
                                className={`text-xs font-medium mt-0.5 ${theme.textSec}`}
                              >
                                {userWeather.temp !== null
                                  ? `高溫:${userWeather.temp + 4}°  低溫:${userWeather.temp - 2}°`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 手動更新位置與天氣 */}
                        <button
                          onClick={() =>
                            getUserLocationWeather({
                              isSilent: false,
                              highAccuracy: false,
                            })
                          }
                          disabled={isUpdatingLocation}
                          className={`p-2 rounded-full border transition-all active:scale-95 flex-shrink-0 ${isUpdatingLocation ? "opacity-50" : ""} ${isDarkMode ? "bg-white/10 border-white/10 hover:bg-white/20 text-white" : "bg-black/5 border-black/5 hover:bg-black/10 text-stone-600"}`}
                        >
                          {isUpdatingLocation ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* 中間：每 2 小時預報 (緊湊版) */}
                      <div
                        className={`w-full overflow-x-auto pb-1 mb-1 scrollbar-hide`}
                      >
                        <div className="flex justify-between items-center px-0.5">
                          {[0, 2, 4, 6, 8, 10, 12].map((offset, i) => {
                            const displayTime = isTestMode
                              ? new Date(testDateTime)
                              : new Date();
                            const currentHour = displayTime.getHours();
                            const targetIndex = currentHour + offset;
                            const hourDataTemp =
                              userWeather.hourly?.temperature_2m?.[targetIndex];
                            const hourDataCode =
                              userWeather.hourly?.weathercode?.[targetIndex];
                            let timeLabel =
                              i === 0
                                ? "現在"
                                : `${(currentHour + offset) % 24}時`;
                            const icon =
                              hourDataCode !== undefined ? (
                                getWeatherInfo(hourDataCode).icon
                              ) : (
                                <Loader className="w-3.5 h-3.5 animate-spin opacity-50" />
                              );

                            return (
                              <div
                                key={i}
                                className="flex flex-col items-center gap-0.5 min-w-0 px-0.5 py-1 rounded-xl hover:bg-black/5 transition-colors group flex-1"
                              >
                                <span
                                  className={`text-[9px] font-bold opacity-70 group-hover:opacity-100 whitespace-nowrap ${theme.textSec}`}
                                >
                                  {timeLabel}
                                </span>

                                <div className="transform transition-transform group-hover:scale-110 drop-shadow-sm scale-90">
                                  {icon}
                                </div>

                                <span
                                  className={`text-xs font-bold ${theme.text}`}
                                >
                                  {hourDataTemp !== undefined
                                    ? `${Math.round(hourDataTemp)}°`
                                    : "--"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 下半部：智慧行程預報 (溫差比對與穿著建議) */}
                      <div
                        className={`mt-2 pt-2.5 border-t flex flex-col justify-center min-h-[36px] ${isDarkMode ? "border-white/15" : "border-black/5"}`}
                      >
                        {userWeather.temp !== null ? (
                          (() => {
                            let targetDayIndex = 0;
                            let targetName = "抵達首站";

                            if (tripStatus === "during") {
                              if (
                                currentTripDayIndex >=
                                itineraryData.length - 1
                              ) {
                                return (
                                  <p
                                    className={`text-xs text-center opacity-70 ${theme.textSec}`}
                                  >
                                    旅程即將圓滿結束 ✨
                                  </p>
                                );
                              }
                              targetDayIndex = currentTripDayIndex + 1;
                              targetName = "明天";
                            } else if (tripStatus === "before") {
                              targetDayIndex = 0;
                              const firstLocKey = getDailyLocationKey(0, itineraryData, tripConfig);
                              const locObj = tripConfig.locations.find(
                                (l) => l.key === firstLocKey,
                              );
                              targetName = locObj ? locObj.name : "首站";
                            } else {
                              return (
                                <p
                                  className={`text-xs text-center opacity-70 ${theme.textSec}`}
                                >
                                  旅程已結束
                                </p>
                              );
                            }

                            const targetLoc = getDailyLocationKey(targetDayIndex, itineraryData, tripConfig);
                            const forecast = weatherForecast[targetLoc];

                            if (!forecast || !forecast.temperature_2m_max) {
                              return (
                                <p
                                  className={`text-xs text-center opacity-70 ${theme.textSec}`}
                                >
                                  正在分析目的地天氣...
                                </p>
                              );
                            }

                            const destMax =
                              forecast.temperature_2m_max[targetDayIndex];
                            const destMin =
                              forecast.temperature_2m_min[targetDayIndex];
                            const destAvg = (destMax + destMin) / 2;
                            const destCode =
                              forecast.weathercode[targetDayIndex];

                            const diff = destAvg - userWeather.temp;
                            const absDiff = Math.abs(diff).toFixed(0);
                            const isColder = diff < 0;
                            const weatherInfo = getWeatherData(destCode);

                            let advicePart = "";
                            const isRainy = [
                              51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99,
                            ].includes(destCode);
                            const isSnowy = [71, 73, 75, 77, 85, 86].includes(
                              destCode,
                            );

                            if (Math.abs(diff) < 2) {
                              advicePart = "溫差不大，穿著可參考目前";
                            } else if (isColder) {
                              advicePart = "請加強保暖";
                            } else {
                              advicePart = "建議穿著輕便";
                            }

                            if (isRainy) advicePart += "並攜帶雨具";
                            else if (isSnowy) advicePart += "並穿著防滑鞋";

                            return (
                              <div className="flex items-center gap-2.5 animate-fadeIn">
                                <div
                                  className={`px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap tracking-wide ${isDarkMode ? "bg-white/10 text-neutral-300" : "bg-black/5 text-stone-600"}`}
                                >
                                  {targetName}
                                </div>

                                <p
                                  className={`text-xs leading-relaxed font-medium ${theme.textSec}`}
                                >
                                  天氣為
                                  <span
                                    className={`font-bold mx-0.5 ${theme.text}`}
                                  >
                                    {weatherInfo.text}
                                  </span>
                                  ， 氣溫比目前{isColder ? "低" : "高"}
                                  <span
                                    className={`mx-0.5 font-bold ${isColder ? "text-sky-400" : "text-orange-400"}`}
                                  >
                                    {absDiff}°C
                                  </span>
                                  ，{advicePart}。
                                </p>
                              </div>
                            );
                          })()
                        ) : (
                          <p
                            className={`text-xs text-center opacity-70 ${theme.textSec}`}
                          >
                            <Loader className="w-3 h-3 inline mr-1 animate-spin" />
                            定位中，稍後將為您比對溫差...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* --- 航班與緊急資訊卡片 --- */}
                    <FlightInfoCard 
                      isDarkMode={isDarkMode}
                      theme={theme}
                      colors={colors}
                      tripConfig={tripConfig}
                      isFlightInfoExpanded={isFlightInfoExpanded}
                      setIsFlightInfoExpanded={setIsFlightInfoExpanded}
                      handleCopy={handleCopy}
                    />

                    {/* --- 旅程狀態與檢查清單 --- */}
                    {tripStatus === "before" && (
                      <div
                        className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                        style={theme.ambientStyle}
                      >
                        <div className="text-center mb-5">
                          <div
                            className={`text-base font-bold mb-1 tracking-wide drop-shadow-sm ${theme.text}`}
                          >
                            距離{tripConfig.title}還有
                          </div>
                          <div
                            className={`text-5xl font-black tracking-tight drop-shadow-sm flex justify-center items-baseline gap-2 ${theme.accent}`}
                            style={{
                              textShadow: isDarkMode
                                ? "0 2px 4px rgba(0,0,0,0.3)"
                                : "none",
                            }}
                          >
                            {daysUntilTrip}{" "}
                            <span
                              className={`text-lg font-bold ${theme.textSec}`}
                            >
                              天
                            </span>
                          </div>
                        </div>
                        <ChecklistCard 
                          isDarkMode={isDarkMode}
                          theme={theme}
                          colors={colors}
                          initialData={checklistData} // 從 tripdata 引入的原始數據
                        />
                      </div>
                    )}

                    {/* --- 旅程狀態：旅途中 (顯示今日重點) --- */}
                    {tripStatus === "during" && currentTripDayIndex >= 0 && (
                      <div
                        className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                        style={theme.ambientStyle}
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
                            <h2
                              className={`text-2xl font-bold drop-shadow-sm ${theme.text}`}
                              style={{
                                textShadow: isDarkMode
                                  ? "0 2px 4px rgba(0,0,0,0.3)"
                                  : "none",
                              }}
                            >
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
                          {/* 今日主題卡片 */}
                          <div
                            className={`bg-gradient-to-r ${isDarkMode ? currentTheme.buttonGradients.primary.dark : currentTheme.buttonGradients.primary.light} text-white p-4 rounded-2xl shadow-lg relative overflow-hidden`}
                          >
                            <div className="relative z-10">
                              <h3 className="text-lg font-bold mb-1 drop-shadow-md">
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

                          {/* 今日亮點摘要 */}
                          <div
                            className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                          >
                            <h4
                              className={`text-xs font-bold mb-3 flex items-center gap-1.5 ${theme.textSec}`}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${colors.orange}`}
                              />{" "}
                              今日亮點快速導覽
                            </h4>
                            <div className="space-y-3">
                              {itineraryData[currentTripDayIndex].events
                                .filter((e) => e.highlights)
                                .slice(0, 3)
                                .map((e, i) => (
                                  <div
                                    key={i}
                                    className="flex gap-3 items-start"
                                  >
                                    <div
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${isDarkMode ? "bg-neutral-700 text-neutral-300" : "bg-stone-200 text-stone-600"}`}
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
                              onClick={() => changeDay(currentTripDayIndex)}
                              className={`w-full mt-4 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${isDarkMode ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-200" : "bg-stone-200 hover:bg-stone-300 text-stone-600"}`}
                            >
                              查看今日完整行程{" "}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- 旅程狀態：旅程結束 (回顧) --- */}
                    {tripStatus === "after" && (
                      <div
                        className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                        style={theme.ambientStyle}
                      >
                        <div className="text-center mb-5">
                          <div className="p-3.5 bg-amber-100/30 rounded-full w-14 h-14 mx-auto flex items-center justify-center mb-3 border border-amber-200/50">
                            <History className="w-7 h-7 text-amber-500" />
                          </div>
                          <h2
                            className={`text-xl font-bold drop-shadow-sm ${theme.text}`}
                            style={{
                              textShadow: isDarkMode
                                ? "0 2px 4px rgba(0,0,0,0.3)"
                                : "none",
                            }}
                          >
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
                            <MapPin className={`w-4 h-4 ${colors.pink}`} />{" "}
                            足跡回顧
                          </h3>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {(tripConfig.tripHighlights || []).map(
                                (spot, i) => (
                                  <span
                                    key={i}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border shadow-sm ${isDarkMode ? "bg-neutral-700 border-neutral-600 text-neutral-300" : "bg-white border-stone-200 text-stone-600"}`}
                                  >
                                    {spot}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  // === 分頁：每日行程詳情 (activeDay >= 0) ===
                  <motion.div
                    key={`day-${activeDay}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-5"
                  >
                    {current && (
                      <>
                        {/* 該日天氣預報卡片 */}
                        <div
                          className={`backdrop-blur-xl border rounded-3xl p-5 ${theme.cardShadow} flex items-center justify-between relative overflow-hidden transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                          style={theme.ambientStyle}
                        >
                          <div className="relative z-10">
                            <div
                              className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 uppercase tracking-wide ${theme.textSec}`}
                            >
                              <Calendar className="w-3.5 h-3.5" /> 
                              <span className="flex items-center gap-1">
                                {tripConfig.locations.find(
                                  (l) => l.key === currentLocation,
                                )?.name || "當地"}
                                <button
                                  onClick={() => setShowWeatherDetail(true)}
                                  className={`p-2 rounded-xl transition-all hover:scale-125 active:scale-95 ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/5 text-stone-400 hover:text-stone-600"}`}
                                  title="查看詳細氣象資訊"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-2.5 rounded-full shadow-inner ${isDarkMode ? "bg-black/30" : "bg-white/40"}`}
                              >
                                <motion.div
                                  key={`${activeDay}-${displayWeather.desc}`}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                ></motion.div>
                                {displayWeather.icon}
                              </div>
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span
                                    className={`text-2xl font-bold drop-shadow-sm ${theme.text}`}
                                    style={{
                                      textShadow: isDarkMode
                                        ? "0 1px 2px rgba(0,0,0,0.3)"
                                        : "none",
                                    }}
                                  >
                                    {displayWeather.temp.split("/")[0]}
                                  </span>
                                  <span className={`text-sm ${theme.textSec}`}>
                                    /
                                  </span>
                                  <span
                                    className={`text-2xl font-bold drop-shadow-sm ${theme.text}`}
                                    style={{
                                      textShadow: isDarkMode
                                        ? "0 1px 2px rgba(0,0,0,0.3)"
                                        : "none",
                                    }}
                                  >
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

                        {/* 行程內容主卡片 */}
                        <div
                          className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] relative transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                          style={theme.ambientStyle}
                        >
                          {/* 標題與日期 */}
                          <div
                            className={`mb-5 border-b pb-4 ${isDarkMode ? "border-neutral-700/50" : "border-stone-200/50"}`}
                          >
                            <div
                              className={`text-xs font-semibold mb-1.5 flex items-center gap-2 ${theme.textSec}`}
                            >
                              <span
                                className={`px-2.5 py-0.5 rounded-xl ${isDarkMode ? "bg-neutral-800" : "bg-white/50"}`}
                              >
                                {current.date}
                              </span>
                            </div>
                            <h2
                              className={`text-2xl font-extrabold mb-2 leading-tight drop-shadow-sm ${theme.text}`}
                              style={{
                                textShadow: isDarkMode
                                  ? "0 2px 4px rgba(0,0,0,0.3)"
                                  : "none",
                              }}
                            >
                              {current.title}
                            </h2>

                            {/* 住宿資訊 (附 Google Maps 連結) */}
                            {!current.stay.includes("溫暖的家") && (
                              <div
                                className={`text-xs font-medium flex items-center gap-1.5 mt-2 ${theme.textSec}`}
                              >
                                <Hotel
                                  className={`w-3.5 h-3.5 ${theme.accent}`}
                                />
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(current.stay.split("(")[0])}`}
                                  className={`hover:underline underline-offset-2 ${isDarkMode ? "hover:text-sky-300" : "hover:text-[#5D737E]"}`}
                                  title="在 Google Maps 開啟導航"
                                >
                                  {current.stay}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* 時間軸事件列表 */}
                          <div className="space-y-3.5 relative">
                            {/* 垂直時間軸虛線 */}
                            <div
                              className={`absolute left-[35px] top-10 bottom-10 w-0.5 border-l-2 border-dashed ${isDarkMode ? "border-white/10" : "border-black/10"} z-0`}
                            />
                            {current.events.map((event, idx) => {
                              const isTransport =
                                event.title.includes("交通") ||
                                !!event.transport;
                              const isOpen =
                                expandedItems[`${activeDay}-${idx}`];
                              return (
                                <div
                                  key={idx}
                                  className={`group rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden relative z-10
                                    ${
                                      isTransport
                                        ? isDarkMode
                                          ? "bg-neutral-900/20 border-transparent opacity-80 scale-[0.96] mx-4"
                                          : "bg-stone-100/40 border-transparent opacity-80 scale-[0.96] mx-4"
                                        : isDarkMode
                                          ? "bg-neutral-800/30 border-white/5 hover:bg-neutral-800/50"
                                          : "bg-white/60 border-white/20 hover:bg-white/80 hover:shadow-md"
                                    }`}
                                >
                                  {/* 事件標題列 (點擊展開) */}
                                  <div
                                    className={`${isTransport ? "p-3" : "p-4"} flex gap-4 cursor-pointer`}
                                    onClick={() => toggleExpand(activeDay, idx)}
                                  >
                                    <div className="flex flex-col items-center pt-1">
                                      <div
                                        className={`${isTransport ? "w-8 h-8 rounded-xl" : "w-10 h-10 rounded-2xl"} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105
                                        ${
                                          event.title.includes("交通")
                                            ? isDarkMode
                                              ? currentTheme.tagColors.food.dark
                                              : currentTheme.tagColors.food
                                                  .light
                                            : isDarkMode
                                              ? currentTheme.tagColors.transport
                                                  .dark
                                              : currentTheme.tagColors.transport
                                                  .light
                                        }`}
                                      >
                                        {React.cloneElement(event.icon, {
                                          className: isTransport
                                            ? "w-4 h-4"
                                            : "w-5 h-5",
                                        })}
                                      </div>
                                    </div>

                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div
                                            className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full ${isDarkMode ? "bg-neutral-700/50 text-neutral-400" : "bg-stone-100 text-stone-500"}`}
                                          >
                                            <Clock className="w-2.5 h-2.5" />{" "}
                                            {event.time}
                                          </div>
                                          {/* 標題與地圖連結 */}
                                          <div className="flex items-center gap-2 mb-1">
                                            <h3
                                              className={`${isTransport ? "text-sm" : "text-base"} font-bold leading-tight ${theme.text}`}
                                            >
                                              {event.title}
                                            </h3>
                                            {!isTransport && (
                                              <a
                                                href={getMapLink(
                                                  event.mapQuery || event.title,
                                                )}
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                className={`p-2 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 ${isDarkMode ? "bg-neutral-700 border-neutral-600 text-sky-300 hover:bg-neutral-600" : "bg-white border-stone-200 text-[#3B5998] hover:bg-blue-50"}`}
                                                title="在 Google Maps 查看"
                                              >
                                                <MapPin className="w-3.5 h-3.5" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                        {isOpen ? (
                                          <ChevronUp
                                            className={`w-4 h-4 ${theme.textSec}`}
                                          />
                                        ) : (
                                          <ChevronDown
                                            className={`w-4 h-4 ${theme.textSec}`}
                                          />
                                        )}
                                      </div>
                                      <p
                                        className={`text-xs leading-relaxed ${theme.textSec}`}
                                      >
                                        {event.desc}
                                      </p>

                                      {/* 未展開時顯示交通方式簡述 */}
                                      {!isOpen && event.transport && (
                                        <div
                                          className={`mt-2.5 flex items-center gap-1.5 text-xs w-fit px-2.5 py-1 rounded-xl border ${isDarkMode ? currentTheme.tagColors.food.dark + " border-emerald-800/30" : currentTheme.tagColors.food.light + " border-[#E2E8D5]"}`}
                                        >
                                          <Train className="w-3 h-3" />
                                          <span className="font-medium">
                                            {event.transport.mode}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 展開後的詳細資訊 (交通、亮點、提醒)
                                  </div>

                                  {/* 展開後的詳細資訊 (交通、亮點、提醒) */}
                                  {isOpen && (
                                    <div
                                      className={`px-5 pb-5 pt-1 space-y-3 border-t ${isDarkMode ? "bg-black/20 border-neutral-700" : "bg-white/40 border-stone-200/50"}`}
                                    >
                                      {event.transport && (
                                        <div
                                          className={`mt-2 p-3 rounded-xl border ${isDarkMode ? currentTheme.tagColors.food.dark + " border-emerald-800/30" : currentTheme.tagColors.food.light + " border-[#E2E8D5]"}`}
                                        >
                                          <h4
                                            className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${isDarkMode ? "text-emerald-400" : "text-[#556B2F]"}`}
                                          >
                                            <Train className="w-3.5 h-3.5" />{" "}
                                            交通詳情
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
                                              <span>
                                                {event.transport.duration}
                                              </span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span
                                                className={`${theme.textSec} min-w-[30px]`}
                                              >
                                                路線
                                              </span>{" "}
                                              <span>
                                                {event.transport.route}
                                              </span>
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
                                            <Star className="w-3.5 h-3.5" />{" "}
                                            必玩 / 必吃
                                          </h4>
                                          <ul className="space-y-1.5 pl-1">
                                            {event.highlights.map((item, i) => (
                                              <li
                                                key={i}
                                                className={`text-[11px] flex gap-2 items-start leading-relaxed ${theme.textSec}`}
                                              >
                                                <span
                                                  className={`${colors.pink} mt-1`}
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
                                            <Info className="w-3.5 h-3.5" />{" "}
                                            溫馨提醒
                                          </h4>
                                          <ul className="space-y-1.5 pl-1">
                                            {event.tips.map((item, i) => (
                                              <li
                                                key={i}
                                                className={`text-[11px] flex gap-2 items-start leading-relaxed ${theme.textSec}`}
                                              >
                                                <span
                                                  className={`${colors.orange} mt-1`}
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

                          {/* --- 當日路線地圖與導航 --- */}
                          {current.routeInfo && (
                            <div
                              className={`mt-6 backdrop-blur-md rounded-2xl border p-4 shadow-sm transition-colors ${isDarkMode ? "bg-neutral-800/30 border-neutral-700" : "bg-white/40 border-stone-200"}`}
                            >
                              <div className="flex items-center gap-2 mb-2.5">
                                <div
                                  className={`p-1.5 rounded-xl ${theme.accentBg}`}
                                >
                                  <Map className={`w-4 h-4 ${theme.accent}`} />
                                </div>
                                <h3
                                  className={`text-sm font-bold ${theme.text}`}
                                >
                                  當日路線導航
                                </h3>
                              </div>

                              {/* 互動式地圖組件 */}
                              <Suspense
                                fallback={
                                  <div
                                    className={`h-64 rounded-xl border flex items-center justify-center text-xs font-semibold animate-pulse ${isDarkMode ? "bg-neutral-900/30 border-neutral-800 text-neutral-400" : "bg-white/60 border-stone-200 text-stone-500"}`}
                                  >
                                    地圖載入中…
                                  </div>
                                }
                              >
                                <DayMap
                                  events={dayMapEvents}
                                  userLocation={userWeather}
                                  isDarkMode={isDarkMode}
                                  theme={theme}
                                  onModalToggle={setIsMapModalOpen}
                                />
                              </Suspense>

                              <div className="flex flex-col gap-3 mt-4">
                                {/* 路線摘要說明 */}
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

                                {/* 外部導航連結 */}
                                <a
                                  href={current.routeInfo.mapUrl}
                                  className={`flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 bg-gradient-to-r ${isDarkMode ? currentTheme.buttonGradients.primary.dark : currentTheme.buttonGradients.primary.light}`}
                                >
                                  <Navigation className="w-4 h-4" />
                                  開啟 Google Maps 查看路線
                                </a>
                              </div>
                            </div>
                          )}

                          {/* --- 當日特別提醒 (如：預約時間、票券) --- */}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* --- 頁籤：實用指南 (Guides Tab) --- */}
        {activeTab === "guides" && (
          <div className="flex-1 px-4 pb-32 space-y-5 animate-fadeIn">
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
              style={theme.ambientStyle}
            >
              <h2
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
                style={{
                  textShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
                }}
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
                {guidesData && guidesData.length > 0 ? (
                  guidesData.map((guide, idx) => {
                    const isGuideOpen = expandedGuides[idx];
                    return (
                      <div
                        key={idx}
                        className={`backdrop-blur-2xl border rounded-2xl ${theme.cardShadow} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 transform ${theme.cardBg} ${theme.cardBorder}`}
                      >
                        {/* 指南標題列 (點擊展開) */}
                        <div
                          className="flex items-center gap-3 p-4 cursor-pointer"
                          onClick={() => toggleGuide(idx)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isGuideOpen}
                          aria-controls={`guide-${idx}-content`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleGuide(idx);
                            }
                          }}
                        >
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-inner ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-stone-100"}`}
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

                        {/* 展開後的詳細內容 */}
                        {isGuideOpen && (
                          <div
                            id={`guide-${idx}-content`}
                            className="px-5 pb-5 animate-fadeIn"
                          >
                            <p
                              className={`text-sm mb-4 leading-relaxed ${theme.textSec}`}
                            >
                              {guide.summary}
                            </p>

                            {/* 操作步驟 */}
                            <div
                              className={`rounded-xl p-3.5 my-3 border ${isDarkMode ? "bg-black/20 border-neutral-700" : "bg-[#F9F9F6] border-stone-200"}`}
                            >
                              <h4
                                className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                              >
                                <FileText className="w-3.5 h-3.5" /> 操作重點
                              </h4>
                              <ol
                                className={`list-decimal list-inside text-sm space-y-2 pl-1 ${theme.textSec} ${isDarkMode ? "marker:text-sky-300" : `marker:${colors.blue}`} marker:font-bold`}
                              >
                                {guide.steps.map((step, i) => (
                                  <li key={i} className="leading-relaxed pl-1">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* 相關連結與部落格教學 */}
                            <div className="space-y-3">
                              <a
                                href={guide.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full text-center text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${isDarkMode ? currentTheme.tagColors.transport.dark + " hover:bg-sky-900/30" : currentTheme.tagColors.transport.light + " hover:bg-[#D0E0FC]"}`}
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
                                        className={`flex items-center gap-2 text-xs transition-colors p-1.5 rounded-xl ${isDarkMode ? "text-neutral-400 hover:text-sky-300 hover:bg-neutral-700/50" : "text-stone-500 hover:text-[#3B5998] hover:bg-stone-100"}`}
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
                  })
                ) : (
                  <div
                    className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}
                  >
                    <BookOpen
                      className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                    />
                    <p className={`text-sm font-medium ${theme.textSec}`}>
                      暫無參考指南
                    </p>
                    <p
                      className={`text-xs mt-1 ${isDarkMode ? "text-neutral-600" : "text-stone-400"}`}
                    >
                      敬請期待更多內容
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
              style={theme.ambientStyle}
            >
              <h2
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
                style={{
                  textShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
                }}
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
                {usefulLinks && usefulLinks.length > 0 ? (
                  usefulLinks.map((section, idx) => (
                    <div key={idx}>
                      <h3
                        className={`text-xs font-bold mb-2.5 px-3 py-1.5 rounded-xl w-fit border ${isDarkMode ? "text-blue-300 bg-blue-900/20 border-blue-800/30" : "text-[#3B5998] bg-[#E8F0FE] border-blue-100"}`}
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
                            className={`flex items-center gap-3 p-4 backdrop-blur-2xl border rounded-2xl ${theme.cardShadow} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-98 group ${theme.cardBg} ${theme.cardBorder}`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner group-hover:scale-105 transition-transform ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-stone-100"}`}
                            >
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <div
                                className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${theme.text} ${isDarkMode ? "group-hover:text-sky-300" : "group-hover:text-[#5D737E]"}`}
                              >
                                {item.title}
                                <ExternalLink
                                  className={`w-3 h-3 ${theme.textSec}`}
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
                  ))
                ) : (
                  <div
                    className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}
                  >
                    <LinkIcon
                      className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                    />
                    <p className={`text-sm font-medium ${theme.textSec}`}>
                      暫無實用連結
                    </p>
                    <p
                      className={`text-xs mt-1 ${isDarkMode ? "text-neutral-600" : "text-stone-400"}`}
                    >
                      敬請期待更多內容
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 頁籤：商家導覽 (Shops Tab) --- */}
        {activeTab === "shops" && (
          <div className="flex-1 px-4 pb-32 space-y-5 animate-fadeIn">
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
              style={theme.ambientStyle}
            >
              <h2
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
                style={{
                  textShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
                }}
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
                {shopGuideData && shopGuideData.length > 0 ? (
                  shopGuideData.map((areaData, idx) => {
                    const isShopOpen = expandedShops[idx];
                    return (
                      <div
                        key={idx}
                        className={`backdrop-blur-2xl border rounded-2xl ${theme.cardShadow} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 transform ${theme.cardBg} ${theme.cardBorder}`}
                      >
                        {/* 區域標題列 (點擊展開) */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => toggleShop(idx)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isShopOpen}
                          aria-controls={`shop-${idx}-content`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleShop(idx);
                            }
                          }}
                        >
                          <div>
                            <h3
                              className={`text-base font-bold ${theme.accent}`}
                            >
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
                            <ChevronDown
                              className={`w-4 h-4 ${theme.textSec}`}
                            />
                          )}
                        </div>

                        {/* 展開後的商家列表 */}
                        {isShopOpen && (
                          <div
                            id={`shop-${idx}-content`}
                            className="px-5 pb-5 animate-fadeIn"
                          >
                            <p className={`text-sm mb-4 ${theme.textSec}`}>
                              {areaData.desc}
                            </p>

                            {/* 重點商家 (行程相關) */}
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
                                            className={`text-[11px] px-1.5 py-0.5 rounded-xl border shadow-sm ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-white text-stone-500 border-stone-200"}`}
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

                            {/* 特別推薦 (如：童裝、文具) */}
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
                                              className={`text-[11px] px-1.5 py-0.5 rounded-xl border shadow-sm ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-white text-stone-500 border-stone-200"}`}
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

                            {/* 周邊連鎖店 (便利商店、咖啡廳) */}
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
                                    className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm transition-all ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-sky-300 hover:border-sky-800" : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-[#5D737E] hover:border-[#5D737E]/30"}`}
                                  >
                                    <span className="font-bold">
                                      {chain.name}
                                    </span>
                                    <span
                                      className={`text-xs border-l pl-2 ${isDarkMode ? "border-neutral-600 text-neutral-500" : "text-stone-400 border-stone-200"}`}
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
                  })
                ) : (
                  <div
                    className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}
                  >
                    <Store
                      className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                    />
                    <p className={`text-sm font-medium ${theme.textSec}`}>
                      暫無商家資訊
                    </p>
                    <p
                      className={`text-xs mt-1 ${isDarkMode ? "text-neutral-600" : "text-stone-400"}`}
                    >
                      敬請期待更多內容
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 頁籤：AI 導遊 (AI Tab) --- */}
        {activeTab === "ai" && (
          <div className="flex-1 px-4 pb-32 space-y-5 flex flex-col h-[calc(100vh-130px)] animate-fadeIn">
            <div
              className={`backdrop-blur-2xl border rounded-[2rem] shadow-xl flex-1 flex flex-col overflow-hidden max-w-full transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
            >
              {/* 對話視窗標題與模式切換 */}
              <div
                className={`p-4 border-b backdrop-blur-2xl flex flex-col gap-3 ${isDarkMode ? "bg-neutral-800/60 border-neutral-700" : "bg-white/60 border-stone-200/50"}
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
                    {/* 模式頭像：隨導遊/口譯模式切換顏色與圖示 */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-500
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

                    <div>
                      <h2
                        className={`text-base font-bold transition-colors duration-300 ${theme.text}`}
                      >
                        {aiMode === "translate" ? "AI 隨身口譯" : "AI 專屬導遊"}
                      </h2>
                      <p
                        className={`text-xs flex items-center gap-1.5 ${theme.textSec}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-pulse 
                            ${aiMode === "translate" ? "bg-blue-500" : "bg-orange-500"}`}
                        ></span>
                        {aiMode === "translate" ? "雙向翻譯中" : "行程助手待命"}

                        {isSpeaking && (
                          <span className="ml-2 text-amber-600 font-bold flex items-center bg-amber-50 px-2 py-0.5 rounded-full">
                            <Volume2 className="w-3 h-3 mr-1" /> 朗讀中...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 清除紀錄按鈕 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearChat}
                      className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                        isDarkMode
                          ? "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                          : "bg-stone-100 border-stone-200 text-stone-400 hover:text-red-500 hover:bg-red-50"
                      }`}
                      title="清除聊天紀錄"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 模式切換開關 */}
                  <div
                    className={`flex p-1 rounded-xl border ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-stone-100 border-stone-200"}`}
                  >
                    <button
                      onClick={() => handleSwitchMode("guide")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${aiMode === "guide" ? (isDarkMode ? "bg-neutral-700 text-white shadow-sm" : "bg-white text-stone-800 shadow-sm") : isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                    >
                      導遊
                    </button>
                    <button
                      onClick={() => handleSwitchMode("translate")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${aiMode === "translate" ? (isDarkMode ? "bg-sky-700 text-white shadow-sm" : "bg-white text-sky-600 shadow-sm") : isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                    >
                      口譯
                    </button>
                  </div>
                </div>

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
                />
              </Suspense>

              {/* 快速建議問題：根據當前模式動態切換 */}
              <div
                className={`px-4 py-3 border-t flex gap-2.5 overflow-x-auto scrollbar-hide backdrop-blur-2xl ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/60 border-stone-200/50"}`}
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
                    className={`flex-shrink-0 text-xs px-3 py-2 rounded-full border shadow-sm transition-all ${isDarkMode ? "bg-neutral-700/60 hover:bg-neutral-600 text-neutral-300 hover:text-sky-200 border-neutral-600" : "bg-white/80 hover:bg-[#F0F5E5] text-stone-600 hover:text-[#556B2F] border-stone-200"}`}
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
        )}

        {/* --- 頁籤：記帳/記事 (Finance Tab) --- */}
        {activeTab === "finance" && (
          <div className="flex-1 animate-fadeIn">
            <FinanceNote 
              isDarkMode={isDarkMode}
              theme={theme}
              rateData={rateData}        // 傳遞匯率資料
              gasUrl={gasUrl}            // 傳遞 GAS URL
              gasToken={gasToken}        // 傳遞 Token
              apiKey={apiKey}            // 傳遞 Gemini API Key
              setFullPreviewImage={setFullPreviewImage} // 複用 App.jsx 的圖片預覽遮罩
              showToast={showToast}      // 複用 Toast 提示
            />
          </div>
        )}

        {/* --- 底部導覽列 (Bottom Navigation) --- */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto">
          <div
            className={`flex items-center gap-1 px-2 py-2 rounded-full backdrop-blur-2xl border shadow-2xl transition-all duration-300
            ${
              isDarkMode
                ? `bg-${cBase}-900/60 border-white/10 shadow-black/50`
                : `bg-${cBase}-50/60 border-white/20 shadow-${cBase}-500/10`
            }`}
          >
            {/* 1. 行程 (Itinerary) */}
            <button
              onClick={() => {
                handleInterruptClick();
                setActiveTab("itinerary");
              }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group backdrop-blur-md border
                ${
                  activeTab === "itinerary"
                    ? isDarkMode
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/20 shadow-[0_0_15px_rgba(0,0,0,0.2)] -translate-y-0.5`
                      : `bg-white/60 text-${cBase}-700 border-white/20 shadow-md -translate-y-0.5`
                    : isDarkMode
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20`
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <Home
                className={`w-5 h-5 ${activeTab === "itinerary" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "itinerary" && (
                <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
              )}
            </button>

            {/* 2. 指南 (Guides) */}
            <button
              onClick={() => {
                handleInterruptClick();
                setActiveTab("guides");
              }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border
                ${
                  activeTab === "guides"
                    ? isDarkMode
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/20 shadow-[0_0_15px_rgba(0,0,0,0.2)] -translate-y-0.5`
                      : `bg-white/60 text-${cBase}-700 border-white/20 shadow-md -translate-y-0.5`
                    : isDarkMode
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20`
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <BookOpen
                className={`w-5 h-5 ${activeTab === "guides" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "guides" && (
                <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
              )}
            </button>

            {/* 3. AI 核心按鈕 (使用查表法確保 Tailwind 類名完整) */}
            <button
              onClick={() => {
                handleInterruptClick();
                setActiveTab("ai");
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
                setActiveTab("shops");
              }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border
                ${
                  activeTab === "shops"
                    ? isDarkMode
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/20 shadow-[0_0_15px_rgba(0,0,0,0.2)] -translate-y-0.5`
                      : `bg-white/60 text-${cBase}-700 border-white/20 shadow-md -translate-y-0.5`
                    : isDarkMode
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20`
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <Store
                className={`w-5 h-5 ${activeTab === "shops" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "shops" && (
                <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
              )}
            </button>

            {/* 5. 連結 (Resources) */}
            {/* <button
              onClick={() => {
                handleInterruptClick();
                setActiveTab("resources");
              }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border
                ${
                  activeTab === "resources"
                    ? isDarkMode
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/20 shadow-[0_0_15px_rgba(0,0,0,0.2)] -translate-y-0.5`
                      : `bg-white/60 text-${cBase}-700 border-white/20 shadow-md -translate-y-0.5`
                    : isDarkMode
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20`
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <LinkIcon
                className={`w-5 h-5 ${activeTab === "resources" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "resources" && (
                <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
              )}
            </button> */}
            {/* 5. 記帳 (Finance) */}
            <button
              onClick={() => {
                handleInterruptClick();
                setActiveTab("finance");
              }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border
                ${
                  activeTab === "finance"
                    ? isDarkMode
                      ? `bg-${cBase}-800/50 text-sky-400 border-${cBase}-600/20 shadow-[0_0_15px_rgba(0,0,0,0.2)] -translate-y-0.5`
                      : `bg-white/60 text-sky-600 border-white/20 shadow-md -translate-y-0.5`
                    : isDarkMode
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20`
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <DollarSign // 記得在 lucide-react import 加入 DollarSign
                className={`w-5 h-5 ${activeTab === "finance" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "finance" && (
                <span className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]"></span>
              )}
            </button>
          </div>
        </div>

        {/* 分享位置按鈕 (透明度優化) */}
        <button
          onClick={handleShareLocation}
          title={`分享位置（來源：${locationSource === "cache" ? "快取" : locationSource === "low" ? "低精度" : locationSource === "high" ? "高精度" : "未知"}）`}
          aria-label={`分享位置（來源：${locationSource === "cache" ? "快取" : locationSource === "low" ? "低精度" : locationSource === "high" ? "高精度" : "未知"}）`}
          aria-busy={isSharing}
          aria-disabled={isSharing}
          disabled={isSharing}
          className={`fixed bottom-60 right-5 w-12 h-12 backdrop-blur-md border rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-all opacity-60 hover:opacity-100 ${isSharing ? "opacity-80 pointer-events-none scale-95" : ""}
            ${
              hasLocationPermission === false
                ? "border-red-400 text-red-500 animate-pulse hover:bg-red-50"
                : locationSource === "cache"
                  ? "border-red-400 text-red-500 hover:bg-red-50"
                  : locationSource === "low"
                    ? "border-sky-400 text-sky-600 hover:bg-sky-50"
                    : locationSource === "high"
                      ? "border-emerald-400 text-emerald-600 hover:bg-emerald-50"
                      : isDarkMode
                        ? "bg-neutral-800/40 border-neutral-600 text-sky-300 hover:bg-neutral-800/90"
                        : "bg-white/40 border-stone-200 text-[#5D737E] hover:bg-white/90"
            }`}
        >
          {isSharing ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <LocateFixed className="w-6 h-6" />
          )}
        </button>

        {/* 計算機按鈕 (僅行動裝置顯示) */}
        {isMobile && (
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className={`fixed bottom-[19rem] right-5 w-12 h-12 backdrop-blur-md border rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-all opacity-60 hover:opacity-100
              ${
                isDarkMode
                  ? "bg-neutral-800/40 border-neutral-600 text-neutral-200 hover:bg-neutral-800/90"
                  : "bg-white/40 border-stone-200 text-[#5D737E] hover:bg-white/90"
              }`}
            aria-label="開啟計算機"
          >
            <Calculator className="w-6 h-6" />
          </button>
        )}

        {/* 匯率計算機彈窗 */}
        <CalculatorModal
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
          isDarkMode={isDarkMode}
          rateData={rateData}
          currencyCode={tripConfig.currency.code}
          currencyTarget={tripConfig.currency.target}
        />

        {/* 測試模式面板 (開發與測試用) */}
        <TestModePanel
          isOpen={isTestMode}
          onClose={() => setIsTestMode(false)}
          testDateTime={testDateTime}
          onDateTimeChange={(newDateTime) => {
            console.log(
              `🧪 更新時間: ${testDateTime.toLocaleString("zh-TW")} -> ${newDateTime.toLocaleString("zh-TW")}`,
            );
            setTestDateTime(newDateTime);
          }}
          testLatitude={testLatitude}
          testLongitude={testLongitude}
          onLocationChange={(coords) => {
            console.log(
              `🧪 更新位置: (${testLatitude}, ${testLongitude}) -> (${coords.lat}, ${coords.lon})`,
            );
            setTestLatitude(coords.lat);
            setTestLongitude(coords.lon);
            // 測試模式下主動抓取新座標的天氣
            getUserLocationWeather({
              isSilent: false,
              coords: { latitude: coords.lat, longitude: coords.lon },
            });
          }}
          testWeatherOverride={testWeatherOverride}
          onWeatherChange={(newOverride) => {
            console.log(
              `🧪 更新天氣覆蓋: `,
              testWeatherOverride,
              ` -> `,
              newOverride,
            );
            setTestWeatherOverride(newOverride);
          }}
          theme={theme}
          isDarkMode={isDarkMode}
          itineraryData={itineraryData}
          currentUserWeather={userWeather}
          isFrozen={!!frozenTestDateTime || !!frozenTestWeatherOverride}
          onFreeze={freezeTestSettings}
          onUnfreeze={unfreezeTestSettings}
        />

        {/* Toast 通知提示 */}
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

        {/* 圖片放大預覽遮罩 */}
        <AnimatePresence>
          {fullPreviewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullPreviewImage(null)}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={fullPreviewImage}
                  alt="Full Preview"
                  className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullPreviewImage(null);
                  }}
                  className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 圖片上傳確認視窗 */}
        <AnimatePresence>
          {tempImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative max-w-full max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              >
                <img
                  src={tempImage}
                  alt="Check Preview"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </motion.div>

              <p className="text-white/70 text-sm mt-6 mb-8 font-medium tracking-wide">
                照片清楚嗎？請確認是否使用此圖片
              </p>

              <div className="flex gap-6 w-full max-w-xs">
                <button
                  onClick={handleCancelImage}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" /> 取消
                </button>
                <button
                  onClick={handleConfirmImage}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-sky-600 text-white shadow-lg shadow-sky-900/20 hover:bg-sky-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> 確認使用
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 天氣詳情彈窗 (Weather Detail Modal) */}
        {showWeatherDetail && detailWeatherData && (
          <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div
              className="absolute inset-0"
              onClick={() => setShowWeatherDetail(false)}
            />

            <div className="relative z-10 w-full max-w-[400px]">
              <WeatherDetail
                weather={detailWeatherData}
                activeDay={activeDay}
                simulatedDate={
                  frozenTestDateTime || (isTestMode ? testDateTime : new Date())
                }
                loading={weatherDetailLoading}
                isDarkMode={isDarkMode}
                theme={currentTheme}
                onClose={() => setShowWeatherDetail(false)}
                onRefresh={() => {
                  if (activeDay === -1) {
                    getUserLocationWeather({ isSilent: false });
                  } else {
                    showToast("已更新預報資訊");
                  }
                }}
                advice={(() => {
                  if (!userWeather?.temp || !detailWeatherData.temp)
                    return null;
                  const targetTemp =
                    detailWeatherData.daily?.temperature_2m_max?.[0] ||
                    detailWeatherData.temp;
                  const diff = targetTemp - userWeather.temp;
                  const absDiff = Math.abs(diff).toFixed(0);
                  const isColder = diff < 0;
                  const code = detailWeatherData.weatherCode;

                  const isRainy = [
                    51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99,
                  ].includes(code);
                  const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);

                  let extraAdvice = "建議穿著輕便";
                  if (isColder && absDiff > 3) extraAdvice = "請加強保暖";
                  if (isRainy) extraAdvice += "並攜帶雨具";
                  if (isSnowy) extraAdvice += "並穿著防滑鞋";

                  return (
                    <>
                      天氣為 <b>{detailWeatherData.desc}</b>， 氣溫比目前
                      {isColder ? "低" : "高"}{" "}
                      <b style={{ color: isColder ? "#007aff" : "#ff9500" }}>
                        {absDiff}°C
                      </b>
                      ，{extraAdvice}。
                    </>
                  );
                })()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryApp;
