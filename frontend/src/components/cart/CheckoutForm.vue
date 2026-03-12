<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const API_URL = import.meta.env.VITE_API_URL

// ─── Checkout Form ───────────────────────────────────────────────────────
const checkoutForm = ref({
  fullName: '',
  phone: '',
  address: '',
  district: '',
  notes: '',
})

// ─── Saved Addresses ─────────────────────────────────────────────────────
interface SavedAddress {
  id: string
  label: string
  full_name: string
  phone: string
  address: string
  district: string
  is_default: boolean
}
const savedAddresses = ref<SavedAddress[]>([])

const fetchSavedAddresses = async () => {
  const userId = authStore.user?.id
  if (!userId) return
  const { data } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
  if (data) savedAddresses.value = data
}

const fillFromAddress = (addr: SavedAddress) => {
  checkoutForm.value.fullName = addr.full_name
  checkoutForm.value.phone = addr.phone
  checkoutForm.value.address = addr.address
  checkoutForm.value.district = addr.district
  updateDeliveryZone()
}

// ─── Delivery Zones ──────────────────────────────────────────────────────
interface ApiZone {
  id: string
  name: string
  description: string | null
  is_active: boolean
  suburbs: string[]
}

const deliveryZones = ref<ApiZone[]>([])
const zoneNotice = ref<{ type: 'unavailable' | 'ok'; zoneName: string } | null>(null)

const fetchDeliveryZones = async () => {
  try {
    const res = await fetch(`${API_URL}/delivery-zones`)
    if (res.ok) deliveryZones.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch delivery zones', e)
  }
}

const updateDeliveryZone = () => {
  const selected = checkoutForm.value.district
  zoneNotice.value = null
  if (!selected) return

  const matchedZone = deliveryZones.value.find((z) =>
    (z.suburbs ?? []).some((s) => s.toLowerCase() === selected.toLowerCase()),
  )

  if (!matchedZone) {
    zoneNotice.value = { type: 'unavailable', zoneName: '' }
  } else if (!matchedZone.is_active) {
    zoneNotice.value = { type: 'unavailable', zoneName: matchedZone.name }
  } else {
    zoneNotice.value = { type: 'ok', zoneName: matchedZone.name }
    emit('updateDeliveryFee', matchedZone.id)
  }
}

// ─── Delivery Slots ──────────────────────────────────────────────────────
interface ApiSlot {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  capacity: number
  booked: number
  status: string
  delivery_zones?: { name: string }
}

const deliverySlots = ref<{ id: string; time: string; slots: number; available: boolean }[]>([])
const slotsLoading = ref(false)
const selectedSlot = ref<string | null>(null)

