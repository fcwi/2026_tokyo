import { useState, useCallback, useRef, useEffect } from "react";
import { getWeatherData } from "../utils/itineraryHelpers.js";

/**
 * useWeather - 天氣與定位管理 Hook
 * 
 * 功能：
 * - 用戶位置天氣獲取
 * - 天氣預報資料
 * - GPS 定位與 IP 定位
 * - 地名查詢與快取
 */
export const useWeather = (tripConfig, isTestMode, isTestModeRef, testLatitude, testLongitude, debugLog, showToast) => {
  const [autoTimeZone, setAutoTimeZone] = useState("Asia/Taipei");
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  // 優先從快取讀取天氣資訊，若無則顯示啟動畫面進行定位
  const [isAppReady, setIsAppReady] = useState(() => {
    const cached = localStorage.getItem("cached_user_weather");
    return !!cached;
  });

  const [weatherForecast, setWeatherForecast] = useState({
    karuizawa: null,
    tokyo: null,
    loading: true,
  });

  const [userWeather, setUserWeather] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_user_weather");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.locationName) {
          debugLog("🚀 State 初始化：直接載入快取資料", parsed.locationName);
          return parsed;
        }
      }
    } catch (e) {
      console.error("快取初始化解析失敗", e);
    }

    return {
      temp: null,
      desc: "",
      locationName: "定位中...",
      landmark: "",
      weatherCode: null,
      loading: false,
      error: null,
    };
  });

  const [locationSource, setLocationSource] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_user_weather");
      return cached ? "cache" : null;
    } catch {
      return null;
    }
  });

  const lastHighPrecisionAtRef = useRef(null);
  const isFetchingLocationRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const geoNamesCacheRef = useRef({});
  const CACHE_MAX_SIZE = 50;
  const CACHE_EXPIRY_MS = 3600000;

  // 獲取用戶位置天氣（核心函式）
  const getUserLocationWeather = useCallback(
    async (options = {}) => {
      const {
        isSilent = false,
        highAccuracy = false,
        timeout = 10000,
        coords = null,
      } = options;

      // 避免短時間內重複觸發定位請求
      const now = Date.now();
      const minGapMs = isSilent ? 10000 : 30000;
      if (!highAccuracy) {
        if (
          isFetchingLocationRef.current ||
          now - lastFetchAtRef.current < minGapMs
        ) {
          debugLog("⏳ 略過重複定位請求 (節流中)");
          return null;
        }
      }
      isFetchingLocationRef.current = true;

      // 測試模式處理：若未提供 explicit coords 則使用測試設定座標
      let effectiveCoords = coords;
      if (isTestMode && !effectiveCoords) {
        effectiveCoords = { latitude: testLatitude, longitude: testLongitude };
        debugLog("🧪 測試模式：使用設定的測試位置座標");
      }

      const fetchLocalWeather = async (
        latitude,
        longitude,
        customName = null,
      ) => {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weathercode,uv_index,uv_index_clear_sky,wind_speed_10m,wind_gusts_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,uv_index_clear_sky_max,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,sunrise,sunset&forecast_days=7&timezone=auto`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          if (weatherData.error) {
            throw new Error(weatherData.reason || "Weather API error");
          }

          let city = customName;
          let landmark = "";
          let isGeneric = true;

          if (!city) {
            try {
              // 使用座標作為 Key 進行地名快取
              const geoKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
              let geoData = geoNamesCacheRef.current[geoKey]?.data;

              if (
                !geoData ||
                Date.now() -
                  (geoNamesCacheRef.current[geoKey]?.timestamp || 0) >
                  CACHE_EXPIRY_MS
              ) {
                const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW&zoom=18`;
                const geoRes = await fetch(geoUrl);
                geoData = await geoRes.json();

                geoNamesCacheRef.current[geoKey] = {
                  data: geoData,
                  timestamp: Date.now(),
                };
                debugLog(`🌍 [地名查詢] 新查詢: ${geoKey}`);
              } else {
                debugLog(`🌍 [地名快取命中] ${geoKey}`);
              }

              if (geoData) {
                const addr = geoData.address || {};
                city =
                  addr.city ||
                  addr.town ||
                  addr.village ||
                  addr.county ||
                  addr.state ||
                  "您的位置";

                // 判斷是否為具體地標
                if (geoData.name) {
                  landmark = geoData.name;
                  isGeneric = false;
                } else {
                  isGeneric = true;
                  if (addr.road) {
                    landmark = addr.road;
                    if (addr.house_number) landmark += ` ${addr.house_number}`;
                  }
                }
              }
            } catch (e) {
              console.warn("Geo lookup failed:", e);
              city = "目前位置";
            }
          }

          const info = getWeatherData(weatherData.current_weather.weathercode);
          const newWeatherData = {
            temp: Math.round(weatherData.current_weather.temperature),
            desc: info.text,
            weatherCode: weatherData.current_weather.weathercode,
            hourly: weatherData.hourly,
            daily: weatherData.daily,
            locationName: city || "未知地點",
            landmark: landmark,
            isGeneric: isGeneric,
            lat: latitude,
            lon: longitude,
            loading: false,
            error: null,
          };

          localStorage.setItem(
            "cached_user_weather",
            JSON.stringify({ ...newWeatherData, timestamp: Date.now() }),
          );
          setUserWeather(newWeatherData);
          if (weatherData.timezone) setAutoTimeZone(weatherData.timezone);

          return newWeatherData;
        } catch (err) {
          console.error("定位失敗:", err);
          if (!isAppReady)
            setUserWeather((prev) => ({
              ...prev,
              loading: false,
              error: "連線失敗",
            }));
          return null;
        } finally {
          setIsAppReady(true);
          isFetchingLocationRef.current = false;
          lastFetchAtRef.current = Date.now();
        }
      };

      // 優先載入快取資料
      const cached = localStorage.getItem("cached_user_weather");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUserWeather(parsed);
          setLocationSource("cache");
          setIsAppReady(true);
          debugLog("🚀 快取載入成功");
        } catch (e) {
          console.error("快取解析失敗", e);
        }
      }

      // IP 定位補位
      if (!cached && !isSilent && !effectiveCoords) {
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();
          if (ipData.latitude) {
            debugLog("📡 IP 定位補位成功");
            await fetchLocalWeather(
              ipData.latitude,
              ipData.longitude,
              ipData.city,
            );
            setLocationSource("low");
          }
        } catch {
          console.warn("IP 定位失敗");
          if (!cached) {
            await fetchLocalWeather(25.033, 121.5654, "台北");
            setLocationSource("low");
          }
        }
      }

      // 使用提供的座標
      if (
        effectiveCoords &&
        effectiveCoords.latitude &&
        effectiveCoords.longitude
      ) {
        try {
          setHasLocationPermission(true);
          if (highAccuracy || isTestMode) {
            lastHighPrecisionAtRef.current = Date.now();
            setLocationSource("high");
          } else {
            setLocationSource("low");
          }
          return await fetchLocalWeather(
            effectiveCoords.latitude,
            effectiveCoords.longitude,
            effectiveCoords.name || null,
          );
        } catch (e) {
          console.error("使用提供的座標抓取失敗", e);
        }
      }

      // 啟動瀏覽器原生定位
      if (navigator.geolocation && !isTestMode) {
        const geoOptions = {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: highAccuracy ? 0 : 600000,
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isTestModeRef.current) {
              debugLog("🚫 略過 GPS 回傳 (處於測試模式中)");
              return;
            }
            setHasLocationPermission(true);
            if (highAccuracy) {
              lastHighPrecisionAtRef.current = Date.now();
              setLocationSource("high");
            } else {
              setLocationSource("low");
            }
            fetchLocalWeather(
              position.coords.latitude,
              position.coords.longitude,
            );
            if (!highAccuracy) {
              isFetchingLocationRef.current = false;
              lastFetchAtRef.current = Date.now();
            }
          },
          (err) => {
            console.warn("GPS 定位未成功", err.code, err.message);

            if (err.code === 1) {
              setHasLocationPermission(false);
              if (!isSilent) showToast("您已封鎖定位權限", "error");
            } else {
              setHasLocationPermission(null);
            }

            if (!cached && !isAppReady) {
              fetchLocalWeather(25.033, 121.5654, "台北");
              setLocationSource("low");
            }
            isFetchingLocationRef.current = false;
          },
          geoOptions,
        );
      } else {
        setHasLocationPermission(false);
        if (!cached && !isAppReady) {
          fetchLocalWeather(25.033, 121.5654, "台北");
          setLocationSource("low");
        }
        isFetchingLocationRef.current = false;
      }

      // 背景嘗試獲取高精度位置
      if (!highAccuracy && !isTestMode) {
        const tenMinutes = 10 * 60 * 1000;
        const last = lastHighPrecisionAtRef.current || 0;
        if (Date.now() - last > tenMinutes && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (isTestModeRef.current) return;
              try {
                const newData = await fetchLocalWeather(
                  pos.coords.latitude,
                  pos.coords.longitude,
                );
                if (newData) {
                  lastHighPrecisionAtRef.current = Date.now();
                  setLocationSource("high");
                  debugLog(
                    "Background high-precision update completed (silent)",
                    newData.locationName,
                  );
                }
              } catch {
                console.warn("Background high-precision fetch failed");
              }
            },
            (err) => {
              console.warn(
                "Background high-precision geolocation failed:",
                err,
              );
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
          );
        }
      }
    },
    [showToast, isAppReady, isTestMode, isTestModeRef, testLatitude, testLongitude, debugLog],
  );

  // 自動更新天氣
  useEffect(() => {
    const alreadyHasData =
      userWeather.temp !== null && userWeather.locationName !== "定位中...";

    getUserLocationWeather({ isSilent: alreadyHasData, highAccuracy: false });

    const intervalId = setInterval(() => {
      debugLog("⏰ 自動更新位置與天氣...");
      getUserLocationWeather({ isSilent: true, highAccuracy: false });
    }, 600000);

    return () => clearInterval(intervalId);
  }, [getUserLocationWeather, userWeather.locationName, userWeather.temp, debugLog]);

  return {
    // 狀態
    autoTimeZone,
    hasLocationPermission,
    isAppReady,
    weatherForecast,
    userWeather,
    locationSource,
    lastHighPrecisionAtRef,
    
    // 設定函式
    setAutoTimeZone,
    setWeatherForecast,
    setUserWeather,
    setLocationSource,
    setIsAppReady,
    setHasLocationPermission,

    // 動作函式
    getUserLocationWeather,
  };
};
