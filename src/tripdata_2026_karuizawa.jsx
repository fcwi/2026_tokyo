/**
 * ============================================================================
 * 行程資料檔案 (Trip Data Only)
 * ============================================================================
 * 
 * 本檔案僅包含行程與相關資料，不含視圖或邏輯。
 * 所有資料都是靜態結構，供其他元件匯入使用。
 * 
 * 【匯出項目】
 * - `guidesData`      : 行前指南與購票流程
 * - `usefulLinks`     : 分類的參考連結 (交通、天氣、購物、緊急...)
 * - `shopGuideData`   : 各區域商店與購物建議
 * - `itineraryData`   : 每日行程與事件列表
 * - `tripConfig`      : 全域設定 (標題、日期、飯店、主題等)
 * - `checklistData`   : 行前檢查清單 (可用於 todo / checkbox UI)
 * 
 * 【修改指南】
 * 若要改為其他行程，請依序調整以下內容：
 * 1. 修改 tripConfig 中的基本資訊 (標題、日期、飯店名稱、地點等)
 * 2. 更新 itineraryData 中的每日行程 (日期、地點、事件時間、交通)
 * 3. 替換 shopGuideData 中的景點與商店資訊
 * 4. 新增/刪除 usefulLinks 中的相關連結
 * 5. 根據新行程調整 guidesData 中的實用指南
 * 6. 更新 checklistData 中的行前檢查項目
 * 
 * ============================================================================
 */

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
} from "lucide-react";

// ============================================================================
// 1. 指南資料 (Guides)
// ============================================================================
// 
// 旅行前的實用指南與購票/入場流程說明，僅為參考。
// 
// 【資料結構】
// {
//   title         : 指南標題
//   icon          : Lucide React 圖示
//   summary       : 簡短說明
//   steps         : 步驟陣列 (循序說明)
//   link          : { text: "連結文字", url: "網址" }
//   blogs         : 相關部落格連結陣列
// }
// 
// 【如何修改】
// - 修改日期相關指南時，檢查取票期限 (通常提前 1 個月)
// - 若更換景點，請更新 summary / steps 與官方連結
// - blogs 陣列可根據搜尋結果新增/刪除相關文章連結
//
export const guidesData = [
  {
    title: "Skyliner 臉部辨識購票 (Face Check-in Go)",
    icon: <Train className="w-5 h-5" />, // 圖示會繼承父容器的文字顏色
    summary: "不用排隊領票，直接『刷臉』進站的最新功能！",
    steps: [
      "進入 Skyliner e-ticket 官網購票 (選擇單程/來回)。",
      "付款完成後，系統會引導拍攝/上傳臉部照片。",
      "抵達機場車站後，直接走『Face Check-in Go』專用閘門。",
      "看鏡頭刷臉，閘門會吐出紙本車票 (記得拿！)，直接進站。",
      "出站時走人工通道，將紙本車票交給站務員即可。",
    ],
    link: {
      text: "官網購票與詳情",
      url: "https://www.keisei.co.jp/keisei/tetudou/skyliner/e-ticket/zht/",
    },
    blogs: [
      {
        title: "妮可魯｜Skyliner「刷臉」秒過閘口超方便教學",
        url: "https://nicolelee.tw/skyliner/",
      },
      {
        title: "OREO時光旅行｜2025 Skyliner 人臉識別進站攻略",
        url: "https://oreo.blog/skyliner2025/",
      },
      {
        title: "樂吃購！日本｜Skyliner 搭乘攻略與刷臉教學",
        url: "https://tokyo.letsgojp.com/archives/738491/",
      },
    ],
  },
  {
    title: "teamLab Borderless 購票與入場",
    icon: <Camera className="w-5 h-5" />,
    summary: "麻布台之丘熱門景點，務必提前預約。",
    steps: [
      "建議提前 1-2 個月上官網預訂，選擇日期與入場時段。",
      "購票後會收到 QR Code (電子票)。",
      "當天依預約時段抵達，在入口掃描 QR Code 入場。",
      "場內禁止飲食、自拍棒、大型行李 (有置物櫃)。",
      "部分展區地板為鏡面，建議穿著褲裝。",
    ],
    link: {
      text: "官方購票頁面",
      url: "https://www.teamlab.art/zh-hant/e/borderless-azabudai/",
    },
    blogs: [
      {
        title: "Wendy's Journey｜麻布台之丘 teamLab 參觀攻略",
        url: "https://www.wendyjourney.com/teamlab-borderless/",
      },
      {
        title: "樂吃購！日本｜麻布台之丘攻略：teamLab 門票與交通",
        url: "https://tokyo.letsgojp.com/archives/632958/",
      },
    ],
  },
  {
    title: "Visit Japan Web 入境申報",
    icon: <QrCode className="w-5 h-5" />,
    summary: "2025年最新入境必備，節省通關時間。",
    steps: [
      "出發前一週：註冊帳號並登入 Visit Japan Web。",
      "登錄本人資料 (掃描護照) 與同行家人資料。",
      "登錄『入境、回國預定』(填寫航班、住宿飯店)。",
      "完成『入境審查』與『海關申報』的資料填寫。",
      "產生 QR Code (建議截圖保存)，抵達日本時出示掃描。",
    ],
    link: {
      text: "開始申報 (官方)",
      url: "https://vjw-lp.digital.go.jp/zh-hant/",
    },
    blogs: [
      {
        title: "DJB｜2025 日本入境快速通關 Visit Japan Web 教學",
        url: "https://djbcard.com/visitjapanweb/",
      },
      {
        title: "樂吃購！日本｜2025 最新 Visit Japan Web 填寫全攻略",
        url: "https://www.letsgojp.com/archives/535150/",
      },
      {
        title: "輕旅行｜Visit Japan Web 申請填寫懶人包",
        url: "https://travel.yam.com/article/138578",
      },
    ],
  },
  {
    title: "JR 東日本網路訂票 (Ekinet)",
    icon: <Train className="w-5 h-5" />,
    summary: "預訂北陸新幹線指定席 (上野 ↔ 輕井澤)。",
    steps: [
      "註冊 JR-EAST Train Reservation 帳號。",
      "選擇路線：北陸新幹線 (Hokuriku Shinkansen)。",
      "輸入出發/到達站 (Ueno / Karuizawa) 與日期時間。",
      "選位並付款。取得 QR Code 或取票代碼。",
      "乘車前至 JR 車站的『指定席售票機』掃描護照或輸入代碼取票。",
    ],
    link: {
      text: "Ekinet 繁體中文官網",
      url: "https://www.eki-net.com/zh-CHT/jreast-train-reservation/Top/Index",
    },
    blogs: [
      {
        title: "JR Times｜使用網路訂票系統預約新幹線教學",
        url: "https://www.jrtimes.tw/article.aspx?article_id=328",
      },
      {
        title: "Traveler Duck｜2025 JR 東日本訂票、劃位、取票教學",
        url: "https://travelerduck.com/jr-east-guide/",
      },
      {
        title: "NAVITIME｜JR 線票務安排與領票指南",
        url: "https://japantravel.navitime.com/zh-tw/booking/jr/support/ticketing/",
      },
    ],
  },
];

