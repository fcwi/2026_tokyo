import React, { useEffect, useRef, useCallback } from "react";
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * MapPicker Component (mapcn style)
 * * An interactive map tool for selecting geographic coordinates.
 * Features:
 * - CARTO Tile Layer (Modern & Clean)
 * - Floating custom controls (shadcn/ui style)
 * - Theme-aware styling
 */
const MapPicker = ({
  latitude,
  longitude,
  onLocationChange,
  theme, // currentTheme object from App.jsx
  isDarkMode,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null); // 用來參照圖層以便切換
  const markerRef = useRef(null);
  const isInternalUpdateRef = useRef(false); // 標記是否為內部點擊觸發的更新

  /**
   * Updates the marker position on the map.
   */
  const updateMarker = useCallback((lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapInstanceRef.current) {
      const customIcon = L.divIcon({
        html: `<div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          transform: translate(-16px, -16px);
        ">📍</div>`,
        iconSize: [32, 32],
        className: "custom-map-marker",
      });

      markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(
        mapInstanceRef.current
      );
      markerRef.current.bindPopup(`<b>位置</b><br/>緯度: ${lat.toFixed(4)}<br/>經度: ${lng.toFixed(4)}`);
    }
  }, []);

  // 取得當前主題對應的圖資 URL
  const getTileUrl = (dark) => {
    return dark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // 1. 初始化地圖實例
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false, // 禁用預設醜醜的 +/- 按鈕
        attributionControl: false, // 隱藏版權資訊以保持簡潔 (或自行在下方標註)
      }).setView([latitude, longitude], 13);

      // 加入 CARTO 圖層
      const tileLayer = L.tileLayer(getTileUrl(isDarkMode), {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // 點擊監聽
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        isInternalUpdateRef.current = true; // 標記為內部更新
        updateMarker(lat, lng);
        onLocationChange({ lat, lon: lng });
      });
    }

    // 2. 監聽日夜模式切換圖資
    if (tileLayerRef.current) {
      const newUrl = getTileUrl(isDarkMode);
      if (tileLayerRef.current._url !== newUrl) {
        tileLayerRef.current.setUrl(newUrl);
      }
    }

    // 3. 同步視野與標記
    if (mapInstanceRef.current) {
      // 如果是內部點擊觸發的更新，我們不需要 setView，因為地圖已經在正確位置
      // 且不需要重置縮放層級
      if (isInternalUpdateRef.current) {
        isInternalUpdateRef.current = false; // 重置標記
      } else {
        // 只有當位置距離變動夠大時才移動視野，避免用戶移動地圖時一直被拉回來
        const currentCenter = mapInstanceRef.current.getCenter();
        const dist = Math.sqrt(
          Math.pow(currentCenter.lat - latitude, 2) + Math.pow(currentCenter.lng - longitude, 2)
        );
        if (dist > 0.0001) {
          // 使用當前縮放層級，避免突然縮放回 13
          mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
        }
      }
    }
    updateMarker(latitude, longitude);

    return () => {
      // Cleanup logic if needed
    };
  }, [latitude, longitude, updateMarker, onLocationChange, isDarkMode]);

  // --- Map Control Handlers ---

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleReset = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 13);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-bold flex items-center gap-2 ${theme.text}`}>
        <MapPin className="w-4 h-4" /> 互動式地圖選擇
      </h3>

      {/* 地圖容器 + 懸浮控制項 */}
      <div className="relative group isolate">
        <div
          ref={mapRef}
          className={`w-full h-64 rounded-2xl border overflow-hidden transition-all duration-300 ${
            isDarkMode 
              ? "border-neutral-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-[#1a1a1a]" 
              : "border-stone-200 shadow-[inset_0_0_10px_rgba(0,0,0,0.05)] bg-[#fdfdfd]"
          }`}
          style={{ zIndex: 0 }}
        />

        {/* 懸浮控制按鈕 (shadcn style) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[400]">
          <div className={`flex flex-col rounded-xl border shadow-lg overflow-hidden backdrop-blur-md ${
            isDarkMode ? "bg-black/60 border-neutral-700/80" : "bg-white/80 border-stone-200/80"
          }`}>
            <button
              onClick={handleZoomIn}
              className={`p-2.5 transition-colors flex items-center justify-center border-b active:bg-black/10 ${
                isDarkMode 
                  ? "hover:bg-neutral-700/80 text-white border-neutral-700/50" 
                  : "hover:bg-stone-100/80 text-stone-700 border-stone-200/50"
              }`}
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className={`p-2.5 transition-colors flex items-center justify-center active:bg-black/10 ${
                 isDarkMode 
                  ? "hover:bg-neutral-700/80 text-white" 
                  : "hover:bg-stone-100/80 text-stone-700"
              }`}
              title="縮小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleReset}
            className={`p-2.5 rounded-xl border shadow-lg transition-colors flex items-center justify-center backdrop-blur-md active:scale-95 ${
              isDarkMode
                ? "bg-black/60 border-neutral-700/80 hover:bg-neutral-700/80 text-white"
                : "bg-white/80 border-stone-200/80 hover:bg-stone-100/80 text-stone-700"
            }`}
            title="重置視野"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 坐標顯示 */}
      <div
        className={`text-xs p-3 rounded-xl border flex justify-between items-center transition-colors ${
          isDarkMode
            ? "bg-neutral-900/50 border-neutral-700 text-neutral-300"
            : "bg-stone-50 border-stone-200 text-stone-600"
        }`}
      >
        <div className="flex flex-col gap-0.5">
           <div className={`font-bold ${theme.text}`}>選定的位置</div>
           <div className={`font-mono text-[10px] opacity-80`}>
             {latitude.toFixed(6)}, {longitude.toFixed(6)}
           </div>
        </div>
        <div className="text-[10px] opacity-50 font-medium px-2 py-1 rounded bg-black/5 dark:bg-white/5">
          點擊地圖選擇
        </div>
      </div>
    </div>
  );
};

export default MapPicker;