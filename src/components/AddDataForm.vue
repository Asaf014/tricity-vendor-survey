<template>
  <div class="modal-overlay">
    <div class="modal-card">
      
      <div class="modal-header">
        <div class="header-text">
          <h3>{{ editData ? 'Edit Observation' : 'Log Observation' }}</h3>
          <span class="gps-text">{{ userLocation }}</span>
        </div>
        <button @click="$emit('close')" class="btn-close">&times;</button>
      </div>

      <div class="form-scroll">
        
        <div class="section-card media-section">
          <div class="section-label">Evidence</div>
          <div class="media-row">
            
            <label class="media-btn" :class="{ 'done': mediaFiles.photo, 'loading': uploading.photo }">
              <span v-if="uploading.photo">⏳ Compressing...</span>
              <span v-else-if="mediaFiles.photo">✅ Photo Saved</span>
              <span v-else>📷 Add Photo</span>
              <input type="file" accept="image/*" capture="environment" @change="e => handlePhotoUpload(e)" :disabled="uploading.photo">
            </label>

            <label class="media-btn" :class="{ 'done': mediaFiles.audio, 'loading': uploading.audio }">
              <span v-if="uploading.audio">⏳ Uploading...</span>
              <span v-else-if="mediaFiles.audio">✅ Audio Saved</span>
              <span v-else>🎙️ Record Voice</span>
              <input type="file" accept="audio/*" capture @change="e => handleAudioUpload(e)" :disabled="uploading.audio">
            </label>

          </div>
        </div>

        <div class="section-card">
          <div class="section-label">Basic Info</div>
          <div class="form-row">
            <div class="form-group half">
              <label>Type</label>
              <select v-model="formData.type">
                <option>Food</option>
                <option>Goods</option>
                <option>Service</option>
                <option>Fresh Produce</option>
                <option>Other</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Traffic</label>
              <select v-model="formData.traffic">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="rawSchema.length === 0" class="loading-state">
          Loading form template... (If stuck, check connection)
        </div>

        <div v-for="(fields, groupName) in groupedSchema" :key="groupName" class="section-card">
          <div class="section-label">{{ groupName }}</div>
          
          <div v-for="field in fields" :key="field.id" class="form-group">
            <label>
              {{ field.label }}
              <span v-if="field.is_required" class="req">*</span>
            </label>

            <select v-if="field.field_type === 'dropdown'" v-model="formData.survey_data[field.label]">
              <option disabled value="">Select...</option>
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>

            <div v-if="field.field_type === 'slider'" class="slider-wrapper">
              <input type="range" 
                :min="field.min_val" 
                :max="field.max_val" 
                v-model="formData.survey_data[field.label]" 
              />
              <span class="slider-val">{{ formData.survey_data[field.label] || field.min_val }}</span>
            </div>

            <input v-if="['text', 'number'].includes(field.field_type)" 
              :type="field.field_type" 
              v-model="formData.survey_data[field.label]"
              placeholder="..."
            />
          </div>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="formData.notes" placeholder="Observations..."></textarea>
        </div>

      </div>

      <div class="modal-footer">
        <button @click="submit" class="btn-save" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : (editData ? 'Update Entry' : 'Save Entry') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { supabase } from '../supabase';

const emit = defineEmits(['close', 'save']);
const props = defineProps({
  editData: {
    type: Object,
    default: null
  }
});

const rawSchema = ref([]);
const userLocation = ref('Getting GPS...');
const isSaving = ref(false);

// Form Data Structure
const formData = ref({
  type: 'Food',
  traffic: 'Medium',
  notes: '',
  survey_data: {},
  media_data: { photo: null, audio: null }
});

const uploading = ref({ photo: false, audio: false });
const mediaFiles = ref({ photo: null, audio: null });

// 1. Fetch Schema on Load
onMounted(async () => {
  console.log("Fetching Schema...");
  const { data, error } = await supabase.from('form_schema').select('*').order('id');
  
  if (error) {
    alert("Error loading form: " + error.message);
  } else if (data) {
    rawSchema.value = data;
    // Set Defaults
    data.forEach(f => {
      if (f.field_type === 'slider') formData.value.survey_data[f.label] = f.min_val;
    });
  }
  
  // 2. Get GPS
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => userLocation.value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      err => userLocation.value = "GPS Off"
    );
  }

  // 3. Populate form if editing existing record
  if (props.editData) {
    formData.value.type = props.editData.type || 'Food';
    formData.value.traffic = props.editData.traffic || 'Medium';
    formData.value.notes = props.editData.notes || '';
    formData.value.survey_data = { ...props.editData.survey_data } || {};
    formData.value.media_data = { ...props.editData.media_data } || { photo: null, audio: null };
    
    // Update media file display states
    if (formData.value.media_data.photo) mediaFiles.value.photo = true;
    if (formData.value.media_data.audio) mediaFiles.value.audio = true;
  }
});

const groupedSchema = computed(() => {
  const groups = {};
  rawSchema.value.forEach(field => {
    const g = field.category_group || 'General';
    if (!groups[g]) groups[g] = [];
    groups[g].push(field);
  });
  return groups;
});

// --- IMAGE COMPRESSION LOGIC ---
function compressImage(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const scaleFactor = maxWidth / img.width;
        elem.width = maxWidth;
        elem.height = img.height * scaleFactor;
        
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, elem.width, elem.height);
        
        ctx.canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
  });
}

