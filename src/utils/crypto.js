// 使用 Web Crypto API 實作加密工具，取代外部依賴以提升安全性與效能
export const CryptoUtils = {
  buffToHex: (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  hexToBuff: (hex) =>
    new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    ),

  // 採用 PBKDF2 衍生金鑰並配合 AES-GCM 進行加密
  encrypt: async (text, password) => {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );
    const key = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(text),
    );
    return `${CryptoUtils.buffToHex(salt.buffer)}:${CryptoUtils.buffToHex(iv.buffer)}:${CryptoUtils.buffToHex(encrypted)}`;
  },

  decrypt: async (packedData, password) => {
    try {
      const [saltHex, ivHex, cipherHex] = packedData.split(":");
      if (!saltHex || !ivHex || !cipherHex) throw new Error("Format Error");
      const salt = CryptoUtils.hexToBuff(saltHex);
      const iv = CryptoUtils.hexToBuff(ivHex);
      const ciphertext = CryptoUtils.hexToBuff(cipherHex);
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"],
      );
      const key = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext,
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      throw new Error("密碼錯誤或資料損毀");
    }
  },
};
