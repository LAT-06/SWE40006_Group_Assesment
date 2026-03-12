<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { supabase } from '@/lib/supabase'
import type { DeliverySlotWithZone, OrderItemBasic } from '@/types'
import type { Tables } from '@/lib/models'

type ProfileOrder = Tables<'orders'> & {
  order_items?: OrderItemBasic[]
  delivery_slot?: DeliverySlotWithZone | null
}

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const API_URL = import.meta.env.VITE_API_URL

const getToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const orders = shallowRef<ProfileOrder[]>([])
const ordersLoading = ref(false)

// ─── Delivery Slots ──────────────────────────────────────────────────────
const availableSlots = ref<DeliverySlotWithZone[]>([])
const slotsLoading = ref(false)

const fetchAvailableSlots = async () => {
  slotsLoading.value = true
  try {
    const res = await fetch(`${API_URL}/delivery-slots`)
    if (res.ok) availableSlots.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch delivery slots', e)
  } finally {
    slotsLoading.value = false
  }
}

const formatSlot = (slot: DeliverySlotWithZone) => {
  if (!slot) return '—'
  const date = new Date(slot.slot_date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  return `${date} · ${slot.start_time?.slice(0, 5)} – ${slot.end_time?.slice(0, 5)}${slot.delivery_zones?.name ? ' · ' + slot.delivery_zones.name : ''}`
}

// ─── Cancel Order ────────────────────────────────────────────────────────
const cancelOrder = async (orderId: string) => {
  if (!await useConfirmDialog().confirm({ message: 'Cancel this order? This cannot be undone.', variant: 'danger', confirmText: 'Cancel Order' })) return
  try {
    const token = await getToken()
    if (!token) { useToast().error('Not authenticated'); return }
    const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to cancel order')
    }
    await fetchOrders()
  } catch (e: unknown) {
    useToast().error('Error: ' + (e instanceof Error ? e.message : String(e)))
  }
}

// ─── Select Delivery Slot ────────────────────────────────────────────────
const slotPickerOrderId = ref<string | null>(null)
const selectedSlotId = ref('')
const slotNotes = ref('')

const openSlotPicker = (orderId: string, currentSlotId?: string | null) => {
  slotPickerOrderId.value = orderId
  selectedSlotId.value = currentSlotId || ''
  slotNotes.value = ''
}

const confirmSlotSelection = async () => {
  if (!slotPickerOrderId.value || !selectedSlotId.value) {
    useToast().warning('Please select a delivery slot.')
    return
  }
  try {
    const token = await getToken()
    if (!token) { useToast().error('Not authenticated'); return }
    const res = await fetch(`${API_URL}/orders/${slotPickerOrderId.value}/slot`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ delivery_slot_id: selectedSlotId.value, notes: slotNotes.value }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to assign slot')
    }
    slotPickerOrderId.value = null
    selectedSlotId.value = ''
    slotNotes.value = ''
    await fetchOrders()
  } catch (e: unknown) {
    useToast().error('Error: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const statusClass = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'delivered': return 'status-delivered'
    case 'cancelled': return 'status-cancelled'
    default: return 'status-processing'
  }
}

