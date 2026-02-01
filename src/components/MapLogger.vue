<template>
  <div class="shell-grid">
    <!-- NAVIGATION RAIL (60px) -->
    <nav class="nav-rail" :class="{ 'mobile-hidden': mobileMenuOpen }">
      <button 
        class="nav-icon" 
        :class="{ active: activePanel === 'dashboard' }"
        @click="togglePanel('dashboard')"
        title="Dashboard"
      >
        <BarChart3Icon size="24" />
      </button>
      <button 
        class="nav-icon" 
        :class="{ active: activePanel === 'logs' }"
        @click="togglePanel('logs')"
        title="Team Logs"
      >
        <ClipboardListIcon size="24" />
      </button>
      <button 
        class="nav-icon" 
        :class="{ active: activePanel === 'layers' }"
        @click="togglePanel('layers')"
        title="Map Layers"
      >
        <LayersIcon size="24" />
      </button>
      <button 
        class="nav-icon" 
        :class="{ active: activePanel === 'settings' }"
        @click="togglePanel('settings')"
        title="Settings"
      >
        <SettingsIcon size="24" />
      </button>
    </nav>

    <!-- MAP CANVAS (main) -->
    <div class="map-canvas">
      <div id="map" class="map-element"></div>

      <!-- BOTTOM-LEFT ACTION CONTROLS -->
      <div class="bottom-controls">
        <button class="btn-locate" @click="locateUser" title="Locate Me">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
        <button class="btn-add" @click="showAddForm = true" title="Add Observation">
          <PlusIcon size="24" />
        </button>
      </div>

      <!-- BOTTOM FAB for Mobile (Menu Toggle) -->
      <button v-if="isMobile" class="mobile-menu-fab" @click="mobileMenuOpen = !mobileMenuOpen">
        <MenuIcon size="24" />
      </button>

      <!-- Toast Notification -->
      <transition name="toast-fade">
        <div v-if="toastMessage" class="toast-notification">
          <CheckCircleIcon v-if="toastType === 'success'" size="20" />
          <AlertCircleIcon v-else size="20" />
          {{ toastMessage }}
        </div>
      </transition>
    </div>

    <!-- DRAWER PANEL (overlays map) -->
    <transition name="drawer-slide">
      <div v-if="activePanel" class="drawer-overlay">
        <div class="drawer-panel" :class="'panel-' + activePanel">
          <!-- Close Button -->
          <button class="drawer-close" @click="activePanel = null">
            <XIcon size="24" />
          </button>

          <!-- Dashboard Panel -->
                  <DashboardPanel 
                    v-if="activePanel === 'dashboard'" 
                    :logs="allVendors"
                    @start-draw="startDrawing"
                    @locate="locateUser"
                    @open-add="() => showAddForm = true"
                  />

          <!-- Logs Panel -->
          <TeamLogsPanel v-if="activePanel === 'logs'" :logs="allVendors" />

          <!-- Layers Panel -->
          <LayerControl 
            v-if="activePanel === 'layers'"
            :boundary-visible="layers.boundary"
            @change-base="setBaseMap"
            @toggle-boundary="toggleBoundary"
            @update-filters="handleFilterUpdate"
          />

          <!-- Settings Panel -->
          <SettingsPanel v-if="activePanel === 'settings'" @close="activePanel = null" />
        </div>
      </div>
    </transition>

    <!-- ADD/EDIT FORM MODAL -->
    <transition name="modal-fade">
      <div v-if="showAddForm" class="modal-overlay">
        <AddDataForm 
          :edit-data="editingVendor"
          @close="handleFormClose"
          @save="handleFormSave"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, createApp, h } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { supabase } from '../supabase';
import DashboardPanel from './DashboardPanel.vue';
import TeamLogsPanel from './TeamLogs.vue';
import LayerControl from './LayerControl.vue';
import SettingsPanel from './SettingsPanel.vue';
import AddDataForm from './AddDataForm.vue';
import PopupCard from './PopupCard.vue';
import {
  BarChart3Icon, ClipboardListIcon, LayersIcon, SettingsIcon, MenuIcon, PlusIcon, 
  CheckCircleIcon, AlertCircleIcon, XIcon
} from 'lucide-vue-next';

const map = ref(null);
const activePanel = ref(null);
const showAddForm = ref(false);
const editingVendor = ref(null);
const allVendors = ref([]);
const mobileMenuOpen = ref(false);

const toastMessage = ref('');
const toastType = ref('success');

const layers = ref({ boundary: true });
const activeFilters = ref({ food: true, goods: true, services: true, highTraffic: false });

let baseLayerStreet = null;
let baseLayerSat = null;
let boundaryLayer = null;
let vendorLayerGroup = null;

