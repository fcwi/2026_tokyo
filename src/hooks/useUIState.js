import { useState, useCallback } from "react";

/**
 * useUIState - UI 狀態管理 Hook
 * 
 * 功能：
 * - Toast 訊息管理
 * - 模態框狀態（計算機、地圖、天氣詳情）
 * - 展開/收合項目管理
 * - 其他 UI 相關狀態
 */
export const useUIState = () => {
  // Toast 訊息
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // 模態框狀態
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [showWeatherDetail, setShowWeatherDetail] = useState(false);

  // 展開項目管理
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedGuides, setExpandedGuides] = useState({});
  const [expandedShops, setExpandedShops] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});

  // 航班資訊展開狀態
  const [isFlightInfoExpanded, setIsFlightInfoExpanded] = useState(false);

  // 圖片預覽
  const [fullPreviewImage, setFullPreviewImage] = useState(null);

  // 載入文字
  const [loadingText, setLoadingText] = useState("");

  // 位置更新中
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // 分享中
  const [isSharing, setIsSharing] = useState(false);

  // 下拉刷新
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // iOS PWA 安裝提示
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);

  // 螢幕方向警告
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);

  // AI 搜尋
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [showAiSearch, setShowAiSearch] = useState(false);

  // Toast 顯示函式
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  // 展開/收合函式
  const toggleExpand = (dayIndex, eventIndex) => {
    const key = `${dayIndex}-${eventIndex}`;
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleMessageExpand = (index) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleGuide = (index) => {
    setExpandedGuides((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleShop = (index) => {
    setExpandedShops((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return {
    // Toast
    toast,
    showToast,

    // 模態框
    isCalculatorOpen,
    setIsCalculatorOpen,
    isMapModalOpen,
    setIsMapModalOpen,
    showWeatherDetail,
    setShowWeatherDetail,

    // 展開項目
    expandedItems,
    setExpandedItems,
    expandedGuides,
    expandedShops,
    expandedMessages,
    setExpandedMessages,
    toggleExpand,
    toggleMessageExpand,
    toggleGuide,
    toggleShop,

    // 航班資訊
    isFlightInfoExpanded,
    setIsFlightInfoExpanded,

    // 圖片預覽
    fullPreviewImage,
    setFullPreviewImage,

    // 載入狀態
    loadingText,
    setLoadingText,
    isUpdatingLocation,
    setIsUpdatingLocation,
    isSharing,
    setIsSharing,

    // 下拉刷新
    pullDistance,
    setPullDistance,
    isRefreshing,
    setIsRefreshing,

    // iOS & 方向警告
    showIOSInstallPrompt,
    setShowIOSInstallPrompt,
    showOrientationWarning,
    setShowOrientationWarning,

    // AI 搜尋
    aiSearchQuery,
    setAiSearchQuery,
    showAiSearch,
    setShowAiSearch,
  };
};
