<template>
  <div class="sidebar" :class="{ 'open': isOpen }">
    <div class="sidebar-header">
      <div class="header-content">
        <h3>Admin Console</h3>
        <span v-if="isAdmin" class="admin-badge">ADMIN</span>
      </div>
      <button @click="$emit('close')" class="icon-btn close-btn" title="Close Menu">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>

    <div class="tab-nav">
      <button :class="{ active: currentTab === 'dashboard' }" @click="currentTab = 'dashboard'">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        Dashboard
      </button>
      <button :class="{ active: currentTab === 'template' }" @click="currentTab = 'template'">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        Builder
      </button>
      <button :class="{ active: currentTab === 'logs' }" @click="currentTab = 'logs'">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg>
        Logs
      </button>
    </div>

    <div class="scroll-container">
      
      <div v-if="currentTab === 'dashboard'" class="tab-content">
        <Dashboard :logs="logs" @export="downloadCSV" />
      </div>

      <div v-if="currentTab === 'template'" class="tab-content">
        <div class="card add-field-card">
          <div class="card-header">
            <h4>New Field</h4>
          </div>
          
          <div class="form-body">
            <div class="input-group">
              <label>Field Label</label>
              <input v-model="newField.label" placeholder="e.g. Roof Material" />
            </div>

            <div class="row">
              <div class="input-group half">
                <label>Input Type</label>
                <div class="select-wrapper">
                  <select v-model="newField.field_type">
                    <option value="dropdown">Dropdown</option>
                    <option value="text">Text Input</option>
                    <option value="number">Number</option>
                    <option value="slider">Slider (Range)</option>
                    <option value="toggle">Yes/No Toggle</option>
                  </select>
                </div>
              </div>
              <div class="input-group half">
                <label>Category</label>
                <div class="select-wrapper">
                  <select v-model="newField.category_group">
                    <option>Identity</option>
                    <option>Spatial</option>
                    <option>Economic</option>
                    <option>Health</option>
                    <option>Infrastructure</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="newField.field_type === 'dropdown'" class="input-group">
              <label>Options (Comma Separated)</label>
              <input v-model="newField.optionsStr" placeholder="Option A, Option B, Option C" />
            </div>

            <div v-if="['slider', 'number'].includes(newField.field_type)" class="row">
              <div class="input-group half">
                <label>Min Value</label>
                <input type="number" v-model.number="newField.min_val" />
              </div>
              <div class="input-group half">
                <label>Max Value</label>
                <input type="number" v-model.number="newField.max_val" />
              </div>
            </div>

            <button @click="addField" class="btn-primary">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              Create Field
            </button>
          </div>
        </div>

        <div class="card field-list">
          <div class="card-header">
            <h4>Active Template Fields</h4>
          </div>
          <div v-for="field in formSchema" :key="field.id" class="list-item">
            <div class="item-info">
              <span class="item-title">{{ field.label }}</span>
              <span class="item-meta">{{ field.field_type }}  {{ field.category_group }}</span>
            </div>
            <button @click="deleteField(field.id)" class="icon-btn delete" title="Delete Field">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 'logs'" class="tab-content">
        <div class="card log-list">
           <div class="card-header">
            <h4>Data Entries ({{ logs.length }})</h4>
          </div>
          <div v-for="log in logs" :key="log.id" class="list-item">
            <div class="item-info">
              <span class="item-title">{{ log.type }}</span>
              <span class="item-meta">{{ log.user_name }}  {{ new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
            </div>
            <button v-if="isAdmin" @click="deleteLog(log.id)" class="icon-btn delete" title="Delete Log">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import Dashboard from './Dashboard.vue';

const props = defineProps(['isOpen', 'isAdmin', 'user']);
const currentTab = ref('dashboard');
const logs = ref([]);
const formSchema = ref([]);

const newField = ref({ 
  label: '', field_type: 'dropdown', category_group: 'Identity', 
  optionsStr: '', min_val: 0, max_val: 10 
});

onMounted(() => {
  fetchData();
});

async function fetchData() {
  const { data: logData } = await supabase.from('vendors').select('*').order('created_at', { ascending: false }).limit(1000);
  if (logData) logs.value = logData;

  const { data: schemaData } = await supabase.from('form_schema').select('*').order('created_at');
  if (schemaData) formSchema.value = schemaData;
}

function downloadCSV() {
  if (logs.value.length === 0) return alert("No data to export.");

  try {
    const dynamicKeys = new Set();
    logs.value.forEach(row => {
      if (row.survey_data) Object.keys(row.survey_data).forEach(k => dynamicKeys.add(k));
    });
    const sortedKeys = Array.from(dynamicKeys).sort();

    const headers = ['ID', 'Date', 'Scout', 'Lat', 'Lng', 'Type', 'Traffic', 'Notes', 'Photo', 'Audio', ...sortedKeys];
    const csvRows = [headers.join(',')];

    logs.value.forEach(row => {
      const s = row.survey_data || {};
      const m = row.media_data || {};
      const clean = (t) => `"${String(t || '').replace(/"/g, '""')}"`;

      const rowData = [
        clean(row.id), clean(new Date(row.created_at).toLocaleString()), clean(row.user_name),
        row.lat, row.lng, clean(row.type), clean(row.traffic), clean(row.notes),
        clean(m.photo), clean(m.audio),
        ...sortedKeys.map(k => clean(s[k]))
      ];
      csvRows.push(rowData.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey_export.csv`;
    a.click();
  } catch (e) {
    alert("Export Error: " + e.message);
  }
}

async function addField() {
  if (!newField.value.label) return;
  const payload = {
    label: newField.value.label,
    field_type: newField.value.field_type,
    category_group: newField.value.category_group,
    options: newField.value.optionsStr ? newField.value.optionsStr.split(',').map(s=>s.trim()) : null,
    min_val: ['slider','number'].includes(newField.value.field_type) ? newField.value.min_val : null,
    max_val: ['slider','number'].includes(newField.value.field_type) ? newField.value.max_val : null
  };
  await supabase.from('form_schema').insert([payload]);
  fetchData();
  newField.value.label = '';
}

async function deleteField(id) {
  if(confirm('Delete field?')) {
    await supabase.from('form_schema').delete().match({ id });
    fetchData();
  }
}

async function deleteLog(id) {
  if(confirm('Delete record?')) {
    await supabase.from('vendors').delete().match({ id });
    fetchData();
  }
}
</script>

<style scoped>
/* Main Container */
.sidebar { 
  position: fixed; top: 0; left: 0; bottom: 0; 
  width: 350px; 
  background: #f4f6f8; 
  z-index: 2500; 
  box-shadow: 4px 0 20px rgba(0,0,0,0.15); 
  transform: translateX(-100%); 
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
  display: flex; flex-direction: column; 
  font-family: 'Inter', 'Segoe UI', sans-serif; 
}
.sidebar.open { transform: translateX(0); }

/* Header */
.sidebar-header { 
  padding: 16px 20px; 
  background: #2c3e50; 
  color: white; 
  display: flex; justify-content: space-between; align-items: center; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.header-content h3 { margin: 0; font-size: 1.1em; font-weight: 600; letter-spacing: 0.5px; }
.admin-badge { 
  background: #e74c3c; color: white; 
  font-size: 0.65em; font-weight: 700; 
  padding: 2px 6px; border-radius: 4px; 
  margin-left: 8px; vertical-align: middle;
}

/* Tabs */
.tab-nav { display: flex; background: white; border-bottom: 1px solid #e0e0e0; }
.tab-nav button { 
  flex: 1; padding: 12px; 
  border: none; background: none; 
  cursor: pointer; 
  font-weight: 600; color: #7f8c8d; font-size: 0.9em; 
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  transition: all 0.2s;
}
.tab-nav button svg { fill: #95a5a6; transition: fill 0.2s; }
.tab-nav button.active { color: #2c3e50; background: #fff; box-shadow: inset 0 -3px 0 #2c3e50; }
.tab-nav button.active svg { fill: #2c3e50; }
.tab-nav button:hover { background: #f8f9fa; }

/* Scroll Area */
.scroll-container { flex: 1; overflow-y: auto; padding: 15px; }

/* Cards & Layout */
.card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 15px; border: 1px solid #eaebec; overflow: hidden; }
.card-header { background: #f8f9fa; padding: 10px 15px; border-bottom: 1px solid #eaebec; }
.card-header h4 { margin: 0; font-size: 0.9em; text-transform: uppercase; color: #7f8c8d; font-weight: 700; letter-spacing: 0.5px; }
.form-body { padding: 15px; }

/* Form Elements */
.input-group { margin-bottom: 12px; }
.row { display: flex; gap: 12px; }
.half { flex: 1; }
label { display: block; font-size: 0.8em; font-weight: 600; margin-bottom: 6px; color: #34495e; }
input, select { 
  width: 100%; padding: 10px; 
  border: 1px solid #dfe6e9; border-radius: 6px; 
  font-size: 0.95em; color: #2c3e50; 
  background: #fff; box-sizing: border-box;
  transition: border 0.2s;
}
input:focus, select:focus { border-color: #3498db; outline: none; }

/* Buttons */
.btn-primary { 
  width: 100%; padding: 12px; 
  background: #2c3e50; color: white; 
  border: none; border-radius: 6px; 
  font-weight: 600; cursor: pointer; 
  display: flex; align-items: center; justify-content: center; gap: 8px; 
  margin-top: 10px; transition: background 0.2s; 
}
.btn-primary:hover { background: #34495e; }

.icon-btn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.icon-btn:hover { background: rgba(0,0,0,0.05); }
.icon-btn.delete svg { fill: #bdc3c7; transition: fill 0.2s; }
.icon-btn.delete:hover svg { fill: #e74c3c; }
.close-btn:hover { background: rgba(255,255,255,0.1); }

/* List Items */
.list-item { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 12px 15px; 
  border-bottom: 1px solid #f1f2f6; 
  transition: background 0.1s;
}
.list-item:last-child { border-bottom: none; }
.list-item:hover { background: #fafbfc; }
.item-info { display: flex; flex-direction: column; }
.item-title { font-weight: 600; color: #2c3e50; font-size: 0.95em; }
.item-meta { font-size: 0.75em; color: #95a5a6; margin-top: 2px; }
</style>