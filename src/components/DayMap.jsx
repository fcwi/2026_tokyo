import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Lock, Unlock, Loader2 } from "lucide-react";
import MapModal from "./MapModal.jsx";

/**
 * DayMap Component with Route (OSRM)
 * Features:
 * 1. OSRM Routing: Fetches and displays driving route between events.
 * 2. Numbered Markers: Displays 1, 2, 3... sequence for itinerary.
 * 3. Polyline: Draws the path with gradient-like styling.
 */

// --- 1. 動態建立數字標記 icon (Numbered Icons) ---
const createNumberedIcon = (index, isDarkMode) => {
  return new L.DivIcon({
    className: "custom-numbered-marker",
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="
          position: absolute;
          inset: 0;
          background: ${isDarkMode ? "linear-gradient(135deg, #60a5fa 0%, #0ea5e9 100%)" : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"};
          border-radius: 50%;
          opacity: 0.2;
          transform: scale(1.5);
        "></div>
        <div style="
          position: relative;
          width: 100%;
          height: 100%;
          background: ${isDarkMode ? "linear-gradient(135deg, #60a5fa 0%, #0ea5e9 100%)" : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: ${isDarkMode ? "0 0 16px rgba(96, 165, 250, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4)" : "0 3px 10px rgba(0, 0, 0, 0.2)"};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
          font-family: sans-serif;
        ">
          ${index + 1}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const userLocationIcon = new L.DivIcon({
  className: "custom-user-icon",
  html: `
    <div style="position: relative; width: 20px; height: 20px; background-color: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 12px rgba(16, 185, 129, 0.5), 0 2px 6px rgba(0,0,0,0.3); z-index: 1000;">
      <div style="position: absolute; top: -10px; left: -10px; width: 40px; height: 40px; background-color: rgba(16, 185, 129, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    </div>
    <style> @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } } </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --- 2. 控制器組件 ---
const MapController = ({ events, userLocation, routeCoords }) => {
  const map = useMap();

  useEffect(() => {
    // 收集所有需要顯示的點：活動點 + 路線點 + 使用者位置
    const points = [];
    events.forEach((e) => {
      if (e.lat && e.lon) points.push([e.lat, e.lon]);
    });

    // 如果有路線，路線的轉折點也納入計算，確保整條路都在視野內
    if (routeCoords && routeCoords.length > 0) {
      // 為了效能，只取部分路線點來計算邊界 (例如每 10 個取 1 個)
      routeCoords
        .filter((_, i) => i % 10 === 0)
        .forEach((pt) => points.push(pt));
    }

    if (userLocation && userLocation.lat && userLocation.lon) {
      points.push([userLocation.lat, userLocation.lon]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [events, userLocation, routeCoords, map]);
  return null;
};

// --- 3. 主組件 ---
const DayMap = ({ events, userLocation, isDarkMode, theme, onModalToggle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 當彈窗狀態改變時，通知父組件 (App.jsx)
  useEffect(() => {
    if (onModalToggle) {
      onModalToggle(isModalOpen);
    }
  }, [isModalOpen, onModalToggle]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // 過濾出有效座標的事件
  const validEvents = useMemo(
    () => events.filter((e) => e.lat && e.lon),
    [events],
  );
  const defaultCenter = [35.6895, 139.6917];

  // 始終使用日間模式地圖磚層，夜間模式僅調暗亮度
  const tileLayerUrl =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  // 🔥 核心邏輯：從 OSRM 獲取路線資料
  useEffect(() => {
    if (validEvents.length < 2) {
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      setIsRouteLoading(true);
      try {
        // 1. 組合座標字串 (OSRM 格式: lon,lat;lon,lat)
        const waypoints = validEvents.map((e) => `${e.lon},${e.lat}`).join(";");

        // 2. 呼叫 API (使用 public OSRM server, 僅供開發測試)
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          // 3. 轉換座標：GeoJSON 是 [lon, lat]，Leaflet 需要 [lat, lon]
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord) => [coord[1], coord[0]],
          );
          setRouteCoords(coordinates);
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
      } finally {
        setIsRouteLoading(false);
      }
    };

    fetchRoute();
  }, [validEvents]);

  return (
    <div
      className={`relative w-full h-64 rounded-[2rem] overflow-hidden border z-0 group transition-all duration-300
      ${
        isDarkMode
          ? "border-neutral-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-[#1a1a1a]"
          : "border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-[#fdfdfd]"
      }`}
    >
      {/* 鎖定按鈕 (改為啟動互動模式) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
          setShowHint(false);
        }}
        className={`absolute top-4 right-4 z-[1001] flex items-center gap-1.5 px-4 py-2 rounded-full backdrop-blur-md shadow-lg border transition-all duration-300 active:scale-95
          ${
            isDarkMode
              ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
              : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
          }
        `}
      >
        <Unlock className="w-3.5 h-3.5" />
        <span className="text-[11px] font-black tracking-wider uppercase">
          開啟互動地圖
        </span>
      </button>

      {/* 載入中動畫 (位於左上角) */}
      {isRouteLoading && (
        <div className="absolute top-4 left-4 z-[1001] bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          計算路線中...
        </div>
      )}

      {/* 點擊遮罩 (點擊地圖任何地方皆可開啟彈窗) */}
      <div
        className="absolute inset-0 z-[1000] flex items-center justify-center bg-transparent cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
      >
        {showHint && (
          <div className="bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-2xl border border-white/10 animate-scale-in">
            🔍 點擊開啟互動地圖
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        touchZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
      >
        <TileLayer
          attribution="&copy; CARTO, &copy; OpenStreetMap"
          url={tileLayerUrl}
        />

        <MapController
          events={validEvents}
          userLocation={userLocation}
          routeCoords={routeCoords}
        />

        {/* 1. 繪製路線 (Polyline) */}
        {routeCoords.length > 0 && (
          <>
            {/* 外框線 (製造邊框效果) */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: isDarkMode ? "rgba(0,0,0,0.4)" : "white",
                weight: 8,
                opacity: 0.6,
              }}
            />
            {/* 主路線 */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: isDarkMode ? "#00d4ff" : "#3b82f6",
                weight: isDarkMode ? 5 : 4,
                opacity: isDarkMode ? 1 : 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {isDarkMode && (
              <Polyline
                positions={routeCoords}
                pathOptions={{
                  color: "#00d4ff",
                  weight: 5,
                  opacity: 0.3,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}
          </>
        )}

        {/* 2. 繪製編號標記 */}
        {validEvents.map((event, idx) => (
          <Marker
            key={idx}
            position={[event.lat, event.lon]}
            icon={createNumberedIcon(idx, isDarkMode)}
          >
            <Popup
              className="custom-popup"
              closeButton={false}
              autoPanPadding={[50, 50]}
            >
              <div
                className={`p-3 rounded-xl shadow-lg border backdrop-blur-md -m-[13px] -mb-[14px] ${isDarkMode ? "bg-[#1a1a1a]/90 border-neutral-700 text-neutral-200" : "bg-white/90 border-stone-100 text-stone-800"}`}
              >
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                    {idx + 1}
                  </span>
                  {event.time} {event.title}
                </div>
                <div
                  className={`text-xs leading-snug ${isDarkMode ? "text-neutral-400" : "text-stone-500"}`}
                >
                  {event.desc}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 使用者位置 */}
        {userLocation && userLocation.lat && userLocation.lon && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={userLocationIcon}
            zIndexOffset={1000}
          >
            <Popup closeButton={false} className="custom-popup">
              <div className="p-2 px-3 rounded-full bg-emerald-500 shadow-lg -m-[13px] -mb-[14px]">
                <div className="font-bold text-xs text-white text-center whitespace-nowrap">
                  您的位置
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* 樣式覆蓋 */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .custom-popup .leaflet-popup-tip {
          display: none !important;
        }
        /* 增加標記的淡入動畫 */
        .custom-numbered-marker {
          transition: transform 0.2s ease;
        }
        .custom-numbered-marker:hover {
          transform: scale(1.1);
          z-index: 1000 !important;
        }

        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out forwards;
        }
      `}</style>

      {/* 互動式地圖彈窗 (使用 Portal 確保在最上層) - 🚀 優化：始終渲染，內部用 CSS 控制顯示/隱藏 */}
      {createPortal(
        <MapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isDarkMode={isDarkMode}
          events={events}
          userLocation={userLocation}
          routeCoords={routeCoords}
          theme={theme}
        />,
        document.body,
      )}
    </div>
  );
};

export default DayMap;