const isMobile = computed(() => window.innerWidth < 768);

function togglePanel(panelName) {
  activePanel.value = activePanel.value === panelName ? null : panelName;
  mobileMenuOpen.value = false;
}

function showToast(msg, type = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => toastMessage.value = '', 3000);
}

onMounted(async () => {
  // Initialize Map
  map.value = L.map('map', { 
    zoomControl: false, 
    attributionControl: false 
  }).setView([30.7333, 76.7794], 13);

  baseLayerStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', 
    { attribution: 'Esri', maxZoom: 19 });
  baseLayerSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
    { attribution: 'Esri Satellite', maxZoom: 19 });
  baseLayerStreet.addTo(map.value);

  // Boundary
  const boundaryCoords = [
    [30.7963, 76.8188], [30.7850, 76.8400], [30.7580, 76.8650], [30.7200, 76.8900], 
    [30.6800, 76.8800], [30.6500, 76.8500], [30.6300, 76.8000], [30.6500, 76.7500], 
    [30.6600, 76.7000], [30.7000, 76.6800], [30.7400, 76.7000], [30.7600, 76.7200], 
    [30.7800, 76.7500], [30.7963, 76.8188]
  ];
  boundaryLayer = L.polygon(boundaryCoords, {
    color: '#EF4444', weight: 2, fill: true, fillOpacity: 0.05, dashArray: '5,5'
  });
  boundaryLayer.addTo(map.value);

  // NOTE: Drawing controls are now activated from the Dashboard panel.

  vendorLayerGroup = L.layerGroup().addTo(map.value);

  // Load vendors
  await loadVendors();
  renderVendors();

  // Locate user
  locateUser();
});

async function loadVendors() {
  const { data } = await supabase.from('vendors').select('*');
  allVendors.value = data || [];
}

function startDrawing() {
  if (!map.value) return;
  // Enable polygon draw mode; the dashboard triggers this via event
  map.value.pm.enableDraw('Polygon');

  // Listen once for the created polygon, handle it, then disable draw
  const onCreate = (e) => {
    if (e.shape === 'Polygon') {
      handlePolygonCreated(e.layer);
    }
    // disable draw mode
    try { map.value.pm.disableDraw(); } catch (err) {}
    map.value.off('pm:create', onCreate);
  };

  map.value.on('pm:create', onCreate);
}

function renderVendors() {
  vendorLayerGroup.clearLayers();
  
  allVendors.value.forEach(vendor => {
    // Filter by active filters
    const typeStr = (vendor.type || '').toLowerCase();
    let isVisible = false;

    if ((typeStr.includes('food') || typeStr.includes('fresh')) && activeFilters.value.food) isVisible = true;
    if (typeStr.includes('cloth') && activeFilters.value.goods) isVisible = true;
    if (typeStr.includes('service') && activeFilters.value.services) isVisible = true;

    if (activeFilters.value.highTraffic && (vendor.traffic || '').toLowerCase() !== 'high') {
      isVisible = false;
    }

    if (!isVisible) return;

    const color = getVendorColor(vendor.type);
    const marker = L.circleMarker([vendor.lat, vendor.lng], {
      radius: 8,
      fillColor: color,
      color: '#FFFFFF',
      weight: 2,
      fillOpacity: 0.9
    });

    // Marker click: show popup with PopupCard, STOP propagation to prevent opening Add Data form
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      marker.openPopup();
    });

    // Create PopupCard component mounted in a container
    const popupContainer = document.createElement('div');
    const app = createApp({
      render() {
        return h(PopupCard, {
          data: vendor,
          onEdit: () => {
            editingVendor.value = vendor;
            showAddForm.value = true;
            marker.closePopup();
          }
        });
      }
    });
    app.mount(popupContainer);

    marker.bindPopup(popupContainer, { maxWidth: 320, minWidth: 280, closeButton: false });
    vendorLayerGroup.addLayer(marker);
  });
}

function getVendorColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('food') || t.includes('fresh')) return '#EF4444';
  if (t.includes('cloth')) return '#2563EB';
  if (t.includes('service')) return '#F59E0B';
  return '#6B7280';
}

function handlePolygonCreated(layer) {
  const bounds = layer.getBounds();
  let count = 0;

  allVendors.value.forEach(vendor => {
    if (bounds.contains(L.latLng(vendor.lat, vendor.lng))) {
      count++;
    }
  });

  showToast(`Zone Created: Contains ${count} Vendors`, 'success');
}

function handleFilterUpdate(filters) {
  activeFilters.value = filters;
  renderVendors();
}

function setBaseMap(type) {
  if (type === 'street') {
    map.value.removeLayer(baseLayerSat);
    baseLayerStreet.addTo(map.value);
  } else {
    map.value.removeLayer(baseLayerStreet);
    baseLayerSat.addTo(map.value);
  }
}

