<script setup lang="ts">
defineProps<{
  orderId: string
  adjustedItems: { product_id: string; ordered: number; requested: number }[]
}>()

const emit = defineEmits<{
  trackOrder: []
  continueShopping: []
}>()
</script>

<template>
  <div class="success-overlay" @click="emit('trackOrder')">
    <div class="success-content" @click.stop>
      <h2 class="success-title">Order Placed Successfully!</h2>
      <div class="order-number">Order #ORD-{{ orderId }}</div>
      <p class="success-text">
        Thank you for your order! We'll send you a confirmation email shortly.
        You can track your delivery in real-time.
      </p>
      <div v-if="adjustedItems.length > 0"
        style="background:#fff3cd; border:1px solid #ffc107; padding:12px 16px; border-radius:8px; margin:12px 0; text-align:left;">
        <p style="font-weight:700; color:#856404; margin:0 0 6px;">⚠️ Some quantities were adjusted to match available stock:</p>
        <ul style="margin:0; padding-left:18px;">
          <li v-for="adj in adjustedItems" :key="adj.product_id" style="font-size:13px; color:#856404;">
            Requested {{ adj.requested }}, ordered {{ adj.ordered }}
          </li>
        </ul>
      </div>
      <button class="checkout-btn" style="margin-bottom: 12px" @click="emit('trackOrder')">
        Track Order
      </button>
      <button class="continue-shopping" style="margin-top: 0" @click="emit('continueShopping')">
        Continue Shopping
      </button>
    </div>
  </div>
</template>

<style scoped>
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 24, 88, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-content {
  background: white;
  border: 3px solid var(--stroke);
  box-shadow: 8px 8px 0 var(--stroke);
  padding: 60px;
  text-align: center;
  max-width: 500px;
}

.success-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 16px;
}

.success-text {
  font-size: 16px;
  color: var(--paragraph);
  margin-bottom: 32px;
}

.order-number {
  background: var(--main);
  border: 3px solid var(--stroke);
  padding: 16px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 24px;
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
}

.checkout-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
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
</style>
