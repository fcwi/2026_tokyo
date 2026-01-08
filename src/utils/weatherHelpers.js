// 這些是從你的 App.jsx 抽離出來的純函數
export const getParticleType = (code, isDark) => {
  if (code === null || code === undefined) return null;
  if (code === 0 && isDark) return "stars";
  if ([45, 48].includes(code)) return "fog";
  if ([95, 96, 99].includes(code)) return "lightning";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  return null;
};

export const getSkyCondition = (code) => {
  if (code === null || code === undefined) return "clear";
  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "rain";
};