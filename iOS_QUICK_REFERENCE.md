# 🍎 iOS 相容性快速參考卡

## 📱 已修正的關鍵問題

### 1️⃣ 輸入框自動縮放 ✅
```jsx
// ❌ 錯誤 - 會導致 iOS 自動放大
<input className="text-sm" />

// ✅ 正確 - 防止自動縮放
<input style={{ fontSize: '16px' }} />
```

**修正位置：**
- ChatInput.jsx - textarea
- FinanceNote.jsx - 所有 input/textarea

---

### 2️⃣ 滾動優化 ✅
```css
/* ✅ 添加到可滾動容器 */
-webkit-overflow-scrolling: touch;
overscroll-behavior: contain;
```

**修正位置：**
- WeatherDetail.css

---

### 3️⃣ 觸控反饋 ✅
```css
/* ✅ 移除點擊高亮 */
-webkit-tap-highlight-color: transparent;
-webkit-user-select: none;
touch-action: manipulation;

/* ✅ 添加視覺反饋 */
button:active {
  opacity: 0.7;
  transform: scale(0.98);
}
```

**修正位置：**
- CalculatorModal.css - 所有按鈕
- index.css - 全域設定

---

### 4️⃣ 安全區域 ✅
```css
/* ✅ 定義變數 */
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}

/* ✅ 應用於容器 */
padding-top: max(1rem, env(safe-area-inset-top));
```

**修正位置：**
- index.css - 變數定義
- App.css - #root padding

---

## 🎯 iOS 專用功能

### PWA 安裝提示
```javascript
// 自動檢測並顯示
- ✅ 僅在 iOS Safari 顯示
- ✅ 已安裝則不顯示
- ✅ 關閉後記憶選擇
```

### 螢幕方向鎖定
```javascript
// 橫向時提醒用戶
- ✅ 全螢幕警告
- ✅ 3 秒自動消失
- ✅ 可手動關閉
```

---

## 📋 測試清單

### iOS Safari 瀏覽器
- [ ] 輸入框不會自動縮放
- [ ] 滾動流暢無卡頓
- [ ] 按鈕有觸控反饋
- [ ] 安裝提示正常顯示

### PWA 獨立模式
- [ ] 全螢幕無導覽列
- [ ] 狀態列半透明
- [ ] 內容不被遮擋
- [ ] 安裝提示不顯示

### 互動測試
- [ ] 計算器按鈕靈敏
- [ ] 地圖滑動正常
- [ ] 表單輸入流暢
- [ ] 方向警告正常

---

## 🚀 部署指令

```bash
# 構建
npm run build

# 部署
npm run deploy
```

---

## 📊 檢查狀態

✅ **所有組件已優化**
✅ **構建無錯誤**
✅ **跨平台相容**

---

## 📞 快速故障排除

### Q: 輸入框還是會縮放？
**A:** 確認 `style={{ fontSize: '16px' }}` 已添加

### Q: 滾動不流暢？
**A:** 檢查是否添加 `-webkit-overflow-scrolling: touch`

### Q: 安裝提示不顯示？
**A:** 
1. 確認使用 iOS Safari
2. 未加入主畫面
3. 未關閉過提示

### Q: 內容被瀏海遮擋？
**A:** 確認 `viewport-fit=cover` 在 index.html

---

## 📚 相關文件

- [iOS_COMPATIBILITY_REPORT.md](iOS_COMPATIBILITY_REPORT.md) - 完整報告
- [iOS_PWA_FEATURES.md](iOS_PWA_FEATURES.md) - 功能說明
- [check-ios-features.ps1](check-ios-features.ps1) - 檢查腳本
- [public/ios-test.html](public/ios-test.html) - 測試頁面

---

**最後更新：** 2026年1月12日
