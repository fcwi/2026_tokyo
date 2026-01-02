import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./CalculatorModal.css";

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
  const themeClass = isDarkMode ? "theme-dark" : "theme-light";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className={`calc-modal ${themeClass}`}
        role="dialog"
        aria-modal="true"
        aria-label="計算機"
      >
        {/* Header */}
        <div className="calc-header">
          <div className="calc-header-title">
            <p className="calc-title-label">Calculator</p>
            <p className="calc-title-main">當前貨幣：{currentUnit}</p>
          </div>
          <button
            onClick={onClose}
            className="calc-close-btn"
            aria-label="關閉計算機"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="calc-content">
          {/* Rate Info */}
          <div className="calc-rate-info">
            <span className="calc-rate-label">1 {base} ~ {formattedRate} {target}</span>
            <button
              onClick={handleFxConvert}
              className="calc-convert-btn"
            >
              轉{fxLabel}
            </button>
          </div>

          {/* Hint */}
          {fxHint && (
            <div className="calc-hint">{fxHint}</div>
          )}

          {/* Display */}
          <div
            className="calc-display"
            aria-live="polite"
          >
            {displayValue}
          </div>

          {/* Keypad */}
          <div className="calc-keypad">
            <button className="calc-btn calc-btn-muted" onClick={clearAll}>AC</button>
            <button className="calc-btn calc-btn-muted" onClick={toggleSign}>+/-</button>
            <button className="calc-btn calc-btn-muted" onClick={handleFxConvert}>
              轉{fxLabel}
            </button>
            <button className="calc-btn calc-btn-operator" onClick={() => handleOperator("/")}>
              /
            </button>

            <button className="calc-btn" onClick={() => inputDigit("7")}>7</button>
            <button className="calc-btn" onClick={() => inputDigit("8")}>8</button>
            <button className="calc-btn" onClick={() => inputDigit("9")}>9</button>
            <button className="calc-btn calc-btn-operator" onClick={() => handleOperator("*")}>
              *
            </button>

            <button className="calc-btn" onClick={() => inputDigit("4")}>4</button>
            <button className="calc-btn" onClick={() => inputDigit("5")}>5</button>
            <button className="calc-btn" onClick={() => inputDigit("6")}>6</button>
            <button className="calc-btn calc-btn-operator" onClick={() => handleOperator("-")}>
              -
            </button>

            <button className="calc-btn" onClick={() => inputDigit("1")}>1</button>
            <button className="calc-btn" onClick={() => inputDigit("2")}>2</button>
            <button className="calc-btn" onClick={() => inputDigit("3")}>3</button>
            <button className="calc-btn calc-btn-operator" onClick={() => handleOperator("+")}>
              +
            </button>

            <button className="calc-btn calc-btn-wide" onClick={() => inputDigit("0")}>
              0
            </button>
            <button className="calc-btn" onClick={inputDot}>.</button>
            <button className="calc-btn calc-btn-accent" onClick={handleEqual}>=</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
