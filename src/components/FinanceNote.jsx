// components/FinanceNote.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Send, DollarSign, MessageSquare, 
  Loader, Trash2, X, LogOut, Wallet, Plus, Check, ScanLine, Image as ImageIcon,
  RefreshCcw, Edit3, Save 
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

  // --- 4. 編輯功能狀態 ---
  const [editingRecord, setEditingRecord] = useState(null); 
  const [editContent, setEditContent] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // --- 5. Effect 與 邏輯 ---

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
        // 舊 -> 新
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

  useEffect(() => {
    if (!editingRecord && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [records, mode, noteImages, editingRecord]);

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

  // --- 6. 核心操作邏輯 ---

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

  const startEditing = (record) => {
    setEditingRecord(record);
    setEditContent(record.content || '');
    setEditAmount(record.amount || '');
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditContent('');
    setEditAmount('');
  };

  const saveEdit = async () => {
    if (!editingRecord) return;
    
    if (editingRecord.type === 'finance' && !editAmount) {
        showToast("金額不能為空", "error");
        return;
    }

    const currentRate = rateData?.Exrate || 0.22;
    const newAmount = editingRecord.type === 'finance' ? parseFloat(editAmount) : 0;
    const newTwdAmount = editingRecord.type === 'finance' ? Math.round(newAmount * currentRate) : 0;

    // 1. 前端樂觀更新 (UI Update)
    const updatedRecords = records.map(r => {
        if (r.id === editingRecord.id) {
            return {
                ...r,
                content: editContent,
                amount: newAmount,
                twdAmount: newTwdAmount,
                synced: false 
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
            await uploadToGAS({
                action: 'edit', 
                id: editingRecord.id,
                type: editingRecord.type,
                content: editContent,
                amount: newAmount,
                twdAmount: newTwdAmount,
                item: editContent, 
                store: editContent.split('-')[0]?.trim()
            }, gasUrl, gasToken);
            
            setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, synced: true } : r));
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
      <div className={`flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-6 animate-fadeIn`}>
         <div className={`w-full max-w-sm backdrop-blur-2xl border rounded-[2rem] p-8 shadow-xl text-center space-y-6 ${theme.cardBg} ${theme.cardBorder}`}>
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

  // ★ UI 修改重點：
  // 1. 改為 min-h-[calc(100vh-130px)]：允許卡片隨內容增長，不再強制固定高度。
  // 2. 移除 overflow-hidden：讓捲動行為回到外層的 window。
  // 3. 列表區移除 overflow-y-auto：這樣列表變長時，會撐開卡片，輸入框自然會被推到頁面最下方，需要捲動頁面才能看到。
  return (
    <div className={`px-4 pb-28 animate-fadeIn flex flex-col min-h-[calc(100vh-130px)]`}>
      
      {/* 主卡片容器：flex-1 確保內容少時撐開高度，但移除 overflow 讓內容多時可延伸 */}
      <div className={`flex-1 flex flex-col backdrop-blur-2xl border rounded-[2rem] shadow-xl transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
        
        {/* Header */}
        <div className={`shrink-0 p-4 border-b backdrop-blur-xl transition-colors duration-300 ${isDarkMode ? 'border-neutral-700 bg-neutral-900/95' : 'border-stone-200/50 bg-white/95'}`}>
          <div className="flex items-center justify-between">
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
        </div>

        {/* 列表區域：移除 overflow-y-auto，讓內容自然撐開卡片 */}
        <div className="flex-1 p-4 space-y-3">
          {records.filter(r => r.type === mode).length === 0 && (
             <div className={`flex flex-col items-center justify-center py-20 opacity-40 ${theme.textSec}`}>
                 <Wallet className="w-12 h-12 mb-2 stroke-1"/>
                 <p className="text-sm">尚無任何{mode === 'finance' ? '消費' : '記事'}紀錄</p>
             </div>
          )}
          {records.filter(r => r.type === mode).map((record) => (
            // Flex 容器
            <div key={record.id} className={`group flex gap-2 ${record.user.name === user.name ? 'flex-row-reverse' : 'flex-row'}`}>
               
               {/* 1. 頭像區域 */}
               <div className="flex-shrink-0 flex flex-col items-center gap-1">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 text-lg shadow-sm">{record.user.avatar}</div>
                   <span className={`text-[10px] opacity-60 leading-tight max-w-[4rem] truncate text-center ${theme.textSec}`}>
                     {record.user.name}
                   </span>
               </div>
               
               {/* 2. 內容卡片區域 */}
               <div className={`flex flex-col max-w-[80%] ${record.user.name === user.name ? 'items-end' : 'items-start'}`}>
                   
                   <div className={`relative overflow-hidden shadow-sm transition-all border
                        ${record.type === 'finance' 
                            ? (isDarkMode ? 'bg-neutral-800 border-neutral-700 rounded-xl w-60' : 'bg-white border-stone-200 rounded-xl w-60') 
                            : (isDarkMode ? 'bg-neutral-800 border-neutral-700 rounded-2xl p-3' : 'bg-white border-stone-200 rounded-2xl p-3')
                        }
                   `}>
                       {/* === 記帳模式 === */}
                       {record.type === 'finance' ? (
                           <div className="flex flex-col">
                               <div className="flex justify-between items-start p-3 gap-3">
                                   <div className="flex-1 min-w-0">
                                       <div className={`text-sm font-bold truncate leading-tight ${theme.text}`}>{record.content || "未製品項"}</div>
                                       <div className="flex items-center gap-1.5 mt-1.5">
                                           <span className={`text-[10px] ${theme.textSec}`}>{formatTime(record.timestamp)}</span>
                                           {record.synced ? (
                                               <Check className="w-3 h-3 text-green-500" />
                                           ) : (
                                               <RefreshCcw className="w-3 h-3 text-orange-400 animate-spin" />
                                           )}
                                       </div>
                                   </div>

                                   <div className="text-right flex-shrink-0">
                                       <div className={`text-base font-mono font-bold leading-tight ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>
                                            ¥{record.amount.toLocaleString()}
                                       </div>
                                       <div className={`text-[10px] mt-0.5 ${theme.textSec}`}>
                                            ≈ NT$ {record.twdAmount.toLocaleString()}
                                       </div>
                                   </div>
                               </div>

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
                           /* === 記事模式 === */
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

               {/* 3. 操作按鈕區域 */}
               {record.user.name === user.name && (
                   <div className="flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                             onClick={() => startEditing(record)} 
                             className={`p-2 rounded-full border transition-colors shadow-sm ${theme.cardBg} ${isDarkMode ? 'border-neutral-700 hover:text-sky-400 hover:border-sky-500' : 'border-stone-200 hover:text-sky-600 hover:border-sky-400'}`}
                             title="編輯"
                        >
                             <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                             onClick={() => handleDelete(record.id, record.type)} 
                             className={`p-2 rounded-full border transition-colors shadow-sm ${theme.cardBg} ${isDarkMode ? 'border-neutral-700 hover:text-red-400 hover:border-red-500' : 'border-stone-200 hover:text-red-600 hover:border-red-400'}`}
                             title="刪除"
                        >
                             <Trash2 className="w-4 h-4" />
                        </button>
                   </div>
               )}

            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer 輸入區 - 固定在卡片內容的最下方 */}
        <div className={`shrink-0 border-t backdrop-blur-md transition-colors duration-300 ${isDarkMode ? 'bg-neutral-900/90 border-neutral-700' : 'bg-white/90 border-stone-200/80'}`}>
          <div className="p-2">
            {/* 圖片預覽區 */}
            {noteImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 px-1 scrollbar-hide">
                    {noteImages.map((img, idx) => (
                        <div key={idx} className="relative flex-shrink-0 group animate-slideUp">
                            <img src={img} alt={`Preview ${idx}`} className="h-16 w-auto rounded-xl border shadow-md object-cover" />
                            <button 
                                onClick={() => removeNoteImage(idx)} 
                                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all active:scale-90"
                                title="移除圖片"
                            >
                                <X className="w-3 h-3"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 隱藏的檔案選擇器 */}
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" multiple />

            {/* 輸入控制區 */}
            <div className="flex items-end gap-2">
                {/* 相機按鈕 */}
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className={`p-2.5 rounded-xl border transition-all shadow-sm flex-shrink-0 active:scale-95 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                    title="上傳圖片"
                >
                    <Camera className="w-5 h-5" />
                </button>

                {/* 輸入框容器 */}
                <div className="flex-1 min-w-0">
                    {mode === 'finance' && (
                        <div className="mb-1">
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="金額 (JPY)"
                                className={`w-full border rounded-2xl px-3 py-2 text-base focus:outline-none focus:ring-2 transition-all shadow-inner resize-none leading-relaxed tracking-wide
                                    ${isDarkMode ? 'bg-neutral-900/50 border-neutral-600 text-neutral-200 focus:border-sky-500 focus:ring-sky-500/20 placeholder:text-neutral-500' : 'bg-white border-stone-200 text-stone-700 focus:border-[#5D737E] focus:ring-[#5D737E]/20 placeholder:text-stone-400'}`}
                            />
                        </div>
                    )}
                    <textarea
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleManualSubmit();
                                e.target.style.height = "auto";
                            }
                        }}
                        rows={1}
                        placeholder={mode === 'finance' ? "項目說明..." : "輸入記事內容..."}
                        className={`w-full border rounded-2xl px-3 py-3 text-base focus:outline-none focus:ring-2 transition-all shadow-inner placeholder:text-opacity-50 resize-none max-h-[120px] leading-relaxed tracking-wide
                            ${isDarkMode ? 'bg-neutral-900/50 border-neutral-600 text-neutral-200 focus:border-sky-500 focus:ring-sky-500/20 placeholder:text-neutral-500' : 'bg-white border-stone-200 text-stone-700 focus:border-[#5D737E] focus:ring-[#5D737E]/20 placeholder:text-stone-400'}`}
                    />
                </div>

                {/* 發送按鈕 */}
                <button 
                    onClick={() => {
                        handleManualSubmit();
                        const textarea = document.querySelector("textarea");
                        if (textarea) textarea.style.height = "auto";
                    }}
                    disabled={isUploading || isScanning || (mode === 'finance' && !amount)}
                    className={`p-3 rounded-xl transition-all shadow-md flex-shrink-0 mb-0.5 font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${isUploading || isScanning || (mode === 'finance' && !amount)
                            ? isDarkMode
                                ? 'bg-neutral-700 text-neutral-500 shadow-none'
                                : 'bg-stone-200 text-stone-400 shadow-none'
                            : isDarkMode
                                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white hover:shadow-lg'
                                : 'bg-gradient-to-r from-[#5D737E] to-[#3F5561] text-white hover:shadow-lg'
                        }`}
                >
                    {isUploading ? <Loader className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                </button>
            </div>
          </div>
        </div>

      </div>

      {/* --- 發票批次確認 Modal (保持不變) --- */}
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

                {/* Modal Footer */}
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

      {/* --- 編輯紀錄 Modal (保持不變) --- */}
      {editingRecord && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className={`w-full max-w-sm rounded-3xl shadow-2xl p-6 border ${isDarkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-white/40'}`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
                    <Edit3 className="w-5 h-5 text-sky-500"/>
                    編輯紀錄
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className={`text-xs font-bold mb-1 block ${theme.textSec}`}>內容 / 品項</label>
                        <input 
                            type="text" 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={`w-full p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-neutral-700 text-white' : 'border-stone-200 text-stone-800'}`}
                        />
                    </div>
                    {editingRecord.type === 'finance' && (
                        <div>
                            <label className={`text-xs font-bold mb-1 block ${theme.textSec}`}>金額 (JPY)</label>
                            <input 
                                type="number" 
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className={`w-full p-3 rounded-xl border bg-transparent outline-none font-mono focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-neutral-700 text-white' : 'border-stone-200 text-stone-800'}`}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={cancelEditing}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isDarkMode ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                    >
                        取消
                    </button>
                    <button 
                        onClick={saveEdit}
                        className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-sky-500 shadow-lg shadow-sky-500/30 hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4"/> 儲存
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default FinanceScreen;