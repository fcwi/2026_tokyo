import React, { memo } from 'react';
import { tripConfig } from "../../tripdata_2026_karuizawa.jsx";

// 輔助組件：雲朵 SVG
const CloudSVG = ({ style, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill={color}
    style={{
      ...style,
      position: "absolute",
      filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1)) blur(3px)",
    }}
  >
    <path d="M18.5,12c-0.3,0-0.6,0.1-0.9,0.1C17.2,9.1,14.4,7,11,7c-4.4,0-8,3.6-8,8s3.6,8,8,8c0.6,0,1.2-0.1,1.7-0.2C13.5,23.5,14.7,24,16,24c3.3,0,6-2.7,6-6S19.3,12,18.5,12z" />
  </svg>
);

const getThemeConfig = () => {
  const theme = tripConfig.theme || {};
  return {
    cloudColors: theme.cloudColors || {
      heavy: "#bdc3c7",
      medium: "#d1d5db",
      light: "#ecf0f1",
    },
    celestialColors: theme.celestialColors || {
      sun: "#f1c40f",
      sunGlow: "#f39c12",
      moon: "#f5f6fa",
      moonShadow: "rgba(245, 246, 250, 0.4)",
    },
  };
};

const SkyObjects = memo(({ isDay, condition }) => {
  const showCelestial = condition === "clear";
  const isCloudy = condition !== "clear";
  const themeConfig = getThemeConfig();
  const cloudColors = themeConfig.cloudColors;
  
  let cloudColor;
  if (condition === "rain" || condition === "snow") {
    cloudColor = cloudColors.heavy;
  } else if (condition === "cloudy" && isDay) {
    cloudColor = cloudColors.medium;
  } else {
    cloudColor = cloudColors.light;
  }

  const celestial = themeConfig.celestialColors;
  const celestialStyle = {
    top: "10%",
    right: "10%",
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: isDay ? celestial.sun : "transparent",
    boxShadow: isDay
      ? `0 0 60px ${celestial.sunGlow}`
      : `-30px 10px 0 0 ${celestial.moon}, -30px 10px 15px 2px ${celestial.moonShadow}`,
    transform: showCelestial
      ? isDay
        ? "scale(1)"
        : "rotate(-15deg) scale(0.8)"
      : "scale(0) translateY(50px)",
    opacity: showCelestial ? 1 : 0,
    zIndex: 0,
    position: "absolute",
    transition: "all 1s ease-in-out", // 確保平滑切換
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <div style={celestialStyle} />

      {isCloudy && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-hidden opacity-60">
          <CloudSVG
            color={cloudColor}
            style={{
              width: "200px",
              top: "15%",
              opacity: 0.8,
              animation: "cloudFloat 30s linear infinite",
            }}
          />
          <CloudSVG
            color={cloudColor}
            style={{
              width: "150px",
              top: "35%",
              opacity: 0.6,
              animation: "cloudFloat 45s linear infinite reverse",
            }}
          />
          <CloudSVG
            color={cloudColor}
            style={{
              width: "250px",
              top: "5%",
              opacity: 0.4,
              animation: "cloudFloat 60s linear infinite",
            }}
          />
        </div>
      )}
    </div>
  );
});

export default memo(SkyObjects);