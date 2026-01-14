import { useState, useEffect, useRef } from "react";

/**
 * useTestMode - 測試模式管理 Hook
 * 
 * 功能：
 * - 測試模式啟用/關閉
 * - 測試時間、位置設定
 * - 天氣覆寫（總覽 + 各天）
 * - 設定凍結/解凍
 */
export const useTestMode = () => {
  const [isTestMode, setIsTestMode] = useState(false);
  const isTestModeRef = useRef(false);
  const [testModeClickCount, setTestModeClickCount] = useState(0);
  const [testDateTime, setTestDateTime] = useState(new Date());
  const [testLatitude, setTestLatitude] = useState(35.4437);
  const [testLongitude, setTestLongitude] = useState(138.3919);
  const [testWeatherOverride, setTestWeatherOverride] = useState({
    overview: null,
    days: {},
  });
  const [frozenTestDateTime, setFrozenTestDateTime] = useState(null);
  const [frozenTestWeatherOverride, setFrozenTestWeatherOverride] =
    useState(null);

  // 同步 ref
  useEffect(() => {
    isTestModeRef.current = isTestMode;
  }, [isTestMode]);

  // 凍結測試設定
  const freezeTestSettings = (showToast) => {
    setFrozenTestDateTime(new Date(testDateTime));
    setFrozenTestWeatherOverride(
      JSON.parse(JSON.stringify(testWeatherOverride)),
    );
    console.log(
      `🔒 凍結測試設定 - dateTime=${testDateTime.toLocaleString("zh-TW")}, weather=`,
      testWeatherOverride,
    );
    if (showToast) showToast("✅ 測試設定已凍結，不會被覆蓋", "success");
  };

  // 解凍測試設定
  const unfreezeTestSettings = (showToast) => {
    setFrozenTestDateTime(null);
    setFrozenTestWeatherOverride(null);
    console.log(`🔓 解凍測試設定`);
    if (showToast) showToast("測試設定已解凍", "success");
  };

  return {
    // 狀態
    isTestMode,
    isTestModeRef,
    testModeClickCount,
    testDateTime,
    testLatitude,
    testLongitude,
    testWeatherOverride,
    frozenTestDateTime,
    frozenTestWeatherOverride,

    // 設定函式
    setIsTestMode,
    setTestModeClickCount,
    setTestDateTime,
    setTestLatitude,
    setTestLongitude,
    setTestWeatherOverride,

    // 動作函式
    freezeTestSettings,
    unfreezeTestSettings,
  };
};
