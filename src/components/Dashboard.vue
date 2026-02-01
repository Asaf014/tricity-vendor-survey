<template>
  <div class="dashboard-root">
    <header class="dash-header">
      <div>
        <h2>Analytics Console</h2>
        <span class="subtitle">Real-time Urban Data Intelligence</span>
      </div>
      <div class="meta-row">
        <span class="status-dot"></span> Live • {{ lastUpdated }}
      </div>
    </header>

    <section class="kpi-row">
      <div class="kpi-card blue">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpis[0].value }}</div>
          <div class="kpi-label">Total Vendors</div>
        </div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpis[1].value }}</div>
          <div class="kpi-label">High Risk Points</div>
        </div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpis[2].value }}</div>
          <div class="kpi-label">Active Scouts</div>
        </div>
      </div>
    </section>

    <section class="activity-section card">
      <div class="section-header">
        <h3>Temporal Activity Map</h3>
        <div class="zoom-controls">
          <span class="zoom-label">Year</span>
          <input type="range" min="0" max="100" v-model="zoomLevel" class="zoom-slider" @input="handleZoom" />
          <span class="zoom-label">Week</span>
        </div>
      </div>

      <div class="zoom-viewport">
        <svg 
          class="activity-svg" 
          :viewBox="viewBoxString" 
          preserveAspectRatio="none"
        >
          <g v-for="(week, wIdx) in heatmapData" :key="'w'+wIdx" :transform="`translate(${wIdx * 12}, 0)`">
            <g v-for="(day, dIdx) in week" :key="'d'+dIdx">
              <rect 
                :y="dIdx * 12" 
                width="10" 
                height="10" 
                rx="2" 
                :fill="heatColor(day.count)" 
                class="heat-rect"
                :style="{ opacity: 1 - (zoomLevel/100) }"
              />
              
              <rect 
                :x="0"
                :y="80 - (Math.min(day.count, 20) * 4)" 
                width="10" 
                :height="Math.min(day.count, 20) * 4" 
                rx="1" 
                fill="#3498db" 
                class="bar-rect"
                :style="{ opacity: (zoomLevel/100) }"
              />
              
              <text 
                v-if="zoomLevel > 50"
                x="5" 
                y="90" 
                font-size="4" 
                text-anchor="middle" 
                fill="#666"
                :opacity="(zoomLevel-50)/50"
              >{{ day.label }}</text>
            </g>
          </g>
        </svg>
      </div>
      <div class="activity-footer">
        Zoom into specific weeks to analyze daily upload spikes.
      </div>
    </section>

    <section class="analysis-grid">
      
      <div class="card chart-card">
        <div class="chart-header">
          <h3>Traffic Impact by Category</h3>
          <div class="legend-row">
            <span class="dot low"></span> Low
            <span class="dot med"></span> Med
            <span class="dot high"></span> High
          </div>
        </div>
        <div class="chart-body">
          <div v-for="(cat, idx) in trafficAnalysis" :key="idx" class="stack-row">
            <div class="row-label">{{ cat.type }}</div>
            <div class="stack-track">
              <div class="segment low" :style="{width: cat.low + '%'}" title="Low Traffic"></div>
              <div class="segment med" :style="{width: cat.med + '%'}" title="Medium Traffic"></div>
              <div class="segment high" :style="{width: cat.high + '%'}" title="High Traffic"></div>
            </div>
            <div class="row-total">{{ cat.total }}</div>
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <h3>Peak Activity Hours</h3>
        <div class="svg-wrapper">
          <svg viewBox="0 0 100 50" class="line-chart">
            <defs>
              <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(52, 152, 219, 0.5)" />
                <stop offset="100%" stop-color="rgba(52, 152, 219, 0)" />
              </linearGradient>
            </defs>
            <path :d="peakHoursPath + ' V 50 H 0 Z'" fill="url(#lineGrad)" />
            <path :d="peakHoursPath" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" />
            <text x="0" y="48" font-size="4" fill="#999">6AM</text>
            <text x="50" y="48" font-size="4" fill="#999">12PM</text>
            <text x="95" y="48" font-size="4" fill="#999">6PM</text>
          </svg>
        </div>
        <div class="chart-footer">Busiest time: <strong>{{ busiestHour }}</strong></div>
      </div>

      <div class="card chart-card">
        <h3>Vendor Mix</h3>
        <div class="donut-layout">
          <svg viewBox="0 0 42 42" class="donut-svg">
            <circle r="15.915" cx="21" cy="21" stroke="#f0f2f5" stroke-width="6" fill="transparent" />
            <circle v-for="(slice, i) in donutSlices" :key="i" 
              r="15.915" cx="21" cy="21" 
              :stroke="slice.color" stroke-width="6" fill="transparent"
              :stroke-dasharray="slice.dash" :stroke-dashoffset="slice.offset" 
              class="donut-segment" />
          </svg>
          <div class="donut-legend">
            <div v-for="d in donutData" :key="d.label" class="leg-item">
              <span class="swatch" :style="{background:d.color}"></span>
              <span>{{ d.label }}</span>
              <span class="val">{{ d.value }}%</span>
            </div>
          </div>
        </div>
      </div>

    </section>

    <div class="dash-footer">
      <button @click="$emit('export')" class="action-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        Export Full Report
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../supabase';

