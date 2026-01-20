
import heic2any from "heic2any";

/**
 * 檢查並處理檔案，如果是 HEIC 格式則轉換為 JPEG Blob
 * @param {File} file - 原始檔案物件
 * @returns {Promise<File|Blob>} - 如果是 HEIC 則回傳轉換後的 Blob (附帶 name 屬性)，否則回傳原檔案
 */
export const processFileForHeic = async (file) => {
    if (!file) return file;

    const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic");

    if (isHeic) {
        console.log(`HEIC format detected: ${file.name}, converting...`);
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.8,
            });

            // heic2any 可能回傳 Blob 或 Blob[]，這裡只取單一圖片
            const blob = Array.isArray(convertedBlob)
                ? convertedBlob[0]
                : convertedBlob;

            // 替 Blob 加上 name 屬性，模擬 File 物件行為，方便後續讀取檔名
            blob.name = file.name.replace(/\.heic$/i, ".jpg");

            console.log(`HEIC converted successfully: ${blob.name}`);
            return blob;
        } catch (error) {
            console.error("HEIC conversion failed:", error);
            // 轉換失敗則回傳原檔，讓後端或其他邏輯嘗試處理
            return file;
        }
    }

    return file;
};
