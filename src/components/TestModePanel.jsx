import React, { useState, useCallback } from "react";
import {
  X,
  Calendar,
  MapPin,
  Cloud,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Info,
} from "lucide-react";
import MapPicker from "./MapPicker.jsx";

// 🆕 讀取構建版本號
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || "開發模式";

/**
 * TestModePanel Component
 *
 * A developer-only panel for simulating different scenarios:
 * 1. Time/Date: Test itinerary logic for different days/times.
 * 2. Location: Test weather and landmark detection for different coordinates.
 * 3. Weather: Override real-time weather data with specific codes.
 * 4. Freeze: Lock settings to prevent them from being overwritten by real data.
 */
const TestModePanel = ({
  isOpen,
  onClose,
  testDateTime,
  onDateTimeChange,
  testLatitude,
  testLongitude,
  onLocationChange,
  testWeatherOverride,
  onWeatherChange,
  theme, // currentTheme object from App.jsx
  isDarkMode,
  itineraryData,
  currentUserWeather, // Current real-time weather data for reference
  isFrozen = false,
  onFreeze = () => {},
  onUnfreeze = () => {},
}) => {
  const [expandedWeatherSection, setExpandedWeatherSection] =
    useState("overview");

  // 🆕 臨時狀態（只有點擊儲存才提交）
  const [tempDateTime, setTempDateTime] = useState(testDateTime);
  const [tempLatitude, setTempLatitude] = useState(testLatitude);
  const [tempLongitude, setTempLongitude] = useState(testLongitude);
  const [tempWeatherOverride, setTempWeatherOverride] =
    useState(testWeatherOverride);

  // 🆕 Memoize location change handler to prevent MapPicker re-renders
  const handleMapLocationChange = useCallback((loc) => {
    setTempLatitude(loc.lat);
    setTempLongitude(loc.lon);
  }, []);

  if (!isOpen) return null;

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setTempDateTime(newDate);
  };

  const handleTimeChange = (e) => {
    const newDate = new Date(tempDateTime);
    const [hours, minutes] = e.target.value.split(":").map(Number);
    newDate.setHours(hours, minutes);
    setTempDateTime(newDate);
  };

  const handleLatChange = (e) => {
    const lat = parseFloat(e.target.value);
    if (!isNaN(lat)) {
      setTempLatitude(lat);
    }
  };

  const handleLonChange = (e) => {
    const lon = parseFloat(e.target.value);
    if (!isNaN(lon)) {
      setTempLongitude(lon);
    }
  };

  const handleWeatherCodeChange = (section, dayIndex, code) => {
    const newOverride = { ...tempWeatherOverride };
    if (section === "overview") {
      newOverride.overview = code === null ? null : parseInt(code);
    } else {
      newOverride.days = {
        ...newOverride.days,
        [dayIndex]: code === null ? null : parseInt(code),
      };
    }
    setTempWeatherOverride(newOverride);
  };

  // 🆕 儲存按鈕邏輯
  const handleSave = () => {
    onDateTimeChange(tempDateTime);
    onLocationChange({ lat: tempLatitude, lon: tempLongitude });
    onWeatherChange(tempWeatherOverride);
  };

  const getWeatherName = (code) => {
    if (code === null || code === undefined) return "自動";
    if (code === 0) return "晴朗";
    if ([1, 2, 3].includes(code)) return "多雲";
    if ([45, 48].includes(code)) return "有霧";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "下雨";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "下雪";
    if ([95, 96, 99].includes(code)) return "雷雨";
    return "未知";
  };

  const dateStr = tempDateTime.toISOString().split("T")[0];
  const timeStr = `${String(tempDateTime.getHours()).padStart(2, "0")}:${String(tempDateTime.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-end">
      <div
        className={`w-full rounded-t-3xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${theme.cardBg} ${theme.cardBorder} border-t border-l border-r`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b ${isDarkMode ? "border-neutral-700/50 bg-neutral-900/40" : "border-stone-200/50 bg-white/30"} backdrop-blur-sm`}
        >
          <h2
            className={`text-lg font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDarkMode ? "bg-neutral-800/60" : "bg-white/40"} backdrop-blur-md ${theme.text}`}
          >
            <span>🧪</span>
            <span>測試模式</span>
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-neutral-700" : "hover:bg-stone-200"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 🔒 凍結狀態提示 */}
        {isFrozen && (
          <div
            className={`px-4 py-3 border-b ${isDarkMode ? "bg-blue-900/30 border-blue-700/50" : "bg-blue-100/50 border-blue-300"}`}
          >
            <p
              className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}
            >
              🔒 <span>測試設定已凍結 - 修改不會被其他操作覆蓋</span>
            </p>
          </div>
        )}

        <div className="p-4 space-y-6">
          {/* 1. 日期時間調整 */}
          <div className="space-y-3">
            <h3
              className={`text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${isDarkMode ? "bg-neutral-800/60" : "bg-white/40"} backdrop-blur-md ${theme.text}`}
            >
              <Calendar className="w-4 h-4" /> 日期與時間
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="testModeDate"
                  className={`text-xs font-medium block mb-1 ${theme.textSec}`}
                >
                  日期
                </label>
                <input
                  type="date"
                  id="testModeDate"
                  name="testModeDate"
                  value={dateStr}
                  onChange={handleDateChange}
                  className={`w-full px-3 py-2 rounded-lg border text-base ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-stone-300"}`}
                />
              </div>
              <div>
                <label
                  htmlFor="testModeTime"
                  className={`text-xs font-medium block mb-1 ${theme.textSec}`}
                >
                  時間
                </label>
                <input
                  type="time"
                  id="testModeTime"
                  name="testModeTime"
                  value={timeStr}
                  onChange={handleTimeChange}
                  className={`w-full px-3 py-2 rounded-lg border text-base ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-stone-300"}`}
                />
              </div>
            </div>
            <div
              className={`text-xs p-2 rounded-lg border ${isDarkMode ? "bg-neutral-900/50 border-neutral-700" : "bg-stone-100 border-stone-300"}`}
            >
              <div className={`font-bold mb-1 ${theme.text}`}>當前時間</div>
              <div className={theme.textSec}>
                {tempDateTime.toLocaleString("zh-TW")}
              </div>
            </div>
          </div>

          {/* 2. 經緯度調整 */}
          <div className="space-y-3">
            <h3
              className={`text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${isDarkMode ? "bg-neutral-800/60" : "bg-white/40"} backdrop-blur-md ${theme.text}`}
            >
              <MapPin className="w-4 h-4" /> 位置座標
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="testModeLatitude"
                  className={`text-xs font-medium block mb-1 ${theme.textSec}`}
                >
                  緯度
                </label>
                <input
                  type="number"
                  id="testModeLatitude"
                  name="testModeLatitude"
                  step="0.0001"
                  value={tempLatitude}
                  onChange={handleLatChange}
                  className={`w-full px-3 py-2 rounded-lg border text-base ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-stone-300"}`}
                />
              </div>
              <div>
                <label
                  htmlFor="testModeLongitude"
                  className={`text-xs font-medium block mb-1 ${theme.textSec}`}
                >
                  經度
                </label>
                <input
                  type="number"
                  id="testModeLongitude"
                  name="testModeLongitude"
                  step="0.0001"
                  value={tempLongitude}
                  onChange={handleLonChange}
                  className={`w-full px-3 py-2 rounded-lg border text-base ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-stone-300"}`}
                />
              </div>
            </div>
            {/* 🆕 顯示當前位置資訊 */}
            <div
              className={`text-xs p-2 rounded-lg border ${isDarkMode ? "bg-neutral-900/50 border-neutral-700" : "bg-stone-100 border-stone-300"}`}
            >
              <div className={`font-bold mb-1 ${theme.text}`}>
                當前位置 (Raw Data)
              </div>
              <div className={theme.textSec}>
                <div>📍 {currentUserWeather?.locationName || "未知"}</div>
                <div>🏷️ {currentUserWeather?.landmark || "無地標"}</div>
                <div>
                  🧭 {currentUserWeather?.lat?.toFixed(4) || "--"},{" "}
                  {currentUserWeather?.lon?.toFixed(4) || "--"}
                </div>
              </div>
            </div>

            {/* 🆕 互動式地圖 */}
            <MapPicker
              latitude={tempLatitude}
              longitude={tempLongitude}
              onLocationChange={handleMapLocationChange}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* 3. 天氣覆蓋 */}
          <div className="space-y-3">
            <h3
              className={`text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${isDarkMode ? "bg-neutral-800/60" : "bg-white/40"} backdrop-blur-md ${theme.text}`}
            >
              <Cloud className="w-4 h-4" /> 天氣覆蓋
            </h3>

            {/* 🆕 顯示當前天氣資訊 */}
            <div
              className={`text-xs p-2 rounded-lg border ${isDarkMode ? "bg-neutral-900/50 border-neutral-700" : "bg-stone-100 border-stone-300"}`}
            >
              <div className={`font-bold mb-1 ${theme.text}`}>
                當前天氣 (Raw Data)
              </div>
              <div className={theme.textSec}>
                <div>
                  🌡️{" "}
                  {currentUserWeather?.temp !== null
                    ? `${currentUserWeather.temp}°C`
                    : "--"}
                </div>
                <div>☁️ {currentUserWeather?.desc || "未知"}</div>
                <div>
                  📊 代碼:{" "}
                  {currentUserWeather?.weatherCode !== null
                    ? currentUserWeather.weatherCode
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* 總覽天氣 */}
            <div
              className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                expandedWeatherSection === "overview"
                  ? isDarkMode
                    ? "bg-neutral-800"
                    : "bg-stone-100"
                  : isDarkMode
                    ? "bg-neutral-900/50"
                    : "bg-white/50"
              }`}
              onClick={() =>
                setExpandedWeatherSection(
                  expandedWeatherSection === "overview" ? null : "overview",
                )
              }
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${theme.text}`}>
                  總覽天氣
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${isDarkMode ? "bg-neutral-700" : "bg-stone-200"}`}
                  >
                    {getWeatherName(tempWeatherOverride.overview)}
                  </span>
                  {expandedWeatherSection === "overview" ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              {expandedWeatherSection === "overview" && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[0, 1, 2, 3, 45, 48, 51, 55, 71, 75, 95].map((code) => (
                    <button
                      key={code}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWeatherCodeChange("overview", null, code);
                      }}
                      className={`py-2 px-2 rounded text-xs font-bold transition-colors ${
                        tempWeatherOverride.overview === code
                          ? isDarkMode
                            ? "bg-sky-600 text-white"
                            : "bg-sky-400 text-white"
                          : isDarkMode
                            ? "bg-neutral-700 hover:bg-neutral-600"
                            : "bg-stone-200 hover:bg-stone-300"
                      }`}
                    >
                      {getWeatherName(code)}
                    </button>
                  ))}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWeatherCodeChange("overview", null, null);
                    }}
                    className={`py-2 px-2 rounded text-xs font-bold transition-colors ${
                      tempWeatherOverride.overview === null
                        ? isDarkMode
                          ? "bg-sky-600 text-white"
                          : "bg-sky-400 text-white"
                        : isDarkMode
                          ? "bg-neutral-700 hover:bg-neutral-600"
                          : "bg-stone-200 hover:bg-stone-300"
                    }`}
                  >
                    自動
                  </button>
                </div>
              )}
            </div>

            {/* 各日天氣 */}
            {itineraryData.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                  expandedWeatherSection === `day-${dayIndex}`
                    ? isDarkMode
                      ? "bg-neutral-800"
                      : "bg-stone-100"
                    : isDarkMode
                      ? "bg-neutral-900/50"
                      : "bg-white/50"
                }`}
                onClick={() =>
                  setExpandedWeatherSection(
                    expandedWeatherSection === `day-${dayIndex}`
                      ? null
                      : `day-${dayIndex}`,
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${theme.text}`}>
                    {day.day}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${isDarkMode ? "bg-neutral-700" : "bg-stone-200"}`}
                    >
                      {getWeatherName(
                        tempWeatherOverride.days[dayIndex] || null,
                      )}
                    </span>
                    {expandedWeatherSection === `day-${dayIndex}` ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
                {expandedWeatherSection === `day-${dayIndex}` && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 45, 48, 51, 55, 71, 75, 95].map((code) => (
                      <button
                        key={code}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeatherCodeChange("day", dayIndex, code);
                        }}
                        className={`py-2 px-2 rounded text-xs font-bold transition-colors ${
                          tempWeatherOverride.days[dayIndex] === code
                            ? isDarkMode
                              ? "bg-sky-600 text-white"
                              : "bg-sky-400 text-white"
                            : isDarkMode
                              ? "bg-neutral-700 hover:bg-neutral-600"
                              : "bg-stone-200 hover:bg-stone-300"
                        }`}
                      >
                        {getWeatherName(code)}
                      </button>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWeatherCodeChange("day", dayIndex, null);
                      }}
                      className={`py-2 px-2 rounded text-xs font-bold transition-colors ${
                        !tempWeatherOverride.days[dayIndex]
                          ? isDarkMode
                            ? "bg-sky-600 text-white"
                            : "bg-sky-400 text-white"
                          : isDarkMode
                            ? "bg-neutral-700 hover:bg-neutral-600"
                            : "bg-stone-200 hover:bg-stone-300"
                      }`}
                    >
                      自動
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 🆕 版本資訊 */}
          <div
            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${isDarkMode ? "bg-neutral-800/40 text-neutral-400" : "bg-white/40 text-stone-500"}`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>構建版本：{BUILD_VERSION}</span>
          </div>

          {/* 🆕 底部按鈕組：儲存 + 凍結 + 退出 */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${isDarkMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-500 hover:bg-emerald-600"}`}
              >
                <Save className="w-4 h-4" />
                儲存變更
              </button>
              {/* 🔒 凍結/解凍按鈕 */}
              <button
                onClick={isFrozen ? onUnfreeze : onFreeze}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${
                  isFrozen
                    ? isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-500 hover:bg-blue-600"
                    : isDarkMode
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                {isFrozen ? "🔓 解凍設定" : "🔒 凍結設定"}
              </button>
            </div>
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"}`}
            >
              退出測試模式
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestModePanel;