const kpis = ref([
  { value: 0 }, { value: 0 }, { value: 0 }
]);

const lastUpdated = ref(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
const zoomLevel = ref(0);
const heatmapData = ref([]);
const logs = ref([]);

// Data buckets
const donutData = ref([]);
const trafficAnalysis = ref([]);
const peakHoursData = ref(new Array(24).fill(0));

// --- ZOOM LOGIC ---
// We manipulate the viewBox to simulate zoom.
// Year View: 0 0 624 84 (Show all 52 weeks)
// Week View: focusX 0 100 100 (Show only ~8 weeks)
const viewBoxString = computed(() => {
  const z = zoomLevel.value;
  // Interpolate Width: 624 (Year) -> 84 (Week)
  const width = 624 - ((624 - 84) * (z / 100));
  
  // Interpolate X position: 
  // We want to zoom into the LAST recorded week (far right)
  const maxX = 624 - width; 
  const x = maxX; // Simple Right-Align Zoom
  
  return `${x} 0 ${width} 100`;
});

function handleZoom() {
  // Logic to switch detail levels could go here
}

// --- DATA PROCESSING ---
onMounted(async () => {
  const { data } = await supabase.from('vendors').select('*');
  if (data) {
    logs.value = data;
    processKPIs(data);
    processHeatmap(data);
    processTrafficStack(data);
    processPeakHours(data);
    processDonut(data);
  }
});

function processKPIs(data) {
  kpis.value[0].value = data.length;
  kpis.value[1].value = data.filter(d => (d.traffic || '').toLowerCase() === 'high').length;
  const uniqueScouts = new Set(data.map(d => d.user_id));
  kpis.value[2].value = uniqueScouts.size;
}

function processHeatmap(data) {
  // Create 52 weeks of data
  const grid = [];
  const now = new Date();
  
  // Group logs by Date string "YYYY-MM-DD"
  const counts = {};
  data.forEach(d => {
    const k = d.created_at.slice(0, 10);
    counts[k] = (counts[k] || 0) + 1;
  });

  // Build grid backwards from today
  for (let w = 0; w < 52; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() - ((51-w)*7 + (6-d))); // Reverse order for Left->Right timeline
      const k = date.toISOString().slice(0, 10);
      week.push({ 
        count: counts[k] || 0,
        label: `${date.getDate()}/${date.getMonth()+1}`
      });
    }
    grid.push(week);
  }
  heatmapData.value = grid;
}

function processTrafficStack(data) {
  // { Food: {low: 10, med: 5, high: 2, total: 17}, ... }
  const groups = {};
  
  data.forEach(d => {
    let type = (d.type || 'Other').split(' ')[0]; // Simplify "Fresh Produce" -> "Fresh"
    if (!groups[type]) groups[type] = { type, low: 0, med: 0, high: 0, total: 0 };
    
    const traffic = (d.traffic || 'low').toLowerCase();
    if (traffic.includes('high')) groups[type].high++;
    else if (traffic.includes('medium')) groups[type].med++;
    else groups[type].low++;
    
    groups[type].total++;
  });

  // Convert to Array & Calculate Percentages
  trafficAnalysis.value = Object.values(groups).map(g => {
    if(g.total === 0) return g;
    // Store as percentages for the bar width
    g.low = (g.low / g.total) * 100;
    g.med = (g.med / g.total) * 100;
    g.high = (g.high / g.total) * 100;
    return g;
  }).slice(0, 5); // Top 5 categories
}

