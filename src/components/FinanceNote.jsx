// components/FinanceNote.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import useSwipeGesture from "../hooks/useSwipeGesture.js";
import { createPortal } from "react-dom";
import {
  Camera,
  Send,
  DollarSign,
  MessageSquare,
  Loader,
  Trash2,
  X,
  LogOut,
  Wallet,
  Plus,
  Check,
  Search,
  RefreshCcw,
  Edit3,
  Save,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsUpDown,
  Scan,
} from "lucide-react";
import {
  uploadToGAS,
  parseReceiptWithGemini,
  fetchFromGAS,
} from "../utils/financeHelper";
import { processFileForHeic } from "../utils/imageUtils";
import { financeDB } from "../utils/indexedDBManager.js";

// 預設頭像列表
const AVATARS = [
  // 動物
  "🐶",
  "🐱",
  "🐰",
  "🦊",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🦄",
  "🦖",
  "🐧",
  "🦉",
  "🐤",
  "🦋",
  // 更多動物
  "🐻",
  "🐺",
  "🦝",
  "🦔",
  "🦚",
  "🦜",
  "🐦",
  "🐬",
  "🐳",
  "🦈",
  "🐙",
  "🦀",
  // 人物
  "👻",
  "👽",
  "🤖",
  "👾",
  "🧑‍🚀",
  "🧑‍🍳",
  // 其他
  "🌸",
  "🌻",
  "🌿",
  "🌟",
  "🌞",
  "🌙",
];

// 時間格式化小工具（年/月/日 + 時:分:秒，24小時制）
const formatTime = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
};

// 🆕 圖片壓縮函式 - 上傳雲端前壓縮以節省頻寬
const compressImage = (dataUrl, maxSizeKB = 400) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");

      // 限制最大尺寸為 1200px
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1200;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // 動態調整品質以達到目標大小
      let quality = 0.8;
      let compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

      // 如果太大，降低品質
      while (compressedDataUrl.length > maxSizeKB * 1024 && quality > 0.3) {
        quality -= 0.1;
        compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      console.log(
        `🖼️ 圖片壓縮: ${(dataUrl.length / 1024).toFixed(0)} KB → ${(compressedDataUrl.length / 1024).toFixed(0)} KB`,
      );
      resolve(compressedDataUrl);
    };

    img.onerror = reject;
  });
};

