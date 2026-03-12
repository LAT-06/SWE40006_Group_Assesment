<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click.self="handleCancel" role="dialog" aria-modal="true">
      <div class="confirm-box" ref="dialogRef">
        <h3 class="confirm-title">{{ options.title || 'Confirm' }}</h3>
        <p class="confirm-message">{{ options.message }}</p>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn--cancel" @click="handleCancel">
            {{ options.cancelText || 'Cancel' }}
          </button>
          <button
            class="confirm-btn confirm-btn--ok"
            :class="{ 'confirm-btn--danger': options.variant === 'danger' }"
            @click="handleConfirm"
            ref="confirmBtnRef"
          >
            {{ options.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, nextTick, useTemplateRef, onMounted, onUnmounted } from 'vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'

const { visible, options, handleConfirm, handleCancel } = useConfirmDialog()
const confirmBtnRef = useTemplateRef<HTMLButtonElement>('confirmBtnRef')

watch(visible, async (v) => {
  if (v) {
    await nextTick()
    confirmBtnRef.value?.focus()
  }
})

function onKeydown(e: KeyboardEvent) {
  if (visible.value && e.key === 'Escape') handleCancel()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 24, 88, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-box {
  background: white;
  border: 3px solid var(--stroke);
  padding: 32px;
  max-width: 440px;
  width: 90%;
  box-shadow: 6px 6px 0 var(--stroke);
}

.confirm-title {
  font-family: 'Space Mono', monospace;
  font-size: 20px;
  color: var(--headline);
  margin-bottom: 12px;
}

.confirm-message {
  color: var(--paragraph);
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 10px 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  border: 3px solid var(--stroke);
  transition: all 0.2s;
}

.confirm-btn--cancel {
  background: white;
  color: var(--headline);
}

.confirm-btn--ok {
  background: var(--button);
  color: var(--button-text);
}

.confirm-btn--danger {
  background: #e74c3c;
  color: white;
}

.confirm-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}
</style>
