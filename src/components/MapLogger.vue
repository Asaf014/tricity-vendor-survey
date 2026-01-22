<template>
  <div class="map-wrapper">
    <div id="map"></div>

    <div v-if="isAdding" class="center-target">
      <div class="crosshair"></div>
      <div class="pin-shadow"></div>
    </div>

    <button v-if="!isAdding" @click="startAdding" class="fab-btn">
      <span class="plus-icon">+</span>
    </button>

    <div v-if="isAdding && !showForm" class="confirm-bar">
      <p>Drag map to position vendor</p>
      <div class="bar-buttons">
        <button @click="confirmLocation" class="btn-confirm">Confirm Location</button>
        <button @click="cancelAdding" class="btn-cancel">Cancel</button>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Log Vendor Details</h3>
          <button @click="closeForm" class="close-x">x</button>
        </div>
        
        <div class="scroll-content">
          <div class="section-title">Identity</div>
          <div class="form-row">
            <div class="field half">
              <label>Type</label>
              <select v-model="formData.type">
                <option>Food</option>
                <option>Clothes</option>
                <option>Service</option>
                <option>Fresh Produce</option>
                <option>Other</option>
              </select>
            </div>
            <div class="field half">
              <label>Structure</label>
              <select v-model="formData.structure">
                <option>Moving Cart</option>
                <option>Static Stall</option>
                <option>Floor Spread</option>
                <option>Kiosk</option>
              </select>
            </div>
          </div>

          <div class="section-title">Context & Traffic</div>
          <div class="field">
            <label>Traffic Flow</label>
            <div class="segment-control">
              <button :class="{active: formData.traffic === 'Low'}" @click="formData.traffic = 'Low'">Low</button>
              <button :class="{active: formData.traffic === 'Medium'}" @click="formData.traffic = 'Medium'">Medium</button>
              <button :class="{active: formData.traffic === 'High'}" @click="formData.traffic = 'High'">High</button>
            </div>
          </div>

          <div class="field">
            <label>Stability (Duration)</label>
            <select v-model="formData.duration">
              <option>Transient (Less than 1 hr)</option>
              <option>Daily Shift (4-8 hrs)</option>
              <option>Semi-Permanent (24 hrs)</option>
            </select>
          </div>

          <div class="field">
            <label>Observation Notes</label>
            <textarea v-model="formData.notes" placeholder="e.g., Near bus stop, crowding pavement..."></textarea>
          </div>

          <div class="section-title">Evidence</div>
          <div class="photo-upload-box">
            <input type="file" id="photo" accept="image/*" @change="handlePhotoUpload" hidden />
            <label for="photo" class="photo-label">
              <span v-if="!photoFile">Tap to take photo</span>
              <span v-else>Photo Selected</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="submitLog" class="btn-save">Save & Sync</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { saveLog } from '../utils/db';

const map = ref(null);
const isAdding = ref(false);
const showForm = ref(false);
const photoFile = ref(null);
const tempCenter = ref(null);

const formData = ref({
  type: 'Food',
  traffic: 'Medium',
  structure: 'Moving Cart',
  duration: 'Daily Shift (4-8 hrs)',
  notes: ''
});

onMounted(() => {
  // 1. Initialize Map with Professional "CartoDB Voyager" Style (No API Key needed)
  map.value = L.map('map', { zoomControl: false }).setView([30.7333, 76.7794], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: 'OpenStreetMap & CartoDB',
    maxZoom: 20
  }).addTo(map.value);

  // 2. Add Zoom Control to top-right
  L.control.zoom({ position: 'topright' }).addTo(map.value);

  // 3. Locate User immediately
  map.value.locate({ setView: true, maxZoom: 16 });
});

function startAdding() {
  isAdding.value = true;
}

function cancelAdding() {
  isAdding.value = false;
  showForm.value = false;
}

function confirmLocation() {
  // Get the exact center of the map
  tempCenter.value = map.value.getCenter();
  showForm.value = true;
}

