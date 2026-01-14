import React from "react";
import FinanceNote from "../FinanceNote.jsx";

const FinanceTab = ({
  isDarkMode,
  theme,
  rateData,
  gasUrl,
  gasToken,
  apiKey,
  setFullPreviewImage,
  showToast,
}) => {
  return (
    <div className="flex-1 animate-fadeIn">
      <FinanceNote
        isDarkMode={isDarkMode}
        theme={theme}
        rateData={rateData} // 傳遞匯率資料
        gasUrl={gasUrl} // 傳遞 GAS URL
        gasToken={gasToken} // 傳遞 Token
        apiKey={apiKey} // 傳遞 Gemini API Key
        setFullPreviewImage={setFullPreviewImage} // 複用 App.jsx 的圖片預覽遮罩
        showToast={showToast} // 複用 Toast 提示
      />
    </div>
  );
};

export default FinanceTab;
