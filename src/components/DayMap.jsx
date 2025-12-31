import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// 引入鎖定相關圖示
import { Lock, Unlock, Move } from "lucide-react";

// --- 1. 定義圖標資源 (維持不變) ---
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

// --- 2. 地圖縮放控制器 (維持不變) ---
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
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [events, userLocation, map]);
  return null;
};

// --- 3. 🟢 新增：地圖互動鎖定控制器 ---
// 這個元件負責直接操作 Leaflet 實例來開關互動功能
const MapInteractionController = ({ isLocked }) => {
  const map = useMap();

  useEffect(() => {
    if (isLocked) {
      // 鎖定時：關閉拖曳與縮放，讓手指滑動可以直接穿透地圖捲動網頁
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      if (map.tap) map.tap.disable();
    } else {
      // 解鎖時：恢復所有操作
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      // map.scrollWheelZoom.enable(); // 選擇性開啟滾輪，通常手機版建議關閉以免誤觸
    }
  }, [isLocked, map]);

  return null;
};

const DayMap = ({ events, userLocation, isDarkMode }) => {
  // 🟢 新增：控制鎖定狀態的 State (預設為 true 鎖定)
  const [isLocked, setIsLocked] = useState(true);

  const validEvents = events.filter((e) => e.lat && e.lon);
  const defaultCenter = [35.6895, 139.6917];

  const tileLayerUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-inner border border-stone-200/50 z-0 group">
      {/* 🟢 新增：鎖定切換按鈕 */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // 防止點擊穿透
          setIsLocked(!isLocked);
        }}
        className={`absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-md border transition-all duration-300 active:scale-95
          ${
            isLocked
              ? "bg-white/80 text-stone-600 border-stone-200 hover:bg-white" // 鎖定樣式
              : "bg-blue-500/90 text-white border-blue-400 ring-2 ring-blue-500/30" // 解鎖樣式 (比較顯眼)
          }
        `}
        title={isLocked ? "點擊以移動地圖" : "點擊鎖定地圖"}
      >
        {isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">已鎖定</span>
          </>
        ) : (
          <>
            <Unlock className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">可移動</span>
          </>
        )}
      </button>

      {/* 🟢 新增：提示遮罩 (僅在鎖定且手指嘗試在上面滑動時顯示，這需要額外 CSS，這裡先做簡單版提示) */}
      {/* 這裡我們用一個簡單的視覺提示：當鎖定時，地圖稍微暗一點點，或不做任何事 */}

      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false} // 初始值，會被 Controller 覆蓋
        dragging={!isLocked} // 初始值，會被 Controller 覆蓋
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url={tileLayerUrl}
        />

        {/* 控制器們 */}
        <MapController events={validEvents} userLocation={userLocation} />
        {/* 👇 放入互動控制器，將 State 傳入 */}
        <MapInteractionController isLocked={isLocked} />

        {/* 標記點 */}
        {validEvents.map((event, idx) => (
          <Marker key={idx} position={[event.lat, event.lon]} icon={redIcon}>
            <Popup>
              <div className="font-bold text-sm text-gray-800 mb-1">
                {event.time} {event.title}
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                {event.desc}
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
            <Popup>
              <div className="font-bold text-blue-600">您的位置</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* 🟢 (選用) 鎖定狀態下的覆蓋層：如果您希望鎖定時「完全」不干擾，甚至連點擊 Marker 都不行，可以把下面這行註解打開 */}
      {/* {isLocked && <div className="absolute inset-0 z-[400] bg-transparent pointer-events-auto" />} */}
    </div>
  );
};

export default DayMap;
