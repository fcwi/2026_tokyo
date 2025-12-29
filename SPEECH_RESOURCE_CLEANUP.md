# 語音辨識資源清理優化總結

## 優化概述
為語音識別 (`SpeechRecognition`) 和語音播放 (`SpeechSynthesis`) 添加完整的資源清理機制，確保組件卸載時完全釋放所有語音資源，防止內存洩漏和後台進程殘留。

---

## 1. 語音識別 (SpeechRecognition) 清理

### 位置
[src/App.jsx 第 2109-2155 行](src/App.jsx#L2109-L2155)

### 清理機制

```jsx
// 🆕 清理函式：組件卸載時確保完全停止語音識別
return () => {
  if (recognitionRef.current) {
    try {
      // 1️⃣ 停止語音識別
      recognitionRef.current.stop();
      
      // 2️⃣ 清除所有事件監聽器，避免內存洩漏
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      
      // 3️⃣ 清除引用
      recognitionRef.current = null;
      
      // 4️⃣ 重置狀態
      setListeningLang(null);
    } catch (error) {
      console.error("清理語音識別資源時出錯:", error);
    }
  }
};
```

### 清理步驟詳解

| 步驟 | 操作 | 目的 |
|------|------|------|
| 1️⃣ | `recognitionRef.current.stop()` | 立即停止進行中的識別 |
| 2️⃣ | 設置 `onresult/onend/onerror = null` | 移除事件監聽器，防止幽靈監聽 |
| 3️⃣ | `recognitionRef.current = null` | 清除引用，便於垃圾回收 |
| 4️⃣ | `setListeningLang(null)` | 重置 UI 狀態 |

---

## 2. 語音識別操作 (toggleListening) 錯誤處理

### 位置
[src/App.jsx 第 2157-2177 行](src/App.jsx#L2157-L2177)

### 增強的錯誤處理

```jsx
const toggleListening = (lang) => {
  if (!recognitionRef.current) {
    alert("抱歉，您的瀏覽器不支援語音輸入功能。");
    return;
  }
  
  try {
    if (listeningLang === lang) {
      // 停止當前識別
      recognitionRef.current.stop();
      setListeningLang(null);
    } else {
      // 停止其他語言的識別（如果有的話）
      if (listeningLang) {
        recognitionRef.current.stop();
      }
      setInputMessage("");
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setListeningLang(lang);
    }
  } catch (error) {
    console.error("語音識別操作出錯:", error);
    // 發生錯誤時重置狀態
    setListeningLang(null);
    showToast("語音輸入出現問題，請重試", "error");
  }
};
```

### 改善點

- ✅ 使用 try-catch 捕捉 API 異常
- ✅ 語言切換時確保停止舊識別
- ✅ 錯誤時重置 `listeningLang` 狀態
- ✅ 向用戶展示友好的錯誤提示

---

## 3. 語音朗讀 (SpeechSynthesis) 清理

### 位置
[src/App.jsx 第 2022-2040 行](src/App.jsx#L2022-L2040)

### 卸載時語音清理

```jsx
// --- 卸載清理：中止所有進行中的 API 請求和語音資源 ---
useEffect(() => {
  return () => {
    // 🆕 清理語音朗讀
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } catch (error) {
        console.error("清理語音朗讀資源時出錯:", error);
      }
    }

    // ... API 清理邏輯 ...
  };
}, []);
```

### 清理效果

- ✅ 立即停止進行中的播放 (`cancel()`)
- ✅ 重置 UI 狀態 (`setIsSpeaking(false)`)
- ✅ 錯誤處理，防止拋出異常

---

## 4. 資源清理流程圖

```
組件卸載 (unmount)
    │
    ├─ 語音識別資源清理
    │   ├─ stop() - 停止識別
    │   ├─ 清除事件監聽器
    │   ├─ 清除 ref 引用
    │   └─ 重置狀態
    │
    ├─ 語音朗讀資源清理
    │   ├─ cancel() - 停止播放
    │   └─ 重置狀態
    │
    └─ API 請求中止
        ├─ Gemini API
        └─ Google Maps API
```

---

## 5. 防止的問題

### 問題 1：幽靈監聽器 (Ghost Listeners)
**原因**: onresult 等事件監聽器未清除  
**後果**: 卸載後仍可能執行，導致狀態更新錯誤  
**解決**: 在清理函式中將監聽器設為 `null`

### 問題 2：進行中識別未停止
**原因**: 未調用 `stop()`  
**後果**: 後台仍在監聽麥克風，消耗資源  
**解決**: 清理時立即調用 `stop()`

### 問題 3：內存洩漏
**原因**: recognitionRef 引用未清除  
**後果**: 垃圾回收無法清理該對象  
**解決**: 將 `recognitionRef.current` 設為 `null`

### 問題 4：語音播放未停止
**原因**: 未調用 `speechSynthesis.cancel()`  
**後果**: 卸載後仍在播放聲音  
**解決**: 在卸載時調用 `cancel()`

---

## 6. 最佳實踐

### ✅ 完整的資源清理

```jsx
// 頻率
- 初始化：每次組件 mount 時
- 清理：組件 unmount 時
- 監聽：每次操作前檢查 ref 有效性

// 順序
1. 停止當前操作 (stop/cancel)
2. 移除事件監聽器
3. 清除對象引用
4. 重置 UI 狀態
```

### ✅ 錯誤處理

```jsx
try {
  // 語音操作
} catch (error) {
  console.error("操作失敗:", error);
  // 重置狀態
  setListeningLang(null);
  // 通知用戶
  showToast("出現問題", "error");
}
```

### ✅ 狀態同步

```jsx
// 操作前後都要同步狀態
- 啟動識別：setListeningLang(lang)
- 停止識別：setListeningLang(null)
- 啟動播放：setIsSpeaking(true)
- 停止播放：setIsSpeaking(false)
```

---

## 7. 浏覽器兼容性

| 功能 | Chrome | Safari | Firefox | Edge |
|------|--------|--------|---------|------|
| SpeechRecognition | ✅ | ✅ (webkit) | ⚠️ 部分 | ✅ |
| SpeechSynthesis | ✅ | ✅ | ✅ | ✅ |
| AbortController | ✅ | ✅ | ✅ | ✅ |

**注**：代碼已處理 webkit 前綴版本

---

## 8. 代碼驗證

✅ 無編譯錯誤  
✅ 項目構建成功  
✅ 資源清理完整  
✅ 錯誤處理全面  
✅ 向後相容性好  

---

## 9. 性能改善預期

| 指標 | 改善前 | 改善後 |
|------|-------|-------|
| 組件卸載時語音資源清理 | ❌ 未清理 | ✅ 完全清理 |
| 事件監聽器洩漏 | ⚠️ 可能存在 | ✅ 完全清除 |
| 後台進程殘留 | ⚠️ 可能存在 | ✅ 完全停止 |
| 內存占用 | 📈 逐漸增加 | ✅ 穩定 |
| 麥克風資源 | 📤 持續占用 | ✅ 及時釋放 |

---

## 10. 監控建議

### 開發者工具
1. **Memory 標籤** - 檢查組件卸載前後的內存占用
2. **Performance 標籤** - 監控卸載時的資源釋放過程
3. **Console** - 確認清理日誌輸出無錯誤

### 測試場景
1. 快速切換語言多次
2. 卸載組件（導航離開應用）
3. 長時間保持識別狀態後卸載
4. 語音播放中突然卸載

---

## 總結

此優化通過以下方式完整清理語音資源：

1. **語音識別清理** - 停止識別、移除監聽器、清除引用
2. **語音播放清理** - 停止播放、重置狀態
3. **錯誤處理** - 操作級別和卸載級別的完整錯誤捕捉
4. **狀態同步** - 確保 UI 狀態與實際資源狀態一致

結合 AbortController 優化，完整覆蓋所有異步資源的清理，大幅降低內存洩漏風險和資源占用。
