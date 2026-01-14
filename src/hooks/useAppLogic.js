import { useAuth } from "./useAuth.js";
import { useUIState } from "./useUIState.js";
import { useTestMode } from "./useTestMode.js";
import { useNavigation } from "./useNavigation.js";
import { useWeather } from "./useWeather.js";
import { useShare } from "./useShare.js";
import { useAiChat } from "./useAiChat.js";

// 工具函式
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isDev = true;
const debugLog = (message, data = null) => {
  if (isDev) {
    if (data === null) {
      console.log(message);
    } else {
      console.log(message, data);
    }
  }
};
const debugGroup = (label) => {
  if (isDev) console.group(label);
};
const debugGroupEnd = () => {
  if (isDev) console.groupEnd();
};

/**
 * useAppLogic - 主應用邏輯組合 Hook
 * 
 * 此 Hook 組合了所有子 Hooks，提供統一的介面給 App.jsx 使用
 * 所有應用程式的狀態管理、業務邏輯和副作用都在這裡整合
 */
export const useAppLogic = (
  ENCRYPTED_API_KEY_PAYLOAD,
  ENCRYPTED_MAPS_KEY_PAYLOAD,
  ENCRYPTED_GAS_URL_PAYLOAD,
  ENCRYPTED_GAS_TOKEN_PAYLOAD,
  tripConfig,
  itineraryData,
  itineraryFlat,
  guidesFlat,
  shopsFlat
) => {
  // === 1. 認證管理 ===
  const auth = useAuth(
    ENCRYPTED_API_KEY_PAYLOAD,
    ENCRYPTED_MAPS_KEY_PAYLOAD,
    ENCRYPTED_GAS_URL_PAYLOAD,
    ENCRYPTED_GAS_TOKEN_PAYLOAD
  );

  // === 2. UI 狀態管理 ===
  const uiState = useUIState();

  // === 3. 測試模式管理 ===
  const testMode = useTestMode();

  // === 4. 天氣管理 ===
  const weather = useWeather(
    tripConfig,
    testMode.isTestMode,
    testMode.isTestModeRef,
    testMode.testLatitude,
    testMode.testLongitude,
    debugLog,
    uiState.showToast
  );

  // === 5. 導航管理 ===
  const navigation = useNavigation(
    itineraryData,
    uiState.showToast,
    uiState.isMapModalOpen,
    uiState.isCalculatorOpen,
    uiState.showWeatherDetail,
    testMode.isTestMode,
    testMode.testModeClickCount,
    testMode.setTestModeClickCount
  );

  // === 6. 分享管理 ===
  const copyToClipboard = async (text, successMsg = "已複製到剪貼簿") => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        uiState.showToast(successMsg);
        return true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          uiState.showToast(successMsg);
          return true;
        } else {
          throw new Error("複製命令失敗");
        }
      }
    } catch (err) {
      console.error("複製失敗:", err);
      uiState.showToast("複製失敗", "error");
      return false;
    }
  };

  const share = useShare(
    auth.mapsApiKey,
    weather.userWeather,
    testMode.isTestMode,
    testMode.testLatitude,
    testMode.testLongitude,
    weather.locationSource,
    weather.lastHighPrecisionAtRef,
    weather.getUserLocationWeather,
    weather.setUserWeather,
    uiState.showToast,
    copyToClipboard,
    debugLog,
    debugGroup,
    debugGroupEnd
  );

  // === 7. AI 聊天管理 ===
  const aiChat = useAiChat(
    auth.apiKey,
    tripConfig,
    uiState.showToast,
    sleep,
    testMode.isTestMode,
    testMode.testDateTime,
    weather.autoTimeZone,
    weather.hasLocationPermission,
    weather.userWeather,
    itineraryFlat,
    guidesFlat,
    shopsFlat,
    itineraryData
  );

  // === 返回所有狀態與函式 ===
  return {
    // 認證
    auth,
    
    // UI 狀態
    uiState,
    
    // 測試模式
    testMode,
    
    // 天氣
    weather,
    
    // 導航
    navigation,
    
    // 分享
    share,
    copyToClipboard,
    
    // AI 聊天
    aiChat,
    
    // 工具函式
    debugLog,
    debugGroup,
    debugGroupEnd,
    sleep,
  };
};
