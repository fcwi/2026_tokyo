import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, CloudSnow, MapPin, Train, ShoppingBag, 
  Star, Camera, AlertCircle, Snowflake, Hotel, Utensils, 
  ChevronDown, ChevronUp, Info, ExternalLink, QrCode, 
  Calendar, Link as LinkIcon, Home, Clock, Store, Coffee, Map, BookOpen, FileText,
  Sparkles, Send, MessageSquare, Loader, User, Bot, Briefcase, Thermometer, Navigation, Shield, Scissors, Volume2, StopCircle, Mic, MicOff, CloudRain, Cloud, CloudFog, CloudLightning, Wind, ArrowRight, Check, X, Share2, LocateFixed, LayoutDashboard, ListTodo, Plane, History, Phone, Moon, Lock, Unlock, Key
} from 'lucide-react';
import { itineraryData, guidesData, usefulLinks, shopGuideData } from './tripdata.js';

// --- Native Web Crypto API Utilities (取代 crypto-js) ---
const CryptoUtils = {
  buffToHex: (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(''),
  hexToBuff: (hex) => new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []),
  
  // 使用 PBKDF2 + AES-GCM 進行加密
  encrypt: async (text, password) => {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await window.crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(text));
    return `${CryptoUtils.buffToHex(salt.buffer)}:${CryptoUtils.buffToHex(iv.buffer)}:${CryptoUtils.buffToHex(encrypted)}`;
  },

  // 解密
  decrypt: async (packedData, password) => {
    try {
      const [saltHex, ivHex, cipherHex] = packedData.split(':');
      if (!saltHex || !ivHex || !cipherHex) throw new Error("Format Error");
      const salt = CryptoUtils.hexToBuff(saltHex);
      const iv = CryptoUtils.hexToBuff(ivHex);
      const ciphertext = CryptoUtils.hexToBuff(cipherHex);
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
      const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      throw new Error("密碼錯誤或資料損毀");
    }
  }
};

// --- 請在此填入加密後的 API Key ---
// 1. 在鎖定畫面點選「加密工具」
// 2. 輸入真實 API Key 和想設定的密碼
// 3. 複製生成的字串並貼上到這裡
// const ENCRYPTED_API_KEY_PAYLOAD = "4ce8a18af7bf710deec098c6ede51461:6e916219785c7b117c29368c:e90feeed8fa696c1232c0a6b80fd766e963575676ecb53435087fa36952a5d086423301d77b215ff52ace77ef99bd62c4c8b1d82330df8"; 
const ENCRYPTED_API_KEY_PAYLOAD = (import.meta.env.VITE_ENCODED_KEY || "").trim(); 