const fetchDeliverySlots = async () => {
  slotsLoading.value = true
  try {
    const res = await fetch(`${API_URL}/delivery-slots`)
    if (res.ok) {
      const data: ApiSlot[] = await res.json()
      deliverySlots.value = data.map((s) => {
        const date = new Date(s.slot_date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
        const zone = s.delivery_zones?.name ? ` · ${s.delivery_zones.name}` : ''
        return {
          id: s.id,
          time: `${date} · ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}${zone}`,
          slots: s.capacity - s.booked,
          available: s.status === 'open' && s.booked < s.capacity,
        }
      })
    }
  } catch (e) {
    console.error('Failed to fetch delivery slots', e)
  } finally {
    slotsLoading.value = false
  }
}

// ─── Payment Methods ─────────────────────────────────────────────────────
const selectedPayment = ref<string | null>(null)
const paymentMethods = [
  { id: 'card', icon: '💳', name: 'Credit/Debit Card', description: 'Pay securely online' },
  { id: 'google', icon: '🔵', name: 'Google Pay', description: 'Fast & secure payment' },
  { id: 'cash', icon: '💵', name: 'Cash on Delivery', description: 'Pay when you receive' },
]

// ─── Emit / Expose ───────────────────────────────────────────────────────
const emit = defineEmits<{
  backToCart: []
  placeOrder: [payload: {
    checkoutForm: typeof checkoutForm.value
    selectedSlot: string | null
    selectedPayment: string | null
    zoneUnavailable: boolean
  }]
  updateDeliveryFee: [zoneId: string]
}>()

const placingOrder = defineModel<boolean>('placingOrder', { default: false })

const handlePlaceOrder = () => {
  emit('placeOrder', {
    checkoutForm: checkoutForm.value,
    selectedSlot: selectedSlot.value,
    selectedPayment: selectedPayment.value,
    zoneUnavailable: zoneNotice.value?.type === 'unavailable',
  })
}

onMounted(async () => {
  await Promise.all([fetchDeliverySlots(), fetchDeliveryZones(), fetchSavedAddresses()])
})
</script>

<template>
  <div>
    <!-- Delivery Address -->
    <div class="form-section">
      <h3 class="form-section-title">Delivery Address</h3>

      <!-- Saved address quick-fill -->
      <div v-if="savedAddresses.length > 0" style="margin-bottom: 16px;">
        <p style="font-size:13px; color:#666; margin-bottom:8px;">Use a saved address:</p>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button v-for="addr in savedAddresses" :key="addr.id" type="button"
            style="padding:8px 14px; border:2px solid var(--stroke); background:var(--bg); border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; color: var(--button-text);"
            @click="fillFromAddress(addr)">
            {{ addr.label }}{{ addr.is_default ? ' ★' : '' }}
          </button>
        </div>
      </div>

      <form @submit.prevent>
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input v-model="checkoutForm.fullName" type="text" class="form-input"
            placeholder="Enter your full name" required maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number *</label>
          <input v-model="checkoutForm.phone" type="tel" class="form-input" placeholder="+84 123 456 789"
            required maxlength="20" />
        </div>
        <div class="form-group">
          <label class="form-label">Street Address *</label>
          <input v-model="checkoutForm.address" type="text" class="form-input"
            placeholder="House number and street name" required maxlength="200" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Area / Suburb *</label>
            <select v-model="checkoutForm.district" class="form-select" @change="updateDeliveryZone" required>
              <option value="">Select your area</option>
              <optgroup v-for="z in deliveryZones" :key="z.id"
                :label="z.name + (z.is_active ? '' : ' (Unavailable)')">
                <option v-for="suburb in (z.suburbs ?? [])" :key="suburb" :value="suburb">
                  {{ suburb }}
                </option>
              </optgroup>
              <optgroup v-if="deliveryZones.length === 0" label="Loading areas…" disabled></optgroup>
            </select>

            <div v-if="zoneNotice?.type === 'unavailable'"
              style="margin-top:8px; padding:12px 14px; background:#fff3cd; border:1px solid #ffc107; border-radius:6px; display:flex; align-items:flex-start; gap:10px;">
              <span style="font-size:18px; flex-shrink:0;">⚠️</span>
              <div>
                <strong style="font-size:13px; color:#856404; display:block;">Delivery not available for this area</strong>
                <span style="font-size:13px; color:#856404;">
                  {{ zoneNotice.zoneName
                    ? `Sorry, ${zoneNotice.zoneName} is temporarily not accepting deliveries.`
                    : 'Sorry, we do not currently deliver to this area.' }}
                  Please select a different area or check back later.
                </span>
              </div>
            </div>
            <div v-else-if="zoneNotice?.type === 'ok'"
              style="margin-top:8px; padding:8px 12px; background:#d4edda; border:1px solid #28a745; border-radius:6px; font-size:13px; color:#155724;">
              ✓ Delivery available · {{ zoneNotice.zoneName }}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">City *</label>
            <input type="text" class="form-input" value="Ho Chi Minh City" readonly />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Delivery Notes (Optional)</label>
          <textarea v-model="checkoutForm.notes" class="form-input" rows="3"
            placeholder="Special instructions for delivery" maxlength="500"></textarea>
        </div>
      </form>
    </div>

    <!-- Delivery Slot -->
    <div class="form-section">
      <h3 class="form-section-title">
        Select Delivery Slot
        <span style="font-size: 12px; font-weight: 400; color: #666">(optional)</span>
      </h3>
      <div v-if="slotsLoading" style="padding: 12px; color: #666">
        Loading available slots…
      </div>
      <div v-else-if="deliverySlots.length === 0" style="padding: 12px; color: #999; font-size: 14px">
        No delivery slots available right now. You can select one later from your profile.
      </div>
      <div v-else class="slot-grid">
        <div v-for="slot in deliverySlots" :key="slot.id" class="slot-option" :class="{
          selected: selectedSlot === slot.id,
          unavailable: !slot.available,
        }" @click="slot.available && (selectedSlot = slot.id)">
          <div class="slot-time">{{ slot.time }}</div>
          <div class="slot-availability">
            {{ slot.slots }} spots left
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Method -->
    <div class="form-section">
      <h3 class="form-section-title">Payment Method</h3>
      <div class="payment-methods">
        <div v-for="method in paymentMethods" :key="method.id" class="payment-option"
          :class="{ selected: selectedPayment === method.id }" @click="selectedPayment = method.id">
          <div class="payment-icon">{{ method.icon }}</div>
          <div>
            <div class="payment-name">{{ method.name }}</div>
            <div class="payment-description">{{ method.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top: 24px">
      <button class="back-to-cart" @click="emit('backToCart')">
        ← Back to Cart
      </button>
      <button class="checkout-btn" style="width: auto; display: inline-block; padding: 14px 40px"
        :disabled="placingOrder || zoneNotice?.type === 'unavailable'" @click="handlePlaceOrder">
        {{ placingOrder ? "Placing Order…" : "Place Order" }}
      </button>
      <p v-if="zoneNotice?.type === 'unavailable'" style="margin-top:8px; font-size:13px; color:#856404; font-weight:600;">
        ⚠️ Please select an area we deliver to before placing your order.
      </p>
    </div>
  </div>
</template>

<style scoped>
.form-section {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  margin-bottom: 20px;
}

.form-section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 14px 16px;
  border: 3px solid var(--stroke);
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: #f582ae;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.slot-option {
  padding: 16px;
  border: 3px solid var(--stroke);
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.slot-option:hover {
  background: var(--main);
}

.slot-option.selected {
  background: #f582ae;
  border-color: var(--stroke);
}

.slot-time {
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 4px;
}

.slot-availability {
  font-size: 12px;
  color: var(--paragraph);
}

.slot-option.unavailable {
  opacity: 0.4;
  cursor: not-allowed;
}

.payment-methods {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.payment-option {
  padding: 16px;
  border: 3px solid var(--stroke);
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-option:hover {
  background: var(--main);
}

.payment-option.selected {
  background: #8bd3dd;
  border-color: var(--stroke);
}

.payment-icon {
  font-size: 24px;
}

.payment-name {
  font-weight: 700;
  color: var(--headline);
}

.payment-description {
  font-size: 12px;
  color: var(--headline);
  font-weight: 500;
}

.back-to-cart {
  background: white;
  color: var(--headline);
  border: 3px solid var(--stroke);
  padding: 14px 24px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  margin-right: 12px;
}

.back-to-cart:hover {
  background: var(--main);
}

.checkout-btn {
  background: #f582ae;
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 18px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.checkout-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .slot-grid {
    grid-template-columns: 1fr;
  }
}
</style>
