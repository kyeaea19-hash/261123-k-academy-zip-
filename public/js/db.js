// IndexedDB 저수준 직접 제어 모듈
const DB_NAME = 'academy-summary-zip';
const DB_VERSION = 1;

let dbInstance = null;

// DB 열기 및 스키마 초기화
export function openDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('INDEXED_DB_NOT_SUPPORTED'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // 1. meta: keyPath 'key'
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      // 2. days: keyPath 'date', index 'byField' (multiEntry)
      if (!db.objectStoreNames.contains('days')) {
        const daysStore = db.createObjectStore('days', { keyPath: 'date' });
        daysStore.createIndex('byField', 'fieldIds', { multiEntry: true });
      }

      // 3. fields: keyPath 'id'
      if (!db.objectStoreNames.contains('fields')) {
        db.createObjectStore('fields', { keyPath: 'id' });
      }

      // 4. teamLogs: keyPath 'id', index 'byField', 'byDate'
      if (!db.objectStoreNames.contains('teamLogs')) {
        const teamLogsStore = db.createObjectStore('teamLogs', { keyPath: 'id' });
        teamLogsStore.createIndex('byField', 'fieldId', { unique: false });
        teamLogsStore.createIndex('byDate', 'date', { unique: false });
      }

      // 5. attachments: keyPath 'id', index 'byTeamLog', 'byField'
      if (!db.objectStoreNames.contains('attachments')) {
        const attStore = db.createObjectStore('attachments', { keyPath: 'id' });
        attStore.createIndex('byTeamLog', 'teamLogId', { unique: false });
        attStore.createIndex('byField', 'fieldId', { unique: false });
      }

      // 6. files: keyPath 'id'
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

// 트랜잭션 래퍼
export async function tx(storeNames, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeNames, mode);
    const stores = Array.isArray(storeNames)
      ? storeNames.map(name => t.objectStore(name))
      : t.objectStore(storeNames);

    let result;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);

    try {
      result = fn(stores, t);
    } catch (err) {
      t.abort();
      reject(err);
    }
  });
}

// 기본 CRUD 헬퍼
export async function get(storeName, key) {
  return tx(storeName, 'readonly', store => {
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getAll(storeName) {
  return tx(storeName, 'readonly', store => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getAllByIndex(storeName, indexName, value) {
  return tx(storeName, 'readonly', store => {
    return new Promise((resolve, reject) => {
      const idx = store.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function put(storeName, value) {
  return tx(storeName, 'readwrite', store => {
    store.put(value);
  });
}

export async function del(storeName, key) {
  return tx(storeName, 'readwrite', store => {
    store.delete(key);
  });
}

export async function clear(storeName) {
  return tx(storeName, 'readwrite', store => {
    store.clear();
  });
}
