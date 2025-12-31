import React from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, WifiOff } from "lucide-react";
import { tripConfig } from "../tripdata_2026_karuizawa.jsx";

const CurrencyWidget = ({ isDarkMode, rateData, isOnline }) => {
  const { code, target } = tripConfig.currency;

  const safeRateData =
    rateData || {
      current: null,
      trend: "neutral",
      diff: 0,
      loading: true,
      error: false,
    };

  const loading = safeRateData.loading && !safeRateData.error && isOnline;

  const formatRate = (val) => (val ? val.toFixed(3) : "--");
  const queryUrl = `https://www.google.com/search?q=1+${code.toUpperCase()}+to+${target.toUpperCase()}`;

  return (
    <a
      href={isOnline ? queryUrl : "#"} // 離線時點擊無效
      target={isOnline ? "_blank" : "_self"}
      rel="noopener noreferrer"
      title={isOnline ? "點擊查看詳細匯率走勢" : "目前無法連線"}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-sm transition-all duration-300 whitespace-nowrap 
      ${isOnline ? "cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md" : "cursor-not-allowed opacity-80"}
      ${
        isDarkMode
          ? "bg-neutral-800/60 border-neutral-600 text-neutral-200 hover:bg-neutral-800/80"
          : "bg-white/60 border-stone-200 text-stone-700 hover:bg-white/90"
      }`}
    >
      {/* 3. 條件渲染：優先檢查是否離線 */}
      {!isOnline ? (
        <div className="flex items-center gap-2">
          <WifiOff
            className={`w-3 h-3 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
          />
          <span
            className={`text-[10px] font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
          >
            網路不穩定
          </span>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-60">匯率更新中</span>
          <RefreshCw className="w-3 h-3 animate-spin opacity-60" />
        </div>
      ) : safeRateData.error ? (
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <RefreshCw className="w-3 h-3" />
          <span>網路不穩，請稍後再試</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-bold opacity-60">
              1 {code.toUpperCase()}
            </span>
            <span className="text-xs font-bold tracking-wide font-mono">
              ~ {formatRate(safeRateData.current)}
            </span>
            <span className="text-[10px] font-bold opacity-60">{target}</span>
          </div>

          <div
            className={`w-px h-2.5 ${isDarkMode ? "bg-white/20" : "bg-black/10"}`}
          ></div>

          <div
            className="flex items-center"
            title={`與上週相比 ${safeRateData.diff > 0 ? "升值" : "貶值"} ${Math.abs(safeRateData.diff).toFixed(4)}`}
          >
            {safeRateData.trend === "up" && (
              <TrendingUp className="w-3 h-3 text-red-500" />
            )}
            {safeRateData.trend === "down" && (
              <TrendingDown className="w-3 h-3 text-emerald-500" />
            )}
            {safeRateData.trend === "neutral" && (
              <Minus className="w-3 h-3 opacity-40" />
            )}
          </div>
        </>
      )}
    </a>
  );
};

export default CurrencyWidget;
