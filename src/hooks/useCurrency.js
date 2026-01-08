import { useState, useEffect } from "react";

export const useCurrency = (code, target, isOnline) => {
  // 初始狀態：根據 isOnline 決定 loading 的預設值，避免在 Effect 中同步更新
  const [rateData, setRateData] = useState({
    current: null,
    trend: "neutral",
    diff: 0,
    loading: isOnline, 
    error: false,
  });

  useEffect(() => {
    // 如果離線，不需要進行資料請求
    if (!isOnline) {
      return;
    }

    const fetchRates = async () => {
      // 在開始請求前，確保 loading 是開啟的（這發生在非同步函數中，是安全的）
      setRateData((prev) => (prev.loading ? prev : { ...prev, loading: true, error: false }));

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
  }, [code, target, isOnline]);

  return rateData;
};