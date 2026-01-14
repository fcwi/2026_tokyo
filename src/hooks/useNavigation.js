import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useNavigation - 導航與路由管理 Hook
 * 
 * 功能：
 * - Tab 切換（itinerary, shops, guides, resources, ai）
 * - Day 切換（-1 for Overview, 0-5 for Day 1-6）
 * - 瀏覽器歷史記錄管理
 * - 滑動手勢偵測
 * - 導覽列自動捲動
 */
export const useNavigation = (itineraryData, showToast, isMapModalOpen, isCalculatorOpen, showWeatherDetail, isTestMode, testModeClickCount, setTestModeClickCount) => {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [activeDay, setActiveDay] = useState(-1);
  const [[, direction], setPage] = useState([activeDay, 0]);

  // 導覽列自動捲動用的 Ref
  const navContainerRef = useRef(null);
  const navItemsRef = useRef({}); // 用物件來存每一顆按鈕的 ref

  // 滑動手勢
  const [touchStart, setTouchStart] = useState(null);

  // 瀏覽器歷史記錄管理 - 處理返回鍵行為
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;

      if (!state) {
        // 如果沒有狀態，表示要退出應用
        return;
      }

      // 處理模態框關閉
      if (state.modal) {
        switch (state.modal) {
          case "calculator":
            // setIsCalculatorOpen(false); // 這需要從父組件傳入
            break;
          case "map":
            // setIsMapModalOpen(false);
            break;
          case "weather":
            // setShowWeatherDetail(false);
            break;
          case "testMode":
            // setIsTestMode(false);
            break;
          default:
            break;
        }
        return;
      }

      // 處理 tab 切換
      if (state.tab && state.tab !== activeTab) {
        setActiveTab(state.tab);
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);

    // 初始化：將當前狀態推入歷史記錄
    if (!window.history.state) {
      window.history.replaceState({ tab: activeTab }, "");
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeTab]);

  // 包裝 setActiveTab，添加歷史記錄
  const handleTabChange = useCallback(
    (newTab) => {
      if (newTab === activeTab) return;

      setActiveTab(newTab);
      window.history.pushState({ tab: newTab }, "");
    },
    [activeTab],
  );

  // Day 切換
  const changeDay = (newDay) => {
    const newDirection = newDay > activeDay ? 1 : -1;
    setPage([newDay, newDirection]);
    setActiveDay(newDay);
  };

  // 滑動手勢處理
  const onTouchStart = (e) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = (e) => {
    if (!touchStart) return;

    // 如果任何全螢幕彈窗開啟中，則完全停用滑動換頁功能
    if (showWeatherDetail || isCalculatorOpen || isMapModalOpen) {
      setTouchStart(null);
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const distanceX = touchStart.x - endX;
    const distanceY = touchStart.y - endY;

    const absX = Math.abs(distanceX);
    const absY = Math.abs(distanceY);

    const minSwipeDistance = 75;
    const slopeThreshold = 2.5;

    // 判斷是否為有效的水平滑動，並排除垂直捲動的干擾
    if (absX > minSwipeDistance && absX > absY * slopeThreshold) {
      if (testModeClickCount > 0) {
        setTestModeClickCount(0);
        showToast("連續點擊計數已重置，請重新開始", "info");
      }

      if (distanceX > 0) {
        if (activeDay < itineraryData.length - 1) {
          changeDay(activeDay + 1);
        }
      } else {
        if (activeDay > -1) {
          changeDay(activeDay - 1);
        }
      }
    }

    setTouchStart(null);
  };

  // 導覽列自動捲動
  useEffect(() => {
    // 取得當前 activeDay 對應的按鈕 DOM 元素
    const currentTab = navItemsRef.current[activeDay];

    if (currentTab) {
      // 使用原生 API 讓它平滑捲動到視野中央
      currentTab.scrollIntoView({
        behavior: "smooth", // 平滑動畫
        block: "nearest", // 垂直方向不動
        inline: "center", // 水平方向置中 (關鍵！)
      });
    }
  }, [activeDay]);

  return {
    // 狀態
    activeTab,
    activeDay,
    direction,
    touchStart,
    navContainerRef,
    navItemsRef,

    // 設定函式
    setActiveTab,
    setActiveDay,

    // 動作函式
    handleTabChange,
    changeDay,
    onTouchStart,
    onTouchEnd,
  };
};
