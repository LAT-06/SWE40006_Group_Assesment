<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Overview of your grocery delivery platform</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Orders Today</div>
        <div class="stat-value">{{ stats.todayOrders }}</div>
        <div :class="['stat-trend', stats.todayOrdersTrend >= 0 ? 'up' : 'down']">
          {{ stats.todayOrdersTrend >= 0 ? '↑' : '↓' }}
          {{ Math.abs(stats.todayOrdersTrend) }}% from yesterday
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Revenue Today</div>
        <div class="stat-value">${{ stats.todayRevenue.toLocaleString() }}</div>
        <div :class="['stat-trend', stats.todayRevenueTrend >= 0 ? 'up' : 'down']">
          {{ stats.todayRevenueTrend >= 0 ? '↑' : '↓' }}
          {{ Math.abs(stats.todayRevenueTrend) }}% from yesterday
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Deliveries</div>
        <div class="stat-value">{{ stats.activeDeliveries }}</div>
        <div class="stat-trend">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Low Stock Items</div>
        <div class="stat-value">{{ stats.lowStockItems }}</div>
        <div class="stat-trend">-</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

const stats = ref({
  todayOrders: 0,
  todayOrdersTrend: 0,
  todayRevenue: 0,
  todayRevenueTrend: 0,
  activeDeliveries: 0,
  activeDeliveriesTrend: 0,
  lowStockItems: 0,
  lowStockItemsTrend: 0,
})

const fetchStats = async () => {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    const res = await fetch(`${API_URL}/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) stats.value = { ...stats.value, ...(await res.json()) }
  } catch (e) {
    console.error('Failed to fetch stats', e)
  }
}

onMounted(() => fetchStats())

defineExpose({ fetchStats })
</script>
