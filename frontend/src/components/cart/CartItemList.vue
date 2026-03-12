<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

defineProps<{
  stockMap: Record<string, number>
}>()
</script>

<template>
  <div class="cart-section">
    <div class="section-header">
      <h2 class="section-title">
        Shopping Cart ({{ cartStore.itemCount }} items)
      </h2>
    </div>
    <div class="cart-items">
      <template v-if="cartStore.items.length > 0">
        <div v-for="item in cartStore.items" :key="item.id" class="cart-item"
          :style="item.productId && stockMap[item.productId] === 0 ? 'opacity:0.65' : ''">
          <div class="item-image">{{ item.icon }}</div>
          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-size">{{ item.size }}</div>
            <div class="item-price">${{ item.price.toFixed(2) }}</div>
            <div v-if="item.productId && stockMap[item.productId] === 0"
              style="margin-top:4px; font-size:12px; font-weight:700; color:#c0392b; background:#fdecea; padding:2px 8px; border-radius:4px; display:inline-block;">
              ✗ Out of stock
            </div>
            <div v-else-if="item.productId && stockMap[item.productId] !== undefined && item.quantity > (stockMap[item.productId] ?? 0)"
              style="margin-top:4px; font-size:12px; font-weight:600; color:#856404; background:#fff3cd; padding:2px 8px; border-radius:4px; display:inline-block;">
              Only {{ stockMap[item.productId] }} left — your quantity will be adjusted
            </div>
          </div>
          <div class="item-actions">
            <div class="quantity-control">
              <button class="qty-btn minus" @click="cartStore.updateQuantity(item.id, -1)">
                −
              </button>
              <div class="qty-display">{{ item.quantity }}</div>
              <button class="qty-btn plus"
                :disabled="item.productId !== undefined && stockMap[item.productId] !== undefined && item.quantity >= (stockMap[item.productId] ?? 0)"
                @click="cartStore.updateQuantity(item.id, 1)">
                +
              </button>
            </div>
            <button class="remove-btn" @click="cartStore.removeItem(item.id)">
              Remove
            </button>
          </div>
        </div>
      </template>
      <div v-else class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <div class="empty-cart-text">Your cart is empty</div>
        <button class="checkout-btn" @click="$router.push('/')">
          Start Shopping
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-section {
  background: white;
  border: 3px solid var(--stroke);
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

.cart-items {
  padding: 24px;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 20px;
  padding: 20px;
  border: 3px solid var(--stroke);
  margin-bottom: 16px;
  transition: all 0.2s;
}

.cart-item:hover {
  background: var(--main);
}

.item-image {
  font-size: 60px;
  text-align: center;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
}

.item-size {
  font-size: 14px;
  color: var(--headline);
  font-weight: 500;
}

.item-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
}

.item-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.quantity-control {
  display: flex;
  align-items: center;
  border: 3px solid var(--stroke);
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: background 0.2s;
}

.qty-btn:hover {
  background: #8bd3dd;
}

.qty-btn.minus {
  border-right: 3px solid var(--stroke);
}

.qty-btn.plus {
  border-left: 3px solid var(--stroke);
}

.qty-display {
  width: 50px;
  text-align: center;
  font-weight: 700;
  color: var(--headline);
}

.remove-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.remove-btn:hover {
  color: #c0392b;
}

.empty-cart {
  text-align: center;
  padding: 60px 24px;
}

.empty-cart-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-cart-text {
  font-size: 20px;
  color: var(--paragraph);
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
  margin-top: 16px;
}

.checkout-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

@media (max-width: 968px) {
  .cart-item {
    grid-template-columns: 60px 1fr;
  }

  .item-actions {
    grid-column: 2;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
