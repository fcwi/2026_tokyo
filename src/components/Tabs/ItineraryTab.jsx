import React, { Suspense, useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  ExternalLink,
  Clock,
  MapPin,
  Hotel,
  Star,
  Info,
  AlertCircle,
  Train,
  Map,
  Navigation,
  Plane,
  ArrowRight,
  History,
  LayoutDashboard,
} from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import DayMap from "../DayMap.jsx";
import FlightInfoCard from "../FlightInfoCard.jsx";
import ChecklistCard from "../ChecklistCard.jsx";
import WeatherCard from "../WeatherCard.jsx";

const ItineraryTab = ({
  activeDay,
  changeDay,
  direction,
  slideVariants,
  navContainerRef,
  navItemsRef,
  itineraryData,
  isDarkMode,
  theme,
  componentStyles,
  tripConfig,
  tripStatus,
  daysUntilTrip,
  checklistData,
  currentTripDayIndex,
  weatherForecast,
  userWeather,
  displayWeather,
  isFlightInfoExpanded,
  setIsFlightInfoExpanded,
  handleCopy,
  expandedItems,
  toggleExpand,
  getMapLink,
  colors,
  currentTheme,
  handleWeatherDetailOpen,
  isUpdatingLocation,
  isTestMode,
  testDateTime,
  getWeatherInfo,
  getUserLocationWeather,
  handleMapModalToggle,
  scrollContainerRef,
  onTouchStart,
  onTouchEnd,
  pullDistance,
  isRefreshing,
  current,
  currentLocation,
  dayMapEvents,
}) => {
  // 滑動方向追蹤狀態
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isHorizontalSwipeRef = useRef(null);

  // 包裝 onTouchStart - 同時記錄起始位置
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isHorizontalSwipeRef.current = null;
    setSwipeDirection(null);
    setSwipeDistance(0);
    // 調用原始的 onTouchStart
    if (onTouchStart) onTouchStart(e);
  };

  // 新增 onTouchMove - 追蹤滑動方向
  const handleTouchMove = (e) => {
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const diffX = touchCurrentX - touchStartRef.current.x;
    const diffY = Math.abs(touchCurrentY - touchStartRef.current.y);
    const absDiffX = Math.abs(diffX);

    // 判斷是否為水平滑動
    if (
      isHorizontalSwipeRef.current === null &&
      (absDiffX > 10 || diffY > 10)
    ) {
      isHorizontalSwipeRef.current = absDiffX > diffY;
    }

    // 更新滑動方向和距離
    if (isHorizontalSwipeRef.current && absDiffX > 20) {
      setSwipeDirection(diffX < 0 ? "left" : "right");
      setSwipeDistance(Math.min(absDiffX, 150));
    }
  };

  // 包裝 onTouchEnd - 重置狀態
  const handleTouchEnd = (e) => {
    setSwipeDirection(null);
    setSwipeDistance(0);
    isHorizontalSwipeRef.current = null;
    // 調用原始的 onTouchEnd
    if (onTouchEnd) onTouchEnd(e);
  };

  return (
    <div
      className="flex-1 space-y-5 px-4 pb-32 overflow-x-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={scrollContainerRef}
      style={{
        willChange: "scroll-position",
        transform: "translateZ(0)",
        WebkitPerspective: "1000px",
        perspective: "1000px",
      }}
    >
      {/* 滑動箭頭指示器 - 往左滑時顯示右側箭頭 */}
      <div
        className={`fixed right-2 top-1/2 z-50 pointer-events-none transition-all duration-200 ${
          swipeDirection === "left"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75"
        }`}
        style={{
          transform: `translateY(-50%) translateX(${swipeDirection === "left" ? -swipeDistance * 0.3 : 0}px)`,
        }}
      >
        <div
          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "bg-sky-500/90 ring-1 ring-sky-400/30"
              : "bg-sky-500/90 ring-1 ring-sky-400/50"
          }`}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* 滑動箭頭指示器 - 往右滑時顯示左側箭頭 */}
      <div
        className={`fixed left-2 top-1/2 z-50 pointer-events-none transition-all duration-200 ${
          swipeDirection === "right"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75"
        }`}
        style={{
          transform: `translateY(-50%) translateX(${swipeDirection === "right" ? swipeDistance * 0.3 : 0}px)`,
        }}
      >
        <div
          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "bg-sky-500/90 ring-1 ring-sky-400/30"
              : "bg-sky-500/90 ring-1 ring-sky-400/50"
          }`}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </div>
      </div>
      {/* 下拉重新整理指示器 */}
      <div
        className="fixed top-0 left-0 w-full flex justify-center pointer-events-none z-[100] transition-opacity duration-300"
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: pullDistance > 20 ? 1 : 0,
        }}
      >
        <div
          className={`p-2 rounded-full shadow-lg backdrop-blur-md border ${componentStyles.itineraryCard}`}
        >
          <RotateCcw
            className={`w-5 h-5 ${theme.accent} ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>

      {/* 天數導覽列 */}
      <div
        ref={navContainerRef}
        className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide py-1 px-1 relative z-10"
      >
        <button
          ref={(el) => (navItemsRef.current[-1] = el)}
          onClick={() => changeDay(-1)}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border backdrop-blur-xl flex items-center gap-1.5 active:scale-95 hover:scale-105
            ${
              activeDay === -1
                ? `${theme.accentBg} ${theme.accent} ${isDarkMode ? "border-white/10" : "border-amber-300/50"} scale-105 shadow-md`
                : `${theme.navBtnStyle} ${theme.textSec} hover:bg-stone-200/90 hover:shadow-md`
            }`}
        >
          <LayoutDashboard className="w-4 h-4" /> 總覽
        </button>

        {itineraryData.map((data, index) => (
          <button
            key={index}
            ref={(el) => (navItemsRef.current[index] = el)}
            onClick={() => changeDay(index)}
            aria-label={`查看${data.day}`}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border backdrop-blur-xl active:scale-95 hover:scale-105
              ${
                activeDay === index
                  ? `${theme.accentBg} ${theme.text} ${isDarkMode ? "border-white/10" : "border-amber-300/50"} scale-105 shadow-md`
                  : `${theme.navBtnStyle} ${theme.textSec} hover:bg-stone-200/90 hover:shadow-md`
              }`}
          >
            {data.day}
          </button>
        ))}
      </div>

      {/* Animation Wrapper */}
      <div
        className="relative w-full h-full"
        style={{
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          isolation: "isolate",
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {activeDay === -1 ? (
            <motion.div
              key="overview"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              <WeatherCard
                isDarkMode={isDarkMode}
                theme={theme}
                componentStyles={componentStyles}
                userWeather={userWeather}
                handleWeatherDetailOpen={handleWeatherDetailOpen}
                getUserLocationWeather={getUserLocationWeather}
                isUpdatingLocation={isUpdatingLocation}
                isTestMode={isTestMode}
                testDateTime={testDateTime}
                getWeatherInfo={getWeatherInfo}
                tripStatus={tripStatus}
                currentTripDayIndex={currentTripDayIndex}
                itineraryData={itineraryData}
                tripConfig={tripConfig}
                weatherForecast={weatherForecast}
              />

              <FlightInfoCard
                isDarkMode={isDarkMode}
                theme={theme}
                colors={colors}
                tripConfig={tripConfig}
                isFlightInfoExpanded={isFlightInfoExpanded}
                setIsFlightInfoExpanded={setIsFlightInfoExpanded}
                handleCopy={handleCopy}
              />

              {tripStatus === "before" && (
                <div
                  className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${componentStyles.itineraryCard}`}
                  style={theme.ambientStyle}
                >
                  <div className="text-center mb-5">
                    <div
                      className={`text-base font-bold mb-1 tracking-wide drop-shadow-sm ${theme.text}`}
                    >
                      距離{tripConfig.title}還有
                    </div>
                    <div
                      className={`text-5xl font-black tracking-tight drop-shadow-sm flex justify-center items-baseline gap-2 ${theme.accent}`}
                      style={{
                        textShadow: isDarkMode
                          ? "0 2px 4px rgba(0,0,0,0.3)"
                          : "none",
                      }}
                    >
                      {daysUntilTrip}{" "}
                      <span className={`text-lg font-bold ${theme.textSec}`}>
                        天
                      </span>
                    </div>
                  </div>
                  <ChecklistCard
                    isDarkMode={isDarkMode}
                    theme={theme}
                    colors={colors}
                    initialData={checklistData}
                  />
                </div>
              )}

              {tripStatus === "during" && currentTripDayIndex >= 0 && (
                <div
                  className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${componentStyles.itineraryCard}`}
                  style={theme.ambientStyle}
                >
                  <div
                    className={`flex items-center justify-between mb-4 border-b pb-3 ${isDarkMode ? "border-neutral-700/50" : "border-stone-200/50"}`}
                  >
                    <div>
                      <div
                        className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-1 ${theme.accent} ${theme.accentBg}`}
                      >
                        旅途中
                      </div>
                      <h2
                        className={`text-2xl font-bold drop-shadow-sm ${theme.text}`}
                        style={{
                          textShadow: isDarkMode
                            ? "0 2px 4px rgba(0,0,0,0.3)"
                            : "none",
                        }}
                      >
                        今天是 Day {currentTripDayIndex + 1}
                      </h2>
                    </div>
                    <div
                      className={`p-2.5 rounded-full animate-pulse ${theme.accentBg}`}
                    >
                      <Plane className={`w-6 h-6 ${theme.accent}`} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div
                      className={`bg-gradient-to-r ${isDarkMode ? currentTheme.buttonGradients.primary.dark : currentTheme.buttonGradients.primary.light} text-white p-4 rounded-2xl shadow-lg relative overflow-hidden`}
                    >
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-1 drop-shadow-md">
                          {itineraryData[currentTripDayIndex].title}
                        </h3>
                        <div className="text-stone-200 text-xs flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5" />
                          {itineraryData[currentTripDayIndex].stay}
                        </div>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10">
                        <MapPin className="w-20 h-20 text-white" />
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border transition-colors backdrop-blur-md ${isDarkMode ? "bg-neutral-800/30 border-neutral-700/60 ring-1 ring-white/5" : "bg-white/60 border-stone-200/60 ring-1 ring-black/5"}`}
                    >
                      <h4
                        className={`text-xs font-bold mb-3 flex items-center gap-1.5 ${theme.textSec}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${colors.orange}`} />{" "}
                        今日亮點快速導覽
                      </h4>
                      <div className="space-y-3">
                        {itineraryData[currentTripDayIndex].events
                          .filter((e) => e.highlights)
                          .slice(0, 3)
                          .map((e, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div
                                className={`text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 backdrop-blur-md ${isDarkMode ? "bg-neutral-700/60 text-neutral-300 ring-1 ring-white/5" : "bg-stone-200/70 text-stone-600 ring-1 ring-black/5"}`}
                              >
                                {e.time}
                              </div>
                              <div>
                                <div
                                  className={`text-sm font-bold ${theme.text}`}
                                >
                                  {e.title}
                                </div>
                                <div
                                  className={`text-xs mt-0.5 leading-relaxed ${theme.textSec}`}
                                >
                                  {e.desc}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      <button
                        onClick={() => changeDay(currentTripDayIndex)}
                        className={`w-full mt-4 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${isDarkMode ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-200" : "bg-stone-200 hover:bg-stone-300 text-stone-600"}`}
                      >
                        查看今日完整行程 <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tripStatus === "after" && (
                <div
                  className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${componentStyles.itineraryCard}`}
                  style={theme.ambientStyle}
                >
                  <div className="text-center mb-5">
                    <div className="p-3.5 bg-amber-100/30 rounded-full w-14 h-14 mx-auto flex items-center justify-center mb-3 border border-amber-200/50">
                      <History className="w-7 h-7 text-amber-500" />
                    </div>
                    <h2
                      className={`text-xl font-bold drop-shadow-sm ${theme.text}`}
                      style={{
                        textShadow: isDarkMode
                          ? "0 2px 4px rgba(0,0,0,0.3)"
                          : "none",
                      }}
                    >
                      旅程圓滿結束！
                    </h2>
                    <p className={`text-sm mt-1 ${theme.textSec}`}>
                      感謝您這{itineraryData.length}
                      天的陪伴，希望留下美好的回憶。
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl p-4 border transition-colors backdrop-blur-md ${isDarkMode ? "bg-neutral-800/30 border-neutral-700/60 ring-1 ring-white/5" : "bg-white/60 border-stone-200/60 ring-1 ring-black/5"}`}
                  >
                    <h3
                      className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.textSec}`}
                    >
                      <MapPin className={`w-4 h-4 ${colors.pink}`} /> 足跡回顧
                    </h3>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(tripConfig.tripHighlights || []).map((spot, i) => (
                          <span
                            key={i}
                            className={`px-3 py-1.5 text-xs font-medium rounded-xl border shadow-sm backdrop-blur-md ${isDarkMode ? "bg-neutral-700/60 border-neutral-600/60 text-neutral-300 ring-1 ring-white/5" : "bg-white/90 border-stone-200/60 text-stone-600 ring-1 ring-black/5"}`}
                          >
                            {spot}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`day-${activeDay}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              {current && (
                <>
                  <div
                    className={`backdrop-blur-xl border rounded-3xl p-5 flex items-center justify-between relative overflow-hidden transition-all duration-300 ${isDarkMode ? "bg-slate-900/50 border-white/20 ring-1 ring-white/5 shadow-xl shadow-black/10" : "bg-white/75 border-white/60 ring-1 ring-black/5 shadow-xl shadow-black/10"} ${componentStyles.itineraryCard}`}
                    style={theme.ambientStyle}
                  >
                    <div className="relative z-10">
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 uppercase tracking-wide ${theme.textSec}`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="flex items-center gap-1">
                          {tripConfig.locations.find(
                            (l) => l.key === currentLocation,
                          )?.name || "當地"}
                          <button
                            onClick={handleWeatherDetailOpen}
                            className={`ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95 backdrop-blur-md ${
                              isDarkMode
                                ? "bg-white/10 text-white/90 hover:bg-white/20 ring-1 ring-white/10"
                                : "bg-black/5 text-stone-600 hover:bg-black/10 ring-1 ring-black/5"
                            }`}
                            title="查看詳細氣象資訊"
                          >
                            <span className="text-[10px] font-bold">
                              詳細天氣資訊
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </button>
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2.5 rounded-full shadow-md backdrop-blur-md ${isDarkMode ? "bg-black/20 ring-1 ring-white/10" : "bg-white/60 ring-1 ring-black/5"}`}
                        >
                          <motion.div
                            key={`${activeDay}-${displayWeather.desc}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          ></motion.div>
                          {displayWeather.icon}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-2xl font-bold drop-shadow-sm ${theme.text}`}
                              style={{
                                textShadow: isDarkMode
                                  ? "0 1px 2px rgba(0,0,0,0.3)"
                                  : "none",
                              }}
                            >
                              {displayWeather.temp.split("/")[0]}
                            </span>
                            <span className={`text-sm ${theme.textSec}`}>
                              /
                            </span>
                            <span
                              className={`text-2xl font-bold drop-shadow-sm ${theme.text}`}
                              style={{
                                textShadow: isDarkMode
                                  ? "0 1px 2px rgba(0,0,0,0.3)"
                                  : "none",
                              }}
                            >
                              {displayWeather.temp.split("/")[1]}
                            </span>
                          </div>
                          <div
                            className={`text-sm font-medium mt-0.5 ${theme.textSec}`}
                          >
                            {displayWeather.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 text-right max-w-[50%] flex flex-col items-end">
                      <div
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold mb-1.5 border shadow-sm backdrop-blur-md ${isDarkMode ? "bg-sky-900/30 text-sky-200 border-sky-800/50" : "bg-[#E0F7FA]/80 text-[#006064] border-[#B2EBF2]"}`}
                      >
                        💡 穿搭建議
                      </div>
                      <p
                        className={`text-xs leading-relaxed font-medium ${theme.textSec}`}
                      >
                        {displayWeather.advice}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`backdrop-blur-xl rounded-[2rem] p-5 min-h-[auto] relative transition-all duration-300 ${isDarkMode ? "bg-slate-900/50 border border-white/20 ring-1 ring-white/5 shadow-xl shadow-black/10" : "bg-white/75 border border-white/60 ring-1 ring-black/5 shadow-xl shadow-black/10"} ${componentStyles.itineraryCard}`}
                    style={theme.ambientStyle}
                  >
                    <div
                      className={`mb-5 border-b pb-4 ${isDarkMode ? "border-neutral-700/50" : "border-stone-200/50"}`}
                    >
                      <div
                        className={`text-xs font-semibold mb-1.5 flex items-center gap-2 ${theme.textSec}`}
                      >
                        <span
                          className={`px-2.5 py-0.5 rounded-xl backdrop-blur-md ${isDarkMode ? "bg-neutral-800/60 ring-1 ring-white/5" : "bg-white/70 ring-1 ring-black/5"}`}
                        >
                          {current.date}
                        </span>
                      </div>
                      <h2
                        className={`text-2xl font-extrabold mb-2 leading-tight drop-shadow-sm ${theme.text}`}
                        style={{
                          textShadow: isDarkMode
                            ? "0 2px 4px rgba(0,0,0,0.3)"
                            : "none",
                        }}
                      >
                        {current.title}
                      </h2>

                      {!current.stay.includes("溫暖的家") && (
                        <div
                          className={`text-xs font-medium flex items-center gap-1.5 mt-2 ${theme.textSec}`}
                        >
                          <Hotel className={`w-3.5 h-3.5 ${theme.accent}`} />
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(current.stay.split("(")[0])}`}
                            className={`hover:underline underline-offset-2 ${isDarkMode ? "hover:text-sky-300" : "hover:text-[#5D737E]"}`}
                            title="在 Google Maps 開啟導航"
                          >
                            {current.stay}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3.5 relative">
                      <div
                        className={`absolute left-[35px] top-10 bottom-10 w-0.5 border-l-2 border-dashed ${isDarkMode ? "border-white/10" : "border-black/10"} z-0`}
                      />
                      {current.events.map((event, idx) => {
                        const isTransport =
                          event.title.includes("交通") || !!event.transport;
                        const isOpen = expandedItems[`${activeDay}-${idx}`];
                        return (
                          <div
                            key={idx}
                            className={`group rounded-2xl border transition-all duration-300 overflow-hidden relative z-10 backdrop-blur-md
                              ${
                                isTransport
                                  ? isDarkMode
                                    ? "bg-neutral-900/20 border-white/5 opacity-80 scale-[0.96] mx-4 shadow-sm shadow-black/5"
                                    : "bg-white/40 border-white/30 opacity-80 scale-[0.96] mx-4 shadow-sm shadow-black/5"
                                  : isDarkMode
                                    ? "bg-neutral-800/40 border-white/10 ring-1 ring-white/5 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-black/10"
                                    : "bg-white/70 border-white/40 ring-1 ring-black/5 hover:bg-white/90 hover:shadow-lg hover:shadow-black/5"
                              }`}
                          >
                            <div
                              className={`${isTransport ? "p-3" : "p-4"} flex gap-4 cursor-pointer`}
                              onClick={() => toggleExpand(activeDay, idx)}
                            >
                              <div className="flex flex-col items-center pt-1">
                                <div
                                  className={`${isTransport ? "w-8 h-8 rounded-xl" : "w-10 h-10 rounded-2xl"} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105
                                  ${
                                    event.title.includes("交通")
                                      ? isDarkMode
                                        ? currentTheme.tagColors.food.dark
                                        : currentTheme.tagColors.food.light
                                      : isDarkMode
                                        ? currentTheme.tagColors.transport.dark
                                        : currentTheme.tagColors.transport.light
                                  }`}
                                >
                                  {React.cloneElement(event.icon, {
                                    className: isTransport
                                      ? "w-4 h-4"
                                      : "w-5 h-5",
                                  })}
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div
                                      className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full backdrop-blur-md transition-all duration-300 ${isDarkMode ? "bg-neutral-700/40 text-neutral-400 border border-white/5" : "bg-white/60 text-stone-500 border border-white/30"}`}
                                    >
                                      <Clock className="w-2.5 h-2.5" />{" "}
                                      {event.time}
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3
                                        className={`${isTransport ? "text-sm" : "text-base"} font-bold leading-tight ${theme.text}`}
                                      >
                                        {event.title}
                                      </h3>
                                      {!isTransport && (
                                        <a
                                          href={getMapLink(
                                            event.mapQuery || event.title,
                                          )}
                                          onClick={(e) => e.stopPropagation()}
                                          className={`p-2 rounded-full backdrop-blur-md border shadow-md transition-all duration-300 hover:scale-110 active:scale-95 ${isDarkMode ? "bg-neutral-700/60 border-white/10 text-sky-300 hover:bg-neutral-600/80 hover:shadow-lg" : "bg-white/90 border-white/40 text-[#3B5998] hover:bg-white hover:shadow-lg hover:shadow-blue-500/10"}`}
                                          title="在 Google Maps 查看"
                                        >
                                          <MapPin className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  {isOpen ? (
                                    <ChevronUp
                                      className={`w-4 h-4 ${theme.textSec}`}
                                    />
                                  ) : (
                                    <ChevronDown
                                      className={`w-4 h-4 ${theme.textSec}`}
                                    />
                                  )}
                                </div>
                                <p
                                  className={`text-xs leading-relaxed ${theme.textSec}`}
                                >
                                  {event.desc}
                                </p>

                                {!isOpen && event.transport && (
                                  <div
                                    className={`mt-2.5 flex items-center gap-1.5 text-xs w-fit px-2.5 py-1 rounded-xl border ${isDarkMode ? currentTheme.tagColors.food.dark + " border-emerald-800/30" : currentTheme.tagColors.food.light + " border-[#E2E8D5]"}`}
                                  >
                                    <Train className="w-3 h-3" />
                                    <span className="font-medium">
                                      {event.transport.mode}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {isOpen && (
                              <div
                                className={`px-5 pb-5 pt-1 space-y-3 border-t backdrop-blur-md ${isDarkMode ? "bg-black/15 border-neutral-700/60" : "bg-white/50 border-stone-200/60"}`}
                              >
                                {event.transport && (
                                  <div
                                    className={`mt-2 p-3 rounded-xl border ${isDarkMode ? currentTheme.tagColors.food.dark + " border-emerald-800/30" : currentTheme.tagColors.food.light + " border-[#E2E8D5]"}`}
                                  >
                                    <h4
                                      className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${isDarkMode ? "text-emerald-400" : "text-[#556B2F]"}`}
                                    >
                                      <Train className="w-3.5 h-3.5" /> 交通詳情
                                    </h4>
                                    <div
                                      className={`space-y-1.5 text-xs leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-stone-600"}`}
                                    >
                                      <div className="flex gap-2">
                                        <span
                                          className={`${theme.textSec} min-w-[30px]`}
                                        >
                                          方式
                                        </span>{" "}
                                        <span className="font-medium">
                                          {event.transport.mode}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <span
                                          className={`${theme.textSec} min-w-[30px]`}
                                        >
                                          時間
                                        </span>{" "}
                                        <span>{event.transport.duration}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <span
                                          className={`${theme.textSec} min-w-[30px]`}
                                        >
                                          路線
                                        </span>{" "}
                                        <span>{event.transport.route}</span>
                                      </div>
                                      {event.transport.note && (
                                        <p
                                          className={`font-medium mt-1.5 flex gap-1.5 items-start ${isDarkMode ? "text-amber-400" : "text-[#CD853F]"}`}
                                        >
                                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
                                          {event.transport.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {event.highlights && (
                                  <div>
                                    <h4
                                      className={`text-xs font-bold flex items-center gap-1.5 mb-2 mt-2 ${isDarkMode ? "text-rose-300" : "text-[#BC8F8F]"}`}
                                    >
                                      <Star className="w-3.5 h-3.5" /> 必玩 /
                                      必吃
                                    </h4>
                                    <ul className="space-y-1.5 pl-1">
                                      {event.highlights.map((item, i) => (
                                        <li
                                          key={i}
                                          className={`text-[11px] flex gap-2 items-start leading-relaxed ${theme.textSec}`}
                                        >
                                          <span
                                            className={`${colors.pink} mt-1`}
                                          >
                                            •
                                          </span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {event.tips && (
                                  <div>
                                    <h4
                                      className={`text-xs font-bold flex items-center gap-1.5 mb-2 mt-2 ${isDarkMode ? "text-amber-300" : "text-[#CD853F]"}`}
                                    >
                                      <Info className="w-3.5 h-3.5" /> 溫馨提醒
                                    </h4>
                                    <ul className="space-y-1.5 pl-1">
                                      {event.tips.map((item, i) => (
                                        <li
                                          key={i}
                                          className={`text-[11px] flex gap-2 items-start leading-relaxed ${theme.textSec}`}
                                        >
                                          <span
                                            className={`${colors.orange} mt-1`}
                                          >
                                            •
                                          </span>
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

                    {current.routeInfo && (
                      <div
                        className={`mt-6 backdrop-blur-lg rounded-2xl border p-4 shadow-md transition-colors ${isDarkMode ? "bg-neutral-800/25 border-neutral-700/60 ring-1 ring-white/5" : "bg-white/60 border-stone-200/60 ring-1 ring-black/5"}`}
                      >
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className={`p-1.5 rounded-xl ${theme.accentBg}`}>
                            <Map className={`w-4 h-4 ${theme.accent}`} />
                          </div>
                          <h3 className={`text-sm font-bold ${theme.text}`}>
                            當日路線導航
                          </h3>
                        </div>

                        <Suspense
                          fallback={
                            <div
                              className={`h-64 rounded-xl border flex items-center justify-center text-xs font-semibold animate-pulse ${isDarkMode ? "bg-neutral-900/30 border-neutral-800 text-neutral-400" : "bg-white/60 border-stone-200 text-stone-500"}`}
                            >
                              地圖載入中…
                            </div>
                          }
                        >
                          <DayMap
                            events={dayMapEvents}
                            userLocation={userWeather}
                            isDarkMode={isDarkMode}
                            theme={theme}
                            onModalToggle={handleMapModalToggle}
                          />
                        </Suspense>

                        <div className="flex flex-col gap-3 mt-4">
                          <div
                            className={`text-xs p-3 rounded-xl border leading-relaxed backdrop-blur-md ${isDarkMode ? "bg-black/15 border-neutral-700/60 text-neutral-300 ring-1 ring-white/5" : "bg-white/70 border-stone-200/60 text-stone-600 ring-1 ring-black/5"}`}
                          >
                            <span
                              className={`font-bold mr-1.5 block mb-1 ${theme.accent}`}
                            >
                              路線摘要
                            </span>
                            {current.routeInfo.summary}
                          </div>

                          <a
                            href={current.routeInfo.mapUrl}
                            className={`flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 bg-gradient-to-r ${isDarkMode ? currentTheme.buttonGradients.primary.dark : currentTheme.buttonGradients.primary.light}`}
                          >
                            <Navigation className="w-4 h-4" />
                            開啟 Google Maps 查看路線
                          </a>
                        </div>
                      </div>
                    )}

                    {current.notice && (
                      <div
                        className={`mt-5 rounded-xl p-3.5 text-xs flex gap-2.5 items-start shadow-md border backdrop-blur-md
                        ${
                          current.notice.type === "alert"
                            ? isDarkMode
                              ? "bg-rose-900/15 border-rose-800/40 text-rose-200 ring-1 ring-rose-700/30"
                              : "bg-[#FFF0F5]/80 border-rose-100/60 text-[#BC8F8F] ring-1 ring-rose-100/30"
                            : isDarkMode
                              ? "bg-blue-900/15 border-blue-800/40 text-blue-200 ring-1 ring-blue-700/30"
                              : "bg-blue-50/80 border-blue-100/60 text-slate-600 ring-1 ring-blue-100/30"
                        }`}
                      >
                        <AlertCircle
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${current.notice.type === "alert" ? colors.pink : colors.blue}`}
                        />
                        <span className="leading-relaxed font-medium tracking-wide">
                          {current.notice.text}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ItineraryTab;
