// 這個檔案僅包含行程與相關資料 (data only)
// 不包含視圖或邏輯，方便被其他元件匯入使用。
import React from "react";
import {
  Train,
  MapPin,
  Utensils,
  Hotel,
  Snowflake,
  ShoppingBag,
  Star,
  Camera,
  QrCode,
  Shield,
  AlertCircle,
  CloudSnow,
  Sun,
  Briefcase,
  Map,
  Coffee,
} from "lucide-react";

// 匯出總覽：
// - `guidesData`    : 行前指南與購票流程
// - `usefulLinks`   : 分類的參考連結
// - `shopGuideData` : 各區域商店建議
// - `itineraryData` : 每日行程資料

// === 1. 指南資料 (Guides) ===
export const guidesData = [
  {
    title: "AREX 機場快線購票與搭乘",
    icon: <Train className="w-5 h-5" />,
    summary: "往返仁川機場與首爾站最快的交通方式。",
    steps: [
      "建議透過 Klook/KKday 預先購買直達車票 (Express Train)。",
      "抵達仁川機場後，至 B1 交通中心。",
      "在橘色售票機掃描憑證 QR Code，劃位並領取實體卡 (需付押金 500 韓元)。",
      "刷卡進站，車程約 43-51 分鐘直達首爾站。",
      "出站後可在『退卡機』退回 500 韓元押金。",
    ],
    link: { text: "AREX 官方網站", url: "https://www.arex.or.kr/main.do" },
    blogs: [
      {
        title: "Creatrip｜仁川機場快線 AREX 直達車搭乘攻略",
        url: "https://www.creatrip.com/blog/2168",
      },
      {
        title: "KLOOK｜首爾機場快線 AREX 時刻表與購票",
        url: "https://www.klook.com/zh-TW/blog/arex-incheon-airport-express-train-seoul/",
      },
    ],
  },
  {
    title: "Naver Map 設定與使用",
    icon: <Map className="w-5 h-5" />,
    summary: "韓國必備地圖！Google Maps 在韓國無法導航。",
    steps: [
      "下載 Naver Map App (記得註冊帳號以儲存地點)。",
      "設定語言：Settings -> Language -> 中文。",
      "善用『收藏夾』功能，出發前先把景點存進去。",
      "導航時請選擇『大眾交通』或『步行』。",
      "小技巧：韓文地址定位最準確，找不到時請複製韓文地址搜尋。",
    ],
    link: { text: "Naver Map 網頁版", url: "https://map.naver.com/" },
    blogs: [
      {
        title: "PopDaily｜韓國旅遊必備 Naver Map 中文版教學",
        url: "https://www.popdaily.com.tw/forum/korea/1360000",
      },
    ],
  },
  {
    title: "WOWPASS 辦卡與儲值",
    icon: <QrCode className="w-5 h-5" />,
    summary: "結合換匯、付款、T-Money 交通卡的神奇卡片。",
    steps: [
      "在台灣先下載 WOWPASS App。",
      "抵達韓國機場或飯店附近的機台 (Kiosk)。",
      "選擇『發行新卡』，掃描護照，存入外幣現金 (台幣/美金皆可)。",
      "取出卡片後，記得插入機台並在 App 登錄卡片以開通餘額。",
      "⚠️ 注意：交通卡餘額 (T-Money) 需另外在便利商店或地鐵站用韓元現金儲值。",
    ],
    link: {
      text: "WOWPASS 據點查詢",
      url: "https://www.wowpass.io/?lang=zh_TW",
    },
    blogs: [
      {
        title: "Creatrip｜韓國旅遊神卡 WOWPASS 介紹",
        url: "https://www.creatrip.com/blog/12803",
      },
    ],
  },
  {
    title: "Q-CODE 入境檢疫資訊",
    icon: <Shield className="w-5 h-5" />,
    summary: "若韓國政府有要求，需提前填寫健康申報。",
    steps: [
      "出發前 3 天內至 Q-CODE 網站填寫。",
      "填寫護照資料、航班資訊、健康狀況。",
      "生成 QR Code 並截圖保存。",
      "※ 目前韓國已取消強制申報，但建議出發前再次確認最新規定。",
    ],
    link: {
      text: "Q-CODE 官方網站",
      url: "https://cov19ent.kdca.go.kr/cpassportal/",
    },
    blogs: [
      {
        title: "KLOOK｜韓國入境最新規定懶人包",
        url: "https://www.klook.com/zh-TW/blog/korea-entry-regulation/",
      },
    ],
  },
];

