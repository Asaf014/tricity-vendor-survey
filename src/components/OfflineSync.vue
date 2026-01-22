<template>
  <div class="sync-status-bar" :class="{ 'syncing': isSyncing, 'error': hasError }">
    <div class="status-content" @click="forceSync">
      <span class="status-indicator"></span>
      <span class="status-text">{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getUnsyncedLogs, markAsSynced, syncEntry } from '../utils/db';

const isSyncing = ref(false);
const hasError = ref(false);
const statusMessage = ref('Initializing...');
let syncInterval = null;

onMounted(() => {
  // 1. Load last sync time from memory
  const lastTime = localStorage.getItem('lastSyncTime');
  statusMessage.value = lastTime ? 'Last synced: ' + lastTime : 'Waiting for connection';

  // 2. Set up Auto-Sync (Every 30 seconds)
  syncInterval = setInterval(runAutoSync, 30000);

  // 3. Listen for Internet Reconnection
  window.addEventListener('online', runAutoSync);
  
  // 4. Run immediately on load
  runAutoSync();
});

onUnmounted(() => {
  if (syncInterval) clearInterval(syncInterval);
  window.removeEventListener('online', runAutoSync);
});

async function runAutoSync() {
  if (isSyncing.value || !navigator.onLine) return;

  await forceSync();
}

async function forceSync() {
  isSyncing.value = true;
  hasError.value = false;
  statusMessage.value = 'Syncing data...';

  try {
    const logs = await getUnsyncedLogs();
    
    if (logs.length === 0) {
      updateLastSyncTime();
      return;
    }

    // Process logs one by one
    for (let log of logs) {
      await syncEntry(log);
      await markAsSynced(log.log_id);
    }

    updateLastSyncTime();
    
  } catch (error) {
    console.error(error);
    hasError.value = true;
    statusMessage.value = 'Sync failed. Tap to retry.';
  } finally {
    isSyncing.value = false;
  }
}

function updateLastSyncTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  statusMessage.value = 'Last synced: ' + timeString;
  localStorage.setItem('lastSyncTime', timeString);
}
</script>

<style scoped>
.sync-status-bar {
  background-color: #f8f9fa;
  border-top: 1px solid #ddd;
  padding: 8px 15px;
  font-size: 0.85em;
  color: #666;
  text-align: center;
  transition: all 0.3s ease;
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.status-indicator {
  width: 8px;
  height: 8px;
  background-color: #ccc;
  border-radius: 50%;
  transition: background-color 0.3s;
}

/* Active Sync State */
.syncing {
  background-color: #e3f2fd;
  color: #0d47a1;
}
.syncing .status-indicator {
  background-color: #2196f3;
  animation: pulse 1.5s infinite;
}

/* Error State */
.error {
  background-color: #ffebee;
  color: #c62828;
}
.error .status-indicator {
  background-color: #ef5350;
}

/* Success State (Implicit when not syncing/error) */
.sync-status-bar:not(.syncing):not(.error) .status-indicator {
  background-color: #66bb6a; /* Green dot for healthy */
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
</style>