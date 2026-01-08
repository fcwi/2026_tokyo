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
      role: "model",
      text: `您好！我是您的隨身 AI 口譯員 🌍\n\n💡 口譯模式功能：\n🎤 點「中」說話：我會將中文翻成${name} (附拼音)。\n🎤 點「${label}」說話：錄下對方說的${name}，我會直接翻成中文！`,
    };
  }
  return {
    role: "model",
    text: `您好！我是您的專屬 AI 導遊 ✨\n我已經熟讀了您的行程。\n\n💡 導遊模式功能：\n🎤 點「中」說話：您可以詢問行程細節、交通方式或周邊推薦。`,
  };
};