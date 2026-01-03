import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Lock, Unlock } from "lucide-react";

/**
 * DayMap Component (Custom CSS Markers)
 * * An interactive map component using React-Leaflet.
 * * Features: CARTO Tile Layer, modern container style, and CUSTOM CSS MARKERS.
 */

// --- 1. 定義自定義圖示 (Custom Icon Definitions) ---

// 🔥 核心修改：新的 CSS 自定義活動標記 (替代舊的紅色大頭針)
const customEventIcon = new L.DivIcon({
  className: "custom-event-marker", // 這是一個無用的 class 名稱，我們主要靠 html 屬性的 style
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        background-color: rgba(239, 68, 68, 0.3); /* Tailwind red-500 with opacity */
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
      "></div>
      <div style="
        position: relative;
        width: 12px;
        height: 12px;
        background-color: #ef4444; /* Tailwind red-500 */
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      "></div>
    </div>
  `,
  iconSize: [24, 24], // 確保圖示大小正確
  iconAnchor: [12, 12], // 定位點在正中心
  popupAnchor: [0, -14], // Popup 出現在圓點上方
});

// 使用者位置標記 (保持原本的藍色脈衝樣式)
const userLocationIcon = new L.DivIcon({
  className: "custom-user-icon",
  html: `
    <div style="position: relative; width: 20px; height: 20px; background-color: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 1000;">
      <div style="position: absolute; top: -10px; left: -10px; width: 34px; height: 34px; background-color: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    </div>
    <style> @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } } </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --- 2. 地圖控制元件 (Controllers) ---
// 自動縮放視野以包含所有點
const MapController = ({ events, userLocation }) => {
  const map = useMap();
  useEffect(() => {
    const points = [];
    events.forEach((e) => {
      if (e.lat && e.lon) points.push([e.lat, e.lon]);
    });
    if (userLocation && userLocation.lat && userLocation.lon) {
      points.push([userLocation.lat, userLocation.lon]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [events, userLocation, map]);
  return null;
};

// 控制地圖是否可互動 (鎖定/解鎖)
const MapInteractionController = ({ isLocked }) => {
  const map = useMap();
  useEffect(() => {
    if (isLocked) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    }
  }, [isLocked, map]);
  return null;
};

// --- 3. 主要組件 (Main Component) ---
const DayMap = ({ events, userLocation, isDarkMode }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [showHint, setShowHint] = useState(false);

  const validEvents = events.filter((e) => e.lat && e.lon);
  const defaultCenter = [35.6895, 139.6917];

  const tileLayerUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className={`relative w-full h-64 rounded-[2rem] overflow-hidden border z-0 group transition-all duration-300
      ${isDarkMode 
        ? "border-neutral-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-[#1a1a1a]" 
        : "border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-[#fdfdfd]"
      }`}
    >
      {/* 鎖定切換按鈕 (膠囊樣式) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsLocked(!isLocked);
          setShowHint(false);
        }}
        className={`absolute top-4 right-4 z-[1001] flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border transition-all duration-300 active:scale-95
          ${
            isLocked
              ? isDarkMode 
                ? "bg-black/40 text-neutral-300 border-neutral-700 hover:bg-black/60"
                : "bg-white/60 text-stone-600 border-white/40 hover:bg-white/80"
              : "bg-blue-500 text-white border-blue-400 ring-4 ring-blue-500/20"
          }
        `}
        title={isLocked ? "點擊以移動地圖" : "點擊鎖定地圖"}
      >
        {isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wide">地圖已鎖定</span>
          </>
        ) : (
          <>
            <Unlock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wide">互動模式</span>
          </>
        )}
      </button>

      {/* 提示遮罩 */}
      {isLocked && (
        <div 
          className="absolute inset-0 z-[1000] flex items-center justify-center bg-transparent cursor-pointer"
          onClick={() => {
            setShowHint(true);
            setTimeout(() => setShowHint(false), 2000);
          }}
        >
          {showHint && (
            <div className="bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-2xl border border-white/10">
              🔒 點擊右上角解鎖地圖
            </div>
          )}
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={!isLocked}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileLayerUrl}
        />

        <MapController events={validEvents} userLocation={userLocation} />
        <MapInteractionController isLocked={isLocked} />

        {/* 活動標記：使用新的 customEventIcon */}
        {validEvents.map((event, idx) => (
          <Marker key={idx} position={[event.lat, event.lon]} icon={customEventIcon}>
            <Popup
              // 微調 Popup 樣式，移除預設的邊距和背景，使用我們自己的容器
              className="custom-popup"
              closeButton={false}
              autoPanPadding={[50, 50]}
            >
              {/* 自定義 Popup 內容容器 */}
              <div className={`p-3 rounded-xl shadow-lg border backdrop-blur-md -m-[13px] -mb-[14px] ${isDarkMode ? 'bg-[#1a1a1a]/90 border-neutral-700 text-neutral-200' : 'bg-white/90 border-stone-100 text-stone-800'}`}>
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                  {event.time} {event.title}
                </div>
                <div className={`text-xs leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
                  {event.desc}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 使用者位置標記 */}
        {userLocation && userLocation.lat && userLocation.lon && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={userLocationIcon}
            zIndexOffset={1000}
          >
            <Popup closeButton={false} className="custom-popup">
               <div className="p-2 px-3 rounded-full bg-blue-500 shadow-lg -m-[13px] -mb-[14px]">
                <div className="font-bold text-xs text-white text-center whitespace-nowrap">您的位置</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* 補充全局樣式以覆蓋 Leaflet 預設 Popup 樣式 */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .custom-popup .leaflet-popup-tip {
          display: none !important; /* 隱藏下方的小三角形 */
        }
      `}</style>
    </div>
  );
};

export default DayMap;