// 概述：ItineraryApp 主介面與互動邏輯
// 功能：狀態管理、定位/天氣、語音與朗讀、行程呈現、UI 控制
// 說明：本次優化僅更新註解與排版，不更動核心流程。
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
} from "lucide-react";
import {
  itineraryData,
  guidesData,
  usefulLinks,
  shopGuideData,
  tripConfig,
  checklistData,
} from "./tripdata_2026_karuizawa.jsx";
// 有時 ESLint 會誤判 JSX 中的 `motion` 為未使用，為避免噪音先在此行暫時抑制該檢查
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

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

// --- 加密 Key 區域 ---
// 1) Gemini API Key
const ENCRYPTED_API_KEY_PAYLOAD = (
  import.meta.env.VITE_ENCODED_KEY || ""
).trim();

// 2) Google Maps API Key
// 請使用下方加密工具生成後貼上
const ENCRYPTED_MAPS_KEY_PAYLOAD = (
  import.meta.env.VITE_ENCODED_MAPS_KEY || ""
).trim();

// 環境檢查和除錯工具
const isDev = import.meta.env.DEV; // Vite 環境變量：開發環境為 true

// 條件性日誌：僅在開發環境輸出
const debugLog = (message, data = null) => {
  if (isDev) {
    if (data === null) {
      console.log(message);
    } else {
      console.log(message, data);
    }
  }
};

// 條件性日誌分組
const debugGroup = (label) => {
  if (isDev) console.group(label);
};

const debugGroupEnd = () => {
  if (isDev) console.groupEnd();
};

// 簡單的延遲函式
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 🆕 Weather Background Effect Component ---
// 定義 CSS 動畫樣式 (注入到頁面中) - 保持不變
const WeatherStyles = React.memo(() => (
  <style>{`
    @keyframes fall {
      0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(110vh) translateX(20px); opacity: 0; }
    }
    @keyframes drift {
      from { transform: translateX(-100%); }
      to { transform: translateX(100vw); }
    }
    /* 🌟 新增：光斑浮動動畫 (緩慢、隨機感) */
    @keyframes bokeh-float {
      0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
      33% { transform: translate(30px, -50px) scale(1.1); opacity: 0.6; }
      66% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.3; }
      100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    .weather-particle { position: absolute; pointer-events: none; }
    
    .rain-drop {
      width: 2px;
      height: 20px;
      animation: fall 0.8s linear infinite;
    }
    
    .snow-flake {
      width: 8px;
      height: 8px; 
      border-radius: 50%;
      filter: blur(1px);
      animation: fall 3s linear infinite;
    }
    
    .cloud-shape {
      border-radius: 50%;
      animation: drift 60s linear infinite;
    }
    
    /* ☀️ 光斑樣式 */
    .bokeh-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px); /* 高度模糊 */
      animation: bokeh-float 20s infinite ease-in-out;
      mix-blend-mode: overlay; /* 讓光斑與背景融合 */
    }
    
    .star {
      position: absolute;
      background: white;
      border-radius: 50%;
      filter: blur(0.5px);
      animation: twinkle 3s infinite ease-in-out;
    }
  `}</style>
));

WeatherStyles.displayName = 'WeatherStyles';

  const WeatherBackground = ({ weatherCode, isDarkMode }) => {
  const [particles, setParticles] = useState({
    stars: [],
    rainDrops: [],
    snowFlakes: [],
    bokehOrbs: [] // 新增光斑陣列
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const newStars = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        width: Math.random() > 0.5 ? '2px' : '3px',
        height: Math.random() > 0.5 ? '2px' : '3px',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 50}%`,
        delay: `${Math.random() * 3}s`,
        opacity: Math.random() * 0.7 + 0.3
      }));

      const newRainDrops = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * -20}%`,
        duration: `${0.5 + Math.random() * 0.3}s`,
        delay: `${Math.random() * 2}s`
      }));

      const newSnowFlakes = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * -20}%`,
        duration: `${3 + Math.random() * 4}s`,
        delay: `${Math.random() * 5}s`,
        opacityBase: Math.random() * 0.4 + 0.6, 
        opacityLight: Math.random() * 0.5 + 0.5 
      }));

      // 🌟 生成 4 個隨機光斑 (取代原本的 sun-ray)
      const newBokehOrbs = Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        width: `${30 + Math.random() * 40}vw`, // 大小隨機 (30-70vw)
        height: `${30 + Math.random() * 40}vw`,
        left: `${Math.random() * 80}%`,
        top: `${Math.random() * 60}%`,
        animationDelay: `${Math.random() * -10}s`, // 隨機開始時間
        duration: `${15 + Math.random() * 10}s` // 隨機速度
      }));

      setParticles({
        stars: newStars,
        rainDrops: newRainDrops,
        snowFlakes: newSnowFlakes,
        bokehOrbs: newBokehOrbs
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const getType = (code) => {
    if (code === null || code === undefined) return null;
    if (code === 0) return 'clear';
    if ([1, 2, 3, 45, 48].includes(code)) return 'cloud';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return 'rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    return null;
  };

  const type = getType(weatherCode);
  if (!type) return null;

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 ${isDarkMode ? 'dark-mode' : ''}`}>
      <WeatherStyles />
      
      {/* === ☀️/🌙 晴朗特效：改用光斑 (Bokeh) === */}
      {type === 'clear' && (
        <>
          {/* 光斑層：日夜皆有，顏色不同 */}
          {particles.bokehOrbs.map((orb) => (
            <div
              key={orb.id}
              className="bokeh-orb"
              style={{
                width: orb.width,
                height: orb.height,
                left: orb.left,
                top: orb.top,
                animationDelay: orb.animationDelay,
                animationDuration: orb.duration,
                // 日間：暖金/橙色 | 夜間：冷銀/藍色
                background: isDarkMode 
                  ? 'radial-gradient(circle, rgba(180, 200, 255, 0.15) 0%, rgba(255,255,255,0) 70%)' 
                  : 'radial-gradient(circle, rgba(255, 200, 100, 0.4) 0%, rgba(255, 150, 50, 0.1) 60%, rgba(255,255,255,0) 70%)'
              }}
            />
          ))}

          {/* 夜間專屬：星星 (疊加在光斑之上) */}
          {isDarkMode && particles.stars.map((s) => (
            <div
              key={s.id}
              className="star"
              style={{
                width: s.width,
                height: s.height,
                left: s.left,
                top: s.top,
                animationDelay: s.delay,
                opacity: s.opacity
              }}
            />
          ))}
        </>
      )}

      {/* === ☁️ 多雲特效 === */}
      {type === 'cloud' && (
        <>
           <div 
             className="cloud-shape w-[70vw] h-[70vw] top-[5%]" 
             style={{ 
               animationDuration: '55s', 
               animationDelay: '-5s',
               background: isDarkMode 
                 ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)' 
                 : 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
               filter: isDarkMode ? 'none' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.05))'
             }} 
           />
           <div 
             className="cloud-shape w-[90vw] h-[90vw] top-[25%]" 
             style={{ 
               animationDuration: '70s', 
               animationDelay: '-25s',
               background: isDarkMode 
                 ? 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)' 
                 : 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)'
             }} 
           />
        </>
      )}

      {/* === 🌧️ 下雨特效 === */}
      {type === 'rain' && particles.rainDrops.map((r) => (
        <div
          key={r.id}
          className="weather-particle rain-drop"
          style={{
            left: r.left,
            top: r.top,
            animationDuration: r.duration,
            animationDelay: r.delay,
            background: isDarkMode 
               ? 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.8))' 
               : 'linear-gradient(to bottom, transparent, #3B82F6)' 
          }}
        />
      ))}

      {/* === ❄️ 下雪特效 === */}
      {type === 'snow' && particles.snowFlakes.map((s) => (
        <div
          key={s.id}
          className="weather-particle snow-flake"
          style={{
            left: s.left,
            top: s.top,
            animationDuration: s.duration,
            animationDelay: s.delay,
            opacity: isDarkMode ? s.opacityBase : s.opacityLight,
            background: isDarkMode ? 'rgba(255,255,255,0.9)' : '#CBD5E1', 
            boxShadow: isDarkMode ? '0 0 4px rgba(255,255,255,0.5)' : 'none'
          }}
        />
      ))}
    </div>
  );
};

