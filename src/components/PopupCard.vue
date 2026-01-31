<template>
  <div class="google-card">
    <div v-if="data.media_data?.photo" class="hero-image" :style="{ backgroundImage: 'url(' + data.media_data.photo + ')' }">
      <div class="overlay"></div>
    </div>

    <div class="card-content">
      <div class="header-row">
        <h3 class="title">{{ data.type || 'Unknown Vendor' }}</h3>
        <span class="traffic-badge" :class="trafficClass">{{ data.traffic || 'N/A' }} Traffic</span>
      </div>

      <div class="meta-row">
        <span class="meta-item">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#5f6368"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          {{ data.user_name || 'Scout' }}
        </span>
        <span class="meta-item">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#5f6368"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          {{ formatDate(data.created_at) }}
        </span>
      </div>

      <div v-if="hasSurveyData" class="data-grid">
        <div v-for="(val, key) in filteredSurvey" :key="key" class="data-point">
          <span class="label">{{ key }}</span>
          <span class="value">{{ val }}</span>
        </div>
      </div>

      <div v-if="data.notes" class="notes-section">
        "{{ data.notes }}"
      </div>

      <div class="card-actions">
        <a :href="googleMapsLink" target="_blank" class="btn-action direction">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#1a73e8"><path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>
          Directions
        </a>
        <a v-if="data.media_data?.photo" :href="data.media_data.photo" target="_blank" class="btn-action">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#1a73e8"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          View Photo
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['data']);

const trafficClass = computed(() => {
  const t = (props.data.traffic || '').toLowerCase();
  if (t === 'high') return 'red-badge';
  if (t === 'medium') return 'orange-badge';
  return 'green-badge';
});

const hasSurveyData = computed(() => props.data.survey_data && Object.keys(props.data.survey_data).length > 0);

const filteredSurvey = computed(() => {
  if (!props.data.survey_data) return {};
  // Exclude empty keys or internal system keys if any
  return props.data.survey_data;
});

const googleMapsLink = computed(() => {
  return https://www.google.com/maps/dir/?api=1&destination=,;
});

function formatDate(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
}
</script>

<style scoped>
/* Google Maps Style Card */
.google-card { font-family: 'Roboto', 'Segoe UI', sans-serif; width: 260px; overflow: hidden; }
.hero-image { height: 120px; background-size: cover; background-position: center; position: relative; margin: -1px -1px 0; /* Leaflet popup padding fix */ }
.overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(to top, rgba(0,0,0,0.6), transparent); }

.card-content { padding: 4px; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.title { margin: 0; font-size: 1.1em; font-weight: 500; color: #202124; line-height: 1.2; }

.traffic-badge { font-size: 0.65em; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.red-badge { background: #fce8e6; color: #c5221f; }
.orange-badge { background: #ffeecf; color: #b06000; }
.green-badge { background: #e6f4ea; color: #137333; }

.meta-row { display: flex; gap: 12px; font-size: 0.8em; color: #70757a; margin-bottom: 10px; }
.meta-item { display: flex; align-items: center; gap: 4px; }

.data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; background: #f8f9fa; padding: 8px; border-radius: 6px; }
.data-point { display: flex; flex-direction: column; }
.label { font-size: 0.65em; text-transform: uppercase; color: #5f6368; font-weight: 600; }
.value { font-size: 0.85em; color: #3c4043; font-weight: 500; }

.notes-section { font-size: 0.85em; font-style: italic; color: #5f6368; margin-bottom: 12px; border-left: 2px solid #ddd; padding-left: 8px; }

.card-actions { display: flex; border-top: 1px solid #e0e0e0; padding-top: 8px; gap: 10px; }
.btn-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; color: #1a73e8; font-size: 0.85em; font-weight: 600; padding: 6px; border-radius: 4px; transition: background 0.2s; border: 1px solid #dadce0; }
.btn-action:hover { background: #f1f3f4; }
.direction { background: #1a73e8; color: white; border: none; }
.direction svg { fill: white; }
.direction:hover { background: #1557b0; }
</style>