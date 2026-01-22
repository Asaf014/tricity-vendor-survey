import { openDB } from 'idb';

const DB_NAME = 'vendor-survey-db';
const STORE_NAME = 'logs';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'log_id' });
      }
    },
  });
}

export async function saveLog(data, photoBlob) {
  const db = await initDB();
  // Create a unique ID if one doesn't exist
  if (!data.log_id) {
    data.log_id = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  const entry = {
    ...data,
    photo_blob: photoBlob, 
    synced: false
  };
  return db.put(STORE_NAME, entry);
}

export async function getUnsyncedLogs() {
  const db = await initDB();
  const allLogs = await db.getAll(STORE_NAME);
  return allLogs.filter(log => !log.synced);
}

export async function markAsSynced(log_id) {
  const db = await initDB();
  const log = await db.get(STORE_NAME, log_id);
  if (log) {
    log.synced = true;
    await db.put(STORE_NAME, log);
  }
}