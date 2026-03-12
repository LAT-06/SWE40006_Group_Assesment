<template>
  <div class="empty-state" :style="{ padding: padding }">
    <div v-if="icon" class="empty-icon">{{ icon }}</div>
    <div class="empty-text">{{ message }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  message: string
  padding?: string
}>(), {
  icon: '',
  padding: '40px 20px',
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 16px;
  color: var(--paragraph);
  opacity: 0.7;
  font-weight: 500;
}
</style>
