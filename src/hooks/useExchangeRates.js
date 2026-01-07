import { useState, useEffect } from "react";

/**
 * useExchangeRates Hook
 * 匯率抓取自定義 Hook，支援重試、離線處理與趨勢分析
 */
export const useExchangeRates = (code, target, isOnline) => {
  const [rateData, setRateData] = useState({
    current: null,
    trend: "neutral",
    diff: 0,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchRates = async () => {
      // 若斷網，則直接結束載入狀態（若正在載入）
      if (!isOnline) {
        if (isMounted) {
          setRateData((prev) => (prev.loading ? { ...prev, loading: false } : prev));
        }
        return;
      }

      // 進階：確保 loading 狀態為 true (若尚未設定)
      if (isMounted) {
        setRateData((prev) =>
          prev.loading ? prev : { ...prev, loading: true, error: false },
        );
      }

      try {
        const codeLower = String(code || "jpy").toLowerCase();
        const targetLower = String(target || "twd").toLowerCase();

        // 1. 抓取當前匯率
        const nowRes = await fetch(
          `https://latest.currency-api.pages.dev/v1/currencies/${codeLower}.json`,
        );

        if (!nowRes.ok) throw new Error("當前匯率 API 請求失敗");
        const nowData = await nowRes.json();
        const currentRate = nowData?.[codeLower]?.[targetLower];

        if (!currentRate) throw new Error("找不到對應的匯率數據");

        // 2. 抓取一週前的歷史匯率 (用以計算趨勢)
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const dateStr = pastDate.toISOString().split("T")[0];

        // 使用 try.readme.io 作為 CORS 代理 (若有需要)
        const pastRes = await fetch(
          `https://try.readme.io/https://${dateStr}.currency-api.pages.dev/v1/currencies/${codeLower}.json`,
        );

        let pastRate = currentRate;
        if (pastRes.ok) {
          const pastData = await pastRes.json();
          pastRate = pastData?.[codeLower]?.[targetLower] || currentRate;
        }

        // 3. 計算趨勢
        const diff = currentRate - pastRate;
        let trend = "neutral";
        if (diff > 0.0001) trend = "up";
        if (diff < -0.0001) trend = "down";

        if (isMounted) {
          setRateData({
            current: currentRate,
            trend,
            diff,
            loading: false,
            error: false,
          });
        }
      } catch (err) {
        console.error("useExchangeRates 錯誤:", err);
        if (isMounted) {
          setRateData((prev) => ({ ...prev, loading: false, error: true }));
        }
      }
    };

    fetchRates();

    return () => {
      isMounted = false;
    };
  }, [code, target, isOnline]);

  return rateData;
};
