// hooks/useSwipeGesture.js
// 用於偵測水平滑動手勢的自訂 Hook - 增強版：支援實時滑動方向狀態

import { useRef, useCallback, useState } from "react";

/**
 * useSwipeGesture - 偵測水平滑動手勢
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - 往左滑動時觸發的回調函數
 * @param {Function} options.onSwipeRight - 往右滑動時觸發的回調函數
 * @param {number} options.threshold - 觸發滑動的最小距離（預設 50px）
 * @returns {Object} - 包含 touch 事件處理器和當前滑動狀態
 */
const useSwipeGesture = ({
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
} = {}) => {
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const isHorizontalSwipe = useRef(null);

    // 🆕 實時滑動狀態：null, "left", "right"
    const [swipeDirection, setSwipeDirection] = useState(null);
    // 🆕 滑動距離（用於動畫強度）
    const [swipeDistance, setSwipeDistance] = useState(0);

    const onTouchStart = useCallback((e) => {
        // 只追蹤單指觸控
        if (e.touches.length !== 1) return;

        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isHorizontalSwipe.current = null;
        setSwipeDirection(null);
        setSwipeDistance(0);
    }, []);

    const onTouchMove = useCallback((e) => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;
        const diffX = touchCurrentX - touchStartX.current;
        const diffY = Math.abs(touchCurrentY - touchStartY.current);
        const absDiffX = Math.abs(diffX);

        // 判斷是否為水平滑動（首次判斷後鎖定）
        if (isHorizontalSwipe.current === null && (absDiffX > 10 || diffY > 10)) {
            isHorizontalSwipe.current = absDiffX > diffY;
        }

        // 🆕 更新實時滑動方向和距離
        if (isHorizontalSwipe.current && absDiffX > 20) {
            setSwipeDirection(diffX < 0 ? "left" : "right");
            setSwipeDistance(Math.min(absDiffX, 150)); // 最大 150px
        }
    }, []);

    const onTouchEnd = useCallback((e) => {
        if (touchStartX.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX.current;

        // 只在確認為水平滑動時觸發
        if (isHorizontalSwipe.current && Math.abs(diffX) >= threshold) {
            if (diffX < 0 && onSwipeLeft) {
                onSwipeLeft();
            } else if (diffX > 0 && onSwipeRight) {
                onSwipeRight();
            }
        }

        // 重置狀態
        touchStartX.current = null;
        touchStartY.current = null;
        isHorizontalSwipe.current = null;
        setSwipeDirection(null);
        setSwipeDistance(0);
    }, [onSwipeLeft, onSwipeRight, threshold]);

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        swipeDirection,  // 🆕 當前滑動方向
        swipeDistance,   // 🆕 滑動距離
    };
};

export default useSwipeGesture;
