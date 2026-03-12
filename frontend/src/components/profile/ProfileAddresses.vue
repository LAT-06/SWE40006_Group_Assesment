<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { supabase } from '@/lib/supabase'
import type { UserAddress } from '@/types'

const authStore = useAuthStore()

const userAddresses = ref<UserAddress[]>([])
const showAddressModal = ref(false)
const editingAddressId = ref<string | null>(null)
const addressForm = ref({ label: 'Home', full_name: '', phone: '', address: '', district: '' })

const districtOptions = [
  { value: 'zone-a', label: 'District 1' },
  { value: 'zone-a', label: 'District 3' },
  { value: 'zone-a', label: 'District 5' },
  { value: 'zone-b', label: 'District 2' },
  { value: 'zone-b', label: 'District 7' },
  { value: 'zone-b', label: 'District 9' },
  { value: 'zone-c', label: 'District 12' },
  { value: 'zone-c', label: 'Thu Duc' },
]

const fetchAddresses = async () => {
  const userId = authStore.user?.id
  if (!userId) return
  const { data } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
  if (data) userAddresses.value = data
}

const openAddAddress = () => {
  editingAddressId.value = null
  addressForm.value = { label: 'Home', full_name: '', phone: '', address: '', district: '' }
  showAddressModal.value = true
}

const openEditAddress = (addr: UserAddress) => {
  editingAddressId.value = addr.id
  addressForm.value = { label: addr.label, full_name: addr.full_name, phone: addr.phone, address: addr.address, district: addr.district }
  showAddressModal.value = true
}

const saveAddress = async () => {
  const userId = authStore.user?.id
  if (!userId) return
  const payload = { ...addressForm.value, user_id: userId }
  if (editingAddressId.value) {
    await supabase.from('user_addresses').update(payload).eq('id', editingAddressId.value)
  } else {
    const isFirst = userAddresses.value.length === 0
    await supabase.from('user_addresses').insert({ ...payload, is_default: isFirst })
  }
  showAddressModal.value = false
  await fetchAddresses()
}

const deleteAddress = async (id: string) => {
  if (!await useConfirmDialog().confirm({ message: 'Delete this address?', variant: 'danger', confirmText: 'Delete' })) return
  await supabase.from('user_addresses').delete().eq('id', id)
  await fetchAddresses()
}

const setDefaultAddress = async (id: string) => {
  const userId = authStore.user?.id
  if (!userId) return
  await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId)
  await supabase.from('user_addresses').update({ is_default: true }).eq('id', id)
  await fetchAddresses()
}

onMounted(() => { fetchAddresses() })
</script>

<template>
  <section class="content-section active">
    <div class="section-header">
      <h1 class="section-title">Saved Addresses</h1>
      <p class="section-subtitle">Manage your delivery addresses</p>
    </div>

    <div class="addresses-grid">
      <div v-for="addr in userAddresses" :key="addr.id" class="address-card" :class="{ default: addr.is_default }">
        <div v-if="addr.is_default" class="default-badge">DEFAULT</div>
        <div class="address-name">{{ addr.label }}</div>
        <div class="address-details">
          {{ addr.full_name }}<br />
          {{ addr.phone }}<br />
          {{ addr.address }}<br />
          {{ addr.district }}, Ho Chi Minh City
        </div>
        <div class="address-actions">
          <button v-if="!addr.is_default" class="btn btn-secondary" @click="setDefaultAddress(addr.id)">Set Default</button>
          <button class="btn btn-secondary" @click="openEditAddress(addr)">Edit</button>
          <button class="btn btn-secondary" @click="deleteAddress(addr.id)">Delete</button>
        </div>
      </div>

      <div class="add-address-card" @click="openAddAddress">
        <div class="add-icon">➕</div>
        <div style="font-weight: 700; color: var(--headline)">Add New Address</div>
      </div>
    </div>

    <!-- Address Modal -->
    <div v-if="showAddressModal" class="modal-overlay" @click.self="showAddressModal = false">
      <div class="modal-box">
        <h3 style="margin-bottom: 16px; color: var(--headline);">{{ editingAddressId ? 'Edit Address' : 'Add New Address' }}</h3>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input v-model="addressForm.label" type="text" class="form-input" placeholder="e.g. Home, Office" />
        </div>
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input v-model="addressForm.full_name" type="text" class="form-input" placeholder="Recipient name" required />
        </div>
        <div class="form-group">
          <label class="form-label">Phone *</label>
          <input v-model="addressForm.phone" type="tel" class="form-input" placeholder="+84 123 456 789" required />
        </div>
        <div class="form-group">
          <label class="form-label">Street Address *</label>
          <input v-model="addressForm.address" type="text" class="form-input" placeholder="House number and street name" required />
        </div>
        <div class="form-group">
          <label class="form-label">District *</label>
          <select v-model="addressForm.district" class="form-input" required>
            <option value="">Select district</option>
            <option v-for="opt in districtOptions" :key="opt.label" :value="opt.label">{{ opt.label }}</option>
          </select>
        </div>
        <div style="display:flex; gap:12px; margin-top:20px;">
          <button class="btn btn-secondary" @click="showAddressModal = false">Cancel</button>
          <button class="checkout-btn" style="flex:1; padding:12px;" @click="saveAddress">Save Address</button>
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

.addresses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.address-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  position: relative;
}
.address-card.default {
  background: var(--main);
}
.default-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--button);
  border: 2px solid var(--stroke);
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--button-text);
}
.address-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}
.address-details {
  font-size: 14px;
  color: var(--paragraph);
  line-height: 1.8;
  margin-bottom: 16px;
}
.address-actions {
  display: flex;
  gap: 8px;
}

.add-address-card {
  background: var(--secondary);
  border: 3px dashed var(--stroke);
  padding: 60px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.add-address-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}
.add-icon {
  font-size: 48px;
  margin-bottom: 12px;
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
.btn-secondary { background: white; color: var(--headline); }
.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.checkout-btn {
  background: #f582ae;
  color: var(--button-text);
  border: 3px solid var(--stroke);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.checkout-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  background: #fff;
  border: 3px solid var(--stroke);
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group { margin-bottom: 16px; }
.form-label {
  display: block;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 6px;
  font-size: 14px;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 3px solid var(--stroke);
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: #f582ae;
}

@media (max-width: 968px) {
  .addresses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
