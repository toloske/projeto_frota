
import { FormData } from './types';

const DB_NAME = 'FrotaHubDB';
const DB_VERSION = 2;
const STORE_NAME = 'submissions';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveSubmission = async (data: FormData): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const record = { ...data, syncStatus: 'pending' };
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const upsertSubmissionsFromServer = async (data: any[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    data.forEach(item => {
      // Itens vindos do servidor são marcados como sincronizados
      store.put({ ...item, syncStatus: 'synced' });
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllSubmissions = async (): Promise<(FormData & { syncStatus: string })[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const markAsSynced = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        data.syncStatus = 'synced';
        const putRequest = store.put(data);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getPendingSubmissions = async (): Promise<FormData[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('syncStatus');
    const request = index.getAll('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
