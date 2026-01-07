/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // 動態色系：基底色 (cBase)
    {
      pattern:
        /(bg|text|border|shadow)-(stone|neutral|slate|gray)-(50|200|300|400|500|600|700|800|900)(\/\d+)?/,
    },
    // 動態色系：強調色 (cAccent)
    {
      pattern:
        /(bg|text|border|ring|shadow)-(sky|amber|blue|emerald|red|orange|rose)-(50|100|200|300|400|500|600|700|800|900)(\/\d+)?/,
    },
    // 漸層起迄色 (AI 按鈕)
    { pattern: /(from|to)-(stone|sky|amber)-(300|400|500|600)/ },
    // 其他 blob 用色
    { pattern: /bg-(blue|purple|emerald)-(300|400|500)(\/\d+)?/ },
  ],
  theme: {
    extend: {
      // 🆕 毛玻璃效果優化配置
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        slideUp: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        scaleIn: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
    },
  },
  plugins: [],
};
