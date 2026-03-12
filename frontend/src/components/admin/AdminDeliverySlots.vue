<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center">
      <div>
        <h1 class="page-title">Delivery Slots</h1>
        <p class="page-subtitle">Manage available delivery time windows</p>
      </div>
      <button class="btn btn-primary" @click="openAddSlotModal">+ Add Slot</button>
    </div>

    <!-- Filter bar -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center">
      <label style="font-weight: 700; font-size: 13px">Filter by Date:</label>
      <input type="date" v-model="slotDateFilter" @change="fetchSlots()"
        style="padding: 8px 12px; border: 2px solid var(--stroke); border-radius: 0; font-size: 14px" />
      <button v-if="slotDateFilter" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px"
        @click="slotDateFilter = ''; fetchSlots()">Clear</button>
      <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px" @click="fetchSlots()">Refresh</button>
    </div>

    <div v-if="slotsLoading" style="padding: 20px; text-align: center">Loading slots...</div>
    <div v-else-if="slots.length === 0" style="padding: 20px; text-align: center; color: #666">
      No delivery slots found. Click "Add Slot" to create one.
    </div>
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Zone</th>
            <th>Capacity</th>
            <th>Booked</th>
            <th>Available</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in slots" :key="slot.id" :style="slot.booked >= slot.capacity ? 'background:#fff0f0;' : ''">
            <td style="font-weight: 600">{{ formatSlotTime(slot) }}</td>
            <td>{{ slot.delivery_zones?.name || '—' }}</td>
            <td>{{ slot.capacity }}</td>
            <td :style="slot.booked >= slot.capacity ? 'color:#e74c3c; font-weight:700;' : ''">{{ slot.booked }}</td>
            <td :style="slot.capacity - slot.booked === 0 ? 'color:#e74c3c;' : 'color:#27ae60;'">
              {{ slot.capacity - slot.booked }}
            </td>
            <td>
              <span class="badge" :class="slotStatusClass(slot.status)">{{ slot.status }}</span>
            </td>
            <td>
              <div style="display: flex; gap: 8px">
                <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px" @click="openEditSlotModal(slot)">Edit</button>
                <button class="btn" style="padding: 4px 10px; font-size: 12px; background: #fff0f0; color: #e74c3c; border-color: #e74c3c" @click="deleteSlot(slot.id)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Slot Modal -->
    <BaseModal v-if="showSlotModal" :title="isEditingSlot ? 'Edit Delivery Slot' : 'Add Delivery Slot'" max-width="500px" @close="showSlotModal = false">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" v-model="editingSlot.slot_date" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label">Capacity</label>
          <input type="number" v-model="editingSlot.capacity" min="1" class="form-input" placeholder="20" required />
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <div class="form-group">
          <label class="form-label">Start Time</label>
          <input type="time" v-model="editingSlot.start_time" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label">End Time</label>
          <input type="time" v-model="editingSlot.end_time" class="form-input" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select v-model="editingSlot.status" class="form-select">
          <option value="open">Open</option>
          <option value="full">Full</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showSlotModal = false">Cancel</button>
        <button class="btn btn-primary" @click="saveSlot">Save</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import BaseModal from '@/components/ui/BaseModal.vue'

const API_URL = import.meta.env.VITE_API_URL

interface DeliverySlot {
  id: string
  zone_id?: string
  slot_date: string
  start_time: string
  end_time: string
  capacity: number
  booked: number
  status: 'open' | 'full' | 'closed'
  delivery_zones?: { name: string }
}

const slots = ref<DeliverySlot[]>([])
const slotsLoading = ref(false)
const slotDateFilter = ref('')
const showSlotModal = ref(false)
const editingSlot = ref<Partial<DeliverySlot>>({})
const isEditingSlot = ref(false)

const getToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const fetchSlots = async () => {
  slotsLoading.value = true
  try {
    const url = slotDateFilter.value
      ? `${API_URL}/delivery-slots?date=${slotDateFilter.value}`
      : `${API_URL}/delivery-slots`
    const res = await fetch(url)
    if (res.ok) slots.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch slots', e)
  } finally {
    slotsLoading.value = false
  }
}

const openAddSlotModal = () => {
  editingSlot.value = { slot_date: '', start_time: '', end_time: '', capacity: 20, status: 'open' }
  isEditingSlot.value = false
  showSlotModal.value = true
}

const openEditSlotModal = (slot: DeliverySlot) => {
  editingSlot.value = { ...slot }
  isEditingSlot.value = true
  showSlotModal.value = true
}

const saveSlot = async () => {
  try {
    const token = await getToken()
    if (!token) { useToast().error('Not authenticated'); return }
    const isEdit = isEditingSlot.value && editingSlot.value.id
    const url = isEdit ? `${API_URL}/delivery-slots/${editingSlot.value.id}` : `${API_URL}/delivery-slots`
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editingSlot.value),
    })
    if (!res.ok) {
      const text = await res.text()
      let errMsg = 'Request failed with status ' + res.status
      try { errMsg = JSON.parse(text).error || errMsg } catch { errMsg = text || errMsg }
      throw new Error(errMsg)
    }
    showSlotModal.value = false
    await fetchSlots()
  } catch (e: unknown) {
    useToast().error('Error saving slot: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const deleteSlot = async (id: string) => {
  if (!await useConfirmDialog().confirm({ message: 'Delete this delivery slot?', variant: 'danger', confirmText: 'Delete' })) return
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/delivery-slots/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to delete')
    }
    await fetchSlots()
  } catch (e: unknown) {
    useToast().error('Error: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const slotStatusClass = (status: string) => {
  const map: Record<string, string> = { open: 'badge-paid', full: 'badge-pending', closed: 'badge-cancelled' }
  return map[status] || 'badge-pending'
}

const formatSlotTime = (slot: DeliverySlot) => {
  const d = new Date(slot.slot_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `${d} · ${slot.start_time?.slice(0, 5)}–${slot.end_time?.slice(0, 5)}`
}

defineExpose({ fetchSlots, slots })
</script>