function toggleBoundary() {
  layers.value.boundary = !layers.value.boundary;
  if (layers.value.boundary) {
    boundaryLayer.addTo(map.value);
  } else {
    map.value.removeLayer(boundaryLayer);
  }
}

function locateUser() {
  map.value.locate({ setView: true, maxZoom: 16 });
  map.value.once('locationfound', (e) => {
    L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: '#2563EB',
      color: '#FFFFFF',
      weight: 2,
      fillOpacity: 1
    }).addTo(map.value).bindPopup('You are here');
  });
}

function handleFormClose() {
  showAddForm.value = false;
  editingVendor.value = null;
}

async function handleFormSave(formData) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (editingVendor.value) {
      // Update existing
      const { error } = await supabase.from('vendors')
        .update(formData)
        .eq('id', editingVendor.value.id);
      if (error) throw error;
      showToast('Record updated', 'success');
    } else {
      // Create new
      const payload = {
        user_id: session?.user?.id,
        user_name: session?.user?.user_metadata?.full_name || 'Unknown',
        ...formData
      };
      const { error } = await supabase.from('vendors').insert([payload]);
      if (error) throw error;
      showToast('Record saved', 'success');
    }

    handleFormClose();
    await loadVendors();
    renderVendors();
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.shell-grid {
  display: grid;
  grid-template-columns: 60px 1fr;
  height: 100vh;
  overflow: hidden;
  background: #FFFFFF;
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
}

.nav-rail {
  background: #FFFFFF;
  border-right: 1px solid #F3F4F6;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
  align-items: center;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.nav-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-icon:hover {
  background: #F3F4F6;
  color: #2563EB;
}

.nav-icon.active {
  background: #DBEAFE;
  color: #2563EB;
}

.map-canvas {
  position: relative;
  overflow: hidden;
}

.map-element {
  width: 100%;
  height: 100%;
}

/* BOTTOM-RIGHT CONTROLS */
.bottom-controls {
  position: absolute;
  bottom: 30px;
  right: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-locate, .btn-add {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.btn-locate {
  width: 48px;
  height: 48px;
  background: #FFFFFF;
  color: #2563EB;
}

.btn-locate:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.25);
}

.btn-add {
  width: 56px;
  height: 56px;
  background: #2563EB;
  color: #FFFFFF;
}

.btn-add:hover {
  transform: scale(1.08);
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.3);
}

.mobile-menu-fab {
  position: absolute;
  bottom: 100px;
  right: 30px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #FFFFFF;
  color: #2563EB;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 200;
}

/* Toast Notification */
.toast-notification {
  position: absolute;
  bottom: 120px;
  right: 30px;
  background: #10B981;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  z-index: 300;
}

/* Drawer Overlay & Panel */
.drawer-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
}

.drawer-panel {
  position: absolute;
  left: 60px;
  top: 0;
  bottom: 0;
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 60px 20px 20px 20px;
  z-index: 1001;
}

.drawer-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.drawer-close:hover {
  background: #F3F4F6;
  color: #2563EB;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}

/* Transitions */
.drawer-slide-enter-active, .drawer-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.drawer-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Mobile Responsive */
@media (max-width: 1200px) {
  .drawer-panel {
    width: 350px;
  }
}

@media (max-width: 900px) {
  .drawer-panel {
    width: 80vw;
    max-width: 350px;
  }
}

@media (max-width: 767px) {
  .shell-grid {
    grid-template-columns: 1fr;
  }

  .nav-rail {
    display: none;
  }

  .nav-rail.mobile-hidden {
    display: none;
  }

  .drawer-panel {
    left: 0;
    width: 100%;
    height: auto;
    max-height: 85vh;
    border-radius: 12px 12px 0 0;
    margin-top: auto;
  }

  .bottom-controls {
    bottom: 80px;
    right: 12px;
    flex-direction: row;
    gap: 8px;
  }

  .btn-locate, .btn-add {
    width: 44px;
    height: 44px;
    font-size: 0.9rem;
  }

  .btn-add {
    width: 52px;
    height: 52px;
  }

  .mobile-menu-fab {
    display: flex !important;
  }

  .toast-notification {
    bottom: 100px;
    right: 12px;
    font-size: 0.8rem;
    padding: 10px 12px;
  }
}

@media (max-width: 480px) {
  .bottom-controls {
    bottom: 70px;
    right: 8px;
    gap: 6px;
  }

  .btn-locate, .btn-add {
    width: 40px;
    height: 40px;
  }

  .btn-add {
    width: 48px;
    height: 48px;
  }

  .mobile-menu-fab {
    width: 44px;
    height: 44px;
    bottom: 12px;
  }
}
</style>