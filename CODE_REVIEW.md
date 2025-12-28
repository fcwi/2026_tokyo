# 程式碼審查報告 - App.jsx

## 🎯 優化建議總結

### 🔴 **高優先級問題**

#### 1. **重複的複製到剪貼簿邏輯 (10 次重複)**
**位置**: 1595, 1610, 1671, 1686, 1759, 1774, 1807, 1822, 1893, 1908 行

**問題**: 同樣的複製邏輯被重複寫了 10 次
```javascript
// 重複出現的代碼
const textArea = document.createElement("textarea");
textArea.value = text;
document.body.appendChild(textArea);
textArea.select();
document.execCommand("copy");
document.body.removeChild(textArea);
```

**建議**: 提取為獨立函數
```javascript
const copyToClipboard = async (text, successMsg = "已複製到剪貼簿") => {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast(successMsg);
    return true;
  } catch (e) {
    console.error("複製失敗:", e);
    showToast("複製失敗", "error");
    return false;
  }
};
```

**預期改進**: 減少代碼重複 ~100 行，提高可維護性

---

#### 2. **console.log 在生產環境出現**
**位置**: 1010, 1400, 1412, 1517, 1552, 2182, 2277, 2282, 2288, 2297, 2300, 2320, 2334, 2341, 2352, 2355, 2358 行

**問題**: 多個 console.log 會在生產環境出現，影響性能和用戶體驗

**建議**: 
```javascript
// 環境變量檢查
const isDev = import.meta.env.DEV; // Vite 環境變量

const debugLog = (message, data) => {
  if (isDev) console.log(message, data);
};

// 使用範例
debugLog("🚀 State 初始化：直接載入快取資料", parsed.locationName);
```

**預期改進**: 減少生產環境的 console 輸出，改善效能

---

### 🟡 **中優先級問題**

#### 3. **Messages 列表更新時可能的效能問題**
**位置**: 1095-1100 行的 useEffect

**問題**: 每次 messages 或 aiMode 改變時都重新序列化整個列表存入 localStorage
```javascript
useEffect(() => {
  const historyToSave = messages.map((msg) => ({
    ...msg,
    image: null,
  }));
  localStorage.setItem(getStorageKey(aiMode), JSON.stringify(historyToSave));
}, [messages, aiMode]);
```

**建議**: 使用防抖延遲存儲（避免频繁的 localStorage 操作）
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    const historyToSave = messages.map((msg) => ({
      ...msg,
      image: null,
    }));
    localStorage.setItem(getStorageKey(aiMode), JSON.stringify(historyToSave));
  }, 500); // 500ms 防抖

  return () => clearTimeout(timer);
}, [messages, aiMode]);
```

**預期改進**: 減少不必要的 localStorage 寫入操作，改善用戶輸入時的響應性

---

#### 4. **Checklist 儲存時未使用防抖**
**位置**: 910-911 行

**問題**: 類似 messages 的問題，每次清單項目改變都立即存儲
```javascript
useEffect(() => {
  localStorage.setItem("trip_checklist_v1", JSON.stringify(checklist));
}, [checklist]);
```

**建議**: 添加防抖延遲
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem("trip_checklist_v1", JSON.stringify(checklist));
  }, 500);

  return () => clearTimeout(timer);
}, [checklist]);
```

**預期改進**: 減少 localStorage 寫入頻率，改善快速操作時的效能

---

#### 5. **內聯事件處理器可能導致子組件重新渲染**
**位置**: 多個地方使用 `onClick={() => ...}`

**問題**: 雖然這裡沒有 memo 化組件，但對於將來的優化困難
```javascript
// 多個位置
onClick={() => changeDay(index)}
onClick={() => toggleCheckItem(item.id)}
onClick={(e) => { ... }}
```

**建議**: 對常見操作進行提取
```javascript
// 提取為常用處理器
const handleChangeDayClick = (index) => () => changeDay(index);
const handleToggleCheckClick = (id) => () => toggleCheckItem(id);

// 使用
onClick={handleChangeDayClick(index)}
onClick={handleToggleCheckClick(item.id)}
```

---

### 🟢 **低優先級建議**

#### 6. **建議分離複雜的邏輯組件**
**問題**: App.jsx 文件有 5043 行，包含了所有的邏輯、狀態管理和 UI 渲染

**建議**: 考慮分離以下組件
- `WeatherBackground` 組件 (weather effects)
- `ChatPanel` 組件 (chat interface)
- `ItineraryDay` 組件 (day view)
- `ShopsGuide` 組件 (shop guide)
- `ChecklistSection` 組件 (checklist)

**預期改進**: 提高代碼可讀性和可維護性，便於測試和重用

---

#### 7. **useCallback 依賴關係需優化**
**位置**: getWeatherInfo (已修複✅)

**情況**: 雖然已經在上次優化中修複了 getWeatherInfo 的依賴，但需要檢查其他 useCallback

**建議**: 定期審查 useCallback 依賴，避免不必要的重新創建

---

#### 8. **Error Handling 可以更一致**
**問題**: 某些 API 調用有 error handling，某些沒有

**建議**: 統一錯誤處理模式
```javascript
// 建議創建通用的 API 包裝器
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API 調用失敗 (${url}):`, error);
    throw error;
  }
};
```

---

## 📊 優化優先順序

| 優先級 | 類型 | 行數節省 | 難度 | 預期效果 |
|------|------|--------|------|---------|
| 🔴 高 | 提取 copyToClipboard | ~100 行 | ⭐ 簡單 | 中等 |
| 🔴 高 | 移除 console.log | ~30 行 | ⭐ 簡單 | 高 |
| 🟡 中 | 防抖 localStorage | 0 行 | ⭐⭐ 中等 | 高 |
| 🟡 中 | 內聯處理器優化 | ~20 行 | ⭐⭐ 中等 | 低 |
| 🟢 低 | 組件分離 | N/A | ⭐⭐⭐ 困難 | 高 |

---

## ✅ 已完成的優化

- ✅ **getWeatherInfo 依賴優化**: 將天氣數據邏輯與 UI 邏輯分離，避免切換日夜模式時重新獲取數據

---

## 🎬 後續建議

1. **短期** (1-2 周):
   - [ ] 提取 copyToClipboard 函數
   - [ ] 添加環境變量檢查來控制 console.log
   - [ ] 為 messages 和 checklist 添加防抖

2. **中期** (1-2 月):
   - [ ] 提取主要組件 (WeatherBackground, ChatPanel, etc.)
   - [ ] 統一 error handling
   - [ ] 添加單元測試

3. **長期** (3+ 月):
   - [ ] 考慮使用 Context API 或狀態管理庫 (Zustand, Redux)
   - [ ] 性能監控和優化
   - [ ] 代碼分割和懶加載
