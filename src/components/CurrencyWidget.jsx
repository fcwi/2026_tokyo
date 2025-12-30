import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, WifiOff } from "lucide-react";
import { tripConfig } from "../tripdata_2026_karuizawa.jsx";

const CurrencyWidget = ({ isDarkMode }) => {
  const [rateData, setRateData] = useState({
    current: null,
    trend: "neutral",
    diff: 0,
    loading: true,
    error: false,
  });

  // 1. 新增：網路狀態偵測
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { code, target } = tripConfig.currency;

  useEffect(() => {
    // 如果離線，就不執行 fetch，避免報錯 (雖然 fetch 本身也會 fail，但這樣比較乾淨)
    if (!isOnline) return;

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
  }, [code, target, isOnline]); // 加入 isOnline 依賴，連上線時會自動重抓

  // 2. 修改：如果離線，回傳特定的 UI，而不是 null (error 狀態也可以考慮顯示這個，或者維持 null)
  // 這裡我們讓 "離線" 的優先級最高
  
  const formatRate = (val) => val ? val.toFixed(3) : "--";
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
            <WifiOff className={`w-3 h-3 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
            <span className={`text-[10px] font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
              網路不穩定
            </span>
         </div>
      ) : rateData.loading ? (
        <div className="flex items-center gap-2">
           <span className="text-[10px] opacity-60">匯率更新中</span>
           <RefreshCw className="w-3 h-3 animate-spin opacity-60" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-bold opacity-60">1 {code.toUpperCase()}</span>
            <span className="text-xs font-bold tracking-wide font-mono">
               ≈ {formatRate(rateData.current)}
            </span>
            <span className="text-[10px] font-bold opacity-60">{target}</span>
          </div>

          <div className={`w-px h-2.5 ${isDarkMode ? "bg-white/20" : "bg-black/10"}`}></div>

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
    </a>
  );
};

export default CurrencyWidget;