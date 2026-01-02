import React, { useMemo } from "react";
import "./WeatherDetail.css";
import { 
  Wind, Droplets, Sun, Activity, 
  RefreshCw, MapPin, X, Cloud, CloudRain, Snowflake, CloudLightning, CloudFog, Moon
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

const Skeleton = ({ width, height, borderRadius = "4px" }) => (
  <div className="wd-skeleton" style={{ width, height, borderRadius }} />
);

const WeatherDetail = ({ 
  weather, 
  loading = false, 
  onRefresh, 
  onClose, 
  advice,
  isDarkMode = false,
  theme // 外部傳入的主題配置
}) => {
  const isLoading = loading || weather?.loading;

  // 格式化當前天氣數據
  const current = useMemo(() => {
    if (!weather) return null;
    const idx = 0; 
    const hourly = weather.hourly || {};
    
    return {
      temp: weather.temp != null ? Math.round(weather.temp) : "--",
      desc: weather.desc || "多雲",
      location: weather.locationName || "未知地點",
      max: weather.daily?.temperature_2m_max?.[0] ? Math.round(weather.daily.temperature_2m_max[0]) : "--",
      min: weather.daily?.temperature_2m_min?.[0] ? Math.round(weather.daily.temperature_2m_min[0]) : "--",
      
      feelsLike: hourly.apparent_temperature?.[idx] ? Math.round(hourly.apparent_temperature[idx]) : "--",
      uv: hourly.uv_index?.[idx] ?? "--",
      wind: hourly.wind_speed_10m?.[idx] ? Math.round(hourly.wind_speed_10m[idx]) : "--",
      precipProb: hourly.precipitation_probability?.[idx] ?? 0,
    };
  }, [weather]);

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

  // 處理未來 7 天預報列表
  const dailyItems = useMemo(() => {
    if (!weather?.daily?.time) return [];
    const { time, temperature_2m_max, temperature_2m_min, weathercode, precipitation_probability_max } = weather.daily;

    return time.slice(0, 7).map((t, i) => {
      const status = getWeatherStatus(weathercode?.[i], true, theme);
      return {
        day: i === 0 ? "今天" : formatDay(t),
        max: Math.round(temperature_2m_max[i]),
        min: Math.round(temperature_2m_min[i]),
        pop: precipitation_probability_max?.[i] ?? 0,
        status: status
      };
    });
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
           <button className="wc-icon-btn" onClick={onRefresh} disabled={isLoading} title="更新">
             <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
           </button>
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
          <div className="wc-grid-label"><Droplets size={12} /> 降雨</div>
          <div className="wc-grid-value">{current?.precipProb}%</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Sun size={12} /> 紫外線</div>
          <div className="wc-grid-value">{current?.uv}</div>
        </div>
        <div className="wc-grid-item">
          <div className="wc-grid-label"><Wind size={12} /> 風速</div>
          <div className="wc-grid-value">{current?.wind} <span className="text-[10px]">km/h</span></div>
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
                  <div className="wc-temp-bar"></div>
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