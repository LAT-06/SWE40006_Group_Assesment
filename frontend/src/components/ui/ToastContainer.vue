<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="'toast--' + toast.type"
          role="alert"
        >
          <span class="toast__icon">{{ icons[toast.type] }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" @click="remove(toast.id)" aria-label="Dismiss notification">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
  width: 100%;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 3px solid var(--stroke);
  background: white;
  font-weight: 500;
  pointer-events: auto;
  box-shadow: 4px 4px 0 var(--stroke);
}

.toast--success { border-left: 6px solid #2ecc71; }
.toast--error { border-left: 6px solid #e74c3c; }
.toast--warning { border-left: 6px solid #f39c12; }
.toast--info { border-left: 6px solid var(--secondary); }

.toast__icon {
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
}

.toast--success .toast__icon { background: #2ecc71; }
.toast--error .toast__icon { background: #e74c3c; }
.toast--warning .toast__icon { background: #f39c12; }
.toast--info .toast__icon { background: var(--secondary); }

.toast__message {
  flex: 1;
  font-size: 14px;
  color: var(--headline);
  line-height: 1.4;
}

.toast__close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--paragraph);
  opacity: 0.6;
  padding: 0 4px;
  flex-shrink: 0;
}

.toast__close:hover {
  opacity: 1;
}

/* Transitions */
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@media (max-width: 480px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
