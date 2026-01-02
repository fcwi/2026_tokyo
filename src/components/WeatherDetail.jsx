import React, { useMemo } from "react";
import "./WeatherDetail.css";
import { 
  Wind, Droplets, Sun, Activity, 
  RefreshCw, MapPin, X, Cloud, CloudRain, Snowflake, CloudLightning, CloudFog, Moon,
  Sunrise, Sunset
} from "lucide-react";

// ... (formatHour, formatDay 函式保持不變) ...
const formatDay = (iso) => {
  if (!iso) return "";
  const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return days[new Date(iso).getDay()];
};

// ... (getWeatherStatus 函式保持不變) ...
const getWeatherStatus = (code, isDay = true, theme) => {
  const colors = theme?.weatherIconColors || {
    sun: "text-amber-400",
    moon: "text-indigo-300",
    cloud: "text-gray-400",
    fog: "text-slate-400",
    rain: "text-blue-400",
    snow: "text-cyan-300",
    lightning: "text-yellow-500",
  };

  if (code === undefined || code === null) return { icon: <Cloud size={24} />, label: "未知" };
  if (code === 0) return { icon: isDay ? <Sun size={24} className={colors.sun} /> : <Moon size={24} className={colors.moon} />, label: "晴朗" };
  if ([1, 2, 3].includes(code)) return { icon: <Cloud size={24} className={colors.cloud} />, label: "多雲" };
  if ([45, 48].includes(code)) return { icon: <CloudFog size={24} className={colors.fog} />, label: "有霧" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { icon: <CloudRain size={24} className={colors.rain} />, label: "降雨" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: <Snowflake size={24} className={colors.snow} />, label: "降雪" };
  if ([95, 96, 99].includes(code)) return { icon: <CloudLightning size={24} className={colors.lightning} />, label: "雷雨" };
  return { icon: <Cloud size={24} />, label: "陰天" };
};

const formatTime = (iso) => {
  if (!iso) return "--:--";
  const date = new Date(iso);
  return date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const getMoonPhaseInfo = (date) => {
  if (!date) return { label: "未知", phase: 0 };
  const lp = 2551442.8; // 朔望月週期 (秒)
  const newMoon = new Date("1970-01-07T20:35:00Z").getTime() / 1000;
  const now = new Date(date).getTime() / 1000;
  const phase = ((now - newMoon) % lp) / lp;
  const p = phase < 0 ? phase + 1 : phase;

  let label = "";
  if (p < 0.03 || p > 0.97) label = "新月";
  else if (p < 0.22) label = "眉月";
  else if (p < 0.28) label = "上弦月";
  else if (p < 0.47) label = "盈凸月";
  else if (p < 0.53) label = "滿月";
  else if (p < 0.72) label = "虧凸月";
  else if (p < 0.78) label = "下弦月";
  else label = "殘月";

  return { label, phase: p };
};

const MoonPhaseSvg = ({ phase = 0, size = 20 }) => {
  const r = 9;
  const cx = 12;
  const cy = 12;
  const moonColor = "#fde047"; // 固定月亮黃
  const shadowColor = "#374151"; // 固定深灰色

  // 動態計算月相路徑 (修正後的精確算法)
  const getPath = (p) => {
    if (p <= 0.5) {
      // 盈月 (Waxing): 右側發光
      const rx = Math.abs(r * (1 - 4 * p));
      const sweep = p < 0.25 ? 0 : 1;
      return `M 12 3 A 9 9 0 0 1 12 21 A ${rx} 9 0 0 ${sweep} 12 3`;
    } else {
      // 虧月 (Waning): 左側發光
      const rx = Math.abs(r * (3 - 4 * p));
      const sweep = p < 0.75 ? 0 : 1;
      return `M 12 3 A 9 9 0 0 0 12 21 A ${rx} 9 0 0 ${sweep} 12 3`;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="lucide-moon-phase">
      {/* 背景圓圈 (月球暗面) */}
      <circle cx={cx} cy={cy} r={r} fill={shadowColor} />
      
      {/* 發光部分 (月球亮面) */}
      <path 
        d={getPath(phase)} 
        fill={moonColor} 
        style={{ opacity: (phase > 0.01 && phase < 0.99) ? 1 : 0 }}
      />
      
      {/* 滿月與新月特殊處理 */}
      {phase >= 0.48 && phase <= 0.52 && <circle cx={cx} cy={cy} r={r} fill={moonColor} />}
      {(phase <= 0.01 || phase >= 0.99) && <circle cx={cx} cy={cy} r={r} fill={shadowColor} />}
    </svg>
  );
};

const getTempColor = (temp) => {
  if (temp <= 10) return "#3b82f6"; // 藍色 (冷)
  if (temp <= 20) return "#fbbf24"; // 黃色 (涼)
  if (temp <= 30) return "#f97316"; // 橘色 (暖)
  return "#ef4444"; // 紅色 (熱)
};

const getTempGradient = (min, max) => {
  const c1 = getTempColor(min);
  const c2 = getTempColor(max);
  if (c1 === c2) return c1;
  return `linear-gradient(to right, ${c1}, ${c2})`;
};

const Skeleton = ({ width, height, borderRadius = "4px" }) => (
  <div className="wd-skeleton" style={{ width, height, borderRadius }} />
);

const WeatherDetail = ({ 
  weather, 
  activeDay = -1,
  simulatedDate = new Date(),
  loading = false, 
  onClose, 
  advice,
  isDarkMode = false,
  theme // 外部傳入的主題配置
}) => {
  const isLoading = loading || weather?.loading;

  // 格式化當前天氣數據
  const current = useMemo(() => {
    if (!weather) return null;
    const idx = activeDay === -1 ? 0 : activeDay; 
    const hourly = weather.hourly || {};
    const daily = weather.daily || {};
    
    // 獲取對應索引的數據，若無則回退至索引 0
    const getVal = (arr, i) => (arr && arr[i] !== undefined ? arr[i] : (arr ? arr[0] : null));

    return {
      temp: weather.temp != null ? Math.round(weather.temp) : "--",
      desc: weather.desc || "多雲",
      location: weather.locationName || "未知地點",
      max: getVal(daily.temperature_2m_max, idx) != null ? Math.round(getVal(daily.temperature_2m_max, idx)) : "--",
      min: getVal(daily.temperature_2m_min, idx) != null ? Math.round(getVal(daily.temperature_2m_min, idx)) : "--",
      
      feelsLike: getVal(hourly.apparent_temperature, idx) != null ? Math.round(getVal(hourly.apparent_temperature, idx)) : "--",
      uv: getVal(hourly.uv_index, idx) ?? "--",
      wind: getVal(hourly.wind_speed_10m, idx) != null ? Math.round(getVal(hourly.wind_speed_10m, idx)) : "--",
      precipProb: getVal(hourly.precipitation_probability, idx) ?? 0,
      humidity: getVal(hourly.relative_humidity_2m, idx) ?? "--",

      sunrise: getVal(daily.sunrise, idx) ? formatTime(getVal(daily.sunrise, idx)) : "--:--",
      sunset: getVal(daily.sunset, idx) ? formatTime(getVal(daily.sunset, idx)) : "--:--",
      moonPhase: (activeDay === -1) 
        ? getMoonPhaseInfo(simulatedDate) 
        : (getVal(daily.time, idx) ? getMoonPhaseInfo(getVal(daily.time, idx)) : { label: "未知", phase: 0 }),
    };
  }, [weather, activeDay, simulatedDate]);

  // 處理每小時預報列表 (從當前小時開始抓取 12 筆)
  const hourlyItems = useMemo(() => {
    if (!weather?.hourly?.time) return [];
    const { time, temperature_2m, precipitation_probability, weathercode } = weather.hourly;
    
    const now = new Date();
    const currentHourIndex = time.findIndex(t => {
      const d = new Date(t);
      return d.getDate() === now.getDate() && d.getHours() === now.getHours();
    });
    
    const startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;
    
    return time.slice(startIndex, startIndex + 12).map((t, i) => {
      const originalIndex = startIndex + i;
      
      const hourDate = new Date(t);
      const hour = hourDate.getHours();
      const isDay = hour >= 6 && hour < 18;
      
      const status = getWeatherStatus(weathercode?.[originalIndex], isDay, theme);

      return {
        time: i === 0 ? "現在" : `${hour}時`,
        temp: Math.round(temperature_2m[originalIndex]),
        pop: precipitation_probability?.[originalIndex] || 0,
        status: status
      };
    });
  }, [weather, theme]);

  // 處理未來 7 天預報列表與溫度區間
  const { dailyItems, overallMin, overallMax } = useMemo(() => {
    if (!weather?.daily?.time) return { dailyItems: [], overallMin: 0, overallMax: 0 };
    const { time, temperature_2m_max, temperature_2m_min, weathercode, precipitation_probability_max } = weather.daily;

    const items = time.slice(0, 7).map((t, i) => {
      const status = getWeatherStatus(weathercode?.[i], true, theme);
      return {
        day: i === 0 ? "今天" : formatDay(t),
        max: Math.round(temperature_2m_max[i]),
        min: Math.round(temperature_2m_min[i]),
        pop: precipitation_probability_max?.[i] ?? 0,
        status: status
      };
    });

    const allMin = Math.min(...items.map(i => i.min));
    const allMax = Math.max(...items.map(i => i.max));

    return { dailyItems: items, overallMin: allMin, overallMax: allMax };
  }, [weather, theme]);

  const themeClass = isDarkMode ? "theme-dark" : "theme-light";

  return (
    <div className={`weather-card ${themeClass}`}>
      
      {/* --- 標題區域：地點與當前氣溫 --- */}
      <div className="wc-header-compact">
        <div className="wc-header-main">
          <div className="wc-location-row">
             <MapPin size={14} className="text-accent" /> 
             <span className="wc-loc-name">{isLoading ? <Skeleton width="60px" height="20px" /> : current?.location}</span>
          </div>
          <div className="wc-temp-row">
            <div className="wc-temp-big">
              {isLoading ? <Skeleton width="80px" height="50px" /> : `${current?.temp}°`}
            </div>
            <div className="wc-temp-meta">
               <div className="wc-desc">{current?.desc}</div>
               <div className="wc-hl">
                  <span className={theme?.semanticColors?.red?.[isDarkMode ? 'dark' : 'light'] || 'text-red-500'}>高溫:{current?.max}°</span>
                  <span className={theme?.semanticColors?.blue?.[isDarkMode ? 'dark' : 'light'] || 'text-blue-500'}>低溫:{current?.min}°</span>
               </div>
            </div>
          </div>
        </div>

        <div className="wc-header-actions">
           <button className="wc-icon-btn close" onClick={onClose} title="關閉">
             <X size={18} />
           </button>
        </div>
      </div>

      {/* --- 詳細數據網格 (體感、降雨、紫外線、風速) --- */}
      <div className="wc-grid">
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Activity size={12} /> 體感</div>
          <div className="wc-grid-value">{current?.feelsLike}°</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><CloudRain size={12} /> 降雨</div>
          <div className="wc-grid-value">{current?.precipProb}%</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Droplets size={12} /> 濕度</div>
          <div className="wc-grid-value">{current?.humidity}%</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Sun size={12} /> 紫外線</div>
          <div className="wc-grid-value">{current?.uv}</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Wind size={12} /> 風速</div>
          <div className="wc-grid-value">{current?.wind} <span className="text-[10px]">km/h</span></div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Sunrise size={12} /> 日出</div>
          <div className="wc-grid-value">{current?.sunrise}</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Sunset size={12} /> 日落</div>
          <div className="wc-grid-value">{current?.sunset}</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Moon size={12} /> 月相</div>
          <div className="wc-grid-value flex items-center justify-center h-full">
            <MoonPhaseSvg phase={current?.moonPhase?.phase} size={24} />
          </div>
        </div>
      </div>

      {/* --- 每小時預報橫向滾動列表 --- */}
      <div>
        <div className="wc-section-title"><Activity size={12} /> 每小時預報</div>
        <div className="wc-hourly-scroll">
          {isLoading 
            ? [1,2,3,4,5].map(i => <Skeleton key={i} width="50px" height="90px" />)
            : hourlyItems.map((item, idx) => (
              <div key={idx} className="wc-hour-item">
                <span className="wc-h-time">{item.time}</span>
                <div className="wc-h-icon-wrapper">
                  {item.status.icon}
                </div>
                <span className="wc-h-desc">{item.status.label}</span>
                <span className="wc-h-temp">{item.temp}°</span>
                {item.pop > 0 && (
                  <span className="wc-h-pop">{item.pop}%</span>
                )}
              </div>
            ))
          }
        </div>
      </div>

      {/* --- 未來 7 天預報列表 --- */}
      <div>
        <div className="wc-section-title"><Sun size={12} /> 未來 7 天</div>
        <div className="wc-daily-list">
          {isLoading 
            ? [1,2,3].map(i => <Skeleton key={i} width="100%" height="40px" />)
            : dailyItems.map((item, idx) => (
              <div key={idx} className="wc-day-row">
                <span className="wc-day-name">{item.day}</span>
                <div className="wc-day-status">
                  <span className="wc-day-icon">{item.status.icon}</span>
                  <span className="wc-day-desc">{item.status.label}</span>
                  {item.pop > 10 && (
                     <span className="wc-day-pop"><Droplets size={10} />{item.pop}%</span>
                  )}
                </div>
                <div className="wc-day-temp">
                  <span className="wc-temp-min">{item.min}°</span>
                  <div className="wc-temp-bar">
                    <div 
                      className="wc-temp-bar-inner" 
                      style={{
                        left: `${((item.min - overallMin) / (overallMax - overallMin)) * 100}%`,
                        width: `${((item.max - item.min) / (overallMax - overallMin)) * 100}%`,
                        background: getTempGradient(item.min, item.max)
                      }}
                    />
                    {idx === 0 && current?.temp !== "--" && (
                      <div 
                        className="wc-temp-dot" 
                        style={{
                          left: `${((current.temp - overallMin) / (overallMax - overallMin)) * 100}%`
                        }}
                      />
                    )}
                  </div>
                  <span className="wc-temp-high">{item.max}°</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* --- 底部穿著與活動建議 --- */}
      <div className="wc-footer">
        {advice || "暫無特別建議。"}
      </div>

    </div>
  );
};

export default WeatherDetail;