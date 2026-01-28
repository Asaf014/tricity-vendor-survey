<template>
  <div class="app-layout">
    <Sidebar 
      :isOpen="isSidebarOpen" 
      :user="user" 
      :isAdmin="isAdmin" 
      @close="isSidebarOpen = false" 
    />

    <div class="map-container">
      <button @click="isSidebarOpen = true" class="menu-btn">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#5f6368"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
      </button>
      
      <LayerControl 
        :boundaryVisible="layers.boundary"
        @changeBase="setBaseMap"
        @toggleBoundary="toggleBoundary"
        @updateFilters="handleFilterUpdate"
      />

      <div id="map"></div>
      
      <div class="bottom-controls">
        <button @click="locateUser" class="control-btn locate-btn" title="Find My Location">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#5f6368"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
        </button>
        
        <button v-if="!isAdding" @click="startAdding" class="control-btn fab-btn">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>

      <div v-if="isAdding" class="center-target">
        <div class="crosshair"></div>
      </div>

      <div v-if="isAdding && !showForm" class="confirm-bar">
        <div class="instruction">Position the crosshair</div>
        <div class="action-row">
          <button @click="cancelAdding" class="btn-cancel">Cancel</button>
          <button @click="confirmLocation" class="btn-confirm">Set Location</button>
        </div>
      </div>

      <AddDataForm 
        v-if="showForm" 
        @close="closeForm" 
        @save="handleSave"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { supabase } from '../supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from './Sidebar.vue';
import LayerControl from './LayerControl.vue';
import AddDataForm from './AddDataForm.vue';

const map = ref(null);
const user = ref(null);
const isAdmin = ref(false);
const isSidebarOpen = ref(false);
const isAdding = ref(false);
const showForm = ref(false);
const tempCenter = ref(null);

const layers = ref({ boundary: true });
const activeFilters = ref({ food: true, goods: true, services: true });

let allVendorData = [];
let baseLayerStreet = null;
let baseLayerSat = null;
let boundaryLayer = null;
let teamLayerGroup = L.layerGroup(); 

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    user.value = session.user;
    if (session.user.email === 'asafali14sarcasam@gmail.com') isAdmin.value = true;
  }

  map.value = L.map('map', { zoomControl: false }).setView([30.7333, 76.7794], 13);
  
  baseLayerStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
  baseLayerSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri Satellite', maxZoom: 19 });
  
  baseLayerStreet.addTo(map.value); 

  const fluidBoundary = [
    [30.7963, 76.8188], [30.7850, 76.8400], [30.7580, 76.8650], [30.7200, 76.8900], 
    [30.6800, 76.8800], [30.6500, 76.8500], [30.6300, 76.8000], [30.6500, 76.7500], 
    [30.6600, 76.7000], [30.7000, 76.6800], [30.7400, 76.7000], [30.7600, 76.7200], 
    [30.7800, 76.7500], [30.7963, 76.8188]
  ];
  boundaryLayer = L.polygon(fluidBoundary, { 
    color: '#E63946', weight: 2, fill: true, fillOpacity: 0.05, dashArray: '5, 5' 
  }).addTo(map.value);

  teamLayerGroup.addTo(map.value);
  loadTeamPoints();
  locateUser();
});

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
  if (layers.value.boundary) boundaryLayer.addTo(map.value);
  else map.value.removeLayer(boundaryLayer);
}

function handleFilterUpdate(newFilters) {
  activeFilters.value = newFilters;
  renderPoints();
}

function locateUser() {
  map.value.locate({ setView: true, maxZoom: 16 });
  map.value.once('locationfound', (e) => {
    L.circleMarker(e.latlng, { radius: 8, fillColor: '#2196f3', color: 'white', weight: 2, fillOpacity: 1 }).addTo(map.value).bindPopup("You");
  });
}

async function loadTeamPoints() {
  const { data, error } = await supabase.from('vendors').select('*');
  if (data) {
    allVendorData = data;
    renderPoints();
  }
}

