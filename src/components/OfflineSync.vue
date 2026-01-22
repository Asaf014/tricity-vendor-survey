<template>
  <div class="sync-container">
    <button @click="syncData" :disabled="isSyncing" class="sync-btn">
      {{ isSyncing ? 'Syncing...' : '☁️ Sync to Google Drive' }}
    </button>
    <p v-if="status" class="status-text">{{ status }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getUnsyncedLogs, markAsSynced } from '../utils/db';
import { blobToBase64 } from '../utils/imageHelper';

const isSyncing = ref(false);
const status = ref('');

// YOUR SPECIFIC GOOGLE SCRIPT URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfmOuJxuo1h0IAZkf0s7ikfysAaasWbUilQ4xE31O21bpEluaDMhAtjr62NtfP2NA0QQ/exec";

async function syncData() {
  isSyncing.value = true;
  status.value = "Checking for logs...";

  try {
    const logs = await getUnsyncedLogs();
    
    if (logs.length === 0) {
      status.value = "No new data to sync.";
      isSyncing.value = false;
      return;
    }

    // FIXED LINE: Using simple string concatenation to avoid syntax errors
    status.value = "Found " + logs.length + " logs. Uploading...";

    for (let log of logs) {
      // 1. Prepare Payload
      let payload = { ...log };
      
      // 2. Convert Photo (if exists)
      if (log.photo_blob) {
        payload.photo_base64 = await blobToBase64(log.photo_blob);
        delete payload.photo_blob; // Don't send the raw blob, just the string
      }

      // 3. Send to Google
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // 4. Mark as synced locally so we don't send it again
      await markAsSynced(log.log_id);
    }

    status.value = "✅ All data synced successfully!";
    
  } catch (error) {
    console.error(error);
    status.value = "❌ Sync Failed. Check internet connection.";
  } finally {
    isSyncing.value = false;
  }
}
</script>

<style scoped>
.sync-btn {
  background-color: #42b883;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}
.sync-btn:disabled {
  background-color: #ccc;
}
.status-text {
  margin-top: 10px;
  font-size: 0.9em;
  color: #666;
}
</style>