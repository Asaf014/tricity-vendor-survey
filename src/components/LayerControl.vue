<template>
  <div class="layer-panel">
      
        <div class="panel-section">
        <h3>Map View</h3>
        
        <div class="mode-toggle">
          <button 
            class="mode-btn" 
            :class="{ active: !isHeatmap }" 
            @click="setHeatmap(false)"
          >
            <MapPinIcon size="16" />
            Points
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: isHeatmap }" 
            @click="setHeatmap(true)"
          >
            <Grid3X3Icon size="16" />
            Heatmap
          </button>
        </div>
      </div>

      <div class="panel-section">
        <h3>Base Map</h3>
        <div class="map-grid">
          <button 
            class="map-option" 
            :class="{ active: currentMap === 'street' }" 
            @click="selectMap('street')"
          >
            <div class="preview street"></div>
            <span>Street</span>
          </button>
          <button 
            class="map-option" 
            :class="{ active: currentMap === 'satellite' }" 
            @click="selectMap('satellite')"
          >
            <div class="preview satellite"></div>
            <span>Satellite</span>
          </button>
        </div>
      </div>

      <div class="panel-section" v-if="!isHeatmap">
        <h3>Category Filters</h3>
        
        <label class="toggle-row">
          <span class="label-group">
            <span class="dot food"></span>
            <span>Food</span>
          </span>
          <input type="checkbox" :checked="filters.food" @change="toggleFilter('food')" />
        </label>

        <label class="toggle-row">
          <span class="label-group">
            <span class="dot goods"></span>
            <span>Goods</span>
          </span>
          <input type="checkbox" :checked="filters.goods" @change="toggleFilter('goods')" />
        </label>

        <label class="toggle-row">
          <span class="label-group">
            <span class="dot services"></span>
            <span>Services</span>
          </span>
          <input type="checkbox" :checked="filters.services" @change="toggleFilter('services')" />
        </label>
      </div>

      <div class="panel-section">
        <h3>Tools</h3>
        
        <label class="toggle-row">
          <span class="label-group">
            <MapIcon size="16" />
            <span>Show Boundary</span>
          </span>
          <input type="checkbox" :checked="boundaryVisible" @change="$emit('toggle-boundary')" />
        </label>

        <label class="toggle-row">
          <span class="label-group">
            <AlertTriangleIcon size="16" />
            <span>High Traffic</span>
          </span>
          <input type="checkbox" :checked="filters.highTraffic" @change="toggleFilter('highTraffic')" />
        </label>

        <button class="btn-draw" @click="$emit('start-draw')">
          <PencilIcon size="16" />
          Draw Zone
        </button>
      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  MapPinIcon,
  Grid3X3Icon,
  MapIcon,
  AlertTriangleIcon,
  PencilIcon
} from 'lucide-vue-next';

defineProps({
  boundaryVisible: Boolean
});

defineEmits(['change-base', 'toggle-boundary', 'update-filters', 'start-draw']);

const currentMap = ref('street');
const isHeatmap = ref(false);
const filters = ref({
  food: true,
  goods: true,
  services: true,
  highTraffic: false
});

function selectMap(type) {
  currentMap.value = type;
}

function setHeatmap(val) {
  isHeatmap.value = val;
}

function toggleFilter(category) {
  filters.value[category] = !filters.value[category];
}
</script>

<style scoped>
.layer-panel {
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border: 1px solid rgba(255,255,255,0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.panel-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
}

.panel-section:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.panel-section h3 {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1F2937;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Toggle Buttons */
.mode-toggle {
  display: flex;
  gap: 8px;
  background: #F3F4F6;
  padding: 4px;
  border-radius: 8px;
}

.mode-btn {
  flex: 1;
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #6B7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.mode-btn.active {
  background: #FFFFFF;
  color: #2563EB;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.mode-btn:hover:not(.active) {
  background: rgba(255,255,255,0.5);
}

/* Map Grid */
.map-grid {
  display: flex;
  gap: 8px;
}

.map-option {
  flex: 1;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.map-option.active {
  border-color: #2563EB;
}

.map-option span {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6B7280;
}

.map-option.active span {
  color: #2563EB;
  font-weight: 600;
}

.preview {
  width: 100%;
  height: 40px;
  border-radius: 6px;
}

.preview.street {
  background: linear-gradient(45deg, #E5E7EB 25%, #FFFFFF 25%, #FFFFFF 50%, #E5E7EB 50%, #E5E7EB 75%, #FFFFFF 75%, #FFFFFF 100%);
  background-size: 12px 12px;
}

.preview.satellite {
  background: linear-gradient(135deg, #1F2937, #374151);
}

/* Filters */
.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
}

.label-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
}

.label-group svg {
  color: #6B7280;
  flex-shrink: 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.food { background: #EF4444; }
.dot.goods { background: #2563EB; }
.dot.services { background: #F59E0B; }

.toggle-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563EB;
}

/* Buttons */
.btn-draw {
  width: 100%;
  padding: 10px;
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  margin-top: 8px;
}

.btn-draw:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
  color: #1F2937;
}

@media (max-width: 900px) {
  .layer-panel {
    padding: 12px;
  }

  .section-title {
    font-size: 0.9rem;
  }

  .mode-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .label-group {
    font-size: 0.85rem;
  }

  .btn-draw {
    font-size: 0.85rem;
    padding: 8px;
  }
}

@media (max-width: 600px) {
  .layer-panel {
    padding: 10px;
  }

  .section-title {
    font-size: 0.85rem;
  }

  .mode-group {
    flex-wrap: wrap;
  }

  .mode-btn {
    flex: 1;
    min-width: 70px;
    padding: 6px 8px;
    font-size: 0.75rem;
  }

  .map-grid {
    flex-direction: column;
    gap: 6px;
  }

  .map-option {
    padding: 4px;
    gap: 4px;
  }

  .map-option span {
    font-size: 0.7rem;
  }

  .preview {
    height: 30px;
  }

  .label-group {
    font-size: 0.8rem;
  }

  .toggle-row {
    padding: 8px 0;
  }

  .btn-draw {
    font-size: 0.8rem;
    padding: 6px;
    margin-top: 6px;
  }
}

@media (max-width: 480px) {
  .map-grid {
    flex-direction: column;
  }

  .layer-panel {
    padding: 8px;
  }

  .mode-btn {
    font-size: 0.7rem;
    padding: 4px 6px;
  }
}
</style>