function renderPoints() {
  teamLayerGroup.clearLayers();

  allVendorData.forEach(point => {
    const type = (point.type || '').toLowerCase();
    let isVisible = false;

    if (type.includes('food') && activeFilters.value.food) isVisible = true;
    else if (type.includes('fresh') && activeFilters.value.food) isVisible = true;
    else if (type.includes('cloth') && activeFilters.value.goods) isVisible = true;
    else if (type.includes('service') && activeFilters.value.services) isVisible = true;
    else if (!type.includes('food') && !type.includes('cloth') && !type.includes('service') && activeFilters.value.goods) isVisible = true;

    if (isVisible) {
      const color = getPinColor(point.type);
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 7, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.9
      });

      // Construct popup string manually to avoid parser errors
      let content = '<div style="font-family: sans-serif; min-width: 150px;">';
      content += '<strong style="color: ' + color + '; font-size: 1.1em;">' + point.type + '</strong><br/>';
      content += '<span style="font-size: 0.9em; color: #555;">' + (point.user_name || 'Team Member') + '</span><br/>';
      if (point.traffic) {
        content += '<div style="margin-top: 5px; font-size: 0.85em; color: #777;">Traffic: ' + point.traffic + '</div>';
      }
      content += '<small style="color: #999;">' + new Date(point.created_at).toLocaleDateString() + '</small>';
      content += '</div>';
      
      marker.bindPopup(content);
      teamLayerGroup.addLayer(marker);
    }
  });
}

function getPinColor(type) {
  const lowerType = (type || '').toLowerCase();
  if (lowerType.includes('food')) return '#e74c3c';
  if (lowerType.includes('cloth')) return '#3498db';
  if (lowerType.includes('service')) return '#f1c40f';
  if (lowerType.includes('fresh')) return '#2ecc71';
  return '#95a5a6';
}

function startAdding() { isAdding.value = true; }
function cancelAdding() { isAdding.value = false; showForm.value = false; }
function confirmLocation() { tempCenter.value = map.value.getCenter(); showForm.value = true; }
function closeForm() { showForm.value = false; isAdding.value = false; }

async function handleSave(formData) {
  const { data: { session } } = await supabase.auth.getSession();
  const payload = {
    user_id: session.user.id,
    user_name: session.user.user_metadata.full_name,
    lat: tempCenter.value.lat,
    lng: tempCenter.value.lng,
    ...formData
  };
  
  const { error } = await supabase.from('vendors').insert([payload]);
  
  if (!error) {
    closeForm();
    loadTeamPoints(); 
    alert('Entry Saved!');
  } else {
    alert('Error: ' + error.message);
  }
}
</script>

<style scoped>
.app-layout { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.map-container { width: 100%; height: 100%; position: relative; }
#map { width: 100%; height: 100%; z-index: 1; }
.menu-btn { position: absolute; top: 20px; left: 20px; z-index: 1000; background: white; border: none; width: 44px; height: 44px; border-radius: 8px; font-size: 22px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: 0.1s; }
.bottom-controls { position: absolute; bottom: 30px; right: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 15px; align-items: center; }
.control-btn { width: 56px; height: 56px; border-radius: 50%; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.25); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.1s; }
.locate-btn { background: white; }
.fab-btn { background: #2c3e50; }
.center-target { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 500; pointer-events: none; }
.crosshair { width: 20px; height: 20px; border: 2px solid #333; border-radius: 50%; background: rgba(255,255,255,0.4); box-shadow: 0 0 0 1px rgba(0,0,0,0.2); }
.confirm-bar { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); background: white; padding: 15px 25px; border-radius: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 1000; display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 280px; }
.instruction { font-size: 0.85em; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.action-row { display: flex; gap: 10px; width: 100%; }
.btn-confirm { flex: 2; background: #2c3e50; color: white; padding: 12px; border-radius: 20px; border: none; font-weight: 600; cursor: pointer; }
.btn-cancel { flex: 1; background: #e74c3c; color: white; padding: 12px; border-radius: 20px; border: none; font-weight: 600; cursor: pointer; }
</style>