function processPeakHours(data) {
  const hours = new Array(24).fill(0);
  data.forEach(d => {
    const h = new Date(d.created_at).getHours();
    hours[h]++;
  });
  peakHoursData.value = hours;
}

function processDonut(data) {
  const counts = { Food: 0, Goods: 0, Services: 0 };
  data.forEach(d => {
    const t = (d.type || '').toLowerCase();
    if (t.includes('food') || t.includes('fresh')) counts.Food++;
    else if (t.includes('cloth') || t.includes('good')) counts.Goods++;
    else counts.Services++;
  });
  
  const total = data.length || 1;
  donutData.value = [
    { label: 'Food', value: Math.round((counts.Food/total)*100), color: '#e74c3c' },
    { label: 'Goods', value: Math.round((counts.Goods/total)*100), color: '#3498db' },
    { label: 'Services', value: Math.round((counts.Services/total)*100), color: '#f1c40f' }
  ];
}

// --- VISUAL HELPERS ---

const peakHoursPath = computed(() => {
  const max = Math.max(...peakHoursData.value, 1);
  // Generate SVG Path "M 0 y0 L 5 y1 L 10 y2..."
  let d = `M 0 ${50 - (peakHoursData.value[6]/max)*40}`; // Start at 6AM index
  // Show only 6AM (idx 6) to 8PM (idx 20) for cleaner chart
  for(let i=6; i<=20; i++) {
    const x = ((i-6) / 14) * 100; // Map 14 hours to 100% width
    const y = 50 - ((peakHoursData.value[i] || 0) / max) * 45;
    d += ` L ${x} ${y}`;
  }
  return d;
});

const busiestHour = computed(() => {
  const maxIdx = peakHoursData.value.indexOf(Math.max(...peakHoursData.value));
  return `${maxIdx}:00 - ${maxIdx+1}:00`;
});

const donutSlices = computed(() => {
  let acc = 0;
  return donutData.value.map(d => {
    const dash = `${d.value} ${100 - d.value}`;
    const offset = -acc;
    acc += d.value;
    return { color: d.color, dash, offset };
  });
});

function heatColor(count) {
  if (count === 0) return '#ebedf0';
  if (count < 3) return '#9be9a8';
  if (count < 6) return '#40c463';
  if (count < 10) return '#30a14e';
  return '#216e39';
}
</script>

