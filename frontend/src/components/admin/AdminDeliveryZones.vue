<template>
  <div>
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <h1 class="page-title">Delivery Zones</h1>
        <p class="page-subtitle">Define which areas you deliver to. Inactive zones will block checkout for customers in those areas.</p>
      </div>
      <button class="btn btn-primary" @click="openAddZoneModal">+ Add Zone</button>
    </div>

    <div v-if="zonesLoading" style="text-align:center; padding:40px; color:#666;">Loading zones…</div>
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Zone Name</th>
            <th>Description</th>
            <th>Covered Areas / Suburbs</th>
            <th style="text-align:center;">Status</th>
            <th style="text-align:center;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="z in zones" :key="z.id">
            <td style="font-weight:700;">{{ z.name }}</td>
            <td style="font-size:13px; color:#555; max-width:200px;">{{ z.description || '—' }}</td>
            <td>
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                <span v-for="suburb in (z.suburbs ?? [])" :key="suburb"
                  style="display:inline-block; padding:2px 8px; background:#f0f0f0; border-radius:99px; font-size:12px;">
                  {{ suburb }}
                </span>
                <span v-if="!z.suburbs?.length" style="font-size:13px; color:#999;">No areas set</span>
              </div>
            </td>
            <td style="text-align:center;">
              <button
                :style="`display:inline-block; padding:3px 12px; border-radius:99px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:background .2s; background:${z.is_active ? '#d4edda' : '#f8d7da'}; color:${z.is_active ? '#155724' : '#721c24'};`"
                :title="z.is_active ? 'Click to deactivate' : 'Click to activate'"
                @click="toggleZoneActive(z)"
              >
                {{ z.is_active ? '✓ Active' : '✗ Inactive' }}
              </button>
            </td>
            <td style="text-align:center;">
              <div style="display:flex; gap:6px; justify-content:center;">
                <button class="btn" style="padding:4px 10px; font-size:12px; background:#f0f0f0;" @click="openEditZoneModal(z)">Edit</button>
                <button class="btn" style="padding:4px 10px; font-size:12px; background:#ffd5d5; color:#c0392b;" @click="deleteZone(z.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="zones.length === 0">
            <td colspan="5" style="text-align:center; padding:30px; color:#999;">No delivery zones yet. Add one!</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit Zone Modal -->
    <BaseModal v-if="showZoneModal" :title="isEditingZone ? 'Edit Zone' : 'Add Zone'" max-width="500px" @close="showZoneModal = false">
      <div class="form-group">
        <label class="form-label">Zone Name *</label>
        <input v-model="editingZone.name" class="form-input" placeholder="e.g. Zone A – City Centre" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input v-model="editingZone.description" class="form-input" placeholder="Short description of area covered" />
      </div>
      <div class="form-group">
        <label class="form-label">Covered Areas / Suburbs</label>
        <textarea v-model="editingZone.suburbsText" rows="3" class="form-input"
          placeholder="Comma-separated: District 1, District 3, CBD, Inner City" style="resize:vertical;" />
        <p style="font-size:12px; color:#999; margin:4px 0 0;">Enter suburb/area names separated by commas.</p>
      </div>
      <div class="form-group">
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" v-model="editingZone.is_active" style="width:16px; height:16px;" />
          Zone is active (deliveries available)
        </label>
        <p v-if="!editingZone.is_active" style="font-size:12px; color:#e74c3c; margin:4px 0 0;">⚠ Customers selecting areas in this zone will see a delivery unavailability notice.</p>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showZoneModal = false">Cancel</button>
        <button class="btn btn-primary" @click="saveZone">{{ isEditingZone ? 'Save Changes' : 'Add Zone' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import type { DeliveryZone } from '@/types'
import BaseModal from '@/components/ui/BaseModal.vue'

const API_URL = import.meta.env.VITE_API_URL

const zones = ref<DeliveryZone[]>([])
const zonesLoading = ref(false)
const showZoneModal = ref(false)
const editingZone = ref<Partial<DeliveryZone> & { suburbsText?: string }>({})
const isEditingZone = ref(false)

const getToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const fetchZones = async () => {
  zonesLoading.value = true
  try {
    const res = await fetch(`${API_URL}/delivery-zones`)
    const data = await res.json()
    zones.value = (Array.isArray(data) ? data : data.data ?? []).map((z: DeliveryZone) => ({
      ...z,
      suburbs: z.suburbs ?? [],
    }))
  } catch (e) {
    console.error('Failed to fetch zones', e)
  } finally {
    zonesLoading.value = false
  }
}

const openAddZoneModal = () => {
  isEditingZone.value = false
  editingZone.value = { is_active: true, suburbs: [], suburbsText: '' }
  showZoneModal.value = true
}

const openEditZoneModal = (z: DeliveryZone) => {
  isEditingZone.value = true
  editingZone.value = { ...z, suburbsText: (z.suburbs ?? []).join(', ') }
  showZoneModal.value = true
}

const saveZone = async () => {
  const token = await getToken()
  if (!token) return
  const { id, suburbsText, ...rest } = editingZone.value as DeliveryZone & { suburbsText: string }
  const suburbs = (suburbsText || '').split(',').map((s) => s.trim()).filter(Boolean)
  const body = { ...rest, suburbs }
  const url = isEditingZone.value ? `${API_URL}/delivery-zones/${id}` : `${API_URL}/delivery-zones`
  const method = isEditingZone.value ? 'PATCH' : 'POST'
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) { useToast().error('Failed to save zone'); return }
  showZoneModal.value = false
  await fetchZones()
}

const toggleZoneActive = async (z: DeliveryZone) => {
  const token = await getToken()
  if (!token) return
  await fetch(`${API_URL}/delivery-zones/${z.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: !z.is_active }),
  })
  await fetchZones()
}

const deleteZone = async (id: string) => {
  if (!await useConfirmDialog().confirm({ message: 'Delete this delivery zone?', variant: 'danger', confirmText: 'Delete' })) return
  const token = await getToken()
  if (!token) return
  const res = await fetch(`${API_URL}/delivery-zones/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    useToast().error(body.error || 'Failed to delete zone')
    return
  }
  await fetchZones()
}

defineExpose({ fetchZones, zones })
</script>
