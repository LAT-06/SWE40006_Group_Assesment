<template>
  <slot v-if="!error" />
  <div v-else class="error-boundary">
    <div class="error-boundary__content">
      <div class="error-boundary__icon">⚠️</div>
      <h2 class="error-boundary__title">Something went wrong</h2>
      <p class="error-boundary__message">{{ error.message || 'An unexpected error occurred.' }}</p>
      <button class="error-boundary__btn" @click="reset">Try Again</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { logger } from '@/lib/logger'

const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  error.value = err
  logger.error('[ErrorBoundary]', err)
  return false
})

function reset() {
  error.value = null
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.error-boundary__content {
  text-align: center;
  max-width: 480px;
}

.error-boundary__icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-boundary__title {
  font-family: 'Space Mono', monospace;
  font-size: 24px;
  color: var(--headline);
  margin-bottom: 12px;
}

.error-boundary__message {
  color: var(--paragraph);
  margin-bottom: 24px;
  line-height: 1.5;
}

.error-boundary__btn {
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 12px 32px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.error-boundary__btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}
</style>
