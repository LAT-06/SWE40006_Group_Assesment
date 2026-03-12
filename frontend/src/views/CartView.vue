<template>
  <div class="cart-page">
    <!-- Progress Steps -->
    <div class="progress-steps">
      <div class="container">
        <div class="steps">
          <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
            <div class="step-number">1</div>
            <div class="step-label">Shopping Cart</div>
          </div>
          <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
            <div class="step-number">2</div>
            <div class="step-label">Checkout</div>
          </div>
          <div class="step" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
            <div class="step-number">3</div>
            <div class="step-label">Payment</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <!-- Step 1: Cart View -->
        <div v-if="currentStep === 1" class="cart-view">
          <div class="cart-layout">
            <CartItemList :stock-map="stockMap" />
            <OrderSummary
              mode="cart"
              :promo-code="promoCode"
              :has-stock-problems="stockProblems.length > 0"
              @update:promo-code="promoCode = $event"
              @apply-promo="applyPromo"
              @proceed-to-checkout="proceedToCheckout"
              @continue-shopping="router.push('/')"
            />
          </div>
        </div>

        <!-- Step 2: Checkout View -->
        <div v-else-if="currentStep === 2" class="checkout-section">
          <div class="checkout-layout">
            <CheckoutForm
              v-model:placing-order="placingOrder"
              @back-to-cart="currentStep = 1"
              @place-order="placeOrder"
              @update-delivery-fee="cartStore.updateDeliveryFee($event)"
            />
            <OrderSummary mode="checkout" />
          </div>
        </div>
      </div>
    </div>

    <!-- Success Overlay -->
    <OrderSuccessOverlay
      v-if="showSuccess"
      :order-id="orderId"
      :adjusted-items="orderAdjustedItems"
      @track-order="closeSuccess"
      @continue-shopping="continueShopping"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import { supabase } from '@/lib/supabase'
import CartItemList from '@/components/cart/CartItemList.vue'
import OrderSummary from '@/components/cart/OrderSummary.vue'
import CheckoutForm from '@/components/cart/CheckoutForm.vue'
import OrderSuccessOverlay from '@/components/cart/OrderSuccessOverlay.vue'

const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const API_URL = import.meta.env.VITE_API_URL

const currentStep = ref(1)
const promoCode = ref('')
const showSuccess = ref(false)
const orderId = ref('')
const placingOrder = ref(false)
const orderAdjustedItems = ref<{ product_id: string; ordered: number; requested: number }[]>([])

// ─── Stock availability ──────────────────────────────────────────────────
const stockMap = ref<Record<string, number>>({})

const fetchCartStock = async () => {
  const productIds = cartStore.items.map((i) => i.productId).filter(Boolean) as string[]
  if (productIds.length === 0) return
  const { data } = await supabase.from('products').select('id, quantity').in('id', productIds)
  if (data) {
    const map: Record<string, number> = {}
    data.forEach((p) => { map[p.id] = p.quantity ?? 0 })
    stockMap.value = map
  }
}

const stockProblems = computed(() =>
  cartStore.items.filter((item) => {
    if (!item.productId) return false
    const avail = stockMap.value[item.productId]
    return avail !== undefined && avail < item.quantity
  }),
)

