<template>
  <div class="settings-panel">
    <h2>Settings</h2>
    
    <div class="setting-section">
      <h3>Map</h3>
      <label class="setting-row">
        <span>Show Attribution</span>
        <input type="checkbox" v-model="settings.attribution" />
      </label>
      <label class="setting-row">
        <span>Enable Zoom Controls</span>
        <input type="checkbox" v-model="settings.zoomControls" />
      </label>
    </div>

    <div class="setting-section">
      <h3>Notifications</h3>
      <label class="setting-row">
        <span>Toast Notifications</span>
        <input type="checkbox" v-model="settings.notifications" />
      </label>
    </div>

    <button class="btn-logout" @click="logout">Sign Out</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';

const emit = defineEmits(['close']);

const settings = ref({
  attribution: true,
  zoomControls: true,
  notifications: true
});

async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/login';
}
</script>

<style scoped>
.settings-panel { padding: 0; }
h2 { margin: 0 0 16px 0; font-size: 1.3rem; font-weight: 700; color: #1F2937; }

.setting-section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #E5E7EB; }
.setting-section h3 { margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 600; color: #374151; }

.setting-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; color: #4B5563; font-size: 0.9rem; }
.setting-row input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; }

.btn-logout { width: 100%; background: #EF4444; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 20px; }
.btn-logout:hover { background: #DC2626; }
</style>