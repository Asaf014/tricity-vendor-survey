<template>
  <div class="map-wrapper">
    <div id="map"></div>

    <div v-if="showForm" class="modal-overlay">
      <div class="modal-content">
        <h3>Log Vendor Data</h3>
        
        <div class="form-group">
          <label>Vendor Type:</label>
          <select v-model="formData.type">
            <option>Food</option>
            <option>Clothes</option>
            <option>Service</option>
            <option>Fresh Produce</option>
            <option>Other</option>
          </select>
        </div>

        <div class="form-group">
          <label>Traffic Condition:</label>
          <select v-model="formData.traffic">
            <option value="Low">Low (Free Flow)</option>
            <option value="Medium">Medium (Steady)</option>
            <option value="High">High (Congested)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Structure Type:</label>
          <select v-model="formData.structure">
            <option>Moving Cart</option>
            <option>Static Stall</option>
            <option>Floor/Ground</option>
          </select>
        </div>

        <div class="form-group">
          <label>Attach Photo:</label>
          <input type="file" accept="image/*" @change="handlePhotoUpload" />
        </div>

        <div class="action-buttons">
          <button @click="submitLog" class="btn-save">Save Log</button>
          <button @click="closeForm" class="btn-cancel">Cancel</button>
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
const showForm = ref(false);
const tempCoords = ref(null);
const photoFile = ref(null);

const formData = ref({
  type: 'Food',
  traffic: 'Medium',
  structure: 'Moving Cart'
});

onMounted(() => {
  // Initialize map centered on Chandigarh
  map.value = L.map('map').setView([30.7333, 76.7794], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ' OpenStreetMap'
  }).addTo(map.value);

  // Attempt to locate user
  map.value.locate({ setView: true, maxZoom: 16 });

  // Map click event
  map.value.on('click', (e) => {
    tempCoords.value = e.latlng;
    showForm.value = true;
    
    // Visual feedback
    L.popup()
      .setLatLng(e.latlng)
      .setContent("New Log Location")
      .openOn(map.value);
  });
});

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    photoFile.value = file;
  }
}

function closeForm() {
  showForm.value = false;
  photoFile.value = null;
}

async function submitLog() {
  if (!tempCoords.value) return;

  const payload = {
    ...formData.value,
    lat: tempCoords.value.lat,
    lng: tempCoords.value.lng,
    timestamp: new Date().toISOString()
  };

  try {
    await saveLog(payload, photoFile.value);
    alert('Log saved to device storage.');
    closeForm();
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save log.');
  }
}
</script>

<style scoped>
.map-wrapper { position: relative; height: 100%; width: 100%; }
#map { height: 90vh; width: 100%; z-index: 1; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  display: flex; justify-content: center; align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.form-group { margin-bottom: 15px; display: flex; flex-direction: column; }
label { font-weight: bold; margin-bottom: 5px; }
select, input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }

.action-buttons { display: flex; gap: 10px; margin-top: 20px; }
.btn-save { flex: 1; background: #2ecc71; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; }
.btn-cancel { flex: 1; background: #e74c3c; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; }
</style>
