<script setup>
import MapLogger from './components/MapLogger.vue';
import OfflineSync from './components/OfflineSync.vue';
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h2>Vendor Survey</h2>
        <OfflineSync />
      </div>
    </header>
    
    <main class="app-main">
      <MapLogger />
    </main>
  </div>
</template>

<style>
/* Global Resets */
body, html { margin: 0; padding: 0; height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  flex: 0 0 auto;
  background-color: #2c3e50;
  color: white;
  padding: 10px 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

h2 { margin: 0; font-size: 1.2rem; }

.app-main {
  flex: 1 1 auto;
  position: relative;
}
</style>
