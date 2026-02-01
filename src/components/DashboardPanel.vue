<template>
  <div class="dashboard-panel">
    <h2>Analytics Console</h2>
    <p class="subtitle">Real-time Urban Data Intelligence</p>

    <div class="panel-actions">
      <button class="action small" @click="$emit('locate')">Locate Me</button>
      <button class="action small" @click="$emit('open-add')">Add Data</button>
      <button class="action small outline" @click="$emit('start-draw')">Draw Zone</button>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-number">{{ totalVendors }}</div>
        <div class="kpi-label">Total Vendors</div>
      </div>
      <div class="kpi-card danger">
        <div class="kpi-number">{{ highRiskCount }}</div>
        <div class="kpi-label">High Risk</div>
      </div>
      <div class="kpi-card success">
        <div class="kpi-number">{{ activeScouts }}</div>
        <div class="kpi-label">Active Scouts</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="chart-section">
      <h3>Activity Timeline</h3>
      <apexchart type="area" :options="timelineChartOptions" :series="timelineChartSeries" height="200" />
    </div>

    <div class="chart-section">
      <h3>Vendor Mix by Traffic</h3>
      <apexchart type="bar" :options="vendorMixOptions" :series="vendorMixSeries" height="250" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

const props = defineProps({ logs: { type: Array, default: () => [] } });
const emit = defineEmits(['start-draw', 'locate', 'open-add']);

const totalVendors = computed(() => props.logs.length);
const highRiskCount = computed(() => props.logs.filter(l => (l.traffic || '').toLowerCase() === 'high').length);
const activeScouts = computed(() => new Set(props.logs.map(l => l.user_id)).size);

const timelineChartOptions = computed(() => ({
  chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false } },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.1 } },
  xaxis: { type: 'datetime', categories: generateDates() },
  yaxis: { title: { text: 'Logs per Day' } },
  colors: ['#2563EB'],
  grid: { borderColor: '#e5e7eb', strokeDashArray: 4 }
}));

const timelineChartSeries = computed(() => {
  const counts = {};
  props.logs.forEach(log => {
    const date = new Date(log.created_at).toLocaleDateString();
    counts[date] = (counts[date] || 0) + 1;
  });
  return [{
    name: 'Logs',
    data: generateDates().map(date => counts[date] || 0)
  }];
});

const vendorMixOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  xaxis: { categories: ['Food', 'Goods', 'Services'] },
  yaxis: { title: { text: 'Count' } },
  legend: { position: 'top' },
  colors: ['#EF4444', '#F59E0B', '#10B981'],
  grid: { borderColor: '#e5e7eb' }
}));

const vendorMixSeries = computed(() => {
  const categories = { Food: { Low: 0, Medium: 0, High: 0 }, Goods: { Low: 0, Medium: 0, High: 0 }, Services: { Low: 0, Medium: 0, High: 0 } };
  
  props.logs.forEach(log => {
    const type = log.type?.split(' ')[0] || 'Services';
    const traffic = (log.traffic || 'Low').toLowerCase();
    if (categories[type]) {
      const key = traffic.charAt(0).toUpperCase() + traffic.slice(1);
      if (categories[type][key] !== undefined) categories[type][key]++;
    }
  });

  return [
    { name: 'Low', data: [categories.Food.Low, categories.Goods.Low, categories.Services.Low] },
    { name: 'Medium', data: [categories.Food.Medium, categories.Goods.Medium, categories.Services.Medium] },
    { name: 'High', data: [categories.Food.High, categories.Goods.High, categories.Services.High] }
  ];
});

function generateDates(days = 14) {
  const dates = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toLocaleDateString());
  }
  return dates;
}
</script>

<style scoped>
.dashboard-panel { padding: 0; width: 100%; }
h2 { margin: 0 0 4px 0; font-size: 1.3rem; font-weight: 700; color: #1F2937; }
.subtitle { margin: 0 0 16px 0; color: #6B7280; font-size: 0.9rem; }

.kpi-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px; }
.kpi-card { background: linear-gradient(135deg, #DBEAFE, #E0F2FE); padding: 16px; border-radius: 8px; border-left: 4px solid #2563EB; }
.kpi-card.danger { background: linear-gradient(135deg, #FEE2E2, #FEF2F2); border-left-color: #EF4444; }
.kpi-card.success { background: linear-gradient(135deg, #DCFCE7, #F0FDF4); border-left-color: #10B981; }
.kpi-number { font-size: 2rem; font-weight: 700; color: #1F2937; }
.kpi-label { font-size: 0.85rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

.chart-section { margin-bottom: 20px; background: #FFFFFF; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB; width: 100%; box-sizing: border-box; }
.chart-section h3 { margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 600; color: #1F2937; }

.panel-actions { display: flex; gap: 8px; margin: 12px 0 16px 0; flex-wrap: wrap; }
.action { padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; min-width: fit-content; }
.action.small { padding: 6px 10px; font-size: 0.85rem; }
.action.outline { background: transparent; border: 1px solid #e5e7eb; color: #2563EB; }
.action:not(.outline) { background: #2563EB; color: white; }
.action:hover { opacity: 0.9; }

@media (max-width: 900px) {
  h2 { font-size: 1.1rem; }
  .subtitle { font-size: 0.8rem; }
  .kpi-number { font-size: 1.5rem; }
  .action.small { padding: 5px 8px; font-size: 0.8rem; }
}

@media (max-width: 600px) {
  h2 { font-size: 1rem; }
  .kpi-card { padding: 12px; }
  .kpi-number { font-size: 1.3rem; }
  .kpi-label { font-size: 0.75rem; }
  .chart-section { padding: 12px; }
  .panel-actions { flex-direction: column; }
  .action { width: 100%; text-align: center; padding: 8px; }
}
</style>