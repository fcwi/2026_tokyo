import { useRef, useCallback } from "react";
import { debugLog } from "../utils/debug";

const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 Hours

export const useGooglePlaces = (apiKey) => {
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  const fetchGooglePlaces = useCallback(async (lat, lng, initialRadius = 100) => {
    const performSearch = async (radius) => {
      const cacheKey = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)},${radius}`;
      const cached = cacheRef.current[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        return cached.data;
      }

      if (!apiKey) return null;

      const url = `https://places.googleapis.com/v1/places:searchNearby`;
      const validTypes = [
        "restaurant",
        "cafe",
        "convenience_store",
        "tourist_attraction",
        "park",
        "store",
        "lodging",
        "transit_station",
        "museum",
        "shopping_mall",
      ];

      const body = {
        includedTypes: validTypes,
        maxResultCount: 1,
        locationRestriction: {
          circle: {
            center: { latitude: Number(lat), longitude: Number(lng) },
            radius: Number(radius),
          },
        },
        languageCode: "zh-TW",
      };

      try {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.displayName,places.addressDescriptor",
          },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) return null;

        const data = await res.json();
        let foundName = "";

        if (data.places && data.places.length > 0) {
          const firstPlace = data.places[0];
          const landmarks = firstPlace.addressDescriptor?.landmarks;
          // 優先取地標描述，次取店名
          foundName =
            landmarks?.[0]?.displayName?.text ||
            firstPlace.displayName?.text ||
            "";
        }

        if (foundName) {
          cacheRef.current[cacheKey] = {
            data: foundName,
            timestamp: Date.now(),
          };
        }
        return foundName;
      } catch (error) {
        if (error.name === "AbortError") return null;
        console.error(`❌ [Maps API] 錯誤:`, error);
        return null;
      }
    };

    // 核心重試邏輯
    // 第一跳：嘗試精準半徑 (預設 100m)
    let placeName = await performSearch(initialRadius);

    // 第二跳：如果沒結果，且初次搜尋半徑小於 300m，則擴大範圍再試一次
    if (!placeName && initialRadius < 300) {
      debugLog(`🔍 [Maps API] ${initialRadius}m 無結果，擴大至 300m 重試...`);
      placeName = await performSearch(300);
    }

    return placeName || "";
  }, [apiKey]);

  const getBestPOI = useCallback(async (latitude, longitude) => {
    if (!apiKey) {
      debugLog("🗺️ [Google Maps] 略過：未設定 API Key");
      return null;
    }

    try {
      debugLog(
        `🗺️ [Google Maps] 查詢周邊 POI... (Lat: ${latitude}, Lng: ${longitude})`,
      );
      // 預設搜尋半徑 100m，優先尋找最接近的具體地標
      const places = await fetchGooglePlaces(latitude, longitude, 100);
      debugLog("🗺️ [Google Maps] API 回傳結果:", places);

      if (places) {
        return { name: places };
      }
      return null;
    } catch (error) {
      console.warn("POI 查詢失敗:", error);
      return null;
    }
  }, [apiKey, fetchGooglePlaces]);

  return { fetchGooglePlaces, getBestPOI };
};
