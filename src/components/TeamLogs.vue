<template>
  <div class="teamlogs-root">
    <header class="tl-header">
      <h3>Team Activity</h3>
      <div class="tl-sub">Grouped by teammate — Recent commits style</div>
    </header>

    <div class="stream">
      <div v-for="(logs, teammate) in grouped" :key="teammate" class="teammate-group card">
        <div class="teammate-header">
          <div class="avatar">{{ initials(teammate) }}</div>
          <div class="info"><div class="name">{{ teammate }}</div><div class="meta">{{ logs.length }} actions</div></div>
        </div>
        <ol class="activity-list">
          <li v-for="l in logs.slice().reverse()" :key="l.id" class="activity-item">
            <div class="time">{{ shortDate(l.created_at) }}</div>
            <div class="msg"><strong>{{ l.user_name }}</strong> {{ actionText(l) }} <span class="muted">• {{ relTime(l.created_at) }}</span></div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ logs: { type: Array, default: () => [] } });

const grouped = computed(() => {
  return props.logs.reduce((acc, l)=>{ const key = l.user_name || 'Unknown'; acc[key] = acc[key] || []; acc[key].push(l); return acc; }, {});
});

function initials(name){ return (name||'U').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase(); }
function shortDate(s){ return s? new Date(s).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }):''; }
function relTime(s){ const diff = Date.now() - new Date(s); const mins = Math.floor(diff/60000); if (mins<60) return mins+'m'; const hrs=Math.floor(mins/60); if (hrs<24) return hrs+'h'; return Math.floor(hrs/24)+'d'; }
function actionText(l){ if (l.type) return `added ${l.type}`; return 'updated dataset'; }
</script>

<style scoped>
.teamlogs-root { font-family: Inter, Roboto, system-ui; }
.tl-header { margin-bottom: 10px }
.stream { display:flex; flex-direction:column; gap:10px }
.card { background: rgba(255,255,255,0.6); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); padding:10px; border-radius:10px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
.teammate-header { display:flex; gap:10px; align-items:center }
.avatar { width:40px; height:40px; border-radius:8px; background:#3498db; color:white; display:flex; align-items:center; justify-content:center; font-weight:700 }
.activity-list { list-style:none; margin:8px 0 0; padding:0; }
.activity-item { display:flex; gap:12px; align-items:flex-start; padding:8px 0; border-top:1px solid rgba(0,0,0,0.04); }
.time { width:70px; font-size:12px; color:#6b7785 }
.msg { font-size:14px }
.muted { color:#6b7785; font-size:12px }
</style>