/**
 * 將行程、指南與商店數據扁平化為字串，供 AI 上下文使用
 */
export const flattenItinerary = (data) =>
  data
    .map((day) => {
      const events = day.events
        .map((e) => `  - ${e.time} ${e.title}: ${e.desc}`)
        .join("\n");
      return `📅 ${day.day} (${day.locationKey}):\n${events}`;
    })
    .join("\n\n");

export const flattenGuides = (data) =>
  data.map((g) => `📘 ${g.title}: ${g.summary}`).join("\n");

export const flattenShops = (data) =>
  data
    .map((area) => {
      const shops = area.mainShops
        .map((s) => `  * ${s.name}: ${s.note}`)
        .join("\n");
      return `🛍️ ${area.area}:\n${shops}`;
    })
    .join("\n\n");

/**
 * 正則表達式處理工具
 */
export const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 天氣 WMO 代碼對應邏輯 (純數據版)
 */
export const getWeatherData = (code) => {
  if (code === 0) return { text: "晴朗", advice: "天氣很好，注意防曬。" };
  if ([1, 2, 3].includes(code)) return { text: "多雲", advice: "舒適，適合戶外。" };
  if ([45, 48].includes(code)) return { text: "有霧", advice: "能見度低請小心。" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { text: "有雨", advice: "請務必攜帶雨具。" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "降雪", advice: "請穿防滑雪靴。" };
  if ([95, 96, 99].includes(code)) return { text: "雷雨", advice: "請盡量待在室內。" };
  return { text: "晴時多雲", advice: "注意日夜溫差。" };
};

/**
 * [新增] 根據經緯度與 POI 資訊構建分享文字
 */
export const buildShareTextLogic = (latitude, longitude, landmark) => {
  const baseMessage = `我在這裡${landmark ? ` (靠近 ${landmark})` : ""}！`;
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  return {
    baseMessage,
    fullText: `${baseMessage}\n點擊查看位置：${mapUrl}`
  };
};

/**
 * [新增] 取得特定天數的預設地點 Key
 */
export const getDailyLocationKey = (dayIndex, itineraryData, tripConfig) => {
  if (dayIndex === -1 || !itineraryData[dayIndex]) {
    return tripConfig.locations[0].key;
  }
  return itineraryData[dayIndex].locationKey || tripConfig.locations[0].key;
};

/**
 * [新增] AI 歡迎訊息範本
 */
export const getAiWelcomeTemplate = (mode, tripConfig) => {
  const { name, label } = tripConfig.language;
  if (mode === "translate") {
    return {
      id: `welcome_translate_${Date.now()}`,
      role: "model",
      text: `您好！我是您的隨身 AI 口譯員 🌍\n\n💡 口譯模式功能：\n🎤 點「中」說話：我會將中文翻成${name} (附拼音)。\n🎤 點「${label}」說話：錄下對方說的${name}，我會直接翻成中文！`,
    };
  }
  return {
    id: `welcome_guide_${Date.now()}`,
    role: "model",
    text: `您好！我是您的專屬 AI 導遊 ✨\n我已經熟讀了您的行程。\n\n💡 導遊模式功能：\n🎤 點「中」說話：您可以詢問行程細節、交通方式或周邊推薦。`,
  };
};

/**
 * [新增] 計算天氣預報索引
 * 
 * 根據行程狀態動態計算應該使用的天氣預報陣列索引
 * 
 * @param {number} activeDay - 當前查看的行程天數（-1 為總覽頁，0-N 為各天行程）
 * @param {string} tripStatus - 行程狀態（'before' | 'during' | 'after'）
 * @param {number} currentTripDayIndex - 當前行程天數索引（行程中第幾天，從 0 開始）
 * @returns {number} 預報陣列的索引（0=今天，1=明天，2=後天...）
 * 
 * @example
 * // 行程前：Day 3 顯示行程第 3 天的預報
 * getWeatherForecastIndex(2, 'before', -1) // => 2
 * 
 * // 行程中第 3 天查看 Day 1：顯示當天天氣
 * getWeatherForecastIndex(0, 'during', 2) // => 0
 * 
 * // 行程中第 3 天查看 Day 4：顯示明天預報
 * getWeatherForecastIndex(3, 'during', 2) // => 1
 * 
 * // 行程後查看任何 Day：顯示當天天氣
 * getWeatherForecastIndex(3, 'after', -1) // => 0
 */
export const getWeatherForecastIndex = (activeDay, tripStatus, currentTripDayIndex) => {
  // 總覽頁不使用此函式（由其他邏輯處理）
  if (activeDay === -1) {
    return 0;
  }
  
  // 行程前：直接使用 activeDay 作為索引
  // 例如：Day 1 顯示索引 [0]，Day 2 顯示索引 [1]
  if (tripStatus === 'before') {
    return activeDay;
  }
  
  // 行程中：計算相對於今天的偏移
  // 例如：今天是行程第 3 天（currentTripDayIndex = 2）
  //   - 查看 Day 1: offset = 0 - 2 = -2 => Math.max(0, -2) = 0（當天）
  //   - 查看 Day 3: offset = 2 - 2 = 0 => Math.max(0, 0) = 0（今天）
  //   - 查看 Day 4: offset = 3 - 2 = 1 => Math.max(0, 1) = 1（明天）
  if (tripStatus === 'during') {
    const offset = activeDay - currentTripDayIndex;
    return Math.max(0, offset);
  }
  
  // 行程後：所有天數都顯示當天天氣
  if (tripStatus === 'after') {
    return 0;
  }
  
  // 預設回傳 0（保險起見）
  return 0;
};