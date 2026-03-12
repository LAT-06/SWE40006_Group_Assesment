<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

defineProps<{
  /** 'cart' shows promo code + checkout button; 'checkout' shows item list */
  mode: 'cart' | 'checkout'
  promoCode?: string
  hasStockProblems?: boolean
}>()

const emit = defineEmits<{
  'update:promoCode': [value: string]
  applyPromo: []
  proceedToCheckout: []
  continueShopping: []
}>()
</script>

<template>
  <div class="summary-section">
    <div class="section-header">
      <h3 class="section-title">Order Summary</h3>
    </div>
    <div class="summary-content">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${{ cartStore.subtotal.toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span>Delivery Fee:</span>
        <span>{{
          cartStore.subtotal >= 50
            ? "FREE"
            : `$${cartStore.deliveryFee.toFixed(2)}`
        }}</span>
      </div>
      <div v-if="cartStore.discount > 0" class="summary-row">
        <span>Discount:</span>
        <span style="color: #27ae60">-${{ cartStore.discount.toFixed(2) }}</span>
      </div>
      <div class="summary-row total">
        <span>Total:</span>
        <span>${{ cartStore.total.toFixed(2) }}</span>
      </div>

      <!-- Cart mode: delivery info + promo + checkout btn -->
      <template v-if="mode === 'cart'">
        <div class="delivery-info">
          <div class="delivery-info-title">
            <span>🚚</span>
            <span>Delivery Information</span>
          </div>
          <div class="delivery-info-text">
            Free delivery on orders over $50
          </div>
        </div>

        <div class="promo-code">
          <div class="promo-input-group">
            <input
              :value="promoCode"
              type="text"
              class="promo-input"
              placeholder="Promo code"
              @input="emit('update:promoCode', ($event.target as HTMLInputElement).value)"
            />
            <button class="promo-btn" @click="emit('applyPromo')">Apply</button>
          </div>
        </div>

        <button
          class="checkout-btn"
          :disabled="cartStore.items.length === 0 || hasStockProblems"
          @click="emit('proceedToCheckout')"
        >
          Proceed to Checkout
        </button>
        <p v-if="hasStockProblems"
          style="color:#c0392b; font-size:13px; margin:8px 0 0; font-weight:600;">
          Some items exceed available stock. Please update quantities before continuing.
        </p>
        <button class="continue-shopping" @click="emit('continueShopping')">
          Continue Shopping
        </button>
      </template>

      <!-- Checkout mode: items in order -->
      <template v-else>
        <div class="delivery-info">
          <div class="delivery-info-title">
            <span>📦</span>
            <span>Items in Order</span>
          </div>
          <div style="margin-top: 12px">
            <div v-for="item in cartStore.items" :key="item.id" style="
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
                color: var(--headline);
                font-weight: 500;
              ">
              <span>{{ item.name }} × {{ item.quantity }}</span>
              <span style="font-weight: 700">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.summary-section {
  background: white;
  border: 3px solid var(--stroke);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.section-header {
  padding: 24px;
  border-bottom: 3px solid var(--stroke);
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
}

.summary-content {
  padding: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 16px;
  color: var(--paragraph);
}

.summary-row.total {
  border-top: 3px solid var(--stroke);
  margin-top: 12px;
  padding-top: 20px;
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
}

.delivery-info {
  background: var(--main);
  border: 3px solid var(--stroke);
  padding: 16px;
  margin: 16px 0;
}

.delivery-info-title {
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.delivery-info-text {
  font-size: 14px;
  color: var(--paragraph);
}

.promo-code {
  margin: 16px 0;
}

.promo-input-group {
  display: flex;
  gap: 0;
}

.promo-input {
  flex: 1;
  padding: 12px 16px;
  border: 3px solid var(--stroke);
  border-right: none;
  outline: none;
}

.promo-btn {
  padding: 12px 20px;
  border: 3px solid var(--stroke);
  background: white;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.promo-btn:hover {
  background: #8bd3dd;
}

.checkout-btn {
  width: 100%;
  background: #f582ae;
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 18px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 16px;
}

.checkout-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.continue-shopping {
  width: 100%;
  background: white;
  color: var(--headline);
  border: 3px solid var(--stroke);
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  margin-top: 12px;
}

.continue-shopping:hover {
  background: var(--main);
}

@media (max-width: 968px) {
  .summary-section {
    position: static;
  }
}
</style>
