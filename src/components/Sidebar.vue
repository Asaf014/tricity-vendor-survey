<template>
  <div class="sidebar" :class="{ 'open': isOpen }">
    <div class="sidebar-header">
      <h3>Project Console</h3>
      <button @click="('close')" class="close-btn">&times;</button>
    </div>

    <div class="tab-nav">
      <button :class="{ active: currentTab === 'template' }" @click="currentTab = 'template'">Form Template</button>
      <button :class="{ active: currentTab === 'logs' }" @click="currentTab = 'logs'">Data Logs</button>
    </div>

    <div v-if="currentTab === 'template'" class="tab-content">
      <div class="card add-field-card">
        <h4>Add New Field</h4>
        
        <div class="input-group">
          <label>Label</label>
          <input v-model="newField.label" placeholder="e.g. Noise Level" />
        </div>

        <div class="row">
          <div class="input-group half">
            <label>Type</label>
            <select v-model="newField.field_type">
              <option value="dropdown">Dropdown</option>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="slider">Slider</option>
              <option value="toggle">Toggle (Yes/No)</option>
            </select>
          </div>
          <div class="input-group half">
            <label>Group</label>
            <select v-model="newField.category_group">
              <option>Identity</option>
              <option>Spatial</option>
              <option>Economic</option>
              <option>Health</option>
              <option>Infrastructure</option>
            </select>
          </div>
        </div>

        <div v-if="newField.field_type === 'dropdown'" class="input-group">
          <label>Options (comma separated)</label>
          <input v-model="newField.optionsStr" placeholder="e.g. Yes, No, Maybe" />
        </div>

        <div v-if="['slider', 'number'].includes(newField.field_type)" class="row">
          <div class="input-group half">
            <label>Min</label>
            <input type="number" v-model="newField.min_val" />
          </div>
          <div class="input-group half">
            <label>Max</label>
            <input type="number" v-model="newField.max_val" />
          </div>
        </div>

        <button @click="addField" class="btn-add">Add to App</button>
      </div>

      <div class="card field-list">
        <h4>Current Fields</h4>
        <div v-for="field in formSchema" :key="field.id" class="field-item">
          <div class="field-info">
            <span class="field-name">{{ field.label }}</span>
            <span class="field-meta">{{ field.field_type }} • {{ field.category_group }}</span>
          </div>
          <button @click="deleteField(field.id)" class="btn-del">&times;</button>
        </div>
      </div>
    </div>

    <div v-if="currentTab === 'logs'" class="tab-content">
      <div v-for="log in logs" :key="log.id" class="log-entry">
        <strong>{{ log.type }}</strong>
        <small>{{ new Date(log.created_at).toLocaleDateString() }}</small>
        <button v-if="isAdmin" @click="deleteLog(log.id)" class="btn-text-del">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

const props = defineProps(['isOpen', 'isAdmin']);
const currentTab = ref('template');
const logs = ref([]);
const formSchema = ref([]);
const newField = ref({ 
  label: '', field_type: 'dropdown', category_group: 'General', 
  optionsStr: '', min_val: 0, max_val: 100 
});

onMounted(() => {
  fetchSchema();
  fetchLogs();
});

async function fetchSchema() {
  const { data } = await supabase.from('form_schema').select('*').order('created_at');
  if (data) formSchema.value = data;
}

async function fetchLogs() {
  const { data } = await supabase.from('vendors').select('*').limit(50);
  if (data) logs.value = data;
}

async function addField() {
  const payload = {
    label: newField.value.label,
    field_type: newField.value.field_type,
    category_group: newField.value.category_group,
    min_val: newField.value.min_val,
    max_val: newField.value.max_val,
    options: newField.value.optionsStr ? newField.value.optionsStr.split(',').map(s => s.trim()) : null
  };

  await supabase.from('form_schema').insert([payload]);
  fetchSchema();
  // Reset form
  newField.value.label = '';
}

async function deleteField(id) {
  if (confirm('Delete this field?')) {
    await supabase.from('form_schema').delete().match({ id });
    fetchSchema();
  }
}

async function deleteLog(id) {
  if (confirm('Delete log?')) {
    await supabase.from('vendors').delete().match({ id });
    fetchLogs();
  }
}
</script>

<style scoped>
.sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 340px; background: #f4f6f8; z-index: 2500; box-shadow: 4px 0 20px rgba(0,0,0,0.15); transform: translateX(-100%); transition: 0.3s; display: flex; flex-direction: column; font-family: 'Segoe UI', sans-serif; }
.sidebar.open { transform: translateX(0); }

.sidebar-header { padding: 20px; background: #2c3e50; color: white; display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: none; border: none; font-size: 24px; color: white; cursor: pointer; }

.tab-nav { display: flex; background: white; border-bottom: 1px solid #ddd; }
.tab-nav button { flex: 1; padding: 15px; border: none; background: none; cursor: pointer; font-weight: 600; color: #777; }
.tab-nav button.active { color: #2c3e50; border-bottom: 3px solid #2c3e50; }

.tab-content { padding: 15px; overflow-y: auto; flex: 1; }
.card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 15px; }

.input-group { margin-bottom: 10px; }
.row { display: flex; gap: 10px; }
.half { flex: 1; }
label { display: block; font-size: 0.8em; font-weight: bold; margin-bottom: 5px; color: #555; }
input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }

.btn-add { width: 100%; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.btn-del { background: none; border: none; color: red; font-weight: bold; cursor: pointer; font-size: 1.2em; }
.field-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
.field-name { font-weight: 600; display: block; }
.field-meta { font-size: 0.75em; color: #888; }
.log-entry { background: white; padding: 10px; margin-bottom: 5px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
.btn-text-del { background: none; border: none; color: red; cursor: pointer; font-size: 0.8em; }
</style>