// 2. 連結資料
export const usefulLinks = [
  {
    category: "交通與地圖",
    items: [
      {
        title: "Naver Map",
        desc: "韓國旅遊必備地圖 App",
        url: "https://map.naver.com/",
        icon: <Map className="w-5 h-5" />,
      },
      {
        title: "Subway Korea",
        desc: "首爾地鐵中文路線圖",
        url: "https://www.smrt.co.kr/main/index/index002.jsp",
        icon: <Train className="w-5 h-5" />,
      },
      {
        title: "AREX 訂票",
        desc: "機場快線官網",
        url: "https://www.arex.or.kr/",
        icon: <Train className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "天氣與匯率",
    items: [
      {
        title: "首爾天氣 (AccuWeather)",
        desc: "查詢穿搭指數",
        url: "https://www.accuweather.com/zh-tw/kr/seoul/226081/weather-forecast/226081",
        icon: <Sun className="w-5 h-5" />,
      },
      {
        title: "Creatrip 匯率",
        desc: "明洞大使館/一品香即時匯率",
        url: "https://www.creatrip.com/exchange",
        icon: <Briefcase className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "景點預約",
    items: [
      {
        title: "樂天世界",
        desc: "首爾最大室內遊樂園",
        url: "https://adventure.lotteworld.com/zht/main/index.do",
        icon: <Star className="w-5 h-5" />,
      },
      {
        title: "景福宮韓服預約",
        desc: "Creatrip 預約平台",
        url: "https://www.creatrip.com/spot/1234",
        icon: <Camera className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "購物與退稅",
    items: [
      {
        title: "Olive Young",
        desc: "韓國必買藥妝店",
        url: "https://global.oliveyoung.com/",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        title: "樂天免稅店",
        desc: "線上預購機場提貨",
        url: "https://chn.lottedfs.com/kr",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        title: "退稅計算機",
        desc: "韓國退稅級距表",
        url: "https://www.konest.com/contents/basic_info_detail.html?id=809",
        icon: <Briefcase className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "緊急與翻譯",
    items: [
      {
        title: "Papago 翻譯",
        desc: "比 Google 更準的韓文翻譯",
        url: "https://papago.naver.com/",
        icon: <QrCode className="w-5 h-5" />,
      },
      {
        title: "駐韓國台北代表部",
        desc: "緊急聯絡資訊",
        url: "https://www.roc-taiwan.org/kr/index.html",
        icon: <Shield className="w-5 h-5" />,
      },
    ],
  },
];

// 3. 商店資料
export const shopGuideData = [
  {
    area: "明洞 (Myeongdong)",
    desc: "美妝與街頭小吃天堂",
    mapQuerySuffix: "首爾 明洞",
    mainShops: [
      {
        name: "Olive Young 明洞旗艦店",
        tag: "藥妝",
        note: "貨最全，常常大排長龍",
      },
      { name: "HBAF 杏仁果專賣店", tag: "伴手禮", note: "試吃給很大方" },
      { name: "DAISO 大創", tag: "雜貨", note: "8層樓高，一定要逛" },
    ],
    specialShops: [
      { name: "New Balance", tag: "鞋飾", note: "款式比台灣多" },
      { name: "ABC-Mart", tag: "童鞋", note: "常有韓國限定款" },
      { name: "明洞餃子", tag: "美食", note: "米其林推薦" },
    ],
    nearbyChains: [
      { name: "Isaac Toast", location: "明洞站出口" },
      { name: "Starbucks", location: "明洞內多家" },
      { name: "MEGA COFFEE", location: "平價咖啡首選" },
    ],
  },
  {
    area: "弘大 (Hongdae)",
    desc: "年輕潮流與文創",
    mapQuerySuffix: "首爾 弘大",
    mainShops: [
      { name: "Kakao Friends", tag: "IP周邊", note: "萊恩迷必去，3F有咖啡廳" },
      { name: "Shoopen", tag: "鞋包", note: "平價快時尚" },
      { name: "Object", tag: "文創", note: "文具控天堂，需走一點路" },
      { name: "Butter", tag: "雜貨", note: "可愛居家小物" },
    ],
    specialShops: [
      { name: "M Playground", tag: "男裝/女裝", note: "超便宜基本款" },
      { name: "AK Plaza", tag: "百貨", note: "樓上有動漫周邊" },
      { name: "No Brand Burger", tag: "美食", note: "平價漢堡" },
    ],
    nearbyChains: [
      { name: "Olive Young", location: "弘大入口站" },
      { name: "貢茶", location: "弘大商圈" },
      { name: "雪冰", location: "必吃哈密瓜冰" },
    ],
  },
  {
    area: "汝矣島 (The Hyundai)",
    desc: "首爾最新百貨地標",
    mapQuerySuffix: "The Hyundai Seoul",
    mainShops: [
      { name: "The Hyundai Seoul", tag: "百貨", note: "B2 潮牌區必逛" },
      { name: "Nice Weather", tag: "選物", note: "便利商店概念店" },
      { name: "Tamburins", tag: "香氛", note: "Jennie 代言，護手霜" },
    ],
    specialShops: [
      { name: "LEGO Store", tag: "玩具", note: "5F 還有室內花園" },
      { name: "Blue Bottle", tag: "咖啡", note: "5F 需排隊" },
      { name: "Super Matcha", tag: "飲品", note: "B1 抹茶名店" },
    ],
    nearbyChains: [
      { name: "IFC Mall", location: "地下連通" },
      { name: "Eggslut", location: "B1 美食街" },
    ],
  },
  {
    area: "聖水洞 (Seongsu)",
    desc: "韓國布魯克林，網紅咖啡廳",
    mapQuerySuffix: "首爾 聖水洞",
    mainShops: [
      { name: "Dior 聖水", tag: "景點", note: "外觀超美，拍照聖地" },
      { name: "Tamburins 聖水", tag: "香氛", note: "水泥廢墟風" },
      { name: "LCDC", tag: "複合空間", note: "文青小店聚集" },
    ],
    specialShops: [
      { name: "Nudake", tag: "甜點", note: "藝術品般的蛋糕" },
      { name: "Point of View", tag: "文具", note: "質感文具店" },
      { name: "Mardi Mercredi", tag: "服飾", note: "小雛菊T恤" },
    ],
    nearbyChains: [
      { name: "Blue Bottle", location: "聖水店" },
      { name: "Onion", location: "廢墟咖啡廳" },
    ],
  },
];

// 4. 行程核心資料
export const itineraryData = [
  {
    day: "Day 1",
    locationKey: "seoul_central",
    date: "4/2 (四)",
    title: "抵達首爾：明洞美食夜",
    stay: "L7 Myeongdong (明洞)",
    routeInfo: {
      summary: "仁川機場 → AREX 機場快線 → 首爾站 → 明洞 → 飯店",
      mapUrl:
        "https://www.google.com/maps/dir/?api=1&origin=Narita+Airport&destination=Karuizawa+Prince+Hotel+West&waypoints=Keisei+Ueno+Station|Karuizawa+Station",
    },
    events: [
      {
        time: "15:00",
        title: "抵達仁川機場 (ICN)",
        mapQuery: "仁川國際機場",
        icon: <MapPin />,
        desc: "入境審查 (準備 Q-CODE 或黃色紙本)。領取行李後，至入境大廳兌換韓幣 (少量) 或直接使用 WOWPASS 機台。",
        tips: [
          "入境後請先連上機場 WiFi 報平安。",
          "尋找便利商店 (CU/GS25) 購買或儲值 T-Money 卡。",
        ],
      },
      {
        time: "16:30",
        title: "交通：機場 → 首爾站",
        mapQuery: "AREX 機場快線",
        icon: <Train />,
        desc: "搭乘 AREX 直達車 (Express) 前往首爾站。車上舒適，有指定座位。",
        transport: {
          mode: "AREX 機場快線",
          duration: "約 45 分鐘",
          route: "仁川機場 T1/T2 → 首爾站",
          note: "憑 QR Code 換票進站，記得拿回 500 韓元押金的卡片。",
        },
      },
      {
        time: "17:40",
        title: "移動：首爾站 → 明洞",
        mapQuery: "明洞站",
        icon: <Train />,
        desc: "轉乘地鐵 4 號線 (藍色)，僅需 2 站。",
        transport: {
          mode: "地鐵 4 號線",
          duration: "約 10 分鐘",
          route: "首爾站 (426) → 明洞站 (424)",
          note: "明洞站部分出口僅有樓梯，若有大行李請找有手扶梯的出口 (如 3 號或 7 號)。",
        },
      },
      {
        time: "18:30",
        title: "入住 & 晚餐：明洞夜市",
        mapQuery: "明洞商圈",
        icon: <Utensils />,
        desc: "飯店 Check-in 後，下樓就是熱鬧的明洞夜市。",
        highlights: [
          "必吃小吃：雞蛋糕、糖餅 (Hotteok)、烤龍蝦、旋風馬鈴薯。",
          "晚餐推薦：明洞餃子 (刀切麵+蒸餃) 或 神仙雪濃湯。",
          "飲料：MEGA COFFEE 超大杯美式/拿鐵。",
        ],
        tips: [
          "夜市攤販通常只收現金，請準備千元鈔票。",
          "吃完的垃圾請交還給攤販，韓國街頭很難找垃圾桶。",
        ],
      },
    ],
    notice: {
      type: "info",
      text: "提醒：韓國插座為圓孔 (220V)，請確認轉接頭已放在隨身包包。",
    },
  },
  {
    day: "Day 2",
    locationKey: "seoul_north",
    date: "4/3 (五)",
    title: "古宮巡禮：穿韓服當公主",
    stay: "L7 Myeongdong (明洞)",
    routeInfo: {
      summary: "飯店 → 景福宮 (韓服) → 北村韓屋村 → 三清洞 → 仁寺洞",
      mapUrl:
        "https://www.google.com/maps/dir/?api=1&origin=Karuizawa+Prince+Hotel+West&destination=Karuizawa+Prince+Hotel+West&waypoints=Karuizawa+Prince+Hotel+Ski+Resort|Karuizawa+Prince+Shopping+Plaza",
    },
    events: [
      {
        time: "09:30",
        title: "韓服體驗 & 景福宮",
        mapQuery: "景福宮",
        icon: <Camera />,
        desc: "換上美美的韓服，進入景福宮 (穿韓服免門票！)。",
        highlights: [
          "10:00 光化門守門將換崗儀式 (必看！)。",
          "勤政殿：古代皇帝上朝的地方。",
          "慶會樓：湖邊倒影超美。",
        ],
        tips: [
          "韓服店建議預約『西花韓服』或『In Korea』，就在景福宮旁。",
          "建議穿著舒適好走的鞋子，因為宮殿很大，全是沙地。",
        ],
      },
      {
        time: "12:30",
        title: "午餐：土俗村蔘雞湯",
        mapQuery: "土俗村蔘雞湯",
        icon: <Utensils />,
        desc: "首爾最著名的蔘雞湯，補充體力。",
        highlights: [
          "人蔘雞湯：整隻雞燉煮，肉質軟嫩。",
          "海鮮蔥餅：料多實在。",
          "桌上的泡菜和蘿蔔可以無限續加。",
        ],
        tips: ["人氣名店，建議避開正午 12:00，提早或延後一點到。"],
      },
      {
        time: "14:30",
        title: "北村韓屋村 & 三清洞",
        mapQuery: "北村韓屋村",
        icon: <MapPin />,
        desc: "漫步在傳統韓屋聚落，接著到三清洞喝咖啡。",
        highlights: [
          "北村八景：尋找最佳拍照點。",
          "三清洞摩西：好吃的年糕鍋。",
          "Osulloc Tea House：抹茶控必去。",
        ],
        tips: [
          "北村仍有居民居住，參觀時請「保持安靜」。",
          "地形有上下坡，推嬰兒車會比較辛苦。",
        ],
      },
      {
        time: "17:30",
        title: "仁寺洞 & 人人廣場",
        mapQuery: "仁寺洞",
        icon: <ShoppingBag />,
        desc: "充滿傳統藝文氣息的街道，招牌都是韓文寫的 (連星巴克也是)。",
        highlights: [
          "人人廣場 (Ssamzigil)：螺旋狀建築，有很多文創小店。",
          "購買紀念品：筷子湯匙組、傳統扇子。",
          "晚餐推薦：仁寺洞內的韓定食餐廳。",
        ],
        tips: ["這裡有很多傳統茶屋，累了可以進去喝杯五味子茶。"],
      },
    ],
  },
  {
    day: "Day 3",
    locationKey: "seoul_south",
    date: "4/4 (六)",
    title: "樂天世界：夢幻童話一日遊",
    stay: "L7 Myeongdong (明洞)",
    routeInfo: {
      summary: "明洞 → 蠶室 (樂天世界) → 樂天塔 → 石村湖賞櫻 → 明洞",
      mapUrl:
        "https://www.google.com/maps/dir/?api=1&origin=Karuizawa+Prince+Hotel+West&destination=Ameyoko+Shopping+District&waypoints=Karuizawa+Station|Ueno+Station|Yamashiroya|PARCO_ya+Ueno",
    },
    events: [
      {
        time: "09:30",
        title: "交通：明洞 → 蠶室",
        mapQuery: "蠶室站",
        icon: <Train />,
        desc: "搭乘地鐵前往江南蠶室區。",
        transport: {
          mode: "地鐵 4號線 轉 2號線",
          duration: "約 40 分鐘",
          route: "明洞 → 東大門歷史文化公園 (轉 2號線) → 蠶室站",
          note: "蠶室站直結樂天世界與樂天塔。",
        },
      },
      {
        time: "10:30",
        title: "樂天世界 (Lotte World)",
        mapQuery: "樂天世界",
        icon: <Star />,
        desc: "世界上最大的室內遊樂園 (也有室外區)。",
        highlights: [
          "室內區 (Adventure)：旋轉木馬 (韓劇拍攝點)、西班牙海盜船、熱氣球飛行。",
          "室外區 (Magic Island)：城堡拍照超美 (適合櫻花季)，亞特蘭提斯過山車。",
          "租借校服：可以在園區內租借韓國高中制服體驗。",
        ],
        tips: [
          "下載 Lotte World Magicpass App 預約快速通關。",
          "週末人多，建議一開門就進去。",
        ],
      },
      {
        time: "16:00",
        title: "石村湖賞櫻 & 樂天塔",
        mapQuery: "石村湖",
        icon: <Camera />,
        desc: "樂天世界旁邊的湖泊，是首爾最美的賞櫻勝地之一。",
        highlights: [
          "環湖步道：滿滿的櫻花隧道。",
          "SEOUL SKY 觀景台：登上世界第五高樓 (樂天塔 123F) 俯瞰首爾。",
          "樂天水族館：位於樂天世界塔地下，適合親子。",
        ],
        tips: ["若不上觀景台，在湖邊拍樂天塔背景也很壯觀。"],
      },
      {
        time: "18:30",
        title: "晚餐：樂天購物中心",
        mapQuery: "Lotte World Mall",
        icon: <Utensils />,
        desc: "在 Mall 裡覓食，選擇多樣。",
        highlights: [
          "Bills：澳洲知名早午餐 (鬆餅好吃)。",
          "Bruxelles Waffle：比利時鬆餅。",
          "美食街：韓式拌飯、冷麵。",
        ],
        tips: ["購物中心很大，小心迷路。"],
      },
    ],
  },
  {
    day: "Day 4",
    locationKey: "hongdae",
    date: "4/5 (日)",
    title: "弘大青春潮流 & 延南洞",
    stay: "L7 Myeongdong (明洞)",
    routeInfo: {
      summary: "明洞 → 弘大入口 → 延南洞 → 弘大商圈 → 漢江公園",
      mapUrl:
        "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=&HERE+TOKYO+UENO&waypoints=Azabudai+Hills|teamLab+Borderless|Roppongi+Hills|Roppongi+Keyakizaka+Dori",
    },
    events: [
      {
        time: "10:30",
        title: "移動：明洞 → 弘大",
        mapQuery: "弘大入口站",
        icon: <Train />,
        desc: "前往年輕人的聖地。",
        transport: {
          mode: "地鐵 2號線",
          duration: "約 25 分鐘",
          route: "乙支路入口站 (明洞旁) → 弘大入口站",
          note: "從明洞走路到乙支路入口站搭 2 號線不用轉車，比較快。",
        },
      },
      {
        time: "11:00",
        title: "延南洞 (Yeonnam-dong)",
        mapQuery: "延南洞",
        icon: <Coffee />,
        desc: "弘大站 3 號出口出來的林蔭道，充滿特色咖啡廳。",
        highlights: [
          "京義線林蔭道：廢棄鐵道改建的公園，適合野餐。",
          "Cafe Layered：英式司康名店，裝潢很美。",
          "拍貼機 (Photoism/Don't Look Up)：韓國必做清單。",
        ],
        tips: [
          "這裡很多文青小店，適合慢慢逛。",
          "午餐可以在這裡找一家義大利麵或早午餐吃。",
        ],
      },
      {
        time: "14:00",
        title: "弘大商圈逛街",
        mapQuery: "弘大購物街",
        icon: <ShoppingBag />,
        desc: "買衣服、鞋子、飾品的主戰場。",
        highlights: [
          "M Playground：平價服飾，補貨好地方。",
          "SHOOPEN：平價鞋包。",
          "Kakao Friends 旗艦店：必逛！",
        ],
        tips: [
          "弘大假日會有街頭藝人表演 (Busking)，氣氛很嗨。",
          "想看亂打秀 (Nanta) 也可以在弘大看。",
        ],
      },
      {
        time: "17:30",
        title: "漢江公園 (汝矣島或望遠)",
        mapQuery: "汝矣島漢江公園",
        icon: <CloudSnow />,
        desc: "體驗韓國人的漢江文化：吃泡麵、炸雞。",
        highlights: [
          "便利商店煮泡麵機：自己煮的泡麵特別好吃。",
          "叫外送炸雞：橋村炸雞或 BHC。",
          "I SEOUL U 地標打卡。",
        ],
        tips: [
          "漢江邊風大，記得帶外套。",
          "若時間允許，可搭乘漢江遊覽船餵海鷗。",
        ],
      },
    ],
    notice: {
      type: "alert",
      text: "假日弘大人潮非常多，請隨時注意隨身物品與孩童安全。",
    },
  },
  {
    day: "Day 5",
    locationKey: "seoul_modern",
    date: "4/6 (一)",
    title: "現代百貨與聖水洞",
    stay: "L7 Myeongdong (明洞)",
    routeInfo: {
      summary: "明洞 → 聖水洞 → The Hyundai Seoul → 飯店",
      mapUrl:
        "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=&HERE+TOKYO+UENO&waypoints=DiverCity+Tokyo+Plaza|Urban+Dock+LaLaport+Toyosu",
    },
    events: [
      {
        time: "10:00",
        title: "聖水洞 (Seongsu-dong)",
        mapQuery: "聖水洞",
        icon: <Camera />,
        desc: "由工廠改建的時尚區域，被稱為韓國的布魯克林。",
        highlights: [
          "Dior 聖水概念店：絕美外觀，沒預約進不去但在門口拍照也值得。",
          "Nudake：Gentle Monster 旗下的藝術甜點店。",
          "LCDC：複合式文化空間，有很多文創品牌。",
        ],
        tips: [
          "從明洞搭地鐵 2 號線到聖水站約 20 分鐘。",
          "聖水洞範圍較大，建議鎖定幾個點移動。",
        ],
      },
      {
        time: "13:30",
        title: "The Hyundai Seoul",
        mapQuery: "The Hyundai Seoul",
        icon: <ShoppingBag />,
        desc: "首爾最大、最漂亮的百貨公司 (汝矣島)。",
        highlights: [
          "5F Sounds Forest：室內巨大的空中花園，拍照超美。",
          "B2 Creative Ground：集結韓國最新潮牌 (Thisisneverthat, Matin Kim)。",
          "B1 美食街：全首爾好吃的都在這。",
        ],
        tips: [
          "外國人可至 6F 服務台辦理退稅或領取會員卡。",
          "B1 的 CAMEL COFFEE 通常要排很久。",
        ],
      },
      {
        time: "18:00",
        title: "最後晚餐：烤五花肉",
        mapQuery: "荒謬的生肉 明洞",
        icon: <Utensils />,
        desc: "來韓國怎麼能不吃韓式烤肉！",
        highlights: [
          "荒謬的生肉 (Ungteori)：高CP值烤五花肉吃到飽。",
          "王妃家：專人代烤，肉質較好 (價格較高)。",
          "肉典食堂：厚切五花肉超有名。",
        ],
        tips: [
          "吃完烤肉全身會有味道，建議最後一晚再吃。",
          "記得用生菜包肉+蒜頭+辣醬一口塞！",
        ],
      },
    ],
  },
  {
    day: "Day 6",
    locationKey: "seoul_central",
    date: "4/7 (二)",
    title: "最後採買與返家",
    stay: "溫暖的家",
    routeInfo: {
      summary: "樂天超市 (首爾站) → AREX → 仁川機場",
      mapUrl:
        "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=Narita+Airport+Terminal+2&waypoints=Takeya+1|Keisei+Ueno+Station",
    },
    events: [
      {
        time: "09:30",
        title: "樂天超市 (首爾站)",
        mapQuery: "樂天超市 首爾站",
        icon: <ShoppingBag />,
        desc: "位於首爾站旁，最後掃貨的最佳地點。",
        highlights: [
          "必買零食：HBAF 杏仁果、零食包、好麗友烏龜餅。",
          "泡麵：辛拉麵 (黑版)、金拉麵、浣熊麵。",
          "海苔、麻油：韓國家庭必備。",
        ],
        tips: [
          "超市提供紙箱打包服務 (需自費買膠帶或繩子)。",
          "購物滿 3 萬韓元可直接在櫃台辦理即時退稅 (記得帶護照)。",
          "買完直接搭 AREX 去機場超順路。",
        ],
      },
      {
        time: "12:00",
        title: "交通：首爾站 → 仁川機場",
        mapQuery: "仁川機場",
        icon: <Train />,
        desc: "搭乘 AREX 直達車前往機場。",
        transport: {
          mode: "AREX 機場快線",
          duration: "約 45 分鐘",
          route: "首爾站 → 仁川機場 T1/T2",
          note: "若搭乘大韓/韓亞航空，可在首爾站辦理預辦登機與行李託運 (需提早 3 小時)。",
        },
      },
      {
        time: "13:30",
        title: "機場退稅與免稅店",
        mapQuery: "仁川機場 免稅店",
        icon: <Star />,
        desc: "辦理海關退稅、逛免稅店。",
        highlights: [
          "退稅：若市區未退稅，記得去 Kiosk 掃描護照與單據。",
          "Gentle Monster：機場店款式多。",
          "Paris Baguette：購買機場限定的「仁川安寧三明治」(很搶手)。",
        ],
        tips: ["登機口通常較遠，請預留接駁電車 (Shuttle Train) 的時間。"],
      },
      {
        time: "16:20",
        title: "班機：長榮 BR159",
        mapQuery: "仁川機場",
        icon: <Train />,
        desc: "滿載而歸！",
        transport: {
          mode: "飛機",
          duration: "約 2.5 小時",
          route: "仁川 (ICN) → 台北桃園 (TPE)",
          note: "機上回味這幾天的照片。",
        },
      },
    ],
  },
];

// 5. 專案全域設定
export const tripConfig = {
  // 基本資訊
  title: "首爾賞櫻親子遊",
  subTitle: "2026/4/2 - 4/7",
  startDate: "2026-04-02T00:00:00",
  endDate: "2026-04-07T23:59:59",

  // 航班資訊 (去程/回程)
  flights: {
    outbound: {
      code: "長榮 BR160",
      time: "15:15 TPE ➝ 18:45 ICN",
    },
    inbound: {
      code: "長榮 BR159",
      time: "19:45 ICN ➝ 21:20 TPE",
    },
  },

  // 住宿資訊 (可放多個)
  hotels: [
    {
      name: "L7 Myeongdong",
      phone: "+82-2-6310-1000",
      address: "137 Toegye-ro, Jung-gu, Seoul",
      note: "明洞站 9 號出口旁，樓下有換錢所",
    },
  ],

  // 緊急聯絡
  emergency: {
    police: "112",
    ambulance: "119",
    contact: "駐韓代表部：+82-10-9080-2761",
  },

  // 導遊模式問題 (針對行程)
  aiQuestions: [
    "明洞有什麼好吃的?",
    "怎麼從機場去首爾站?",
    "樂天世界要玩多久?",
    "這附近的退稅櫃台在哪?",
  ],

  // 翻譯模式預設問題 (韓文)
  translationQuestions: [
    "翻譯「請給我菜單」",
    "翻譯「這個多少錢?」",
    "翻譯「可以算便宜一點嗎?」",
    "翻譯「廁所在哪裡?」",
  ],

  // 地點定義
  locations: [
    { key: "seoul_central", name: "首爾中區(明洞)", lat: 37.56, lon: 126.98 },
    { key: "seoul_north", name: "首爾鐘路(景福宮)", lat: 37.58, lon: 126.97 },
    { key: "seoul_south", name: "首爾江南(蠶室)", lat: 37.51, lon: 127.1 },
    { key: "hongdae", name: "弘大/延南洞", lat: 37.55, lon: 126.92 },
    { key: "seoul_modern", name: "聖水/汝矣島", lat: 37.54, lon: 127.05 },
  ],
  // 旅程亮點
  tripHighlights: [
    "景福宮韓服",
    "樂天世界",
    "首爾塔夜景",
    "弘大商圈",
    "漢江公園泡麵",
    "The Hyundai",
    "北村韓屋村",
    "石村湖櫻花",
  ],

  // 個性化視覺主題
  theme: {
    // 氣氛色系：使用玫瑰粉色系呼應櫻花
    colorBase: "stone",
    colorAccent: "rose", // 強調色改為 Rose

    // 文字顏色
    textColors: {
      light: "text-stone-800",
      dark: "text-stone-100",
      secLight: "text-stone-500",
      secDark: "text-stone-400",
    },

    // 背景紋理
    bgTexture: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,

    // 背景漸層
    bgGradientLight: "bg-[#FFF0F5] from-rose-50/50 via-white to-transparent",
    bgGradientDark:
      "bg-[#1C1917] from-rose-900/20 via-stone-900/50 to-transparent",

    // 裝飾光暈球顏色
    blobs: {
      light: ["bg-rose-200/40", "bg-pink-200/40", "bg-orange-100/40"],
      dark: ["bg-rose-900/20", "bg-pink-900/20", "bg-stone-800/30"],
    },
  },

  // 語言設定 (關鍵修改：韓文)
  language: {
    code: "ko-KR", // 韓文語音代碼
    label: "韓", // 按鈕顯示文字
    name: "韓文", // AI 提示詞用的語言名稱
  },
};

// 行前檢查清單
export const checklistData = [
  { id: 1, text: "護照 (效期6個月以上)", checked: false },
  { id: 2, text: "Q-CODE (視情況) / K-ETA (目前免簽)", checked: false },
  { id: 3, text: "AREX 機場快線車票 (QR Code)", checked: false },
  { id: 4, text: "網卡 / eSIM (建議選吃到飽)", checked: false },
  { id: 5, text: "韓幣現金 (機場少量，其餘用 WOWPASS)", checked: false },
  { id: 6, text: "WOWPASS 卡 (或準備辦卡)", checked: false },
  { id: 7, text: "轉接頭 (韓國是兩腳圓型，豬鼻子)", checked: false },
  { id: 8, text: "牙刷牙膏 (韓國飯店通常不提供)", checked: false },
  { id: 9, text: "下載 App: Naver Map, Papago, Subway Korea", checked: false },
  { id: 10, text: "行動電源 (拍照導航很耗電)", checked: false },
  { id: 11, text: "好走的鞋子 (首爾很多坡道)", checked: false },
  { id: 12, text: "環保購物袋 (超市不提供塑膠袋)", checked: false },
  { id: 13, text: "常備藥物 (腸胃藥、止痛藥)", checked: false },
  { id: 14, text: "旅遊保險單", checked: false },
];
