import { useState, useEffect } from "react";
import { CryptoUtils } from "../utils/crypto.js";

/**
 * useAuth - 認證與加密管理 Hook
 * 
 * 功能：
 * - 密碼驗證與自動登入
 * - API Key 解密（Gemini, Maps, GAS）
 * - 加密工具（供開發者使用）
 */
export const useAuth = (
  ENCRYPTED_API_KEY_PAYLOAD,
  ENCRYPTED_MAPS_KEY_PAYLOAD,
  ENCRYPTED_GAS_URL_PAYLOAD,
  ENCRYPTED_GAS_TOKEN_PAYLOAD
) => {
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [mapsApiKey, setMapsApiKey] = useState("");
  const [gasUrl, setGasUrl] = useState("");
  const [gasToken, setGasToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showEncryptTool, setShowEncryptTool] = useState(false);
  const [toolKey, setToolKey] = useState("");
  const [toolPwd, setToolPwd] = useState("");
  const [toolResult, setToolResult] = useState("");
  const [keyType, setKeyType] = useState("gemini");

  // 嘗試解鎖（解密 API Keys）
  const attemptUnlock = async (inputPwd, isAuto = false) => {
    setIsAuthLoading(true);
    setAuthError("");
    try {
      if (ENCRYPTED_API_KEY_PAYLOAD) {
        const decryptedGemini = await CryptoUtils.decrypt(
          ENCRYPTED_API_KEY_PAYLOAD,
          inputPwd,
        );
        if (decryptedGemini && decryptedGemini.length > 10) {
          setApiKey(decryptedGemini);
        } else {
          throw new Error("Gemini Key 解密失敗");
        }
      }

      if (ENCRYPTED_MAPS_KEY_PAYLOAD) {
        try {
          const decryptedMaps = await CryptoUtils.decrypt(
            ENCRYPTED_MAPS_KEY_PAYLOAD,
            inputPwd,
          );
          if (decryptedMaps && decryptedMaps.length > 5) {
            setMapsApiKey(decryptedMaps);
          }
        } catch (e) {
          console.warn("Maps Key 解密失敗", e);
        }
      }
      if (ENCRYPTED_GAS_URL_PAYLOAD) {
        try {
          const decryptedUrl = await CryptoUtils.decrypt(
            ENCRYPTED_GAS_URL_PAYLOAD,
            inputPwd,
          );
          if (decryptedUrl && decryptedUrl.startsWith("http")) {
            setGasUrl(decryptedUrl);
          }
        } catch (e) {
          console.warn("GAS URL 解密失敗", e);
        }
      }

      if (ENCRYPTED_GAS_TOKEN_PAYLOAD) {
        try {
          const decryptedToken = await CryptoUtils.decrypt(
            ENCRYPTED_GAS_TOKEN_PAYLOAD,
            inputPwd,
          );
          if (decryptedToken) {
            setGasToken(decryptedToken);
          }
        } catch (e) {
          console.warn("GAS Token 解密失敗", e);
        }
      }

      setIsVerified(true);
      localStorage.setItem("trip_password", inputPwd);
    } catch {
      if (!isAuto) setAuthError("密碼錯誤，請再試一次");
      if (isAuto) localStorage.removeItem("trip_password");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 表單提交處理
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    attemptUnlock(password);
  };

  // 生成加密字串（開發工具）
  const generateEncryptedString = async () => {
    if (!toolKey || !toolPwd) {
      setToolResult("請輸入 Key 與密碼");
      return;
    }
    try {
      const result = await CryptoUtils.encrypt(toolKey, toolPwd);
      setToolResult(result);
    } catch {
      setToolResult("加密失敗");
    }
  };

  // 登出 / 鎖定
  const handleLock = () => {
    setIsVerified(false);
    localStorage.removeItem("trip_password");
  };

  // 初始化：檢查已儲存的密碼
  useEffect(() => {
    const checkSavedPassword = async () => {
      const savedPwd = localStorage.getItem("trip_password");
      if (savedPwd && ENCRYPTED_API_KEY_PAYLOAD) {
        await attemptUnlock(savedPwd, true);
      } else if (!ENCRYPTED_API_KEY_PAYLOAD) {
        setIsVerified(true);
      }
    };
    checkSavedPassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // 狀態
    isVerified,
    password,
    apiKey,
    mapsApiKey,
    gasUrl,
    gasToken,
    authError,
    isAuthLoading,
    showEncryptTool,
    toolKey,
    toolPwd,
    toolResult,
    keyType,

    // 設定函式
    setPassword,
    setShowEncryptTool,
    setToolKey,
    setToolPwd,
    setToolResult,
    setKeyType,

    // 動作函式
    handleAuthSubmit,
    generateEncryptedString,
    handleLock,
    attemptUnlock,
  };
};
