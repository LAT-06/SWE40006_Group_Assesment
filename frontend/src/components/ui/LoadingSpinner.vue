<template>
  <div class="loading-spinner" :style="{ padding: padding }">
    <div class="spinner" :style="{ width: size, height: size }"></div>
    <div v-if="message" class="loading-message">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  size?: string
  padding?: string
}>(), {
  message: '',
  size: '32px',
  padding: '40px',
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  border: 3px solid var(--main);
  border-top-color: var(--button);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-message {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
