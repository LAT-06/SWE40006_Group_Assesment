<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Tables } from '@/lib/models'
import type { OrderItemBasic } from '@/types'

const authStore = useAuthStore()

const props = defineProps<{
  orders: (Tables<'orders'> & { order_items?: OrderItemBasic[] })[]
}>()

const memberSince = computed(() => {
  const createdAt = authStore.user?.created_at
  if (!createdAt) return '—'
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const totalSpent = computed((): number =>
  props.orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
)
</script>

<template>
  <section class="content-section active">
    <div class="section-header">
      <h1 class="section-title">My Profile</h1>
      <p class="section-subtitle">Manage your personal information</p>
    </div>

    <div class="info-card">
      <div class="info-card-title">
        <span>Personal Information</span>
        <button class="edit-btn">✏️ Edit</button>
      </div>
      <div class="info-row">
        <span class="info-label">Full Name:</span>
        <span class="info-value">{{ authStore.user?.user_metadata?.name || 'Nguyen Van A' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">{{ authStore.user?.email || 'nguyen@email.com' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">+84 123 456 789</span>
      </div>
      <div class="info-row">
        <span class="info-label">Member Since:</span>
        <span class="info-value">{{ memberSince }}</span>
      </div>
    </div>

    <div class="info-card">
      <div class="info-card-title">
        <span>Account Statistics</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Orders:</span>
        <span class="info-value">{{ orders.length }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Spent:</span>
        <span class="info-value">${{ totalSpent.toFixed(2) }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.content-section {
  display: none;
}
.content-section.active {
  display: block;
}

.section-header {
  margin-bottom: 30px;
}
.section-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}
.section-subtitle {
  font-size: 16px;
  color: var(--paragraph);
  opacity: 0.8;
}

.info-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  margin-bottom: 20px;
}
.info-card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.edit-btn {
  background: var(--secondary);
  border: 2px solid var(--stroke);
  color: var(--button-text);
  padding: 8px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.edit-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 2px solid var(--stroke);
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  color: var(--paragraph);
  opacity: 0.8;
  font-weight: 600;
}
.info-value {
  color: var(--headline);
  font-weight: 600;
}
</style>
