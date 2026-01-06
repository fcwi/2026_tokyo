import React, { useEffect, useRef, useMemo } from "react";
import { X, RotateCcw } from "lucide-react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * MapController for Modal
 */
const ModalMapController = ({ events, userLocation, routeCoords }) => {
  const map = useMap();
  const hasInitializedRef = useRef(false);
  
  // 使用 Ref 儲存最新的重置邏輯，避免 useEffect 因依賴項變動而頻繁重跑計時器
  const resetView = () => {
    const points = [];
    events.forEach((e) => {
      if (e.lat && e.lon) points.push([e.lat, e.lon]);
    });
    if (routeCoords && routeCoords.length > 0) {
      // 抽樣點以優化效能
      routeCoords.filter((_, i) => i % 10 === 0).forEach(pt => points.push(pt));
    }
    if (userLocation && userLocation.lat && userLocation.lon) {
      points.push([userLocation.lat, userLocation.lon]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  };

  useEffect(() => {
    // 處理 Android/行動裝置地圖圖資未即時更新的問題
    // 透過多次呼叫 invalidateSize 確保在各種動畫階段都能正確計算容器大小
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 500),
      setTimeout(() => {
        map.invalidateSize();
        // 僅在首次載入時自動重置視野
        if (!hasInitializedRef.current) {
          resetView();
          hasInitializedRef.current = true;
        }
      }, 1000)
    ];

    return () => timers.forEach(t => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]); // 僅依賴 map 實例

  return (
    <button
      onClick={resetView}
      className="absolute bottom-6 right-6 z-[1000] p-3 rounded-2xl bg-white/90 dark:bg-neutral-800/90 shadow-xl border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-300 hover:scale-110 active:scale-95 transition-all"
      title="重置視野"
    >
      <RotateCcw className="w-5 h-5" />
    </button>
  );
};

/**
 * MapModal Component
 * 
 * A full-screen interactive map modal for detailed route exploration.
 */
const MapModal = ({
  isOpen,
  onClose,
  isDarkMode,
  events,
  userLocation,
  routeCoords,
  theme,
}) => {
  // 1. 鎖定初始中心點與縮放，避免 React 重繪時因 props 變動導致地圖「彈回」
  // 我們只在彈窗開啟時計算一次，之後在地圖生命週期內保持不變
  const initialConfig = useMemo(() => {
    const valid = events.filter((e) => e.lat && e.lon);
    return {
      center: valid.length > 0 ? [valid[0].lat, valid[0].lon] : [35.6895, 139.6917],
      zoom: 13
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const validEvents = useMemo(() => events.filter((e) => e.lat && e.lon), [events]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 始終使用日間模式地圖磚層，夜間模式僅調暗亮度
  const tileLayerUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  // 使用主題設定或回退預設值 - 統一與計算機卡片樣式
  const glassClass = isDarkMode 
    ? (theme?.glassColors?.card?.dark || "bg-[rgba(28,28,30,0.85)] backdrop-blur-[30px] border-white/12")
    : (theme?.glassColors?.card?.light || "bg-white/75 backdrop-blur-[30px] border-white/60");

  const textClass = isDarkMode ? "text-white" : "text-stone-800";
  const textSecClass = isDarkMode ? "text-neutral-400" : "text-stone-500";

  // Custom Icons
  const createNumberedIcon = (number, isDark) => {
    return new L.DivIcon({
      className: "custom-numbered-marker",
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          background: ${isDark ? 'linear-gradient(135deg, #60a5fa 0%, #0ea5e9 100%)' : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: ${isDark ? '0 0 16px rgba(96, 165, 250, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4)' : '0 3px 10px rgba(0, 0, 0, 0.2)'};
        ">
          ${number + 1}
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

  return (
    <div 
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6"
      onTouchStart={(e) => {
        // 僅在點擊背景或 Header 時阻斷，避免干擾地圖內部的觸控邏輯
        if (e.target === e.currentTarget) e.stopPropagation();
      }}
      // 關鍵修正：在全螢幕模式下，強制阻斷所有 touchmove 事件傳遞到背景
      // 但排除地圖區域，讓地圖能正常滑動
      onTouchMove={(e) => {
        // 如果觸摸點不在地圖容器內，則阻斷事件（防止換頁）
        if (!e.target.closest('.leaflet-container')) {
          e.stopPropagation();
        }
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-4xl h-[85vh] rounded-[24px] overflow-hidden border shadow-2xl flex flex-col animate-modal-in ${glassClass}`}>
        
        {/* Header (Calculator Style) */}
        <div 
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? "border-white/5 bg-white/5" : "border-stone-200/50 bg-stone-50/50"
          }`}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <span className={`text-[10px] font-black tracking-[0.2em] uppercase mb-1 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}>
              Interactive Map
            </span>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold ${textClass}`}>
                當前路線導覽
              </h2>
              <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                LIVE
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-600"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={initialConfig.center}
            zoom={initialConfig.zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            dragging={true}
            touchZoom={true}
            preferCanvas={true}
            bounceAtZoomLimits={false}
          >
            <TileLayer
              attribution='&copy; CARTO, &copy; OpenStreetMap'
              url={tileLayerUrl}
              updateWhenIdle={false}
              keepBuffer={3}
            />

            <ModalMapController 
              events={validEvents} 
              userLocation={userLocation} 
              routeCoords={routeCoords} 
            />

            {/* Route Polyline */}
            {routeCoords && routeCoords.length > 0 && (
              <>
                <Polyline 
                  positions={routeCoords} 
                  pathOptions={{ 
                    color: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'white', 
                    weight: 10, 
                    opacity: 0.6 
                  }} 
                />
                <Polyline 
                  positions={routeCoords} 
                  pathOptions={{ 
                    color: isDarkMode ? '#00d4ff' : '#3b82f6', 
                    weight: isDarkMode ? 6 : 5, 
                    opacity: isDarkMode ? 1 : 0.9,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }} 
                />
                {isDarkMode && (
                  <Polyline 
                    positions={routeCoords} 
                    pathOptions={{ 
                      color: '#00d4ff', 
                      weight: 6, 
                      opacity: 0.3,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }} 
                  />
                )}
              </>
            )}

            {/* Event Markers */}
            {validEvents.map((event, idx) => (
              <Marker 
                key={idx} 
                position={[event.lat, event.lon]} 
                icon={createNumberedIcon(idx, isDarkMode)}
              >
                <Popup className="custom-popup" closeButton={false}>
                  <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md -m-[13px] -mb-[14px] min-w-[200px] ${
                    isDarkMode ? 'bg-[#1a1a1a]/95 border-neutral-700 text-neutral-200' : 'bg-white/95 border-stone-100 text-stone-800'
                  }`}>
                    <div className="font-bold text-base mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {event.time} {event.title}
                    </div>
                    <div className={`text-sm leading-relaxed ${textSecClass}`}>
                      {event.desc}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* User Location */}
            {userLocation && userLocation.lat && userLocation.lon && (
              <Marker
                position={[userLocation.lat, userLocation.lon]}
                icon={userLocationIcon}
                zIndexOffset={1000}
              >
                <Popup closeButton={false} className="custom-popup">
                   <div className="p-2 px-4 rounded-full bg-emerald-500 shadow-lg -m-[13px] -mb-[14px]">
                    <div className="font-bold text-xs text-white text-center whitespace-nowrap">您的位置</div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Footer / Controls */}
        <div className={`p-5 border-t flex items-center ${
          isDarkMode ? "border-white/5 bg-white/5" : "border-stone-200/50 bg-stone-50/30"
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`} />
            <div className={`text-xs font-medium ${textSecClass}`}>
              點擊標記查看詳細資訊
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .custom-popup .leaflet-popup-tip {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default MapModal;
