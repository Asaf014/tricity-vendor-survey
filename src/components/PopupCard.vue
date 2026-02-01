<template>
  <div class="popup-card">
    <!-- Card Media -->
    <div v-if="data.media_data?.photo" class="card-media" :style="{backgroundImage: `url(${data.media_data.photo})`}">
      <div class="media-overlay"></div>
      <div class="media-badge" v-if="data.traffic">{{ data.traffic }}</div>
    </div>
    <div v-else class="card-media no-image">
      <div class="media-badge" v-if="data.traffic">{{ data.traffic }}</div>
    </div>

    <!-- Card Content -->
    <div class="card-inner">
      <div class="card-header">
        <div>
          <div class="card-type">{{ data.type || 'Unknown' }}</div>
          <div class="card-scout">{{ data.user_name || 'Scout' }}</div>
        </div>
      </div>

      <div v-if="data.created_at" class="card-meta">
        {{ formatDate(data.created_at) }}
      </div>

      <!-- Survey Data -->
      <div v-if="hasSurveyData" class="survey-data">
        <div v-for="(val, key) in filteredSurvey" :key="key" class="survey-item">
          <span class="survey-key">{{ key }}</span>
          <span class="survey-val">{{ val }}</span>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="data.notes" class="card-notes">
        "{{ data.notes }}"
      </div>

      <!-- Action Buttons -->
      <div class="card-actions">
        <a :href="streetViewLink" target="_blank" class="action-btn street-view">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
          Street View
        </a>
        <button class="action-btn edit" @click="handleEdit">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          Edit
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['edit']);

const hasSurveyData = computed(() => {
  return props.data.survey_data && Object.keys(props.data.survey_data).length > 0;
});

const filteredSurvey = computed(() => props.data.survey_data || {});

const streetViewLink = computed(() => {
  const lat = props.data.lat || 0;
  const lng = props.data.lng || 0;
  return `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;
});

function formatDate(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleEdit() {
  emit('edit', props.data);
}
</script>

<style scoped>
.popup-card {
  width: 100%;
  max-width: 300px;
  border-radius: 10px;
  overflow: hidden;
  background: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  box-sizing: border-box;
}

/* Card Media */
.card-media {
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  background-size: cover;
  background-position: center;
}

.card-media.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.9rem;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0));
}

.media-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 10;
}

/* Card Inner */
.card-inner {
  padding: 12px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-type {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
  margin-bottom: 2px;
  word-break: break-word;
}

.card-scout {
  font-size: 0.8rem;
  color: #6b7280;
}

.card-meta {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 8px;
}

/* Survey Data */
.survey-data {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.survey-item {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
}

.survey-key {
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.survey-val {
  color: #1f2937;
  font-weight: 600;
  margin-top: 2px;
  word-break: break-word;
}

/* Notes */
.card-notes {
  font-size: 0.8rem;
  color: #4b5563;
  font-style: italic;
  margin-bottom: 8px;
  padding: 6px 0;
}

/* Action Buttons */
.card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 80px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #1f2937;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.action-btn:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.action-btn.edit {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.action-btn.edit:hover {
  background: #1d4ed8;
}

.action-btn.street-view {
  background: #f3f4f6;
}

/* Responsive */
@media (max-width: 768px) {
  .popup-card {
    max-width: 85vw;
  }

  .card-media {
    height: 120px;
  }

  .card-type {
    font-size: 0.9rem;
  }

  .card-scout {
    font-size: 0.75rem;
  }

  .action-btn {
    font-size: 0.7rem;
    padding: 6px 8px;
  }
}

@media (max-width: 480px) {
  .popup-card {
    max-width: 90vw;
  }

  .card-media {
    height: 100px;
  }

  .card-inner {
    padding: 10px;
  }

  .card-type {
    font-size: 0.85rem;
  }

  .media-badge {
    font-size: 0.65rem;
    padding: 3px 8px;
  }

  .survey-data {
    padding: 6px;
    gap: 6px;
  }

  .action-btn {
    font-size: 0.65rem;
    padding: 5px 6px;
    min-width: 70px;
  }

  .card-actions {
    gap: 4px;
  }
}
</style>