// 簡單的延遲函式
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const ItineraryApp = () => {
  // --- Security State ---
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState(''); // 解密後的 Key 存這裡
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showEncryptTool, setShowEncryptTool] = useState(false); // 控制加密工具顯示

  // 加密工具用的 State
  const [toolKey, setToolKey] = useState('');
  const [toolPwd, setToolPwd] = useState('');
  const [toolResult, setToolResult] = useState('');

  // --- 輔助函式：解析 Markdown 粗體語法 ---
  // 將 "**文字**" 轉換為 <strong>文字</strong>
  const renderMessage = (text) => {
    if (!text) return null;
    // 使用正規表達式切割字串
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // 移除前後的 ** 並用 strong 包裹
        return <strong key={index} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

// 定義一個簡單的複製函式
const handleCopy = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`已複製：${text}`);
  }).catch(() => {
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

  // 修改：增強質感的 Theme 設定 (模擬紙張紋理與高通透玻璃)
  // 修改：導入 SVG Noise 雜訊紋理，模擬真實紙張纖維與石材顆粒
  const theme = {
    // 背景：
    // 使用 SVG Data URI (feTurbulence) 產生隨機雜訊，疊加在漸層底色上
    // 日間：#FDFBF7 (暖白) + 雜訊 = 手抄和紙質感
    // 夜間：#0C0C0C (深灰) + 雜訊 = 粗糙岩石/石板質感
    bg: isDarkMode 
      ? "bg-[#0C0C0C] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E')] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800/30 via-transparent to-transparent" 
      : "bg-[#FDFBF7] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.06%22/%3E%3C/svg%3E')] bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-stone-200/40 via-transparent to-transparent",
    
    // 文字：維持高對比
    text: isDarkMode ? "text-neutral-200" : "text-stone-800",
    textSec: isDarkMode ? "text-neutral-400" : "text-stone-500",
    
    // 卡片：極致磨砂玻璃
    // 增加 backdrop-brightness 讓卡片稍微比背景亮一點，提升層次感
    cardBg: isDarkMode 
      ? "bg-neutral-800/30 backdrop-blur-xl backdrop-saturate-150 backdrop-brightness-110" 
      : "bg-white/40 backdrop-blur-xl backdrop-saturate-150 backdrop-brightness-110",
    
    // 邊框：日間改用更柔和的 warm-gray 色調，減少銳利感
    cardBorder: isDarkMode 
      ? "border-white/10" 
      : "border-stone-200/30",
    
    // 陰影：更擴散、更自然的陰影
    cardShadow: isDarkMode 
      ? "shadow-2xl shadow-black/60" 
      : "shadow-xl shadow-[#5D4037]/5",
    
    // 強調色
    accent: isDarkMode ? "text-sky-200" : "text-[#5D737E]", 
    accentBg: isDarkMode ? "bg-white/5" : "bg-[#5D737E]/10",
    
    // 導覽列：懸浮水滴質感 (幾乎全透明)
    // Opacity 降至 /10 (夜) 與 /20 (日)，配合最強模糊 backdrop-blur-3xl
    navBg: isDarkMode 
      ? "bg-neutral-900/10 backdrop-blur-3xl border-white/5 shadow-2xl shadow-black/20" 
      : "bg-white/20 backdrop-blur-3xl border-white/20 shadow-2xl shadow-[#A8A29E]/10",
      
    // 背景裝飾球：因為背景現在有雜點紋理，裝飾球可以更淡，僅作為光暈效果
    blob1: isDarkMode ? "bg-blue-500/10" : "bg-stone-400/20",
    blob2: isDarkMode ? "bg-purple-500/10" : "bg-orange-300/20",
    blob3: isDarkMode ? "bg-emerald-500/10" : "bg-gray-300/30"
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
      const savedPwd = localStorage.getItem('trip_password');
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
    setAuthError('');
    try {
      if (!ENCRYPTED_API_KEY_PAYLOAD) {
         // 如果還沒設定 payload，但使用者按了解鎖，就當作測試模式
         setIsVerified(true);
         return;
      }
      
      const decryptedKey = await CryptoUtils.decrypt(ENCRYPTED_API_KEY_PAYLOAD, inputPwd);
      
      // 簡單驗證 (Google API Key 通常以 AIza 開頭)
      if (decryptedKey && decryptedKey.length > 10) {
        setApiKey(decryptedKey);
        setIsVerified(true);
        localStorage.setItem('trip_password', inputPwd);
      } else {
        throw new Error("解密失敗");
      }
    } catch (e) {
      if (!isAuto) setAuthError("密碼錯誤，請再試一次");
      if (isAuto) localStorage.removeItem('trip_password'); // 清除無效的舊密碼
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
    } catch (e) {
      setToolResult("加密失敗");
    }
  };

  // Tab state: 'itinerary', 'shops', 'guides', 'resources', 'ai'
  const [activeTab, setActiveTab] = useState('itinerary');
  // activeDay: -1 for Overview, 0-5 for Day 1-6
  const [activeDay, setActiveDay] = useState(-1);
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedGuides, setExpandedGuides] = useState({}); 
  const [expandedShops, setExpandedShops] = useState({}); 
  
  // Checklist State
  // --- 修改：Checklist 持久化與 UI 狀態 ---
  
  // 定義預設檢查清單
  const defaultChecklist = [
    { id: 1, text: "護照 (效期6個月以上)", checked: false },
    { id: 2, text: "VJW 入境申報 QR Code (建議截圖)", checked: false },
    { id: 3, text: "JR 廣域周遊券 / 新幹線車票 (確認取票碼)", checked: false },
    { id: 4, text: "網卡 / 漫遊開通", checked: false },
    { id: 5, text: "日幣現金 & 信用卡 (確認海外開通)", checked: false },
    { id: 6, text: "旅遊保險單 (包含不便險/醫療)", checked: false },
    { id: 7, text: "常備藥物 (退燒、感冒、止瀉、OK繃)", checked: false },
    { id: 8, text: "各類充電器 (手機、手錶) & 行動電源", checked: false },
    { id: 9, text: "禦寒衣物 (洋蔥式穿搭、防水手套、毛帽)", checked: false },
    { id: 10, text: "兒童安撫物 (小被被、慣用玩偶)", checked: false },
    { id: 11, text: "兒童水壺 & 隨身零食 (車程必備)", checked: false },
    { id: 12, text: "濕紙巾、面紙 & 乾洗手 (隨身清潔)", checked: false },
    { id: 13, text: "輕便雨衣 (玩雪用) & 兒童摺疊傘", checked: false },
    { id: 14, text: "雪靴 / 防滑鞋 (建議噴防水噴霧)", checked: false },
    { id: 15, text: "機上/車上娛樂 (畫筆、貼紙書、耳機)", checked: false },
    { id: 16, text: "保濕乳液 & 護唇膏 (預防乾燥蘋果臉)", checked: false },
  ];

  // 初始化 State：優先從 localStorage 讀取
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('trip_checklist_v1');
      if (saved) {
        // 合併邏輯：確保即使 defaultChecklist 更新，舊的 checked 狀態也能對應回去
        const parsed = JSON.parse(saved);
        return defaultChecklist.map(item => {
           const savedItem = parsed.find(p => p.id === item.id);
           return savedItem ? { ...item, checked: savedItem.checked } : item;
        });
      }
    } catch (e) {
      console.error("讀取清單失敗", e);
    }
    return defaultChecklist;
  });

  // 當 checklist 改變時，自動存入 localStorage
  useEffect(() => {
    localStorage.setItem('trip_checklist_v1', JSON.stringify(checklist));
  }, [checklist]);

  // 新增：航班資訊收折狀態 (預設 false = 收折)
  const [isFlightInfoExpanded, setIsFlightInfoExpanded] = useState(false);

  const toggleCheckItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };
  
  // Weather State
  const [weatherForecast, setWeatherForecast] = useState({
    karuizawa: null,
    tokyo: null,
    loading: true
  });

  // User Location Weather State
  const [userWeather, setUserWeather] = useState({
    temp: null,
    desc: '',
    locationName: '定位中...',
    icon: <Loader className={`w-5 h-5 animate-spin ${theme.textSec}`} />,
    loading: false,
    error: null
  });

  // Permission State
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Chat State
  const [messages, setMessages] = useState([
    { role: 'model', text: '您好！我是您的專屬 AI 導遊 ✨\n我已經熟讀了您的 6 天行程。\n\n💡 雙語音翻譯模式：\n🎤 點「中」說話：我會回答您的行程問題，或幫您將中文翻成日文。\n🎤 點「日」說話：錄下店員說的日文，我會直接翻成中文給您看！' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningLang, setListeningLang] = useState(null); 
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // ... existing helper functions (toggleExpand, etc.) ...
  const toggleExpand = (dayIndex, eventIndex) => {
    const key = `${dayIndex}-${eventIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleGuide = (index) => {
    setExpandedGuides(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleShop = (index) => {
    setExpandedShops(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'ai') scrollToBottom();
  }, [messages, activeTab]);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };
  
  // ... existing map and weather helpers ...
  // 1. Get Google Map Link
  const getMapLink = (query) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // 2. Get Weather Info from WMO Code
  const getWeatherInfo = (code) => {
    const iconClass = "w-7 h-7"; // Slightly larger icons
    const color = isDarkMode ? "text-neutral-300" : "text-neutral-600"; // Muted icons
    if (code === 0) return { icon: <Sun className={`${iconClass} ${isDarkMode ? 'text-amber-200' : 'text-amber-500'}`} />, text: "晴朗", advice: "天氣很好，注意防曬。" };
    if ([1, 2, 3].includes(code)) return { icon: <Cloud className={`${iconClass} ${color}`} />, text: "多雲", advice: "舒適，適合戶外。" };
    if ([45, 48].includes(code)) return { icon: <CloudFog className={`${iconClass} ${theme.textSec}`} />, text: "有霧", advice: "能見度低請小心。" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { icon: <CloudRain className={`${iconClass} ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`} />, text: "有雨", advice: "請務必攜帶雨具。" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: <Snowflake className={`${iconClass} ${isDarkMode ? 'text-cyan-200' : 'text-cyan-500'}`} />, text: "降雪", advice: "請穿防滑雪靴。" };
    if ([95, 96, 99].includes(code)) return { icon: <CloudLightning className={`${iconClass} ${isDarkMode ? 'text-yellow-200' : 'text-yellow-600'}`} />, text: "雷雨", advice: "請盡量待在室內。" };
    return { icon: <Sun className={`${iconClass} ${color}`} />, text: "晴時多雲", advice: "注意日夜溫差。" };
  };

  // 3. Determine Location based on Day Index
  const getDailyLocation = (dayIndex) => {
    if (dayIndex === -1) return 'tokyo'; // Default for overview
    if (dayIndex <= 1) return 'karuizawa';
    return 'tokyo';
  };

  // --- Trip Date Logic ---
  const tripStartDate = new Date('2026-01-24T00:00:00');
  const tripEndDate = new Date('2026-01-29T23:59:59');
  const today = new Date();

  let tripStatus = 'before'; // 'before', 'during', 'after'
  let daysUntilTrip = 0;
  let currentTripDayIndex = -1;

  if (today < tripStartDate) {
    tripStatus = 'before';
    const diffTime = Math.abs(tripStartDate - today);
    daysUntilTrip = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (today >= tripStartDate && today <= tripEndDate) {
    tripStatus = 'during';
    const diffTime = Math.abs(today - tripStartDate);
    currentTripDayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else {
    tripStatus = 'after';
  }

  // ... existing location fetch logic ...
  // --- User Location Weather Logic ---
  const getUserLocationWeather = () => {
    const KNOWN_LOCATIONS = [
      { name: "東京市區", lat: 35.6895, lon: 139.6917 },
      { name: "輕井澤", lat: 36.3585, lon: 138.6355 },
      { name: "成田機場", lat: 35.7719, lon: 140.3928 },
      { name: "台北", lat: 25.0330, lon: 121.5654 },
      { name: "桃園機場", lat: 25.0796, lon: 121.2342 }
    ];

    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const fetchLocalWeather = async (latitude, longitude, customName = null) => {
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&weathercode=true`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        let city = customName;
        if (!city) {
          const matchedLocation = KNOWN_LOCATIONS.find(loc => getDistance(latitude, longitude, loc.lat, loc.lon) < 20);
          if (matchedLocation) city = matchedLocation.name;
        }

        if (!city) {
          try {
             const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`;
             const geoRes = await fetch(geoUrl);
             const geoData = await geoRes.json();
             if (geoData && geoData.address) {
               city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || geoData.address.state || "您的位置";
             }
          } catch (geoErr) {
             console.warn("Geo lookup failed, using default name");
             city = "目前位置";
          }
        }

        const info = getWeatherInfo(weatherData.current_weather.weathercode);

        setUserWeather({
          temp: Math.round(weatherData.current_weather.temperature),
          desc: info.text,
          icon: info.icon,
          locationName: city || "未知地點",
          loading: false,
          error: null
        });

      } catch (err) {
        console.error("Weather Fetch Error:", err);
        setUserWeather(prev => ({ 
          ...prev, 
          loading: false, 
          locationName: '天氣載入失敗', 
          error: '無法連線' 
        }));
      }
    };

    const fallbackLocation = { lat: 25.0330, lng: 121.5654, name: "台北 (預設)" };

    if (!navigator.geolocation) {
      setHasLocationPermission(false); 
      fetchLocalWeather(fallbackLocation.lat, fallbackLocation.lng, fallbackLocation.name);
      return;
    }

    setUserWeather(prev => ({ ...prev, loading: true, locationName: '定位中...' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHasLocationPermission(true); 
        fetchLocalWeather(position.coords.latitude, position.coords.longitude);
      }, 
      (err) => {
        setHasLocationPermission(false); 
        fetchLocalWeather(fallbackLocation.lat, fallbackLocation.lng, fallbackLocation.name);
      },
      { timeout: 5000 } 
    );
  };

  useEffect(() => {
    // Only fetch weather if verified to save resources/privacy
    if (isVerified) {
        getUserLocationWeather();
    }
  }, [isVerified]);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      showToast("您的裝置不支援定位功能", "error");
      return;
    }
    
    showToast("正在請求位置權限...", "success");
    setHasLocationPermission(null); 

    navigator.geolocation.getCurrentPosition((position) => {
      setHasLocationPermission(true); 
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      const shareText = `我在這裡！點擊查看我的位置：${mapUrl}`;
      
      if (navigator.share) {
        navigator.share({ title: '我的位置', text: '我在這裡！', url: mapUrl }).catch(() => {});
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); showToast("位置連結已複製！"); } catch (err) { showToast("複製失敗", "error"); }
        document.body.removeChild(textArea);
      }
    }, (error) => { 
      setHasLocationPermission(false); 
      showToast("定位失敗，請檢查權限", "error"); 
    });
  };

  // ... existing weather fetch and voice logic ...
  // --- Weather API Integration ---
  useEffect(() => {
    if (!isVerified) return;

    const fetchWeather = async () => {
      try {
        const params = "daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=7";
        const karuizawaUrl = `https://api.open-meteo.com/v1/forecast?latitude=36.34&longitude=138.63&${params}`;
        const tokyoUrl = `https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.76&${params}`;

        const [karuizawaRes, tokyoRes] = await Promise.all([
          fetch(karuizawaUrl),
          fetch(tokyoUrl)
        ]);

        const karuizawaData = await karuizawaRes.json();
        const tokyoData = await tokyoRes.json();

        setWeatherForecast({
          karuizawa: karuizawaData.daily,
          tokyo: tokyoData.daily,
          loading: false
        });
      } catch (error) {
        console.error("Failed to fetch weather:", error);
        setWeatherForecast(prev => ({ ...prev, loading: false }));
      }
    };

    fetchWeather();
  }, [isVerified]);

  // --- Voice Input ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-TW';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputMessage(transcript);
      };

      recognitionRef.current.onend = () => { setListeningLang(null); };
      recognitionRef.current.onerror = (event) => { setListeningLang(null); };
    }
  }, []);

  const toggleListening = (lang) => {
    if (!recognitionRef.current) { alert("抱歉，您的瀏覽器不支援語音輸入功能。"); return; }
    if (listeningLang === lang) {
      recognitionRef.current.stop();
      setListeningLang(null);
    } else {
      if (listeningLang) recognitionRef.current.stop();
      setInputMessage('');
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setListeningLang(lang);
    }
  };

  // --- Text-to-Speech ---
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
      let textToSpeak = text.replace(/\*/g, '');
      const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(textToSpeak);
      if (hasJapanese) textToSpeak = textToSpeak.replace(/\s*\([a-zA-Z0-9\s.,!?'"-]+\)/g, '');
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      if (hasJapanese) {
        utterance.lang = 'ja-JP';
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(v => v.lang.includes('ja') || v.lang.includes('JP'));
        if (jaVoice) utterance.voice = jaVoice;
      } else {
        utterance.lang = 'zh-TW';
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else { alert("抱歉，您的瀏覽器不支援語音朗讀功能。"); }
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // 成功回應
        if (response.ok) {
          return await response.json();
        }

        // 偵測是否因為打太快被擋 (HTTP 429) 或 服務暫時不可用 (503)
        if (response.status === 429 || response.status === 503) {
          console.warn(`API 忙碌中，暫停一下... (嘗試 ${attempt + 1}/${maxRetries})`);
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
    const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg = { role: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    // --- 步驟 1：定義強力瘦身過濾器 (Data Cleaning) ---
    // 這是省 Token 的核心！
    const llmReplacer = (key, value) => {
      // 1. 濾掉 React 元件 (AI 看不懂)
      if (key === 'icon') return undefined;
      // 2. 濾掉 URL 連結 (這通常超級長，且 AI 不需要點連結)
      if (key === 'mapUrl' || key === 'url' || key === 'link') return undefined;
      // 3. 濾掉 UI 樣式與裝飾欄位 (顏色、背景、後綴等)
      if (['color', 'shorthand', 'bg', 'navBg', 'cardBg', 'cardBorder', 'mapQuerySuffix', 'mapQuery', 'desc', 'icon'].includes(key)) {
         // 注意：'desc' (描述) 也是很佔空間的文字，但如果是「景點描述」則需要保留。
         // 在您的資料結構中，usefulLinks 的 desc 是 "入境申報必填"，這有用。
         // 但 shopGuideData 的 desc 是 "王子購物廣場周邊"，這也有用。
         // 所以我們先保留 'desc'，只濾掉純 UI 的。
         return undefined;
      }
      // 特別針對 usefulLinks 裡的 icon 與 url 做過濾
      if (key === 'items') {
         return value.map(item => {
           const { icon, url, ...rest } = item; // 解構出 icon 和 url 丟掉
           return rest;
         });
      }
      // 再次確保濾掉常用的 UI 屬性
      if (['color', 'shorthand', 'bg', 'navBg', 'mapQuerySuffix'].includes(key)) {
        return undefined;
      }      
      return value;
    };
    try {
      let locationContext = "";
      if (hasLocationPermission && userWeather.locationName && !userWeather.loading) {
        locationContext = `\n使用者目前位置：${userWeather.locationName}。`;
      }
      // --- 步驟 2：合併並淨化資料 ---
      // 使用 combinedData 讓結構更整潔
      const combinedData = {
        itinerary: itineraryData,
        guides: guidesData,
        shops: shopGuideData
      };
      // --- 步驟 3：系統提示詞 (維持您目前的穩定版，僅微調資料來源) ---
      const systemContext = `你是這趟東京輕井澤親子行的專屬 AI 導遊。
      ${locationContext}      
      以下是經過整理的行程與資訊庫：
      ${JSON.stringify(combinedData, llmReplacer)}
      請嚴格遵守以下回應規則，優先順序由高至低：
      Rules (優先順序 High->Low):
      0. **簡潔模式**：
         - 回答直擊重點，不廢話。
         - 除複雜問題外，限 300 字內。
      1. **排版 (重要)**：
         - 禁用 Markdown 列表 (* 或 -)。
         - **粗體限制**：僅標題可粗體 (如 **地點**：)，內文禁止粗體。
         - 範例：
           🚄 **交通**：搭乘新幹線。
           🍱 **美食**：
           📍 **敘敘苑**：位於高樓層。
      2. **日翻中 (絕對優先)**：
         - 輸入含日文(平/片假名) -> 僅翻譯成繁中，嚴禁回答問題。
         - 例："トイレは..." -> "廁所在哪？"
      3. **中翻日**：
         - 輸入「翻譯/怎麼說」-> 僅輸出日文 + 羅馬拼音。
         - 例："翻譯 兒童餐具" -> "子供用の食器 (Kodomo-yo no shokki)"
      4. **導遊模式**：
         - 依 Data 回答。風格親切、親子遊。
      `;

      // 建構 Payload
      const payload = {
        systemInstruction: {
          parts: [{ text: systemContext }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userMsg.text }] 
          }
        ],
        // 修改：更新 Token 上限與思考設定
        generationConfig: {
          temperature: 0.7, 
          maxOutputTokens: 1000, // 提升至 1000，避免截斷
          thinkingConfig: {
            thinkingLevel: "MINIMAL", 
            includeThoughts: false 
          }
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
        ]
      };

      const data = await callGeminiSafe(payload);
      
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "抱歉，我現在有點忙，請稍後再試。";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);

    } catch (error) {
      console.error("AI Error:", error);
      let errMsg = "連線發生錯誤或是系統忙碌中，請稍後再試。";
      if (error.message.includes("Key")) errMsg = "API Key 錯誤，請檢查加密設定。";
      setMessages(prev => [...prev, { role: 'model', text: errMsg }]);
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
    temp: "N/A", desc: "載入中...", advice: "請稍候"
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
       advice: info.advice
     };
  } else if (!weatherForecast.loading && !weatherData) {
      if (currentLocation === 'karuizawa') {
         displayWeather = { icon: <Snowflake className="w-7 h-7 text-cyan-300" />, temp: "-5°C / 2°C", desc: "寒冷", advice: "請穿著保暖雪衣" };
      } else {
         displayWeather = { icon: <Sun className="w-7 h-7 text-amber-300" />, temp: "3°C / 11°C", desc: "晴朗", advice: "乾冷，注意保濕" };
      }
  }

  // --- Lock Screen Render ---
  if (!isVerified) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-[#1A1A1A] text-neutral-200' : 'bg-[#F0F2F5] text-slate-700'}`}>
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
           <div className={`absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob opacity-20 ${theme.blob1}`}></div>
           <div className={`absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full blur-3xl animate-blob animation-delay-4000 opacity-20 ${theme.blob2}`}></div>
         </div>

         <div className={`max-w-md w-full backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative z-10 ${theme.cardBg} ${theme.cardBorder}`}>
           <div className="text-center mb-8">
             <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg ${isDarkMode ? 'bg-neutral-800 text-sky-300' : 'bg-white text-indigo-500'}`}>
               {isAuthLoading ? <Loader className="w-8 h-8 animate-spin" /> : <Lock className="w-8 h-8" />}
             </div>
             <h2 className="text-2xl font-bold mb-2">行程表已鎖定</h2>
             <p className={`text-sm ${theme.textSec}`}>請輸入家族通關密語以解鎖並解密 API Key</p>
           </div>

           <form onSubmit={handleAuthSubmit} className="space-y-4">
             <div>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="輸入密碼..."
                 className={`w-full px-4 py-3.5 rounded-xl border text-center text-lg tracking-widest focus:outline-none focus:ring-2 transition-all shadow-inner ${isDarkMode ? 'bg-neutral-900 border-neutral-700 focus:border-sky-500 focus:ring-sky-500/20 placeholder:tracking-normal' : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder:tracking-normal'}`}
                 autoFocus
               />
             </div>
             <button
               type="submit"
               disabled={isAuthLoading || !password}
               className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 
                 ${isAuthLoading || !password 
                   ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                   : (isDarkMode ? 'bg-gradient-to-r from-sky-600 to-blue-700 hover:shadow-sky-500/20' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-500/20')}`}
             >
               {isAuthLoading ? "解鎖與解密中..." : (
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
               <Key className="w-3 h-3" /> {showEncryptTool ? "隱藏加密工具" : "設定/加密 API Key (首次使用請點此)"}
             </button>

             {showEncryptTool && (
               <div className={`mt-4 p-4 rounded-xl border space-y-3 text-sm ${isDarkMode ? 'bg-black/30 border-neutral-700' : 'bg-slate-50 border-slate-200'}`}>
                 <p className={`text-xs font-bold mb-2 ${theme.text}`}>1. 輸入真實 API Key 與自訂密碼：</p>
                 <input 
                   type="text" 
                   placeholder="Google Gemini API Key (AIza...)" 
                   value={toolKey}
                   onChange={e => setToolKey(e.target.value)}
                   className={`w-full p-2 rounded-lg border text-xs ${isDarkMode ? 'bg-neutral-800 border-neutral-600' : 'bg-white border-slate-300'}`}
                 />
                 <input 
                   type="text" 
                   placeholder="設定您的通關密碼" 
                   value={toolPwd}
                   onChange={e => setToolPwd(e.target.value)}
                   className={`w-full p-2 rounded-lg border text-xs ${isDarkMode ? 'bg-neutral-800 border-neutral-600' : 'bg-white border-slate-300'}`}
                 />
                 <button 
                   onClick={generateEncryptedString}
                   className={`w-full py-2 rounded-lg text-xs font-bold text-white ${isDarkMode ? 'bg-sky-600' : 'bg-indigo-500'}`}
                 >
                   2. 生成加密字串
                 </button>
                 
                 {toolResult && (
                   <div className="mt-2">
                     <p className={`text-xs font-bold mb-1 ${theme.text}`}>3. 請複製下方字串到程式碼的 payload 變數：</p>
                     <div className={`p-2 rounded border break-all font-mono text-[10px] select-all cursor-text ${isDarkMode ? 'bg-neutral-900 border-neutral-700 text-green-400' : 'bg-white border-slate-300 text-slate-600'}`}>
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

  // --- Main App Render (Authenticated) ---
  return (
    <div className={`min-h-screen font-sans pb-24 overflow-x-hidden transition-colors duration-500 ease-in-out ${theme.bg} ${theme.text}`}>
      
      {/* Decorative Blobs - Subtle & Natural */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl animate-blob transition-colors duration-700 ${theme.blob1}`}></div>
        <div className={`absolute top-[20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-3xl animate-blob animation-delay-2000 transition-colors duration-700 ${theme.blob2}`}></div>
        <div className={`absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full blur-3xl animate-blob animation-delay-4000 transition-colors duration-700 ${theme.blob3}`}></div>
      </div>

      <div className="max-w-md mx-auto relative min-h-screen flex flex-col z-10">
        
        {/* Header Title with Material Glass */}
        <div className="flex justify-between items-center px-4 pt-5 pb-2 relative z-20">
          <div className={`px-4 py-2 rounded-2xl backdrop-blur-md shadow-sm border transition-all duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
            <h1 className={`text-lg font-bold tracking-wide transition-colors ${theme.text}`}>東京輕井澤親子之旅</h1>
            <p className={`text-xs mt-0.5 font-medium tracking-widest ${theme.textSec}`}>2026/1/24 - 1/29</p>
          </div>
          
          <div className="flex gap-2">
            {/* Lock Button */}
            <button 
                onClick={() => {
                  setIsVerified(false);
                  localStorage.removeItem('trip_password');
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
                {isDarkMode ? <Moon className="w-5 h-5 fill-current" /> : <Sun className="w-5 h-5 text-amber-500 fill-current" />}
            </button>
          </div>
        </div>

        {/* --- Tab Content --- */}
        
        {/* 1. 行程分頁 (Itinerary Tab) */}
        {activeTab === 'itinerary' && (
          <div className="flex-1 space-y-4 px-4 pb-4 animate-fadeIn">
            {/* Navigation Buttons */}
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide py-1 px-1">
              {/* Overview Button */}
              <button
                onClick={() => setActiveDay(-1)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 border backdrop-blur-sm flex items-center gap-1.5 shadow-sm
                  ${activeDay === -1 
                    ? `${theme.accentBg} ${theme.accent} ${isDarkMode ? 'border-neutral-600' : 'border-stone-300'} scale-105 shadow-md` 
                    : `${theme.cardBg} ${theme.textSec} border-transparent hover:bg-black/5`}`}
              >
                <LayoutDashboard className="w-4 h-4" /> 總覽
              </button>

              {itineraryData.map((data, index) => (
                <button
                  key={index}
                  onClick={() => setActiveDay(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 border backdrop-blur-sm shadow-sm
                    ${activeDay === index 
                      ? `${theme.accentBg} ${theme.text} ${isDarkMode ? 'border-neutral-600' : 'border-stone-300'} scale-105 shadow-md` 
                      : `${theme.cardBg} ${theme.textSec} border-transparent hover:bg-black/5`}`}
                >
                  {data.day}
                </button>
              ))}
            </div>

            {/* OVERVIEW CONTENT (ActiveDay === -1) */}
            {activeDay === -1 && (
              <div className="space-y-4">
                {/* 1. User Location Weather Card (Compact Layout) */}
                <div className={`backdrop-blur-xl border rounded-3xl p-5 ${theme.cardShadow} flex items-center justify-between relative overflow-hidden transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
                   {/* Left: Location & Temp */}
                   <div className="relative z-10 flex flex-col justify-center">
                     <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSec}`}>
                       <LocateFixed className={`w-4 h-4 ${theme.accent}`} /> {userWeather.locationName}
                     </div>
                     <div className="flex items-center gap-4">
                       <div className={`p-2.5 rounded-2xl shadow-inner ${isDarkMode ? 'bg-black/30' : 'bg-white/60'}`}>
                         {userWeather.loading ? <Loader className={`w-7 h-7 animate-spin ${theme.textSec}`} /> : userWeather.icon}
                       </div>
                       <div>
                         {userWeather.temp !== null ? (
                            <div className={`text-3xl font-bold ${theme.text}`}>{userWeather.temp}<span className={`text-sm ml-1 ${theme.textSec}`}>°C</span></div>
                         ) : (
                            <div className={`text-xs ${theme.textSec}`}>--</div>
                         )}
                         <div className={`text-xs mt-0.5 ${theme.textSec}`}>{userWeather.desc || "載入中"}</div>
                       </div>
                     </div>
                   </div>

                   {/* Right: Advice & Update Button */}
                   <div className="relative z-10 text-right max-w-[50%] flex flex-col items-end">
                     <button onClick={getUserLocationWeather} className={`mb-2 text-xs px-3 py-1.5 rounded-full border transition-all shadow-sm flex items-center gap-1.5 active:scale-95 ${theme.accent} ${isDarkMode ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
                       更新位置 <Share2 className="w-3 h-3"/>
                     </button>
                     <p className={`text-xs leading-relaxed font-medium ${theme.textSec}`}>
                       {userWeather.error ? "無法獲取天氣" : "比較目前與當地的溫差，方便準備衣物。"}
                     </p>
                   </div>
                </div>

                {/* 2. Flight & Emergency Info */}
                <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
                   {/* Header：點擊可切換收折狀態 */}
                   <div 
                     onClick={() => setIsFlightInfoExpanded(!isFlightInfoExpanded)}
                     className={`flex items-center justify-between cursor-pointer group ${isFlightInfoExpanded ? 'mb-4 border-b pb-2' : ''} ${isDarkMode ? 'border-neutral-700/50' : 'border-stone-200/50'}`}
                   >
                     <h3 className={`text-sm font-bold flex items-center gap-2 ${theme.text}`}>
                       <Plane className={`w-4 h-4 ${theme.accent}`} /> 航班與緊急資訊
                     </h3>
                     <div className={`p-1 rounded-full transition-colors ${isDarkMode ? 'group-hover:bg-neutral-700' : 'group-hover:bg-stone-100'}`}>
                       {isFlightInfoExpanded 
                         ? <ChevronUp className={`w-4 h-4 ${theme.textSec}`} /> 
                         : <ChevronDown className={`w-4 h-4 ${theme.textSec}`} />}
                     </div>
                   </div>
                   
                   {/* Content：只在展開時顯示 */}
                   {isFlightInfoExpanded && (
                     <div className="animate-fadeIn">
                       <div className="grid grid-cols-2 gap-4 mb-4">
                         {/* Flight Info */}
                         <div className={`rounded-xl p-3 border flex flex-col gap-2 transition-colors ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white/40 border-stone-200'}`}>
                           <div className={`text-xs font-bold ${theme.textSec}`}>去程 (星宇 JX802)</div>
                           <div className={`text-sm font-bold tracking-wide ${theme.text}`}>10:20 TPE ➝ 14:25 NRT</div>
                           <div className={`w-full h-px my-0.5 ${isDarkMode ? 'bg-neutral-700' : 'bg-stone-200'}`}></div>
                           <div className={`text-xs font-bold ${theme.textSec}`}>回程 (星宇 JX803)</div>
                           <div className={`text-sm font-bold tracking-wide ${theme.text}`}>15:40 NRT ➝ 18:50 TPE</div>
                         </div>

                         {/* Hotel Info (包含地址複製功能) */}
                         <div className={`rounded-xl p-3 border flex flex-col justify-center gap-2 transition-colors ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white/40 border-stone-200'}`}>
                           
                           {/* 輕井澤 */}
                           <div className="flex flex-col gap-1">
                             <div className={`text-xs font-bold ${theme.textSec}`}>輕井澤王子西館</div>
                             <div className={`text-xs font-bold flex items-center gap-1.5 ${theme.text}`}>
                               <Phone className="w-3 h-3"/> 
                               <a href="tel:+81267421111">+81-267-42-1111</a>
                             </div>
                             <button 
                               onClick={() => handleCopy("長野県北佐久郡輕井澤町輕井澤")}
                               className={`text-[10px] flex items-start gap-1.5 leading-tight opacity-80 hover:opacity-100 active:scale-95 text-left transition-all ${theme.textSec}`}
                               title="點擊複製地址"
                             >
                               <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5"/> 
                               <span className="underline decoration-dotted underline-offset-2">長野県北佐久郡輕井澤町輕井澤</span>
                               <span className="text-[9px] px-1 border rounded ml-1 opacity-60">複製</span>
                             </button>
                           </div>

                           <div className={`w-full h-px my-0.5 ${isDarkMode ? 'bg-neutral-700' : 'bg-stone-200'}`}></div>

                           {/* 上野 */}
                           <div className="flex flex-col gap-1">
                             <div className={`text-xs font-bold ${theme.textSec}`}>&HERE TOKYO UENO</div>
                             <div className={`text-xs font-bold flex items-center gap-1.5 ${theme.text}`}>
                               <Phone className="w-3 h-3"/> 
                               <a href="tel:+81368249442">+81-3-6824-9442</a>
                             </div>
                             <button 
                               onClick={() => handleCopy("東京都台東區上野 2-11-18")}
                               className={`text-[10px] flex items-start gap-1.5 leading-tight opacity-80 hover:opacity-100 active:scale-95 text-left transition-all ${theme.textSec}`}
                               title="點擊複製地址"
                             >
                               <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5"/> 
                               <span className="underline decoration-dotted underline-offset-2">東京都台東區上野 2-11-18</span>
                               <span className="text-[9px] px-1 border rounded ml-1 opacity-60">複製</span>
                             </button>
                           </div>

                         </div>
                       </div>
                       
                       <div className={`rounded-xl p-3 border flex items-start gap-2.5 ${isDarkMode ? 'bg-red-900/10 border-red-900/20' : 'bg-red-50/40 border-red-100'}`}>
                          <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.red}`} />
                          <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-red-200/80' : 'text-red-800/80'}`}>
                            <span className="font-bold block mb-0.5">緊急聯絡：</span>
                            報警 110 | 救護車 119 <br/>
                            旅外國人急難救助：+81-3-3280-7917
                          </div>
                       </div>
                     </div>
                   )}
                </div>

                {/* 3. Trip Status & Checklist */}
                {/* STATUS: BEFORE TRIP */}
                {tripStatus === 'before' && (
                  <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
                    <div className="text-center mb-5">
                      <div className={`text-xs font-medium mb-1 ${theme.textSec}`}>距離東京之旅還有</div>
                      <div className={`text-5xl font-black tracking-tight drop-shadow-sm flex justify-center items-baseline gap-2 ${theme.accent}`}>
                        {daysUntilTrip} <span className={`text-lg font-bold ${theme.textSec}`}>天</span>
                      </div>
                    </div>
                    
                    <div className={`rounded-2xl p-4 border transition-colors ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white/40 border-stone-200'}`}>
                      <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
                        <ListTodo className={`w-4 h-4 ${colors.pink}`} /> 出發前檢查清單
                      </h3>
                      <div className="space-y-1">
                        {checklist.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => toggleCheckItem(item.id)}
                            className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all cursor-pointer select-none group
                              ${item.checked 
                                ? (isDarkMode ? 'bg-green-900/10' : 'bg-green-50/50') 
                                : (isDarkMode ? 'hover:bg-neutral-700/30' : 'hover:bg-black/5')}`}
                          >
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all duration-300 flex-shrink-0
                              ${item.checked 
                                ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
                                : `bg-transparent ${isDarkMode ? 'border-neutral-500' : 'border-stone-400'} group-hover:border-emerald-500`}`}>
                              <Check className="w-3 h-3" />
                            </div>
                            <span className={`text-sm font-medium transition-colors leading-normal tracking-wide
                              ${item.checked 
                                ? 'text-emerald-600/70 line-through decoration-emerald-600/30' 
                                : theme.textSec}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STATUS: DURING TRIP */}
                {tripStatus === 'during' && currentTripDayIndex >= 0 && (
                  <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
                     <div className={`flex items-center justify-between mb-4 border-b pb-3 ${isDarkMode ? 'border-neutral-700/50' : 'border-stone-200/50'}`}>
                       <div>
                         <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-1 ${theme.accent} ${theme.accentBg}`}>旅途中</div>
                         <h2 className={`text-2xl font-bold ${theme.text}`}>今天是 Day {currentTripDayIndex + 1}</h2>
                       </div>
                       <div className={`p-2.5 rounded-full animate-pulse ${theme.accentBg}`}>
                         <Plane className={`w-6 h-6 ${theme.accent}`} />
                       </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className={`bg-gradient-to-r from-[#5D737E] to-[#3F5561] text-white p-4 rounded-2xl shadow-lg relative overflow-hidden`}>
                          <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-1">{itineraryData[currentTripDayIndex].title}</h3>
                            <div className="text-stone-200 text-xs flex items-center gap-1.5">
                              <Hotel className="w-3.5 h-3.5" />
                              {itineraryData[currentTripDayIndex].stay}
                            </div>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <MapPin className="w-20 h-20 text-white" />
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white/40 border-stone-200'}`}>
                          <h4 className={`text-xs font-bold mb-3 flex items-center gap-1.5 ${theme.textSec}`}>
                            <Star className={`w-3.5 h-3.5 ${colors.orange}`} /> 今日亮點快速導覽
                          </h4>
                          <div className="space-y-3">
                            {itineraryData[currentTripDayIndex].events.filter(e => e.highlights).slice(0, 3).map((e, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <div className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 ${isDarkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-stone-200 text-stone-600'}`}>{e.time}</div>
                                <div>
                                  <div className={`text-sm font-bold ${theme.text}`}>{e.title}</div>
                                  <div className={`text-xs mt-0.5 leading-relaxed ${theme.textSec}`}>{e.desc}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => setActiveDay(currentTripDayIndex)}
                            className={`w-full mt-4 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200' : 'bg-stone-200 hover:bg-stone-300 text-stone-600'}`}
                          >
                            查看今日完整行程 <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                     </div>
                  </div>
                )}

                {/* STATUS: AFTER TRIP */}
                {tripStatus === 'after' && (
                  <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
                    <div className="text-center mb-5">
                      <div className="p-3.5 bg-amber-100/30 rounded-full w-14 h-14 mx-auto flex items-center justify-center mb-3 border border-amber-200/50">
                        <History className="w-7 h-7 text-amber-500" />
                      </div>
                      <h2 className={`text-xl font-bold ${theme.text}`}>旅程圓滿結束！</h2>
                      <p className={`text-sm mt-1 ${theme.textSec}`}>感謝您這 6 天的陪伴，希望留下美好的回憶。</p>
                    </div>

                    <div className={`rounded-2xl p-4 border transition-colors ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white/40 border-stone-200'}`}>
                      <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.textSec}`}>
                        <MapPin className={`w-4 h-4 ${colors.pink}`} /> 足跡回顧
                      </h3>
                      <div className="space-y-2">
                         <div className="flex flex-wrap gap-2">
                           {["輕井澤滑雪場", "王子 Outlet", "上野公園", "teamLab Borderless", "麻布台之丘", "六本木之丘", "台場鋼彈", "LaLaport 豐洲"].map((spot, i) => (
                             <span key={i} className={`px-3 py-1.5 text-xs font-medium rounded-lg border shadow-sm ${isDarkMode ? 'bg-neutral-700 border-neutral-600 text-neutral-300' : 'bg-white border-stone-200 text-stone-600'}`}>
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
              <div className={`backdrop-blur-xl border rounded-3xl p-5 ${theme.cardShadow} flex items-center justify-between relative overflow-hidden transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
                <div className="relative z-10">
                  <div className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 uppercase tracking-wide ${theme.textSec}`}>
                    <Calendar className="w-3.5 h-3.5" /> 預報 ({currentLocation === 'karuizawa' ? '輕井澤' : '東京'})
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-full shadow-inner ${isDarkMode ? 'bg-black/30' : 'bg-white/40'}`}>{displayWeather.icon}</div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-bold ${theme.text}`}>{displayWeather.temp.split('/')[0]}</span>
                        <span className={`text-sm ${theme.textSec}`}>/</span>
                        <span className={`text-2xl font-bold ${theme.text}`}>{displayWeather.temp.split('/')[1]}</span>
                      </div>
                      <div className={`text-sm font-medium mt-0.5 ${theme.textSec}`}>{displayWeather.desc}</div>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 text-right max-w-[50%] flex flex-col items-end">
                   <div className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold mb-1.5 border shadow-sm backdrop-blur-md ${isDarkMode ? 'bg-sky-900/30 text-sky-200 border-sky-800/50' : 'bg-[#E0F7FA]/80 text-[#006064] border-[#B2EBF2]'}`}>
                     💡 穿搭建議
                   </div>
                   <p className={`text-xs leading-relaxed font-medium ${theme.textSec}`}>{displayWeather.advice}</p>
                </div>
              </div>

              {/* Main Itinerary Content */}
              <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] relative transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
                {/* Day Header (修改後：住宿地點增加導航連結) */}
                <div className={`mb-5 border-b pb-4 ${isDarkMode ? 'border-neutral-700/50' : 'border-stone-200/50'}`}>
                  <div className={`text-xs font-semibold mb-1.5 flex items-center gap-2 ${theme.textSec}`}>
                    <span className={`px-2.5 py-0.5 rounded-md ${isDarkMode ? 'bg-neutral-800' : 'bg-white/50'}`}>{current.date}</span>
                  </div>
                  <h2 className={`text-2xl font-extrabold mb-3 leading-tight drop-shadow-sm ${theme.text}`}>{current.title}</h2>
                  
                  {/* Hotel Link Block */}
                  <div className={`flex items-start gap-2 text-xs p-3 rounded-xl border transition-colors ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700 text-neutral-300' : 'bg-blue-50/30 border-blue-100/50 text-stone-600'}`}>
                    <Hotel className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme.accent}`} />
                    
                    {current.stay.includes('溫暖的家') ? (
                      <span className="font-medium leading-relaxed tracking-wide">{current.stay}</span>
                    ) : (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(current.stay.split('(')[0])}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`font-medium leading-relaxed tracking-wide hover:underline underline-offset-4 decoration-2 flex items-center gap-1 ${isDarkMode ? 'decoration-sky-400 hover:text-sky-300' : 'decoration-[#5D737E] hover:text-[#3B5998]'}`}
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
                      <div key={idx} className={`group rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden ${isDarkMode ? 'bg-neutral-800/30 border-neutral-700 hover:bg-neutral-800/50' : 'bg-white/60 border-white/60 hover:bg-white/80 hover:shadow-md'}`}>
                        
                        {/* Header Row */}
                        <div 
                          className="p-4 flex gap-4 cursor-pointer"
                          onClick={() => toggleExpand(activeDay, idx)}
                        >
                          <div className="flex flex-col items-center pt-1">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105
                              ${event.title.includes('交通') 
                                ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-400' : 'bg-[#F0F5E5] text-[#556B2F]') 
                                : (isDarkMode ? 'bg-sky-900/20 text-sky-400' : 'bg-[#E8F0FE] text-[#3B5998]')}`}>
                              {React.cloneElement(event.icon, { className: "w-5 h-5" })}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-stone-200/50 text-stone-600'}`}>
                                  <Clock className="w-3 h-3" /> {event.time}
                                </div>
                                {/* Title and Map Link */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h3 className={`text-base font-bold leading-tight ${theme.text}`}>{event.title}</h3>
                                  <a 
                                    href={getMapLink(event.mapQuery || event.title)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`p-1.5 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-neutral-700 border-neutral-600 text-sky-300 hover:bg-neutral-600' : 'bg-white border-stone-200 text-[#3B5998] hover:bg-blue-50'}`}
                                    title="在 Google Maps 查看"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                              {isOpen ? <ChevronUp className={`w-5 h-5 ${theme.textSec}`} /> : <ChevronDown className={`w-5 h-5 ${theme.textSec}`} />}
                            </div>
                            <p className={`text-sm leading-relaxed ${theme.textSec}`}>{event.desc}</p>
                            
                            {!isOpen && event.transport && (
                              <div className={`mt-2.5 flex items-center gap-1.5 text-xs w-fit px-2.5 py-1 rounded-lg border ${isDarkMode ? 'bg-emerald-900/10 text-emerald-400 border-emerald-800/30' : 'bg-[#F0F5E5] text-[#556B2F] border-[#E2E8D5]'}`}>
                                <Train className="w-3 h-3" />
                                <span className="font-medium">{event.transport.mode}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isOpen && (
                          <div className={`px-5 pb-5 pt-1 space-y-3 border-t ${isDarkMode ? 'bg-black/20 border-neutral-700' : 'bg-white/40 border-stone-200/50'}`}>
                            
                            {event.transport && (
                              <div className={`mt-2 p-3 rounded-xl border ${isDarkMode ? 'bg-emerald-900/10 border-emerald-800/30' : 'bg-[#F0F5E5] border-[#E2E8D5]'}`}>
                                <h4 className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${isDarkMode ? 'text-emerald-400' : 'text-[#556B2F]'}`}>
                                  <Train className="w-3.5 h-3.5" /> 交通詳情
                                </h4>
                                <div className={`space-y-1.5 text-xs leading-relaxed ${isDarkMode ? 'text-neutral-300' : 'text-stone-600'}`}>
                                  <div className="flex gap-2"><span className={`${theme.textSec} min-w-[30px]`}>方式</span> <span className="font-medium">{event.transport.mode}</span></div>
                                  <div className="flex gap-2"><span className={`${theme.textSec} min-w-[30px]`}>時間</span> <span>{event.transport.duration}</span></div>
                                  <div className="flex gap-2"><span className={`${theme.textSec} min-w-[30px]`}>路線</span> <span>{event.transport.route}</span></div>
                                  {event.transport.note && <p className={`font-medium mt-1.5 flex gap-1.5 items-start ${isDarkMode ? 'text-amber-400' : 'text-[#CD853F]'}`}><AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/> {event.transport.note}</p>}
                                </div>
                              </div>
                            )}

                            {event.highlights && (
                              <div>
                                <h4 className={`text-xs font-bold flex items-center gap-1.5 mb-2 mt-2 ${isDarkMode ? 'text-rose-300' : 'text-[#BC8F8F]'}`}>
                                  <Star className="w-3.5 h-3.5" /> 必玩 / 必吃
                                </h4>
                                <ul className="space-y-1.5 pl-1">
                                  {event.highlights.map((item, i) => (
                                    <li key={i} className={`text-sm flex gap-2 items-start leading-relaxed ${theme.textSec}`}>
                                      <span className={`${isDarkMode ? 'text-rose-300' : 'text-[#BC8F8F]'} mt-1`}>•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {event.tips && (
                              <div>
                                <h4 className={`text-xs font-bold flex items-center gap-1.5 mb-2 mt-2 ${isDarkMode ? 'text-amber-300' : 'text-[#CD853F]'}`}>
                                  <Info className="w-3.5 h-3.5" /> 溫馨提醒
                                </h4>
                                <ul className="space-y-1.5 pl-1">
                                  {event.tips.map((item, i) => (
                                    <li key={i} className={`text-sm flex gap-2 items-start leading-relaxed ${theme.textSec}`}>
                                      <span className={`${isDarkMode ? 'text-amber-300' : 'text-[#CD853F]'} mt-1`}>•</span>
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
                  <div className={`mt-6 backdrop-blur-md rounded-2xl border p-4 shadow-sm transition-colors ${isDarkMode ? 'bg-neutral-800/30 border-neutral-700' : 'bg-white/40 border-stone-200'}`}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`p-1.5 rounded-lg ${theme.accentBg}`}>
                        <Map className={`w-4 h-4 ${theme.accent}`} />
                      </div>
                      <h3 className={`text-sm font-bold ${theme.text}`}>當日路線導航</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className={`text-xs p-3 rounded-xl border leading-relaxed ${isDarkMode ? 'bg-black/20 border-neutral-700 text-neutral-300' : 'bg-white/50 border-stone-200 text-stone-600'}`}>
                        <span className={`font-bold mr-1.5 block mb-1 ${theme.accent}`}>路線摘要</span>
                        {current.routeInfo.summary}
                      </div>
                      <a
                        href={current.routeInfo.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 ${isDarkMode ? 'bg-gradient-to-r from-sky-800 to-blue-900' : 'bg-gradient-to-r from-[#5D737E] to-[#3F5561]'}`}
                      >
                        <Navigation className="w-4 h-4" />
                        開啟 Google Maps 查看路線
                      </a>
                    </div>
                  </div>
                )}

                {activeDay === 0 && (
                  <div className={`mt-5 rounded-xl p-3.5 text-xs flex gap-2.5 items-start shadow-sm border ${isDarkMode ? 'bg-amber-900/10 border-amber-800/30 text-amber-200' : 'bg-[#FFF8E1] border-amber-100 text-[#8D6E63]'}`}>
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.orange}`} />
                    <span className="leading-relaxed font-medium tracking-wide">重要提醒：新幹線指定席票券建議提前一個月預訂，以免向隅！</span>
                  </div>
                )}
                 {activeDay === 3 && (
                  <div className={`mt-5 rounded-xl p-3.5 text-xs flex gap-2.5 items-start shadow-sm border ${isDarkMode ? 'bg-rose-900/10 border-rose-800/30 text-rose-200' : 'bg-[#FFF0F5] border-rose-100 text-[#BC8F8F]'}`}>
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.pink}`} />
                    <span className="leading-relaxed font-medium tracking-wide">重要提醒：teamLab Borderless 門票非常熱門，請務必提前上網購票。</span>
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
        {activeTab === 'guides' && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-purple-900/20' : 'bg-[#E6E6FA]/50'}`}><BookOpen className={`w-4 h-4 ${isDarkMode ? 'text-purple-300' : 'text-[#9370DB]'}`} /></div>
                實用參考指南
              </h2>
              <div className="space-y-3">
                {guidesData.map((guide, idx) => {
                  const isGuideOpen = expandedGuides[idx];
                  return (
                    <div key={idx} className={`backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white/70 border-white/60'}`}>
                      {/* Guide Header - Clickable */}
                      <div 
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() => toggleGuide(idx)}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner ${isDarkMode ? 'bg-neutral-800 border-neutral-600' : 'bg-white border-stone-100'}`}>
                          {guide.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-bold break-words ${theme.text}`}>{guide.title}</h3>
                          {!isGuideOpen && <p className={`text-xs mt-0.5 leading-relaxed truncate ${theme.textSec}`}>{guide.summary}</p>}
                        </div>
                        {isGuideOpen ? <ChevronUp className={`w-4 h-4 flex-shrink-0 ${theme.textSec}`} /> : <ChevronDown className={`w-4 h-4 flex-shrink-0 ${theme.textSec}`} />}
                      </div>

                      {/* Collapsible Content */}
                      {isGuideOpen && (
                        <div className="px-5 pb-5 animate-fadeIn">
                          <p className={`text-sm mb-4 leading-relaxed ${theme.textSec}`}>{guide.summary}</p>
                          <div className={`rounded-xl p-3.5 my-3 border ${isDarkMode ? 'bg-black/20 border-neutral-700' : 'bg-[#F9F9F6] border-stone-200'}`}>
                            <h4 className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}>
                              <FileText className="w-3.5 h-3.5" /> 操作重點
                            </h4>
                            <ol className={`list-decimal list-inside text-sm space-y-2 pl-1 ${theme.textSec} ${isDarkMode ? 'marker:text-sky-300' : 'marker:text-[#5D737E]'} marker:font-bold`}>
                              {guide.steps.map((step, i) => <li key={i} className="leading-relaxed pl-1">{step}</li>)}
                            </ol>
                          </div>
                          <div className="space-y-3">
                            <a 
                              href={guide.link.url}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`block w-full text-center text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${isDarkMode ? 'bg-sky-900/20 text-sky-300 hover:bg-sky-900/30' : 'bg-[#E8F0FE] text-[#3B5998] hover:bg-[#D0E0FC]'}`}
                            >
                              {guide.link.text}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            {guide.blogs && guide.blogs.length > 0 && (
                              <div className={`mt-3 border-t pt-3 ${isDarkMode ? 'border-neutral-700' : 'border-stone-200'}`}>
                                <h4 className={`text-[11px] font-bold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-neutral-500' : 'text-stone-400'}`}>相關圖文教學</h4>
                                <div className="space-y-1.5">
                                  {guide.blogs.map((blog, bIdx) => (
                                    <a
                                      key={bIdx}
                                      href={blog.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 text-xs transition-colors p-1.5 rounded-lg ${isDarkMode ? 'text-neutral-400 hover:text-sky-300 hover:bg-neutral-700/50' : 'text-stone-500 hover:text-[#3B5998] hover:bg-stone-100'}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-neutral-600' : 'bg-stone-300'}`}></span>
                                      <span className="truncate underline decoration-stone-300 underline-offset-4 decoration-1">{blog.title}</span>
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
        {activeTab === 'shops' && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
              <h2 className={`text-lg font-bold mb-1.5 flex items-center gap-2 ${theme.text}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-orange-900/20' : 'bg-[#FFF8E1]/60'}`}><Store className={`w-4 h-4 ${isDarkMode ? 'text-amber-300' : 'text-[#CD853F]'}`} /></div>
                商家與周邊指南
              </h2>
              <p className={`text-xs mb-4 ml-1 flex items-center gap-1.5 ${theme.textSec}`}>
                <Info className="w-3 h-3" /> 點擊商家名稱即可開啟 Google Maps
              </p>
              
              <div className="space-y-3">
                {shopGuideData.map((areaData, idx) => {
                  const isShopOpen = expandedShops[idx];
                  return (
                    <div key={idx} className={`backdrop-blur-sm border rounded-2xl shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-neutral-800/30 border-neutral-700' : 'bg-white/60 border-stone-200'}`}>
                      {/* Shop Header - Clickable */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => toggleShop(idx)}
                      >
                        <div>
                          <h3 className={`text-base font-bold ${theme.accent}`}>{areaData.area}</h3>
                          {!isShopOpen && <p className={`text-xs mt-0.5 truncate ${theme.textSec}`}>{areaData.desc}</p>}
                        </div>
                        {isShopOpen ? <ChevronUp className={`w-4 h-4 ${theme.textSec}`} /> : <ChevronDown className={`w-4 h-4 ${theme.textSec}`} />}
                      </div>

                      {/* Collapsible Content */}
                      {isShopOpen && (
                        <div className="px-5 pb-5 animate-fadeIn">
                          <p className={`text-sm mb-4 ${theme.textSec}`}>{areaData.desc}</p>
                          
                          {/* 重點商家 */}
                          <div className="mb-5">
                            <h4 className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}>
                              <Star className={`w-3.5 h-3.5 ${colors.orange}`} /> 行程重點商家
                            </h4>
                            <div className="grid grid-cols-1 gap-2.5">
                              {areaData.mainShops.map((shop, i) => (
                                <div key={i} className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${isDarkMode ? 'bg-amber-900/10 border-amber-800/30 hover:bg-amber-900/20' : 'bg-[#FFF8E1]/50 border-amber-100 hover:bg-[#FFF8E1]'}`}>
                                  <a 
                                    href={getMapLink(`${shop.name} ${areaData.mapQuerySuffix}`)}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 group flex-1"
                                  >
                                    <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-amber-500' : 'text-[#CD853F]'} group-hover:scale-125 transition-transform`} />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-neutral-200 group-hover:text-amber-300' : 'text-[#37474F] group-hover:text-[#CD853F]'}`}>{shop.name}</span>
                                        <span className={`text-[11px] px-1.5 py-0.5 rounded-md border shadow-sm ${isDarkMode ? 'bg-neutral-800 text-neutral-400 border-neutral-700' : 'bg-white text-stone-500 border-stone-200'}`}>{shop.tag}</span>
                                      </div>
                                      <span className={`text-xs mt-0.5 ${theme.textSec}`}>{shop.note}</span>
                                    </div>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* 童裝與文具 */}
                          {areaData.specialShops && (
                            <div className="mb-5">
                              <h4 className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}>
                                <Scissors className={`w-3.5 h-3.5 ${colors.pink}`} /> 童裝與文具推薦
                              </h4>
                              <div className="grid grid-cols-1 gap-2.5">
                                {areaData.specialShops.map((shop, i) => (
                                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${isDarkMode ? 'bg-rose-900/10 border-rose-800/30 hover:bg-rose-900/20' : 'bg-[#FFF0F5]/60 border-rose-100 hover:bg-[#FFF0F5]'}`}>
                                    <a 
                                      href={getMapLink(`${shop.name} ${areaData.mapQuerySuffix}`)}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 group flex-1"
                                    >
                                      <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-rose-400' : 'text-[#BC8F8F]'} group-hover:scale-125 transition-transform`} />
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-neutral-200 group-hover:text-rose-300' : 'text-[#37474F] group-hover:text-[#BC8F8F]'}`}>{shop.name}</span>
                                          <span className={`text-[11px] px-1.5 py-0.5 rounded-md border shadow-sm ${isDarkMode ? 'bg-neutral-800 text-neutral-400 border-neutral-700' : 'bg-white text-stone-500 border-stone-200'}`}>{shop.tag}</span>
                                        </div>
                                        <span className={`text-xs mt-0.5 ${theme.textSec}`}>{shop.note}</span>
                                      </div>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 周邊連鎖 */}
                          <div>
                            <h4 className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}>
                              <Coffee className="w-3.5 h-3.5 text-stone-400" /> 附近常見連鎖 (1km內)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {areaData.nearbyChains.map((chain, i) => (
                                <a 
                                  key={i} 
                                  href={getMapLink(`${chain.name} ${areaData.mapQuerySuffix}`)}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm transition-all ${isDarkMode ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-sky-300 hover:border-sky-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-[#5D737E] hover:border-[#5D737E]/30'}`}
                                >
                                  <span className="font-bold">{chain.name}</span>
                                  <span className={`text-[10px] border-l pl-2 ${isDarkMode ? 'border-neutral-600 text-neutral-500' : 'text-stone-400 border-stone-200'}`}>{chain.location}</span>
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
        {activeTab === 'ai' && (
          <div className="flex-1 px-4 pb-4 space-y-4 flex flex-col h-[calc(100vh-130px)] animate-fadeIn">
            <div className={`backdrop-blur-2xl border rounded-[2rem] shadow-xl flex-1 flex flex-col overflow-hidden max-w-full transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
              {/* Chat Header */}
              <div className={`p-4 border-b backdrop-blur-sm flex items-center gap-3 ${isDarkMode ? 'bg-neutral-800/60 border-neutral-700' : 'bg-white/60 border-stone-200/50'}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${theme.text}`}>AI 東京導遊</h2>
                  <p className={`text-xs flex items-center gap-1.5 ${theme.textSec}`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    線上服務中
                    {isSpeaking && <span className="ml-2 text-amber-600 font-bold flex items-center bg-amber-50 px-2 py-0.5 rounded-full"><Volume2 className="w-3 h-3 mr-1"/> 朗讀中...</span>}
                  </p>
                </div>
                {isSpeaking && (
                  <button 
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }}
                    className="ml-auto p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 ${isDarkMode ? 'bg-black/20' : 'bg-[#F9F9F6]/50'}`}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar Column */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border
                        ${msg.role === 'user' 
                          ? (isDarkMode ? 'bg-sky-800 text-white border-sky-700' : 'bg-[#5D737E] text-white border-[#4A606A]') 
                          : (isDarkMode ? 'bg-neutral-800 text-sky-300 border-neutral-700' : 'bg-white text-[#5D737E] border-stone-200')}`}>
                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      
                      {/* Speak Button - Moved here */}
                      {msg.role === 'model' && (
                        <button
                          onClick={() => handleSpeak(msg.text)}
                          className={`p-1 rounded-full transition-all ${isDarkMode ? 'text-sky-300 hover:bg-neutral-700' : 'text-[#5D737E] hover:bg-stone-200'}`}
                          title="朗讀訊息"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className={`max-w-[75%] group relative transition-all duration-300`}>
                      <div className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm border
                        ${msg.role === 'user' 
                          ? (isDarkMode ? 'bg-sky-800 text-white border-sky-700 rounded-tr-none' : 'bg-[#5D737E] text-white rounded-tr-none border-[#4A606A]')
                          : (isDarkMode ? 'bg-neutral-800/90 backdrop-blur-sm text-neutral-200 border-neutral-700 rounded-tl-none' : 'bg-white/90 backdrop-blur-sm text-stone-700 border-stone-200 rounded-tl-none')}`}>
                        {/* {msg.text} */}
                        {renderMessage(msg.text)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-stone-200'}`}>
                      <Bot className={`w-5 h-5 ${isDarkMode ? 'text-sky-300' : 'text-[#5D737E]'}`} />
                    </div>
                    <div className={`p-3 rounded-2xl rounded-tl-none border shadow-sm flex items-center gap-2 ${isDarkMode ? 'bg-neutral-800/60 border-neutral-700' : 'bg-white/80 border-stone-200'}`}>
                      <Loader className={`w-4 h-4 animate-spin ${isDarkMode ? 'text-sky-300' : 'text-[#5D737E]'}`} />
                      <span className={`text-xs ${theme.textSec}`}>正在思考中...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions */}
              <div className={`px-4 py-3 border-t flex gap-2.5 overflow-x-auto scrollbar-hide backdrop-blur-sm ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white/60 border-stone-200/50'}`}>
                {["Day 3 的晚餐推薦?", "如何搭乘百合海鷗號?", "翻譯「請給我兒童餐具」", "輕井澤會下雪嗎?"].map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setInputMessage(q); }}
                    className={`flex-shrink-0 text-xs px-3 py-2 rounded-full border shadow-sm transition-all ${isDarkMode ? 'bg-neutral-700/60 hover:bg-neutral-600 text-neutral-300 hover:text-sky-200 border-neutral-600' : 'bg-white/80 hover:bg-[#F0F5E5] text-stone-600 hover:text-[#556B2F] border-stone-200'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className={`p-3 border-t backdrop-blur-md ${isDarkMode ? 'bg-neutral-800/60 border-neutral-700' : 'bg-white/80 border-stone-200/50'}`}>
                <div className="flex gap-3">
                  {/* Chinese Mic Button */}
                  <button 
                    onClick={() => toggleListening('zh-TW')}
                    className={`p-2.5 rounded-xl transition-all shadow-sm border ${listeningLang === 'zh-TW' 
                      ? 'bg-[#5D737E] text-white animate-pulse shadow-md border-[#4A606A]' 
                      : (isDarkMode ? 'bg-neutral-800 text-sky-400 hover:bg-neutral-700 border-neutral-600' : 'bg-white text-[#5D737E] hover:bg-stone-50 border-stone-200')}`}
                    title="中文語音輸入"
                  >
                    {listeningLang === 'zh-TW' ? <MicOff className="w-5 h-5" /> : (
                      <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">中</div>
                    )}
                  </button>

                  {/* Japanese Mic Button */}
                  <button 
                    onClick={() => toggleListening('ja-JP')}
                    className={`p-2.5 rounded-xl transition-all shadow-sm border ${listeningLang === 'ja-JP' 
                      ? 'bg-rose-400 text-white animate-pulse shadow-md border-rose-500' 
                      : (isDarkMode ? 'bg-neutral-800 text-rose-300 hover:bg-neutral-700 border-neutral-600' : 'bg-white text-[#BC8F8F] hover:bg-stone-50 border-stone-200')}`}
                    title="日文語音輸入"
                  >
                    {listeningLang === 'ja-JP' ? <MicOff className="w-5 h-5" /> : (
                      <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">日</div>
                    )}
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={listeningLang === 'ja-JP' ? "聽取日文中..." : "輸入問題..."}
                    className={`flex-1 min-w-0 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all shadow-inner placeholder:text-opacity-50 ${isDarkMode ? 'bg-neutral-900/50 border-neutral-600 text-neutral-200 focus:border-sky-500 focus:ring-sky-500/20 placeholder:text-neutral-500' : 'bg-white border-stone-200 text-stone-700 focus:border-[#5D737E] focus:ring-[#5D737E]/20 placeholder:text-stone-400'}`}
                  />

                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className={`p-2.5 rounded-xl transition-all shadow-md ${isLoading || !inputMessage.trim() ? (isDarkMode ? 'bg-neutral-700 text-neutral-500 shadow-none' : 'bg-stone-200 text-stone-400 shadow-none') : (isDarkMode ? 'bg-gradient-to-r from-sky-700 to-blue-800 text-white hover:shadow-lg active:scale-95' : 'bg-gradient-to-r from-[#5D737E] to-[#3F5561] text-white hover:shadow-lg active:scale-95')}`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 實用連結 (Resources Tab) */}
        {activeTab === 'resources' && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div className={`backdrop-blur-2xl border rounded-[2rem] p-5 shadow-xl min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-blue-900/20' : 'bg-[#E8F0FE]'}`}><LinkIcon className={`w-4 h-4 ${isDarkMode ? 'text-blue-300' : 'text-[#3B5998]'}`} /></div>
                實用連結百寶箱
              </h2>
              
              <div className="space-y-4">
                {usefulLinks.map((section, idx) => (
                  <div key={idx}>
                    <h3 className={`text-xs font-bold mb-2.5 px-3 py-1.5 rounded-lg w-fit border ${isDarkMode ? 'text-blue-300 bg-blue-900/20 border-blue-800/30' : 'text-[#3B5998] bg-[#E8F0FE] border-blue-100'}`}>
                      {section.category}
                    </h3>
                    <div className="space-y-3">
                      {section.items.map((item, i) => (
                        <a 
                          key={i} 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 p-4 backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 group ${isDarkMode ? 'bg-neutral-800/30 border-neutral-700' : 'bg-white/60 border-stone-200'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner group-hover:scale-105 transition-transform ${isDarkMode ? 'bg-neutral-800 border-neutral-600' : 'bg-white border-stone-100'}`}>
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-bold flex items-center gap-1.5 group-hover:text-opacity-80 transition-colors ${isDarkMode ? 'text-neutral-200 group-hover:text-sky-300' : 'text-[#37474F] group-hover:text-[#5D737E]'}`}>
                              {item.title}
                              <ExternalLink className={`w-3 h-3 ${isDarkMode ? 'text-neutral-500' : 'text-stone-400'}`} />
                            </div>
                            <p className={`text-xs mt-0.5 ${theme.textSec}`}>{item.desc}</p>
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
          <div className={`backdrop-blur-xl border rounded-full shadow-2xl p-1.5 flex justify-between items-center transition-all duration-300 ${theme.navBg}`}>
            <button onClick={() => setActiveTab('itinerary')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'itinerary' ? (isDarkMode ? 'bg-neutral-700 text-white shadow-lg scale-105' : 'bg-[#5D737E] text-white shadow-lg scale-105') : (isDarkMode ? 'text-neutral-400 hover:bg-neutral-800' : 'text-stone-400 hover:bg-stone-100')}`}>
              <Home className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">行程</span>
            </button>
            <button onClick={() => setActiveTab('guides')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'guides' ? (isDarkMode ? 'bg-neutral-700 text-white shadow-lg scale-105' : 'bg-[#5D737E] text-white shadow-lg scale-105') : (isDarkMode ? 'text-neutral-400 hover:bg-neutral-800' : 'text-stone-400 hover:bg-stone-100')}`}>
              <BookOpen className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">指南</span>
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center justify-center w-16 h-16 -mt-6 rounded-full transition-all duration-300 border-4 ${isDarkMode ? 'bg-gradient-to-r from-amber-600 to-orange-700 border-neutral-800' : 'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] border-[#F9F9F6]'} text-white shadow-xl scale-110 shadow-md hover:scale-105`}>
              <MessageSquare className="w-7 h-7" />
            </button>
            <button onClick={() => setActiveTab('shops')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'shops' ? (isDarkMode ? 'bg-neutral-700 text-white shadow-lg scale-105' : 'bg-[#5D737E] text-white shadow-lg scale-105') : (isDarkMode ? 'text-neutral-400 hover:bg-neutral-800' : 'text-stone-400 hover:bg-stone-100')}`}>
              <Store className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">商家</span>
            </button>
            <button onClick={() => setActiveTab('resources')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'resources' ? (isDarkMode ? 'bg-neutral-700 text-white shadow-lg scale-105' : 'bg-[#5D737E] text-white shadow-lg scale-105') : (isDarkMode ? 'text-neutral-400 hover:bg-neutral-800' : 'text-stone-400 hover:bg-stone-100')}`}>
              <LinkIcon className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">連結</span>
            </button>
          </div>
        </div>

        {/* Floating Location Button */}
        <button 
          onClick={handleShareLocation}
          className={`fixed bottom-40 right-5 w-12 h-12 backdrop-blur-md border rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-all 
            ${hasLocationPermission === false 
              ? 'border-red-400 text-red-500 animate-pulse hover:bg-red-50' 
              : (isDarkMode ? 'bg-neutral-800/90 border-neutral-600 text-sky-300 hover:bg-neutral-700' : 'bg-white/90 border-stone-200 text-[#5D737E] hover:bg-stone-50')
            }`}
          aria-label="分享位置"
        >
          <LocateFixed className="w-6 h-6" />
        </button>

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-full shadow-xl z-[60] flex items-center gap-2 animate-bounce backdrop-blur-md border 
            ${toast.type === 'error' 
              ? (isDarkMode ? 'bg-red-900/90 text-white border-red-700' : 'bg-red-500/90 text-white border-white/20') 
              : (isDarkMode ? 'bg-green-800/90 text-white border-green-700' : 'bg-emerald-600/90 text-white border-white/20')}`}>
            {toast.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span className="text-sm font-bold tracking-wide">{toast.message}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default ItineraryApp;