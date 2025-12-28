/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // 動態色系：基底色 (cBase)
    { pattern: /(bg|text|border|shadow)-(stone|neutral|slate|gray)-(50|200|300|400|500|600|700|800|900)(\/\d+)?/ },
    // 動態色系：強調色 (cAccent)
    { pattern: /(bg|text|border|ring|shadow)-(sky|amber|blue|emerald|red|orange|rose)-(50|100|200|300|400|500|600|700|800|900)(\/\d+)?/ },
    // 漸層起迄色 (AI 按鈕)
    { pattern: /(from|to)-(stone|sky|amber)-(300|400|500|600)/ },
    // 其他 blob 用色
    { pattern: /bg-(blue|purple|emerald)-(300|400|500)(\/\d+)?/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
