import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { tripConfig } from "../tripdata_2026_karuizawa.jsx";

// 🔴 修改 1: 移除未使用的 'theme' prop
const CurrencyWidget = ({ isDarkMode }) => {
  const [rateData, setRateData] = useState({
    current: null,
    trend: "neutral",
    diff: 0,
    loading: true,
    error: false,
  });

  // 🔴 修改 2: 移除未使用的 'label'
  const { code, target } = tripConfig.currency;

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const nowRes = await fetch(
          `https://latest.currency-api.pages.dev/v1/currencies/${code}.json`
        );
        const nowData = await nowRes.json();
        const currentRate = nowData[code][target.toLowerCase()];

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const dateStr = pastDate.toISOString().split("T")[0];
        
        const pastRes = await fetch(
          `https://try.readme.io/https://${dateStr}.currency-api.pages.dev/v1/currencies/${code}.json`
        );
        let pastRate = currentRate; 
        if (pastRes.ok) {
           const pastData = await pastRes.json();
           pastRate = pastData[code][target.toLowerCase()];
        }

        const diff = currentRate - pastRate;
        let trend = "neutral";
        if (diff > 0.0001) trend = "up";
        if (diff < -0.0001) trend = "down";

        setRateData({
          current: currentRate,
          trend,
          diff,
          loading: false,
          error: false,
        });
      } catch (err) {
        console.error("匯率抓取失敗:", err);
        setRateData((prev) => ({ ...prev, loading: false, error: true }));
      }
    };
    fetchRates();
  }, [code, target]);

  if (rateData.error) return null;

  const formatRate = (val) => val ? val.toFixed(3) : "--";

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-sm transition-all duration-300 whitespace-nowrap
      ${
        isDarkMode
          ? "bg-neutral-800/60 border-neutral-600 text-neutral-200"
          : "bg-white/60 border-stone-200 text-stone-700"
      }`}
    >
      {rateData.loading ? (
        <div className="flex items-center gap-2">
           <span className="text-[10px] opacity-60">匯率更新中</span>
           <RefreshCw className="w-3 h-3 animate-spin opacity-60" />
        </div>
      ) : (
        <>
          {/* 幣別與匯率 */}
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-bold opacity-60">1 {code.toUpperCase()}</span>
            <span className="text-xs font-bold tracking-wide font-mono">
               ≈ {formatRate(rateData.current)}
            </span>
            <span className="text-[10px] font-bold opacity-60">{target}</span>
          </div>

          {/* 分隔線 */}
          <div className={`w-px h-2.5 ${isDarkMode ? "bg-white/20" : "bg-black/10"}`}></div>

          {/* 趨勢箭頭 */}
          <div className="flex items-center" title={`與上週相比 ${rateData.diff > 0 ? "升值" : "貶值"} ${Math.abs(rateData.diff).toFixed(4)}`}>
            {rateData.trend === "up" && (
              <TrendingUp className="w-3 h-3 text-red-500" />
            )}
            {rateData.trend === "down" && (
              <TrendingDown className="w-3 h-3 text-emerald-500" />
            )}
            {rateData.trend === "neutral" && (
              <Minus className="w-3 h-3 opacity-40" />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencyWidget;