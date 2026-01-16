/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // === 基於 colorBase="stone" 的動態類別 ===
    // 背景色
    'bg-stone-50', 'bg-stone-100', 'bg-stone-200', 'bg-stone-300',
    'bg-stone-400', 'bg-stone-500', 'bg-stone-600', 'bg-stone-700', 
    'bg-stone-800', 'bg-stone-900',
    // 背景色帶透明度
    'bg-stone-700/30', 'bg-stone-800/50', 'bg-stone-800/60', 'bg-stone-900/60',
    
    // 文字色
    'text-stone-100', 'text-stone-200', 'text-stone-300', 'text-stone-400',
    'text-stone-500', 'text-stone-600', 'text-stone-700', 'text-stone-800',
    
    // 邊框色
    'border-stone-200', 'border-stone-200/40', 'border-stone-600', 
    'border-stone-600/20', 'border-stone-600/30',
    
    // === 基於 colorAccent="amber" 的動態類別 ===
    // 文字色
    'text-amber-300', 'text-amber-400', 'text-amber-500', 'text-amber-600',
    
    // 背景色
    'bg-amber-100', 'bg-amber-500/20',
    
    // Ring 色
    'ring-amber-500/20',
    
    // 漸層色（AI 按鈕等）
    'from-amber-300', 'from-amber-400', 'from-amber-500', 'from-amber-600',
    'to-amber-300', 'to-amber-400', 'to-amber-500', 'to-amber-600',
    
    // === 其他主題可能使用的顏色 (neutral, sky, blue) ===
    'bg-neutral-800', 'bg-neutral-900', 'text-neutral-300', 'text-neutral-400',
    'text-sky-300', 'text-sky-400', 'text-sky-500', 'text-sky-600',
    'bg-sky-500/20', 'ring-sky-500/20',
    
    // === Blob 背景動畫顏色 ===
    'bg-blue-300/30', 'bg-blue-400/30', 'bg-blue-500/30',
    'bg-purple-300/10', 'bg-purple-400/10', 'bg-purple-500/10',
    'bg-emerald-300/30', 'bg-emerald-400/30', 'bg-emerald-500/30',
    'bg-orange-200/30',
  ],
  theme: {
    extend: {
      // 🆕 毛玻璃效果優化配置
      animation: {
        // 改進 fadeIn 動畫，使用更平滑的 ease-out 曲線
        fadeIn: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
