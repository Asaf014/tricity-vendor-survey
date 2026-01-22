import { openDB } from 'idb';
import { supabase } from '../supabase';

const DB_NAME = 'vendor-survey-db';
const STORE_NAME = 'logs';
// Google Script URL (Keep your existing one)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfmOuJxuo1h0IAZkf0s7ikfysAaasWbUilQ4xE31O21bpEluaDMhAtjr62NtfP2NA0QQ/exec";

function getUserName() {
  let name = localStorage.getItem('user_name');
  if (!name) {
    name = prompt("Enter your Name (for team tracking):");
    if (name) localStorage.setItem('user_name', name);
    else name = 'Anonymous';
  }
  return name;
}

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
  const userName = getUserName();
  
  if (!data.log_id) {
    data.log_id = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  const entry = {
    ...data,
    user_name: userName,
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
    delete log.photo_blob; // Save space
    await db.put(STORE_NAME, log);
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Handle both pure base64 and dataURL
      const result = reader.result;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function syncEntry(log) {
  console.log("Syncing entry:", log.log_id);

  // 1. Upload to Supabase (Master DB)
  const { error } = await supabase
    .from('vendors')
    .insert([
      { 
        user_name: log.user_name,
        lat: log.lat,
        lng: log.lng,
        type: log.type,
        structure: log.structure,
        traffic: log.traffic,
        duration: log.duration,
        notes: log.notes
      }
    ]);

  if (error) {
    console.error("Supabase Upload Error:", error);
    // We do NOT throw error here, so Google upload can still try
  }

  // 2. Upload to Google Drive (Archive with Photo)
  // Only send if we haven't synced yet or if you want double-backup
  let googlePayload = { ...log };
  if (log.photo_blob) {
    googlePayload.photo_base64 = await blobToBase64(log.photo_blob);
    delete googlePayload.photo_blob;
  }

  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(googlePayload)
  });
}