// ─── Promo ───────────────────────────────────────────────────────────────
async function applyPromo() {
  const code = promoCode.value.trim()
  if (!code) return
  try {
    const res = await fetch(`${API_URL}/promo/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, order_total: cartStore.subtotal }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Invalid promo code')
      return
    }
    cartStore.applyPromoCode(code, data.discount_amount)
    toast.success(`Promo applied! You save $${data.discount_amount.toFixed(2)}`)
  } catch {
    toast.error('Failed to validate promo code. Try again.')
  }
}

// ─── Navigation ──────────────────────────────────────────────────────────
function proceedToCheckout() {
  if (cartStore.items.length === 0) return
  currentStep.value = 2
  window.scrollTo(0, 0)
}

// ─── Place Order ─────────────────────────────────────────────────────────
async function placeOrder(payload: {
  checkoutForm: { fullName: string; phone: string; address: string; district: string; notes: string }
  selectedSlot: string | null
  selectedPayment: string | null
  zoneUnavailable: boolean
}) {
  if (payload.zoneUnavailable) {
    toast.warning('Sorry, we do not deliver to your selected area. Please choose a different area.')
    return
  }
  if (!payload.checkoutForm.fullName || !payload.checkoutForm.phone || !payload.checkoutForm.address || !payload.checkoutForm.district) {
    toast.warning('Please fill in all required fields')
    return
  }
  const phoneDigits = payload.checkoutForm.phone.replace(/\D/g, '')
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    toast.warning('Please enter a valid phone number (8-15 digits)')
    return
  }
  if (payload.checkoutForm.fullName.trim().length < 2) {
    toast.warning('Please enter a valid full name')
    return
  }
  if (!payload.selectedPayment) {
    toast.warning('Please select a payment method')
    return
  }

  placingOrder.value = true
  currentStep.value = 3

  try {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) {
      toast.warning('Please log in to place an order.')
      router.push('/login')
      return
    }

    const items = cartStore.items.filter((i) => i.productId).map((i) => ({ product_id: i.productId, quantity: i.quantity }))
    if (items.length === 0) {
      toast.warning('Your cart has no valid products. Please add items from the store.')
      currentStep.value = 2
      return
    }

    const body: Record<string, unknown> = {
      shipping_address: {
        name: payload.checkoutForm.fullName,
        phone: payload.checkoutForm.phone,
        address: `${payload.checkoutForm.address}, ${payload.checkoutForm.district}`,
      },
      items,
      notes: payload.checkoutForm.notes || undefined,
    }
    if (payload.selectedSlot) body.delivery_slot_id = payload.selectedSlot

    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) {
      if (data.out_of_stock) {
        toast.error(`Sorry, "${data.error}" Please update your cart and try again.`)
        await fetchCartStock()
        currentStep.value = 1
        return
      }
      throw new Error(data.error || 'Failed to place order')
    }

    orderId.value = data.order_id
    orderAdjustedItems.value = data.adjusted_items ?? []
    cartStore.clearCart()
    showSuccess.value = true
  } catch (e: unknown) {
    toast.error('Error placing order: ' + (e instanceof Error ? e.message : String(e)))
    currentStep.value = 2
  } finally {
    placingOrder.value = false
  }
}

function closeSuccess() {
  showSuccess.value = false
  router.push(`/order-tracking/${orderId.value}`)
}

function continueShopping() {
  showSuccess.value = false
  router.push('/')
}

onMounted(() => {
  fetchCartStock()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.cart-page {
  min-height: 100vh;
  padding-bottom: 40px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Progress Steps */
.progress-steps {
  background: white;
  border-bottom: 3px solid var(--stroke);
  padding: 30px 0;
}

.steps {
  display: flex;
  justify-content: center;
  gap: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.step::after {
  content: "→";
  position: absolute;
  right: -30px;
  font-size: 20px;
  color: var(--button-text);
  opacity: 0.3;
}

.step:last-child::after {
  display: none;
}

.step-number {
  width: 40px;
  height: 40px;
  border: 3px solid var(--stroke);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--paragraph);
}

.step.active .step-number {
  background: #f582ae;
  color: var(--button-text);
}

.step.completed .step-number {
  background: #8bd3dd;
  color: var(--button-text);
}

.step-label {
  font-weight: 600;
  color: var(--paragraph);
}

.step.active .step-label {
  color: var(--button-text);
  font-weight: 700;
}

/* Main Content */
.main-content {
  padding: 40px 0;
}

.cart-layout,
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
}

.checkout-section {
  display: block;
}

/* Responsive */
@media (max-width: 968px) {
  .cart-layout,
  .checkout-layout {
    grid-template-columns: 1fr;
  }

  .steps {
    gap: 20px;
  }

  .step-label {
    display: none;
  }
}
</style>
