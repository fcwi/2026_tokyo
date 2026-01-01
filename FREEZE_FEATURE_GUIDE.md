# 🔒 測試模式凍結功能指南

## 問題背景

原本在測試模式中修改時間和天氣後，當執行其他操作（如導航、點擊按鈕等）時，這些設定會被重新計算和覆蓋，導致修改無法持久化。

## 解決方案

實現了 **凍結/解凍（Freeze/Unfreeze）** 機制，允許用戶在測試模式中「鎖定」設定值，防止它們被無意中覆蓋。

## 使用流程

### 1️⃣ 打開測試模式
- 在主畫面上點擊 **Key 圖示 10 次**（快速連續點擊）
- TestModePanel 會從下方滑上來

### 2️⃣ 修改測試值
在 TestModePanel 中修改：
- **日期/時間** - 使用日期選擇器和時間選擇器
- **GPS 座標** - 手動輸入經緯度
- **天氣效果** - 為總覽和每一天選擇天氣代碼

### 3️⃣ 儲存變更
- 點擊 **「儲存變更」** 按鈕（綠色）
- 確認修改已應用到應用程序

### 4️⃣ 凍結設定 ⭐️ 新功能
- 點擊 **「🔒 凍結設定」** 按鈕（黃色）
- 頂部會出現 **「🔒 測試設定已凍結」** 的藍色提示橫幅
- 按鈕變成 **「🔓 解凍設定」**（藍色）
- **效果**：修改值現在已鎖定，不會被其他操作覆蓋

### 5️⃣ 在凍結狀態下工作
- 導航不同天數 ✅ 時間/天氣保持不變
- 打開其他面板 ✅ 設定保持不變
- 執行其他操作 ✅ 設定不被重置

### 6️⃣ 解凍設定（如需要）
- 點擊 **「🔓 解凍設定」** 按鈕
- 提示橫幅消失
- 設定恢復動態模式（會被其他操作更新）

## 技術實現細節

### 凍結狀態變數
```javascript
const [frozenTestDateTime, setFrozenTestDateTime] = useState(null);
const [frozenTestWeatherOverride, setFrozenTestWeatherOverride] = useState(null);
```

### 凍結函式
```javascript
const freezeTestSettings = () => {
  // 複製當前測試值
  setFrozenTestDateTime(new Date(testDateTime));
  setFrozenTestWeatherOverride(JSON.parse(JSON.stringify(testWeatherOverride)));
  showToast("✅ 測試設定已凍結，不會被覆蓋", "success");
};

const unfreezeTestSettings = () => {
  setFrozenTestDateTime(null);
  setFrozenTestWeatherOverride(null);
  showToast("✅ 測試設定已解凍，恢復動態更新", "success");
};
```

### 優先順序邏輯
計算時間和天氣時，現在優先使用凍結值：

```javascript
// 時間計算
const displayDateTime = frozenTestDateTime || 
                       (isTestMode ? testDateTime : new Date());

// 天氣計算
const effectiveWeatherOverride = frozenTestWeatherOverride || testWeatherOverride;
```

## Console 日誌指示器

打開開發者工具（F12）查看日誌時：

- 🧪 **時間計算日誌**
  ```
  🧪 行程狀態計算 - isFrozen=true (已凍結)
  🧪 行程狀態計算 - isFrozen=false (未凍結)
  ```

- 🧪 **天氣覆蓋日誌**
  ```
  🧪 應用凍結總覽天氣覆蓋: 71 (下雪)
  🧪 應用凍結 Day 1 天氣覆蓋: 0 (晴朗)
  ```

## 測試場景

### 場景 1：驗證時間凍結
1. 修改日期為 2026/1/27（Day 3）
2. 點擊「儲存變更」
3. 點擊「🔒 凍結設定」
4. 導航到不同的天數，再回到總覽
5. ✅ 應顯示 **Day 3** 而非原始日期

### 場景 2：驗證天氣凍結
1. 選擇天氣代碼 71（下雪）為總覽和 Day 1
2. 點擊「儲存變更」
3. 點擊「🔒 凍結設定」
4. 打開和關閉不同面板
5. ✅ 應持續顯示下雪效果

### 場景 3：解凍後恢復動態更新
1. 確認設定已凍結
2. 點擊「🔓 解凍設定」
3. 刷新頁面或執行其他操作
4. ✅ 值應恢復為實時計算值

## 常見問題

### Q：冷凍後仍看不到效果？
**A：** 請檢查：
1. 確認點擊了「儲存變更」按鈕
2. 確認點擊了「🔒 凍結設定」按鈕
3. 查看頂部的藍色提示橫幅
4. 打開 Console 查看 🧪 日誌

### Q：如何知道設定是否已凍結？
**A：** 有以下視覺指示：
1. TestModePanel 頂部出現藍色 **「🔒 測試設定已凍結」** 橫幅
2. 凍結按鈕變成藍色 **「🔓 解凍設定」**
3. Console 中的日誌顯示 `isFrozen=true`

### Q：可以在凍結狀態下修改值嗎？
**A：** 可以！你仍然可以在 TestModePanel 中修改值，但需要：
1. 修改新值
2. 點擊「儲存變更」提交
3. 點擊「🔓 解凍設定」解凍
4. 再點擊「🔒 凍結設定」重新凍結新值

### Q：凍結的數據在重新加載後會保留嗎？
**A：** 不會，刷新頁面後：
- 凍結狀態會重置
- 設定恢復為默認值
- 需要重新配置和凍結

## 更新日誌

### v1.0 (當前)
- ✨ 新增凍結/解凍按鈕
- ✨ 新增凍結狀態提示橫幅
- 🔧 改進背景特效使用凍結的天氣值
- 📊 增強 console.log 顯示凍結狀態指示器

---

**需要幫助？** 查看 Console 日誌（F12）中的 🧪 標記信息