function handlePhotoUpload(event) {
  photoFile.value = event.target.files[0];
}

function closeForm() {
  showForm.value = false;
  isAdding.value = false;
  photoFile.value = null;
}

async function submitLog() {
  const payload = {
    ...formData.value,
    lat: tempCenter.value.lat,
    lng: tempCenter.value.lng,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Save to Local Database (Offline First)
    await saveLog(payload, photoFile.value);
    
    // 2. Drop a "Success" Marker on the map instantly
    L.circleMarker([payload.lat, payload.lng], {
      radius: 8,
      fillColor: "#42b883",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map.value);

    alert('Log Saved!');
    closeForm();
  } catch (error) {
    console.error(error);
    alert('Error saving log.');
  }
}
</script>

<style scoped>
.map-wrapper { position: relative; height: 100vh; width: 100vw; overflow: hidden; }
#map { height: 100%; width: 100%; z-index: 1; }

/* The Uber-style Crosshair */
.center-target {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 500; pointer-events: none;
  display: flex; flex-direction: column; align-items: center;
}
.crosshair {
  width: 20px; height: 20px;
  border: 2px solid #333; border-radius: 50%;
  position: relative;
}
.crosshair::after {
  content: ''; position: absolute; top: 50%; left: 50%;
  width: 4px; height: 4px; background: #333;
  transform: translate(-50%, -50%); border-radius: 50%;
}
.pin-shadow {
  width: 10px; height: 4px; background: rgba(0,0,0,0.3);
  border-radius: 50%; margin-top: 20px;
}

/* Floating Action Button */
.fab-btn {
  position: absolute; bottom: 30px; right: 20px;
  width: 60px; height: 60px;
  background: #2c3e50; color: white;
  border-radius: 50%; border: none;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  z-index: 1000; cursor: pointer;
  display: flex; justify-content: center; align-items: center;
}
.plus-icon { font-size: 30px; font-weight: bold; margin-top: -4px; }

/* Confirm Bar */
.confirm-bar {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  background: white; padding: 15px; border-radius: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  z-index: 1000; text-align: center; width: 80%;
}
.bar-buttons { display: flex; gap: 10px; margin-top: 10px; }
.btn-confirm { background: #2c3e50; color: white; flex: 2; padding: 10px; border-radius: 20px; border: none; font-weight: bold; }
.btn-cancel { background: #e74c3c; color: white; flex: 1; padding: 10px; border-radius: 20px; border: none; }

/* Modal Form */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 2000;
  display: flex; align-items: flex-end; /* Sheet slides up from bottom */
}
.modal-card {
  background: #f8f9fa; width: 100%; border-radius: 20px 20px 0 0;
  padding: 20px; max-height: 85vh; display: flex; flex-direction: column;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.scroll-content { overflow-y: auto; padding-bottom: 20px; }
.section-title { font-size: 0.8em; text-transform: uppercase; color: #666; margin: 15px 0 5px 0; font-weight: bold; }
.form-row { display: flex; gap: 10px; }
.field { margin-bottom: 10px; }
.half { flex: 1; }
label { display: block; font-size: 0.9em; margin-bottom: 5px; font-weight: 600; }
select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background: white; font-family: inherit; }
textarea { height: 60px; resize: none; }

/* Segment Control */
.segment-control { display: flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
.segment-control button { flex: 1; border: none; background: white; padding: 10px; cursor: pointer; font-size: 0.9em; }
.segment-control button.active { background: #2c3e50; color: white; }

/* Photo Button */
.photo-upload-box { margin-top: 10px; }
.photo-label {
  display: block; width: 100%; padding: 15px;
  border: 2px dashed #ccc; border-radius: 10px;
  text-align: center; color: #666; cursor: pointer;
}

.modal-footer { margin-top: auto; padding-top: 10px; }
.btn-save { width: 100%; background: #42b883; color: white; padding: 15px; border: none; border-radius: 12px; font-size: 1.1em; font-weight: bold; }
.close-x { background: none; border: none; font-size: 24px; color: #666; }
</style>