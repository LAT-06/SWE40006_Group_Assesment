<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')" @keydown.escape="$emit('close')" role="dialog" aria-modal="true">
      <div class="modal-box" :style="{ maxWidth: maxWidth }">
        <div v-if="title" class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="modal-close" @click="$emit('close')" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

withDefaults(defineProps<{
  title?: string
  maxWidth?: string
}>(), {
  title: '',
  maxWidth: '500px',
})

const emit = defineEmits<{
  close: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 24, 88, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  border: 3px solid var(--stroke);
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--paragraph);
  padding: 0 4px;
  line-height: 1;
}

.modal-close:hover {
  color: var(--headline);
}

.modal-body {
  padding: 24px 32px;
}

.modal-footer {
  padding: 0 32px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
