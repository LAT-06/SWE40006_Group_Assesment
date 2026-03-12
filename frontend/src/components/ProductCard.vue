<script setup lang="ts">
import type { Product } from '@/stores/products'

defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  addToCart: [product: Product]
  click: [productId: string]
}>()
</script>

<template>
  <div class="product-card" @click="emit('click', product.id)">
    <div v-if="product.badge" class="product-badge">
      {{ product.badge }}
    </div>
    <div class="product-image">
      {{ product.image_url || '📦' }}
    </div>
    <div class="product-info">
      <div class="product-title">{{ product.name }}</div>
      <div class="product-weight">{{ product.weight }}</div>
      <div class="product-footer">
        <div class="product-price">${{ product.price.toFixed(2) }}</div>
        <button class="add-to-cart" @click.stop="emit('addToCart', product)">
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: var(--bg);
  border: 3px solid var(--stroke);
  padding: 0;
  transition: all 0.3s;
  position: relative;
  cursor: pointer;
}

.product-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0 var(--stroke);
}

.product-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f582ae;
  color: var(--headline);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid var(--stroke);
  z-index: 1;
}

.product-image {
  background: white;
  border-bottom: 3px solid var(--stroke);
  padding: 40px;
  text-align: center;
  font-size: 80px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-info {
  padding: 20px;
}

.product-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-weight {
  font-size: 14px;
  color: var(--paragraph);
  margin-bottom: 16px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
}

.add-to-cart {
  background: #f582ae;
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.add-to-cart:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}
</style>