// 使用 React.memo 優化 WeatherBackground，避免不必要的重新渲染
const MemoizedWeatherBackground = React.memo(WeatherBackground, (prevProps, nextProps) => {
  // 只在 weatherCode 或 isDarkMode 改變時才重新渲染
  return prevProps.weatherCode === nextProps.weatherCode && 
         prevProps.isDarkMode === nextProps.isDarkMode;
});

MemoizedWeatherBackground.displayName = 'WeatherBackground';

const ItineraryApp = () => {
  // --- Security State ---
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState(""); // Gemini Key
  const [mapsApiKey, setMapsApiKey] = useState(""); // 🆕 Maps Key
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showEncryptTool, setShowEncryptTool] = useState(false); // 控制加密工具顯示
  const [fullPreviewImage, setFullPreviewImage] = useState(null); // 儲存目前放大的圖片 URL 或 Base64
  const scrollContainerRef = useRef(null);
  const [loadingText, setLoadingText] = useState(""); // 用來顯示隨機載入文字
  const [autoTimeZone, setAutoTimeZone] = useState("Asia/Taipei"); // 預設時區為台北
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  // 防止圖片放大時背景捲動
  useEffect(() => {
    if (fullPreviewImage) {
      // 當圖片放大時，鎖定背景滾動
      document.body.style.overflow = "hidden";
    } else {
      // 當關閉放大時，恢復背景滾動
      document.body.style.overflow = "";
    }

    // 元件卸載時的清理邏輯，確保不會永久鎖定
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullPreviewImage]);

  // 初始化定位完成狀態：有快取即視為完成，否則顯示啟動畫面
  const [isAppReady, setIsAppReady] = useState(() => {
    const cached = localStorage.getItem("cached_user_weather");
    return !!cached; // 有快取為 true，無快取為 false（顯示啟動畫面）
  });

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
  const [keyType, setKeyType] = useState("gemini"); // 用來切換要加密哪種 Key

  // --- 輔助函式：解析 Markdown 粗體與 URL 連結 ---
  // 先預先建立關鍵字 Set 與安全的 Regex，避免每次渲染反覆組裝大型字串
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const { keywordsSet, combinedRegex } = React.useMemo(() => {
    const allKeywordsRaw = [
      ...itineraryData.flatMap((day) => day.events.map((e) => e.title)),
      ...shopGuideData.flatMap((area) => area.mainShops.map((s) => s.name)),
    ];
    const filtered = allKeywordsRaw.filter((k) => k && k.length >= 2);
    const set = new Set(filtered);
    // 將每個關鍵字進行 Regex 逃脫，避免像 ( ), +, ? 等符號造成誤判
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

      // 1. 處理 URL
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

      // 💡 2. 處理行程關鍵字：點擊直接開地圖
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

      // 3. 處理粗體
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

  // 輔助函式：處理圖片選擇
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // 限制最長邊為 1600px，這在 Gemini 辨識與流量間取得了極佳平衡
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

        // 使用 jpeg 格式並設定 0.8 的品質，能顯著壓縮檔案體積但保留細節
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        setTempImage(compressedBase64);
      };
    };
    reader.readAsDataURL(file);
  };

  // 輔助函式：移除圖片
  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 定義一個強大的複製函式（支援 fallback）
  const copyToClipboard = async (text, successMsg = "已複製到剪貼簿") => {
    try {
      // 優先使用 navigator.clipboard（現代瀏覽器）
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast(successMsg);
        return true;
      } else {
        // Fallback 到舊方法（某些舊瀏覽器或不安全上下文）
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

  // 定義一個簡單的複製函式（向後相容）
  const handleCopy = (text) => {
    copyToClipboard(text, `已複製：${text}`);
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
  // 從 Config 讀取設定，若無則使用預設值 (Memo 化，避免每次渲染重建物件)
  const currentTheme = React.useMemo(() => (
    tripConfig.theme || {
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
      textColors: tripConfig.theme?.textColors || undefined,
    }
  ), []);

  const cBase = currentTheme.colorBase; // e.g., "slate"
  const cAccent = currentTheme.colorAccent; // e.g., "sky"

  // 使用 useMemo 統一 Memo 風格，僅在 isDarkMode 變更時重建
  const theme = React.useMemo(() => ({
    // 背景
    bg: isDarkMode
      ? `${currentTheme.bgGradientDark} bg-[image:var(--bg-texture)] bg-fixed`
      : `${currentTheme.bgGradientLight} bg-[image:var(--bg-texture)] bg-fixed`,

    // 文字
    text: isDarkMode
      ? currentTheme.textColors?.dark || `text-${cBase}-100`
      : currentTheme.textColors?.light || `text-${cBase}-800`,

    textSec: isDarkMode
      ? currentTheme.textColors?.secDark || `text-${cBase}-400`
      : currentTheme.textColors?.secLight || `text-${cBase}-500`,

    // 🌟 卡片質感：夜間改為較亮的深灰玻璃
    cardBg: isDarkMode
      ? `bg-[#262626]/60 backdrop-blur-xl backdrop-saturate-150 border-white/10`
      : `bg-white/60 backdrop-blur-xl backdrop-saturate-150 border-white/40`,

    // 邊框
    cardBorder: isDarkMode ? `border-white/10` : `border-${cBase}-200/50`,

    // 陰影
    cardShadow: isDarkMode ? "shadow-2xl shadow-black/40" : `shadow-xl shadow-${cBase}-500/5`,

    // 強調色
    accent: isDarkMode ? `text-${cAccent}-300` : `text-${cAccent}-600`,
    accentBg: isDarkMode ? `bg-${cAccent}-500/20` : `bg-${cAccent}-100`,

    // 導覽列
    navBg: isDarkMode
      ? `bg-[#2A2A2A]/80 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/30`
      : `bg-white/30 backdrop-blur-2xl border-white/30 shadow-lg shadow-${cBase}-500/5`,

    // 裝飾光暈
    blob1: isDarkMode ? currentTheme.blobs.dark[0] : currentTheme.blobs.light[0],
    blob2: isDarkMode ? currentTheme.blobs.dark[1] : currentTheme.blobs.light[1],
    blob3: isDarkMode ? currentTheme.blobs.dark[2] : currentTheme.blobs.light[2],
  }), [isDarkMode, cBase, cAccent, currentTheme]);

  // 將紋理傳遞給 CSS 變數，避免每次渲染重建物件
  const containerStyle = React.useMemo(() => ({
    "--bg-texture": currentTheme.bgTexture,
  }), [currentTheme.bgTexture]);

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
      // 1. 解密 Gemini Key
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

      // 2) 解密 Maps Key（如有）
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
          console.warn("Maps Key 解密失敗，可能密碼不同或未設定", e);
          // 這裡可以選擇是否要拋出錯誤，或者允許只有 Gemini Key 成功也算過關
        }
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

    // 手機解鎖時嘗試進入全螢幕
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
  // const [touchEnd, setTouchEnd] = useState(null);
  // 新增：紀錄滑動方向狀態 (1 代表去下一頁/向左滑，-1 代表回上一頁/向右滑)
  // 初始值設為 0，避免第一次載入時有動畫
  // 注意：目前不直接使用 `page` 變數，因此用空位忽略以避免 lint 警告
  const [[, direction], setPage] = useState([activeDay, 0]);
  const minSwipeDistance = 50;
  // 新增：定義 Framer Motion 動畫變數
  // 這裡決定了畫面要怎麼進場 (enter) 和退場 (exit)
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute",
      width: "100%",
      // 強制啟用硬體加速，減少閃爍與延遲
      z: 0,
      willChange: "transform, opacity",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative",
      transition: {
        duration: 0.25, // 稍微增加一點點時間，讓動畫更滑順
        ease: [0.23, 1, 0.32, 1], // 使用自訂 bezier 曲線（更具回彈感的減速）
      },
    },
    exit: (direction) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute",
      width: "100%",
      transition: { duration: 0.2, ease: "easeIn" },
    }),
  };
  // (原本的 onTouchStart 和 onTouchMove 不用變)
  const onTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => {
    // 阻止滑動時的上下捲動干擾
    e.preventDefault();
  };
  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const endX = e.changedTouches[0].clientX;
    const distance = touchStart - endX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (activeDay < itineraryData.length - 1) {
        changeDay(activeDay + 1); // 往左滑 (去下一頁)
      }
    }
    if (isRightSwipe) {
      if (activeDay > -1) {
        changeDay(activeDay - 1); // 往右滑 (回上一頁)
      }
    }
    setTouchStart(null);
  };

  const changeDay = (newDay) => {
    // 如果新頁碼 > 舊頁碼，代表去下一頁 (方向 1，內容往左移)
    // 如果新頁碼 < 舊頁碼，代表回上一頁 (方向 -1，內容往右移)
    const newDirection = newDay > activeDay ? 1 : -1;
    setPage([newDay, newDirection]); // 設定 Framer Motion 的 [頁碼, 方向]
    setActiveDay(newDay); // 設定實際的 activeDay
  };

  // --- Checklist Logic ---
  const [newItemText, setNewItemText] = useState(""); // 輸入框狀態

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

  // 當 checklist 改變時，使用防抖延遲自動存入 localStorage（避免頻繁寫入）
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      localStorage.setItem("trip_checklist_v1", JSON.stringify(checklist));
    }, 500); // 500ms 防抖延遲

    return () => clearTimeout(debounceTimer);
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
  // 新增項目
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
  // 刪除項目（長按或點擊垃圾桶）
  const handleDeleteItem = (id) => {
    if (window.confirm("確定要刪除此項目嗎？")) {
      setChecklist((prev) => prev.filter((item) => item.id !== id));
      showToast("項目已刪除", "error"); // 使用 error 樣式顯示刪除提示
    }
  };
  // 重置檢查清單（還原為預設值）
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
  const [userWeather, setUserWeather] = useState(() => {
    try {
      // 1. 在元件初始化的瞬間，直接去讀快取
      const cached = localStorage.getItem("cached_user_weather");
      if (cached) {
        const parsed = JSON.parse(cached);
        // 簡單驗證資料完整性，確保有地點名稱
        if (parsed && parsed.locationName) {
          debugLog("🚀 State 初始化：直接載入快取資料", parsed.locationName);
          return parsed; // 直接回傳快取物件作為初始狀態
        }
      }
    } catch (e) {
      console.error("快取初始化解析失敗", e);
    }

    // 2. 如果沒快取，才使用這個預設值
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

  // --- 🔧 DEBUG TOOL: 讓 Chrome Console 可以控制天氣 ---
  // useEffect(() => {
  //   window.setTestWeather = (code, isDark) => {
  //     // 1. 強制修改天氣代碼 (影響總覽頁特效)
  //     if (code !== undefined) {
  //       setUserWeather(prev => ({ ...prev, weatherCode: code }));
  //     }
  //     // 2. 強制修改日夜模式 (true=黑夜, false=白天)
  //     if (isDark !== undefined) {
  //       setIsDarkMode(isDark);
  //     }
  //     console.log(`🧪 測試模式啟動: Code=${code}, DarkMode=${isDark}`);
  //   };
    
  //   // 清理函式
  //   return () => { delete window.setTestWeather; };
  // }, []);

  // 位置來源狀態：'cache' | 'low' | 'high' | null
  const [locationSource, setLocationSource] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_user_weather");
      return cached ? "cache" : null;
    } catch {
      return null;
    }
  });

  // 追蹤最後一次高精度定位的時間（ms since epoch），用 useRef 避免不必要 rerender
  const lastHighPrecisionAtRef = useRef(null);
  const isFetchingLocationRef = useRef(false); // 用於節流並避免並發
  const lastFetchAtRef = useRef(0);

  // 目前分享流程是否正在進行（用於 disable 與顯示 spinner）
  const [isSharing, setIsSharing] = useState(false);

  // 目前使用者主動更新位置的 loading 狀態（用於更新按鈕）
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

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
  const getStorageKey = (mode) => `trip_chat_history_${mode}`;
  const [messages, setMessages] = useState(() => {
    try {
      // 預設讀取 translate (因為 aiMode 初始值是 translate)
      const saved = localStorage.getItem(getStorageKey("translate"));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("讀取聊天紀錄失敗", e);
    }
    return [getWelcomeMessage("translate")];
  });

  // 3. 修改：當 messages 變動時，使用防抖延遲存入「當下模式」的 Key（避免頻繁寫入 localStorage）
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const historyToSave = messages.map((msg) => ({
        ...msg,
        image: null, // 依然不存圖片
      }));
      localStorage.setItem(getStorageKey(aiMode), JSON.stringify(historyToSave));
    }, 500); // 500ms 防抖延遲

    return () => clearTimeout(debounceTimer);
  }, [messages, aiMode]); // 加入 aiMode 作為依賴

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningLang, setListeningLang] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null); // 存 Base64
  const [tempImage, setTempImage] = useState(null); // 暫存圖片
  const fileInputRef = useRef(null); // 用來觸發隱藏的 input

  const handleConfirmImage = () => {
    setSelectedImage(tempImage); // 將暫存圖轉正
    setTempImage(null); // 清空暫存
  };
  const handleCancelImage = () => {
    setTempImage(null); // 清空暫存
    if (fileInputRef.current) fileInputRef.current.value = ""; // 清空 input 讓使用者可以重選同一張
  };

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

  // --- 🧩 導遊模式：預先展平行程/指南/商家，減少每次發送重新組字 ---
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

  const itineraryFlat = React.useMemo(
    () => flattenItinerary(itineraryData),
    [],
  );
  const guidesFlat = React.useMemo(() => flattenGuides(guidesData), []);
  const shopsFlat = React.useMemo(
    () => flattenShops(shopGuideData),
    [],
  );

  // ... existing map and weather helpers ...
  // 1. Get Google Map Link
  const getMapLink = (query) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // 2. Get Weather Info from WMO Code
  // 純粹的數據版本，不依賴 isDarkMode（用於邏輯層）
  const getWeatherData = React.useCallback(
    (code) => {
      if (code === 0)
        return {
          text: "晴朗",
          advice: "天氣很好，注意防曬。",
        };
      if ([1, 2, 3].includes(code))
        return {
          text: "多雲",
          advice: "舒適，適合戶外。",
        };
      if ([45, 48].includes(code))
        return {
          text: "有霧",
          advice: "能見度低請小心。",
        };
      if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
        return {
          text: "有雨",
          advice: "請務必攜帶雨具。",
        };
      if ([71, 73, 75, 77, 85, 86].includes(code))
        return {
          text: "降雪",
          advice: "請穿防滑雪靴。",
        };
      if ([95, 96, 99].includes(code))
        return {
          text: "雷雨",
          advice: "請盡量待在室內。",
        };
      return {
        text: "晴時多雲",
        advice: "注意日夜溫差。",
      };
    },
    [],  // 不依賴任何外部狀態
  );

  // UI 版本，包含圖示和顏色（依賴 isDarkMode，用於顯示層）
  const getWeatherInfo = React.useCallback(
    (code) => {
      const iconClass = "w-7 h-7"; // Slightly larger icons
      const color = isDarkMode ? "text-neutral-300" : "text-neutral-600"; // Muted icons
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
        icon = <CloudFog className={`${iconClass} ${theme.textSec}`} />;
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
      else
        icon = <Sun className={`${iconClass} ${color}`} />;

      return {
        icon,
        text: data.text,
        advice: data.advice,
      };
    },
    [isDarkMode, theme.textSec, getWeatherData],
  );

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

  // --- User Location Weather Logic (平時只用 OSM，節省額度) ---
  const getUserLocationWeather = React.useCallback(
    async (options = {}) => {
      const {
        isSilent = false,
        highAccuracy = false,
        timeout = 10000,
        coords = null,
      } = options;
      // 節流：避免短時間重複觸發與並發更新
      const now = Date.now();
      const minGapMs = isSilent ? 3000 : 1500; // 靜默更新允許更長間隔
      if (!highAccuracy) {
        if (isFetchingLocationRef.current || now - lastFetchAtRef.current < minGapMs) {
          debugLog("⏳ 略過重複定位請求 (節流中)");
          return null;
        }
      }
      isFetchingLocationRef.current = true;
      if (!isSilent && !highAccuracy) setIsUpdatingLocation(true);

      const fetchLocalWeather = async (
        latitude,
        longitude,
        customName = null,
      ) => {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&weathercode=true&timezone=auto`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          let city = customName;
          let landmark = "";
          // 預設為 true (假設是不精準的)，除非 OSM 明確回傳了 name
          let isGeneric = true;

          if (!city) {
            try {
              const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW&zoom=18`;
              const geoRes = await fetch(geoUrl);
              const geoData = await geoRes.json();

              if (geoData) {
                const addr = geoData.address || {};
                city =
                  addr.city ||
                  addr.town ||
                  addr.village ||
                  addr.county ||
                  addr.state ||
                  "您的位置";

                // 🎯 關鍵判斷：OSM 有給 name 嗎？
                if (geoData.name) {
                  // Case A: 有名字 (e.g., 台北101, 7-11) -> 精準地標
                  landmark = geoData.name;
                  isGeneric = false;
                } else {
                  // Case B: 沒名字，只有路名/門牌 -> 通用地址
                  // 這裡我們 "只存路名"，不查 Google Maps (符合您的需求1)
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
            locationName: city || "未知地點",
            landmark: landmark,
            isGeneric: isGeneric, // ✅ 將判斷結果存入 State
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

      // --- 階段 1：嘗試讀取快取 (LocalStorage) ---
      const cached = localStorage.getItem("cached_user_weather");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUserWeather(parsed);
          setLocationSource("cache");
          setIsAppReady(true); // 🚀 有快取直接過關
          debugLog("🚀 快取載入成功");
        } catch (e) {
          console.error("快取解析失敗", e);
        }
      }

      // --- 階段 2：低精確度 IP 定位 (若無快取且非靜默更新，則補位) ---
      if (!cached && !isSilent && !coords) {
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
          // 最終防線：若連 IP 定位都失敗且無快取，使用台北
          if (!cached) {
            await fetchLocalWeather(25.033, 121.5654, "台北");
            setLocationSource("low");
          }
        }
      }

      // 如果 caller 傳入 coords，優先使用（方便分享時要求高精度）
      if (coords && coords.latitude && coords.longitude) {
        try {
          setHasLocationPermission(true);
          if (highAccuracy) {
            lastHighPrecisionAtRef.current = Date.now();
            setLocationSource("high");
          } else {
            setLocationSource("low");
          }
          return await fetchLocalWeather(
            coords.latitude,
            coords.longitude,
            coords.name || null,
          );
        } catch (e) {
          console.error("使用提供的座標抓取失敗", e);
        }
      }

      // --- 階段 3：背景啟動瀏覽器定位 ---
      if (navigator.geolocation) {
        const geoOptions = {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: highAccuracy ? 0 : 600000,
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setHasLocationPermission(true);
            if (highAccuracy) {
              lastHighPrecisionAtRef.current = Date.now();
              setLocationSource("high");
            } else {
              setLocationSource("low");
            }
            // 背景更新為取得的座標
            fetchLocalWeather(
              position.coords.latitude,
              position.coords.longitude,
            );
            // 若為非高精度呼叫，成功取得位置後即解除節流鎖
            if (!highAccuracy) {
              isFetchingLocationRef.current = false;
              lastFetchAtRef.current = Date.now();
            }
          },
          (err) => {
            console.warn("GPS 定位未成功", err.code, err.message);

            if (err.code === 1) {
              // PERMISSION_DENIED -> 鎖定按鈕並提示
              setHasLocationPermission(false);
              if (!isSilent) showToast("您已封鎖定位權限", "error");
            } else {
              // 逾時或位置不可用 -> 設為 null (中立狀態)，允許重試
              setHasLocationPermission(null);
            }

            // 最終防線：如果連 IP 定位都沒抓到 (沒畫面)，才回退到台北
            if (!cached && !isAppReady) {
              fetchLocalWeather(25.033, 121.5654, "台北");
              setLocationSource("low");
            }
            isFetchingLocationRef.current = false;
          },
          geoOptions,
        );
      } else {
        // 瀏覽器不支援定位的 fallback
        setHasLocationPermission(false);
        if (!cached && !isAppReady) {
          fetchLocalWeather(25.033, 121.5654, "台北");
          setLocationSource("low");
        }
        isFetchingLocationRef.current = false;
      }

      // 如果目前不是要求高精度，且最後一次高精度定位超過 2 分鐘，則在背景啟動一次高精度確認（silent）
      if (!highAccuracy) {
        const twoMinutes = 2 * 60 * 1000;
        const last = lastHighPrecisionAtRef.current || 0;
        if (Date.now() - last > twoMinutes && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
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
              // 不顯示提示，僅 log
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
    [getWeatherData, isAppReady, showToast],
  ); // 確保依賴完整

  // --- 定時更新位置與天氣邏輯 (改為：載入時立即啟動 + 每10分鐘背景更新) ---
  useEffect(() => {
    // 讀取當前是否已有顯示資料：若已有則首次更新以靜默模式進行
    const alreadyHasData =
      userWeather.temp !== null && userWeather.locationName !== "定位中...";

    // 首次載入時嘗試更新（若已有資料則靜默）
    getUserLocationWeather({ isSilent: alreadyHasData, highAccuracy: false });

    // 背景每 10 分鐘靜默更新一次（低精度，優先快速回應）
    const intervalId = setInterval(() => {
      debugLog("⏰ 自動更新位置與天氣...");
      getUserLocationWeather({ isSilent: true, highAccuracy: false });
    }, 600000);

    return () => clearInterval(intervalId);
  }, [getUserLocationWeather, userWeather.temp, userWeather.locationName]);

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      // 如果瀏覽器不支援 geolocation，直接嘗試用現有資料分享（如果有）或提示
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
              url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
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
            // fallback
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

    // 1) 如果我們已經有座標（不論來源），先判斷是否已有「2 分鐘內的高精度位置」
    const twoMinutes = 2 * 60 * 1000;
    const hasRecentHigh =
      locationSource === "high" &&
      lastHighPrecisionAtRef.current &&
      Date.now() - lastHighPrecisionAtRef.current <= twoMinutes;

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
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      // 若已有 2 分鐘內的高精度資料，直接分享（避免重新抓取）
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

      // 若沒有 recent high-precision，則在使用者手勢中主動嘗試取得高精度；若失敗，再回退使用現有 coords 分享
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
        const mapUrl2 = `https://www.google.com/maps/search/?api=1&query=${shareLat},${shareLng}`;
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
              await copyToClipboard(fullText2, "分享失敗，但位置已複製到剪貼簿");
            }
          }
        } else {
          await copyToClipboard(fullText2, "位置與地標資訊已複製！");
        }

        return;
      } catch (err) {
        console.warn("高精度定位失敗，使用既有座標分享：", err);
        // 失敗則使用既有座標進行分享（與前面相同邏輯）
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

    // 2) 如果沒有任何既有座標（尚未取得任何座標），則需要等待高精度定位結果才能分享
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
        (newData && newData.isGeneric) || false, // 這裡很重要，要用新的 generic 狀態
      );
      const { baseMessage, fullText, tag } = composed;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "我的位置",
            text: baseMessage,
            url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
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

  // ... existing weather fetch and voice logic ...
  // --- Weather API Integration (加上 AbortController，避免卸載後更新狀態) ---
  useEffect(() => {
    if (!isVerified) return;

    const controller = new AbortController();
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        const params = `daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=14`;

        // 自動為 config 裡的每一個地點產生 fetch 請求
        const weatherPromises = tripConfig.locations.map(async (loc) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&${params}`;
          const res = await fetch(url, { signal: controller.signal });
          const data = await res.json();
          if (!cancelled && data.timezone) {
            setAutoTimeZone(data.timezone);
          }
          return { key: loc.key, data: data.daily };
        });

        const results = await Promise.all(weatherPromises);

        if (cancelled) return;

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
        if (error?.name === "AbortError") return; // 忽略中止錯誤
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

  // --- Google Maps Places API Call Helper（使用正確的 Place Types） ---
  const fetchGooglePlaces = async (lat, lng, radius = 25) => {
    if (!mapsApiKey) return [];

    const centerLat = Number(lat);
    const centerLng = Number(lng);
    const circleRadius = Number(radius);

    if (isNaN(centerLat) || isNaN(centerLng)) {
      console.error("❌ [Maps API] 座標格式錯誤");
      return [];
    }

    const url = `https://places.googleapis.com/v1/places:searchNearby`;

    // ⬇️ 修正點：只使用 Table A 支援的有效類型
    // 移除 'point_of_interest', 'food'，改用更具體的類型
    const validTypes = [
      "restaurant",
      "cafe",
      "convenience_store",
      "tourist_attraction",
      "park",
      "store",
      "lodging",
      "transit_station",
      "school",
      "government_office",
    ];

    const body = {
      includedTypes: validTypes,
      maxResultCount: 3, // 取前3名即可
      locationRestriction: {
        circle: {
          center: { latitude: centerLat, longitude: centerLng },
          radius: circleRadius,
        },
      },
      languageCode: "zh-TW",
    };

    try {
      // console.log("🌐 [Maps API] Payload:", body); // Debug 用

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": mapsApiKey,
          // 只抓取顯示名稱，最省錢
          "X-Goog-FieldMask": "places.displayName,places.name",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // 🔍 這裡加強 Log：將錯誤物件轉成文字印出來，方便看清楚是哪個參數錯
        const errData = await res.json();
        console.error(
          `❌ [Maps API] 請求失敗 (${res.status}):`,
          JSON.stringify(errData, null, 2),
        );
        return [];
      }

      const data = await res.json();
      return data.places || [];
    } catch (e) {
      console.error("❌ [Maps API] 連線異常:", e);
      return [];
    }
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
        if (response.status === 400) {
          throw new Error("API 參數錯誤。");
        }
        if (response.status === 403) {
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

  // --- Nearby POI Helper: Direct Maps API Call (修正版：移除 contextName 與 Gemini 依賴) ---
  // 參數只保留 latitude, longitude，解決 ESLint 'contextName' unused 問題
  const getBestPOI = async (latitude, longitude) => {
    // 1. 檢查 Maps Key (完全與 Gemini Key 脫鉤)
    if (!mapsApiKey) {
      debugLog("🗺️ [Google Maps] 略過：沒有設定 API Key");
      return null;
    }

    try {
      debugLog(
        `🗺️ [Google Maps] 開始查詢周邊 POI... (Lat: ${latitude}, Lng: ${longitude})`,
      );
      // 2. 直接呼叫 Maps API (使用上方修正後的函式)
      // 設定半徑 25m，只抓最靠近的點
      const places = await fetchGooglePlaces(latitude, longitude, 25);
      debugLog("🗺️ [Google Maps] API 回傳原始結果:", places);

      if (places && places.length > 0) {
        // 3. 取第一個結果 (Google 預設依關聯度/距離排序)
        const bestPlace = places[0];
        // Google Places API (New) 的 displayName 是物件: { text: "店名", languageCode: "zh-TW" }
        const name = bestPlace.displayName?.text || bestPlace.name;

        if (name) {
          debugLog(`🗺️ [Google Maps]  找到最佳地標: "${name}"`);
          return { name: name, source: "maps-direct" };
        } else {
          debugLog("🗺️ [Google Maps]  附近沒有顯著地標 (Zero Results)");
        }
      }
    } catch (e) {
      console.warn("getBestPOI 執行失敗:", e);
    }

    // 若無結果回傳 null
    return null;
  };

  // --- Build share text helper (決策核心) ---
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
      isGeneric: isGeneric, // 這裡現在應該會正確顯示 true/false
      city: locationName,
    });

    let finalLandmark = currentLandmark || "";
    let tag = currentLandmark ? "Street(OSM)" : "Unknown";

    // 決策邏輯：
    // 1. 完全沒地標 (landmark 空)
    // 2. 或是 OSM 標記為通用地址 (isGeneric 為 true)
    // 只有這兩種情況才去問 Google
    if (!finalLandmark || isGeneric === true) {
      debugLog("2. 判定需要補強 (無地標或僅有路名)，呼叫 Google Maps...");

      const poi = await getBestPOI(latitude, longitude);

      if (poi && poi.name) {
        finalLandmark = poi.name;
        tag = "POI(GoogleMaps)";
        debugLog("3. Google Maps 救援成功！更新為:", finalLandmark);

        // 💡 選擇性：是否要更新回畫面？
        // 如果您希望分享後，畫面上的路名也變成店名，就保留下面這行。
        // 如果希望畫面永遠保持路名，只有分享出去的文字變店名，就把下面這行註解掉。
        setUserWeather((prev) => ({
          ...prev,
          landmark: finalLandmark,
          isGeneric: false,
        }));
      } else {
        debugLog("3. Google Maps 無結果，維持 OSM 路名。");
      }
    } else {
      debugLog("2. OSM 已是精準地標 (Name)，跳過 Google Maps。");
    }

    debugLog(`🏁 [最終輸出] Landmark: "${finalLandmark}"`);
    debugGroupEnd();

    const baseMessage = `我在這裡${finalLandmark ? ` (靠近 ${finalLandmark})` : ""}！`;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    return {
      baseMessage,
      fullText: `${baseMessage}\n點擊查看位置：${mapUrl}`,
      finalLandmark,
      tag,
    };
  };

  const handleSwitchMode = (newMode) => {
    if (aiMode === newMode) return;
    setAiMode(newMode); // 切換模式狀態
    // 嘗試讀取新模式的存檔
    const saved = localStorage.getItem(getStorageKey(newMode));
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      // 如果該模式沒有存檔，就給一個新的歡迎詞
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
      localStorage.removeItem(getStorageKey(aiMode)); // 只刪除當下的 Key
    }
  };

  // ... handleSendMessage logic updated to use systemInstruction ...
  const handleSendMessage = async () => {
    // 1. 檢查：防止空訊息 (但允許「只有圖片沒有文字」的情況)
    if (!inputMessage.trim() && !selectedImage) return;

    // 2. 準備時間資訊 (AI 回答時需要)
    const tz = autoTimeZone || tripConfig.timeZone || "Asia/Taipei";
    const localTimeStr = new Date().toLocaleString("zh-TW", {
      timeZone: tz,
      hour12: false,
    });

    // 3. 建構使用者訊息 (存入 React State 顯示用)
    // ⚠️ 之前可能不小心刪掉這段，導致發送失敗
    const userMsg = {
      role: "user",
      text: inputMessage,
      image: selectedImage,
    };

    // 4. 設定載入中的隨機文字 (根據模式)
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
    setLoadingText(nextLoadingText); // 更新 Loading 文字

    // 5. 更新 UI 狀態
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setSelectedImage(null); // 送出後清空預覽區
    setIsLoading(true);

    try {
      // --- 定義一個轉換函式：將 React State 訊息轉為 Gemini API 格式 ---
      const formatToGeminiPart = (msg) => {
        const parts = [];

        // (A) 處理文字
        if (msg.text && msg.text.trim()) {
          parts.push({ text: msg.text });
        } else if (!msg.image) {
          parts.push({ text: "" });
        }

        // (B) 處理圖片
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

      // 6. 準備 Payload
      let payload;

      if (aiMode === "translate") {
        // === 口譯模式 ===
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
        // === 導遊模式 ===

        // 位置判斷
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
        const today = new Date(
          new Date().toLocaleString("en-US", { timeZone: tz }),
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

  // --- Weather Determination ---
  const current = activeDay === -1 ? null : itineraryData[activeDay];

  // Determine current weather based on day
  const currentLocation = getDailyLocation(activeDay);

  // 使用 useMemo 鎖定天氣資料，優化滑動效能
  const displayWeather = React.useMemo(() => {
    const currentLocation = getDailyLocation(activeDay);
    const weatherData = weatherForecast[currentLocation];

    if (!weatherForecast.loading && weatherData) {
      const dayIndex = activeDay === -1 ? 0 : activeDay;
      const forecastIndex = dayIndex < weatherData.time.length ? dayIndex : 0;
      const maxTemp = Math.round(weatherData.temperature_2m_max[forecastIndex]);
      const minTemp = Math.round(weatherData.temperature_2m_min[forecastIndex]);
      const weatherCode = weatherData.weathercode[forecastIndex];
      const info = getWeatherInfo(weatherCode);

      return {
        icon: info.icon,
        temp: `${minTemp}°C / ${maxTemp}°C`,
        desc: info.text,
        advice: info.advice,
        code: weatherCode, // 回傳原始代碼給背景特效用
      };
    }

    // 預設或抓不到資料的狀態
    return {
      icon: <Cloud className="w-7 h-7 text-stone-300" />,
      temp: "--",
      desc: weatherForecast.loading ? "載入中..." : "無資料",
      advice: weatherForecast.loading ? "請稍候" : "無法取得預報，請稍後再試",
    };
  }, [activeDay, weatherForecast, getWeatherInfo]);

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
                {/* 🔴 新增：切換要加密哪種 Key 的按鈕 */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      setKeyType("gemini");
                      setToolResult(""); // 切換時清空結果
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

    {/* 🆕 Weather Effects Layer (放在 Blob 之後，內容之前) */}
      <MemoizedWeatherBackground 
        weatherCode={activeDay === -1 ? userWeather.weatherCode : displayWeather.code} 
        isDarkMode={isDarkMode} 
      />

      <div className="max-w-md mx-auto relative min-h-screen flex flex-col z-10">
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

        {/* 1. 行程分頁 (Itinerary Tab) - 完整動畫版 */}
        {activeTab === "itinerary" && (
          <div
            className="flex-1 space-y-4 px-4 pb-4 overflow-x-hidden relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            ref={scrollContainerRef}
          >
            {/* Navigation Buttons */}
            <div
              // ✅ 1. 綁定容器 Ref
              ref={navContainerRef}
              className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide py-1 px-1 relative z-10"
            >
              {/* Overview Button (Index = -1) */}
              <button
                // ✅ 2. 綁定按鈕 Ref (Key 為 -1)
                ref={(el) => (navItemsRef.current[-1] = el)}
                onClick={() => changeDay(-1)}
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
                  // ✅ 3. 綁定按鈕 Ref (Key 為 index 0, 1, 2...)
                  ref={(el) => (navItemsRef.current[index] = el)}
                  onClick={() => changeDay(index)}
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

            {/* Animation Wrapper */}
            <div className="relative w-full h-full">
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
                    className="space-y-4"
                  >
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
                            ) : userWeather.weatherCode !== null ? (
                              getWeatherInfo(userWeather.weatherCode).icon
                            ) : (
                              <Loader
                                className={`w-7 h-7 animate-spin ${theme.textSec}`}
                              />
                            )}
                          </div>
                          <div>
                            {userWeather.temp !== null ? (
                              <div
                                className={`text-3xl font-bold ${theme.text}`}
                              >
                                {userWeather.temp}
                                <span
                                  className={`text-sm ml-1 ${theme.textSec}`}
                                >
                                  °C
                                </span>
                              </div>
                            ) : (
                              <div className={`text-xs ${theme.textSec}`}>
                                --
                              </div>
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
                          onClick={() =>
                            getUserLocationWeather({
                              isSilent: false,
                              highAccuracy: false,
                            })
                          }
                          disabled={isUpdatingLocation}
                          aria-busy={isUpdatingLocation}
                          aria-disabled={isUpdatingLocation}
                          className={`mb-2 text-xs px-3 py-1.5 rounded-full border transition-all shadow-sm flex items-center gap-1.5 active:scale-95 ${isUpdatingLocation ? "opacity-80 pointer-events-none" : ""} ${theme.accent} ${isDarkMode ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700" : "bg-white border-stone-200 hover:bg-stone-50"}`}
                        >
                          {isUpdatingLocation ? (
                            <>
                              <Loader className="w-3 h-3 animate-spin" />
                              <span className="ml-2">更新中</span>
                            </>
                          ) : (
                            <>
                              更新位置 <Share2 className="w-3 h-3" />
                            </>
                          )}
                        </button>

                        {userWeather.temp !== null &&
                          (() => {
                            // 1. 決定要比對哪一天的預報：旅程中比對「明天」，還沒出發比對 Day 1
                            const targetDayIndex =
                              tripStatus === "during"
                                ? currentTripDayIndex + 1
                                : 0;

                            // 安全檢查：確保索引在行程範圍內
                            if (
                              targetDayIndex < 0 ||
                              targetDayIndex >= itineraryData.length
                            )
                              return null;

                            const targetLoc = getDailyLocation(targetDayIndex);
                            const forecast = weatherForecast[targetLoc];

                            // 2. 取得目標日期的平均溫 (需確認 forecast 資料已載入)
                            if (!forecast || !forecast.temperature_2m_max)
                              return null;

                            const destMax =
                              forecast.temperature_2m_max[targetDayIndex];
                            const destMin =
                              forecast.temperature_2m_min[targetDayIndex];
                            const destAvg = (destMax + destMin) / 2;

                            const tempDiff = Math.abs(
                              destAvg - userWeather.temp,
                            );

                            // 3. 溫差門檻 10 度則顯示
                            if (tempDiff >= 10) {
                              const isColder = destAvg < userWeather.temp;
                              return (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`mb-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 shadow-sm ${
                                    isDarkMode
                                      ? "bg-orange-500/20 border-orange-500/40 text-orange-200"
                                      : "bg-orange-50 border-orange-200 text-orange-700"
                                  }`}
                                >
                                  <div className="bg-orange-500 rounded-full p-1">
                                    <AlertCircle className="w-3 h-3 text-white animate-pulse" />
                                  </div>
                                  <span>
                                    {tripStatus === "during"
                                      ? "明天"
                                      : "目的地"}
                                    比當前{isColder ? "冷" : "熱"}{" "}
                                    {tempDiff.toFixed(0)}°C
                                  </span>
                                </motion.div>
                              );
                            }
                            return null;
                          })()}
                        <p
                          className={`text-xs leading-relaxed font-medium ${theme.textSec}`}
                        >
                          {userWeather.error
                            ? "無法獲取天氣"
                            : "比較溫差，方便預先準備。"}
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
                            <ChevronDown
                              className={`w-4 h-4 ${theme.textSec}`}
                            />
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
                              <div
                                className={`text-xs font-bold ${theme.textSec}`}
                              >
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
                              <div
                                className={`text-xs font-bold ${theme.textSec}`}
                              >
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
                            <span
                              className={`text-lg font-bold ${theme.textSec}`}
                            >
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
                          {/* 重置按鈕 */}
                          <button
                            onClick={handleResetChecklist}
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100 ${isDarkMode ? "text-neutral-400 hover:bg-neutral-700 hover:text-white" : "text-stone-400 hover:bg-stone-200 hover:text-stone-600"}`}
                            title="還原預設值"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> 重置
                          </button>
                          {/* 輸入框區域 */}
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
                              <Plus className="w-5 h-5" />
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

                                {/* 刪除按鈕 */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                  }}
                                  className={`p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity ${isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-400 hover:bg-red-50"}`}
                                  title="刪除"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
                            <MapPin className={`w-4 h-4 ${colors.pink}`} />{" "}
                            足跡回顧
                          </h3>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {(tripConfig.tripHighlights || []).map(
                                (spot, i) => (
                                  <span
                                    key={i}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border shadow-sm ${isDarkMode ? "bg-neutral-700 border-neutral-600 text-neutral-300" : "bg-white border-stone-200 text-stone-600"}`}
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
                  // === 分支 2: 每日行程頁面 (activeDay >= 0) ===
                  <motion.div
                    key={`day-${activeDay}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-4"
                  >
                    {current && (
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
                                <motion.div
                                  key={`${activeDay}-${displayWeather.desc}`} // 當天數改變，觸發小動畫
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                ></motion.div>
                                {displayWeather.icon}
                              </div>
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span
                                    className={`text-2xl font-bold ${theme.text}`}
                                  >
                                    {displayWeather.temp.split("/")[0]}
                                  </span>
                                  <span className={`text-sm ${theme.textSec}`}>
                                    /
                                  </span>
                                  <span
                                    className={`text-2xl font-bold ${theme.text}`}
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

                        {/* Main Itinerary Content */}
                        <div
                          className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] relative transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                        >
                          {/* Day Header */}
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
                                  // target="_blank"
                                  // rel="noopener noreferrer"
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
                              const isOpen =
                                expandedItems[`${activeDay}-${idx}`];
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
                                            <Clock className="w-3 h-3" />{" "}
                                            {event.time}
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
                                              // target="_blank"
                                              // rel="noopener noreferrer"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
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
                                            <Info className="w-3.5 h-3.5" />{" "}
                                            溫馨提醒
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
                                <div
                                  className={`p-1.5 rounded-lg ${theme.accentBg}`}
                                >
                                  <Map className={`w-4 h-4 ${theme.accent}`} />
                                </div>
                                <h3
                                  className={`text-sm font-bold ${theme.text}`}
                                >
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
                                  // target="_blank"
                                  // rel="noopener noreferrer"
                                  className={`flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 ${isDarkMode ? "bg-gradient-to-r from-sky-800 to-blue-900" : "bg-gradient-to-r from-[#5D737E] to-[#3F5561]"}`}
                                >
                                  <Navigation className="w-4 h-4" />
                                  開啟 Google Maps 查看路線
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Notice */}
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
                                    // target="_blank"
                                    // rel="noopener noreferrer"
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
                                      // target="_blank"
                                      // rel="noopener noreferrer"
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
                                  // target="_blank"
                                  // rel="noopener noreferrer"
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
                className={`p-4 border-b backdrop-blur-sm flex flex-col gap-3 ${isDarkMode ? "bg-neutral-800/60 border-neutral-700" : "bg-white/60 border-stone-200/50"}
                ${/* 🆕 新增：根據模式改變底部邊框顏色，加強提示 */ ""}
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
                    {/* 🆕 修改：頭像與背景色隨模式改變 */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-500
                        ${
                          aiMode === "translate"
                            ? "bg-gradient-to-br from-sky-400 to-blue-500" // 口譯：藍色系
                            : "bg-gradient-to-br from-amber-200 to-orange-300"
                        } // 導遊：橘黃系
                      `}
                    >
                      {aiMode === "translate" ? (
                        <Languages className="w-5 h-5 text-white" /> // 口譯 Icon
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" /> // 導遊 Icon
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

                  {/* 新增：清除紀錄按鈕 (垃圾桶 icon) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearChat}
                      className={`p-2 rounded-lg border transition-all active:scale-95 ${
                        isDarkMode
                          ? "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                          : "bg-stone-100 border-stone-200 text-stone-400 hover:text-red-500 hover:bg-red-50"
                      }`}
                      title="清除聊天紀錄"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                        {/* 🆕 新增：如果有圖片，先顯示圖片 */}
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

                {/* Loading Indicator (維持原樣) */}
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
                        {/* 💡 使用剛才在 handleSendMessage 定義的隨機文字 */}
                        {loadingText || "正在翻閱您的行程表..."}
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
                className={`p-2 border-t backdrop-blur-md transition-colors duration-300 flex-shrink-0 z-10 
                  ${isDarkMode ? "bg-neutral-800/90 border-neutral-700" : "bg-white/90 border-stone-200/80"}`}
              >
                {/* 1. 圖片預覽區域 (當有選擇圖片時顯示) */}
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {/* 2. 主要輸入區 (Flexbox 佈局) */}
                <div className="flex items-end gap-2">
                  {/* 左側功能按鈕群 (語音 + 圖片) */}
                  <div className="flex gap-1 pb-0.5">
                    {/* 中文語音按鈕 */}
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
                        <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">
                          中
                        </div>
                      )}
                    </button>

                    {/* 外語語音按鈕 */}
                    {aiMode === "translate" && (
                      <button
                        onClick={() =>
                          toggleListening(tripConfig.language.code)
                        }
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
                          <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">
                            {tripConfig.language.label}
                          </div>
                        )}
                      </button>
                    )}

                    {/* 圖片上傳按鈕 */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2.5 rounded-xl transition-all shadow-sm border flex-shrink-0 active:scale-95
                        ${
                          isDarkMode
                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-600"
                            : "bg-white text-stone-500 hover:bg-stone-50 border-stone-200"
                        }`}
                      title="上傳圖片"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 3. 文字輸入框 (調整字體與 Padding 避免換行) */}
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
                        : aiMode === "translate"
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

                  {/* 4. 發送按鈕 */}
                  <button
                    onClick={() => {
                      handleSendMessage();
                      const textarea = document.querySelector("textarea");
                      if (textarea) textarea.style.height = "auto";
                    }}
                    disabled={
                      isLoading || (!inputMessage.trim() && !selectedImage)
                    }
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

        {/* Bottom Navigation (Dynamic Theme + Tailwind Safe List) */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto">
          <div
            // 容器：基礎色系通常較固定，這裡使用 style 變數輔助或是保留原樣 (若 cBase 是 stone/neutral 通常沒問題)
            // 若發現容器背景也消失，建議同樣改用查表法，但目前主要問題在 AI 按鈕
            className={`flex items-center gap-1 px-2 py-2 rounded-full backdrop-blur-xl border shadow-2xl transition-all duration-300
            ${
              isDarkMode
                ? `bg-${cBase}-900/70 border-${cBase}-700/60 shadow-black/50`
                : `bg-${cBase}-50/70 border-${cBase}-300/70 shadow-${cBase}-500/20`
            }`}
          >
            {/* 1. 行程 (Itinerary) */}
            <button
              onClick={() => setActiveTab("itinerary")}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group backdrop-blur-md border
                ${
                  activeTab === "itinerary"
                    ? isDarkMode
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/30`
                      : `bg-${cBase}-200/50 text-${cBase}-700 border-${cBase}-300/40 shadow-sm`
                    : isDarkMode
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20`
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <Home className={`w-5 h-5 ${activeTab === "itinerary" ? "stroke-[2.5px]" : "stroke-2"}`} />
              {activeTab === "itinerary" && (
                <span className="absolute -bottom-[3px] w-1 h-1 rounded-full bg-current opacity-80 shadow-sm"></span>
              )}
            </button>

            {/* 2. 指南 (Guides) */}
            <button
              onClick={() => setActiveTab("guides")}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border
                ${
                   activeTab === "guides"
                    ? isDarkMode 
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/30` 
                      : `bg-${cBase}-200/50 text-${cBase}-700 border-${cBase}-300/40 shadow-sm`
                    : isDarkMode 
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20` 
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <BookOpen className={`w-5 h-5 ${activeTab === "guides" ? "stroke-[2.5px]" : "stroke-2"}`} />
               {activeTab === "guides" && (
                <span className="absolute -bottom-[3px] w-1 h-1 rounded-full bg-current opacity-80 shadow-sm"></span>
              )}
            </button>

            {/* 3. AI 核心按鈕 (修正版：使用完整 Class 名稱) */}
            <button
              onClick={() => setActiveTab("ai")}
              className={`mx-1 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-md active:scale-95 border
                ${
                  activeTab === "ai"
                    ? "scale-105 ring-4 ring-opacity-30" 
                    : "hover:scale-105"
                }
                ${
                  /* 🌟 修正點：這裡使用 IIFE 或查表法回傳完整的 Class 字串 */
                  (() => {
                    // 定義顏色對應表 (包含日間/夜間)
                    const styles = {
                      amber: isDarkMode
                        ? "bg-gradient-to-tr from-amber-600/90 to-amber-500/90 ring-amber-500/50 border-amber-400/30 shadow-amber-900/40"
                        : "bg-gradient-to-tr from-amber-400 to-amber-500 ring-amber-400/50 border-amber-300/50 shadow-amber-500/40", // 日間：金黃漸層
                      sky: isDarkMode
                        ? "bg-gradient-to-tr from-sky-600/90 to-sky-500/90 ring-sky-500/50 border-sky-400/30 shadow-sky-900/40"
                        : "bg-gradient-to-tr from-sky-400 to-sky-500 ring-sky-400/50 border-sky-300/50 shadow-sky-500/40",
                      // 預設 fallback (避免設定檔打錯字時全白)
                      default: isDarkMode
                        ? "bg-gradient-to-tr from-stone-600 to-stone-500 ring-stone-500/50 border-stone-400/30"
                        : "bg-gradient-to-tr from-stone-400 to-stone-500 ring-stone-400/50 border-stone-300/50"
                    };
                    return styles[cAccent] || styles.default;
                  })()
                }
              `}
            >
              <MessageSquare className="w-6 h-6 text-white drop-shadow-md" />
            </button>

            {/* 4. 商家 (Shops) */}
            <button
              onClick={() => setActiveTab("shops")}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border
                ${
                   activeTab === "shops"
                    ? isDarkMode 
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/30` 
                      : `bg-${cBase}-200/50 text-${cBase}-700 border-${cBase}-300/40 shadow-sm`
                    : isDarkMode 
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20` 
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <Store className={`w-5 h-5 ${activeTab === "shops" ? "stroke-[2.5px]" : "stroke-2"}`} />
              {activeTab === "shops" && (
                <span className="absolute -bottom-[3px] w-1 h-1 rounded-full bg-current opacity-80 shadow-sm"></span>
              )}
            </button>

            {/* 5. 連結 (Resources) */}
            <button
              onClick={() => setActiveTab("resources")}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border
                ${
                   activeTab === "resources"
                    ? isDarkMode 
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/30` 
                      : `bg-${cBase}-200/50 text-${cBase}-700 border-${cBase}-300/40 shadow-sm`
                    : isDarkMode 
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20` 
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <LinkIcon className={`w-5 h-5 ${activeTab === "resources" ? "stroke-[2.5px]" : "stroke-2"}`} />
              {activeTab === "resources" && (
                <span className="absolute -bottom-[3px] w-1 h-1 rounded-full bg-current opacity-80 shadow-sm"></span>
              )}
            </button>
          </div>
        </div>

        {/* Floating Location Button (透明度優化版) */}
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

        {/* 🆕 全螢幕按鈕 (修正位置：剛好在分享按鈕上方 1rem 處) */}
        {isMobile && (
          <button
            onClick={toggleFullScreen}
            // 修改這裡：將 bottom-xx 改為 bottom-[19rem]
            className={`fixed bottom-[19rem] right-5 w-12 h-12 backdrop-blur-md border rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-all opacity-60 hover:opacity-100
              ${
                isDarkMode
                  ? "bg-neutral-800/40 border-neutral-600 text-neutral-300 hover:bg-neutral-800/90"
                  : "bg-white/40 border-stone-200 text-[#5D737E] hover:bg-white/90"
              }`}
            aria-label="切換全螢幕"
          >
            {isFullscreen ? (
              <Minimize className="w-6 h-6" />
            ) : (
              <Maximize className="w-6 h-6" />
            )}
          </button>
        )}

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
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
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
        {/* 🆕 新增：圖片上傳確認視窗 (Modal) */}
        <AnimatePresence>
          {tempImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            >
              {/* 圖片預覽區 */}
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

              {/* 提示文字 */}
              <p className="text-white/70 text-sm mt-6 mb-8 font-medium tracking-wide">
                照片清楚嗎？請確認是否使用此圖片
              </p>

              {/* 操作按鈕 */}
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
      </div>
    </div>
  );
};

export default ItineraryApp;
