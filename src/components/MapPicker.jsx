import React, { useEffect, useRef, useCallback } from "react";
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * MapPicker Component
 * 
 * An interactive map tool for selecting geographic coordinates.
 * Features:
 * 1. Click-to-pick: Select coordinates by clicking anywhere on the map.
 * 2. Real-time marker: Visual feedback for the selected location.
 * 3. Zoom & Reset controls: Custom buttons for map navigation.
 * 4. Coordinate display: Shows precise latitude and longitude.
 * 5. Theme-aware styling: Adapts to Light/Dark mode.
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
  const markerRef = useRef(null);

  /**
   * Updates the marker position on the map.
   * Creates the marker if it doesn't exist.
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
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map instance
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([latitude, longitude], 13);

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add click event listener for coordinate selection
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
        onLocationChange({ lat, lon: lng });
      });
    }

    // Sync map view with current coordinates
    mapInstanceRef.current.setView([latitude, longitude], 13);

    // Sync marker with current coordinates
    updateMarker(latitude, longitude);

    return () => {
      // Cleanup logic if needed (currently keeping instance for performance)
    };
  }, [latitude, longitude, updateMarker, onLocationChange]);

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

      {/* 地圖容器 */}
      <div
        ref={mapRef}
        className={`w-full h-64 rounded-xl border overflow-hidden ${
          isDarkMode ? "border-neutral-700" : "border-stone-300"
        }`}
        style={{
          boxShadow: isDarkMode
            ? "0 4px 12px rgba(0, 0, 0, 0.3)"
            : "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      />

      {/* 地圖控制按鈕 */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={handleZoomIn}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            isDarkMode
              ? "bg-neutral-700 hover:bg-neutral-600 text-white"
              : "bg-stone-200 hover:bg-stone-300"
          }`}
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            isDarkMode
              ? "bg-neutral-700 hover:bg-neutral-600 text-white"
              : "bg-stone-200 hover:bg-stone-300"
          }`}
          title="縮小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            isDarkMode
              ? "bg-neutral-700 hover:bg-neutral-600 text-white"
              : "bg-stone-200 hover:bg-stone-300"
          }`}
          title="重置"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 坐標顯示 */}
      <div
        className={`text-xs p-3 rounded-lg border ${
          isDarkMode
            ? "bg-neutral-900/50 border-neutral-700"
            : "bg-stone-100 border-stone-300"
        }`}
      >
        <div className={`font-bold mb-1 ${theme.text}`}>選定的位置</div>
        <div className={theme.textSec}>
          <div>🧭 緯度: {latitude.toFixed(6)}</div>
          <div>🧭 經度: {longitude.toFixed(6)}</div>
        </div>
        <div className={`text-xs mt-2 ${theme.textSec}`}>
          💡 點擊地圖上任何位置來選擇新的坐標
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
