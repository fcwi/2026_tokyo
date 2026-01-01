# 測試模式調試指南

## 步驟 1：打開開發者工具
- 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- 選擇「Console」分頁

## 步驟 2：進入測試模式
1. 點擊標題 10 次 直到出現粉紅色 Key 按鈕
2. 點擊粉紅色 Key 進入測試模式
3. TestModePanel 應該會滑上來

## 步驟 3：測試時間修改
1. 修改日期為 `2026/01/27`（Day 3）
2. 修改時間為 `09:00`
3. 點擊「儲存變更」
4. **檢查 Console 中的日誌**，應該看到：
   ```
   🧪 行程狀態計算 - isTestMode=true, testDateTime=...2026/1/27 09:00:00, calculatedToday=...2026/1/27 09:00:00
   🧪 正在行程中 - currentTripDayIndex=2
   ```

5. 滑動回總覽頁，應該看到「今天是 Day 3」

## 步驟 4：測試天氣覆寫
1. 點擊「總覽天氣」展開
2. 選擇「下雪」（代碼 71）
3. 點擊「儲存變更」
4. **檢查 Console 中的日誌**，應該看到：
   ```
   🧪 測試模式總覽天氣：覆蓋=71, 原始=..., 最終=71
   🧪 初始 currentEffectCode=..., isTestMode=true, activeDay=-1
   🧪 應用總覽天氣覆蓋: 71
   ```

5. 總覽頁應該顯示雪花特效（❄️）

## 故障排除

### 日誌中看不到日期更改
- 確認 `isTestMode=true`
- 檢查 `testDateTime` 是否有更新

### 日誌中看不到天氣更改
- 檢查 `testWeatherOverride.overview` 是否有值
- 確認 `currentEffectCode` 是否被改變

### 看不到視覺效果
- 檢查 `getParticleType()` 是否返回正確的粒子類型
- 檢查 `isDarkMode` 和 `isDayTime` 的值

