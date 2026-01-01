// 概述：ItineraryApp 主介面與互動邏輯
// 功能：狀態管理、定位/天氣、語音與朗讀、行程呈現、UI 控制
// 說明：本次優化僅更新註解與排版，不更動核心流程。
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
import ChatInput from "./components/ChatInput.jsx";
import CurrencyWidget from "./components/CurrencyWidget.jsx";
import CalculatorModal from "./components/CalculatorModal.jsx";
import TestModePanel from "./components/TestModePanel.jsx";

const ChatMessageList = lazy(() => import("./components/ChatMessageList.jsx"));
import DayMap from "./components/DayMap.jsx";

// --- 新增：來自 ios_weather 的視覺特效組件 ---

// 1. Canvas 粒子系統
// --- 修正：將 Particle 類別移至組件外部 ---
class Particle {
  constructor(canvas, ctx, type, isDay) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.type = type;
    this.isDay = isDay;
    this.reset();
  }

  reset() {
    if (!this.canvas) return;
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    if (this.type === "rain") {
      this.vy = Math.random() * 5 + 10;
      this.vx = 0.5;
      this.len = Math.random() * 20 + 10;
    } else if (this.type === "snow") {
      this.vy = Math.random() * 2 + 1;
      this.vx = Math.random() * 2 - 1;
      this.size = Math.random() * 3 + 2;
    } else if (this.type === "stars") {
      this.size = Math.random() * 2;
      this.alpha = Math.random();
      this.fade = Math.random() * 0.02;
    } else if (this.type === "fog") {
      this.vy = Math.random() * 0.3 - 0.15;
      this.vx = Math.random() * 0.4 - 0.2;
      this.size = Math.random() * 80 + 40;
      this.alpha = Math.random() * 0.3 + 0.1;
      this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
    } else if (this.type === "lightning") {
      this.startTime = Date.now();
      this.duration = Math.random() * 200 + 100;
      this.active = true;
      this.x = Math.random() * this.canvas.width;
      this.y = Math.random() * this.canvas.height * 0.5;
    }
  }

  update() {
    if (!this.canvas) return;
    if (this.type === "stars") {
      this.alpha += this.fade;
      if (this.alpha <= 0 || this.alpha >= 1) this.fade = -this.fade;
      return;
    } else if (this.type === "fog") {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha += 0.005 * this.fadeDirection;
      if (this.alpha <= 0.05 || this.alpha >= 0.4) {
        this.fadeDirection = -this.fadeDirection;
      }
      if (this.x < -this.size) this.x = this.canvas.width + this.size;
      if (this.y < -this.size) this.y = this.canvas.height + this.size;
      return;
    } else if (this.type === "lightning") {
      const elapsed = Date.now() - this.startTime;
      if (elapsed > this.duration + 2000) {
        this.reset();
      }
      return;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > this.canvas.height) {
      this.y = -10;
      this.x = Math.random() * this.canvas.width;
    }
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.beginPath();
    if (this.type === "rain") {
      // 2. 修改雨滴顏色邏輯
      if (this.isDay) {
        // 白天雨滴：使用藍色，稍微透明
        this.ctx.strokeStyle = "rgba(100, 149, 237, 0.6)";
      } else {
        // 晚上雨滴：維持原來的白色半透明
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      }
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(this.x, this.y);
      this.ctx.lineTo(this.x + this.vx, this.y + this.len);
      this.ctx.stroke();
    } else if (this.type === "snow") {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.type === "stars") {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.type === "fog") {
      // 繪製霧氣顆粒
      const gradient = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      gradient.addColorStop(0, `rgba(200, 200, 200, ${this.alpha})`);
      gradient.addColorStop(1, `rgba(200, 200, 200, 0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.type === "lightning") {
      // 繪製閃電
      const elapsed = Date.now() - this.startTime;
      if (elapsed < this.duration) {
        const brightness = Math.max(0, 1 - elapsed / this.duration);
        this.ctx.strokeStyle = `rgba(255, 255, 200, ${brightness})`;
        this.ctx.lineWidth = 3 + Math.random() * 2;
        this.ctx.lineCap = "round";
        
        // 繪製鋸齒狀閃電
        const segments = 5;
        let currentX = this.x;
        let currentY = this.y;
        
        this.ctx.beginPath();
        this.ctx.moveTo(currentX, currentY);
        
        for (let i = 0; i < segments; i++) {
          currentX += (Math.random() - 0.5) * 60;
          currentY += this.canvas.height / segments + Math.random() * 20;
          this.ctx.lineTo(currentX, currentY);
        }
        
        this.ctx.stroke();
      }
    }
  }
}
const WeatherParticles = ({ type, isDay }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!type || type === "clouds") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];

    const resize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", resize);
    resize();

    // 修正：直接實例化外部的 Particle 類別，並傳入參數
    const count = 
      type === "rain" ? 150 : 
      type === "snow" ? 80 : 
      type === "fog" ? 30 : 
      type === "lightning" ? 8 : 
      100;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(canvas, ctx, type, isDay));
    }

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, isDay]);

  if (!type || type === "clouds") return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
};
// 2. 雲層 SVG
const CloudSVG = ({ style, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill={color}
    style={{
      ...style,
      position: "absolute",
      filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1)) blur(3px)",
    }}
  >
    <path d="M18.5,12c-0.3,0-0.6,0.1-0.9,0.1C17.2,9.1,14.4,7,11,7c-4.4,0-8,3.6-8,8s3.6,8,8,8c0.6,0,1.2-0.1,1.7-0.2C13.5,23.5,14.7,24,16,24c3.3,0,6-2.7,6-6S19.3,12,18.5,12z" />
  </svg>
);

// 3. 天體與雲層控制
const SkyObjects = ({ isDay, condition }) => {
  const showCelestial = condition === "clear";
  const isCloudy = condition !== "clear";
  // 根據天氣狀況決定雲的顏色
  let cloudColor;
  if (condition === "rain" || condition === "snow") {
    cloudColor = "#bdc3c7"; // 原本的雨雪天灰色
  } else if (condition === "cloudy" && isDay) {
    cloudColor = "#d1d5db"; // 新增：白天多雲時使用淺灰色
  } else {
    cloudColor = "#ecf0f1"; // 預設白色 (夜晚或晴天)
  }

  // 天體樣式
  const celestialStyle = {
    top: "10%",
    right: "10%",
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: isDay ? "#f1c40f" : "transparent",
    boxShadow: isDay
      ? "0 0 60px #f39c12" // 白天太陽光暈
      : "-30px 10px 0 0 #f5f6fa, -30px 10px 15px 2px rgba(245, 246, 250, 0.4)", // 夜晚月亮
    transform: showCelestial
      ? isDay
        ? "scale(1)"
        : "rotate(-15deg) scale(0.8)"
      : "scale(0) translateY(50px)",
    opacity: showCelestial ? 1 : 0,
    zIndex: 0,
    position: "absolute",
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* 太陽/月亮 */}
      <div
        className="transition-all duration-1000 ease-in-out"
        style={celestialStyle}
      />

      {/* 雲層 (CSS 動畫需在全域樣式定義) */}
      {isCloudy && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-hidden opacity-60">
          <CloudSVG
            color={cloudColor}
            style={{
              width: "200px",
              top: "15%",
              opacity: 0.8,
              animation: "cloudFloat 30s linear infinite",
            }}
          />
          <CloudSVG
            color={cloudColor}
            style={{
              width: "150px",
              top: "35%",
              opacity: 0.6,
              animation: "cloudFloat 45s linear infinite reverse",
            }}
          />
          <CloudSVG
            color={cloudColor}
            style={{
              width: "250px",
              top: "5%",
              opacity: 0.4,
              animation: "cloudFloat 60s linear infinite",
            }}
          />
        </div>
      )}
    </div>
  );
};

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
// const isDev = import.meta.env.DEV; // Vite 環境變量：開發環境為 true
const isDev = true; // 固定為開發模式true，方便測試

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

  // --- 裝置與匯率狀態 ---
  const [isMobile, setIsMobile] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [rateData, setRateData] = useState({
    current: null,
    trend: "neutral",
    diff: 0,
    loading: true,
    error: false,
  });
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const { code, target } = tripConfig.currency;

  // 1. 偵測是否為手機裝置
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

  // 2. 監聽網路狀態，與匯率 UI 共用
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

  // 3. 匯率抓取：集中在 App 供匯率元件與計算機共用
  useEffect(() => {
    if (!isOnline) {
      setRateData((prev) => ({ ...prev, loading: false }));
      return;
    }

    setRateData((prev) => ({ ...prev, loading: true, error: false }));

    const fetchRates = async () => {
      try {
        const nowRes = await fetch(
          `https://latest.currency-api.pages.dev/v1/currencies/${code}.json`,
        );
        const nowData = await nowRes.json();
        const currentRate = nowData[code][target.toLowerCase()];

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const dateStr = pastDate.toISOString().split("T")[0];

        const pastRes = await fetch(
          `https://try.readme.io/https://${dateStr}.currency-api.pages.dev/v1/currencies/${code}.json`,
        );
        let pastRate = currentRate;
        if (pastRes.ok) {
          const pastData = await pastRes.json();
          pastRate = pastData[code][target.toLowerCase()];
        }

        const diff = currentRate - pastRate;
        let trend = "neutral";
        if (diff > 0.0001) trend = "up";
        if (diff < -0.0001) trend = "down";

        setRateData({
          current: currentRate,
          trend,
          diff,
          loading: false,
          error: false,
        });
      } catch (err) {
        console.error("匯率抓取失敗:", err);
        setRateData((prev) => ({ ...prev, loading: false, error: true }));
      }
    };

    fetchRates();
  }, [code, target, isOnline]);

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

    // 檢查檔案大小（超過 5MB 可能阻塞主線程）
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      showToast("圖片檔案過大（超過 5MB），請選擇較小的圖片", "error");
      return;
    }

    // 使用 requestIdleCallback 將 Base64 轉換延遲到空閒時間
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;

      // 異步處理圖片壓縮（使用 requestIdleCallback 避免阻塞主線程）
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            processImageCompression(imageData);
          },
          { timeout: 2000 },
        );
      } else {
        // Fallback: setTimeout for older browsers
        setTimeout(() => {
          processImageCompression(imageData);
        }, 100);
      }
    };
    reader.readAsDataURL(file);
  };

  // 提取圖片壓縮邏輯到獨立函式
  const processImageCompression = (imageData) => {
    const img = new Image();
    img.src = imageData;
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
  const currentTheme = React.useMemo(
    () =>
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
      },
    [],
  );

  const cBase = currentTheme.colorBase; // e.g., "slate"
  const cAccent = currentTheme.colorAccent; // e.g., "sky"

  // 使用 useMemo 統一 Memo 風格，僅在 isDarkMode 變更時重建
  const theme = React.useMemo(
    () => ({
      // 背景
      bg: isDarkMode
        ? `${currentTheme.bgGradientDark} bg-[image:var(--bg-texture)] bg-fixed`
        : `${currentTheme.bgGradientLight} bg-[image:var(--bg-texture)] bg-fixed`,

      // 文字
      text: isDarkMode
        ? currentTheme.textColors?.dark || `text-${cBase}-100`
        : currentTheme.textColors?.light || `text-${cBase}-800`,

      textSec: isDarkMode
        ? currentTheme.textColors?.secDark || `text-${cBase}-300`
        : currentTheme.textColors?.secLight || `text-${cBase}-600`,

      // 🌟 卡片質感：夜間改為較亮的深灰玻璃
      cardBg: isDarkMode
        ? `bg-[#262626]/85 backdrop-blur-md backdrop-saturate-150 border-white/10 transform-gpu`
        : `bg-white/80 backdrop-blur-md backdrop-saturate-150 border-white/40 transform-gpu`,

      // 邊框
      cardBorder: isDarkMode ? `border-white/10` : `border-${cBase}-200/50`,

      // 陰影系統（分層次）
      cardShadow: isDarkMode
        ? "shadow-2xl shadow-black/40"
        : `shadow-xl shadow-${cBase}-500/5`,
      
      // 額外陰影層級
      shadowSm: isDarkMode ? "shadow-sm shadow-black/30" : "shadow-sm shadow-stone-200/50",
      shadowMd: isDarkMode ? "shadow-lg shadow-black/35" : `shadow-md shadow-${cBase}-300/30`,
      shadowLg: isDarkMode ? "shadow-2xl shadow-black/40" : `shadow-lg shadow-${cBase}-400/20`,
      shadowXl: isDarkMode ? "shadow-2xl shadow-black/50" : `shadow-xl shadow-${cBase}-500/25`,

      // 強調色
      accent: isDarkMode ? `text-${cAccent}-300` : `text-${cAccent}-600`,
      accentBg: isDarkMode ? `bg-${cAccent}-500/20` : `bg-${cAccent}-100`,

      // 導覽列
      navBg: isDarkMode
        ? `bg-[#2A2A2A]/80 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/30`
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
    }),
    [isDarkMode, cBase, cAccent, currentTheme],
  );

  // 將紋理傳遞給 CSS 變數，避免每次渲染重建物件
  const containerStyle = React.useMemo(
    () => ({
      "--bg-texture": currentTheme.bgTexture,
    }),
    [currentTheme.bgTexture],
  );

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
  // 新增：定義 Framer Motion 動畫變數
  // 這裡決定了畫面要怎麼進場 (enter) 和退場 (exit)
  // 🆕 優化：添加 willChange + backdropFilter 優化，解決毛玻璃閃爍
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute",
      width: "100%",
      // 強制啟用硬體加速，減少閃爍與延遲
      z: 0,
      willChange: "transform, opacity",
      // 預先啟用 GPU：某些裝置需要這個提示
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
        duration: 0.35, // 稍微增加一點點時間，讓動畫更滑順
        ease: [0.23, 1, 0.32, 1], // 使用自訂 bezier 曲線（更具回彈感的減速）
        // 🆕 分離 opacity 動畫，讓毛玻璃效果更平滑
        opacity: { duration: 0.3, ease: "easeOut" },
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
        // 🆕 優化：exit 動畫也分離 opacity
        opacity: { duration: 0.15 },
      },
    }),
  };

  const onTouchStart = (e) => {
    // 同時記錄 X 和 Y，用來判斷斜率
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };
  // 🟢 新增：主動式防干擾監聽器 (解決 passive event 錯誤)

  // 🟢 替換整個 onTouchEnd
  const onTouchEnd = (e) => {
    if (!touchStart) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    // 計算水平與垂直的移動距離
    const distanceX = touchStart.x - endX;
    const distanceY = touchStart.y - endY;

    // 取絕對值 (不管往左還往右，距離都是正的)
    const absX = Math.abs(distanceX);
    const absY = Math.abs(distanceY);

    // ⚙️ 設定閥值
    const minSwipeDistance = 75; // 門檻提高：要滑動 75px 才算數 (原本 50)
    const slopeThreshold = 2.5; // 嚴格度：水平距離必須是垂直距離的 2.5 倍以上

    // 🛡️ 核心判斷：
    // 1. 水平滑動距離夠長嗎？ (absX > minSwipeDistance)
    // 2. 是純粹的水平滑動嗎？ (absX > absY * slopeThreshold)
    //    如果 absY (垂直移動) 很大，代表使用者正在捲動網頁，這裡就會回傳 false，避免誤觸。
    if (absX > minSwipeDistance && absX > absY * slopeThreshold) {
      // 🆕 測試模式：滑動會重置計數
      if (testModeClickCount > 0) {
        setTestModeClickCount(0);
        showToast("連續點擊計數已重置，請重新開始", "info");
      }

      // 判斷方向
      if (distanceX > 0) {
        // 往左滑 (手指由右向左) -> 下一頁
        if (activeDay < itineraryData.length - 1) {
          changeDay(activeDay + 1);
        }
      } else {
        // 往右滑 (手指由左向右) -> 上一頁
        if (activeDay > -1) {
          changeDay(activeDay - 1);
        }
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
  useEffect(() => {
    window.setTestWeather = (code, isDark) => {
      // 1. 強制修改天氣代碼 (影響總覽頁特效)
      if (code !== undefined) {
        setUserWeather((prev) => ({ ...prev, weatherCode: code }));
      }
      // 2. 強制修改日夜模式 (true=黑夜, false=白天)
      if (isDark !== undefined) {
        setIsDarkMode(isDark);
      }
      console.log(`🧪 測試模式啟動: Code=${code}, DarkMode=${isDark}`);
    };

    // 清理函式
    return () => {
      delete window.setTestWeather;
    };
  }, []);

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

  // --- 🆕 測試模式相關狀態 ---
  const [isTestMode, setIsTestMode] = useState(false);
  const [testModeClickCount, setTestModeClickCount] = useState(0);
  const [testDateTime, setTestDateTime] = useState(new Date());
  const [testLatitude, setTestLatitude] = useState(35.4437); // 輕井澤預設座標
  const [testLongitude, setTestLongitude] = useState(138.3919);
  const [testWeatherOverride, setTestWeatherOverride] = useState({
    overview: null,
    days: {}, // 例如: { 0: 0, 1: 71, ...}
  });
  // 🆕 測試設定鎖定機制：防止其他操作覆蓋測試設定
  const [frozenTestDateTime, setFrozenTestDateTime] = useState(null);
  const [frozenTestWeatherOverride, setFrozenTestWeatherOverride] = useState(null);

  // 🆕 凍結/解凍測試設定的邏輯
  const freezeTestSettings = () => {
    setFrozenTestDateTime(new Date(testDateTime));
    setFrozenTestWeatherOverride(JSON.parse(JSON.stringify(testWeatherOverride)));
    console.log(`🔒 凍結測試設定 - dateTime=${testDateTime.toLocaleString('zh-TW')}, weather=`, testWeatherOverride);
    showToast("✅ 測試設定已凍結，不會被覆蓋", "success");
  };

  const unfreezeTestSettings = () => {
    setFrozenTestDateTime(null);
    setFrozenTestWeatherOverride(null);
    console.log(`🔓 解凍測試設定`);
    showToast("測試設定已解凍", "success");
  };

  // 🆕 測試模式時，根據 testDateTime 更新日夜模式
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

  // --- 🆕 API 中止控制器（AbortController）---
  // 用於中止長期 API 調用，避免卸載後的狀態更新
  const geminiAbortControllerRef = useRef(null);
  const mapsAbortControllerRef = useRef(null);

  // --- 🔧 API 結果快取（內存快取，使用 LRU 策略） ---
  // 快取 Google Places API 查詢結果，key 為 "lat,lng,radius"
  const googlePlacesCacheRef = useRef({});
  // 快取地名查詢結果，key 為 "lat,lng"
  const geoNamesCacheRef = useRef({});
  // 快取大小限制（LRU）
  const CACHE_MAX_SIZE = 50;
  const CACHE_EXPIRY_MS = 3600000; // 1 小時過期

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
      localStorage.setItem(
        getStorageKey(aiMode),
        JSON.stringify(historyToSave),
      );
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
  const shopsFlat = React.useMemo(() => flattenShops(shopGuideData), []);

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
    [], // 不依賴任何外部狀態
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
      else icon = <Sun className={`${iconClass} ${color}`} />;

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

  // 生成 Meteoblue 天氣連結（英文版，支援固定經緯度）
  // 參數可以是 locationKey (string) 或直接傳入 { lat, lon } 物件
  const getWeatherLink = (locationKeyOrCoords) => {
    let lat, lon;
    
    if (typeof locationKeyOrCoords === 'object' && locationKeyOrCoords.lat !== undefined) {
      // 直接傳入經緯度物件（用於總覽頁的用戶位置）
      lat = locationKeyOrCoords.lat;
      lon = locationKeyOrCoords.lon;
    } else {
      // 傳入 locationKey（用於固定地點）
      const location = tripConfig.locations.find((l) => l.key === locationKeyOrCoords);
      if (!location) return "#";
      lat = location.lat;
      lon = location.lon;
    }
    
    // 將經緯度轉換為 Meteoblue 格式（如：36.340N138.630E）
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(lat).toFixed(3);
    const lonAbs = Math.abs(lon).toFixed(3);
    const coords = `${latAbs}${latDir}${lonAbs}${lonDir}`;
    
    // Meteoblue 英文週預報
    return `https://www.meteoblue.com/en/weather/week/${coords}`;
  };

  // --- Trip Date Logic (🆕 支援測試模式) ---
  // 🆕 使用 useMemo 確保當測試時間改變時會重新計算
  const { tripStatus, daysUntilTrip, currentTripDayIndex } = React.useMemo(() => {
    const tripStartDate = new Date(tripConfig.startDate);
    const tripEndDate = new Date(tripConfig.endDate);
    // 🆕 測試模式：優先使用凍結的時間，否則使用 testDateTime，最後才用當前時間
    const displayDateTime = frozenTestDateTime || (isTestMode ? testDateTime : new Date());
    
    console.log(`🧪 行程狀態計算 - isTestMode=${isTestMode}, isFrozen=${!!frozenTestDateTime}, displayDateTime=${displayDateTime.toLocaleString('zh-TW')}`);

    let calculatedTripStatus = "before"; // 'before', 'during', 'after'
    let calculatedDaysUntilTrip = 0;
    let calculatedCurrentTripDayIndex = -1;

    if (displayDateTime < tripStartDate) {
      calculatedTripStatus = "before";
      const diffTime = Math.abs(tripStartDate - displayDateTime);
      calculatedDaysUntilTrip = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (displayDateTime >= tripStartDate && displayDateTime <= tripEndDate) {
      calculatedTripStatus = "during";
      const diffTime = Math.abs(displayDateTime - tripStartDate);
      calculatedCurrentTripDayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      console.log(`🧪 正在行程中 - currentTripDayIndex=${calculatedCurrentTripDayIndex}`);
    } else {
      calculatedTripStatus = "after";
    }

    return {
      tripStatus: calculatedTripStatus,
      daysUntilTrip: calculatedDaysUntilTrip,
      currentTripDayIndex: calculatedCurrentTripDayIndex,
    };
  }, [isTestMode, testDateTime, frozenTestDateTime]);

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

      const fetchLocalWeather = async (
        latitude,
        longitude,
        customName = null,
      ) => {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode&forecast_days=2&timezone=auto`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          let city = customName;
          let landmark = "";
          // 預設為 true (假設是不精準的)，除非 OSM 明確回傳了 name
          let isGeneric = true;

          if (!city) {
            try {
              // 🔧 快取地名查詢結果
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

                // 保存到快取
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
            hourly: weatherData.hourly,
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
    [getWeatherData, showToast, isAppReady],
  ); // 🔧 優化：包含 isAppReady 依賴（必要的依賴項）

  // --- 定時更新位置與天氣邏輯 (改為：載入時立即啟動 + 每10分鐘背景更新) ---
  // 🔧 優化：移除過度的 userWeather 依賴項，避免無限迴圈
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
  }, [getUserLocationWeather, userWeather.locationName, userWeather.temp]); // 🔧 優化後的依賴項：包含必要的狀態依賴

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
  // --- 卸載清理：中止所有進行中的 API 請求和語音資源 ---
  useEffect(() => {
    return () => {
      // 🆕 清理語音朗讀
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        } catch (error) {
          console.error("清理語音朗讀資源時出錯:", error);
        }
      }

      // 中止所有 API 請求
      if (geminiAbortControllerRef.current) {
        geminiAbortControllerRef.current.abort();
      }
      if (mapsAbortControllerRef.current) {
        mapsAbortControllerRef.current.abort();
      }
    };
  }, []);

  // --- Weather API Integration (加上 AbortController，避免卸載後更新狀態) ---
  useEffect(() => {
    if (!isVerified) return;

    const controller = new AbortController();
    let cancelled = false;

    // 先嘗試從 LocalStorage 載入舊資料 (讓畫面秒開)
    const loadCachedForecast = () => {
      try {
        const cached = localStorage.getItem("trip_weather_forecast");
        if (cached) {
          const parsed = JSON.parse(cached);
          // 簡單檢查資料時效 (例如超過 12 小時就不顯示舊的，或者您可以選擇永遠顯示)
          // 這裡我們先做永遠顯示，確保離線可用
          setWeatherForecast({ ...parsed, loading: false });
          debugLog("📦 已載入 Day1~6 天氣快取");
        }
      } catch (e) {
        console.error("讀取天氣快取失敗", e);
      }
    };

    // 執行載入
    loadCachedForecast();

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

        // 將抓到的新資料存入 LocalStorage
        localStorage.setItem(
          "trip_weather_forecast",
          JSON.stringify(newForecast),
        );

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

    // 🆕 清理函式：組件卸載時確保完全停止語音識別
    return () => {
      if (recognitionRef.current) {
        try {
          // 停止語音識別
          recognitionRef.current.stop();
          // 清除所有事件監聽器，避免內存洩漏
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          // 清除引用
          recognitionRef.current = null;
          // 重置狀態
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
        // 停止當前識別
        recognitionRef.current.stop();
        setListeningLang(null);
      } else {
        // 停止其他語言的識別（如果有的話）
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
      // 發生錯誤時重置狀態
      setListeningLang(null);
      showToast("語音輸入出現問題，請重試", "error");
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

  // --- Google Maps Places API Call Helper（使用正確的 Place Types + 快取 + AbortController） ---
  const fetchGooglePlaces = async (lat, lng, initialRadius = 100) => {
    // 1. 內部執行搜尋的私有函式，方便重複呼叫
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
        // 每次呼叫前中止舊請求，確保不浪費額度
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
        // 🆕 中止請求不是真正的錯誤，直接拋出
        if (error.name === "AbortError") {
          throw new Error("API 請求已被中止");
        }
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
      // 設定半徑 150m，只抓最靠近的點
      const places = await fetchGooglePlaces(latitude, longitude, 100);
      debugLog("🗺️ [Google Maps] API 回傳原始結果:", places);

      // if (places && places.length > 0) {
      //   // 3. 取第一個結果 (Google 預設依關聯度/距離排序)
      //   const bestPlace = places[0];
      //   // Google Places API (New) 的 displayName 是物件: { text: "店名", languageCode: "zh-TW" }
      //   const name = bestPlace.displayName?.text || bestPlace.name;

      //   if (name) {
      //     debugLog(`🗺️ [Google Maps]  找到最佳地標: "${name}"`);
      //     return { name: name, source: "maps-direct" };
      //   } else {
      //     debugLog("🗺️ [Google Maps]  附近沒有顯著地標 (Zero Results)");
      //   }
      // }
      if (places) {
        // places 現在就是最終的地標字串 (例如 "東京鐵塔")
        debugLog(`🗺️ [Google Maps] 找到最佳地標: "${places}"`);
        return { name: places, source: "maps-direct" };
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

  // --- 🆕 測試模式相關函式 ---
  const handleTitleClick = () => {
    // 靜默計數，不顯示提示
    if (testModeClickCount === 0) {
      // 開始新一輪計數
      setTestModeClickCount(1);
    } else if (testModeClickCount < 9) {
      setTestModeClickCount(testModeClickCount + 1);
    } else if (testModeClickCount === 9) {
      // 達到 10 次時才顯示提示
      setTestModeClickCount(10);
      showToast("🩷", "success");
    }
  };

  const handleInterruptClick = () => {
    // 任何其他點擊都重置計數
    if (testModeClickCount > 0) {
      setTestModeClickCount(0);
      showToast("連續點擊計數已重置，請重新開始", "info");
    }
  };

  const handleLockButtonClick = () => {
    // 鎖定按鈕的點擊邏輯
    if (testModeClickCount === 10) {
      // 進入測試模式 - 重置所有測試變數到當前實際值
      setTestDateTime(new Date());
      setTestLatitude(userWeather?.lat || 35.6762);
      setTestLongitude(userWeather?.lon || 139.6503);
      setTestWeatherOverride({ overview: null, days: {} });
      setIsTestMode(true);
      setTestModeClickCount(0);
      showToast("🩷 進入測試模式！", "success");
    } else {
      // 正常鎖定行程
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
    // 🆕 測試模式：使用 testDateTime
    const displayTime = isTestMode ? testDateTime : new Date();
    const localTimeStr = displayTime.toLocaleString("zh-TW", {
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
        // 🆕 測試模式：使用 testDateTime
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

  // --- Weather Determination ---
  const current = activeDay === -1 ? null : itineraryData[activeDay];

  // Determine current weather based on day
  const currentLocation = getDailyLocation(activeDay);

  // 使用 useMemo 鎖定天氣資料，優化滑動效能
  const displayWeather = React.useMemo(() => {
    const currentLocation = getDailyLocation(activeDay);
    const weatherData = weatherForecast[currentLocation];
    // 🆕 優先使用凍結的天氣設定
    const effectiveWeatherOverride = frozenTestWeatherOverride || testWeatherOverride;

    if (!weatherForecast.loading && weatherData) {
      const dayIndex = activeDay === -1 ? 0 : activeDay;
      const forecastIndex = dayIndex < weatherData.time.length ? dayIndex : 0;
      const maxTemp = Math.round(weatherData.temperature_2m_max[forecastIndex]);
      const minTemp = Math.round(weatherData.temperature_2m_min[forecastIndex]);
      
      // 🆕 測試模式：使用覆蓋的天氣代碼
      let weatherCode;
      if (isTestMode) {
        if (activeDay === -1) {
          weatherCode = effectiveWeatherOverride.overview !== null ? effectiveWeatherOverride.overview : weatherData.weathercode[forecastIndex];
          console.log(`🧪 測試模式總覽天氣：覆蓋=${effectiveWeatherOverride.overview}, 原始=${weatherData.weathercode[forecastIndex]}, 最終=${weatherCode}, isFrozen=${!!frozenTestWeatherOverride}`);
        } else {
          weatherCode = effectiveWeatherOverride.days[activeDay] !== undefined ? effectiveWeatherOverride.days[activeDay] : weatherData.weathercode[forecastIndex];
          console.log(`🧪 測試模式 Day ${activeDay + 1} 天氣：覆蓋=${effectiveWeatherOverride.days[activeDay]}, 原始=${weatherData.weathercode[forecastIndex]}, 最終=${weatherCode}, isFrozen=${!!frozenTestWeatherOverride}`);
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
  }, [activeDay, weatherForecast, getWeatherInfo, isTestMode, testWeatherOverride, frozenTestWeatherOverride]);

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
  const getParticleType = (code, isDark) => {
    if (code === null || code === undefined) return null;
    // 晴朗且是晚上 -> 星星
    if (code === 0 && isDark) return "stars";
    // 多霧 -> 霧特效
    if ([45, 48].includes(code)) return "fog";
    // 雷雨 -> 閃電特效
    if ([95, 96, 99].includes(code)) return "lightning";
    // 下雨（不包括雷雨）
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
      return "rain";
    // 下雪
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    return null; // 多雲或白天晴朗不顯示粒子
  };

  const getSkyCondition = (code) => {
    if (code === null || code === undefined) return "clear";
    if (code === 0) return "clear";
    if ([1, 2, 3].includes(code)) return "cloudy";
    if ([45, 48].includes(code)) return "fog";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    if ([95, 96, 99].includes(code)) return "thunderstorm";
    return "rain"; // 其他視為有雨或陰天
  };

  // 取得當前應該顯示的天氣代碼 (總覽用 userWeather，行程用 displayWeather)
  let currentEffectCode =
    activeDay === -1 ? userWeather.weatherCode : displayWeather.code;
  
  console.log(`🧪 初始 currentEffectCode=${currentEffectCode}, isTestMode=${isTestMode}, activeDay=${activeDay}, isFrozen=${!!frozenTestWeatherOverride}`);
  
  // 🆕 應用天氣覆寫（優先使用凍結設定，不受 isTestMode 影響）
  const effectiveWeatherOverride = frozenTestWeatherOverride || testWeatherOverride;
  if (activeDay === -1 && effectiveWeatherOverride.overview !== null) {
    // 總覽頁面使用 overview 覆蓋
    currentEffectCode = effectiveWeatherOverride.overview;
    console.log(`🧪 應用${frozenTestWeatherOverride ? '凍結' : ''}總覽天氣覆蓋: ${currentEffectCode}`);
  } else if (activeDay >= 0 && effectiveWeatherOverride.days[activeDay] !== undefined) {
    // 行程頁面使用對應 day 的覆蓋
    currentEffectCode = effectiveWeatherOverride.days[activeDay];
    console.log(`🧪 應用${frozenTestWeatherOverride ? '凍結' : ''} Day ${activeDay + 1} 天氣覆蓋: ${currentEffectCode}`);
  }
  const particleType = getParticleType(currentEffectCode, isDarkMode);
  const skyCondition = getSkyCondition(currentEffectCode);
  const isDayTime = !isDarkMode;
  let dynamicBgStyle = {};

  const weatherColors = tripConfig.theme.weatherColors || {
    rain: "#94a3b8",
    cloud: "#cbd5e1",
    snow: "#94a3b8",
  };

  if (isDayTime) {
    // 判斷是否下雨（不包括雷雨）
    const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(
      currentEffectCode,
    );
    // 判斷是否下雪
    const isSnowing = [71, 73, 75, 77, 85, 86].includes(currentEffectCode);
    // 判斷是否多霧
    const isFoggy = [45, 48].includes(currentEffectCode);
    // 判斷是否雷雨
    const isThunderstorm = [95, 96, 99].includes(currentEffectCode);
    // 判斷是否多雲
    const isCloudy = [1, 2, 3].includes(currentEffectCode);

    if (isThunderstorm) {
      // 白天且雷雨：背景非常暗 (深灰黑色)
      dynamicBgStyle = { backgroundColor: "#4a5568" };
    } else if (isRaining) {
      // 白天且下雨：背景顯著變暗 (深藍灰色)
      dynamicBgStyle = { backgroundColor: weatherColors.rain };
    } else if (isSnowing) {
      // 白天且下雪：背景變暗以突顯白色雪花
      dynamicBgStyle = { backgroundColor: weatherColors.snow };
    } else if (isFoggy) {
      // 白天且多霧：背景使用霧白色
      dynamicBgStyle = { backgroundColor: "#c7d2e0" };
    } else if (isCloudy) {
      // 白天且多雲：背景稍微變暗 (淺灰色)
      dynamicBgStyle = { backgroundColor: "#cbd5e1" };
    }
  }
  return (
    <div
      style={{ ...containerStyle, ...dynamicBgStyle }}
      className={`min-h-screen transition-colors duration-500 ${theme.bg} ${theme.text} relative overflow-hidden font-sans`}
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

      <style>{`
      @keyframes cloudFloat {
          from { transform: translateX(-100%); }
          to { transform: translateX(100vw); }
      }
      @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
      .animate-slide-up { animation: slideUp 0.3s ease-out; }
      .animate-slide-down { animation: slideDown 0.3s ease-out; }
      .animate-scale-in { animation: scaleIn 0.25s ease-out; }
      .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
      `}</style>
      <SkyObjects isDay={!isDarkMode} condition={skyCondition} />
      <WeatherParticles type={particleType} isDay={!isDarkMode} />
      {/* 雷雨時同時顯示雨和閃電 */}
      {particleType === "lightning" && (
        <WeatherParticles type="rain" isDay={!isDarkMode} />
      )}

      <div className="max-w-md mx-auto relative min-h-screen flex flex-col z-10">
        {/* Header Title with Material Glass */}
        {/* 1. items-end: 讓左邊標題卡片與右邊匯率卡片的「底部」對齊 */}
        {/* 2. gap-4: 拉開左右兩邊的距離，創造呼吸感 */}
        <div className="flex justify-between items-end px-4 pt-5 pb-2 relative z-20 gap-4">
          {/* 左側：標題卡片 - 添加點擊邏輯 */}
          {/* 3. min-w-0: 允許 flex item 縮小，防止破版 */}
          <div
            className={`px-3 py-2 rounded-2xl backdrop-blur-md shadow-sm border transition-all duration-300 min-w-0 cursor-pointer select-none active:scale-95 ${theme.cardBg} ${theme.cardBorder}`}
            onClick={handleTitleClick}
          >
            {/* 4. text-base + whitespace-nowrap: 字體改小一點，且強制不換行 */}
            <h1
              className={`text-base font-bold tracking-wide transition-colors whitespace-nowrap ${theme.text}`}
            >
              {tripConfig.title}
            </h1>
            {/* 5. text-[10px]: 副標題改更小，視覺層次更好 */}
            <p
              className={`text-[10px] mt-0.5 font-medium tracking-widest whitespace-nowrap ${theme.textSec}`}
            >
              {tripConfig.subTitle}
            </p>
          </div>

          {/* 右側：按鈕組 + 匯率卡片 */}
          {/* flex-shrink-0: 防止右側被擠壓變形 */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* 第一排：功能按鈕 (維持原樣) */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLockButtonClick();
                }}
                className={`p-2 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 active:scale-90 ${theme.cardBg} ${theme.cardBorder} ${theme.accent}`}
                title={testModeClickCount === 10 ? "進入測試模式" : "鎖定行程"}
                aria-label="鎖定或解鎖行程"
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
                title={isDarkMode ? "切換為亮色模式" : "切換為深色模式"}
              >
                {isDarkMode ? (
                  <Moon className="w-4 h-4 fill-current" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500 fill-current" />
                )}
              </button>
            </div>

            {/* 第二排：匯率資訊 */}
            <CurrencyWidget
              isDarkMode={isDarkMode}
              theme={theme}
              rateData={rateData}
              isOnline={isOnline}
            />
          </div>
        </div>

        {/* --- Tab Content --- */}

        {/* 1. 行程分頁 (Itinerary Tab) - 完整動畫版 */}
        {activeTab === "itinerary" && (
          <div
            className="flex-1 space-y-5 px-4 pb-32 overflow-x-hidden relative"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            ref={scrollContainerRef}
            // 🆕 優化：應用 GPU 加速容器類名
            style={{
              willChange: "scroll-position",
              transform: "translateZ(0)",
              WebkitPerspective: "1000px",
              perspective: "1000px",
            }}
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
                aria-label="查看行程總覽"
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 border backdrop-blur-sm flex items-center gap-1.5 shadow-sm active:scale-95 hover:scale-105
                  ${
                    activeDay === -1
                      ? `${theme.accentBg} ${theme.accent} ${isDarkMode ? "border-neutral-600" : "border-stone-300"} scale-105 shadow-md`
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
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 border backdrop-blur-sm shadow-sm active:scale-95 hover:scale-105
                    ${
                      activeDay === index
                        ? `${theme.accentBg} ${theme.text} ${isDarkMode ? "border-neutral-600" : "border-stone-300"} scale-105 shadow-md`
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
                    {/* === 總覽頁面：天氣與預報卡片 (放大字體與緊湊版) === */}
                    <div
                      className={`backdrop-blur-xl border rounded-[1.5rem] p-4 ${theme.cardShadow} transition-colors duration-300 relative overflow-hidden ${theme.cardBg} ${theme.cardBorder}`}
                    >
                      {/* 上半部：目前天氣與地點 */}
                      <div className="flex justify-between items-center mb-3">
                        {/* 左側：水平排列的溫度與資訊 */}
                        <div className="flex items-center gap-4">
                          {/* 1. 大溫度 (保持 5xl 但稍微加粗) */}
                          <div
                            className={`text-5xl font-medium tracking-tighter ${theme.text}`}
                          >
                            {userWeather.temp !== null
                              ? userWeather.temp
                              : "--"}
                            °
                          </div>

                          {/* 2. 資訊堆疊 (字體全面放大) */}
                          <div className="flex flex-col justify-center gap-0.5">
                            <div
                              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-90 ${theme.textSec}`}
                            >
                              <LocateFixed
                                className={`w-3.5 h-3.5 ${theme.accent}`}
                              />{" "}
                              <span className="flex items-center gap-1">
                                {userWeather.locationName}
                                <a
                                  href={getWeatherLink({ lat: userWeather.lat, lon: userWeather.lon })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-0.5 rounded-md transition-all hover:scale-125 active:scale-95 ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/5 text-stone-400 hover:text-stone-600"}`}
                                  title="查看此位置的詳細氣象資訊"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </span>
                            </div>
                            {/* 天氣狀況與高低溫 */}
                            <div className="flex flex-col">
                              <span
                                className={`text-base font-bold leading-tight ${theme.text}`}
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

                        {/* 右側：更新按鈕 */}
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

                      {/* 中間：每 2 小時預報共 7 個時段（緊湊版） */}
                      <div
                        className={`w-full overflow-x-auto pb-1 mb-1 scrollbar-hide`}
                      >
                        {/* 緊湊佈局，移除 min-w 限制 */}
                        <div className="flex justify-between items-center px-0.5">
                          {[0, 2, 4, 6, 8, 10, 12].map((offset, i) => {
                            // 🆕 測試模式：使用 testDateTime
                            const displayTime = isTestMode ? new Date(testDateTime) : new Date();
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
                                className="flex flex-col items-center gap-0.5 min-w-0 px-0.5 py-1 rounded-lg hover:bg-black/5 transition-colors group flex-1"
                              >
                                {/* 時間：縮小字體 */}
                                <span
                                  className={`text-[9px] font-bold opacity-70 group-hover:opacity-100 whitespace-nowrap ${theme.textSec}`}
                                >
                                  {timeLabel}
                                </span>

                                {/* 圖示：縮小尺寸 */}
                                <div className="transform transition-transform group-hover:scale-110 drop-shadow-sm scale-90">
                                  {icon}
                                </div>

                                {/* 溫度：縮小字體 */}
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

                      {/* 下半部：智慧行程預報 (動態地名 + 介面置中優化版) */}
                      <div
                        className={`mt-2 pt-2.5 border-t flex flex-col justify-center min-h-[36px] ${isDarkMode ? "border-white/15" : "border-black/5"}`}
                      >
                        {userWeather.temp !== null ? (
                          (() => {
                            // 1. 決定比較對象
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
                              // ✅ 修改 1：動態抓取第一天的地點名稱 (如：輕井澤)
                              const firstLocKey = getDailyLocation(0);
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

                            // 2. 取得資料
                            const targetLoc = getDailyLocation(targetDayIndex);
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

                            // 3. 計算差異 (已移除未使用的 isHotter)
                            const diff = destAvg - userWeather.temp;
                            const absDiff = Math.abs(diff).toFixed(0);
                            const isColder = diff < 0;
                            const weatherInfo = getWeatherData(destCode);

                            // 4. 生成智慧建議文案
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

                            // 5. 渲染 UI
                            return (
                              // ✅ 修改 2：改用 items-center 讓標籤與文字垂直置中，視覺更整齊
                              <div className="flex items-center gap-2.5 animate-fadeIn">
                                {/* 左側標籤：移除了 mt-0.5，讓 flexbox 自動置中 */}
                                <div
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap tracking-wide ${isDarkMode ? "bg-white/10 text-neutral-300" : "bg-black/5 text-stone-600"}`}
                                >
                                  {targetName}
                                </div>

                                {/* 右側：整合資訊 */}
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
                        role="button"
                        tabIndex={0}
                        aria-expanded={isFlightInfoExpanded}
                        aria-controls="flight-info-content"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsFlightInfoExpanded(!isFlightInfoExpanded);
                          }
                        }}
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
                        <div id="flight-info-content" className="animate-fadeIn">
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
                    className="space-y-5"
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
                              <span className="flex items-center gap-1">
                                {tripConfig.locations.find(
                                  (l) => l.key === currentLocation,
                                )?.name || "當地"}
                                <a
                                  href={getWeatherLink(currentLocation)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-0.5 rounded-md transition-all hover:scale-125 active:scale-95 ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/5 text-stone-400 hover:text-stone-600"}`}
                                  title="查看此位置的詳細氣象資訊"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </span>
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
                              className={`text-2xl font-extrabold mb-2 leading-tight drop-shadow-sm ${theme.text}`}
                            >
                              {current.title}
                            </h2>

                            {/* Hotel Info Inline */}
                            {!current.stay.includes("溫暖的家") && (
                              <div className={`text-xs font-medium flex items-center gap-1.5 mt-2 ${theme.textSec}`}>
                                <Hotel className={`w-3.5 h-3.5 ${theme.accent}`} />
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
                                  events={current.events}
                                  userLocation={userWeather}
                                  isDarkMode={isDarkMode}
                                />
                              </Suspense>
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
          <div className="flex-1 px-4 pb-32 space-y-5 animate-fadeIn">
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
                {guidesData && guidesData.length > 0 ? (
                  guidesData.map((guide, idx) => {
                  const isGuideOpen = expandedGuides[idx];
                  return (
                    <div
                      key={idx}
                      className={`backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 transform ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/70 border-white/60"}`}
                    >
                      {/* Guide Header - Clickable */}
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
                        <div id={`guide-${idx}-content`} className="px-5 pb-5 animate-fadeIn">
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
                })
                ) : (
                  <div className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}>
                    <BookOpen className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`} />
                    <p className={`text-sm font-medium ${theme.textSec}`}>暫無參考指南</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-neutral-600" : "text-stone-400"}`}>敬請期待更多內容</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. 商家導覽 (Shops Tab) */}
        {activeTab === "shops" && (
          <div className="flex-1 px-4 pb-32 space-y-5 animate-fadeIn">
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
                {shopGuideData && shopGuideData.length > 0 ? (
                  shopGuideData.map((areaData, idx) => {
                  const isShopOpen = expandedShops[idx];
                  return (
                    <div
                      key={idx}
                      className={`backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 transform ${isDarkMode ? "bg-neutral-800/30 border-neutral-700" : "bg-white/60 border-stone-200"}`}
                    >
                      {/* Shop Header - Clickable */}
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
                        <div id={`shop-${idx}-content`} className="px-5 pb-5 animate-fadeIn">
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
                })
                ) : (
                  <div className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}>
                    <Store className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`} />
                    <p className={`text-sm font-medium ${theme.textSec}`}>暫無商家資訊</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-neutral-600" : "text-stone-400"}`}>敬請期待更多內容</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. AI 導遊 (AI Tab) */}
        {activeTab === "ai" && (
          <div className="flex-1 px-4 pb-32 space-y-5 flex flex-col h-[calc(100vh-130px)] animate-fadeIn">
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
                  renderMessage={renderMessage}
                  handleSpeak={handleSpeak}
                  isLoading={isLoading}
                  loadingText={loadingText}
                  chatEndRef={chatEndRef}
                  setFullPreviewImage={setFullPreviewImage}
                />
              </Suspense>

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

        {/* 5. 實用連結 (Resources Tab) */}
        {activeTab === "resources" && (
          <div className="flex-1 px-4 pb-32 space-y-5 animate-fadeIn">
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
                {usefulLinks && usefulLinks.length > 0 ? (
                  usefulLinks.map((section, idx) => (
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
                ))
                ) : (
                  <div className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}>
                    <LinkIcon className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`} />
                    <p className={`text-sm font-medium ${theme.textSec}`}>暫無實用連結</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-neutral-600" : "text-stone-400"}`}>敬請期待更多內容</p>
                  </div>
                )}
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
              onClick={() => {
                handleInterruptClick();
                setActiveTab("itinerary");
              }}
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
              <Home
                className={`w-5 h-5 ${activeTab === "itinerary" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "itinerary" && (
                <span className="absolute -bottom-[3px] w-1 h-1 rounded-full bg-current opacity-80 shadow-sm"></span>
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
                      ? `bg-${cBase}-800/50 text-${cAccent}-400 border-${cBase}-600/30`
                      : `bg-${cBase}-200/50 text-${cBase}-700 border-${cBase}-300/40 shadow-sm`
                    : isDarkMode
                      ? `border-transparent text-${cBase}-400 hover:text-${cBase}-200 hover:bg-${cBase}-700/20`
                      : `border-transparent text-${cBase}-500 hover:text-${cBase}-700 hover:bg-${cBase}-200/30`
                }`}
            >
              <BookOpen
                className={`w-5 h-5 ${activeTab === "guides" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "guides" && (
                <span className="absolute -bottom-[3px] w-1 h-1 rounded-full bg-current opacity-80 shadow-sm"></span>
              )}
            </button>

            {/* 3. AI 核心按鈕 (修正版：使用完整 Class 名稱) */}
            <button
              onClick={() => {
                handleInterruptClick();
                setActiveTab("ai");
              }}
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
                        : "bg-gradient-to-tr from-stone-400 to-stone-500 ring-stone-400/50 border-stone-300/50",
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
              onClick={() => {
                handleInterruptClick();
                setActiveTab("shops");
              }}
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
              <Store
                className={`w-5 h-5 ${activeTab === "shops" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
              {activeTab === "shops" && (
                <span className="absolute -bottom-[3px] w-1 h-1 rounded-full bg-current opacity-80 shadow-sm"></span>
              )}
            </button>

            {/* 5. 連結 (Resources) */}
            <button
              onClick={() => {
                handleInterruptClick();
                setActiveTab("resources");
              }}
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
              <LinkIcon
                className={`w-5 h-5 ${activeTab === "resources" ? "stroke-[2.5px]" : "stroke-2"}`}
              />
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

        {/* 🆕 計算機按鈕：取代全螢幕切換 */}
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

        <CalculatorModal
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
          isDarkMode={isDarkMode}
          rateData={rateData}
          currencyCode={tripConfig.currency.code}
          currencyTarget={tripConfig.currency.target}
        />

        {/* 🆕 測試模式面板 */}
        <TestModePanel
          isOpen={isTestMode}
          onClose={() => setIsTestMode(false)}
          testDateTime={testDateTime}
          onDateTimeChange={(newDateTime) => {
            console.log(`🧪 更新時間: ${testDateTime.toLocaleString('zh-TW')} -> ${newDateTime.toLocaleString('zh-TW')}`);
            setTestDateTime(newDateTime);
          }}
          testLatitude={testLatitude}
          testLongitude={testLongitude}
          onLocationChange={(coords) => {
            console.log(`🧪 更新位置: (${testLatitude}, ${testLongitude}) -> (${coords.lat}, ${coords.lon})`);
            setTestLatitude(coords.lat);
            setTestLongitude(coords.lon);
            // 🆕 在測試模式下，主動抓取新座標的天氣資料
            getUserLocationWeather({
              isSilent: false,
              coords: { latitude: coords.lat, longitude: coords.lon }
            });
          }}
          testWeatherOverride={testWeatherOverride}
          onWeatherChange={(newOverride) => {
            console.log(`🧪 更新天氣覆蓋: `, testWeatherOverride, ` -> `, newOverride);
            setTestWeatherOverride(newOverride);
          }}
          theme={theme}
          isDarkMode={isDarkMode}
          itineraryData={itineraryData}
          currentUserWeather={userWeather}
          // 🔒 凍結相關的 props
          isFrozen={!!frozenTestDateTime || !!frozenTestWeatherOverride}
          onFreeze={freezeTestSettings}
          onUnfreeze={unfreezeTestSettings}
        />

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