const fetchOrders = async () => {
  const userId = authStore.user?.id
  if (!userId) return
  ordersLoading.value = true
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items:order_items(quantity, product:products(id, name, image_url)), delivery_slot:delivery_slots(id, slot_date, start_time, end_time, delivery_zones(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    orders.value = (data || []) as ProfileOrder[]
  } catch (err) {
    console.error('Error fetching orders:', err)
  } finally {
    ordersLoading.value = false
  }
}

const reorder = async (order: ProfileOrder) => {
  if (!order?.order_items) return
  if (await useConfirmDialog().confirm('Add these items to your cart?')) {
    order.order_items.forEach((item) => {
      cartStore.addItem({
        productId: item.product?.id,
        name: item.product?.name || 'Product',
        price: item.product?.price ?? 0,
        size: '',
        icon: item.product?.image_url || '🛒',
        quantity: item.quantity,
      })
    })
    router.push('/cart')
  }
}

onMounted(async () => {
  await Promise.all([fetchOrders(), fetchAvailableSlots()])
})

defineExpose({ fetchOrders, orders })
</script>

<template>
  <section class="content-section active">
    <div class="section-header">
      <h1 class="section-title">My Orders</h1>
      <p class="section-subtitle">View and track your order history</p>
    </div>

    <div v-if="ordersLoading" style="padding: 20px; text-align: center">Loading orders...</div>
    <div v-else-if="orders.length === 0" style="padding: 20px; text-align: center; color: #666">No orders yet.</div>

    <div v-else v-for="order in orders" :key="order.id" class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">Order #{{ order.id.slice(0, 8).toUpperCase() }}</div>
          <div class="order-date">
            Placed on {{ new Date(order.created_at ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
          </div>
        </div>
        <div class="order-status" :class="statusClass(order.status)">
          {{ order.status || 'Processing' }}
        </div>
      </div>
      <div class="order-body">
        <div class="order-items">
          <div v-for="item in order.order_items" :key="item.product?.id" class="order-item">
            <div class="item-icon">{{ item.product?.image_url || '🛒' }}</div>
            <div>
              <div class="item-name">{{ item.product?.name || 'Product' }}</div>
              <div class="item-qty">Qty: {{ item.quantity }}</div>
            </div>
          </div>
        </div>

        <!-- Delivery Slot Info -->
        <div v-if="order.delivery_slot" class="delivery-slot-info">
          <span class="slot-label">🚚 Delivery Slot:</span>
          <span class="slot-value">{{ formatSlot(order.delivery_slot) }}</span>
        </div>
        <div v-else-if="order.status === 'pending'" class="delivery-slot-info no-slot">
          <span class="slot-label">🚚 Delivery Slot:</span>
          <span class="slot-value" style="color: #e74c3c">Not selected</span>
        </div>

        <!-- Order Notes -->
        <div v-if="order.notes" class="delivery-slot-info">
          <span class="slot-label">📝 Notes:</span>
          <span class="slot-value">{{ order.notes }}</span>
        </div>

        <div class="order-footer">
          <div class="order-total">Total: ${{ order.total_amount?.toFixed(2) || '—' }}</div>
          <div class="order-actions">
            <router-link :to="`/order-tracking/${order.id}`" class="btn btn-primary">Track Order</router-link>
            <button class="btn btn-secondary" @click="reorder(order)">🔄 Reorder</button>
            <button v-if="order.status === 'pending'" class="btn btn-secondary"
              @click="openSlotPicker(order.id, order.delivery_slot_id)">
              🗓 {{ order.delivery_slot_id ? 'Change Slot' : 'Select Slot' }}
            </button>
            <button v-if="order.status === 'pending'" class="btn btn-cancel" @click="cancelOrder(order.id)">
              ✕ Cancel Order
            </button>
          </div>
        </div>
      </div>

      <!-- Slot Picker Inline Panel -->
      <div v-if="slotPickerOrderId === order.id" class="slot-picker-panel">
        <h3 style="margin: 0 0 12px; font-size: 16px">Select Delivery Slot</h3>
        <div v-if="slotsLoading">Loading slots...</div>
        <div v-else-if="availableSlots.length === 0" style="color: #666">No available slots at the moment.</div>
        <div v-else>
          <div class="form-group">
            <label style="font-weight: 700; font-size: 13px">Available Slots</label>
            <select v-model="selectedSlotId" style="width:100%; padding:8px; border:2px solid var(--stroke); border-radius:6px; margin-top:6px;">
              <option value="" disabled>Choose a slot…</option>
              <option v-for="slot in availableSlots" :key="slot.id" :value="slot.id">
                {{ formatSlot(slot) }} ({{ slot.capacity - slot.booked }} spots left)
              </option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 10px">
            <label style="font-weight: 700; font-size: 13px">Delivery Notes (optional)</label>
            <input v-model="slotNotes" placeholder="e.g. Leave at door"
              style="width:100%; padding:8px; border:2px solid var(--stroke); border-radius:6px; margin-top:6px; box-sizing:border-box;" />
          </div>
          <div style="display: flex; gap: 10px; margin-top: 14px">
            <button class="btn btn-primary" @click="confirmSlotSelection">Confirm</button>
            <button class="btn btn-secondary" @click="slotPickerOrderId = null">Cancel</button>
          </div>
        </div>
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

.order-card {
  background: white;
  border: 3px solid var(--stroke);
  margin-bottom: 20px;
  transition: all 0.2s;
}
.order-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}
.order-header {
  padding: 20px 24px;
  border-bottom: 3px solid var(--stroke);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg);
}
.order-id {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
}
.order-date {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
}
.order-status {
  display: inline-block;
  padding: 6px 16px;
  border: 2px solid var(--stroke);
  font-size: 12px;
  font-weight: 700;
}
.status-delivered { background: #d4edda; color: #155724; }
.status-processing { background: #d1ecf1; color: #0c5460; }
.status-cancelled { background: #f8d7da; color: #721c24; }

.order-body {
  padding: 20px 24px;
}
.order-items {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.item-icon { font-size: 32px; }
.item-name { font-size: 14px; color: var(--paragraph); }
.item-qty { font-size: 12px; opacity: 0.7; }

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 2px solid var(--stroke);
}
.order-total {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
}
.order-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: 3px solid var(--stroke);
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}
.btn-primary { background: var(--button); color: var(--button-text); }
.btn-secondary { background: white; color: var(--headline); }
.btn-cancel { background: #fff0f0; color: #e74c3c; border-color: #e74c3c; }
.btn-cancel:hover { background: #e74c3c; color: white; }
.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.delivery-slot-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px dashed #ccc;
  font-size: 14px;
}
.slot-label {
  font-weight: 700;
  color: var(--headline);
  white-space: nowrap;
}
.slot-value { color: #333; }

.slot-picker-panel {
  border-top: 3px solid var(--stroke);
  padding: 18px;
  background: var(--bg);
  margin-top: 12px;
}
.slot-picker-panel .form-group label {
  display: block;
}

@media (max-width: 968px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
