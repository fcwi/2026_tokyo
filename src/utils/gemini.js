
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const callGeminiSafe = async (apiKey, payload, abortControllerRef) => {
  if (!apiKey) {
    throw new Error("Missing API Key");
  }

  const maxRetries = 3;
  let attempt = 0;
  // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  while (attempt < maxRetries) {
    try {
      // 中止上一個未完成的 Gemini API 請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        return await response.json();
      }

      // 處理流量限制 (429) 或服務暫時不可用 (503)
      if (response.status === 429 || response.status === 503) {
        console.warn(
          `API 忙碌中，嘗試進行指數退避... (嘗試 ${attempt + 1}/${maxRetries})`
        );
        attempt++;
        // 指數退避：2s, 4s, 8s...
        await sleep(2000 * Math.pow(2, attempt));
        continue;
      }

      if (response.status === 400) {
        throw new Error("API 參數錯誤。");
      }
      if (response.status === 403) {
        throw new Error("API Key 無效或過期，請檢查加密設定。");
      }

      throw new Error(`API Error: ${response.status}`);
    } catch (error) {
      // 中止請求通常是使用者切換頁面或手動停止，不視為錯誤
      if (error.name === "AbortError") {
        throw new Error("API 請求已被中止");
      }
      console.error("Fetch attempt error:", error);
      if (error.message.includes("API Key")) throw error;

      attempt++;
      if (attempt < maxRetries) {
        await sleep(2000 * Math.pow(2, attempt));
      } else {
        throw error;
      }
    }
  }
  throw new Error("API Max retries reached");
};
