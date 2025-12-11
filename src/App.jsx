import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, CloudSnow, MapPin, Train, ShoppingBag, 
  Star, Camera, AlertCircle, Snowflake, Hotel, Utensils, 
  ChevronDown, ChevronUp, Info, ExternalLink, QrCode, 
  Calendar, Link as LinkIcon, Home, Clock, Store, Coffee, Map, BookOpen, FileText,
  Sparkles, Send, MessageSquare, Loader, User, Bot, Briefcase, Thermometer, Navigation, Shield, Scissors, Volume2, StopCircle, Mic, MicOff, CloudRain, Cloud, CloudFog, CloudLightning, Wind, ArrowRight, Check, X
} from 'lucide-react';

const ItineraryApp = () => {
  // --- Gemini API Configuration ---
  const apiKey = ""; // ⚠️ 請在此填入您的 Gemini API Key
  
  // Tab state: 'itinerary', 'shops', 'guides', 'resources', 'ai'
  const [activeTab, setActiveTab] = useState('itinerary');
  const [activeDay, setActiveDay] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});

  // Weather State
  const [weatherForecast, setWeatherForecast] = useState({
    karuizawa: null,
    tokyo: null,
    loading: true
  });

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Chat State
  const [messages, setMessages] = useState([
    { role: 'model', text: '您好！我是您的專屬 AI 導遊 ✨\n我已經熟讀了您的 6 天行程。\n\n💡 翻譯小技巧：\n1. 輸入「翻譯 兒童餐具」→ 我會只顯示日文並朗讀給店員聽。\n2. 輸入日文句子 → 我會直接翻成中文給您看。' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const toggleExpand = (dayIndex, eventIndex) => {
    const key = `${dayIndex}-${eventIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // --- Helper Functions ---
  
  // 1. Get Google Map Link
  const getMapLink = (query) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // 2. Get Weather Info from WMO Code
  const getWeatherInfo = (code) => {
    if (code === 0) return { icon: <Sun className="w-8 h-8 text-orange-400" />, text: "晴朗", advice: "天氣很好，注意防曬與保濕。" };
    if ([1, 2, 3].includes(code)) return { icon: <Cloud className="w-8 h-8 text-blue-300" />, text: "多雲", advice: "舒適的天氣，適合戶外活動。" };
    if ([45, 48].includes(code)) return { icon: <CloudFog className="w-8 h-8 text-slate-400" />, text: "有霧", advice: "能見度較低，移動請注意安全。" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { icon: <CloudRain className="w-8 h-8 text-blue-500" />, text: "有雨", advice: "請務必攜帶雨具，安排室內備案。" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: <Snowflake className="w-8 h-8 text-cyan-300" />, text: "降雪", advice: "地面濕滑，請穿著防滑雪靴與防水衣物。" };
    if ([95, 96, 99].includes(code)) return { icon: <CloudLightning className="w-8 h-8 text-yellow-500" />, text: "雷雨", advice: "請盡量待在室內，注意安全。" };
    return { icon: <Sun className="w-8 h-8 text-orange-400" />, text: "晴時多雲", advice: "洋蔥式穿搭，備好手套圍巾。" };
  };

  // 3. Determine Location based on Day Index
  const getDailyLocation = (dayIndex) => {
    if (dayIndex <= 1) return 'karuizawa';
    return 'tokyo';
  };

  // --- Weather API Integration (Daily Forecast) ---
  useEffect(() => {
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
  }, []);

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

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("抱歉，您的瀏覽器不支援語音輸入功能。");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputMessage('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // --- Text-to-Speech ---
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
      
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
    } else {
      alert("抱歉，您的瀏覽器不支援語音朗讀功能。");
    }
  };

  // Data Definitions (Keeping same data as before)
  const guidesData = [
    {
      title: "Skyliner 臉部辨識購票 (Face Check-in Go)",
      icon: <Train className="w-5 h-5 text-blue-600" />,
      summary: "不用排隊領票，直接『刷臉』進站的最新功能！",
      steps: [
        "進入 Skyliner e-ticket 官網購票 (選擇單程/來回)。",
        "付款完成後，系統會引導拍攝/上傳臉部照片。",
        "抵達機場車站後，直接走『Face Check-in Go』專用閘門。",
        "看鏡頭刷臉，閘門會吐出紙本車票 (記得拿！)，直接進站。",
        "出站時走人工通道，將紙本車票交給站務員即可。"
      ],
      link: { text: "官網購票與詳情", url: "https://www.keisei.co.jp/keisei/tetudou/skyliner/e-ticket/zht/" },
      blogs: [
        { title: "妮可魯｜Skyliner「刷臉」秒過閘口超方便教學", url: "https://nicolelee.tw/skyliner/" },
        { title: "OREO時光旅行｜2025 Skyliner 人臉識別進站攻略", url: "https://oreo.blog/skyliner2025/" },
        { title: "樂吃購！日本｜Skyliner 搭乘攻略與刷臉教學", url: "https://tokyo.letsgojp.com/archives/738491/" }
      ]
    },
    {
      title: "teamLab Borderless 購票與入場",
      icon: <Camera className="w-5 h-5 text-pink-500" />,
      summary: "麻布台之丘熱門景點，務必提前預約。",
      steps: [
        "建議提前 1-2 個月上官網預訂，選擇日期與入場時段。",
        "購票後會收到 QR Code (電子票)。",
        "當天依預約時段抵達，在入口掃描 QR Code 入場。",
        "場內禁止飲食、自拍棒、大型行李 (有置物櫃)。",
        "部分展區地板為鏡面，建議穿著褲裝。"
      ],
      link: { text: "官方購票頁面", url: "https://www.teamlab.art/zh-hant/e/borderless-azabudai/" },
      blogs: [
        { title: "Wendy's Journey｜麻布台之丘 teamLab 參觀攻略", url: "https://www.wendyjourney.com/teamlab-borderless/" },
        { title: "樂吃購！日本｜麻布台之丘攻略：teamLab 門票與交通", url: "https://tokyo.letsgojp.com/archives/632958/" }
      ]
    },
    {
      title: "Visit Japan Web 入境申報",
      icon: <QrCode className="w-5 h-5 text-yellow-500" />,
      summary: "2025年最新入境必備，節省通關時間。",
      steps: [
        "出發前一週：註冊帳號並登入 Visit Japan Web。",
        "登錄本人資料 (掃描護照) 與同行家人資料。",
        "登錄『入境、回國預定』(填寫航班、住宿飯店)。",
        "完成『入境審查』與『海關申報』的資料填寫。",
        "產生 QR Code (建議截圖保存)，抵達日本時出示掃描。"
      ],
      link: { text: "開始申報 (官方)", url: "https://vjw-lp.digital.go.jp/zh-hant/" },
      blogs: [
        { title: "DJB｜2025 日本入境快速通關 Visit Japan Web 教學", url: "https://djbcard.com/visitjapanweb/" },
        { title: "樂吃購！日本｜2025 最新 Visit Japan Web 填寫全攻略", url: "https://www.letsgojp.com/archives/535150/" },
        { title: "輕旅行｜Visit Japan Web 申請填寫懶人包", url: "https://travel.yam.com/article/138578" }
      ]
    },
    {
      title: "JR 東日本網路訂票 (Ekinet)",
      icon: <Train className="w-5 h-5 text-green-600" />,
      summary: "預訂北陸新幹線指定席 (上野 ↔ 輕井澤)。",
      steps: [
        "註冊 JR-EAST Train Reservation 帳號。",
        "選擇路線：北陸新幹線 (Hokuriku Shinkansen)。",
        "輸入出發/到達站 (Ueno / Karuizawa) 與日期時間。",
        "選位並付款。取得 QR Code 或取票代碼。",
        "乘車前至 JR 車站的『指定席售票機』掃描護照或輸入代碼取票。"
      ],
      link: { text: "Ekinet 繁體中文官網", url: "https://www.eki-net.com/zh-CHT/jreast-train-reservation/Top/Index" },
      blogs: [
        { title: "JR Times｜使用網路訂票系統預約新幹線教學", url: "https://www.jrtimes.tw/article.aspx?article_id=328" },
        { title: "Traveler Duck｜2025 JR 東日本訂票、劃位、取票教學", url: "https://travelerduck.com/jr-east-guide/" },
        { title: "NAVITIME｜JR 線票務安排與領票指南", url: "https://japantravel.navitime.com/zh-tw/booking/jr/support/ticketing/" }
      ]
    }
  ];

  const usefulLinks = [
    {
      category: "交通與工具",
      items: [
        { title: "Visit Japan Web", desc: "入境申報必填 (官方)", url: "https://vjw-lp.digital.go.jp/zh-hant/", icon: <QrCode className="w-5 h-5 text-blue-500"/> },
        { title: "乘換案內 (Jorudan)", desc: "日本電車轉乘查詢中文版", url: "https://world.jorudan.co.jp/mln/zh-tw/", icon: <Train className="w-5 h-5 text-gray-600"/> },
        { title: "JR 東日本訂票", desc: "預訂新幹線指定席", url: "https://www.eki-net.com/zh-CHT/jreast-train-reservation/Top/Index", icon: <Train className="w-5 h-5 text-green-600"/> },
        { title: "Keisei Skyliner", desc: "成田機場交通購票", url: "https://www.keisei.co.jp/keisei/tetudou/skyliner/tc/", icon: <Train className="w-5 h-5 text-blue-700"/> },
        { title: "東京地鐵圖 (PDF)", desc: "官方多語言地圖", url: "https://www.tokyometro.jp/tcn/subwaymap/", icon: <Map className="w-5 h-5 text-blue-400"/> }
      ]
    },
    {
      category: "天氣與實用",
      items: [
        { title: "輕井澤天氣 (Tenki.jp)", desc: "查詢降雪與穿搭指數", url: "https://tenki.jp/forecast/3/23/4820/20321/", icon: <CloudSnow className="w-5 h-5 text-cyan-500"/> },
        { title: "東京天氣 (Tenki.jp)", desc: "查詢市區天氣", url: "https://tenki.jp/forecast/3/16/4410/", icon: <Sun className="w-5 h-5 text-orange-500"/> },
        { title: "Coin Locker Navi", desc: "尋找車站置物櫃", url: "https://www.coinlocker-navi.com/", icon: <Briefcase className="w-5 h-5 text-slate-500"/> }
      ]
    },
    {
      category: "景點預約",
      items: [
        { title: "teamLab Borderless", desc: "麻布台之丘官方預約", url: "https://www.teamlab.art/zh-hant/e/borderless-azabudai/", icon: <Camera className="w-5 h-5 text-pink-500"/> },
        { title: "六本木之丘展望台", desc: "Tokyo City View 官網", url: "https://tcv.roppongihills.com/tw/", icon: <Star className="w-5 h-5 text-yellow-500"/> }
      ]
    },
    {
      category: "購物與優惠",
      items: [
        { title: "Bic Camera 優惠券", desc: "最高 10% + 7%", url: "https://www.biccamera.com/bc/i/topics/global/index.jsp", icon: <ShoppingBag className="w-5 h-5 text-red-500"/> },
        { title: "唐吉訶德優惠券", desc: "電子版優惠券", url: "https://www.djapanpass.com/coupon/0002000103", icon: <ShoppingBag className="w-5 h-5 text-blue-800"/> },
        { title: "松本清藥妝", desc: "店鋪搜尋與資訊", url: "https://www.matsukiyococokara-online.com/store/", icon: <ShoppingBag className="w-5 h-5 text-yellow-600"/> },
        { title: "輕井澤王子 Outlet", desc: "樓層指南與優惠", url: "https://www.karuizawa-psp.jp/tw/", icon: <ShoppingBag className="w-5 h-5 text-purple-600"/> }
      ]
    },
    {
      category: "緊急與保險",
      items: [
        { title: "富邦產險理賠", desc: "旅遊不便險/旅平險官網", url: "https://www.fubon.com/insurance/home/", icon: <Shield className="w-5 h-5 text-blue-600"/> },
        { title: "Tokio Marine 日動", desc: "VJW 推薦旅平險理賠 (中文)", url: "https://tokiomarinenichido.jp/zh-hant/china2/", icon: <Shield className="w-5 h-5 text-green-600"/> },
        { title: "JNTO 醫療指南", desc: "搜尋可對應外語的醫院", url: "https://www.jnto.go.jp/emergency/chc/mi_guide.html", icon: <AlertCircle className="w-5 h-5 text-red-500"/> }
      ]
    }
  ];

  const shopGuideData = [
    {
      area: "輕井澤 (Day 1-2)",
      desc: "王子購物廣場周邊",
      mapQuerySuffix: "輕井澤", 
      mainShops: [
        { name: "Gucci", tag: "精品", note: "Outlet 折扣區" },
        { name: "LEGO Store", tag: "玩具", note: "Outlet 內" },
        { name: "味之街 (Ajino-Machi)", tag: "美食", note: "晚餐首選" }
      ],
      specialShops: [
        { name: "Gap Outlet", tag: "童裝", note: "款式多折扣大" },
        { name: "Miki House", tag: "童裝", note: "日本製高品質" },
        { name: "PLAZA", tag: "雜貨/文具", note: "Outlet 內" }
      ],
      nearbyChains: [
        { name: "Starbucks", location: "Outlet 內" },
        { name: "7-Eleven", location: "王子飯店東館附近" },
        { name: "Tully's Coffee", location: "Outlet 內" }
      ]
    },
    {
      area: "上野 (Day 3, 6)",
      desc: "車站與阿美橫丁周邊",
      mapQuerySuffix: "上野",
      mainShops: [
        { name: "Yamashiroya", tag: "玩具", note: "車站對面整棟玩具城" },
        { name: "PARCO_ya", tag: "百貨", note: "HARBS 甜點" },
        { name: "多慶屋 (Takeya)", tag: "伴手禮", note: "紫色大樓，零食便宜" },
        { name: "唐吉訶德", tag: "雜貨", note: "上野店" }
      ],
      specialShops: [
        { name: "Ueno LOFT", tag: "文具/雜貨", note: "上野丸井 (Marui) 5F" },
        { name: "Uniqlo / GU", tag: "童裝", note: "御徒町吉池大樓 (大型店)" },
        { name: "ABC-Mart", tag: "童鞋", note: "上野多間分店" }
      ],
      nearbyChains: [
        { name: "Starbucks", location: "上野公園內" },
        { name: "麥當勞", location: "上野車站前" },
        { name: "松屋", location: "阿美橫丁周邊" }
      ]
    },
    {
      area: "六本木 / 麻布台 (Day 4)",
      desc: "港區時尚中心",
      mapQuerySuffix: "六本木",
      mainShops: [
        { name: "teamLab Borderless", tag: "體驗", note: "麻布台之丘" },
        { name: "Estnation", tag: "選物", note: "六本木之丘" },
        { name: "Tsutaya 書店", tag: "書店", note: "星巴克聯名店" }
      ],
      specialShops: [
        { name: "Smith", tag: "文具", note: "六本木之丘 (質感文具)" },
        { name: "Ribbon hakka kids", tag: "童裝", note: "六本木之丘" },
        { name: "LEGO Store", tag: "玩具", note: "六本木之丘" }
      ],
      nearbyChains: [
        { name: "Starbucks", location: "六本木之丘" },
        { name: "Shake Shack", location: "六本木之丘" },
        { name: "麥當勞", location: "六本木十字路口" }
      ]
    },
    {
      area: "台場 / 豐洲 (Day 5)",
      desc: "海灣休閒區",
      mapQuerySuffix: "台場",
      mainShops: [
        { name: "哆啦A夢未來百貨", tag: "樂園", note: "DiverCity" },
        { name: "après les cours", tag: "童裝", note: "LaLaport 豐洲" },
        { name: "Akachan Honpo", tag: "母嬰", note: "LaLaport 豐洲" }
      ],
      specialShops: [
        { name: "Toyosu LOFT", tag: "文具/雜貨", note: "LaLaport 豐洲 1F" },
        { name: "Petit Main", tag: "童裝", note: "LaLaport 豐洲" },
        { name: "BREEZE", tag: "童裝", note: "DiverCity / LaLaport" }
      ],
      nearbyChains: [
        { name: "Uniqlo", location: "DiverCity Tokyo" },
        { name: "麥當勞", location: "DiverCity 美食街" },
        { name: "Starbucks", location: "DiverCity" },
        { name: "Lawson", location: "台場周邊" }
      ]
    }
  ];

  const itineraryData = [
    {
      day: "Day 1",
      date: "1/24 (六)",
      title: "抵達與移動：直奔雪國",
      stay: "輕井澤王子大飯店西館 (露臺房 Terrace Room)",
      routeInfo: {
        summary: "成田機場 → 京成上野 → JR上野 → 輕井澤 → 飯店",
        mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Narita+Airport&destination=Karuizawa+Prince+Hotel+West&waypoints=Keisei+Ueno+Station|Karuizawa+Station"
      },
      events: [
        { 
          time: "10:30", 
          title: "抵達東京成田機場", 
          icon: <MapPin />, 
          desc: "領取行李，準備開啟旅程！",
          tips: ["入境後請先去兌換/購買 JR 東京廣域周遊券 (若有買) 或新幹線車票。", "連結機場 WiFi 或開通漫遊。"]
        },
        { 
          time: "11:30", 
          title: "交通：成田 → 上野", 
          icon: <Train />, 
          desc: "搭乘 Skyliner 前往市區。",
          transport: {
            mode: "京成電鐵 Skyliner",
            duration: "約 45 分鐘",
            route: "成田機場站 → 京成上野站",
            note: "全車指定席，建議事先上網買外國人優惠票。"
          }
        },
        { 
          time: "12:30", 
          title: "上野站轉乘與午餐", 
          icon: <Utensils />, 
          desc: "購買知名的鐵路便當 (Ekiben)！",
          highlights: ["上野站中央改札口外的便當屋「駅弁屋 匠」種類最全。", "推薦：深川飯便當、牛肉壽喜燒便當。"],
          tips: ["京成上野站走路到 JR 上野站約需 5-7 分鐘，沿途有指標。"]
        },
        { 
          time: "13:30", 
          title: "交通：上野 → 輕井澤", 
          icon: <Train />, 
          desc: "搭乘北陸新幹線，舒適直達。",
          transport: {
            mode: "北陸新幹線 (Hakutaka 或 Asama 號)",
            duration: "約 60-70 分鐘",
            route: "JR 上野站 → 輕井澤站",
            note: "⚠️ 務必提前 1 個月於 JR 東日本官網預訂指定席！"
          }
        },
        { 
          time: "15:00", 
          title: "入住王子飯店", 
          icon: <Hotel />, 
          desc: "前往西館辦理入住。",
          transport: {
            mode: "飯店接駁車 (Piccolo Bus)",
            duration: "約 10 分鐘",
            route: "輕井澤站南口 → 西館門口",
            note: "接駁車約每 30 分鐘一班 (綠色/棕色復古巴士)。"
          },
          highlights: ["露臺房 (Terrace Room) 空間寬敞，非常適合家庭。", "房間有露臺可欣賞雪景。"]
        },
        { 
          time: "18:00", 
          title: "晚餐：Outlet 味之街", 
          icon: <Utensils />, 
          desc: "Outlet 營業至 19:00 (餐廳至 20:00+)。",
          highlights: ["明治亭 (醬汁豬排丼)", "築地ハレの日 (海鮮丼)"],
          tips: ["第一天舟車勞頓，建議在 Outlet 吃完早點回房休息。"]
        }
      ]
    },
    {
      day: "Day 2",
      date: "1/25 (日)",
      title: "輕井澤：安心玩雪與購物",
      stay: "輕井澤王子大飯店西館 (露臺房 Terrace Room)",
      routeInfo: {
        summary: "飯店 → 王子滑雪場 → 王子Outlet → 飯店",
        mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Karuizawa+Prince+Hotel+West&destination=Karuizawa+Prince+Hotel+West&waypoints=Karuizawa+Prince+Hotel+Ski+Resort|Karuizawa+Prince+Shopping+Plaza"
      },
      events: [
        { 
          time: "09:30", 
          title: "王子飯店滑雪場 Kids Park", 
          icon: <Snowflake />, 
          desc: "就在 Outlet 旁，專為兒童設計的戲雪區。",
          highlights: ["雪盆溜滑梯", "輪胎滑雪 (Tubing)", "堆雪人區域"],
          tips: ["入場費約 ¥2000/人 (包含雪具租借)。", "旁邊有休息室和廁所，非常方便。"]
        },
        { 
          time: "12:30", 
          title: "午餐：Outlet 美食街", 
          icon: <Utensils />, 
          desc: "Food Court 選擇多，適合親子。",
          highlights: ["濃厚生乳霜淇淋 (必吃！)", "信州著名的蕎麥麵"],
          tips: ["週末用餐時間人潮眾多，建議提早或延後用餐。"]
        },
        { 
          time: "14:00", 
          title: "Outlet 深度購物", 
          icon: <ShoppingBag />, 
          desc: "全日本最美 Outlet，品牌極全。",
          highlights: ["媽媽必逛：Gucci, Bottega Veneta, Coach (折扣優)", "小孩必逛：樂高商店 (LEGO), 森林家族"],
          tips: ["可以先去 Information Center 領取外國人優惠券。", "園區很大，善用園區內循環巴士。"]
        },
        { 
          time: "18:00", 
          title: "晚餐：Outlet 餐廳", 
          icon: <Utensils />, 
          desc: "享用豐盛晚餐。",
          highlights: ["久世福食堂 (日式定食)", "Aged Beef (熟成牛排)"],
          tips: ["吃飽後可在 Outlet 欣賞夜間點燈，非常浪漫。"]
        }
      ]
    },
    {
      day: "Day 3",
      date: "1/26 (一)",
      title: "移動日 + 上野輕鬆逛",
      stay: "&HERE TOKYO UENO (上野)",
      routeInfo: {
        summary: "輕井澤 → 上野站 → 飯店 → Yamashiroya → PARCO_ya → 阿美橫丁",
        mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Karuizawa+Prince+Hotel+West&destination=Ameyoko+Shopping+District&waypoints=Karuizawa+Station|Ueno+Station|Yamashiroya|PARCO_ya+Ueno"
      },
      events: [
        { 
          time: "10:00", 
          title: "交通：輕井澤 → 上野", 
          icon: <Train />, 
          desc: "搭乘新幹線返回東京。",
          transport: {
            mode: "北陸新幹線",
            duration: "約 60-70 分鐘",
            route: "輕井澤站 → JR 上野站",
            note: "記得 check-out 飯店，搭乘接駁車回車站。"
          }
        },
        { 
          time: "11:30", 
          title: "抵達飯店 & 午餐", 
          icon: <Hotel />, 
          desc: "步行至 &HERE TOKYO UENO 寄放行李。",
          transport: {
            mode: "步行",
            duration: "約 8-10 分鐘",
            route: "上野站不忍口 →飯店",
            note: "飯店靠近上野公園不忍池側，位置清幽。"
          },
          highlights: ["午餐推薦：一蘭拉麵上野店 (就在車站旁)", "壽司郎上野店 (需抽號碼牌)"]
        },
        { 
          time: "13:30", 
          title: "爸媽分組行動 (安太座時光)", 
          icon: <Star />, 
          desc: "爸爸帶小孩逛玩具，媽媽去百貨下午茶。",
          highlights: ["👨 爸+寶：Yamashiroya 玩具店 (上野站對面整棟，B1-6F 全是玩具)", "👩 媽媽：PARCO_ya 上野 (質感百貨)"],
          tips: ["媽媽務必去 PARCO_ya 的 HARBS 吃水果千層蛋糕！"]
        },
        { 
          time: "17:30", 
          title: "阿美橫丁", 
          icon: <ShoppingBag />, 
          desc: "感受東京下町熱鬧氣氛。",
          highlights: ["二木之菓子 (買伴手禮零食)", "OS Drug (藥妝超便宜，只收現金)", "鐵火丼 (生魚片蓋飯)"],
          tips: ["人潮擁擠，請牽好小孩。", "水果串 (草莓/哈密瓜) 是必吃街頭小吃。"]
        }
      ]
    },
    {
      day: "Day 4",
      date: "1/27 (二)",
      title: "六本木：藝術與浪漫之夜",
      stay: "&HERE TOKYO UENO (上野)",
      routeInfo: {
        summary: "上野 → 麻布台之丘 → teamLab → 六本木之丘 → 櫸木坂點燈 → 上野",
        mapUrl: "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=&HERE+TOKYO+UENO&waypoints=Azabudai+Hills|teamLab+Borderless|Roppongi+Hills|Roppongi+Keyakizaka+Dori"
      },
      events: [
        { 
          time: "08:20", 
          title: "交通：上野 → 麻布台之丘", 
          icon: <Train />, 
          desc: "提早出發，前往東京最新地標。",
          transport: {
            mode: "東京地鐵 日比谷線 (H線)",
            duration: "約 25 分鐘",
            route: "上野站 (H17) → 神谷町站 (H05)",
            note: "神谷町站直結麻布台之丘，不用出站。"
          }
        },
        { 
          time: "09:00", 
          title: "teamLab Borderless", 
          icon: <Camera />, 
          desc: "沉浸式光影藝術，視覺震撼。",
          highlights: ["彩繪海洋：小孩畫的魚會游進牆壁裡！", "泡泡宇宙：絕美燈球空間", "無界的世界：光影會移動"],
          tips: ["✅ 已預約 9:00 場次，請準時入場。", "場內黑暗且有鏡面地板，建議穿褲裝，不要穿裙子。"]
        },
        { 
          time: "12:00", 
          title: "午餐：麻布台之丘", 
          icon: <Utensils />, 
          desc: "享用質感午餐。",
          tips: ["這裡有很多新開的網紅咖啡廳，如 % Arabica。", "若人多可至地下美食街覓食。"]
        },
        { 
          time: "13:30", 
          title: "移動 & 東京城市景觀", 
          icon: <Camera />, 
          desc: "前往六本木之丘展望台。",
          transport: {
            mode: "步行 或 地鐵一站",
            duration: "約 15-20 分鐘",
            route: "麻布台之丘 → 六本木之丘",
            note: "天氣好建議散步過去，沿途街景很美。"
          },
          highlights: ["52F 室內展望台：360度俯瞰東京，東京鐵塔近在眼前。", "下午有充裕時間，可以在六本木之丘悠閒逛街。"]
        },
        { 
          time: "17:00", 
          title: "六本木櫸木坂點燈", 
          icon: <Star />, 
          desc: "媽媽心願達成！✨",
          highlights: ["整排樹掛滿藍白燈飾 + 紅色東京鐵塔背景。", "最佳拍照點：蒂芬妮 (Tiffany) 專賣店附近的天橋。"],
          tips: ["這時候風會比較大，記得戴帽子。"]
        }
      ]
    },
    {
      day: "Day 5",
      date: "1/28 (三)",
      title: "台場夢想日 + 童裝採購",
      stay: "&HERE TOKYO UENO (上野)",
      routeInfo: {
        summary: "上野 → 台場DiverCity → LaLaport豐洲 → 上野",
        mapUrl: "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=&HERE+TOKYO+UENO&waypoints=DiverCity+Tokyo+Plaza|Urban+Dock+LaLaport+Toyosu"
      },
      events: [
        { 
          time: "09:30", 
          title: "交通：上野 → 台場", 
          icon: <Train />, 
          desc: "搭乘著名的百合海鷗號。",
          transport: {
            mode: "地鐵銀座線 + 百合海鷗號",
            duration: "約 40 分鐘",
            route: "上野 → 新橋 (轉乘) → 台場站",
            note: "💡 必殺技：去程請搶百合海鷗號「第一節車廂」最前排，風景無敵！"
          }
        },
        { 
          time: "10:30", 
          title: "哆啦A夢未來百貨", 
          icon: <Star />, 
          desc: "位於 DiverCity Tokyo Plaza 2F。",
          highlights: ["秘密道具實驗室：體驗竹蜻蜓、空氣砲 (需代幣)", "客製化刺繡區：可以繡名字在毛巾/包包上"],
          tips: ["門口有 1:1 實物大獨角獸鋼彈，整點有變身秀。"]
        },
        { 
          time: "14:00", 
          title: "交通：台場 → 豐洲", 
          icon: <Train />, 
          desc: "前往 LaLaport 豐洲。",
          transport: {
            mode: "百合海鷗號",
            duration: "約 20 分鐘",
            route: "台場站 → 豐洲站",
            note: "從豐洲站直結通往 LaLaport 商場。"
          }
        },
        { 
          time: "14:30", 
          title: "童裝採購：après les cours", 
          icon: <ShoppingBag />, 
          desc: "位於 LaLaport 豐洲 2F。",
          highlights: ["小朋友最愛的童裝品牌，款式齊全。", "商場外有海濱公園，風景優美。"],
          tips: ["這裡也有阿卡將本舖 (Akachan Honpo)，可以順便補貨母嬰用品。"]
        },
        { 
          time: "18:00", 
          title: "晚餐 & 返回上野", 
          icon: <Utensils />, 
          desc: "欣賞夜景後回程。",
          transport: {
            mode: "地鐵有樂町線 + 山手線",
            duration: "約 30 分鐘",
            route: "豐洲 → 有樂町 (轉乘) → 上野",
            note: "避開下班尖峰時間搭車會比較舒適。"
          }
        }
      ]
    },
    {
      day: "Day 6",
      date: "1/29 (四)",
      title: "最後衝刺與返家",
      stay: "溫暖的家",
      routeInfo: {
        summary: "上野多慶屋 → 京成上野站 → 成田機場",
        mapUrl: "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=Narita+Airport+Terminal+2&waypoints=Takeya+1|Keisei+Ueno+Station"
      },
      events: [
        { 
          time: "09:00", 
          title: "上野補貨", 
          icon: <ShoppingBag />, 
          desc: "最後採買機會。",
          highlights: ["多慶屋 (紫色大樓)：零食伴手禮一次買齊。", "唐吉訶德上野店：補買藥妝雜貨。"],
          tips: ["記得預留時間回飯店拿行李！"]
        },
        { 
          time: "12:00", 
          title: "交通：上野 → 成田機場", 
          icon: <Train />, 
          desc: "搭乘 Skyliner 前往機場。",
          transport: {
            mode: "京成電鐵 Skyliner",
            duration: "約 45 分鐘",
            route: "京成上野站 → 成田機場第2航廈",
            note: "建議搭乘 12:00 或 12:20 的班次，13:00 前抵達機場。"
          }
        },
        { 
          time: "13:30", 
          title: "機場最後衝刺", 
          icon: <Star />, 
          desc: "成田機場第2航廈 4F。",
          highlights: ["Pokemon Store (寶可夢商店)", "Fa-So-La 免稅店 (買餅乾/清酒)"],
          tips: ["星宇航空櫃檯通常在 3F，先掛行李再去逛。"]
        },
        { 
          time: "15:40", 
          title: "班機：星宇 JX803", 
          icon: <Train />, 
          desc: "快樂返台！",
          transport: {
            mode: "飛機",
            duration: "約 4 小時",
            route: "東京成田 (NRT) → 台北桃園 (TPE)",
            note: "抵達台灣時間約 18:50。"
          }
        }
      ]
    }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = { role: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Sanitization: Remove 'icon' properties from data to avoid circular JSON error
    const replacer = (key, value) => {
      if (key === 'icon') return undefined;
      return value;
    };

    try {
      const systemContext = `你是這趟東京輕井澤親子行的專屬 AI 導遊。
      
      以下是行程資料：
      ${JSON.stringify(itineraryData, replacer)}
      ${JSON.stringify(guidesData, replacer)}
      ${JSON.stringify(shopGuideData, replacer)}

      請嚴格遵守以下回應規則：
      1. **翻譯指令**：
         - 若使用者要求翻譯(如「翻譯...」)，請**僅回傳**翻譯後的日文內容，不要包含任何解釋、標點以外的符號或羅馬拼音。
         - 若使用者輸入純日文，請**僅回傳**翻譯後的中文內容，不要包含任何解釋。
         - 這是為了讓語音朗讀功能能精確朗讀翻譯結果。
      
      2. **一般導遊對話**：
         - 若非翻譯請求，請根據行程資料回答。
         - 對象是 2 大 1 小 (6歲) 的家庭。
         - 回答要簡短、友善、實用。
         - 如果問路，請參考行程中的交通資訊。
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemContext + "\nUser Question: " + inputMessage }]
              }
            ]
          })
        }
      );

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "抱歉，我現在有點忙，請稍後再試。";
      
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "連線發生錯誤，請檢查網路或 API Key。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const current = itineraryData[activeDay];

  // Determine current weather based on day
  const currentLocation = getDailyLocation(activeDay);
  const weatherData = weatherForecast[currentLocation];
  
  // Default to historical fallback if live data not available or error
  let displayWeather = {
    icon: <Sun className="w-8 h-8 text-orange-400" />,
    temp: "N/A",
    desc: "載入中...",
    advice: "請稍候"
  };

  if (!weatherForecast.loading && weatherData) {
     // Use the weather data for the specific "virtual" day of the trip (0 to 5)
     // Since the API returns 7 days starting from "today", this simulates the forecast sequence
     // Day 0 -> Today's forecast, Day 1 -> Tomorrow's forecast, etc.
     const dayIndex = activeDay; 
     // Ensure we don't go out of bounds if trip is longer than forecast
     const forecastIndex = dayIndex < weatherData.time.length ? dayIndex : 0;
     
     const maxTemp = Math.round(weatherData.temperature_2m_max[forecastIndex]);
     const minTemp = Math.round(weatherData.temperature_2m_min[forecastIndex]);
     const weatherCode = weatherData.weathercode[forecastIndex];
     const info = getWeatherInfo(weatherCode);

     displayWeather = {
       icon: info.icon,
       temp: `${minTemp}°C / ${maxTemp}°C`, // Showing Range with rounded values
       desc: info.text,
       advice: info.advice
     };
  } else if (!weatherForecast.loading && !weatherData) {
      // Fallback for demo / offline
      if (currentLocation === 'karuizawa') {
         displayWeather = { icon: <Snowflake className="w-8 h-8 text-cyan-300" />, temp: "-5°C / 2°C", desc: "寒冷", advice: "請穿著保暖雪衣" };
      } else {
         displayWeather = { icon: <Sun className="w-8 h-8 text-orange-300" />, temp: "3°C / 11°C", desc: "晴朗", advice: "乾冷，注意保濕" };
      }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#E3F2FD] to-[#F3E5F5] font-sans text-slate-700 pb-24 overflow-x-hidden selection:bg-purple-200">
      
      {/* Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-purple-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-cyan-200/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md mx-auto relative min-h-screen flex flex-col z-10">
        
        {/* Header Title with Glass Effect */}
        <div className="text-center pt-8 pb-6 relative z-20">
          <div className="inline-block px-6 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-sm">
            <h1 className="text-2xl font-bold text-[#2C3E50] tracking-wide">東京輕井澤親子之旅</h1>
            <p className="text-xs text-[#546E7A] mt-0.5 font-medium tracking-widest">2026/1/24 - 1/29</p>
          </div>
          {/* Floating Snowflakes */}
          <Snowflake className="absolute top-6 right-6 w-5 h-5 text-white/60 drop-shadow-sm animate-pulse" />
          <Snowflake className="absolute top-10 left-8 w-3 h-3 text-white/50 drop-shadow-sm" />
        </div>

        {/* --- Tab Content --- */}
        
        {/* 1. 行程分頁 (Itinerary Tab) */}
        {activeTab === 'itinerary' && (
          <div className="flex-1 space-y-5 px-4 pb-4 animate-fadeIn">
            {/* Navigation Buttons */}
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide py-1 px-1">
              {itineraryData.map((data, index) => (
                <button
                  key={index}
                  onClick={() => setActiveDay(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-2xl font-bold text-sm transition-all duration-300 border backdrop-blur-sm
                    ${activeDay === index 
                      ? 'bg-white/60 text-[#2C3E50] border-white/60 shadow-lg scale-105' 
                      : 'bg-white/20 text-[#546E7A] border-white/20 hover:bg-white/40'}`}
                >
                  {data.day}
                </button>
              ))}
            </div>

            {/* Weather Card */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-5 shadow-lg flex items-center justify-between relative overflow-hidden group hover:bg-white/50 transition-colors duration-300">
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-xs text-[#455A64] font-bold mb-2 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5" /> 預報 ({currentLocation === 'karuizawa' ? '輕井澤' : '東京'})
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/40 rounded-full shadow-inner">{displayWeather.icon}</div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-[#263238]">{displayWeather.temp.split('/')[0]}</span>
                      <span className="text-sm text-[#78909C]">/</span>
                      <span className="text-2xl font-bold text-[#263238]">{displayWeather.temp.split('/')[1]}</span>
                    </div>
                    <div className="text-sm font-medium text-[#546E7A] mt-0.5">{displayWeather.desc}</div>
                  </div>
                </div>
              </div>
              <div className="relative z-10 text-right max-w-[45%] flex flex-col items-end">
                 <div className="text-[10px] bg-[#E0F7FA]/80 text-[#006064] px-2.5 py-1 rounded-full font-bold mb-2 border border-[#B2EBF2] shadow-sm backdrop-blur-md">
                   💡 穿搭建議
                 </div>
                 <p className="text-xs text-[#37474F] leading-tight font-medium">{displayWeather.advice}</p>
              </div>
            </div>

            {/* Main Itinerary Content */}
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-6 shadow-xl min-h-[500px] relative">
              
              {/* Day Header */}
              <div className="mb-6 border-b border-white/30 pb-4">
                <div className="text-sm text-[#546E7A] font-semibold mb-1 flex items-center gap-2">
                  <span className="bg-white/50 px-2 py-0.5 rounded-md">{current.date}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#263238] mb-3 leading-tight drop-shadow-sm">{current.title}</h2>
                <div className="flex items-start gap-2 text-sm text-[#37474F] bg-blue-50/40 p-3 rounded-xl border border-blue-100/50">
                  <Hotel className="w-4 h-4 text-[#0288D1] mt-0.5 flex-shrink-0" />
                  <span className="font-medium leading-snug">{current.stay}</span>
                </div>
              </div>

              {/* Timeline Events */}
              <div className="space-y-4">
                {current.events.map((event, idx) => {
                  const isOpen = expandedItems[`${activeDay}-${idx}`];
                  return (
                    <div key={idx} className="group bg-white/60 hover:bg-white/80 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                      
                      {/* Header Row */}
                      <div 
                        className="p-4 flex gap-4 cursor-pointer"
                        onClick={() => toggleExpand(activeDay, idx)}
                      >
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105
                            ${event.title.includes('交通') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#0288D1]'}`}>
                            {event.icon}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs text-[#546E7A] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 bg-slate-100/50 w-fit px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> {event.time}
                              </div>
                              <h3 className="text-base font-bold text-[#263238] leading-tight mb-1.5">{event.title}</h3>
                            </div>
                            {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                          </div>
                          <p className="text-sm text-[#455A64] leading-relaxed">{event.desc}</p>
                          
                          {!isOpen && event.transport && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-green-700 bg-green-50/80 w-fit px-2.5 py-1 rounded-lg border border-green-100/50">
                              <Train className="w-3 h-3" />
                              <span className="font-medium">{event.transport.mode}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 space-y-3 bg-white/30 border-t border-white/50">
                          
                          {event.transport && (
                            <div className="mt-2 bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                              <h4 className="text-xs text-green-700 font-bold flex items-center gap-1.5 mb-2">
                                <Train className="w-3.5 h-3.5" /> 交通詳情
                              </h4>
                              <div className="space-y-1.5 text-xs text-[#37474F]">
                                <div className="flex gap-2"><span className="text-slate-400 min-w-[30px]">方式</span> <span className="font-medium">{event.transport.mode}</span></div>
                                <div className="flex gap-2"><span className="text-slate-400 min-w-[30px]">時間</span> <span>{event.transport.duration}</span></div>
                                <div className="flex gap-2"><span className="text-slate-400 min-w-[30px]">路線</span> <span>{event.transport.route}</span></div>
                                {event.transport.note && <p className="text-orange-600 font-medium mt-1.5 flex gap-1 items-start"><AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0"/> {event.transport.note}</p>}
                              </div>
                            </div>
                          )}

                          {event.highlights && (
                            <div>
                              <h4 className="text-xs text-[#E91E63] font-bold flex items-center gap-1.5 mb-2 mt-2">
                                <Star className="w-3.5 h-3.5" /> 必玩 / 必吃
                              </h4>
                              <ul className="space-y-1.5 pl-1">
                                {event.highlights.map((item, i) => (
                                  <li key={i} className="text-xs text-[#455A64] flex gap-2 items-start">
                                    <span className="text-[#E91E63] mt-0.5">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {event.tips && (
                            <div>
                              <h4 className="text-xs text-orange-600 font-bold flex items-center gap-1.5 mb-2 mt-2">
                                <Info className="w-3.5 h-3.5" /> 溫馨提醒
                              </h4>
                              <ul className="space-y-1.5 pl-1">
                                {event.tips.map((item, i) => (
                                  <li key={i} className="text-xs text-[#455A64] flex gap-2 items-start">
                                    <span className="text-orange-400 mt-0.5">•</span>
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
                <div className="mt-8 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Map className="w-4 h-4 text-[#0277BD]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#263238]">當日路線導航</h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-[#455A64] bg-white/40 p-3 rounded-xl border border-white/50 leading-relaxed">
                      <span className="font-bold text-[#0277BD] mr-1 block mb-1">路線摘要</span>
                      {current.routeInfo.summary}
                    </div>
                    <a
                      href={current.routeInfo.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-[#0288D1] to-[#01579B] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      <Navigation className="w-4 h-4" />
                      開啟 Google Maps 查看路線
                    </a>
                  </div>
                </div>
              )}

              {activeDay === 0 && (
                <div className="mt-6 bg-yellow-50/80 border border-yellow-200/60 rounded-xl p-4 text-xs text-yellow-800 flex gap-3 items-start shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
                  <span className="leading-relaxed font-medium">重要提醒：新幹線指定席票券建議提前一個月預訂，以免向隅！</span>
                </div>
              )}
               {activeDay === 3 && (
                <div className="mt-6 bg-pink-50/80 border border-pink-200/60 rounded-xl p-4 text-xs text-pink-800 flex gap-3 items-start shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-pink-600" />
                  <span className="leading-relaxed font-medium">重要提醒：teamLab Borderless 門票非常熱門，請務必提前上網購票。</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 參考指南 (Guides Tab) */}
        {activeTab === 'guides' && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-6 shadow-xl min-h-[500px]">
              <h2 className="text-xl font-bold text-[#2C3E50] mb-5 flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 rounded-xl"><BookOpen className="w-5 h-5 text-purple-600" /></div>
                實用參考指南
              </h2>
              <div className="space-y-5">
                {guidesData.map((guide, idx) => (
                  <div key={idx} className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-inner">
                        {guide.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#263238]">{guide.title}</h3>
                        <p className="text-xs text-[#546E7A] mt-1 leading-relaxed">{guide.summary}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-4 my-4 border border-slate-100">
                      <h4 className="text-xs font-bold text-[#455A64] mb-3 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> 操作重點
                      </h4>
                      <ol className="list-decimal list-inside text-xs text-[#546E7A] space-y-2 marker:text-[#0288D1] marker:font-bold pl-1">
                        {guide.steps.map((step, i) => <li key={i} className="leading-relaxed pl-1">{step}</li>)}
                      </ol>
                    </div>
                    <div className="space-y-3">
                      <a 
                        href={guide.link.url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-[#0288D1]/10 hover:bg-[#0288D1]/20 text-[#0277BD] text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        {guide.link.text}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {guide.blogs && guide.blogs.length > 0 && (
                        <div className="mt-3 border-t border-slate-200/50 pt-3">
                          <h4 className="text-[10px] font-bold text-[#90A4AE] mb-2 uppercase tracking-wide">相關圖文教學</h4>
                          <div className="space-y-1.5">
                            {guide.blogs.map((blog, bIdx) => (
                              <a
                                key={bIdx}
                                href={blog.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-[#546E7A] hover:text-[#0288D1] transition-colors p-1 rounded-lg hover:bg-white/50"
                              >
                                <span className="w-1 h-1 bg-[#CFD8DC] rounded-full"></span>
                                <span className="truncate underline decoration-slate-300/50 underline-offset-2 decoration-dotted">{blog.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. 商家導覽 (Shops Tab) */}
        {activeTab === 'shops' && (
          <div className="flex-1 px-4 pb-4 space-y-4 animate-fadeIn">
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-6 shadow-xl min-h-[500px]">
              <h2 className="text-xl font-bold text-[#2C3E50] mb-2 flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 rounded-xl"><Store className="w-5 h-5 text-orange-600" /></div>
                商家與周邊指南
              </h2>
              <p className="text-xs text-[#78909C] mb-6 ml-1 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> 點擊商家名稱即可開啟 Google Maps
              </p>
              
              <div className="space-y-6">
                {shopGuideData.map((areaData, idx) => (
                  <div key={idx} className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-5 shadow-sm">
                    <div className="mb-4 border-b border-slate-100 pb-3">
                      <h3 className="text-lg font-bold text-[#0288D1]">{areaData.area}</h3>
                      <p className="text-xs text-[#546E7A] mt-0.5">{areaData.desc}</p>
                    </div>
                    
                    {/* 重點商家 */}
                    <div className="mb-5">
                      <h4 className="text-xs font-bold text-[#455A64] mb-3 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-500" /> 行程重點商家
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {areaData.mainShops.map((shop, i) => (
                          <div key={i} className="flex justify-between items-center bg-yellow-50/60 p-3 rounded-xl border border-yellow-100/50 hover:bg-yellow-50 transition-colors">
                            <a 
                              href={getMapLink(`${shop.name} ${areaData.mapQuerySuffix}`)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 group flex-1"
                            >
                              <MapPin className="w-3.5 h-3.5 text-yellow-600 group-hover:scale-125 transition-transform" />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#37474F] group-hover:text-[#0288D1] transition-colors">{shop.name}</span>
                                  <span className="text-[9px] text-[#78909C] bg-white px-1.5 py-0.5 rounded-md border border-slate-100 shadow-sm">{shop.tag}</span>
                                </div>
                                <span className="text-[10px] text-[#546E7A] mt-0.5">{shop.note}</span>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 童裝與文具 */}
                    {areaData.specialShops && (
                      <div className="mb-5">
                        <h4 className="text-xs font-bold text-[#455A64] mb-3 flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-pink-500" /> 童裝與文具推薦
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {areaData.specialShops.map((shop, i) => (
                            <div key={i} className="flex justify-between items-center bg-pink-50/60 p-3 rounded-xl border border-pink-100/50 hover:bg-pink-50 transition-colors">
                              <a 
                                href={getMapLink(`${shop.name} ${areaData.mapQuerySuffix}`)}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 group flex-1"
                              >
                                <MapPin className="w-3.5 h-3.5 text-pink-600 group-hover:scale-125 transition-transform" />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#37474F] group-hover:text-[#E91E63] transition-colors">{shop.name}</span>
                                    <span className="text-[9px] text-[#78909C] bg-white px-1.5 py-0.5 rounded-md border border-slate-100 shadow-sm">{shop.tag}</span>
                                  </div>
                                  <span className="text-[10px] text-[#546E7A] mt-0.5">{shop.note}</span>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 周邊連鎖 */}
                    <div>
                      <h4 className="text-xs font-bold text-[#455A64] mb-3 flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" /> 附近常見連鎖 (1km內)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {areaData.nearbyChains.map((chain, i) => (
                          <a 
                            key={i} 
                            href={getMapLink(`${chain.name} ${areaData.mapQuerySuffix}`)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-slate-50/80 px-3 py-1.5 rounded-lg text-[#546E7A] border border-slate-200/60 flex items-center gap-1.5 hover:bg-white hover:border-[#0288D1]/30 hover:text-[#0288D1] hover:shadow-sm transition-all"
                          >
                            <span className="font-bold">{chain.name}</span>
                            <span className="text-[9px] text-[#90A4AE] border-l border-slate-200 pl-1.5">{chain.location}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. AI 導遊 (AI Tab) */}
        {activeTab === 'ai' && (
          <div className="flex-1 px-4 pb-4 space-y-4 flex flex-col h-[calc(100vh-140px)] animate-fadeIn">
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-xl flex-1 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 bg-white/60 border-b border-white/50 backdrop-blur-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#263238]">AI 東京導遊</h2>
                  <p className="text-[10px] text-[#546E7A] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    線上服務中
                    {isSpeaking && <span className="ml-2 text-orange-500 font-bold flex items-center bg-orange-50 px-2 py-0.5 rounded-full"><Volume2 className="w-3 h-3 mr-1"/> 朗讀中...</span>}
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
                    <StopCircle className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/30">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50
                      ${msg.role === 'user' ? 'bg-[#0288D1] text-white' : 'bg-white text-[#0288D1]'}`}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`max-w-[80%] group relative transition-all duration-300`}>
                      <div className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border
                        ${msg.role === 'user' 
                          ? 'bg-[#0288D1] text-white rounded-tr-none border-[#0277BD]' 
                          : 'bg-white/80 backdrop-blur-sm text-[#37474F] border-white/60 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                      
                      {/* Speak Button for AI messages */}
                      {msg.role === 'model' && (
                        <button
                          onClick={() => handleSpeak(msg.text)}
                          className="absolute -right-9 top-1 p-2 text-[#90A4AE] hover:text-[#0288D1] hover:bg-white/80 rounded-full transition-all opacity-0 group-hover:opacity-100"
                          title="朗讀訊息"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-white border border-white/50 flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-[#0288D1]" />
                    </div>
                    <div className="bg-white/60 p-3 rounded-2xl rounded-tl-none border border-white/50 shadow-sm flex items-center gap-2">
                      <Loader className="w-4 h-4 text-[#0288D1] animate-spin" />
                      <span className="text-xs text-[#78909C]">正在思考中...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions */}
              <div className="px-4 py-3 bg-white/40 border-t border-white/40 flex gap-2 overflow-x-auto scrollbar-hide backdrop-blur-sm">
                {["Day 3 的晚餐推薦?", "如何搭乘百合海鷗號?", "翻譯「請給我兒童餐具」", "輕井澤會下雪嗎?"].map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setInputMessage(q); }}
                    className="flex-shrink-0 text-xs bg-white/70 hover:bg-[#E1F5FE] text-[#546E7A] hover:text-[#0277BD] px-3.5 py-2 rounded-full border border-white/60 shadow-sm transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white/60 border-t border-white/50 backdrop-blur-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="輸入問題，例如：附近的拉麵店..."
                    className="flex-1 bg-white/80 border border-white/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0288D1] focus:ring-2 focus:ring-[#0288D1]/20 transition-all shadow-inner text-[#37474F] placeholder:text-[#90A4AE]"
                  />
                  
                  {/* Voice Input Button */}
                  <button 
                    onClick={toggleListening}
                    className={`p-2.5 rounded-xl transition-all shadow-sm border border-transparent ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md' : 'bg-white text-[#78909C] hover:text-[#0288D1] hover:bg-[#E1F5FE] border-white/60'}`}
                    title="語音輸入"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className={`p-2.5 rounded-xl transition-all shadow-md ${isLoading || !inputMessage.trim() ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-gradient-to-r from-[#0288D1] to-[#01579B] text-white hover:shadow-lg active:scale-95'}`}
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
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-6 shadow-xl min-h-[500px]">
              <h2 className="text-xl font-bold text-[#2C3E50] mb-5 flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 rounded-xl"><LinkIcon className="w-5 h-5 text-blue-600" /></div>
                實用連結百寶箱
              </h2>
              
              <div className="space-y-6">
                {usefulLinks.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="text-sm font-bold text-[#0277BD] mb-3 bg-blue-50/50 px-3 py-1.5 rounded-lg w-fit border border-blue-100/50">
                      {section.category}
                    </h3>
                    <div className="space-y-3">
                      {section.items.map((item, i) => (
                        <a 
                          key={i} 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 p-4 bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-[#37474F] flex items-center gap-1 group-hover:text-[#0288D1] transition-colors">
                              {item.title}
                              <ExternalLink className="w-3 h-3 text-[#90A4AE]" />
                            </div>
                            <p className="text-xs text-[#546E7A] mt-0.5">{item.desc}</p>
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
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-full shadow-2xl p-1.5 flex justify-between items-center">
            <button onClick={() => setActiveTab('itinerary')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'itinerary' ? 'bg-[#0288D1] text-white shadow-lg scale-105' : 'text-[#78909C] hover:bg-white/50'}`}>
              <Home className="w-5 h-5 mb-0.5" /><span className="text-[9px] font-bold">行程</span>
            </button>
            <button onClick={() => setActiveTab('guides')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'guides' ? 'bg-[#0288D1] text-white shadow-lg scale-105' : 'text-[#78909C] hover:bg-white/50'}`}>
              <BookOpen className="w-5 h-5 mb-0.5" /><span className="text-[9px] font-bold">指南</span>
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center justify-center w-16 h-16 -mt-6 rounded-full transition-all duration-300 border-4 border-[#E3F2FD] ${activeTab === 'ai' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-xl scale-110' : 'bg-white text-[#78909C] shadow-md hover:scale-105'}`}>
              <MessageSquare className="w-7 h-7" />
            </button>
            <button onClick={() => setActiveTab('shops')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'shops' ? 'bg-[#0288D1] text-white shadow-lg scale-105' : 'text-[#78909C] hover:bg-white/50'}`}>
              <Store className="w-5 h-5 mb-0.5" /><span className="text-[9px] font-bold">商家</span>
            </button>
            <button onClick={() => setActiveTab('resources')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${activeTab === 'resources' ? 'bg-[#0288D1] text-white shadow-lg scale-105' : 'text-[#78909C] hover:bg-white/50'}`}>
              <LinkIcon className="w-5 h-5 mb-0.5" /><span className="text-[9px] font-bold">連結</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[60] flex items-center gap-2 animate-bounce backdrop-blur-md border border-white/20
            ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-600/90 text-white'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default ItineraryApp;