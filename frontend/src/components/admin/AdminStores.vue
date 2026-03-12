<template>
  <div>
    <!-- Store inventory detail view -->
    <template v-if="storeInventoryStore">
      <div class="page-header" style="display:flex; align-items:center; gap:16px;">
        <button class="btn btn-secondary" style="padding:6px 14px; font-size:13px;" @click="storeInventoryStore = null">← Back</button>
        <div>
          <h1 class="page-title">{{ storeInventoryStore.name }} — Inventory</h1>
          <p class="page-subtitle">{{ storeInventoryStore.address }}</p>
        </div>
      </div>
      <div v-if="storeInventoryLoading" style="text-align:center; padding:40px; color:#666;">Loading inventory…</div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th style="width:120px; text-align:center;">Qty in Store</th>
              <th style="width:120px; text-align:center;">In Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in storeInventory" :key="p.id">
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:22px;">{{ p.image_url?.startsWith('http') ? '' : (p.image_url || '📦') }}</span>
                  <span style="font-weight:600; font-size:14px;">{{ p.name }}</span>
                </div>
              </td>
              <td style="font-size:13px;">${{ p.price?.toFixed(2) }}</td>
              <td style="text-align:center;">
                <input type="number" min="0" :value="p.inv_quantity"
                  style="width:70px; padding:4px 8px; border:2px solid var(--stroke); text-align:center; font-family:inherit;"
                  @change="updateStoreInventory(p.id, 'quantity', Number(($event.target as HTMLInputElement).value))" />
              </td>
              <td style="text-align:center;">
                <label style="display:inline-flex; align-items:center; cursor:pointer; gap:6px;">
                  <input type="checkbox" :checked="p.inv_in_stock"
                    @change="updateStoreInventory(p.id, 'in_stock', ($event.target as HTMLInputElement).checked)"
                    style="width:16px; height:16px; cursor:pointer;" />
                  <span style="font-size:12px;" :style="{ color: p.inv_in_stock ? '#00b894' : '#d63031' }">
                    {{ p.inv_in_stock ? 'In Stock' : 'Out' }}
                  </span>
                </label>
              </td>
            </tr>
            <tr v-if="storeInventory.length === 0">
              <td colspan="4" style="text-align:center; padding:30px; color:#999;">No products found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Store list view -->
    <template v-else>
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h1 class="page-title">Stores / Warehouses</h1>
          <p class="page-subtitle">Manage physical store locations and their stock</p>
        </div>
        <button class="btn btn-primary" @click="openAddStoreModal">+ Add Store</button>
      </div>

      <div v-if="storesLoading" style="text-align:center; padding:40px; color:#666;">Loading stores…</div>
      <div v-else-if="storesError" style="text-align:center; padding:24px; color:#e74c3c; font-weight:600;">
        ⚠ {{ storesError }}
        <button class="btn" style="margin-left:12px;" @click="fetchStores()">Retry</button>
      </div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Store Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th style="text-align:center;">Status</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in stores" :key="s.id">
              <td style="font-weight:700;">{{ s.name }}</td>
              <td style="font-size:13px; color:#555;">{{ s.address }}</td>
              <td style="font-size:13px;">{{ s.phone || '—' }}</td>
              <td style="text-align:center;">
                <span :style="`display:inline-block; padding:3px 10px; border-radius:99px; font-size:12px; font-weight:600; background:${s.is_active ? '#d4edda' : '#f8d7da'}; color:${s.is_active ? '#155724' : '#721c24'};`">
                  {{ s.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td style="text-align:center;">
                <div style="display:flex; gap:6px; justify-content:center;">
                  <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" @click="openStoreInventory(s)">Inventory</button>
                  <button class="btn" style="padding:4px 10px; font-size:12px; background:#f0f0f0;" @click="openEditStoreModal(s)">Edit</button>
                  <button class="btn" style="padding:4px 10px; font-size:12px; background:#ffd5d5; color:#c0392b;" @click="deleteStore(s.id)">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="stores.length === 0">
              <td colspan="5" style="text-align:center; padding:30px; color:#999;">No stores yet. Add one!</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Add / Edit Store Modal -->
    <BaseModal v-if="showStoreModal" :title="isEditingStore ? 'Edit Store' : 'Add Store'" max-width="480px" @close="showStoreModal = false">
      <div class="form-group">
        <label class="form-label">Store Name *</label>
        <input v-model="editingStore.name" class="form-input" placeholder="e.g. City Central" />
      </div>
      <div class="form-group">
        <label class="form-label">Address *</label>
        <input v-model="editingStore.address" class="form-input" placeholder="123 Main St, Melbourne VIC 3000" />
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input v-model="editingStore.phone" class="form-input" placeholder="+61 3 9000 0001" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="editingStore.email" type="email" class="form-input" placeholder="store@example.com" />
        </div>
      </div>
      <div class="form-group">
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" v-model="editingStore.is_active" style="width:16px; height:16px;" />
          Store is active (visible to customers)
        </label>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showStoreModal = false">Cancel</button>
        <button class="btn btn-primary" @click="saveStore">{{ isEditingStore ? 'Save Changes' : 'Add Store' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import type { Product, Store, StoreInventory } from '@/types'
import BaseModal from '@/components/ui/BaseModal.vue'

const API_URL = import.meta.env.VITE_API_URL

interface StoreInventoryProduct extends Product {
  inv_quantity: number
  inv_in_stock: boolean
}

const stores = shallowRef<Store[]>([])
const storesLoading = ref(false)
const storesError = ref<string | null>(null)
const showStoreModal = ref(false)
const editingStore = shallowRef<Partial<Store>>({})
const isEditingStore = ref(false)
const storeInventoryStore = shallowRef<Store | null>(null)
const storeInventory = shallowRef<StoreInventoryProduct[]>([])
const storeInventoryLoading = ref(false)

const getToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const fetchStores = async () => {
  storesLoading.value = true
  storesError.value = null
  try {
    const res = await fetch(`${API_URL}/stores`)
    const json = await res.json()
    stores.value = json.data ?? []
  } catch (e: unknown) {
    storesError.value = e instanceof Error ? e.message : String(e)
  } finally {
    storesLoading.value = false
  }
}

const openAddStoreModal = () => {
  isEditingStore.value = false
  editingStore.value = { is_active: true }
  showStoreModal.value = true
}

const openEditStoreModal = (s: Store) => {
  isEditingStore.value = true
  editingStore.value = { ...s }
  showStoreModal.value = true
}

const saveStore = async () => {
  const token = await getToken()
  if (!token) return
  const { id, ...body } = editingStore.value as Store
  const url = isEditingStore.value ? `${API_URL}/admin/stores/${id}` : `${API_URL}/admin/stores`
  const method = isEditingStore.value ? 'PATCH' : 'POST'
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) { useToast().error('Failed to save store'); return }
  showStoreModal.value = false
  await fetchStores()
}

const deleteStore = async (id: string) => {
  if (!await useConfirmDialog().confirm({ message: 'Delete this store?', variant: 'danger', confirmText: 'Delete' })) return
  const token = await getToken()
  if (!token) return
  await fetch(`${API_URL}/admin/stores/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  await fetchStores()
}

const openStoreInventory = async (s: Store) => {
  storeInventoryStore.value = s
  storeInventoryLoading.value = true
  storeInventory.value = []
  const [invRes, prodRes] = await Promise.all([
    fetch(`${API_URL}/stores/${s.id}/inventory`),
    fetch(`${API_URL}/products?limit=200`),
  ])
  const invJson = await invRes.json()
  const prodJson = await prodRes.json()
  const invMap = new Map<string, StoreInventory>((invJson.data ?? []).map((i: StoreInventory) => [i.product_id, i]))
  storeInventory.value = (prodJson.data ?? []).map((p: Product) => {
    const inv = invMap.get(p.id)
    return { ...p, inv_quantity: inv?.quantity ?? 0, inv_in_stock: inv?.in_stock ?? false }
  })
  storeInventoryLoading.value = false
}

const updateStoreInventory = async (productId: string, field: 'quantity' | 'in_stock', value: number | boolean) => {
  const token = await getToken()
  if (!token || !storeInventoryStore.value) return
  await fetch(`${API_URL}/admin/stores/${storeInventoryStore.value.id}/inventory/${productId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  })
  const idx = storeInventory.value.findIndex((p) => p.id === productId)
  if (idx !== -1 && storeInventory.value[idx]) {
    const current = storeInventory.value[idx]
    const updated = [...storeInventory.value]
    updated[idx] = Object.assign({}, current, {
      inv_quantity: field === 'quantity' && typeof value === 'number' ? value : current.inv_quantity,
      inv_in_stock: field === 'in_stock' && typeof value === 'boolean' ? value : current.inv_in_stock,
    })
    storeInventory.value = updated
  }
}

defineExpose({ fetchStores, stores })
</script>