// --- UPLOAD HANDLERS ---

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploading.value.photo = true;
  
  try {
    // 1. Compress
    const compressedFile = await compressImage(file);
    
    // 2. Upload
    const fileName = `photos/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('survey_media').upload(fileName, compressedFile);
    if (error) throw error;

    // 3. Get URL
    const { data } = supabase.storage.from('survey_media').getPublicUrl(fileName);
    formData.value.media_data.photo = data.publicUrl;
    mediaFiles.value.photo = true;

  } catch (err) {
    alert("Photo Upload Error: " + err.message);
  } finally {
    uploading.value.photo = false;
  }
}

async function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploading.value.audio = true;
  const fileName = `audio/${Date.now()}.mp3`; // Assumes generic audio
  
  try {
    const { error } = await supabase.storage.from('survey_media').upload(fileName, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from('survey_media').getPublicUrl(fileName);
    formData.value.media_data.audio = data.publicUrl;
    mediaFiles.value.audio = true;
  } catch (err) {
    alert("Audio Upload Error: " + err.message);
  } finally {
    uploading.value.audio = false;
  }
}

function submit() {
  isSaving.value = true;
  emit('save', formData.value);
  // Reset happens via parent closing logic
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 3000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-family: 'Segoe UI', sans-serif; padding: 12px; }
.modal-card { background: #f8f9fa; width: 100%; max-width: 480px; max-height: 90vh; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.3); overflow: hidden; }

/* Header */
.modal-header { background: white; padding: 15px 20px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.header-text h3 { margin: 0; color: #2c3e50; font-size: 1.1em; font-weight: 700; }
.gps-text { font-size: 0.75em; color: #1a73e8; font-family: monospace; background: #e8f0fe; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
.btn-close { background: none; border: none; font-size: 28px; color: #adb5bd; cursor: pointer; line-height: 1; }

.form-scroll { padding: 15px; overflow-y: auto; flex: 1; }

/* Sections */
.section-card { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e9ecef; }
.section-label { font-size: 0.7em; text-transform: uppercase; letter-spacing: 1px; color: #1a73e8; font-weight: 700; margin-bottom: 12px; border-bottom: 2px solid #f1f3f4; padding-bottom: 4px; }

/* Media Buttons */
.media-row { display: flex; gap: 10px; }
.media-btn { flex: 1; display: flex; align-items: center; justify-content: center; background: #f1f3f4; border: 2px dashed #adb5bd; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 0.9em; font-weight: 600; color: #495057; transition: 0.2s; text-align: center; min-height: 60px; }
.media-btn:hover { background: #e9ecef; border-color: #495057; }
.media-btn input { display: none; }

.media-btn.loading { background: #fff3bf; border-color: #fab005; border-style: solid; color: #b07e05; pointer-events: none; }
.media-btn.done { background: #e6fcf5; border-color: #20c997; border-style: solid; color: #087f5b; }

/* Form Elements */
.form-row { display: flex; gap: 12px; flex-wrap: wrap; }
.half { flex: 1; min-width: 150px; }
.form-group { margin-bottom: 15px; }
label { display: block; font-size: 0.85em; font-weight: 600; color: #495057; margin-bottom: 6px; }
select, input[type="text"], input[type="number"], textarea { width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 6px; font-size: 0.95em; background: #fff; box-sizing: border-box; }
textarea { height: 70px; resize: none; }

.slider-wrapper { display: flex; align-items: center; gap: 15px; background: #f8f9fa; padding: 8px; border-radius: 6px; border: 1px solid #dee2e6; flex-wrap: wrap; }
input[type="range"] { flex: 1; min-width: 100px; }
.slider-val { font-weight: 700; color: #1a73e8; font-size: 1.1em; min-width: 30px; text-align: center; }

.loading-state { text-align: center; padding: 20px; color: #888; font-style: italic; }

.modal-footer { padding: 16px 20px; background: white; border-top: 1px solid #e9ecef; }
.btn-save { width: 100%; padding: 14px; background: #2c3e50; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95em; }
.btn-save:disabled { background: #adb5bd; cursor: not-allowed; }

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 8px;
  }

  .modal-card {
    max-height: 95vh;
  }

  .modal-header {
    padding: 12px 16px;
  }

  .header-text h3 {
    font-size: 1em;
  }

  .form-scroll {
    padding: 12px;
  }

  .section-card {
    padding: 12px;
    margin-bottom: 12px;
  }

  .media-btn {
    padding: 12px;
    font-size: 0.85em;
    min-height: 50px;
  }

  .half {
    min-width: 100%;
  }

  .form-row {
    flex-direction: column;
  }

  select, input, textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal-card {
    width: 100%;
    max-height: 80vh;
    border-radius: 16px 16px 0 0;
  }

  .modal-header {
    padding: 12px 16px;
    flex-wrap: wrap;
  }

  .header-text h3 {
    font-size: 0.95em;
  }

  .gps-text {
    font-size: 0.7em;
  }

  .form-scroll {
    padding: 10px;
  }

  .section-card {
    padding: 10px;
  }

  .media-row {
    gap: 8px;
  }

  .media-btn {
    padding: 10px;
    font-size: 0.8em;
  }

  .modal-footer {
    padding: 12px 16px;
  }

  .btn-save {
    padding: 12px;
    font-size: 0.9em;
  }
}
</style>