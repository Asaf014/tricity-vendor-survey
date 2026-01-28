<template>
  <div class="layer-control-container">
    <button class="layer-btn" @click="showMenu = !showMenu" title="Map Layers">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="#5f6368"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>
    </button>
    
    <div v-if="showMenu" class="layer-dropdown">
      <div class="header">Base Map</div>
      <div class="map-types">
        <div class="type-option" :class="{ active: currentMap === 'street' }" @click="selectMap('street')">
          <div class="preview street"></div>
          <span>Street</span>
        </div>
        <div class="type-option" :class="{ active: currentMap === 'satellite' }" @click="selectMap('satellite')">
          <div class="preview satellite"></div>
          <span>Satellite</span>
        </div>
      </div>
      
      <div class="header">Context Layers</div>
      <label class="overlay-row">
        <span>Tricity Boundary</span>
        <input type="checkbox" :checked="boundaryVisible" @change="('toggleBoundary')">
      </label>

      <div class="header">Filter Vendors</div>
      <label class="overlay-row">
        <span class="legend-dot red"></span> Food
        <input type="checkbox" :checked="filters.food" @change="toggleFilter('food')">
      </label>
      <label class="overlay-row">
        <span class="legend-dot blue"></span> Goods
        <input type="checkbox" :checked="filters.goods" @change="toggleFilter('goods')">
      </label>
      <label class="overlay-row">
        <span class="legend-dot yellow"></span> Services
        <input type="checkbox" :checked="filters.services" @change="toggleFilter('services')">
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['boundaryVisible']);
const emit = defineEmits(['changeBase', 'toggleBoundary', 'updateFilters']);

const showMenu = ref(false);
const currentMap = ref('street');
const filters = ref({
  food: true,
  goods: true,
  services: true
});

function selectMap(type) {
  currentMap.value = type;
  emit('changeBase', type);
}

function toggleFilter(category) {
  filters.value[category] = !filters.value[category];
  emit('updateFilters', filters.value);
}
</script>

<style scoped>
.layer-control-container { position: absolute; top: 20px; right: 20px; z-index: 1000; font-family: 'Segoe UI', sans-serif; }
.layer-btn { width: 44px; height: 44px; background: white; border: none; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.layer-btn:hover { background: #f8f9fa; }
.layer-dropdown { position: absolute; top: 55px; right: 0; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: 240px; }
.header { font-size: 0.75em; text-transform: uppercase; color: #5f6368; font-weight: 700; margin: 15px 0 8px 0; letter-spacing: 0.5px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
.header:first-child { margin-top: 0; }
.map-types { display: flex; gap: 10px; margin-bottom: 10px; }
.type-option { flex: 1; cursor: pointer; text-align: center; opacity: 0.7; transition: 0.2s; }
.type-option:hover { opacity: 1; }
.type-option.active { opacity: 1; font-weight: 600; color: #1a73e8; }
.preview { height: 50px; border-radius: 6px; background: #eee; margin-bottom: 6px; border: 2px solid transparent; }
.type-option.active .preview { border-color: #1a73e8; }
.preview.satellite { background: #333; }
.overlay-row { display: flex; justify-content: space-between; padding: 8px 0; cursor: pointer; font-size: 0.9em; color: #3c4043; align-items: center; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 8px; }
.red { background: #e74c3c; } .blue { background: #3498db; } .yellow { background: #f1c40f; }
</style>