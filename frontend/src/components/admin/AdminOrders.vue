<template>
  <div>
    <div v-if="!selectedOrder">
      <div class="page-header">
        <h1 class="page-title">Orders</h1>
        <p class="page-subtitle">Manage all customer orders</p>
      </div>
      <div class="orders-filter" style="display: flex; gap: 8px; margin-bottom: 20px">
        <button
          v-for="tab in ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']"
          :key="tab"
          class="btn"
          :class="{ 'btn-primary': activeOrderTab === tab }"
          style="padding: 6px 14px; font-size: 13px; text-transform: capitalize"
          @click="activeOrderTab = tab"
        >
          {{ tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>
      <div v-if="ordersLoading" style="text-align: center; padding: 40px">Loading orders...</div>
      <div v-else-if="ordersError" style="text-align:center; padding:24px; color:#e74c3c; font-weight:600;">
        ⚠ {{ ordersError }}
        <button class="btn" style="margin-left:12px;" @click="fetchOrders()">Retry</button>
      </div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id" style="cursor: pointer" @click="openOrderDetail(order)">
              <td style="font-weight: 700; font-family: monospace; font-size: 13px">
                {{ order.id.slice(0, 8).toUpperCase() }}
              </td>
              <td>
                {{ order.user?.full_name || order.user?.email || (order.user_id ? order.user_id.slice(0, 8).toUpperCase() : 'Customer') }}
              </td>
              <td style="font-size: 13px">{{ new Date(order.created_at).toLocaleDateString() }}</td>
              <td style="font-weight: 700">${{ order.total_amount?.toFixed(2) }}</td>
              <td>
                <span :class="['badge', orderStatusClass(order.status)]" style="text-transform: capitalize">{{ order.status }}</span>
              </td>
              <td @click.stop>
                <select
                  :value="order.status"
                  @change="updateOrderStatus(order.id, ($event.target as HTMLSelectElement).value as OrderStatus)"
                  style="padding: 4px 8px; border: 2px solid var(--stroke); font-size: 12px; cursor: pointer; background: white; font-family: 'DM Sans', sans-serif"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="6" style="text-align: center; padding: 20px">No orders found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="totalPages > 1" style="display:flex; align-items:center; gap:12px; margin-top:16px; justify-content:center;">
        <button class="btn" :disabled="ordersPage === 1" @click="fetchOrders(ordersPage - 1)">← Prev</button>
        <span style="font-size:14px; color:#555;">Page {{ ordersPage }} of {{ totalPages }} ({{ ordersTotal }} orders)</span>
        <button class="btn" :disabled="ordersPage >= totalPages" @click="fetchOrders(ordersPage + 1)">Next →</button>
      </div>
    </div>

    <!-- Order Detail -->
    <div v-else>
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px">
        <button class="btn" @click="selectedOrder = null">← Back</button>
        <h1 class="page-title" style="margin: 0">Order #{{ selectedOrder.id.slice(0, 8).toUpperCase() }}</h1>
        <span :class="['badge', orderStatusClass(selectedOrder.status)]" style="text-transform: capitalize">{{ selectedOrder.status }}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px">
        <div class="table-container" style="padding: 20px">
          <div style="font-weight: 700; margin-bottom: 12px; color: var(--headline)">Customer Info</div>
          <div style="margin-bottom: 8px"><strong>Name:</strong> {{ selectedOrder.user?.full_name || '—' }}</div>
          <div style="margin-bottom: 8px"><strong>Email:</strong> {{ selectedOrder.user?.email || '—' }}</div>
          <div style="margin-bottom: 8px"><strong>Date:</strong> {{ new Date(selectedOrder.created_at).toLocaleString() }}</div>
          <div><strong>Address:</strong> {{ typeof selectedOrder.shipping_address === 'object' ? JSON.stringify(selectedOrder.shipping_address) : selectedOrder.shipping_address }}</div>
        </div>
        <div class="table-container" style="padding: 20px">
          <div style="font-weight: 700; margin-bottom: 12px; color: var(--headline)">Update Status</div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <button
              v-for="s in (['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const)"
              :key="s"
              class="btn"
              :class="{ 'btn-primary': selectedOrder.status === s }"
              style="text-transform: capitalize"
              @click="updateOrderStatus(selectedOrder.id, s)"
            >{{ s }}</button>
          </div>
        </div>
      </div>
      <div class="table-container">
        <div v-if="orderDetailLoading" style="text-align:center; padding:24px; color:#666;">Loading items…</div>
        <table v-else>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedOrder.order_items" :key="item.product?.name">
              <td>{{ item.product?.name || '—' }}</td>
              <td>{{ item.quantity }}</td>
              <td>${{ item.price_at_purchase?.toFixed(2) }}</td>
              <td style="font-weight: 700">${{ (item.price_at_purchase * item.quantity).toFixed(2) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 700; padding: 16px">Total:</td>
              <td style="font-weight: 700; font-size: 18px">${{ selectedOrder.total_amount?.toFixed(2) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'
import type { OrderItemWithProduct, OrderStatus } from '@/types'

interface AdminOrder {
  id: string
  created_at: string
  status: OrderStatus
  total_amount: number
  shipping_address: Record<string, unknown> | null
  user?: { full_name?: string; email?: string }
  order_items?: OrderItemWithProduct[]
  user_id?: string
}

const orders = ref<AdminOrder[]>([])
const ordersLoading = ref(false)
const ordersError = ref('')
const activeOrderTab = ref('all')
const selectedOrder = ref<AdminOrder | null>(null)
const orderDetailLoading = ref(false)
const ordersTotal = ref(0)
const ordersPage = ref(1)
const ordersLimit = 25

const filteredOrders = computed(() => {
  if (activeOrderTab.value === 'all') return orders.value
  return orders.value.filter((o) => o.status === activeOrderTab.value)
})

const totalPages = computed(() => Math.ceil(ordersTotal.value / ordersLimit))

const fetchOrders = async (page = 1) => {
  ordersLoading.value = true
  ordersError.value = ''
  try {
    const from = (page - 1) * ordersLimit
    const to = from + ordersLimit - 1
    const { data, error, count } = await supabase
      .from('orders')
      .select(
        `id, user_id, status, total_amount, shipping_address, created_at, notes,
         user:profiles!orders_user_id_profile_fkey(full_name)`,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw error
    orders.value = (data as AdminOrder[]) ?? []
    ordersTotal.value = count ?? 0
    ordersPage.value = page
  } catch (e: unknown) {
    ordersError.value = e instanceof Error ? e.message : 'Failed to load orders'
    console.error('Failed to fetch orders', e)
  } finally {
    ordersLoading.value = false
  }
}

const openOrderDetail = async (order: AdminOrder) => {
  selectedOrder.value = order
  if (!order.order_items) {
    orderDetailLoading.value = true
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(quantity, price_at_purchase, product:products(name, image_url))`)
        .eq('id', order.id)
        .single()
      if (error) throw error
      selectedOrder.value = { ...order, ...(data as unknown as AdminOrder) }
      const idx = orders.value.findIndex((o) => o.id === order.id)
      if (idx !== -1) orders.value[idx] = selectedOrder.value!
    } catch (e) {
      console.error('Failed to load order detail', e)
    } finally {
      orderDetailLoading.value = false
    }
  }
}

const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) throw error
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx !== -1) {
      orders.value[idx] = { ...orders.value[idx], status } as AdminOrder
    }
    if (selectedOrder.value?.id === orderId)
      selectedOrder.value = { ...selectedOrder.value, status } as AdminOrder
  } catch (e: unknown) {
    useToast().error('Error updating order: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const orderStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'badge-pending',
    processing: 'badge-paid',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  }
  return map[status] || 'badge-pending'
}

defineExpose({ fetchOrders, orders, selectedOrder })
</script>
