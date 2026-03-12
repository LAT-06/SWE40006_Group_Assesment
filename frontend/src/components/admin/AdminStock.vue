<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Stock Management</h1>
      <p class="page-subtitle">Monitor and update product inventory levels</p>
    </div>
    <div style="display: flex; gap: 8px; margin-bottom: 20px">
      <button
        v-for="f in [['all', 'All Products'], ['low', 'Low Stock (≤10)'], ['out', 'Out of Stock']]"
        :key="f[0]"
        class="btn"
        :class="{ 'btn-primary': stockFilter === f[0] }"
        style="padding: 6px 14px; font-size: 13px"
        @click="stockFilter = f[0] as 'all' | 'low' | 'out'"
      >{{ f[1] }}</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Adjust</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in visibleStock"
            :key="p.id"
            :style="(p.quantity ?? 0) === 0 ? 'background:#fff5f5;' : (p.quantity ?? 0) <= 10 ? 'background:#fffbf0;' : ''"
          >
            <td>
              <div style="font-weight: 700">{{ p.name }}</div>
              <div style="font-size: 12px; opacity: 0.6">{{ p.weight }}</div>
            </td>
            <td>{{ p.category?.name || '—' }}</td>
            <td>
              <span :style="(p.quantity ?? 0) === 0 ? 'color:#e74c3c; font-weight:700;' : (p.quantity ?? 0) <= 10 ? 'color:#f39c12; font-weight:700;' : 'font-weight:700;'">
                {{ p.quantity ?? 0 }}
              </span>
            </td>
            <td>
              <span :class="['badge', p.in_stock ? 'badge-delivered' : 'badge-cancelled']">
                {{ p.in_stock ? 'In Stock' : 'Out of Stock' }}
              </span>
            </td>
            <td @click.stop style="display: flex; gap: 8px; align-items: center; padding: 16px">
              <input
                type="number"
                min="0"
                :value="p.quantity ?? 0"
                @change="(e) => { p.quantity = parseInt((e.target as HTMLInputElement).value) || 0 }"
                style="width: 70px; padding: 6px; border: 2px solid var(--stroke); font-size: 14px; text-align: center"
              />
              <button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px" @click="updateStock(p)">Save</button>
            </td>
          </tr>
          <tr v-if="visibleStock.length === 0">
            <td colspan="5" style="text-align: center; padding: 20px">No products.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductStore } from '@/stores/products'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/types'

const API_URL = import.meta.env.VITE_API_URL

const productStore = useProductStore()

const stockFilter = ref<'all' | 'low' | 'out'>('all')

const stockProducts = computed(() =>
  [...productStore.products].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
)

const visibleStock = computed(() => {
  if (stockFilter.value === 'low')
    return stockProducts.value.filter((p) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 10)
  if (stockFilter.value === 'out')
    return stockProducts.value.filter((p) => (p.quantity ?? 0) === 0 || !p.in_stock)
  return stockProducts.value
})

const getToken = async () => {
  const { supabase } = await import('@/lib/supabase')
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const updateStock = async (product: Product) => {
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/admin/stock/${product.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        quantity: product.quantity ?? 0,
        in_stock: (product.quantity ?? 0) > 0,
      }),
    })
    if (!res.ok) throw new Error('Failed')
    await productStore.fetchProducts()
  } catch (e: unknown) {
    useToast().error('Error updating stock: ' + (e instanceof Error ? e.message : String(e)))
  }
}
</script>
