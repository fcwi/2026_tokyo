import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Lock, Unlock, Loader2 } from "lucide-react";

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
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="
          position: absolute;
          inset: 0;
          background-color: ${isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)'};
          border-radius: 50%;
          transform: scale(1.2);
        "></div>
        <div style="
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
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
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
};

const userLocationIcon = new L.DivIcon({
  className: "custom-user-icon",
  html: `
    <div style="position: relative; width: 20px; height: 20px; background-color: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 1000;">
      <div style="position: absolute; top: -10px; left: -10px; width: 34px; height: 34px; background-color: rgba(16, 185, 129, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
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
      routeCoords.filter((_, i) => i % 10 === 0).forEach(pt => points.push(pt));
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

// --- 3. 主組件 ---
const DayMap = ({ events, userLocation, isDarkMode }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // 過濾出有效座標的事件
  const validEvents = useMemo(() => events.filter((e) => e.lat && e.lon), [events]);
  const defaultCenter = [35.6895, 139.6917];

  const tileLayerUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

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
        const waypoints = validEvents
          .map(e => `${e.lon},${e.lat}`)
          .join(';');

        // 2. 呼叫 API (使用 public OSRM server, 僅供開發測試)
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          // 3. 轉換座標：GeoJSON 是 [lon, lat]，Leaflet 需要 [lat, lon]
          const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
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
    <div className={`relative w-full h-64 rounded-[2rem] overflow-hidden border z-0 group transition-all duration-300
      ${isDarkMode 
        ? "border-neutral-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-[#1a1a1a]" 
        : "border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-[#fdfdfd]"
      }`}
    >
      {/* 鎖定按鈕 */}
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

      {/* 載入中動畫 (位於左上角) */}
      {isRouteLoading && (
        <div className="absolute top-4 left-4 z-[1001] bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          計算路線中...
        </div>
      )}

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
            <div className="bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-2xl border border-white/10 animate-scale-in">
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
          attribution='&copy; CARTO & OSRM'
          url={tileLayerUrl}
        />

        <MapController events={validEvents} userLocation={userLocation} routeCoords={routeCoords} />
        <MapInteractionController isLocked={isLocked} />

        {/* 1. 繪製路線 (Polyline) */}
        {routeCoords.length > 0 && (
          <>
            {/* 外框線 (製造邊框效果) */}
            <Polyline 
              positions={routeCoords} 
              pathOptions={{ 
                color: isDarkMode ? 'rgba(0,0,0,0.5)' : 'white', 
                weight: 6, 
                opacity: 0.8 
              }} 
            />
            {/* 主路線 */}
            <Polyline 
              positions={routeCoords} 
              pathOptions={{ 
                color: '#3b82f6', // blue-500
                weight: 4, 
                opacity: 0.9,
                dashArray: '1, 6', // 如果想要虛線效果，可以取消註解這行
                lineCap: 'round'
              }} 
            />
          </>
        )}

        {/* 2. 繪製編號標記 */}
        {validEvents.map((event, idx) => (
          <Marker 
            key={idx} 
            position={[event.lat, event.lon]} 
            icon={createNumberedIcon(idx, isDarkMode)}
          >
            <Popup className="custom-popup" closeButton={false} autoPanPadding={[50, 50]}>
              <div className={`p-3 rounded-xl shadow-lg border backdrop-blur-md -m-[13px] -mb-[14px] ${isDarkMode ? 'bg-[#1a1a1a]/90 border-neutral-700 text-neutral-200' : 'bg-white/90 border-stone-100 text-stone-800'}`}>
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                    {idx + 1}
                  </span>
                  {event.time} {event.title}
                </div>
                <div className={`text-xs leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-stone-500'}`}>
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
                <div className="font-bold text-xs text-white text-center whitespace-nowrap">您的位置</div>
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
      `}</style>
    </div>
  );
};

export default DayMap;