const FinanceScreen = ({
  isDarkMode,
  theme,
  rateData,
  gasUrl,
  gasToken,
  apiKey,
  setFullPreviewImage,
  showToast,
}) => {
  // --- 0. 輔助工具 ---
  const todayStr = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  }, []);

  // --- 0.5. IndexedDB 初始化狀態 ---
  const [isDBReady, setIsDBReady] = useState(false);

  // --- 1. 基礎狀態 ---
  const [user, setUser] = useState(null);
  const [setupName, setSetupName] = useState("");
  const [setupAvatar, setSetupAvatar] = useState(AVATARS[0]);
  const [mode, setMode] = useState("finance");
  const [records, setRecords] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); // 🆕 頭像選單狀態
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }); // 🆕 選單位置
  const menuButtonRef = useRef(null); // 🆕 頭像按鈕 ref

  // --- 2. 輸入與 AI 狀態 ---
  const [inputText, setInputText] = useState("");
  const [amount, setAmount] = useState("");
  const [noteImages, setNoteImages] = useState([]);

  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const appendInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const skipAutoScrollRef = useRef(false); // 🆕 用於控制是否跳過自動滾動

  // --- 3. 發票批次處理狀態 ---
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [receiptImages, setReceiptImages] = useState([]);

  // --- 4. 編輯功能狀態 ---
  const [editingRecord, setEditingRecord] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // --- 4.5. 日期收折狀態 (預設全部收折) ---
  const [expandedDates, setExpandedDates] = useState({});

  // --- 4.6. 搜尋功能狀態 ---
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // --- 4.8. 滑動手勢切換模式 ---
  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
    swipeDistance,
  } = useSwipeGesture({
    onSwipeLeft: () => setMode("note"), // 往左滑（頁面往右）→ 記事
    onSwipeRight: () => setMode("finance"), // 往右滑（頁面往左）→ 記帳
    threshold: 50,
  });

  // --- 4.7. 計算當前分組狀態 ---
  const currentModeRecords = records.filter((r) => r.type === mode);
  const currentModeDates = [...new Set(currentModeRecords.map((r) => r.date))];

  const allExpanded =
    currentModeDates.length > 0 &&
    currentModeDates.every((date) => {
      // 今日預設展開 (!== false)，其餘日期預設收折 (|| false)
      return date === todayStr
        ? expandedDates[date] !== false
        : expandedDates[date] || false;
    });

  const handleToggleAllExpanded = () => {
    const newState = {};
    currentModeDates.forEach((date) => {
      newState[date] = !allExpanded;
    });
    setExpandedDates((prev) => ({ ...prev, ...newState }));
  };

  // --- 5. IndexedDB 初始化 ---
  useEffect(() => {
    const initDB = async () => {
      try {
        await financeDB.init();

        // 載入使用者資料
        const savedUser = await financeDB.loadUser();
        if (savedUser) {
          setUser(savedUser);
        } else {
          // 回退到 localStorage
          const localUser = localStorage.getItem("finance_user");
          if (localUser) {
            const parsedUser = JSON.parse(localUser);
            setUser(parsedUser);
            await financeDB.saveUser(parsedUser); // 同步到 IndexedDB
          }
        }

        // 載入記錄
        let allRecords = await financeDB.loadAllRecords();
        if (!allRecords || allRecords.length === 0) {
          // 回退到 localStorage
          const localRecords = localStorage.getItem("finance_records");
          if (localRecords) {
            allRecords = JSON.parse(localRecords);
            if (allRecords.length > 0) {
              await financeDB.saveRecords(allRecords); // 同步到 IndexedDB
            }
          }
        }

        setRecords(allRecords || []);
        setIsDBReady(true);
      } catch (error) {
        console.error("IndexedDB 初始化失敗:", error);
        // 回退到 localStorage
        try {
          const localUser = localStorage.getItem("finance_user");
          const localRecords = localStorage.getItem("finance_records");
          if (localUser) setUser(JSON.parse(localUser));
          if (localRecords) setRecords(JSON.parse(localRecords));
        } catch (e) {
          console.error("從 localStorage 讀取也失敗:", e);
        }
        setIsDBReady(true);
      }
    };

    initDB();
  }, []);

  // --- 6. Effect 與 邏輯 ---

  // 🆕 將圖片 URL 下載並轉換為 base64（改用 fetch 以獲得更穩定的結果與正確的 MIME type）
  const fetchImageAsBase64 = useCallback(async (imageUrl) => {
    if (!imageUrl) return null;
    try {
      // 添加時間戳避免快取問題
      const fetchUrl =
        imageUrl + (imageUrl.includes("?") ? "&" : "?") + "t=" + Date.now();

      const response = await fetch(fetchUrl, { mode: "cors" });
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      const blob = await response.blob();

      // 轉換 Blob 為 Base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          // 基本驗證，確保回傳的是圖片 Data URL
          if (typeof base64 === "string" && base64.startsWith("data:image")) {
            // 附加檔案類型資訊給外部使用 (選擇性)
            resolve({
              base64,
              mimeType: blob.type,
            });
          } else {
            console.warn("Invalid base64 result");
            resolve(null);
          }
        };
        reader.onerror = () => {
          console.warn("FileReader error");
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Fetch image failed:", error);
      return null;
    }
  }, []);

  const handleSyncData = useCallback(
    async (isBackground = false) => {
      if (!gasUrl || !gasToken) return;
      if (!isBackground) setIsSyncing(true);

      try {
        const cloudRecords = await fetchFromGAS(gasUrl, gasToken);
        if (cloudRecords && Array.isArray(cloudRecords)) {
          // 將日期轉換為本地時間 YYYY/M/D 格式
          const normalizeToLocalDate = (dateStr, timestamp) => {
            // 優先使用 timestamp 來獲取正確的本地日期
            if (timestamp) {
              const d = new Date(timestamp);
              if (!isNaN(d.getTime())) {
                return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
              }
            }
            // 若無 timestamp，嘗試解析 date 欄位
            if (dateStr) {
              const d = new Date(dateStr.replace(/-/g, "/"));
              if (!isNaN(d.getTime())) {
                return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
              }
            }
            return dateStr || "未知日期";
          };

          const formatted = cloudRecords.map((r) => ({
            ...r,
            id: String(r.id), // 強制轉為字串，確保 IndexedDB ID 類型一致
            date: normalizeToLocalDate(r.date, r.timestamp),
            amount: Number(r.amount) || 0,
            twdAmount: Number(r.twdAmount) || 0,
            synced: true,
            hasCloudImage: !!r.image, // 🆕 標記此記錄有雲端圖片，供離線讀取使用
          }));
          // 舊 -> 新
          formatted.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
          );
          setRecords(formatted);

          // 同時保存到 IndexedDB
          try {
            await financeDB.saveRecords(formatted);

            // 🆕 清理孤立的圖片快取（被刪除記錄的圖片）
            const validRecordIds = formatted.map((r) => r.id);
            await financeDB.cleanOrphanedImages(validRecordIds);

            // 🆕 快取圖片到 IndexedDB（背景執行，快取完成後立即更新 UI）
            const recordsWithImages = formatted.filter(
              (r) =>
                r.image &&
                typeof r.image === "string" &&
                r.image.startsWith("http"),
            );

            if (recordsWithImages.length > 0) {
              console.log(`🖼️ 開始快取 ${recordsWithImages.length} 張圖片...`);
              // 背景快取圖片
              (async () => {
                for (const record of recordsWithImages) {
                  try {
                    console.log(
                      `📦 檢查圖片快取: ${record.id}, URL: ${record.image?.substring(0, 50)}...`,
                    );

                    // 先檢查 IndexedDB 是否已有此圖片
                    const existingImages = await financeDB.getImagesByRecordId(
                      record.id,
                    );
                    if (
                      existingImages &&
                      existingImages.length > 0 &&
                      existingImages[0].data
                    ) {
                      // 已有快取，直接更新 UI
                      console.log(`✅ 已有快取，直接使用: ${record.id}`);
                      const cachedBase64 = existingImages[0].data;
                      setRecords((prev) =>
                        prev.map((r) =>
                          r.id === record.id
                            ? { ...r, image: cachedBase64 }
                            : r,
                        ),
                      );
                      continue;
                    }

                    // 下載並快取圖片
                    console.log(`⬇️ 下載圖片中: ${record.id}`);
                    const result = await fetchImageAsBase64(record.image);

                    if (result && result.base64) {
                      const { base64, mimeType } = result;
                      console.log(
                        `💾 儲存圖片到 IndexedDB: ${record.id}, type: ${mimeType}`,
                      );

                      // 嘗試從 URL 提取檔名
                      let filename = "image";
                      try {
                        const urlObj = new URL(record.image);
                        const pathname = urlObj.pathname;
                        const extracted = pathname.substring(
                          pathname.lastIndexOf("/") + 1,
                        );
                        if (extracted && extracted.length < 50) {
                          filename = extracted;
                        }
                      } catch {
                        // ignore
                      }

                      // 根據 MIME type 強制附加或修正副檔名
                      let ext = ".jpg";
                      if (mimeType === "image/png") ext = ".png";
                      else if (mimeType === "image/webp") ext = ".webp";
                      else if (mimeType === "image/gif") ext = ".gif";

                      // 如果檔名沒有副檔名，或是副檔名不匹配，則附加
                      if (!filename.toLowerCase().endsWith(ext)) {
                        // 簡單檢查是否已有任何圖片副檔名
                        if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) {
                          filename += ext;
                        }
                      }

                      await financeDB.saveImage(record.id, base64, filename);

                      // 🆕 立即更新 UI，使用快取的 base64
                      setRecords((prev) =>
                        prev.map((r) =>
                          String(r.id) === String(record.id)
                            ? { ...r, image: base64 }
                            : r,
                        ),
                      );
                      console.log(
                        `✅ 已快取圖片: record ${record.id} (${filename})`,
                      );
                    } else {
                      console.warn(`❌ 下載圖片失敗 (返回 null): ${record.id}`);
                    }
                  } catch (err) {
                    console.warn(`❌ 快取圖片失敗 (record ${record.id}):`, err);
                  }
                }
                console.log(`🖼️ 圖片快取完成`);
              })();
            }
          } catch (error) {
            console.error("保存到 IndexedDB 失敗:", error);
          }

          if (!isBackground) showToast("資料同步完成");
        }
      } catch (e) {
        console.error("Sync error:", e);
        if (!isBackground) showToast("同步失敗，請檢查網路", "error");
      } finally {
        if (!isBackground) setIsSyncing(false);
      }
    },
    [gasUrl, gasToken, showToast, fetchImageAsBase64],
  );

  // 保存記錄到 IndexedDB（主要存儲）
  useEffect(() => {
    if (!isDBReady || records.length === 0) return;

    const debounceTimer = setTimeout(() => {
      try {
        // 保存到 IndexedDB（主要存儲）
        // 只清除 base64 圖片數據，保留 URL 引用以便重新下載
        const recordsToSave = records.map((r) => {
          // 如果圖片是 URL（http 開頭），保留它
          // 如果是 base64 數據，清除它（因為已單獨存儲）
          const imageValue =
            r.image && typeof r.image === "string" && r.image.startsWith("http")
              ? r.image // 保留 URL
              : null; // 清除 base64 數據

          return {
            ...r,
            image: imageValue,
            // 🆕 確保保留 hasCloudImage 標記，若原始資料有圖片（base64或URL）也視為有圖片
            hasCloudImage: r.hasCloudImage || !!r.image,
          };
        });

        financeDB.saveRecords(recordsToSave).catch((error) => {
          console.error("保存到 IndexedDB 失敗:", error);
        });
      } catch (e) {
        console.error("保存錯誤:", e);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [records, isDBReady]);

  // 🆕 初始載入時從 IndexedDB 獲取快取的圖片（僅初始化時執行一次）
  const hasLoadedImagesRef = useRef(false);

  useEffect(() => {
    if (!isDBReady || hasLoadedImagesRef.current || records.length === 0)
      return;

    const loadImagesFromIndexedDB = async () => {
      // 找出有圖片 URL 但可能有 IndexedDB 快取的記錄
      const recordsToCheck = records.filter(
        (r) =>
          r.hasCloudImage ||
          (r.image &&
            typeof r.image === "string" &&
            r.image.startsWith("http")),
      );

      if (recordsToCheck.length === 0) {
        hasLoadedImagesRef.current = true;
        return;
      }

      try {
        const updatedRecords = [];

        for (const record of recordsToCheck) {
          const cachedImages = await financeDB.getImagesByRecordId(record.id);
          if (cachedImages && cachedImages.length > 0 && cachedImages[0].data) {
            // 有快取的 base64 圖片，使用它
            updatedRecords.push({
              id: record.id,
              image: cachedImages[0].data,
            });
          }
        }

        if (updatedRecords.length > 0) {
          setRecords((prevRecords) =>
            prevRecords.map((r) => {
              // 強制使用 String 比較 ID，確保安全性
              const cached = updatedRecords.find(
                (u) => String(u.id) === String(r.id),
              );
              if (cached) {
                return { ...r, image: cached.image };
              }
              return r;
            }),
          );
          console.log(
            `✅ 從 IndexedDB 載入了 ${updatedRecords.length} 張快取圖片`,
          );
        }

        hasLoadedImagesRef.current = true;
      } catch (error) {
        console.error("Failed to load images from IndexedDB:", error);
        hasLoadedImagesRef.current = true;
      }
    };

    loadImagesFromIndexedDB();
  }, [isDBReady, records]); // 只在初始化完成且有記錄時執行

  useEffect(() => {
    // 只在非 modal 操作時自動滾動
    if (
      !editingRecord &&
      !skipAutoScrollRef.current &&
      !showReceiptModal &&
      messagesEndRef.current
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // 重置 flag
    skipAutoScrollRef.current = false;
  }, [records, mode, noteImages, editingRecord, showReceiptModal]);

  // 🆕 點擊外部關閉使用者選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 檢查點擊是否在選單按鈕或選單內
      const isMenuButton = menuButtonRef.current?.contains(event.target);
      const isMenu = event.target.closest(".user-menu-portal");
      if (showUserMenu && !isMenuButton && !isMenu) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  // 🆕 控制 Modal 打開時禁用頁面滾動
  useEffect(() => {
    if (showReceiptModal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showReceiptModal]);

  // 🆕 計算並更新選單位置
  const updateMenuPosition = useCallback(() => {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, []);

  // 🆕 當選單開啟時更新位置，並監聽滾動/resize
  useEffect(() => {
    if (showUserMenu) {
      updateMenuPosition();
      window.addEventListener("scroll", updateMenuPosition, true);
      window.addEventListener("resize", updateMenuPosition);
      return () => {
        window.removeEventListener("scroll", updateMenuPosition, true);
        window.removeEventListener("resize", updateMenuPosition);
      };
    }
  }, [showUserMenu, updateMenuPosition]);

  useEffect(() => {
    if (gasUrl && gasToken && user) {
      handleSyncData(true);
      const intervalId = setInterval(
        () => {
          console.log("⏰ 觸發背景同步...");
          handleSyncData(true);
        },
        10 * 60 * 1000,
      );
      return () => clearInterval(intervalId);
    }
  }, [gasUrl, gasToken, user, handleSyncData]);

  // --- 6. 核心操作邏輯 ---

  const scrollToRecord = (recordId) => {
    const element = document.getElementById(`record-${recordId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-sky-400", "ring-offset-2");
      setTimeout(() => {
        element?.classList.remove("ring-2", "ring-sky-400", "ring-offset-2");
      }, 2000);
    }
  };

  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return records
      .filter((r) => r.type === mode)
      .filter(
        (r) =>
          r.content?.toLowerCase().includes(query) ||
          r.amount?.toString().includes(query),
      );
  };

  const handleUserSetup = async () => {
    if (!setupName.trim()) return;
    const newUser = { name: setupName, avatar: setupAvatar };

    try {
      // 保存到 IndexedDB（主要存儲）
      await financeDB.saveUser(newUser);
    } catch (error) {
      console.error("保存使用者資料到 IndexedDB 失敗:", error);
    }

    setUser(newUser);
    showToast(`歡迎, ${setupName}!`);
  };

  const handleLogout = async () => {
    if (window.confirm("確定要登出並重設使用者身分嗎？(紀錄不會被刪除)")) {
      try {
        // 從 IndexedDB 刪除
        await financeDB.deleteUser();
      } catch (error) {
        console.error("從 IndexedDB 刪除使用者資料失敗:", error);
      }

      setUser(null);
      setSetupName("");
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (mode === "note") {
      const base64Promises = files.map(async (file) => {
        const processedFile = await processFileForHeic(file, () =>
          showToast("正在轉換 HEIC 圖片，請稍候...", "info"),
        );
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(processedFile);
        });
      });
      try {
        const newImages = await Promise.all(base64Promises);
        setNoteImages((prev) => [...prev, ...newImages]);
      } catch (err) {
        console.error("Image read error", err);
      }
      e.target.value = "";
      return;
    }

    if (apiKey) {
      setIsScanning(true);
      setIsScanning(true);
      setShowReceiptModal(true);
      setReceiptItems([]);
      setReceiptImages([]);
      await processImagesForScanning(files, true);
    } else {
      const file = files[0];
      const processedFile = await processFileForHeic(file, () =>
        showToast("正在轉換 HEIC 圖片...", "info"),
      );
      const reader = new FileReader();
      reader.onload = (e) => {
        setNoteImages([e.target.result]);
      };
      reader.readAsDataURL(processedFile);
    }
    e.target.value = "";
  };

  const removeNoteImage = (indexToRemove) => {
    setNoteImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAppendImage = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsScanning(true);
    await processImagesForScanning(files, false);
    e.target.value = "";
  };

  const processImagesForScanning = async (files, isReset = false) => {
    try {
      const base64Promises = files.map(async (file) => {
        const processedFile = await processFileForHeic(file, () =>
          showToast("正在轉換 HEIC 圖片，請稍候...", "info"),
        );
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target.result);
          reader.readAsDataURL(processedFile);
        });
      });
      const newImages = await Promise.all(base64Promises);
      setReceiptImages((prev) =>
        isReset ? newImages : [...prev, ...newImages],
      );

      const aiPromises = newImages.map((img) =>
        parseReceiptWithGemini(img, apiKey),
      );
      const results = await Promise.all(aiPromises);

      let newItems = [];
      const currentImgCount = isReset ? 0 : receiptImages.length;

      results.forEach((result, idx) => {
        const globalImgIndex = currentImgCount + idx;
        let isFirstItemOfImage = true;

        if (result && result.items && Array.isArray(result.items)) {
          const mapped = result.items.map((item, itemIdx) => {
            const itemObj = {
              id: Date.now() + globalImgIndex * 1000 + itemIdx,
              name: item.name || "未知品項",
              amount: item.amount || 0,
              selected: true,
              sourceImage: isFirstItemOfImage ? newImages[idx] : null,
            };
            isFirstItemOfImage = false;
            return itemObj;
          });
          newItems = [...newItems, ...mapped];
        } else {
          newItems.push({
            id: Date.now() + globalImgIndex * 1000,
            name: result.store ? `${result.store} 消費` : "消費總額",
            amount: result.amount || 0,
            selected: true,
            sourceImage: newImages[idx],
          });
        }
      });

      setReceiptItems((prev) => (isReset ? newItems : [...prev, ...newItems]));
      showToast(
        isReset
          ? `辨識完成！共 ${newImages.length} 張`
          : `已追加 ${newImages.length} 張並完成辨識`,
      );
    } catch (error) {
      console.error("Scanning error:", error);
      showToast("部分發票辨識失敗", "error");
      if (isReset && receiptItems.length === 0) {
        setReceiptItems([
          { id: Date.now(), name: "", amount: "", selected: true },
        ]);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveReceiptImage = (indexToRemove) => {
    // 1. 移除圖片
    const imgToRemove = receiptImages[indexToRemove];
    setReceiptImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    // 2. 移除該圖片關聯的項目
    setReceiptItems((prev) =>
      prev.filter((item) => item.sourceImage !== imgToRemove),
    );
  };

  const addRecord = async (content, val, imageBase64, customType = null) => {
    const targetMode = customType || mode;
    const currentRate = rateData?.current || 0.22;

    // 使用本地時間格式化日期 (YYYY/M/D)
    const now = new Date();
    const localDate = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

    // ✅ 圖片儲存到 IndexedDB，state 中先保留以立即顯示
    const newItem = {
      id: Date.now() + Math.random(),
      type: targetMode,
      date: localDate,
      timestamp: new Date().toISOString(),
      user: user,
      content: content,
      amount: targetMode === "finance" ? parseFloat(val) : 0,
      twdAmount:
        targetMode === "finance"
          ? Math.round(parseFloat(val) * currentRate)
          : 0,
      rate: currentRate,
      image: imageBase64, // 臨時顯示，等 IndexedDB 儲存完成
      hasCloudImage: !!imageBase64,
      synced: false,
    };

    // ✅ 儲存到 IndexedDB
    if (imageBase64) {
      try {
        await financeDB.saveImage(newItem.id, imageBase64);
      } catch (err) {
        console.error("IndexedDB 儲存失敗:", err);
      }
    }

    setRecords((prev) => [...prev, newItem]);

    if (gasUrl && gasToken) {
      // ✅ 上傳至雲端
      uploadToGAS(
        {
          ...newItem,
          action: "add",
          imageBase64: imageBase64,
          store: newItem.content ? newItem.content.split("-")[0]?.trim() : "",
          item: newItem.content,
          userName: user.name,
          userAvatar: user.avatar,
        },
        gasUrl,
        gasToken,
      )
        .then(() => {
          setRecords((prev) =>
            prev.map((r) => (r.id === newItem.id ? { ...r, synced: true } : r)),
          );
        })
        .catch((err) => console.error("Upload failed", err));
    }

    // 返回 timestamp 以供後續使用（如滾動）
    return newItem.timestamp;
  };

  const handleManualSubmit = async () => {
    if (mode === "finance" && !amount) {
      showToast("請輸入金額", "error");
      return;
    }
    if (mode === "note" && !inputText && noteImages.length === 0) return;

    setIsUploading(true);

    try {
      if (noteImages.length > 0) {
        // ✅ 記事模式：壓縮圖片後上傳至雲端
        for (let idx = 0; idx < noteImages.length; idx++) {
          const img = noteImages[idx];
          const content = idx === 0 ? inputText : "";

          // 壓縮圖片（減少雲端頻寬消耗）
          const compressedImg = await compressImage(img, 400);
          await addRecord(content, amount, compressedImg);

          // 微小延遲避免請求過快
          if (idx < noteImages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        showToast(`已上傳 ${noteImages.length} 則記事（圖片已保存至雲端）`);
      } else {
        await addRecord(inputText, amount, null);
      }

      setInputText("");
      setAmount("");
      setNoteImages([]);
    } catch (err) {
      console.error("提交失敗:", err);
      showToast("發送失敗，請重試", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBatchConfirm = () => {
    const itemsToImport = receiptItems.filter((i) => i.selected && i.name);
    if (itemsToImport.length === 0) {
      setShowReceiptModal(false);
      return;
    }

    let firstRecordTimestamp = null;
    let count = 0;

    itemsToImport.forEach((item, index) => {
      const img = item.sourceImage || null;
      setTimeout(() => {
        const recordId = addRecord(item.name, item.amount, img, "finance");
        // 記住第一條記錄的 timestamp
        if (index === 0 && recordId) {
          firstRecordTimestamp = recordId;
        }
      }, index * 100);
      count++;
    });

    // 所有記錄添加完成後處理
    setTimeout(
      () => {
        setShowReceiptModal(false);
        setReceiptImages([]);
        setReceiptItems([]);
        setIsUploading(false);

        // 使用 requestAnimationFrame 確保 DOM 已更新，再進行滾動
        requestAnimationFrame(() => {
          if (firstRecordTimestamp) {
            const element = document.getElementById(
              `record-${firstRecordTimestamp}`,
            );
            if (element) {
              setTimeout(() => {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 100);
            }
          }
        });
      },
      itemsToImport.length * 100 + 200,
    );

    showToast(`已匯入 ${count} 筆消費紀錄`);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("確定要刪除這筆紀錄嗎？(連動雲端刪除)")) return;

    // ✅ 刪除 IndexedDB 中的記錄和圖片
    try {
      await financeDB.deleteRecord(id);
    } catch (err) {
      console.error("從 IndexedDB 刪除失敗:", err);
    }

    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (gasUrl && gasToken) {
      uploadToGAS(
        { action: "delete", id: id, type: type },
        gasUrl,
        gasToken,
      ).catch(() => showToast("雲端刪除失敗", "error"));
    }
  };

  const startEditing = (record) => {
    setEditingRecord(record);
    setEditContent(record.content || "");
    setEditAmount(record.amount || "");
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditContent("");
    setEditAmount("");
  };

  const saveEdit = async () => {
    if (!editingRecord) return;

    if (editingRecord.type === "finance" && !editAmount) {
      showToast("金額不能為空", "error");
      return;
    }

    const currentRate = rateData?.current || 0.22;
    const newAmount =
      editingRecord.type === "finance" ? parseFloat(editAmount) : 0;
    const newTwdAmount =
      editingRecord.type === "finance"
        ? Math.round(newAmount * currentRate)
        : 0;

    // 1. 前端樂觀更新 (UI Update)
    const updatedRecords = records.map((r) => {
      if (r.id === editingRecord.id) {
        return {
          ...r,
          content: editContent,
          amount: newAmount,
          twdAmount: newTwdAmount,
          synced: false,
        };
      }
      return r;
    });
    setRecords(updatedRecords);
    showToast("已更新，正在同步...", "success");
    cancelEditing();

    // 2. 後端同步 (Cloud Sync)
    if (gasUrl && gasToken) {
      try {
        await uploadToGAS(
          {
            action: "edit",
            id: editingRecord.id,
            type: editingRecord.type,
            content: editContent,
            amount: newAmount,
            twdAmount: newTwdAmount,
            item: editContent,
            store: editContent.split("-")[0]?.trim(),
          },
          gasUrl,
          gasToken,
        );

        setRecords((prev) =>
          prev.map((r) =>
            r.id === editingRecord.id ? { ...r, synced: true } : r,
          ),
        );
        showToast("同步更新成功");
      } catch (error) {
        console.error("Edit upload failed:", error);
        showToast("雲端更新失敗，請檢查網路", "error");
      }
    }
  };

  // --- 8. 渲染 UI ---

  if (!user) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-6 animate-fadeIn`}
      >
        <div
          className={`w-full max-w-sm backdrop-blur-2xl border rounded-[2rem] p-8 shadow-lg text-center space-y-6 ${isDarkMode ? "bg-slate-900/70 border-white/10 ring-1 ring-white/10 shadow-black/5" : "bg-white/70 border-white/40 ring-1 ring-black/5 shadow-black/5"}`}
        >
          <div className="space-y-2">
            <h2 className={`text-2xl font-bold ${theme.text}`}>
              歡迎使用旅程記帳
            </h2>
            <p className={`text-sm ${theme.textSec}`}>
              請設定您的暱稱與頭像以識別紀錄
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-h-[30vh] overflow-y-auto p-2 scrollbar-hide">
            {AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => setSetupAvatar(av)}
                className={`text-2xl p-2 rounded-lg border transition-all ${setupAvatar === av ? (isDarkMode ? "bg-sky-600/30 border-sky-500 scale-110 shadow-md" : "bg-sky-100 border-sky-400 scale-110 shadow-md") : isDarkMode ? "border-neutral-700 hover:bg-neutral-800/50" : "border-transparent hover:bg-black/5"}`}
              >
                {av}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <input
              type="text"
              id="userSetupName"
              name="userSetupName"
              placeholder="輸入您的暱稱"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              style={{ fontSize: "16px" }}
              className={`w-full p-3 rounded-lg border text-center font-bold outline-none focus:ring-2 transition-all ${isDarkMode ? "bg-neutral-800 border-neutral-700 text-white focus:border-sky-500 focus:ring-sky-500/20" : "bg-stone-50 border-stone-300 text-stone-800 focus:border-[#5D737E] focus:ring-[#5D737E]/20"}`}
            />
            <button
              onClick={handleUserSetup}
              disabled={!setupName}
              className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 
                ${setupName ? (isDarkMode ? "bg-sky-600 hover:bg-sky-700" : "bg-[#5D737E] hover:bg-[#4A606A]") : "bg-stone-300 cursor-not-allowed"}`}
            >
              開始記錄
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ★ UI 修改重點：
  // 1. 使用 min-h-[calc(100vh-130px)]：最小高度確保底部靠近導覽列。
  // 2. 使用 pb-28：底部留白微調以貼近 AI 導遊。
  // 3. 內容多時會撐開卡片，捲動行為在外層 window。
  return (
    <div
      className={`px-4 pb-28 animate-fadeIn flex flex-col min-h-[calc(100vh-130px)] relative`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 🆕 滑動箭頭指示器 - 往左滑時顯示右側箭頭 */}
      <div
        className={`fixed right-2 top-1/2 z-50 pointer-events-none transition-all duration-200 ${
          swipeDirection === "left"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75"
        }`}
        style={{
          transform: `translateY(-50%) translateX(${swipeDirection === "left" ? -swipeDistance * 0.3 : 0}px)`,
        }}
      >
        <div
          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "bg-sky-500/90 ring-1 ring-sky-400/30"
              : "bg-sky-500/90 ring-1 ring-sky-400/50"
          }`}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* 🆕 滑動箭頭指示器 - 往右滑時顯示左側箭頭 */}
      <div
        className={`fixed left-2 top-1/2 z-50 pointer-events-none transition-all duration-200 ${
          swipeDirection === "right"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75"
        }`}
        style={{
          transform: `translateY(-50%) translateX(${swipeDirection === "right" ? swipeDistance * 0.3 : 0}px)`,
        }}
      >
        <div
          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "bg-sky-500/90 ring-1 ring-sky-400/30"
              : "bg-sky-500/90 ring-1 ring-sky-400/50"
          }`}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </div>
      </div>
      {/* 主卡片容器：內容多時自然撐開 */}
      <div
        className={`flex-1 flex flex-col backdrop-blur-xl border rounded-[2rem] transition-all duration-300 ${isDarkMode ? "bg-slate-900/50 border-white/20 ring-1 ring-white/5 shadow-xl shadow-black/10" : "bg-white/75 border-white/60 ring-1 ring-black/5 shadow-xl shadow-black/10"}`}
      >
        {/* Header */}
        <div
          className={`shrink-0 p-4 border-b backdrop-blur-xl transition-all duration-300 ${isDarkMode ? "border-white/20 bg-neutral-800/50 ring-1 ring-white/5" : "border-stone-200/60 bg-white/70 ring-1 ring-black/5"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 🆕 頭像按鈕 - 點擊顯示選單 */}
              {user && (
                <>
                  <button
                    ref={menuButtonRef}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-stone-100 text-2xl shadow-sm border border-white/50 hover:scale-105 active:scale-95 transition-transform"
                    title="使用者選單"
                  >
                    {user.avatar}
                  </button>

                  {/* 🆕 使用者選單下拉 - 使用 Portal 渲染到 body */}
                  {showUserMenu &&
                    createPortal(
                      <div
                        className={`user-menu-portal fixed z-[9999] min-w-[160px] rounded-xl border shadow-xl overflow-hidden animate-fadeIn ${
                          isDarkMode
                            ? "bg-neutral-900/85 border-white/10 backdrop-blur-lg ring-1 ring-white/5 shadow-lg"
                            : "bg-white/90 border-white/40 backdrop-blur-lg ring-1 ring-black/5 shadow-lg"
                        }`}
                        style={{
                          top: menuPosition.top,
                          left: menuPosition.left,
                        }}
                      >
                        <div
                          className={`px-4 py-3 border-b ${isDarkMode ? "border-white/10" : "border-stone-200/50"}`}
                        >
                          <div
                            className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-stone-800"}`}
                          >
                            {user.name}
                          </div>
                          <div
                            className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-stone-500"}`}
                          >
                            點擊登出或其他地方關閉
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-2 text-left transition-colors ${
                            isDarkMode
                              ? "hover:bg-red-500/20 text-red-400"
                              : "hover:bg-red-50 text-red-600"
                          }`}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">登出</span>
                        </button>
                      </div>,
                      document.body,
                    )}
                </>
              )}

              {user && (
                <div
                  className={`text-base font-bold ${theme.text} self-center`}
                >
                  {user.name}
                </div>
              )}
            </div>

            {/* 🆕 按鈕組 - 重新排列：模式切換在上，功能按鈕在下 */}
            <div className="flex flex-col items-end gap-1.5">
              <div
                className={`flex p-1 rounded-xl border gap-1 ${isDarkMode ? "bg-neutral-900/60 border-white/10" : "bg-stone-100/80 border-white/30"}`}
              >
                <button
                  onClick={() => setMode("finance")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${mode === "finance" ? (isDarkMode ? "bg-sky-600 text-white shadow-lg hover:shadow-sky-600/50 hover:bg-sky-700" : "bg-[#5D737E] text-white shadow-md hover:shadow-lg hover:bg-[#4A606A]") : isDarkMode ? "text-neutral-400 bg-transparent hover:text-neutral-200 hover:bg-neutral-700/30" : "text-stone-600 bg-transparent hover:text-stone-700 hover:bg-stone-200/50"}`}
                >
                  <DollarSign className="w-3.5 h-3.5 inline mr-0.5" />
                  記帳
                </button>
                <button
                  onClick={() => setMode("note")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${mode === "note" ? (isDarkMode ? "bg-orange-600 text-white shadow-lg hover:shadow-orange-600/50 hover:bg-orange-700" : "bg-orange-500 text-white shadow-md hover:shadow-lg hover:bg-orange-600") : isDarkMode ? "text-neutral-400 bg-transparent hover:text-neutral-200 hover:bg-neutral-700/30" : "text-stone-600 bg-transparent hover:text-stone-700 hover:bg-stone-200/50"}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-0.5" />
                  記事
                </button>
              </div>
              <div className="flex items-center gap-2">
                {currentModeRecords.length > 0 && (
                  <button
                    onClick={handleToggleAllExpanded}
                    className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                      allExpanded
                        ? isDarkMode
                          ? "bg-sky-600/20 border-sky-500/50 text-sky-400"
                          : "bg-sky-50 border-sky-200 text-sky-600"
                        : isDarkMode
                          ? "bg-neutral-800/80 border-white/10 text-neutral-400 hover:text-sky-400 hover:border-sky-500/50"
                          : "bg-white/60 border-white/30 text-stone-500 hover:text-sky-600 hover:border-sky-400/50"
                    }`}
                    title={allExpanded ? "全部收折" : "全部展開"}
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                    showSearch
                      ? isDarkMode
                        ? "bg-sky-600 border-sky-500 text-white"
                        : "bg-sky-500 border-sky-400 text-white"
                      : isDarkMode
                        ? "bg-neutral-800/80 border-white/10 text-neutral-400 hover:text-sky-400 hover:border-sky-500/50"
                        : "bg-white/60 border-white/30 text-stone-500 hover:text-sky-600 hover:border-sky-400/50"
                  }`}
                  title="搜尋紀錄"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSyncData(false)}
                  disabled={isSyncing}
                  className={`p-1.5 rounded-lg border transition-all active:scale-95 backdrop-blur-md ${isDarkMode ? "bg-neutral-800/70 border-white/15 text-neutral-400 hover:text-sky-400 hover:border-sky-500/50 ring-1 ring-white/5" : "bg-white/80 border-white/40 text-stone-500 hover:text-[#5D737E] hover:border-[#5D737E]/50 ring-1 ring-black/5"}`}
                  title="同步資料"
                >
                  <RefreshCcw
                    className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-sky-500" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 搜尋框 */}
          {showSearch && (
            <div className="mt-3 space-y-2">
              <div
                className={`flex items-center gap-2 p-2 rounded-xl border ${
                  isDarkMode
                    ? "bg-neutral-900/60 border-white/10"
                    : "bg-stone-100/80 border-white/30"
                }`}
              >
                <Search
                  className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? "text-neutral-400" : "text-stone-500"}`}
                />
                <input
                  type="text"
                  id="financeSearch"
                  name="financeSearch"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`搜尋${mode === "finance" ? "消費" : "記事"}內容...`}
                  className={`flex-1 bg-transparent border-0 outline-none text-sm ${
                    isDarkMode
                      ? "text-neutral-200 placeholder:text-neutral-500"
                      : "text-stone-700 placeholder:text-stone-400"
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div
                  className={`max-h-40 overflow-y-auto rounded-xl border ${
                    isDarkMode
                      ? "bg-neutral-900/80 border-white/10"
                      : "bg-white/80 border-stone-200/50"
                  }`}
                >
                  {getSearchResults().length > 0 ? (
                    <div className="p-2 space-y-1">
                      {getSearchResults().map((result) => (
                        <button
                          key={result.timestamp}
                          onClick={() => {
                            scrollToRecord(result.timestamp);
                            setShowSearch(false);
                            setSearchQuery("");
                            // 展開該日期
                            setExpandedDates((prev) => ({
                              ...prev,
                              [result.date]: true,
                            }));
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-all hover:scale-[1.02] ${
                            isDarkMode
                              ? "hover:bg-neutral-800 text-neutral-300"
                              : "hover:bg-stone-100 text-stone-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {result.type === "finance" ? (
                                <DollarSign className="w-3 h-3 text-sky-500" />
                              ) : (
                                <MessageSquare className="w-3 h-3 text-orange-500" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  isDarkMode
                                    ? "text-neutral-400"
                                    : "text-stone-500"
                                }`}
                              >
                                {result.date}
                              </span>
                            </div>
                            {result.type === "finance" && (
                              <span className="text-xs font-bold text-sky-500">
                                ¥{result.amount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs line-clamp-1">
                            {result.content}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`p-4 text-center text-xs ${
                        isDarkMode ? "text-neutral-500" : "text-stone-400"
                      }`}
                    >
                      沒有找到符合的{mode === "finance" ? "消費" : "記事"}紀錄
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 列表區域：內容自然撐開卡片 */}
        <div
          className={`flex-1 p-4 space-y-3 flex flex-col backdrop-blur-md ${isDarkMode ? "bg-black/15" : "bg-[#F9F9F6]/70"}`}
        >
          {records.filter((r) => r.type === mode).length === 0 && (
            <div
              className={`flex-1 flex flex-col items-center justify-center opacity-40 ${theme.textSec}`}
            >
              <Wallet className="w-12 h-12 mb-2 stroke-1" />
              <p className="text-sm">
                尚無任何{mode === "finance" ? "消費" : "記事"}紀錄
              </p>
            </div>
          )}

          {/* 按日期分組顯示紀錄 */}
          {(() => {
            const filteredRecords = records.filter((r) => r.type === mode);

            // 將日期標準化為 YYYY/M/D 格式以確保正確分組
            const normalizeDate = (dateStr) => {
              if (!dateStr) return "未知日期";
              // 嘗試解析各種日期格式
              const d = new Date(dateStr.replace(/-/g, "/"));
              if (isNaN(d.getTime())) return dateStr;
              return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
            };

            const groupedByDate = filteredRecords.reduce((acc, record) => {
              const date = normalizeDate(record.date);
              if (!acc[date]) acc[date] = [];
              acc[date].push(record);
              return acc;
            }, {});
            // 排序：舊到新（最新的在最下面）
            const sortedDates = Object.keys(groupedByDate).sort(
              (a, b) =>
                new Date(a.replace(/\//g, "-")) -
                new Date(b.replace(/\//g, "-")),
            );

            return sortedDates.map((date) => {
              const dateRecords = groupedByDate[date];
              // 當日預設展開，其他日期按 expandedDates 狀態
              const isExpanded =
                date === todayStr
                  ? expandedDates[date] !== false
                  : expandedDates[date] || false;
              const dayTotal =
                mode === "finance"
                  ? dateRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
                  : dateRecords.length;
              const dayTwdTotal =
                mode === "finance"
                  ? dateRecords.reduce((sum, r) => sum + (r.twdAmount || 0), 0)
                  : 0;

              return (
                <div key={date} className="space-y-2">
                  {/* 日期標頭 - 可點擊收折 */}
                  <button
                    onClick={() =>
                      setExpandedDates((prev) => ({
                        ...prev,
                        [date]: !prev[date],
                      }))
                    }
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.99] border backdrop-blur-md ${isDarkMode ? "bg-neutral-800/50 border-white/15 hover:bg-neutral-700/60 ring-1 ring-white/5" : "bg-white/70 border-white/40 hover:bg-white/90 ring-1 ring-black/5"}`}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isDarkMode ? "text-sky-400" : "text-[#5D737E]"}`}
                        />
                      ) : (
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isDarkMode ? "text-sky-400" : "text-[#5D737E]"}`}
                        />
                      )}
                      <span className={`text-sm font-bold ${theme.text}`}>
                        {date}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? "bg-neutral-700/80 text-neutral-400" : "bg-stone-100 text-stone-500"}`}
                      >
                        {dateRecords.length} 筆
                      </span>
                    </div>
                    {mode === "finance" && (
                      <div className="text-right">
                        <span
                          className={`text-sm font-mono font-bold ${isDarkMode ? "text-sky-400" : "text-[#5D737E]"}`}
                        >
                          ¥{dayTotal.toLocaleString()}
                        </span>
                        <span className={`text-[10px] ml-1.5 ${theme.textSec}`}>
                          ≈ NT${dayTwdTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* 展開時顯示該日期的所有紀錄 */}
                  {isExpanded &&
                    dateRecords.map((record) => (
                      // Flex 容器
                      <div
                        key={record.id}
                        className={`group flex gap-3 ${record.user.name === user.name ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* 1. 頭像區域 */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-sm border transition-all ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-stone-200"}`}
                          >
                            {record.user.avatar}
                          </div>
                          <span
                            className={`text-[10px] opacity-70 leading-tight max-w-[4rem] truncate text-center font-medium ${theme.textSec}`}
                          >
                            {record.user.name}
                          </span>
                        </div>

                        {/* 2. 內容卡片區域 - 統一使用半透明風格（與 AI 導遊回覆一致） */}
                        <div
                          className={`flex flex-col max-w-[75%] ${record.user.name === user.name ? "items-end" : "items-start"}`}
                        >
                          <div
                            id={`record-${record.timestamp}`}
                            className={`relative overflow-hidden shadow-sm transition-all border p-3.5 text-sm leading-relaxed
                                ${
                                  isDarkMode
                                    ? "bg-neutral-800/85 backdrop-blur-lg text-neutral-200 border-neutral-700/60 ring-1 ring-neutral-600/30 shadow-md"
                                    : "bg-white/85 backdrop-blur-lg text-stone-700 border-white/40 ring-1 ring-black/5 shadow-md"
                                }
                                ${record.user.name === user.name ? "rounded-2xl rounded-tr-none" : "rounded-2xl rounded-tl-none"}
                                ${record.type === "finance" ? "w-60" : ""}
                           `}
                          >
                            {/* === 記帳模式 === */}
                            {record.type === "finance" ? (
                              <div className="flex flex-col">
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-sm font-bold truncate leading-tight ${theme.text}`}
                                    >
                                      {record.content || "未製品項"}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <span
                                        className={`text-[10px] ${theme.textSec}`}
                                      >
                                        {formatTime(record.timestamp)}
                                      </span>
                                      {record.synced ? (
                                        <Check className="w-3 h-3 text-green-500" />
                                      ) : (
                                        <RefreshCcw className="w-3 h-3 text-orange-400 animate-spin" />
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <div
                                      className={`text-base font-mono font-bold leading-tight ${isDarkMode ? "text-sky-400" : "text-[#5D737E]"}`}
                                    >
                                      ¥{record.amount.toLocaleString()}
                                    </div>
                                    <div
                                      className={`text-[10px] mt-0.5 ${theme.textSec}`}
                                    >
                                      ≈ NT$ {record.twdAmount.toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                {record.image && (
                                  <div className="mt-2">
                                    <img
                                      src={record.image}
                                      alt="attachment"
                                      onClick={() =>
                                        setFullPreviewImage(record.image)
                                      }
                                      className="w-full h-32 object-cover rounded-lg border border-white/20 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* === 記事模式 === */
                              <>
                                {record.content && (
                                  <div
                                    className={`text-sm break-words whitespace-pre-wrap ${theme.text}`}
                                  >
                                    {record.content}
                                  </div>
                                )}
                                {record.image && (
                                  <img
                                    src={record.image}
                                    alt="attachment"
                                    onClick={() =>
                                      setFullPreviewImage(record.image)
                                    }
                                    className="mt-2 rounded-lg max-h-40 object-cover border border-white/20 shadow-sm cursor-zoom-in"
                                  />
                                )}
                                <div className="flex items-center justify-end gap-1 mt-1.5">
                                  <span
                                    className={`text-[9px] ${theme.textSec}`}
                                  >
                                    {formatTime(record.timestamp)}
                                  </span>
                                  {record.synced ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <RefreshCcw className="w-3 h-3 text-orange-400 animate-spin" />
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 3. 操作按鈕區域 */}
                        {record.user.name === user.name && (
                          <div className="flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => startEditing(record)}
                              className={`p-2 rounded-full border transition-colors shadow-sm ${isDarkMode ? "bg-neutral-800 border-neutral-700 hover:text-sky-400 hover:border-sky-500" : "bg-white border-stone-200 hover:text-sky-600 hover:border-sky-400"}`}
                              title="編輯"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(record.id, record.type)
                              }
                              className={`p-2 rounded-full border transition-colors shadow-sm ${isDarkMode ? "bg-neutral-800 border-neutral-700 hover:text-red-400 hover:border-red-500" : "bg-white border-stone-200 hover:text-red-600 hover:border-red-400"}`}
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              );
            });
          })()}
          <div ref={messagesEndRef} />
          {/* 底部固定空間，確保滾到底時與無訊息時空間一致 */}
          <div className="h-16"></div>
        </div>

        {/* Footer 輸入區 - 固定在卡片內容的最下方 */}
        <div
          className={`shrink-0 border-t backdrop-blur-2xl transition-all duration-300 ${isDarkMode ? "bg-neutral-900/80 border-white/10" : "bg-white/70 border-stone-200/50"}`}
        >
          <div className="px-3 py-2.5 space-y-2">
            {/* 圖片預覽區 */}
            {noteImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {noteImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative flex-shrink-0 group animate-slideUp"
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx}`}
                      className="h-12 w-auto rounded-lg border shadow-sm object-cover"
                    />
                    <button
                      onClick={() => removeNoteImage(idx)}
                      className={`absolute -top-2 -right-2 p-1 rounded-full text-white shadow-md active:scale-90 transition-all ${isDarkMode ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"}`}
                      title="移除圖片"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 隱藏的檔案選擇器 */}
            <input
              type="file"
              id="financeImageUpload"
              name="financeImageUpload"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
              multiple
            />

            {/* 輸入控制區 */}
            <div className="flex items-center gap-1.5">
              {/* 相機按鈕 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 rounded-2xl border transition-all flex-shrink-0 active:scale-95 ${isDarkMode ? "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200" : "bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-700"}`}
                title="上傳圖片"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* 輸入框容器 - 金額與項目合併在同一輸入框 */}
              <div
                className={`flex-1 min-w-0 flex items-center rounded-2xl overflow-hidden ${isDarkMode ? "bg-neutral-900/80 border border-neutral-700" : "bg-stone-100"}`}
              >
                {mode === "finance" && (
                  <input
                    type="number"
                    id="financeAmount"
                    name="financeAmount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="金額"
                    style={{ fontSize: "16px" }}
                    className={`flex-shrink-0 w-20 border-0 bg-transparent px-3 py-2.5 focus:outline-none focus:ring-0 transition-all placeholder:text-opacity-60 leading-tight font-mono
                                ${isDarkMode ? "text-white placeholder:text-neutral-400" : "text-stone-700 placeholder:text-stone-400"}`}
                  />
                )}
                {mode === "finance" && (
                  <div
                    className={`w-px h-5 ${isDarkMode ? "bg-neutral-600" : "bg-stone-300"}`}
                  ></div>
                )}
                <textarea
                  id="financeTextInput"
                  name="financeTextInput"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 40)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleManualSubmit();
                      e.target.style.height = "auto";
                    }
                  }}
                  rows={1}
                  placeholder={
                    mode === "finance" ? "項目說明..." : "記事內容..."
                  }
                  style={{ fontSize: "16px" }}
                  className={`flex-1 min-w-0 border-0 bg-transparent px-3 py-2.5 focus:outline-none focus:ring-0 transition-all placeholder:text-opacity-60 resize-none max-h-[40px] leading-snug
                            ${isDarkMode ? "text-white placeholder:text-neutral-400" : "text-stone-700 placeholder:text-stone-400"}`}
                />
              </div>

              {/* 發送按鈕 */}
              <button
                onClick={() => {
                  handleManualSubmit();
                  const textarea = document.querySelector("textarea");
                  if (textarea) textarea.style.height = "auto";
                }}
                disabled={
                  isUploading ||
                  isScanning ||
                  (mode === "finance" && !amount) ||
                  (mode === "note" &&
                    !inputText.trim() &&
                    noteImages.length === 0)
                }
                className={`p-2.5 rounded-2xl transition-all flex-shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                          isUploading ||
                          isScanning ||
                          (mode === "finance" && !amount) ||
                          (mode === "note" &&
                            !inputText.trim() &&
                            noteImages.length === 0)
                            ? isDarkMode
                              ? "bg-neutral-800 border border-neutral-700 text-neutral-500"
                              : "bg-stone-300 text-stone-400"
                            : isDarkMode
                              ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-lg"
                              : "bg-stone-500 text-white hover:bg-stone-600"
                        }`}
              >
                {isUploading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- 發票批次確認 Modal - 使用 Portal 確保獨立顯示 --- */}
      {showReceiptModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn transform-gpu"
            style={{ willChange: "opacity, transform" }}
          >
            <div
              className={`w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-stone-200/50"}`}
            >
              {/* Modal Header */}
              <div className="p-4 border-b flex items-center justify-between shrink-0 bg-opacity-50 backdrop-blur-lg">
                <h3
                  className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}
                >
                  {isScanning ? (
                    <Loader className="w-5 h-5 animate-spin text-sky-500" />
                  ) : (
                    <Scan className="w-5 h-5 text-sky-500" />
                  )}
                  {isScanning ? "正在分析..." : "確認發票明細"}
                </h3>
                {!isScanning && (
                  <button
                    onClick={() => {
                      setShowReceiptModal(false);
                      setReceiptImages([]);
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      isDarkMode
                        ? "hover:bg-neutral-700 text-neutral-300 hover:text-neutral-100"
                        : "hover:bg-stone-200 text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide min-h-[96px]">
                  {receiptImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border shadow-sm group"
                    >
                      <img
                        src={img}
                        alt={`Receipt ${idx}`}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        decoding="async"
                      />
                      <div className="absolute top-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-lg ring-1 ring-white/10">
                        {idx + 1}
                      </div>
                      {/* 🆕 刪除按鈕 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveReceiptImage(idx);
                        }}
                        className="absolute top-1 left-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                        title="移除此圖片"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {!isScanning && (
                    <button
                      onClick={() => appendInputRef.current?.click()}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isDarkMode ? "border-neutral-600 bg-neutral-800/30 text-neutral-400 hover:text-sky-400 hover:border-sky-500" : "border-stone-400 bg-stone-50 text-stone-500 hover:text-sky-500 hover:border-sky-400"}`}
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] font-bold">加拍一張</span>
                    </button>
                  )}
                  <input
                    type="file"
                    id="appendReceiptImage"
                    name="appendReceiptImage"
                    ref={appendInputRef}
                    onChange={handleAppendImage}
                    accept="image/*"
                    className="hidden"
                    multiple
                  />

                  {isScanning && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-gray-500/10 animate-pulse flex items-center justify-center border border-transparent">
                      <Loader className="w-6 h-6 opacity-30 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {receiptItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isDarkMode ? "bg-neutral-800/50 border-neutral-700" : "bg-stone-50/80 border-stone-300"} ${!item.selected && "opacity-50"}`}
                    >
                      <button
                        onClick={() => {
                          const newItems = [...receiptItems];
                          newItems[idx].selected = !newItems[idx].selected;
                          setReceiptItems(newItems);
                        }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${item.selected ? "bg-sky-500 border-sky-500 text-white" : "border-gray-400"}`}
                      >
                        {item.selected && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          id={`receiptItemName-${idx}`}
                          name={`receiptItemName-${idx}`}
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...receiptItems];
                            newItems[idx].name = e.target.value;
                            setReceiptItems(newItems);
                          }}
                          className={`w-full bg-transparent outline-none text-sm font-bold border-b border-transparent focus:border-sky-500 ${theme.text}`}
                          placeholder="品項名稱"
                        />
                        <div
                          className={`flex items-center text-sm font-semibold ${
                            isDarkMode ? "text-sky-400" : "text-sky-600"
                          }`}
                        >
                          <span className="mr-1">¥</span>
                          <input
                            type="number"
                            id={`receiptItemAmount-${idx}`}
                            name={`receiptItemAmount-${idx}`}
                            value={item.amount}
                            onChange={(e) => {
                              const newItems = [...receiptItems];
                              newItems[idx].amount = e.target.value;
                              setReceiptItems(newItems);
                            }}
                            className={`bg-transparent outline-none w-20 border-b border-transparent focus:border-sky-500 ${
                              isDarkMode ? "text-white" : "text-stone-700"
                            }`}
                            placeholder="金額"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newItems = receiptItems.filter(
                            (_, i) => i !== idx,
                          );
                          setReceiptItems(newItems);
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {!isScanning && (
                  <button
                    onClick={() =>
                      setReceiptItems([
                        ...receiptItems,
                        {
                          id: Date.now(),
                          name: "",
                          amount: "",
                          selected: true,
                        },
                      ])
                    }
                    className={`w-full mt-4 py-3 border border-dashed rounded-lg flex items-center justify-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-all ${isDarkMode ? "border-neutral-600 text-neutral-500 hover:border-sky-500 hover:text-sky-400" : "border-stone-400 text-stone-600 hover:border-[#5D737E] hover:text-[#5D737E]"}`}
                  >
                    <Plus className="w-4 h-4" /> 新增項目
                  </button>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 pb-8 border-t bg-opacity-50 backdrop-blur-lg shrink-0">
                <button
                  onClick={handleBatchConfirm}
                  disabled={
                    isScanning ||
                    receiptItems.filter((i) => i.selected).length === 0
                  }
                  className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                        ${isScanning || receiptItems.filter((i) => i.selected).length === 0 ? "bg-stone-400 opacity-50 cursor-not-allowed" : isDarkMode ? "bg-sky-600 hover:bg-sky-700" : "bg-[#5D737E] hover:bg-[#4A606A]"}`}
                >
                  {isScanning
                    ? "分析中..."
                    : `確認匯入 ${receiptItems.filter((i) => i.selected).length} 筆項目`}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* --- 編輯紀錄 Modal - 使用 Portal 確保獨立顯示 --- */}
      {editingRecord &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
            <div
              className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 border ${isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-stone-200/50"}`}
            >
              <h3
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
              >
                <Edit3 className="w-5 h-5 text-sky-500" />
                編輯紀錄
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className={`text-xs font-bold mb-1 block ${theme.textSec}`}
                  >
                    內容 / 品項
                  </label>
                  <input
                    type="text"
                    id="editContent"
                    name="editContent"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={`w-full p-3 rounded-lg border bg-transparent outline-none focus:ring-2 transition-all ${isDarkMode ? "border-neutral-700 text-white focus:border-sky-500 focus:ring-sky-500/20" : "border-stone-300 text-stone-800 focus:border-[#5D737E] focus:ring-[#5D737E]/20"}`}
                  />
                </div>
                {editingRecord.type === "finance" && (
                  <div>
                    <label
                      className={`text-xs font-bold mb-1 block ${theme.textSec}`}
                    >
                      金額 (JPY)
                    </label>
                    <input
                      type="number"
                      id="editAmount"
                      name="editAmount"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className={`w-full p-3 rounded-lg border bg-transparent outline-none font-mono focus:ring-2 transition-all ${isDarkMode ? "border-neutral-700 text-white focus:border-sky-500 focus:ring-sky-500/20" : "border-stone-300 text-stone-800 focus:border-[#5D737E] focus:ring-[#5D737E]/20"}`}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelEditing}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${isDarkMode ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
                >
                  取消
                </button>
                <button
                  onClick={saveEdit}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm text-white shadow-lg transition-colors flex items-center justify-center gap-2 ${isDarkMode ? "bg-sky-600 hover:bg-sky-700" : "bg-[#5D737E] hover:bg-[#4A606A]"}`}
                >
                  <Save className="w-4 h-4" /> 儲存
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default FinanceScreen;
