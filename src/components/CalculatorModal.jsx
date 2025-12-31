import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const CalculatorModal = ({
  isOpen,
  onClose,
  isDarkMode,
  rateData,
  currencyCode,
  currencyTarget,
}) => {
  const base = (currencyCode || "").toUpperCase();
  const target = (currencyTarget || "").toUpperCase();
  const [displayValue, setDisplayValue] = useState("0");
  const [storedValue, setStoredValue] = useState(null);
  const [pendingOperator, setPendingOperator] = useState(null);
  const [isNewEntry, setIsNewEntry] = useState(true);
  const [fxDirection, setFxDirection] = useState("baseToTarget");
  const [fxHint, setFxHint] = useState("");
  const [currentUnit, setCurrentUnit] = useState(base);

  const rateReady = rateData && !rateData.loading && !rateData.error && rateData.current;

  // Reset when modal opens
  useEffect(() => {
    if (!isOpen) return;
    // Schedule state updates in a microtask to avoid cascading renders
    Promise.resolve().then(() => {
      setDisplayValue("0");
      setStoredValue(null);
      setPendingOperator(null);
      setIsNewEntry(true);
      setFxDirection("baseToTarget");
      setFxHint("");
      setCurrentUnit(base);
    });
  }, [isOpen, base]);

  const formattedRate = rateReady ? rateData.current.toFixed(3) : "--";

  if (!isOpen) return null;

  const clampLength = (val) => {
    const str = val.toString();
    if (str.length <= 14) return str;
    if (!Number.isFinite(val)) return "Error";
    return parseFloat(val.toFixed(8)).toString();
  };

  const parseDisplay = () => parseFloat(displayValue.replace(/,/g, "")) || 0;

  const inputDigit = (digit) => {
    setFxHint("");
    setDisplayValue((prev) => {
      if (isNewEntry || prev === "0") {
        setIsNewEntry(false);
        return digit;
      }
      return clampLength(`${prev}${digit}`);
    });
  };

  const inputDot = () => {
    setFxHint("");
    setDisplayValue((prev) => {
      if (isNewEntry) {
        setIsNewEntry(false);
        return "0.";
      }
      if (prev.includes(".")) return prev;
      return `${prev}.`;
    });
  };

  const clearAll = () => {
    setDisplayValue("0");
    setStoredValue(null);
    setPendingOperator(null);
    setIsNewEntry(true);
    setFxHint("");
    setCurrentUnit(base);
  };

  const toggleSign = () => {
    const value = parseDisplay();
    setDisplayValue(clampLength(value * -1));
  };

  const performCalc = (prev, next, op) => {
    switch (op) {
      case "+":
        return prev + next;
      case "-":
        return prev - next;
      case "*":
        return prev * next;
      case "/":
        return next === 0 ? NaN : prev / next;
      default:
        return next;
    }
  };

  const handleOperator = (op) => {
    const current = parseDisplay();
    if (storedValue === null) {
      setStoredValue(current);
    } else if (!isNewEntry && pendingOperator) {
      const result = performCalc(storedValue, current, pendingOperator);
      setStoredValue(result);
      setDisplayValue(clampLength(result));
    }
    setPendingOperator(op);
    setIsNewEntry(true);
    setFxHint("");
  };

  const handleEqual = () => {
    if (pendingOperator === null || storedValue === null) return;
    const current = parseDisplay();
    const result = performCalc(storedValue, current, pendingOperator);
    setDisplayValue(clampLength(result));
    setStoredValue(null);
    setPendingOperator(null);
    setIsNewEntry(true);
    setFxHint("");
  };

  const handleFxConvert = () => {
    if (!rateReady) {
      setFxHint(rateData?.error ? "匯率連線失敗，稍後再試" : "匯率更新中" );
      return;
    }
    const current = parseDisplay();
    const rate = rateData.current;
    let result = current;
    if (fxDirection === "baseToTarget") {
      result = current * rate;
      setFxDirection("targetToBase");
      setFxHint(`使用 1 ${base} = ${formattedRate} ${target}`);
      setCurrentUnit(target);
    } else {
      result = rate === 0 ? NaN : current / rate;
      setFxDirection("baseToTarget");
      setFxHint(`使用 1 ${target} ~ ${(1 / rate).toFixed(4)} ${base}`);
      setCurrentUnit(base);
    }
    setDisplayValue(clampLength(result));
    setStoredValue(null);
    setPendingOperator(null);
    setIsNewEntry(true);
  };

  const fxLabel = fxDirection === "baseToTarget" ? target : base;

  const baseCard = isDarkMode
    ? "bg-neutral-900/80 border-neutral-700 text-white"
    : "bg-white/90 border-stone-200 text-stone-800";
  const keypadBtn = (variant = "default") => {
    const common = "rounded-xl py-3 text-lg font-semibold transition active:scale-95 shadow-sm border";
    if (variant === "accent") {
      return `${common} ${isDarkMode ? "bg-amber-400 text-black border-amber-300" : "bg-amber-300 text-black border-amber-200"}`;
    }
    if (variant === "operator") {
      return `${common} ${isDarkMode ? "bg-neutral-800 text-amber-100 border-neutral-700" : "bg-stone-100 text-amber-600 border-stone-200"}`;
    }
    if (variant === "muted") {
      return `${common} ${isDarkMode ? "bg-neutral-800 text-neutral-200 border-neutral-700" : "bg-stone-100 text-stone-700 border-stone-200"}`;
    }
    return `${common} ${isDarkMode ? "bg-neutral-700 text-white border-neutral-600" : "bg-white text-stone-900 border-stone-200"}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full max-w-sm rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden ${baseCard}`}
        role="dialog"
        aria-modal="true"
        aria-label="計算機"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-[0.28em] opacity-60">Calculator</p>
            <p className="text-sm font-semibold opacity-80">當前貨幣：{currentUnit}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full border transition hover:scale-95 ${isDarkMode ? "border-neutral-700 hover:bg-neutral-800" : "border-stone-200 hover:bg-stone-100"}`}
            aria-label="關閉計算機"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="opacity-70">1 {base} ~ {formattedRate} {target}</span>
            <button
              onClick={handleFxConvert}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition ${isDarkMode ? "bg-amber-400 text-black border-amber-300" : "bg-amber-300 text-black border-amber-200"}`}
            >
              當前貨幣：{currentUnit}
            </button>
          </div>

          {fxHint && (
            <div className="text-[11px] font-medium opacity-80">{fxHint}</div>
          )}

          <div
            className={`text-right text-4xl font-mono px-3 py-4 rounded-2xl border ${isDarkMode ? "bg-neutral-800/80 border-neutral-700" : "bg-stone-50 border-stone-200"}`}
            aria-live="polite"
          >
            {displayValue}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button className={keypadBtn("muted")} onClick={clearAll}>AC</button>
            <button className={keypadBtn("muted")} onClick={toggleSign}>+/-</button>
            <button className={keypadBtn("muted")} onClick={handleFxConvert}>
              轉{fxLabel}
            </button>
            <button className={keypadBtn("operator")} onClick={() => handleOperator("/")}>
              /
            </button>

            <button className={keypadBtn()} onClick={() => inputDigit("7")}>7</button>
            <button className={keypadBtn()} onClick={() => inputDigit("8")}>8</button>
            <button className={keypadBtn()} onClick={() => inputDigit("9")}>9</button>
            <button className={keypadBtn("operator")} onClick={() => handleOperator("*")}>
              *
            </button>

            <button className={keypadBtn()} onClick={() => inputDigit("4")}>4</button>
            <button className={keypadBtn()} onClick={() => inputDigit("5")}>5</button>
            <button className={keypadBtn()} onClick={() => inputDigit("6")}>6</button>
            <button className={keypadBtn("operator")} onClick={() => handleOperator("-")}>
              -
            </button>

            <button className={keypadBtn()} onClick={() => inputDigit("1")}>1</button>
            <button className={keypadBtn()} onClick={() => inputDigit("2")}>2</button>
            <button className={keypadBtn()} onClick={() => inputDigit("3")}>3</button>
            <button className={keypadBtn("operator")} onClick={() => handleOperator("+")}>
              +
            </button>

            <button className={`${keypadBtn()} col-span-2`} onClick={() => inputDigit("0")}>
              0
            </button>
            <button className={keypadBtn()} onClick={inputDot}>.</button>
            <button className={keypadBtn("accent")} onClick={handleEqual}>=</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
