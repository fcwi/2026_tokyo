import { useState, useCallback, useRef } from "react";
import { debugLog } from "../utils/debug";

const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 Hour

export const useWeather = ({ isAppReady, setIsAppReady }) => {
  const [userWeather, setUserWeather] = useState({
    loading: true,
    temp: null,
    desc: null,
    iconId: null,
    locationName: "定位中...", // OSM 路名
    landmark: "", // Google Maps 地標
    isGeneric: true, // true=Generic OSM name, false=Precise POI name
    lat: null,
    lon: null,
    error: null,
  });

  const [locationSource, setLocationSource] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_user_weather");
      return cached ? "cache" : null;
    } catch {
      return null;
    }
  });

  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [autoTimeZone, setAutoTimeZone] = useState("Asia/Taipei"); // Default

  const abortControllerRef = useRef(null);
  

  const [testModeClickCount, setTestModeClickCount] = useState(0);

  const fetchLocalWeather = useCallback(async (latitude, longitude, customName = null, sourceHint = "low") => {
      setIsUpdatingLocation(true);
      if (!isAppReady)
        setUserWeather((prev) => ({
          ...prev,
          loading: true,
          error: null,
          locationName: customName || "定位中...",
        }));

      // Cache Check
      const cacheKey = `cached_user_weather`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const dist = Math.sqrt(
            Math.pow(parsed.lat - latitude, 2) +
              Math.pow(parsed.lon - longitude, 2),
          );
          // 距離小於 0.01 度 (約 1km) 且未過期
          if (dist < 0.01 && Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
            debugLog("使用快取天氣資料");
            setUserWeather(parsed);
            setLocationSource("cache");
            setIsUpdatingLocation(false);
            if (!isAppReady) setIsAppReady(true);
            return parsed;
          }
        }
      } catch (e) {
        console.warn("讀取天氣快取失敗", e);
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;

      try {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        const res = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });
        if (!res.ok) throw new Error("Weather API Error");
        const data = await res.json();
        const weatherData = data.current_weather;

        // 更新自動時區
        if (data.timezone) setAutoTimeZone(data.timezone);

        const newWeatherData = {
          loading: false,
          temp: weatherData.temperature,
          desc: "資料來源: Open-Meteo", // 簡化描述，實際應對映 weathercode
          iconId: weatherData.weathercode,
          locationName: customName || "未知地點",
          landmark: "",
          isGeneric: true,
          lat: latitude,
          lon: longitude,
          error: null,
        };

        // 存入 cache
        localStorage.setItem(
          "cached_user_weather",
          JSON.stringify({ ...newWeatherData, timestamp: Date.now() }),
        );
        setUserWeather(newWeatherData);
        setLocationSource(sourceHint);
        return newWeatherData;
      } catch (err) {
        if (err.name === "AbortError") return null;
        console.error("定位失敗:", err);
        if (!isAppReady)
          setUserWeather((prev) => ({
            ...prev,
            loading: false,
            error: "連線失敗",
          }));
        return null;
      } finally {
        if (!isAppReady) setIsAppReady(true);
        setIsUpdatingLocation(false);
      }
    },
    [isAppReady, setIsAppReady],
  );

  return {
    userWeather,
    setUserWeather,
    locationSource,
    setLocationSource,
    isUpdatingLocation,
    setIsUpdatingLocation,
    fetchLocalWeather,
    autoTimeZone,
    setAutoTimeZone,
    testModeClickCount, 
    setTestModeClickCount
  };
};
