# App.jsx 組件拆解進度清單

此清單紀錄 `App.jsx` 模組化重構的進度。遵循「原始程式碼完全不變、註解不刪、小步快跑」原則。

| 序號 | 組件名稱             | 預定路徑                                  | 依賴 Props (Inputs)                                | 外部依賴 (Icons/Utils)           | 主程式清理狀態 |
| :--- | :------------------- | :---------------------------------------- | :------------------------------------------------- | :------------------------------- | :------------- |
| 01   | **ThemeConfig**      | `src/config/ThemeConfig.jsx`              | 無 (Static Config)                                 | `tripConfig`                     | ✅ [V] 已確認  |
| 02   | **FlightInfoCard**   | `src/components/FlightInfoCard.jsx`       | `flightData`, `isExpanded`, `onToggle`             | `ChevronDown`, `Plane`           | ✅ [V] 已確認  |
| 03   | **ChecklistCard**    | `src/components/ChecklistCard.jsx`        | `checklistData`                                    | `Check`, `ListTodo`              | ✅ [V] 已確認  |
| 04   | **WeatherCard**      | `src/components/WeatherCard.jsx`          | `userWeather`, `onRefresh`                         | `Sun`, `Cloud`, `getWeatherData` | ✅ [V] 已確認  |
| 05   | **BottomNav**        | `src/components/Navigation/BottomNav.jsx` | `activeTab`, `onTabChange`, `isDarkMode`, `theme`  | `Home`, `Store`, `MessageSquare` | ✅ [V] 已確認  |
| 06   | **AIPanel**          | `src/components/AI/AIPanel.jsx`           | `messages`, `aiMode`, `isLoading`, `onSendMessage` | `ChatMessageList`, `ChatInput`   | ✅ [V] 已確認  |
| 07   | **ItineraryTab**     | `src/components/Tabs/ItineraryTab.jsx`    | `itineraryData`, `activeDay`, `onDayChange`        | `Framer Motion`, `DayMap`        | ✅ 已提取      |
| 08   | **FinanceTab**       | `src/components/Tabs/FinanceTab.jsx`      | `rateData`, `gasUrl`, `gasToken`                   | `FinanceNote`                    | ✅ 已提取      |
| 09   | **Hooks Extraction** | `src/hooks/useAppLogic.js`                | 無                                                 | `weatherHelpers`, `crypto`       | ✅ 已提取      |

## 重構原則

1. **小步快跑**：每次僅拆分一個組件，確保功能正常後再進行下一個。
2. **註解保留**：完整搬移相關註解，確保後續維護者理解邏輯。
3. **Props 傳遞**：優先使用 Props 傳遞狀態，避免過度依賴 Context 以保持組件獨立性。
