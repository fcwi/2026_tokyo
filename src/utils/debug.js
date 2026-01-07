export const isDev = true; // 開發環境偵錯開關

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().split("T")[1].slice(0, -1); // HH:mm:ss.mss
};

export const debugLog = (message, data = null) => {
  if (isDev) {
    const timestamp = getTimestamp();
    const style = "background: #222; color: #bada55; font-weight: bold; border-radius: 4px; padding: 2px 4px;";
    
    if (data) {
      console.log(`%c[${timestamp}] ${message}`, style, data);
    } else {
      console.log(`%c[${timestamp}] ${message}`, style);
    }
  }
};

export const debugGroup = (label) => {
  if (isDev) console.group(label);
};

export const debugGroupEnd = () => {
  if (isDev) console.groupEnd();
};
