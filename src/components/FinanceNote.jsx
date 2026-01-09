import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Send, DollarSign, MessageSquare, 
  Loader, Trash2, X, LogOut, Wallet, Plus, Check, ScanLine, Image as ImageIcon,
  RefreshCcw 
} from 'lucide-react';
import { uploadToGAS, parseReceiptWithGemini, fetchFromGAS } from '../utils/financeHelper';

// 預設頭像列表
const AVATARS = [
  '🐶', '🐱', '🐰', '🦊', '🐼', '🐨', 
  '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', 
  '🦄', '🦖', '🐧', '🦉', '🐤', '🦋'
];

// 時間格式化小工具
const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
};

const FinanceScreen = ({ 
  isDarkMode, theme, rateData, 
  gasUrl, gasToken, apiKey, 
  setFullPreviewImage, showToast 
}) => {
  // --- 1. 基礎狀態 ---
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('finance_user')) || null);
  const [setupName, setSetupName] = useState('');
  const [setupAvatar, setSetupAvatar] = useState(AVATARS[0]);
  const [mode, setMode] = useState('finance');
  const [records, setRecords] = useState(() => JSON.parse(localStorage.getItem('finance_records')) || []);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // --- 2. 輸入與 AI 狀態 ---
  const [inputText, setInputText] = useState('');
  const [amount, setAmount] = useState('');
  
  // 支援多圖
  const [noteImages, setNoteImages] = useState([]); 

  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const appendInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- 3. 發票批次處理狀態 ---
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]); 
  const [receiptImages, setReceiptImages] = useState([]); 

  // --- 4. Effect 與 邏輯 ---

  const handleSyncData = useCallback(async (isBackground = false) => {
    if (!gasUrl || !gasToken) return;
    if (!isBackground) setIsSyncing(true);

    try {
      const cloudRecords = await fetchFromGAS(gasUrl, gasToken);
      if (cloudRecords && Array.isArray(cloudRecords)) {
        const formatted = cloudRecords.map(r => ({
          ...r,
          amount: Number(r.amount) || 0,
          twdAmount: Number(r.twdAmount) || 0,
          synced: true
        }));

        // 排序：舊 -> 新 (讓最新的在最下面)
        formatted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setRecords(formatted);
        if (!isBackground) showToast("資料同步完成");
      }
    } catch (e) {
      console.error("Sync error:", e);
      if (!isBackground) showToast("同步失敗，請檢查網路", "error");
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  }, [gasUrl, gasToken, showToast]);

  useEffect(() => {
    localStorage.setItem('finance_records', JSON.stringify(records));
  }, [records]);

  // 當紀錄更新或模式切換時，自動捲動到底部
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [records, mode, noteImages]);

  useEffect(() => {
    if (gasUrl && gasToken && user) {
      handleSyncData(true);
      const intervalId = setInterval(() => {
        console.log("⏰ 觸發背景同步...");
        handleSyncData(true);
      }, 10 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [gasUrl, gasToken, user, handleSyncData]);

  // --- 5. 其他核心邏輯 ---

  const handleUserSetup = () => {
    if (!setupName.trim()) return;
    const newUser = { name: setupName, avatar: setupAvatar };
    localStorage.setItem('finance_user', JSON.stringify(newUser));
    setUser(newUser);
    showToast(`歡迎, ${setupName}!`);
  };

  const handleLogout = () => {
    if(window.confirm("確定要登出並重設使用者身分嗎？(紀錄不會被刪除)")){
        localStorage.removeItem('finance_user');
        setUser(null);
        setSetupName('');
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (mode === 'note') {
      const base64Promises = files.map(file => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
      }));
      
      try {
        const newImages = await Promise.all(base64Promises);
        setNoteImages(prev => [...prev, ...newImages]);
      } catch (err) {
        console.error("Image read error", err);
      }
      e.target.value = '';
      return;
    }

    if (apiKey) {
      setIsScanning(true);
      setShowReceiptModal(true);
      setReceiptItems([]);
      setReceiptImages([]);

      await processImagesForScanning(files, true);
    } else {
       const file = files[0];
       const reader = new FileReader();
       reader.onload = (e) => {
           setNoteImages([e.target.result]);
       };
       reader.readAsDataURL(file);
    }
    e.target.value = ''; 
  };

  const removeNoteImage = (indexToRemove) => {
    setNoteImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAppendImage = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsScanning(true);
    await processImagesForScanning(files, false);
    e.target.value = '';
  };

  const processImagesForScanning = async (files, isReset = false) => {
    try {
        const base64Promises = files.map(file => new Promise((resolve) => {
           const reader = new FileReader();
           reader.onload = (evt) => resolve(evt.target.result);
           reader.readAsDataURL(file);
        }));
        
        const newImages = await Promise.all(base64Promises);
        setReceiptImages(prev => isReset ? newImages : [...prev, ...newImages]);

        const aiPromises = newImages.map(img => parseReceiptWithGemini(img, apiKey));
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
                    name: item.name || '未知品項',
                    amount: item.amount || 0,
                    selected: true,
                    sourceImage: isFirstItemOfImage ? newImages[idx] : null
                  };
                  isFirstItemOfImage = false;
                  return itemObj;
              });
              newItems = [...newItems, ...mapped];
           } else {
              newItems.push({
                id: Date.now() + globalImgIndex * 1000,
                name: result.store ? `${result.store} 消費` : '消費總額',
                amount: result.amount || 0,
                selected: true,
                sourceImage: newImages[idx]
              });
           }
        });

        setReceiptItems(prev => isReset ? newItems : [...prev, ...newItems]);
        showToast(isReset ? `辨識完成！共 ${newImages.length} 張` : `已追加 ${newImages.length} 張並完成辨識`);

      } catch (error) {
        console.error("Scanning error:", error);
        showToast("部分發票辨識失敗", "error");
        if(isReset && receiptItems.length === 0) {
            setReceiptItems([{ id: Date.now(), name: '', amount: '', selected: true }]);
        }
      } finally {
        setIsScanning(false);
      }
  };

  const addRecord = async (content, val, imageBase64, customType = null) => {
    const targetMode = customType || mode;
    const currentRate = rateData?.Exrate || 0.22;
    
    const newItem = {
      id: Date.now() + Math.random(),
      type: targetMode,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      user: user,
      content: content,
      amount: targetMode === 'finance' ? parseFloat(val) : 0,
      twdAmount: targetMode === 'finance' ? Math.round(parseFloat(val) * currentRate) : 0,
      rate: currentRate,
      image: imageBase64,
      synced: false
    };

    setRecords(prev => [...prev, newItem]);

    if (gasUrl && gasToken) {
        uploadToGAS({
            ...newItem,
            action: 'add',
            imageBase64: newItem.image, 
            store: newItem.content ? newItem.content.split('-')[0]?.trim() : '',
            item: newItem.content,
            userName: user.name,
            userAvatar: user.avatar
        }, gasUrl, gasToken)
        .then(() => {
            setRecords(prev => prev.map(r => r.id === newItem.id ? { ...r, synced: true } : r));
        })
        .catch(err => console.error("Upload failed", err));
    }
  };

  const handleManualSubmit = () => {
    if (mode === 'finance' && !amount) {
      showToast("請輸入金額", "error");
      return;
    }
    if (mode === 'note' && !inputText && noteImages.length === 0) return;

    setIsUploading(true);

    if (noteImages.length > 0) {
        noteImages.forEach((img, idx) => {
            const content = idx === 0 ? inputText : ''; 
            setTimeout(() => {
                addRecord(content, amount, img);
            }, idx * 100);
        });
    } else {
        addRecord(inputText, amount, null);
    }
    
    setInputText('');
    setAmount('');
    setNoteImages([]);
    setIsUploading(false);
  };

  const handleBatchConfirm = () => {
    const itemsToImport = receiptItems.filter(i => i.selected && i.name);
    if (itemsToImport.length === 0) {
        setShowReceiptModal(false);
        return;
    }

    setIsUploading(true);
    let count = 0;
    
    itemsToImport.forEach((item, index) => {
        const img = item.sourceImage || null;
        setTimeout(() => {
            addRecord(item.name, item.amount, img, 'finance');
        }, index * 100);
        count++;
    });

    showToast(`已匯入 ${count} 筆消費紀錄`);
    setShowReceiptModal(false);
    setReceiptImages([]);
    setReceiptItems([]);
    setIsUploading(false);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('確定要刪除這筆紀錄嗎？(連動雲端刪除)')) return;
    setRecords(prev => prev.filter(r => r.id !== id));
    if (gasUrl && gasToken) {
      uploadToGAS({ action: 'delete', id: id, type: type }, gasUrl, gasToken)
        .catch(() => showToast("雲端刪除失敗", "error"));
    }
  };

  // --- 6. 渲染 UI ---

  if (!user) {
    return (
      <div className={`flex flex-col items-center justify-center h-[60vh] p-6 space-y-6 animate-fadeIn`}>
         <div className={`w-full max-w-sm backdrop-blur-2xl border rounded-[2rem] p-8 shadow-xl text-center space-y-6 ${theme.cardBg} ${theme.cardBorder}`}>
           {/* ... (登入畫面保持不變) ... */}
           <div className="space-y-2">
            <h2 className={`text-2xl font-bold ${theme.text}`}>歡迎使用旅程記帳</h2>
            <p className={`text-sm ${theme.textSec}`}>請設定您的暱稱與頭像以識別紀錄</p>
           </div>
           <div className="grid grid-cols-6 gap-2 max-h-[30vh] overflow-y-auto p-2 scrollbar-hide">
            {AVATARS.map(av => (
              <button 
                key={av}
                onClick={() => setSetupAvatar(av)}
                className={`text-2xl p-2 rounded-xl border transition-all ${setupAvatar === av ? 'bg-sky-100 border-sky-400 scale-110 shadow-md' : 'border-transparent hover:bg-black/5'}`}
              >
                {av}
              </button>
            ))}
           </div>
           <div className="space-y-4">
            <input
              type="text"
              placeholder="輸入您的暱稱"
              value={setupName}
              onChange={e => setSetupName(e.target.value)}
              className={`w-full p-3 rounded-xl border text-center font-bold outline-none focus:ring-2 focus:ring-sky-300 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-stone-200 text-stone-800'}`}
            />
            <button 
              onClick={handleUserSetup} 
              disabled={!setupName} 
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 
                ${setupName ? 'bg-gradient-to-r from-sky-500 to-blue-600' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              開始記錄
            </button>
          </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pb-28 space-y-5 flex flex-col h-[calc(100vh-120px)] animate-fadeIn relative">
      
      {/* 主容器 */}
      <div className={`backdrop-blur-2xl border rounded-[2rem] shadow-xl flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
        
        {/* Header (保持不變) */}
        <div className={`p-4 border-b flex items-center justify-between backdrop-blur-sm z-10 ${isDarkMode ? 'border-neutral-700 bg-neutral-800/40' : 'border-stone-200/50 bg-white/40'}`}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full flex items-center justify-center bg-stone-100 text-2xl shadow-sm border border-white/50">{user.avatar}</div>
             <div>
                <div className={`text-sm font-bold flex items-center gap-1.5 ${theme.text}`}>
                    {user.name}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isDarkMode ? 'bg-neutral-700 border-neutral-600 text-neutral-400' : 'bg-stone-100 border-stone-200 text-stone-500'}`}>
                        {mode === 'finance' ? '記帳中' : '記事中'}
                    </span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleSyncData(false)} 
              disabled={isSyncing}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-sky-400' : 'bg-white border-stone-200 text-stone-400 hover:text-sky-500'}`}
            >
              <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-500' : ''}`} />
            </button>
            <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-stone-100 border-stone-200'}`}>
                <button onClick={() => setMode('finance')} className={`p-2 rounded-lg transition-all ${mode === 'finance' ? (isDarkMode ? 'bg-sky-700 text-white shadow-sm' : 'bg-white text-sky-600 shadow-sm') : 'text-stone-400'}`}><DollarSign className="w-4 h-4"/></button>
                <button onClick={() => setMode('note')} className={`p-2 rounded-lg transition-all ${mode === 'note' ? (isDarkMode ? 'bg-orange-600 text-white shadow-sm' : 'bg-white text-orange-500 shadow-sm') : 'text-stone-400'}`}><MessageSquare className="w-4 h-4"/></button>
            </div>
            <button onClick={handleLogout} className={`p-2 rounded-xl border transition-all active:scale-95 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-red-400' : 'bg-white border-stone-200 text-stone-400 hover:text-red-500'}`}><LogOut className="w-4 h-4" /></button>
          </div>
        </div>

        {/* 內容列表 - 改版後 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {records.filter(r => r.type === mode).length === 0 && (
             <div className={`flex flex-col items-center justify-center h-full opacity-40 ${theme.textSec}`}>
                 <Wallet className="w-12 h-12 mb-2 stroke-1"/>
                 <p className="text-sm">尚無任何{mode === 'finance' ? '消費' : '記事'}紀錄</p>
             </div>
          )}
          {records.filter(r => r.type === mode).map((record) => (
            <div key={record.id} className={`group flex gap-3 ${record.user.name === user.name ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className="flex-shrink-0 flex flex-col items-center gap-1">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 text-lg shadow-sm">{record.user.avatar}</div>
               </div>
               
               {/* 記帳卡片容器 */}
               <div className={`flex flex-col max-w-[85%] ${record.user.name === user.name ? 'items-end' : 'items-start'}`}>
                   
                   {/* 頂部資訊列 (姓名) */}
                   <span className={`text-[10px] mb-1 opacity-60 flex items-center gap-1 ${theme.textSec}`}>
                     {record.user.name}
                   </span>

                   {/* 卡片本體 */}
                   <div className={`relative overflow-hidden shadow-sm transition-all border
                        ${record.type === 'finance' 
                            ? (isDarkMode ? 'bg-neutral-800 border-neutral-700 rounded-xl w-64' : 'bg-white border-stone-200 rounded-xl w-64') 
                            : (isDarkMode ? 'bg-neutral-800 border-neutral-700 rounded-2xl p-3' : 'bg-white border-stone-200 rounded-2xl p-3')
                        }
                   `}>
                       {/* 刪除按鈕 (Hover 顯示) */}
                       <button onClick={() => handleDelete(record.id, record.type)} className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isDarkMode ? 'hover:bg-black/20 text-white/50' : 'hover:bg-black/5 text-black/30'}`}><X className="w-3 h-3" /></button>

                       {/* === 記帳模式：表格化佈局 === */}
                       {record.type === 'finance' ? (
                           <div className="flex flex-col">
                               {/* 上半部：內容與金額 */}
                               <div className="flex justify-between items-start p-3 gap-3">
                                   {/* 左側：品項與時間 */}
                                   <div className="flex-1 min-w-0">
                                       <div className={`text-sm font-bold truncate leading-tight ${theme.text}`}>{record.content || "未製品項"}</div>
                                       <div className="flex items-center gap-1.5 mt-1.5">
                                           <span className={`text-[10px] ${theme.textSec}`}>{formatTime(record.timestamp)}</span>
                                           {/* 同步勾勾 */}
                                           {record.synced ? (
                                               <Check className="w-3 h-3 text-green-500" />
                                           ) : (
                                               <RefreshCcw className="w-3 h-3 text-orange-400 animate-spin" />
                                           )}
                                       </div>
                                   </div>

                                   {/* 右側：金額 */}
                                   <div className="text-right flex-shrink-0">
                                       <div className={`text-base font-mono font-bold leading-tight ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>
                                            ¥{record.amount.toLocaleString()}
                                       </div>
                                       <div className={`text-[10px] mt-0.5 ${theme.textSec}`}>
                                            ≈ NT$ {record.twdAmount.toLocaleString()}
                                       </div>
                                   </div>
                               </div>

                               {/* 圖片附件 (若有) */}
                               {record.image && (
                                   <div className="px-3 pb-3">
                                       <img 
                                         src={record.image} 
                                         alt="attachment" 
                                         onClick={() => setFullPreviewImage(record.image)} 
                                         className="w-full h-32 object-cover rounded-lg border border-black/5 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                       />
                                   </div>
                               )}
                           </div>
                       ) : (
                           /* === 記事模式：保持對話氣泡佈局 === */
                           <>
                               {record.content && <div className={`text-sm break-words whitespace-pre-wrap ${theme.text}`}>{record.content}</div>}
                               {record.image && <img src={record.image} alt="attachment" onClick={() => setFullPreviewImage(record.image)} className="mt-2 rounded-lg max-h-40 object-cover border border-black/5 cursor-zoom-in" />}
                               <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className={`text-[9px] ${theme.textSec}`}>{formatTime(record.timestamp)}</span>
                                    {record.synced ? <Check className="w-3 h-3 text-green-500" /> : <RefreshCcw className="w-3 h-3 text-orange-400 animate-spin" />}
                               </div>
                           </>
                       )}
                   </div>
               </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer 輸入區 (保持不變) */}
        <div className={`p-3 border-t backdrop-blur-xl ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white/50 border-stone-200/50'}`}>
            
            {/* 多圖預覽列 */}
            {noteImages.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {noteImages.map((img, idx) => (
                        <div key={idx} className="relative flex-shrink-0 w-20 h-20 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden group">
                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removeNoteImage(idx)} 
                                className="absolute top-1 left-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors z-20"
                            >
                                <X className="w-3 h-3"/>
                            </button>
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 rounded-full text-[9px] text-white">
                                {idx + 1}
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center text-xs opacity-50 px-2 min-w-max">
                        <span className={theme.textSec}>已選 {noteImages.length} 張</span>
                    </div>
                </div>
            )}

            <div className="flex items-end gap-2">
                <button onClick={() => fileInputRef.current.click()} className={`p-3 rounded-xl border transition-all active:scale-95 flex-shrink-0 ${theme.cardBg} ${theme.textSec} hover:text-sky-500`}>
                    <Camera className="w-5 h-5" />
                </button>
                
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" multiple />

                <div className={`flex-1 rounded-xl border px-3 py-2 flex flex-col justify-center min-h-[48px] transition-colors ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-white/70 border-stone-200'}`}>
                    {mode === 'finance' && (
                        <div className="flex items-center gap-2 mb-1 border-b border-dashed border-gray-400/30 pb-1">
                            <span className="text-sky-500 font-bold">$</span>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="金額" className={`bg-transparent outline-none w-full font-mono font-bold text-lg ${theme.text} placeholder:opacity-40`} />
                        </div>
                    )}
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder={mode === 'finance' ? "項目 (如: 午餐)" : "留言..."} className={`bg-transparent outline-none w-full text-sm ${theme.text} placeholder:opacity-50`} onKeyDown={e => e.key === 'Enter' && handleManualSubmit()} />
                </div>

                <button onClick={handleManualSubmit} disabled={isUploading || isScanning} className={`p-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex-shrink-0 ${mode === 'finance' ? 'bg-sky-500 shadow-sky-500/30' : 'bg-orange-500 shadow-orange-500/30'} ${(isUploading || isScanning) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? <Loader className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                </button>
            </div>
        </div>

      </div>

      {/* --- 發票批次確認 Modal --- */}
      {/* 🔹 修改重點：Z-Index 提升至 9999，確保不被底部按鈕遮擋 */}
      {showReceiptModal && (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pt-4 pb-28 bg-black/80 backdrop-blur-sm animate-fadeIn transform-gpu"
            style={{ willChange: 'opacity, transform' }}
        >
            <div className={`w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-white/40'}`}>
                
                {/* Modal Header */}
                <div className="p-4 border-b flex items-center justify-between shrink-0 bg-opacity-50 backdrop-blur-md">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
                        {isScanning ? <Loader className="w-5 h-5 animate-spin text-sky-500"/> : <ScanLine className="w-5 h-5 text-sky-500"/>}
                        {isScanning ? '正在分析...' : '確認發票明細'}
                    </h3>
                    {!isScanning && (
                        <button onClick={() => {setShowReceiptModal(false); setReceiptImages([]);}} className="p-2 rounded-full hover:bg-black/10 transition-colors">
                            <X className="w-5 h-5 opacity-50"/>
                        </button>
                    )}
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                    
                    {/* 多張圖片預覽列 + 加拍按鈕 */}
                    <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide min-h-[96px]"> 
                        {receiptImages.map((img, idx) => (
                            <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-white/10 group">
                                <img src={img} alt={`Receipt ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" decoding="async" />
                                <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-md">
                                    {idx + 1}
                                </div>
                            </div>
                        ))}
                        
                        {!isScanning && (
                            <button 
                              onClick={() => appendInputRef.current?.click()}
                              className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isDarkMode ? 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:text-sky-400 hover:border-sky-500' : 'border-stone-300 bg-stone-50 text-stone-400 hover:text-sky-500 hover:border-sky-400'}`}
                            >
                                <Camera className="w-6 h-6"/>
                                <span className="text-[10px] font-bold">加拍一張</span>
                            </button>
                        )}
                        <input type="file" ref={appendInputRef} onChange={handleAppendImage} accept="image/*" className="hidden" multiple />

                        {isScanning && (
                            <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-gray-500/10 animate-pulse flex items-center justify-center border border-transparent">
                                <Loader className="w-6 h-6 opacity-30 animate-spin"/>
                            </div>
                        )}
                    </div>

                    {/* 明細列表 */}
                    <div className="space-y-3">
                        {receiptItems.map((item, idx) => (
                            <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-black/20 border-neutral-700' : 'bg-stone-50 border-stone-200'} ${!item.selected && 'opacity-50'}`}>
                                <button 
                                    onClick={() => {
                                        const newItems = [...receiptItems];
                                        newItems[idx].selected = !newItems[idx].selected;
                                        setReceiptItems(newItems);
                                    }}
                                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${item.selected ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-400'}`}
                                >
                                    {item.selected && <Check className="w-3.5 h-3.5"/>}
                                </button>
                                
                                <div className="flex-1 space-y-1">
                                    <input 
                                        type="text" 
                                        value={item.name}
                                        onChange={(e) => {
                                            const newItems = [...receiptItems];
                                            newItems[idx].name = e.target.value;
                                            setReceiptItems(newItems);
                                        }}
                                        className={`w-full bg-transparent outline-none text-sm font-bold border-b border-transparent focus:border-sky-500 ${theme.text}`}
                                        placeholder="品項名稱"
                                    />
                                    <div className="flex items-center text-xs opacity-70">
                                        <span className="mr-1">¥</span>
                                        <input 
                                            type="number" 
                                            value={item.amount}
                                            onChange={(e) => {
                                                const newItems = [...receiptItems];
                                                newItems[idx].amount = e.target.value;
                                                setReceiptItems(newItems);
                                            }}
                                            className="bg-transparent outline-none w-20 border-b border-transparent focus:border-sky-500"
                                            placeholder="金額"
                                        />
                                    </div>
                                </div>
                                <button onClick={() => {
                                    const newItems = receiptItems.filter((_, i) => i !== idx);
                                    setReceiptItems(newItems);
                                }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>

                    {!isScanning && (
                        <button 
                            onClick={() => setReceiptItems([...receiptItems, { id: Date.now(), name: '', amount: '', selected: true }])}
                            className={`w-full mt-4 py-3 border border-dashed rounded-xl flex items-center justify-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity ${theme.textSec} ${isDarkMode ? 'border-neutral-600' : 'border-stone-300'}`}
                        >
                            <Plus className="w-4 h-4"/> 新增項目
                        </button>
                    )}
                </div>

                {/* Modal Footer (pb-safe 確保不貼底) */}
                <div className="p-4 pb-8 border-t bg-opacity-50 backdrop-blur-md shrink-0">
                    <button 
                        onClick={handleBatchConfirm}
                        disabled={isScanning || receiptItems.filter(i=>i.selected).length === 0}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                        ${isScanning ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-blue-600'}`}
                    >
                        {isScanning ? '分析中...' : `確認匯入 ${receiptItems.filter(i=>i.selected).length} 筆項目`}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default FinanceScreen;