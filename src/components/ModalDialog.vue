<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop" @click="onBackdropClick">
      <div class="modal-card" :class="{'mobile': isMobile}" role="dialog" aria-modal="true" @click.stop>
        <button class="close-btn" @click="close" aria-label="Close dialog">×</button>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue';
const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue']);

const close = () => emit('update:modelValue', false);

function onBackdropClick(e) {
  if (e.target === e.currentTarget) close();
}

const isMobile = computed(() => window.matchMedia && window.matchMedia('(max-width: 720px)').matches);

</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(12, 14, 20, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}

.modal-card {
  width: 80vw;
  height: 80vh;
  max-width: 1100px;
  max-height: 820px;
  border-radius: 12px;
  background: rgba(255,255,255,0.55);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 18px;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-card.mobile {
  width: 100%;
  height: auto;
  max-height: 92vh;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  margin-top: auto;
  align-self: flex-end;
  transform-origin: bottom center;
}

.close-btn {
  position: absolute;
  right: 12px;
  top: 10px;
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.6);
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  padding-top: 6px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width:720px) {
  .modal-backdrop { align-items: flex-end; }
}
</style>