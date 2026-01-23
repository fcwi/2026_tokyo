import React, { memo } from "react";
import { LocateFixed, ExternalLink, RotateCcw, Loader } from "lucide-react";
import {
  getWeatherData,
  getDailyLocationKey,
} from "../utils/itineraryHelpers.js";

const WeatherCard = memo(
  ({
    isDarkMode,
    theme,
    componentStyles,
    userWeather,
    handleWeatherDetailOpen,
    getUserLocationWeather,
    isUpdatingLocation,
    isTestMode,
    testDateTime,
    getWeatherInfo,
    tripStatus,
    currentTripDayIndex,
    itineraryData,
    tripConfig,
    weatherForecast,
  }) => {
    return (
      <div
        className={`backdrop-blur-xl border rounded-[1.5rem] p-4 transition-all duration-300 relative overflow-hidden ${isDarkMode ? "bg-slate-900/50 border-white/20 ring-1 ring-white/5 shadow-xl shadow-black/10" : "bg-white/75 border-white/60 ring-1 ring-black/5 shadow-xl shadow-black/10"} ${componentStyles.itineraryCard}`}
        style={theme.ambientStyle}
      >
        {/* --- 總覽頁面：即時天氣與預報卡片 --- */}
        {/* 上半部：目前天氣與地點資訊 */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            {/* 目前氣溫 */}
            <div
              className={`text-5xl font-medium tracking-tighter drop-shadow-sm ${theme.text}`}
              style={{
                textShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {userWeather.temp !== null ? userWeather.temp : "--"}°
            </div>

            {/* 地點與天氣描述 */}
            <div className="flex flex-col justify-center gap-0.5">
              <div
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-90 ${theme.textSec}`}
              >
                <LocateFixed className={`w-3.5 h-3.5 ${theme.accent}`} />{" "}
                <span className="flex items-center gap-1">
                  {userWeather.locationName}
                  <button
                    onClick={handleWeatherDetailOpen}
                    className={`ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95 ${
                      isDarkMode
                        ? "bg-white/10 text-white/90 hover:bg-white/20 ring-1 ring-white/10"
                        : "bg-black/5 text-stone-600 hover:bg-black/10 ring-1 ring-black/5"
                    }`}
                    title="查看詳細氣象資訊"
                  >
                    <span className="text-[10px] font-bold">詳細天氣資訊</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-base font-bold leading-tight drop-shadow-sm ${theme.text}`}
                >
                  {userWeather.desc || "載入中"}
                </span>
                <span className={`text-xs font-medium mt-0.5 ${theme.textSec}`}>
                  {userWeather.daily?.temperature_2m_max?.[0] !== undefined &&
                  userWeather.daily?.temperature_2m_min?.[0] !== undefined
                    ? `高溫:${Math.round(userWeather.daily.temperature_2m_max[0])}°  低溫:${Math.round(userWeather.daily.temperature_2m_min[0])}°`
                    : userWeather.temp !== null
                      ? `高溫:${userWeather.temp + 4}°  低溫:${userWeather.temp - 2}°`
                      : ""}
                </span>
              </div>
            </div>
          </div>

          {/* 手動更新位置與天氣 */}
          <button
            onClick={() =>
              getUserLocationWeather({
                isSilent: false,
                highAccuracy: false,
              })
            }
            disabled={isUpdatingLocation}
            className={`p-2 rounded-full border transition-all active:scale-95 flex-shrink-0 backdrop-blur-md shadow-md ${isUpdatingLocation ? "opacity-50" : ""} ${isDarkMode ? "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30 text-white" : "bg-black/5 border-black/10 hover:bg-black/10 hover:border-black/20 text-stone-600"}`}
          >
            {isUpdatingLocation ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 中間：每 2 小時預報 (緊湊版) */}
        <div className={`w-full overflow-x-auto pb-1 mb-1 scrollbar-hide`}>
          <div className="flex justify-between items-center px-0.5">
            {[0, 2, 4, 6, 8, 10, 12].map((offset, i) => {
              const displayTime = isTestMode
                ? new Date(testDateTime)
                : new Date();
              const currentHour = displayTime.getHours();
              const targetIndex = currentHour + offset;
              const hourDataTemp =
                userWeather.hourly?.temperature_2m?.[targetIndex];
              const hourDataCode =
                userWeather.hourly?.weathercode?.[targetIndex];
              let timeLabel =
                i === 0 ? "現在" : `${(currentHour + offset) % 24}時`;
              const icon =
                hourDataCode !== undefined ? (
                  getWeatherInfo(hourDataCode).icon
                ) : (
                  <Loader className="w-3.5 h-3.5 animate-spin opacity-50" />
                );

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-0.5 min-w-0 px-0.5 py-1 rounded-xl hover:bg-black/5 hover:backdrop-blur-md transition-all group flex-1 cursor-pointer"
                >
                  <span
                    className={`text-[9px] font-bold opacity-70 group-hover:opacity-100 whitespace-nowrap ${theme.textSec}`}
                  >
                    {timeLabel}
                  </span>

                  <div className="transform transition-transform group-hover:scale-110 drop-shadow-sm scale-90">
                    {icon}
                  </div>

                  <span className={`text-xs font-bold ${theme.text}`}>
                    {hourDataTemp !== undefined
                      ? `${Math.round(hourDataTemp)}°`
                      : "--"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 下半部：智慧行程預報 (溫差比對與穿著建議) */}
        <div
          className={`mt-2 pt-2.5 border-t flex flex-col justify-center min-h-[36px] ${isDarkMode ? "border-white/15" : "border-black/5"}`}
        >
          {userWeather.temp !== null ? (
            (() => {
              let targetDayIndex = 0;
              let targetName = "抵達首站";

              if (tripStatus === "during") {
                if (currentTripDayIndex >= itineraryData.length - 1) {
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
                const firstLocKey = getDailyLocationKey(
                  0,
                  itineraryData,
                  tripConfig,
                );
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

              const targetLoc = getDailyLocationKey(
                targetDayIndex,
                itineraryData,
                tripConfig,
              );
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

              const destMax = forecast.temperature_2m_max[targetDayIndex];
              const destMin = forecast.temperature_2m_min[targetDayIndex];
              const destAvg = (destMax + destMin) / 2;
              const destCode = forecast.weathercode[targetDayIndex];

              const diff = destAvg - userWeather.temp;
              const absDiff = Math.abs(diff).toFixed(0);
              const isColder = diff < 0;
              const weatherInfo = getWeatherData(destCode);

              let advicePart = "";
              const isRainy = [
                51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99,
              ].includes(destCode);
              const isSnowy = [71, 73, 75, 77, 85, 86].includes(destCode);

              if (Math.abs(diff) < 2) {
                advicePart = "溫差不大，穿著可參考目前";
              } else if (isColder) {
                advicePart = "請加強保暖";
              } else {
                advicePart = "建議穿著輕便";
              }

              if (isRainy) advicePart += "並攜帶雨具";
              else if (isSnowy) advicePart += "並穿著防滑鞋";

              return (
                <div className="flex items-center gap-2.5 animate-fadeIn">
                  <div
                    className={`px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap tracking-wide backdrop-blur-md ${isDarkMode ? "bg-white/15 text-neutral-300 ring-1 ring-white/10" : "bg-black/8 text-stone-600 ring-1 ring-black/5"}`}
                  >
                    {targetName}
                  </div>

                  <p
                    className={`text-xs leading-relaxed font-medium ${theme.textSec}`}
                  >
                    天氣為
                    <span className={`font-bold mx-0.5 ${theme.text}`}>
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
            <p className={`text-xs text-center opacity-70 ${theme.textSec}`}>
              <Loader className="w-3 h-3 inline mr-1 animate-spin" />
              定位中，稍後將為您比對溫差...
            </p>
          )}
        </div>
      </div>
    );
  },
);

export default WeatherCard;
