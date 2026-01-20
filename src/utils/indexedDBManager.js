/**
 * IndexedDB Manager - 用於管理 AI 聊天記錄和財務記錄
 * 支持存儲文字、圖片和其他大型數據
 * 
 * 包含的數據庫：
 * 1. aiChatDB - 存儲 AI 導遊/口譯的聊天記錄
 * 2. financeDB - 存儲記帳/記事的內容和圖片
 */

const DB_CONFIG = {
  aiChat: {
    name: "aiChatDB",
    version: 1,
    stores: {
      messages: { keyPath: "id", indexes: ["mode", "timestamp"] },
      images: { keyPath: "id", indexes: ["messageId"] },
    },
  },
  finance: {
    name: "financeDB",
    version: 1,
    stores: {
      records: { keyPath: "id", indexes: ["type", "date", "timestamp"] },
      images: { keyPath: "id", indexes: ["recordId"] },
      user: { keyPath: "id" },
      notes: { keyPath: "id", indexes: ["timestamp"] },
      noteImages: { keyPath: "id", indexes: ["noteId"] },
    },
  },
};

/**
 * AI Chat IndexedDB 管理器
 */
export const aiChatDB = {
  dbInstance: null,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.aiChat.name, DB_CONFIG.aiChat.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.dbInstance = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 創建 messages store
        if (!db.objectStoreNames.contains("messages")) {
          const store = db.createObjectStore("messages", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("mode", "mode", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }

        // 創建 images store 用於存儲 AI 聊天圖片
        if (!db.objectStoreNames.contains("images")) {
          const imageStore = db.createObjectStore("images", {
            keyPath: "id",
          });
          imageStore.createIndex("messageId", "messageId", { unique: false });
        }
      };
    });
  },

  async saveMessages(mode, messages) {
    const db = this.dbInstance || (await this.init());

    // 第一步：先刪除該模式的所有舊訊息
    await new Promise((resolve, reject) => {
      const deleteTx = db.transaction("messages", "readwrite");
      const deleteStore = deleteTx.objectStore("messages");
      const modeIndex = deleteStore.index("mode");
      const range = IDBKeyRange.only(mode);
      const deleteRequest = modeIndex.openCursor(range);

      deleteRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteTx.oncomplete = () => resolve();
      deleteTx.onerror = () => reject(deleteTx.error);
    });

    // 第二步：在刪除完成後，插入新訊息
    if (messages.length === 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      const insertTx = db.transaction("messages", "readwrite");
      const insertStore = insertTx.objectStore("messages");

      messages.forEach((msg, index) => {
        const record = {
          ...msg,
          mode,
          timestamp: msg.timestamp || Date.now(),
          order: index,
        };
        // 使用 put 而非 add，允許覆蓋現有記錄
        const insertRequest = insertStore.put(record);
        insertRequest.onerror = () => reject(insertRequest.error);
      });

      insertTx.oncomplete = () => resolve();
      insertTx.onerror = () => reject(insertTx.error);
    });
  },

  async loadMessages(mode) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("messages", "readonly");
    const store = tx.objectStore("messages");
    const index = store.index("mode");
    const range = IDBKeyRange.only(mode);

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);
      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => a.order - b.order);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteMessages(mode) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    const index = store.index("mode");
    const range = IDBKeyRange.only(mode);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          tx.oncomplete = () => resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  async clearAll() {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 圖片操作方法
  async saveImage(messageId, imageData, filename = "", imageId = null) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");

    // 如果已有 imageId 就使用它，否則生成新的
    const finalImageId = imageId || `img_${messageId}_${Date.now()}`;

    const imageRecord = {
      id: finalImageId,
      messageId,
      data: imageData,
      filename,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      // 使用 put 而非 add，允許覆蓋現有記錄
      const request = store.put(imageRecord);
      request.onsuccess = () => resolve(finalImageId);
      request.onerror = () => reject(request.error);
    });
  },

  async getImagesByMessageId(messageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");
    const index = store.index("messageId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(messageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getImage(imageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");

    return new Promise((resolve, reject) => {
      const request = store.get(imageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteImage(imageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");

    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteImagesByMessageId(messageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    const index = store.index("messageId");
    const range = IDBKeyRange.only(messageId);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};

/**
 * Finance IndexedDB 管理器
 */
export const financeDB = {
  dbInstance: null,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.finance.name, DB_CONFIG.finance.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.dbInstance = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 創建 records store
        if (!db.objectStoreNames.contains("records")) {
          const recordStore = db.createObjectStore("records", {
            keyPath: "id",
          });
          recordStore.createIndex("type", "type", { unique: false });
          recordStore.createIndex("date", "date", { unique: false });
          recordStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // 創建 images store
        if (!db.objectStoreNames.contains("images")) {
          const imageStore = db.createObjectStore("images", {
            keyPath: "id",
          });
          imageStore.createIndex("recordId", "recordId", { unique: false });
        }

        // 創建 user store
        if (!db.objectStoreNames.contains("user")) {
          db.createObjectStore("user", { keyPath: "id" });
        }

        // 創建 notes store（記事內容）
        if (!db.objectStoreNames.contains("notes")) {
          const noteStore = db.createObjectStore("notes", {
            keyPath: "id",
          });
          noteStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // 創建 noteImages store（記事圖片）
        if (!db.objectStoreNames.contains("noteImages")) {
          const noteImageStore = db.createObjectStore("noteImages", {
            keyPath: "id",
          });
          noteImageStore.createIndex("noteId", "noteId", { unique: false });
        }
      };
    });
  },

  // 記錄操作
  async saveRecords(records) {
    const db = this.dbInstance || (await this.init());

    // 第一步：先清除所有舊記錄
    await new Promise((resolve, reject) => {
      const clearTx = db.transaction("records", "readwrite");
      const clearStore = clearTx.objectStore("records");
      const clearRequest = clearStore.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // 第二步：保存新記錄
    if (records.length === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction("records", "readwrite");
      const store = tx.objectStore("records");
      let completed = 0;
      const total = records.length;

      records.forEach((record) => {
        // 圖片處理邏輯已在調用端處理 (FinanceNote.jsx 會只保留 URL)，這裡直接儲存
        const request = store.put(record);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            tx.oncomplete = () => resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    });
  },

  async loadAllRecords() {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("records", "readonly");
    const store = tx.objectStore("records");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getRecordsByType(type) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("records", "readonly");
    const store = tx.objectStore("records");
    const index = store.index("type");

    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteRecord(recordId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction(["records", "images"], "readwrite");

    return new Promise((resolve, reject) => {
      // 刪除記錄
      const recordStore = tx.objectStore("records");
      const recordRequest = recordStore.delete(recordId);

      // 刪除相關的圖片
      const imageStore = tx.objectStore("images");
      const imageIndex = imageStore.index("recordId");
      const imageRange = IDBKeyRange.only(recordId);
      const imageRequest = imageIndex.openCursor(imageRange);

      imageRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      recordRequest.onerror = () => reject(recordRequest.error);
      tx.oncomplete = () => resolve();
    });
  },

  // 圖片操作
  async saveImage(recordId, imageData, filename = "") {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    const strRecordId = String(recordId); // 強制轉為字串

    const imageRecord = {
      id: `${strRecordId}_${Date.now()}`,
      recordId: strRecordId,
      data: imageData,
      filename,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      // 使用 put 而非 add，允許覆蓋現有記錄
      const request = store.put(imageRecord);
      request.onsuccess = () => resolve(imageRecord.id);
      request.onerror = () => reject(request.error);
    });
  },

  async getImagesByRecordId(recordId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");
    const index = store.index("recordId");
    const strRecordId = String(recordId); // 強制轉為字串

    return new Promise((resolve, reject) => {
      const request = index.getAll(strRecordId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getImage(imageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");

    return new Promise((resolve, reject) => {
      const request = store.get(imageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteImage(imageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");

    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 🆕 清理孤立的圖片（沒有對應記錄的圖片）
  async cleanOrphanedImages(validRecordIds) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    // 確保所有 validRecordIds 都是字串
    const validIdsSet = new Set(validRecordIds.map(id => String(id)));

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const image = cursor.value;
          // 如果圖片對應的記錄不存在，刪除該圖片
          // 比較時也將 image.recordId 轉為字串
          if (!validIdsSet.has(String(image.recordId))) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`🧹 清理了 ${deletedCount} 張孤立圖片`);
        }
      };

      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve(deletedCount);
    });
  },

  // 使用者資料操作
  async saveUser(userData) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("user", "readwrite");
    const store = tx.objectStore("user");

    const userRecord = { id: "current", ...userData };

    return new Promise((resolve, reject) => {
      const request = store.put(userRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async loadUser() {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("user", "readonly");
    const store = tx.objectStore("user");

    return new Promise((resolve, reject) => {
      const request = store.get("current");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteUser() {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("user", "readwrite");
    const store = tx.objectStore("user");

    return new Promise((resolve, reject) => {
      const request = store.delete("current");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 批量操作
  async batchGetImages(recordIds) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");

    const imageMap = {};

    return new Promise((resolve, reject) => {
      recordIds.forEach((recordId) => {
        const index = store.index("recordId");
        const request = index.getAll(recordId);

        request.onsuccess = () => {
          imageMap[recordId] = request.result;
        };

        request.onerror = () => reject(request.error);
      });

      tx.oncomplete = () => resolve(imageMap);
    });
  },

  // 記事操作
  async saveNote(noteData) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("notes", "readwrite");
    const store = tx.objectStore("notes");

    const noteRecord = {
      ...noteData,
      id: noteData.id || `note_${Date.now()}`,
      timestamp: noteData.timestamp || Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(noteRecord);
      request.onsuccess = () => resolve(noteRecord.id);
      request.onerror = () => reject(request.error);
    });
  },

  async loadAllNotes() {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("notes", "readonly");
    const store = tx.objectStore("notes");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const notes = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(notes);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getNote(noteId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("notes", "readonly");
    const store = tx.objectStore("notes");

    return new Promise((resolve, reject) => {
      const request = store.get(noteId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteNote(noteId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction(["notes", "noteImages"], "readwrite");

    return new Promise((resolve, reject) => {
      // 刪除記事
      const noteStore = tx.objectStore("notes");
      const noteRequest = noteStore.delete(noteId);

      // 刪除相關的圖片
      const imageStore = tx.objectStore("noteImages");
      const imageIndex = imageStore.index("noteId");
      const imageRange = IDBKeyRange.only(noteId);
      const imageRequest = imageIndex.openCursor(imageRange);

      imageRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      noteRequest.onerror = () => reject(noteRequest.error);
      tx.oncomplete = () => resolve();
    });
  },

  // 記事圖片操作
  async saveNoteImage(noteId, imageData, filename = "") {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("noteImages", "readwrite");
    const store = tx.objectStore("noteImages");

    const imageRecord = {
      id: `${noteId}_${Date.now()}`,
      noteId,
      data: imageData,
      filename,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      // 使用 put 而非 add，允許覆蓋現有記錄
      const request = store.put(imageRecord);
      request.onsuccess = () => resolve(imageRecord.id);
      request.onerror = () => reject(request.error);
    });
  },

  async getNoteImagesByNoteId(noteId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("noteImages", "readonly");
    const store = tx.objectStore("noteImages");
    const index = store.index("noteId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(noteId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getNoteImage(imageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("noteImages", "readonly");
    const store = tx.objectStore("noteImages");

    return new Promise((resolve, reject) => {
      const request = store.get(imageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteNoteImage(imageId) {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction("noteImages", "readwrite");
    const store = tx.objectStore("noteImages");

    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearAll() {
    const db = this.dbInstance || (await this.init());
    const tx = db.transaction(["records", "images", "user", "notes", "noteImages"], "readwrite");

    return new Promise((resolve, reject) => {
      tx.objectStore("records").clear();
      tx.objectStore("images").clear();
      tx.objectStore("user").clear();
      tx.objectStore("notes").clear();
      tx.objectStore("noteImages").clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

/**
 * 遷移工具 - 從 localStorage 遷移到 IndexedDB
 */
export const migrationTools = {
  /**
   * 遷移 AI 聊天記錄
   */
  async migrateAiChat() {
    const modes = ["translate", "guide"];
    const results = { success: [], failed: [] };

    for (const mode of modes) {
      try {
        const key = `trip_chat_history_${mode}`;
        const data = localStorage.getItem(key);
        if (data) {
          const messages = JSON.parse(data);
          await aiChatDB.saveMessages(mode, messages);
          results.success.push(mode);
          // 遷移完成後可選擇刪除 localStorage
          // localStorage.removeItem(key);
        }
      } catch (e) {
        console.error(`Failed to migrate AI chat for mode ${mode}:`, e);
        results.failed.push(mode);
      }
    }

    return results;
  },

  /**
   * 遷移財務記錄
   */
  async migrateFinance() {
    try {
      const recordsData = localStorage.getItem("finance_records");
      const userData = localStorage.getItem("finance_user");

      const results = { recordsMigrated: 0, userMigrated: false, failed: false };

      if (recordsData) {
        const records = JSON.parse(recordsData);
        await financeDB.saveRecords(records);
        results.recordsMigrated = records.length;
        // localStorage.removeItem("finance_records");
      }

      if (userData) {
        const user = JSON.parse(userData);
        await financeDB.saveUser(user);
        results.userMigrated = true;
        // localStorage.removeItem("finance_user");
      }

      return results;
    } catch (e) {
      console.error("Failed to migrate finance data:", e);
      return { failed: true, error: e.message };
    }
  },

  /**
   * 檢查遷移狀態
   */
  async checkMigrationStatus() {
    try {
      const aiMessages = await aiChatDB.loadMessages("translate");
      const financeRecords = await financeDB.loadAllRecords();

      return {
        aiChatMessages: aiMessages.length,
        financeRecords: financeRecords.length,
        ready: true,
      };
    } catch (e) {
      console.error("Failed to check migration status:", e);
      return { ready: false, error: e.message };
    }
  },
};