// ============================================================================
// 2. 參考連結 (Useful links)
// ============================================================================
//
// 將常用網站分類整理，方便快速查詢。
//
// 【資料結構】
// {
//   category   : 連結分類名稱 (交通、天氣、購物、緊急等)
//   items      : 連結項目陣列
// }
//
// 單個項目結構：
// {
//   title      : 連結標題
//   desc       : 連結描述 (簡短說明用途)
//   url        : 完整網址
//   icon       : Lucide React 圖示
// }
//
// 【如何修改】
// - 新增分類：複製一個 category 物件，改變 category 名稱與 items 內容
// - 新增連結：在 items 陣列中加入新物件，確保 url 正確
// - 更新連結：若網址變動，直接修改 url 欄位
// - 移除連結：整個物件刪除即可 (務必檢查陣列逗號)
//
export const usefulLinks = [
  {
    category: "交通與工具",
    items: [
      {
        title: "Visit Japan Web",
        desc: "入境申報必填 (官方)",
        url: "https://vjw-lp.digital.go.jp/zh-hant/",
        icon: <QrCode className="w-5 h-5" />,
      },
      {
        title: "乘換案內 (Jorudan)",
        desc: "日本電車轉乘查詢中文版",
        url: "https://world.jorudan.co.jp/mln/zh-tw/",
        icon: <Train className="w-5 h-5" />,
      },
      {
        title: "JR 東日本訂票",
        desc: "預訂新幹線指定席",
        url: "https://www.eki-net.com/zh-CHT/jreast-train-reservation/Top/Index",
        icon: <Train className="w-5 h-5" />,
      },
      {
        title: "Keisei Skyliner",
        desc: "成田機場交通購票",
        url: "https://www.keisei.co.jp/keisei/tetudou/skyliner/tc/",
        icon: <Train className="w-5 h-5" />,
      },
      {
        title: "東京地鐵圖 (PDF)",
        desc: "官方多語言地圖",
        url: "https://www.tokyometro.jp/tcn/subwaymap/",
        icon: <Map className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "天氣與實用",
    items: [
      {
        title: "輕井澤天氣 (Tenki.jp)",
        desc: "查詢降雪與穿搭指數",
        url: "https://tenki.jp/forecast/3/23/4820/20321/",
        icon: <CloudSnow className="w-5 h-5" />,
      },
      {
        title: "東京天氣 (Tenki.jp)",
        desc: "查詢市區天氣",
        url: "https://tenki.jp/forecast/3/16/4410/",
        icon: <Sun className="w-5 h-5" />,
      },
      {
        title: "Coin Locker Navi",
        desc: "尋找車站置物櫃",
        url: "https://www.coinlocker-navi.com/",
        icon: <Briefcase className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "景點預約",
    items: [
      {
        title: "teamLab Borderless",
        desc: "麻布台之丘官方預約",
        url: "https://www.teamlab.art/zh-hant/e/borderless-azabudai/",
        icon: <Camera className="w-5 h-5" />,
      },
      {
        title: "六本木之丘展望台",
        desc: "Tokyo City View 官網",
        url: "https://tcv.roppongihills.com/tw/",
        icon: <Star className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "購物與優惠",
    items: [
      {
        title: "Bic Camera 優惠券",
        desc: "最高 10% + 7%",
        url: "https://www.biccamera.com/bc/i/topics/global/index.jsp",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        title: "唐吉訶德優惠券",
        desc: "電子版優惠券",
        url: "https://www.djapanpass.com/coupon/0002000103",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        title: "松本清藥妝",
        desc: "店鋪搜尋與資訊",
        url: "https://www.matsukiyococokara-online.com/store/",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        title: "輕井澤王子 Outlet",
        desc: "樓層指南與優惠",
        url: "https://www.karuizawa-psp.jp/tw/",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "緊急與保險",
    items: [
      {
        title: "富邦產險理賠",
        desc: "旅遊不便險/旅平險官網",
        url: "https://www.fubon.com/insurance/home/",
        icon: <Shield className="w-5 h-5" />,
      },
      {
        title: "Tokio Marine 日動",
        desc: "VJW 推薦旅平險理賠 (中文)",
        url: "https://tokiomarinenichido.jp/zh-hant/china2/",
        icon: <Shield className="w-5 h-5" />,
      },
      {
        title: "JNTO 醫療指南",
        desc: "搜尋可對應外語的醫院",
        url: "https://www.jnto.go.jp/emergency/chc/mi_guide.html",
        icon: <AlertCircle className="w-5 h-5" />,
      },
    ],
  },
];

// ============================================================================
// 3. 商店與購物指南 (Shop guide)
// ============================================================================
//
// 各區域推薦店家、特色與附近連鎖店，方便安排行程與購物。
//
// 【資料結構】
// {
//   area              : 區域名稱 + 行程日期
//   desc              : 區域簡要描述
//   mapQuerySuffix    : Google 地圖搜尋用的地點名稱
//   mainShops         : 主要景點/店家陣列
//   specialShops      : 特色小店陣列
//   nearbyChains      : 附近連鎖店 (便利店、咖啡廳等)
// }
//
// 單個店家物件結構：
// {
//   name     : 店家名稱
//   tag      : 分類標籤 (如: 玩具、美食、購物等)
//   note     : 簡短備註 (如: "Outlet 內"、"大型店" 等)
//   location : 位置 (nearbyChains 專用)
// }
//
// 【如何修改】
// - 新增區域：複製一個 area 物件，改變區域名稱、日期、店家清單
// - 更新店家：修改 name、tag、note 欄位，刪除已關閉的店家
// - mapQuerySuffix：用於生成 Google 地圖搜尋，務必使用正確的地點名稱
// - 若要為店家添加更多詳細資訊，可擴展物件結構 (如新增 address、phone 等)
//
export const shopGuideData = [
  {
    area: "輕井澤 (Day 1-2)",
    desc: "王子購物廣場周邊",
    mapQuerySuffix: "輕井澤",
    mainShops: [
      { name: "Gucci", tag: "精品", note: "Outlet 折扣區" },
      { name: "LEGO Store", tag: "玩具", note: "Outlet 內" },
      { name: "味之街 (Ajino-Machi)", tag: "美食", note: "晚餐首選" },
    ],
    specialShops: [
      { name: "Gap Outlet", tag: "童裝", note: "款式多折扣大" },
      { name: "Miki House", tag: "童裝", note: "日本製高品質" },
      { name: "PLAZA", tag: "雜貨/文具", note: "Outlet 內" },
    ],
    nearbyChains: [
      { name: "Starbucks", location: "Outlet 內" },
      { name: "7-Eleven", location: "王子飯店東館附近" },
      { name: "Tully's Coffee", location: "Outlet 內" },
    ],
  },
  {
    area: "上野 (Day 3, 6)",
    desc: "車站與阿美橫丁周邊",
    mapQuerySuffix: "上野",
    mainShops: [
      { name: "Yamashiroya", tag: "玩具", note: "車站對面整棟玩具城" },
      { name: "PARCO_ya", tag: "百貨", note: "HARBS 甜點" },
      { name: "多慶屋 (Takeya)", tag: "伴手禮", note: "紫色大樓，零食便宜" },
      { name: "唐吉訶德", tag: "雜貨", note: "上野店" },
    ],
    specialShops: [
      { name: "Ueno LOFT", tag: "文具/雜貨", note: "上野丸井 (Marui) 5F" },
      { name: "Uniqlo / GU", tag: "童裝", note: "御徒町吉池大樓 (大型店)" },
      { name: "ABC-Mart", tag: "童鞋", note: "上野多間分店" },
    ],
    nearbyChains: [
      { name: "Starbucks", location: "上野公園內" },
      { name: "麥當勞", location: "上野車站前" },
      { name: "松屋", location: "阿美橫丁周邊" },
    ],
  },
  {
    area: "六本木 / 麻布台 (Day 4)",
    desc: "港區時尚中心",
    mapQuerySuffix: "六本木",
    mainShops: [
      { name: "teamLab Borderless", tag: "體驗", note: "麻布台之丘" },
      { name: "Estnation", tag: "選物", note: "六本木之丘" },
      { name: "Tsutaya 書店", tag: "書店", note: "星巴克聯名店" },
    ],
    specialShops: [
      { name: "Smith", tag: "文具", note: "六本木之丘 (質感文具)" },
      { name: "Ribbon hakka kids", tag: "童裝", note: "六本木之丘" },
      { name: "LEGO Store", tag: "玩具", note: "六本木之丘" },
    ],
    nearbyChains: [
      { name: "Starbucks", location: "六本木之丘" },
      { name: "Shake Shack", location: "六本木之丘" },
      { name: "麥當勞", location: "六本木十字路口" },
    ],
  },
  {
    area: "台場 / 豐洲 (Day 5)",
    desc: "海灣休閒區",
    mapQuerySuffix: "台場",
    mainShops: [
      { name: "哆啦A夢未來百貨", tag: "樂園", note: "DiverCity" },
      { name: "après les cours", tag: "童裝", note: "LaLaport 豐洲" },
      { name: "Akachan Honpo", tag: "母嬰", note: "LaLaport 豐洲" },
    ],
    specialShops: [
      { name: "Toyosu LOFT", tag: "文具/雜貨", note: "LaLaport 豐洲 1F" },
      { name: "Petit Main", tag: "童裝", note: "LaLaport 豐洲" },
      { name: "BREEZE", tag: "童裝", note: "DiverCity / LaLaport" },
    ],
    nearbyChains: [
      { name: "Uniqlo", location: "DiverCity Tokyo" },
      { name: "麥當勞", location: "DiverCity 美食街" },
      { name: "Starbucks", location: "DiverCity" },
      { name: "Lawson", location: "台場周邊" },
    ],
  },
];

// ============================================================================
// 4. 行程核心資料 (Itinerary)
// ============================================================================
//
// 每日行程包含事件時間、地點、交通與小提醒，供 UI 呈現用。
// 這是整個行程檔案的最重要部分，需要精心維護。
//
// 【Day 物件結構】
// {
//   day            : 日期標籤 (如: "Day 1", "Day 2")
//   locationKey    : 地點識別符，需與 tripConfig.locations 對應
//   date           : 西曆日期 (如: "1/24 (六)")
//   title          : 該日行程主題
//   stay           : 住宿飯店名稱
//   routeInfo      : 日程整體路線資訊
//   events         : 當日事件陣列
//   notice         : (選項) 重要提醒 { type: "info" | "warning", text: "..." }
// }
//
// 【routeInfo 結構】
// {
//   summary        : 路線簡述 (如: "成田機場 → 京成上野 → ...")
//   mapUrl         : Google Maps 完整網址 (用 direction API)
// }
//
// 【Event 物件結構】
// {
//   time           : 事件時間 (如: "14:30")
//   title          : 事件標題
//   mapQuery       : Google 地圖搜尋用的地點名稱
//   lat / lon      : 座標 (用於地圖標記)
//   icon           : Lucide React 圖示 (如: <Train /> <Utensils /> 等)
//   desc           : 事件詳細描述
//   transport      : (交通事件) { mode: "...", duration: "...", route: "...", note: "..." }
//   highlights     : (可選) 亮點項目陣列
//   tips           : (可選) 小提示陣列
// }
//
// 【如何修改】
// - 修改日期：更新 day、date、routeInfo.summary、routeInfo.mapUrl
// - 修改飯店：更新 stay 欄位
// - 新增事件：在 events 陣列中插入新物件，注意時間排序
// - 修改事件：編輯 title、desc、highlights、tips 內容
// - 坐標查詢：可用 Google Maps 取得 lat/lon，或用地點名稱讓 UI 轉換
// - 交通資訊：更新 transport 物件中的 mode、duration、route、note
// - 若事件涉及預訂，務必在 desc 或 tips 中說明提前預約的需求
//
export const itineraryData = [
  {
    day: "Day 1",
    locationKey: "karuizawa",
    date: "1/24 (六)",
    title: "抵達與移動：直奔雪國",
    stay: "輕井澤王子大飯店西館 (露臺房 Terrace Room)",
    routeInfo: {
      summary: "成田機場 → 京成上野 → JR上野 → 輕井澤 → 飯店",
      mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Narita+Airport&destination=Karuizawa+Prince+Hotel+West&waypoints=Keisei+Ueno+Station|Karuizawa+Station",
    },
    events: [
      {
        time: "14:30",
        title: "抵達東京成田機場",
        mapQuery: "成田機場",
        lat: 35.771986,
        lon: 140.392850,
        icon: <MapPin />,
        desc: "領取行李，入境審查 (準備 VJW QR Code)。入境後請至 B1 找紅色招牌的「JR 東日本旅行服務中心」兌換/購買周遊券。",
        tips: [
          "若 JR 櫃檯大排長龍，可至「售票機」掃描護照取票。",
          "連結機場 WiFi 或開通漫遊，確認網路順暢。",
          "上廁所、買飲料，準備搭車。",
        ],
      },
      {
        time: "15:40",
        title: "交通：成田 → 上野",
        mapQuery: "京成上野站",
        lat: 35.711310,
        lon: 139.774945,
        icon: <Train />,
        desc: "搭乘 Skyliner 前往市區。車廂內有大型行李架，不用擔心沒位子放。",
        transport: {
          mode: "京成電鐵 Skyliner",
          duration: "約 45 分鐘",
          route: "成田機場站 → 京成上野站",
          note: "全車指定席，票券背面有寫車廂號碼與座位號碼。",
        },
      },
      {
        time: "16:40",
        title: "上野站轉乘與午餐(點心)",
        mapQuery: "JR 上野站",
        lat: 35.713768,
        lon: 139.777254,
        icon: <Utensils />,
        desc: "購買知名的鐵路便當 (Ekiben)！新幹線上可以吃東西，當作遲來的午餐或點心。",
        highlights: [
          "上野站中央改札口外的便當屋「駅弁屋 匠」種類最全。",
          "推薦：深川飯便當 (蛤蜊飯)、牛肉壽喜燒便當、新幹線造型便當 (小朋友最愛)。",
        ],
        tips: [
          "京成上野站出站後，沿著地面指標走約 5-7 分鐘可到 JR 上野站。",
          "JR 上野站人潮多，推嬰兒車請找電梯 (公園口或廣小路口方向)。",
        ],
      },
      {
        time: "17:30",
        title: "交通：上野 → 輕井澤",
        mapQuery: "輕井澤站",
        lat: 36.342550,
        lon: 138.635060,
        icon: <Train />,
        desc: "搭乘北陸新幹線，舒適直達。這段路程風景會從城市轉為雪景！",
        transport: {
          mode: "北陸新幹線 (Hakutaka 或 Asama 號)",
          duration: "約 60-70 分鐘",
          route: "JR 上野站 → 輕井澤站",
          note: "⚠️ 務必提前 1 個月於 JR 東日本官網預訂指定席！Ekinet 取票需使用信用卡。",
        },
      },
      {
        time: "18:50",
        title: "入住王子飯店",
        mapQuery: "輕井澤王子大飯店西館",
        lat: 36.335300,
        lon: 138.628800,
        icon: <Hotel />,
        desc: "抵達輕井澤站南口，前往 Outlet 方向搭乘接駁車。西館櫃檯辦理入住。",
        transport: {
          mode: "飯店接駁車 (Piccolo Bus)",
          duration: "約 10 分鐘",
          route: "輕井澤站南口 → 西館門口",
          note: "接駁車約每 30 分鐘一班。若錯過且天氣冷，建議直接搭計程車 (約 1000-1500 日幣)。",
        },
        highlights: [
          "露臺房 (Terrace Room) 空間寬敞，鞋子脫在玄關，非常適合家庭。",
          "晚上氣溫低，進房先開暖氣。",
        ],
      },
      {
        time: "19:30",
        title: "晚餐：Outlet 味之街",
        mapQuery: "輕井澤王子購物廣場 味之街",
        lat: 36.340180,
        lon: 138.632460,
        icon: <Utensils />,
        desc: "Outlet 商店約 19:00 打烊，但餐廳區 (味之街) 通常營業至 21:00 左右。",
        highlights: [
          "明治亭：醬汁豬排丼，份量大、醬汁濃郁。",
          "築地ハレの日：新鮮海鮮丼，想吃生魚片的首選。",
          "Cool Miner：牛排漢堡排，適合想吃肉的人。",
        ],
        tips: [
          "此時商店已關門，請直接前往餐廳區用餐。",
          "飯店內也有便利商店 (FamilyMart)，可以買些零食、牛奶、隔天早餐。",
        ],
      },
    ],
    notice: {
      type: "info",
      text: "重要提醒：新幹線指定席票券建議提前一個月預訂，以免向隅！",
    },
  },
  {
    day: "Day 2",
    locationKey: "karuizawa",
    date: "1/25 (日)",
    title: "輕井澤：安心玩雪與購物",
    stay: "輕井澤王子大飯店西館 (露臺房 Terrace Room)",
    routeInfo: {
      summary: "飯店 → 王子滑雪場 → 王子Outlet → 飯店",
      mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Karuizawa+Prince+Hotel+West&destination=Karuizawa+Prince+Hotel+West&waypoints=Karuizawa+Prince+Hotel+Ski+Resort|Karuizawa+Prince+Shopping+Plaza",
    },
    events: [
      {
        time: "09:30",
        title: "王子飯店滑雪場 Kids Park",
        mapQuery: "輕井澤王子大飯店滑雪場",
        lat: 36.335000,
        lon: 138.634000,
        icon: <Snowflake />,
        desc: "就在 Outlet 旁，專為兒童設計的戲雪區，不滑雪也能玩得很開心。",
        highlights: [
          "雪盆溜滑梯：有電動步道 (魔毯) 載你上去，不用自己爬坡！",
          "輪胎滑雪 (Tubing)：刺激又好玩。",
          "堆雪人區域：記得帶玩雪工具 (夾雪球器)。",
        ],
        tips: [
          "入場費約 ¥2000/人 (包含雪盆租借)。",
          "大人小孩都要穿防水衣褲、手套、帽子。",
          "旁邊有休息室和廁所，冷了可以進去取暖販賣機買熱飲。",
        ],
      },
      {
        time: "12:30",
        title: "午餐：Outlet 美食街",
        mapQuery: "輕井澤王子購物廣場 Food Court",
        lat: 36.341500,
        lon: 138.634000,
        icon: <Utensils />,
        desc: "Food Court 選擇多，位置也多，適合親子。",
        highlights: [
          "濃厚生乳霜淇淋 (必吃！)：使用信州高原牛乳。",
          "信州著名的蕎麥麵：清爽好吃。",
          "拉麵、烏龍麵：暖胃首選。",
        ],
        tips: [
          "週末用餐時間人潮眾多，建議提早 (11:30) 或延後 (13:30) 用餐。",
          "美食街有兒童洗手台和兒童椅。",
        ],
      },
      {
        time: "14:00",
        title: "Outlet 深度購物",
        mapQuery: "輕井澤王子購物廣場",
        lat: 36.340000,
        lon: 138.633000,
        icon: <ShoppingBag />,
        desc: "全日本最美 Outlet，風景如畫。分為東、西、新東、新西等多個區域。",
        highlights: [
          "媽媽必逛：Gucci, Bottega Veneta (New East), Coach (折扣優)。",
          "小孩必逛：樂高商店 (LEGO), 森林家族 (New West)。",
          "運動品牌：Nike, Adidas (East)。",
        ],
        tips: [
          "先去 Information Center 出示護照領取外國人優惠券 (Coupon Book)。",
          "園區很大，善用園區內循環巴士 (Pickup Bus) 移動。",
          "大部分店家可免稅，請隨身攜帶護照。",
        ],
      },
      {
        time: "18:00",
        title: "晚餐：Outlet 餐廳",
        mapQuery: "輕井澤王子購物廣場",
        lat: 36.340180,
        lon: 138.632460,
        icon: <Utensils />,
        desc: "找一家喜歡的餐廳好好享用晚餐。",
        highlights: [
          "久世福食堂：日式定食，野菜天婦羅很好吃。",
          "Aged Beef：熟成牛排，肉質軟嫩。",
          "單點小吃：澤屋果醬 (SAWAYA) 可買來當伴手禮。",
        ],
        tips: [
          "吃飽後可在 Outlet 欣賞夜間點燈，湖畔倒影非常浪漫。",
          "回飯店前確認隔天 Check-out 時間與行李寄放方式。",
        ],
      },
    ],
  },
  {
    day: "Day 3",
    locationKey: "ueno",
    date: "1/26 (一)",
    title: "移動日 + 上野輕鬆逛",
    stay: "&HERE TOKYO UENO (上野)",
    routeInfo: {
      summary: "輕井澤 → 上野站 → 飯店 → Yamashiroya → PARCO_ya → 阿美橫丁",
      mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Karuizawa+Prince+Hotel+West&destination=Ameyoko+Shopping+District&waypoints=Karuizawa+Station|Ueno+Station|Yamashiroya|PARCO_ya+Ueno",
    },
    events: [
      {
        time: "10:00",
        title: "交通：輕井澤 → 上野",
        mapQuery: "JR 上野站",
        lat: 36.342550,
        lon: 138.635060,
        icon: <Train />,
        desc: "Check-out 飯店，搭乘接駁車回輕井澤站。搭乘新幹線返回東京。",
        transport: {
          mode: "北陸新幹線",
          duration: "約 60-70 分鐘",
          route: "輕井澤站 → JR 上野站",
          note: "進站前可再逛一下輕井澤站的伴手禮店 (澤屋果醬、起司蛋糕)。",
        },
      },
      {
        time: "11:30",
        title: "抵達飯店 & 午餐",
        mapQuery: "&HERE TOKYO UENO",
        lat: 35.711800,
        lon: 139.771600,
        icon: <Hotel />,
        desc: "抵達上野站，從「不忍口」出站，步行至 &HERE TOKYO UENO 寄放行李。",
        transport: {
          mode: "步行",
          duration: "約 8-10 分鐘",
          route: "上野站不忍口 →飯店",
          note: "飯店靠近上野公園不忍池側，位置清幽，對面就是公園。",
        },
        highlights: [
          "午餐推薦：一蘭拉麵上野店 (就在車站旁，24小時)。",
          "壽司郎上野店 (需抽號碼牌，建議用 App 先預約)。",
          "敘敘苑燒肉 (上野丸井店，高樓層景觀好)。",
        ],
      },
      {
        time: "13:30",
        title: "爸媽分組行動 (安太座時光)",
        mapQuery: "Yamashiroya 上野",
        lat: 35.712600,
        lon: 139.775800,
        icon: <Star />,
        desc: "爸爸帶小孩逛玩具，媽媽去百貨下午茶。",
        highlights: [
          "👨 爸+寶：Yamashiroya 玩具店 (上野站對面整棟，B1-6F 全是玩具，有電梯)。",
          "👩 媽媽：PARCO_ya 上野 (質感百貨，好逛不擠)。",
        ],
        tips: [
          "媽媽務必去 PARCO_ya 的 HARBS 吃水果千層蛋糕！(35.7078, 139.7743)",
          "Yamashiroya 門口有很多扭蛋機。",
        ],
      },
      {
        time: "17:30",
        title: "阿美橫丁",
        mapQuery: "阿美橫丁",
        lat: 35.710500,
        lon: 139.774500,
        icon: <ShoppingBag />,
        desc: "感受東京下町熱鬧氣氛，藥妝零食大採購。",
        highlights: [
          "二木之菓子：買伴手禮零食最便宜，有免稅。",
          "OS Drug：藥妝超便宜，但只收現金，不免稅。",
          "街頭小吃：鐵火丼 (生魚片蓋飯)、水果串 (草莓/哈密瓜)。",
        ],
        tips: [
          "人潮擁擠，請務必牽好小孩。",
          "阿美橫丁很多店只收現金，記得準備足夠日幣。",
          "晚餐可以在這裡解決，有很多居酒屋和海鮮餐廳。",
        ],
      },
    ],
  },
  {
    day: "Day 4",
    locationKey: "roppongi",
    date: "1/27 (二)",
    title: "六本木：藝術與浪漫之夜",
    stay: "&HERE TOKYO UENO (上野)",
    routeInfo: {
      summary: "上野 → 麻布台之丘 → teamLab → 六本木之丘 → 櫸木坂點燈 → 上野",
      mapUrl: "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=&HERE+TOKYO+UENO&waypoints=Azabudai+Hills|teamLab+Borderless|Roppongi+Hills|Roppongi+Keyakizaka+Dori",
    },
    events: [
      {
        time: "08:20",
        title: "交通：上野 → 麻布台之丘",
        mapQuery: "麻布台之丘",
        lat: 35.711310,
        lon: 139.774945,
        icon: <Train />,
        desc: "提早出發，前往東京最新地標。避開上班尖峰最擠的時段。",
        transport: {
          mode: "東京地鐵 日比谷線 (H線)",
          duration: "約 25 分鐘",
          route: "上野站 (H17) → 神谷町站 (H05)",
          note: "神谷町站 5 號出口直結麻布台之丘，不用出站，沿著指標走即可。",
        },
      },
      {
        time: "09:00",
        title: "teamLab Borderless",
        mapQuery: "teamLab Borderless 麻布台",
        lat: 35.661000,
        lon: 139.741000,
        icon: <Camera />,
        desc: "沉浸式光影藝術，視覺震撼。位於麻布台之丘 Garden Plaza B B1。",
        highlights: [
          "彩繪海洋：小孩畫的魚會游進牆壁裡！記得找畫圖區。",
          "泡泡宇宙：絕美燈球空間，拍照必去。",
          "無界的世界：光影會移動到不同房間，可以追著光跑。",
        ],
        tips: [
          "✅ 已預約 9:00 場次，請準時入場。需下載 teamLab App 互動。",
          "場內黑暗且有鏡面地板，建議穿褲裝，不要穿裙子。",
          "有大型置物櫃可放包包外套。",
        ],
      },
      {
        time: "12:00",
        title: "午餐：麻布台之丘",
        mapQuery: "麻布台之丘",
        lat: 35.660600,
        lon: 139.740400,
        icon: <Utensils />,
        desc: "享用質感午餐。麻布台之丘有很多新餐廳。",
        tips: [
          "這裡有很多新開的網紅咖啡廳，如 % Arabica (B1)。",
          "若想吃平價一點，可至 Tower Plaza 的餐廳或地下美食街。",
          "推薦：Pelican Cafe (吐司名店)。",
        ],
      },
      {
        time: "13:30",
        title: "移動 & 東京城市景觀",
        mapQuery: "六本木之丘展望台",
        lat: 35.660500,
        lon: 139.729200,
        icon: <Camera />,
        desc: "前往六本木之丘展望台。",
        transport: {
          mode: "步行 或 地鐵一站",
          duration: "約 15-20 分鐘",
          route: "麻布台之丘 → 六本木之丘",
          note: "天氣好建議散步過去，沿途經過高級住宅區，街景很美。",
        },
        highlights: [
          "52F 室內展望台 (Tokyo City View)：360度俯瞰東京，東京鐵塔近在眼前。",
          "下午有充裕時間，可以在六本木之丘 (Roppongi Hills) 悠閒逛街。",
          "親子推薦：樂高商店、朝日電視台 (有哆啦A夢)。",
        ],
      },
      {
        time: "17:00",
        title: "六本木櫸木坂點燈",
        mapQuery: "六本木櫸木坂",
        lat: 35.659500,
        lon: 139.729000,
        icon: <Star />,
        desc: "媽媽心願達成！冬季限定的浪漫燈飾。",
        highlights: [
          "整排樹掛滿藍白燈飾 (Snow & Blue) + 紅色東京鐵塔背景。",
          "最佳拍照點：蒂芬妮 (Tiffany) 專賣店附近的天橋，人多請排隊。",
        ],
        tips: [
          "這時候風會比較大，記得戴帽子圍巾。",
          "拍完照可以在六本木吃晚餐，或回上野吃。",
        ],
      },
    ],
    notice: {
      type: "alert",
      text: "重要提醒：teamLab Borderless 門票非常熱門，請務必提前上網購票。",
    },
  },
  {
    day: "Day 5",
    locationKey: "odaiba",
    date: "1/28 (三)",
    title: "台場夢想日 + 童裝採購",
    stay: "&HERE TOKYO UENO (上野)",
    routeInfo: {
      summary: "上野 → 台場DiverCity → LaLaport豐洲 → 上野",
      mapUrl: "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=&HERE+TOKYO+UENO&waypoints=DiverCity+Tokyo+Plaza|Urban+Dock+LaLaport+Toyosu",
    },
    events: [
      {
        time: "09:30",
        title: "交通：上野 → 台場",
        mapQuery: "百合海鷗號 台場站",
        lat: 35.624700,
        lon: 139.770900,
        icon: <Train />,
        desc: "搭乘著名的百合海鷗號 (無人駕駛電車)。",
        transport: {
          mode: "地鐵銀座線 + 百合海鷗號",
          duration: "約 40 分鐘",
          route: "上野 → 新橋 (轉乘) → 台場站",
          note: "💡 必殺技：去程請搶百合海鷗號「第一節車廂」最前排，風景無敵！像坐雲霄飛車。",
        },
      },
      {
        time: "10:30",
        title: "哆啦A夢未來百貨",
        mapQuery: "哆啦A夢未來百貨公司",
        lat: 35.625167,
        lon: 139.775361,
        icon: <Star />,
        desc: "位於 DiverCity Tokyo Plaza 2F。全球第一家哆啦A夢官方商店。",
        highlights: [
          "秘密道具實驗室：體驗竹蜻蜓 (模擬飛行)、空氣砲 (射擊遊戲) (需代幣)。",
          "客製化刺繡區：可以繡名字/哆啦A夢圖案在毛巾、包包上 (需等待時間)。",
          "門口廣場：有 1:1 實物大獨角獸鋼彈，整點有變身秀。",
        ],
        tips: [
          "DiverCity 美食街選擇多，午餐可在此解決 (金子半之助、田中商店拉麵)。",
        ],
      },
      {
        time: "14:00",
        title: "交通：台場 → 豐洲",
        mapQuery: "LaLaport 豐洲",
        lat: 35.624700,
        lon: 139.770900,
        icon: <Train />,
        desc: "搭乘百合海鷗號前往豐洲。",
        transport: {
          mode: "百合海鷗號",
          duration: "約 20 分鐘",
          route: "台場站 → 豐洲站",
          note: "從豐洲站 2b 出口直結通往 LaLaport 商場。",
        },
      },
      {
        time: "14:30",
        title: "童裝採購：LaLaport 豐洲",
        mapQuery: "LaLaport 豐洲",
        lat: 35.655400,
        lon: 139.792500,
        icon: <ShoppingBag />,
        desc: "東京親子友善商場 No.1，可以看海。",
        highlights: [
          "après les cours (2F)：日系童裝，風格溫柔可愛。",
          "Akachan Honpo (3F)：阿卡將本舖，母嬰用品一次補齊。",
          "KidZania (3F)：職業體驗城 (若有時間可預約，但需懂日文較佳)。",
        ],
        tips: [
          "商場外有海濱公園，可以讓小孩跑跑跳跳，風景優美。",
          "記得去免稅櫃台辦理退稅。",
        ],
      },
      {
        time: "18:00",
        title: "晚餐 & 返回上野",
        mapQuery: "上野站",
        lat: 35.713768,
        lon: 139.777254,
        icon: <Utensils />,
        desc: "欣賞東京灣夜景後回程。",
        transport: {
          mode: "地鐵有樂町線 + 山手線",
          duration: "約 30 分鐘",
          route: "豐洲 → 有樂町 (轉乘) → 上野",
          note: "避開下班尖峰時間搭車會比較舒適。",
        },
      },
    ],
  },
  {
    day: "Day 6",
    locationKey: "ueno",
    date: "1/29 (四)",
    title: "最後衝刺與返家",
    stay: "溫暖的家",
    routeInfo: {
      summary: "上野多慶屋 → 京成上野站 → 成田機場",
      mapUrl: "https://www.google.com/maps/dir/?api=1&origin=&HERE+TOKYO+UENO&destination=Narita+Airport+Terminal+2&waypoints=Takeya+1|Keisei+Ueno+Station",
    },
    events: [
      {
        time: "09:00",
        title: "上野補貨",
        mapQuery: "多慶屋 上野",
        lat: 35.706700,
        lon: 139.776700,
        icon: <ShoppingBag />,
        desc: "把握最後採買機會。",
        highlights: [
          "多慶屋 (紫色大樓)：零食、乾貨、磁力貼、保溫瓶一次買齊。9:00 開門。",
          "唐吉訶德上野店：補買藥妝、雜貨。",
          "二木之菓子：若第一天沒買夠，這裡再補。",
        ],
        tips: [
          "記得預留時間回飯店拿行李！",
          "建議 11:30 前回到京成上野站，使用置物櫃或直接進站。",
        ],
      },
      {
        time: "12:00",
        title: "交通：上野 → 成田機場",
        mapQuery: "成田機場第2航廈",
        lat: 35.711310,
        lon: 139.774945,
        icon: <Train />,
        desc: "搭乘 Skyliner 前往機場。",
        transport: {
          mode: "京成電鐵 Skyliner",
          duration: "約 45 分鐘",
          route: "京成上野站 → 成田機場第2航廈",
          note: "建議搭乘 12:00 或 12:20 的班次，13:00 前抵達機場。星宇航空在第2航廈。",
        },
      },
      {
        time: "13:30",
        title: "機場最後衝刺",
        mapQuery: "成田機場第2航廈",
        lat: 35.771986,
        lon: 140.392850,
        icon: <Star />,
        desc: "成田機場第2航廈 4F 商店街。",
        highlights: [
          "Pokemon Store (寶可夢商店)：機長皮卡丘限定版。",
          "Fa-So-La 免稅店：白色戀人、薯條三兄弟、東京香蕉、清酒。",
          "扭蛋區：把剩下的零錢扭完。",
        ],
        tips: [
          "星宇航空櫃檯通常在 3F (J 櫃檯)，先掛行李再去逛。",
          "出境後免稅店人多，請預留結帳時間。",
        ],
      },
      {
        time: "15:40",
        title: "班機：星宇 JX803",
        mapQuery: "成田機場",
        lat: 35.771986,
        lon: 140.392850,
        icon: <Train />,
        desc: "快樂返台！",
        transport: {
          mode: "飛機",
          duration: "約 4 小時",
          route: "東京成田 (NRT) →台北桃園 (TPE)",
          note: "抵達台灣時間約 18:50。機上有個人娛樂系統，可以看電影。",
        },
      },
    ],
  },
];

// ============================================================================
// 5. 專案全域設定 (Config)
// ============================================================================
//
// 用於控制行程標題、日期、飯店、緊急聯絡與 UI 主題等。
// 這些設定會被多個 UI 元件使用，修改時需謹慎。
//
// 【基本結構】
// {
//   title            : 行程標題
//   timeZone         : 時區 (如: "Asia/Tokyo")
//   currency         : 貨幣設定 { code, label, source, target }
//   subTitle         : 副標題 (顯示日期範圍)
//   startDate / endDate : ISO 8601 格式的開始與結束時間
//   flights          : 航班資訊 (去程 outbound / 回程 inbound)
//   hotels           : 住宿飯店陣列
//   emergency        : 緊急聯絡資訊
//   locations        : 地點列表 (與 itineraryData 的 locationKey 對應)
//   tripHighlights   : 行程亮點
//   theme            : UI 視覺主題 (顏色、背景、文字等)
//   language         : 語言與語音設定
// }
//
// 【如何修改】
// - 修改標題/日期：更新 title、subTitle、startDate、endDate
// - 更新航班：修改 flights.outbound / .inbound 的 code 與 time
// - 新增/修改飯店：編輯 hotels 陣列，每間飯店包含 name、phone、address、note
// - 更新時區：若行程在其他國家，改變 timeZone (如: "Europe/Paris")
// - 修改貨幣：若行程涉及其他幣別，更新 currency.code / .label / .source
// - 新增地點：在 locations 陣列中新增 { key, name, lat, lon }
// - 更新亮點：修改 tripHighlights 陣列中的景點
// - 客製化主題：編輯 theme 物件中的顏色、漸層、文字等 (需懂 Tailwind CSS)
//
export const tripConfig = {
  // ========== 基本資訊 ==========
  title: "東京輕井澤親子之旅",
  timeZone: "Asia/Tokyo",
  currency: {
    code: "jpy", // API 使用小寫 (jpy, usd, eur...)
    label: "日圓",
    source: "JPY",
    target: "TWD", // 目標貨幣 (固定為TWD)
  },
  subTitle: "2026/1/24 - 1/29",
  startDate: "2026-01-24T00:00:00",
  endDate: "2026-01-29T23:59:59",

  // ========== 航班資訊 ==========
  // 【如何修改】
  // - code: 航空公司代碼 + 班機號
  // - time: 出發時間 (出發地時區) ➝ 抵達時間 (目的地時區)
  flights: {
    outbound: {
      code: "星宇 JX802",
      time: "10:20 TPE ➝ 14:25 NRT",
    },
    inbound: {
      code: "星宇 JX803",
      time: "15:40 NRT ➝ 18:50 TPE",
    },
  },

  // ========== 住宿資訊 ==========
  // 【如何修改】
  // - 新增飯店：在陣列中新增物件 { name, phone, address, note }
  // - phone: 國際格式 (含國家碼，如: +81-3-...)
  // - address: 完整地址 (日文或英文皆可)
  // - note: 房型、特色備註 (如: "露臺房"、"海景房" 等)
  hotels: [
    {
      name: "輕井澤王子西館",
      phone: "+81-267-42-1111",
      address: "長野県北佐久郡輕井澤町輕井澤",
      note: "露臺房 Terrace Room",
    },
    {
      name: "&HERE TOKYO UENO",
      phone: "+81-3-6824-9442",
      address: "東京都台東區上野 2-11-18",
      note: "上野公園不忍池旁",
    },
  ],

  // ========== 緊急聯絡 ==========
  // 【如何修改】
  // - police: 當地警察電話
  // - ambulance: 當地救護車電話
  // - contact: 外交部駐當地辦事處或緊急聯絡電話
  emergency: {
    police: "110",
    ambulance: "119",
    contact: "旅外國人急難救助：+81-3-3280-7917", // 這裡可以改成當地的辦事處電話
  },

  // 導遊模式問題 (針對行程)
  aiQuestions: [
    "Day 3 的晚餐推薦?",
    "如何搭乘百合海鷗號?",
    "這附近的便利商店?",
    "推薦適合小孩的景點?",
  ],

  // 翻譯模式預設問題
  translationQuestions: [
    "翻譯「請給我兒童餐具」",
    "翻譯「這個多少錢?」",
    "翻譯「廁所在哪裡?」",
    "翻譯「我要去這裡」",
  ],

  // ========== 地點定義 ==========
  // 【結構】
  // {
  //   key   : 識別符，用於 itineraryData 的 locationKey 對應
  //   name  : 地點名稱 (顯示用)
  //   lat   : 緯度
  //   lon   : 經度
  // }
  // 【如何修改】
  // - 新增地點：在陣列中新增物件，key 必須與 itineraryData 中的 locationKey 相同
  // - 座標可用 Google Maps 或 GPS 座標網站查詢
  // - key 名稱應簡短且能代表該地點 (如: "karuizawa", "ueno", "roppongi" 等)
  //
  locations: [
    { key: "karuizawa", name: "輕井澤", lat: 36.34, lon: 138.63 },
    { key: "ueno", name: "上野", lat: 35.71, lon: 139.78 },
    { key: "roppongi", name: "六本木", lat: 35.66, lon: 139.73 },
    { key: "odaiba", name: "台場", lat: 35.63, lon: 139.78 },
    { key: "tokyo", name: "東京市區", lat: 35.68, lon: 139.76 },
    { key: "narita", name: "成田機場", lat: 35.77, lon: 140.39 },
  ],

  // ========== 旅程亮點 ==========
  // 【說明】
  // 簡短列舉行程中最精彩的景點/體驗。
  // 用於 UI 的行程概覽卡片或社群媒體分享。
  // 【如何修改】
  // - 修改景點名稱或新增景點
  // - 順序可自行調整 (通常按行程順序或重要度排列)
  //
  tripHighlights: [
    "輕井澤滑雪場",
    "王子 Outlet",
    "上野公園",
    "teamLab Borderless",
    "麻布台之丘",
    "六本木之丘",
    "台場鋼彈",
    "LaLaport 豐洲",
  ],

  // ========== 視覺主題 (UI 樣式) ==========
  // 【說明】
  // 控制應用整體的配色、文字顏色、背景紋理與裝飾。
  // 使用 Tailwind CSS 色票名稱，支援日間/夜間模式。
  // 【資料結構】
  // {
  //   colorBase      : 基礎色系 (如: stone, slate, zinc, neutral 等)
  //   colorAccent    : 強調色 (如: amber, sky, indigo 等)
  //   textColors     : 文字顏色 { light, dark, secLight, secDark }
  //   bgTexture      : SVG 背景紋理 (資料 URI)
  //   bgGradientLight: 日間背景漸層
  //   bgGradientDark : 夜間背景漸層
  //   blobs          : 裝飾光暈球 { light: [...], dark: [...] }
  // }
  // 【如何修改】
  // - 變更基礎色：修改 colorBase (推薦: stone, slate, zinc, neutral, warm 等)
  // - 變更強調色：修改 colorAccent (推薦: amber, sky, rose, indigo 等)
  // - 調整文字亮度：修改 textColors 中的 Tailwind 色票 (如: text-stone-100, text-stone-800)
  // - 背景漸層：修改 bgGradientLight / bgGradientDark 的 Tailwind class 或 RGB 十六進制值
  // - 裝飾顏色：修改 blobs 中的 Tailwind class (可調整透明度與色系)
  // - 提示：更換主題時需同時調整 light & dark 版本，確保深色模式可讀性
  //
  theme: {
    colorBase: "stone",
    colorAccent: "amber",

    textColors: {
      light: "text-stone-800",
      dark: "text-stone-100",
      secLight: "text-stone-500",
      secDark: "text-stone-300",
    },

    bgTexture: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,

    bgGradientLight: "bg-[#FDFBF7] from-stone-100/50 via-white to-transparent",
    bgGradientDark: "bg-[#1A1A1A] from-[#252525] via-[#1A1A1A]/80 to-transparent",

    blobs: {
      light: ["bg-orange-200/30", "bg-stone-200/30", "bg-amber-100/40"],
      dark: ["bg-amber-500/10", "bg-purple-500/10", "bg-blue-500/10"],
    },
  },

  // ========== 語言與語音設定 ==========
  // 【說明】
  // 用於 AI 語音辨識、多語言顯示等功能。
  // 【如何修改】
  // - code: 改為其他語言代碼 (如: en-US, ko-KR, th-TH, es-ES 等)
  // - label: 按鈕顯示的簡短文字 (如: 日, 英, 韓, 泰 等)
  // - name: 用於 AI 提示詞的完整語言名稱
  //
  language: {
    code: "ja-JP",
    label: "日",
    name: "日文",
  },
};


// ============================================================================
// 6. 行前檢查清單 (Pre-departure checklist)
// ============================================================================
//
// 常用出發前檢查項目。
// UI 可依 `checked` 屬性顯示選取狀態，形成 todo list。
//
// 【資料結構】
// {
//   id     : 項目編號 (唯一識別，用於刪除或更新)
//   text   : 檢查項目的文字描述
//   checked: 布林值，表示是否已完成 (通常初始為 false)
// }
//
// 【如何修改】
// - 新增項目：在陣列最後加入新物件，id 要遞增 (如: 21, 22, 23...)
// - 刪除項目：整個物件刪除，注意陣列逗號
// - 修改文字：編輯 text 欄位，保持語氣一致
// - 分類建議：可按類別組織 (簽證/護照、交通、金錢、裝備、健康等)
//
// 【範例新增】
// 若要新增"確認行李尺寸"項目，應在陣列最後加:
// { id: 21, text: "確認行李尺寸與重量限制", checked: false }
//
export const checklistData = [
  { id: 1, text: "護照 (效期6個月以上)", checked: false },
  { id: 2, text: "VJW 入境申報 QR Code (建議截圖)", checked: false },
  { id: 3, text: "E-SIM / 漫遊開通", checked: false },
  { id: 4, text: "Skyliner / 新幹線車票 (確認取票碼)", checked: false },
  { id: 5, text: "日幣現金 & 信用卡 (確認海外開通)", checked: false },
  { id: 6, text: "交通卡 (Suica/ICOCA)與零錢包", checked: false },
  { id: 7, text: "旅遊保險 (包含不便險/醫療)", checked: false },
  { id: 8, text: "常備藥物 (退燒、感冒、止瀉、OK繃)", checked: false },
  { id: 9, text: "各類充電器 (手機、手錶) & 行動電源", checked: false },
  { id: 10, text: "禦寒衣物 (洋蔥式穿搭、防水手套、毛帽)", checked: false },
  { id: 11, text: "濕紙巾、面紙 & 乾洗手 (隨身清潔)", checked: false },
  { id: 12, text: "輕便雨衣 (玩雪用) & 兒童摺疊傘", checked: false },
  { id: 13, text: "雪靴 / 防滑鞋 (建議噴防水噴霧)", checked: false },
  { id: 14, text: "機上/車上娛樂 (畫筆、貼紙書、耳機)", checked: false },
  { id: 15, text: "保濕乳液 & 護唇膏 (預防乾燥蘋果臉)", checked: false },
  { id: 16, text: "隨身垃圾袋 (日本少垃圾桶)", checked: false },
  { id: 17, text: "暖暖包 (貼式/手持)", checked: false },
  { id: 18, text: "行李秤重器", checked: false },
  { id: 19, text: "居家收尾 (倒垃圾 & 關電源)", checked: false },
  { id: 20, text: "護照影本 & 大頭照備份", checked: false },
];
