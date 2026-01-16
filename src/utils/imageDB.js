// src/utils/imageDB.js
// IndexedDB 圖片縮圖儲存模組

const DB_NAME = 'TokyoTripDB';
const STORE_NAME = 'imageThumbnails';
const DB_VERSION = 1;

/**
 * 初始化 IndexedDB
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB 初始化失敗:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 創建 object store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('✅ IndexedDB object store 創建成功');
      }
    };
  });
};

/**
 * 儲存圖片縮圖
 * @param {string|number} id - 記錄 ID
 * @param {string} imageData - Base64 圖片資料
 */
export const saveImage = async (id, imageData) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        id: String(id),
        imageData,
        timestamp: Date.now()
      };
      
      const request = store.put(data);
      
      request.onsuccess = () => {
        console.log(`✅ 圖片已儲存至 IndexedDB: ${id}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('儲存圖片失敗:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('saveImage 錯誤:', error);
    throw error;
  }
};

/**
 * 讀取單張圖片
 * @param {string|number} id - 記錄 ID
 * @returns {Promise<string|null>} Base64 圖片資料
 */
export const getImage = async (id) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(String(id));
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.imageData || null);
      };
      
      request.onerror = () => {
        console.error('讀取圖片失敗:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('getImage 錯誤:', error);
    return null;
  }
};

/**
 * 批次讀取多張圖片
 * @param {Array<string|number>} ids - 記錄 ID 陣列
 * @returns {Promise<Object>} { id: imageData, ... }
 */
export const batchGetImages = async (ids) => {
  try {
    const db = await initDB();
    const results = {};
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      let completed = 0;
      const total = ids.length;
      
      if (total === 0) {
        resolve(results);
        return;
      }
      
      ids.forEach(id => {
        const request = store.get(String(id));
        
        request.onsuccess = () => {
          const result = request.result;
          if (result?.imageData) {
            results[id] = result.imageData;
          }
          
          completed++;
          if (completed === total) {
            console.log(`✅ 批次載入 ${Object.keys(results).length}/${total} 張圖片`);
            resolve(results);
          }
        };
        
        request.onerror = () => {
          completed++;
          if (completed === total) {
            resolve(results);
          }
        };
      });
    });
  } catch (error) {
    console.error('batchGetImages 錯誤:', error);
    return {};
  }
};

/**
 * 刪除圖片
 * @param {string|number} id - 記錄 ID
 */
export const deleteImage = async (id) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(String(id));
      
      request.onsuccess = () => {
        console.log(`✅ 圖片已從 IndexedDB 刪除: ${id}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('刪除圖片失敗:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('deleteImage 錯誤:', error);
  }
};

/**
 * 清空所有圖片（僅供開發/測試使用）
 */
export const clearAllImages = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('✅ 所有圖片已清空');
        resolve();
      };
      
      request.onerror = () => {
        console.error('清空失敗:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('clearAllImages 錯誤:', error);
  }
};

/**
 * 取得資料庫使用統計
 */
export const getStats = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();
      
      request.onsuccess = () => {
        resolve({
          totalImages: request.result,
          dbName: DB_NAME,
          storeName: STORE_NAME
        });
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('getStats 錯誤:', error);
    return { totalImages: 0 };
  }
};
