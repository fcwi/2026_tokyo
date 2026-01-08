import React, { useState, useEffect, memo } from "react";
import { ListTodo, RotateCcw, Plus, Check, Trash2 } from "lucide-react";

const ChecklistCard = memo(({ isDarkMode, theme, colors, initialData }) => {
  // 1. 內部狀態管理
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem("trip_checklist_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("讀取清單失敗", e);
    }
    return initialData;
  });

  const [newItemText, setNewItemText] = useState("");
  const [glowId, setGlowId] = useState(null);

  // 2. 自動保存邏輯
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      localStorage.setItem("trip_checklist_v1", JSON.stringify(checklist));
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [checklist]);

  // 3. 專屬操作函數 (從 App.jsx 搬過來)
  const toggleCheckItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newChecked = !item.checked;
          if (newChecked) {
            if (navigator.vibrate) navigator.vibrate(10);
            setGlowId(id);
            setTimeout(() => setGlowId(null), 800);
          }
          return { ...item, checked: newChecked };
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem = { id: Date.now(), text: newItemText.trim(), checked: false };
    setChecklist((prev) => [...prev, newItem]);
    setNewItemText("");
  };

  const handleDeleteItem = (id) => {
    if (window.confirm("確定要刪除此項目嗎？")) {
      setChecklist((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleResetChecklist = () => {
    if (window.confirm("確定要重置檢查清單嗎？\n這將還原為預設項目。")) {
      setChecklist(JSON.parse(JSON.stringify(initialData)));
    }
  };

  return (
    <div className={`rounded-2xl p-4 border transition-colors ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-sm font-bold flex items-center gap-2 ${theme.text}`}>
          <ListTodo className={`w-4 h-4 ${colors.pink}`} /> 出發前檢查清單
        </h3>
        <button onClick={handleResetChecklist} className={`p-1.5 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100 ${isDarkMode ? "text-neutral-400 hover:bg-neutral-700 hover:text-white" : "text-stone-400 hover:bg-stone-200 hover:text-stone-600"}`}>
          <RotateCcw className="w-3.5 h-3.5" /> 重置
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="新增檢查項目..."
          className={`flex-1 px-3 py-2 rounded-xl text-base border focus:outline-none focus:ring-2 transition-all ${isDarkMode ? "bg-neutral-900 border-neutral-600 focus:border-sky-500 focus:ring-sky-500/20" : "bg-white border-stone-200 focus:border-[#5D737E] focus:ring-[#5D737E]/20"}`}
          onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
        />
        <button onClick={handleAddItem} disabled={!newItemText.trim()} className={`p-2 rounded-xl border transition-all ${!newItemText.trim() ? "opacity-50 cursor-not-allowed" : "active:scale-95"} ${isDarkMode ? "bg-neutral-700 border-neutral-600 text-sky-300" : "bg-white border-stone-200 text-[#5D737E]"}`}>
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        {checklist.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all group/item ${item.checked ? (isDarkMode ? "bg-green-900/10" : "bg-green-50/50") : (isDarkMode ? "hover:bg-neutral-700/30" : "hover:bg-black/5")} ${glowId === item.id ? "animate-success-glow ring-2 ring-emerald-500/50" : ""}`}>
            <div onClick={() => toggleCheckItem(item.id)} className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all duration-300 flex-shrink-0 ${item.checked ? "bg-emerald-500 border-emerald-500 text-white scale-110" : `bg-transparent ${isDarkMode ? "border-neutral-500" : "border-stone-400"} group-hover/item:border-emerald-500`}`}>
                <Check className="w-3 h-3" />
              </div>
              <span className={`text-sm font-medium transition-colors leading-normal tracking-wide ${item.checked ? "text-emerald-600/70 line-through decoration-emerald-600/30" : theme.textSec}`}>
                {item.text}
              </span>
            </div>
            <button onClick={() => handleDeleteItem(item.id)} className={`p-1.5 rounded-xl transition-opacity ${isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-400 hover:bg-red-50"}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ChecklistCard;