<style scoped>
.dashboard-root { font-family: 'Inter', system-ui, sans-serif; color: #2c3e50; width: 100%; padding: 0; }

/* HEADER */
.dash-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 12px; gap: 16px; flex-wrap: wrap; }
h2 { margin: 0; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.5px; }
.subtitle { font-size: 0.85rem; color: #7f8c8d; font-weight: 500; }
.meta-row { font-size: 0.75rem; color: #95a5a6; display: flex; align-items: center; gap: 6px; }
.status-dot { width: 8px; height: 8px; background: #2ecc71; border-radius: 50%; box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.2); animation: pulse 2s infinite; }

/* KPI CARDS */
.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.05); transition: transform 0.2s; }
.kpi-card:hover { transform: translateY(-2px); }
.kpi-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.blue .kpi-icon { background: linear-gradient(135deg, #3498db, #2980b9); }
.red .kpi-icon { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.green .kpi-icon { background: linear-gradient(135deg, #2ecc71, #27ae60); }
.kpi-value { font-size: 1.8rem; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.kpi-label { font-size: 0.75rem; text-transform: uppercase; color: #7f8c8d; font-weight: 600; letter-spacing: 0.5px; }

/* ACTIVITY ZOOMER */
.activity-section { margin-bottom: 24px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f0f2f5; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.zoom-controls { display: flex; align-items: center; gap: 12px; background: #f8f9fa; padding: 4px 12px; border-radius: 20px; flex-wrap: wrap; }
.zoom-label { font-size: 0.75rem; font-weight: 600; color: #7f8c8d; white-space: nowrap; }
.zoom-slider { width: 120px; cursor: pointer; }
.zoom-viewport { height: 120px; overflow: hidden; position: relative; border-bottom: 1px solid #eee; }
.activity-svg { width: 100%; height: 100%; transition: opacity 0.3s; }
.heat-rect { transition: opacity 0.5s; }
.bar-rect { transition: opacity 0.5s, height 0.5s; }
.activity-footer { margin-top: 10px; font-size: 0.8rem; color: #95a5a6; text-align: center; font-style: italic; }

/* CHARTS GRID */
.analysis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
.chart-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.03); border: 1px solid #f0f2f5; display: flex; flex-direction: column; }
.chart-card h3 { margin: 0 0 16px 0; font-size: 0.95rem; font-weight: 700; color: #34495e; }

/* Stacked Bar */
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
.legend-row { display: flex; gap: 10px; font-size: 0.7rem; color: #7f8c8d; flex-wrap: wrap; }
.dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.low { background: #2ecc71; } .med { background: #f1c40f; } .high { background: #e74c3c; }

.stack-row { display: flex; align-items: center; margin-bottom: 10px; font-size: 0.8rem; gap: 8px; }
.row-label { flex-shrink: 0; font-weight: 600; color: #2c3e50; min-width: 60px; }
.stack-track { flex: 1; min-width: 80px; height: 8px; background: #f0f2f5; border-radius: 4px; overflow: hidden; display: flex; }
.segment { height: 100%; }
.row-total { flex-shrink: 0; text-align: right; font-weight: 700; color: #95a5a6; font-size: 0.75rem; min-width: 30px; }

/* Line Chart */
.svg-wrapper { flex: 1; min-height: 100px; display: flex; align-items: flex-end; }
.line-chart { width: 100%; height: 100%; overflow: visible; }
.chart-footer { margin-top: 10px; font-size: 0.8rem; color: #2c3e50; text-align: center; padding-top: 10px; border-top: 1px solid #f8f9fa; }

/* Donut */
.donut-layout { display: flex; align-items: center; gap: 16px; flex: 1; flex-wrap: wrap; }
.donut-svg { width: 80px; height: 80px; flex-shrink: 0; }
.donut-segment { transition: stroke-dasharray 0.5s ease; }
.donut-legend { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; flex: 1; }
.leg-item { display: flex; align-items: center; gap: 6px; }
.swatch { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.val { font-weight: 700; color: #2c3e50; margin-left: auto; }

/* Footer */
.dash-footer { display: flex; justify-content: flex-end; margin-top: 24px; }
.action-btn { background: #2c3e50; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s; }
.action-btn:hover { background: #34495e; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* Tablet & Smaller Screens */
@media (max-width: 1200px) {
  .dashboard-root {
    padding: 16px;
  }

  h2 {
    font-size: 1.3rem;
  }

  .kpi-row {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 900px) {
  .dashboard-root {
    padding: 12px;
  }

  h2 {
    font-size: 1.2rem;
  }

  .dash-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-row {
    width: 100%;
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .kpi-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .zoom-controls {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .dashboard-root {
    padding: 8px;
  }

  h2 {
    font-size: 1.1rem;
  }

  .kpi-card {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }

  .kpi-icon {
    width: 40px;
    height: 40px;
  }

  .kpi-value {
    font-size: 1.5rem;
  }

  .kpi-label {
    font-size: 0.7rem;
  }

  .chart-card {
    padding: 12px;
  }

  .chart-card h3 {
    font-size: 0.85rem;
  }

  .section-header {
    flex-direction: column;
  }

  .zoom-slider {
    width: 100%;
  }

  .zoom-controls {
    flex-direction: column;
    width: 100%;
  }

  .stack-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .row-label {
    width: 100%;
  }

  .stack-track {
    width: 100%;
    margin: 4px 0;
  }

  .row-total {
    width: 100%;
  }

  .legend-row {
    justify-content: center;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>