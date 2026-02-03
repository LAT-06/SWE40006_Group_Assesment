<template>
  <div class="cart-page">
    <!-- Progress Steps -->
    <div class="progress-steps">
      <div class="container">
        <div class="steps">
          <div
            class="step"
            :class="{ active: currentStep === 1, completed: currentStep > 1 }"
          >
            <div class="step-number">1</div>
            <div class="step-label">Shopping Cart</div>
          </div>
          <div
            class="step"
            :class="{ active: currentStep === 2, completed: currentStep > 2 }"
          >
            <div class="step-number">2</div>
            <div class="step-label">Checkout</div>
          </div>
          <div
            class="step"
            :class="{ active: currentStep === 3, completed: currentStep > 3 }"
          >
            <div class="step-number">3</div>
            <div class="step-label">Payment</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <!-- Cart View -->
        <div v-if="currentStep === 1" class="cart-view">
          <div class="cart-layout">
            <!-- Cart Items -->
            <div class="cart-section">
              <div class="section-header">
                <h2 class="section-title">
                  Shopping Cart ({{ cartStore.itemCount }} items)
                </h2>
              </div>
              <div class="cart-items">
                <template v-if="cartStore.items.length > 0">
                  <div
                    v-for="item in cartStore.items"
                    :key="item.id"
                    class="cart-item"
                  >
                    <div class="item-image">{{ item.icon }}</div>
                    <div class="item-details">
                      <div class="item-name">{{ item.name }}</div>
                      <div class="item-size">{{ item.size }}</div>
                      <div class="item-price">${{ item.price.toFixed(2) }}</div>
                    </div>
                    <div class="item-actions">
                      <div class="quantity-control">
                        <button
                          class="qty-btn minus"
                          @click="cartStore.updateQuantity(item.id, -1)"
                        >
                          −
                        </button>
                        <div class="qty-display">{{ item.quantity }}</div>
                        <button
                          class="qty-btn plus"
                          @click="cartStore.updateQuantity(item.id, 1)"
                        >
                          +
                        </button>
                      </div>
                      <button
                        class="remove-btn"
                        @click="cartStore.removeItem(item.id)"
                      >
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

            <!-- Order Summary -->
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
                  <span style="color: #27ae60"
                    >-${{ cartStore.discount.toFixed(2) }}</span
                  >
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>${{ cartStore.total.toFixed(2) }}</span>
                </div>

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
                      v-model="promoCode"
                      type="text"
                      class="promo-input"
                      placeholder="Promo code"
                    />
                    <button class="promo-btn" @click="applyPromo">Apply</button>
                  </div>
                </div>

                <button
                  class="checkout-btn"
                  :disabled="cartStore.items.length === 0"
                  @click="proceedToCheckout"
                >
                  Proceed to Checkout
                </button>
                <button class="continue-shopping" @click="$router.push('/')">
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Checkout View -->
        <div v-else-if="currentStep === 2" class="checkout-section">
          <div class="checkout-layout">
            <!-- Checkout Form -->
            <div>
              <!-- Delivery Address -->
              <div class="form-section">
                <h3 class="form-section-title">Delivery Address</h3>
                <form @submit.prevent="validateAndContinue">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input
                      v-model="checkoutForm.fullName"
                      type="text"
                      class="form-input"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input
                      v-model="checkoutForm.phone"
                      type="tel"
                      class="form-input"
                      placeholder="+84 123 456 789"
                      required
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Street Address *</label>
                    <input
                      v-model="checkoutForm.address"
                      type="text"
                      class="form-input"
                      placeholder="House number and street name"
                      required
                    />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">District *</label>
                      <select
                        v-model="checkoutForm.district"
                        class="form-select"
                        @change="updateDeliveryZone"
                        required
                      >
                        <option value="">Select district</option>
                        <option value="zone-a">District 1</option>
                        <option value="zone-a">District 3</option>
                        <option value="zone-a">District 5</option>
                        <option value="zone-b">District 2</option>
                        <option value="zone-b">District 7</option>
                        <option value="zone-b">District 9</option>
                        <option value="zone-c">District 12</option>
                        <option value="zone-c">Thu Duc</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">City *</label>
                      <input
                        type="text"
                        class="form-input"
                        value="Ho Chi Minh City"
                        readonly
                      />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Delivery Notes (Optional)</label>
                    <textarea
                      v-model="checkoutForm.notes"
                      class="form-input"
                      rows="3"
                      placeholder="Special instructions for delivery"
                    ></textarea>
                  </div>
                </form>
              </div>

              <!-- Delivery Slot -->
              <div class="form-section">
                <h3 class="form-section-title">Select Delivery Slot</h3>
                <div class="slot-grid">
                  <div
                    v-for="slot in deliverySlots"
                    :key="slot.id"
                    class="slot-option"
                    :class="{
                      selected: selectedSlot === slot.id,
                      unavailable: !slot.available,
                    }"
                    @click="slot.available && (selectedSlot = slot.id)"
                  >
                    <div class="slot-time">{{ slot.time }}</div>
                    <div class="slot-availability">
                      {{ slot.slots }} slots available
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment Method -->
              <div class="form-section">
                <h3 class="form-section-title">Payment Method</h3>
                <div class="payment-methods">
                  <div
                    v-for="method in paymentMethods"
                    :key="method.id"
                    class="payment-option"
                    :class="{ selected: selectedPayment === method.id }"
                    @click="selectedPayment = method.id"
                  >
                    <div class="payment-icon">{{ method.icon }}</div>
                    <div>
                      <div class="payment-name">{{ method.name }}</div>
                      <div class="payment-description">
                        {{ method.description }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="margin-top: 24px">
                <button class="back-to-cart" @click="currentStep = 1">
                  ← Back to Cart
                </button>
                <button
                  class="checkout-btn"
                  style="width: auto; display: inline-block; padding: 14px 40px"
                  @click="placeOrder"
                >
                  Place Order
                </button>
              </div>
            </div>

            <!-- Order Summary (Checkout) -->
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
                  <span style="color: #27ae60"
                    >-${{ cartStore.discount.toFixed(2) }}</span
                  >
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>${{ cartStore.total.toFixed(2) }}</span>
                </div>

                <div class="delivery-info">
                  <div class="delivery-info-title">
                    <span>📦</span>
                    <span>Items in Order</span>
                  </div>
                  <div style="margin-top: 12px">
                    <div
                      v-for="item in cartStore.items"
                      :key="item.id"
                      style="
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        font-size: 14px;
                        color: #001858;
                        font-weight: 500;
                      "
                    >
                      <span>{{ item.name }} × {{ item.quantity }}</span>
                      <span style="font-weight: 700"
                        >${{ (item.price * item.quantity).toFixed(2) }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Overlay -->
    <div v-if="showSuccess" class="success-overlay" @click="closeSuccess">
      <div class="success-content" @click.stop>
        <h2 class="success-title">Order Placed Successfully!</h2>
        <div class="order-number">Order #ORD-{{ orderId }}</div>
        <p class="success-text">
          Thank you for your order! We'll send you a confirmation email shortly.
          You can track your delivery in real-time.
        </p>
        <button
          class="checkout-btn"
          style="margin-bottom: 12px"
          @click="closeSuccess"
        >
          Track Order
        </button>
        <button
          class="continue-shopping"
          style="margin-top: 0"
          @click="continueShopping"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";

const router = useRouter();
const cartStore = useCartStore();

const currentStep = ref(1);
const promoCode = ref("");
const selectedSlot = ref<string | null>(null);
const selectedPayment = ref<string | null>(null);
const showSuccess = ref(false);
const orderId = ref(0);

const checkoutForm = ref({
  fullName: "",
  phone: "",
  address: "",
  district: "",
  notes: "",
});

const deliverySlots = ref([
  { id: "8-10", time: "8:00 AM - 10:00 AM", slots: 18, available: true },
  { id: "10-12", time: "10:00 AM - 12:00 PM", slots: 5, available: true },
  { id: "14-16", time: "2:00 PM - 4:00 PM", slots: 22, available: true },
  { id: "16-18", time: "4:00 PM - 6:00 PM", slots: 10, available: true },
]);

const paymentMethods = ref([
  {
    id: "card",
    icon: "💳",
    name: "Credit/Debit Card",
    description: "Pay securely online",
  },
  {
    id: "google",
    icon: "🔵",
    name: "Google Pay",
    description: "Fast & secure payment",
  },
  {
    id: "cash",
    icon: "💵",
    name: "Cash on Delivery",
    description: "Pay when you receive",
  },
]);

function applyPromo() {
  if (cartStore.applyPromoCode(promoCode.value)) {
    alert("Promo code applied! 10% discount");
  } else {
    alert('Invalid promo code. Try "FRESH10"');
  }
}

function proceedToCheckout() {
  if (cartStore.items.length === 0) return;
  currentStep.value = 2;
  window.scrollTo(0, 0);
}

function updateDeliveryZone() {
  if (checkoutForm.value.district) {
    cartStore.updateDeliveryFee(checkoutForm.value.district);
  }
}

function validateAndContinue() {
  // Form validation is handled by HTML5 required attributes
}

function placeOrder() {
  // Validate form
  if (
    !checkoutForm.value.fullName ||
    !checkoutForm.value.phone ||
    !checkoutForm.value.address ||
    !checkoutForm.value.district
  ) {
    alert("Please fill in all required fields");
    return;
  }

  if (!selectedSlot.value) {
    alert("Please select a delivery slot");
    return;
  }

  if (!selectedPayment.value) {
    alert("Please select a payment method");
    return;
  }

  // Update steps
  currentStep.value = 3;

  // Generate random order ID
  orderId.value = Math.floor(1000 + Math.random() * 9000);

  // Show success overlay
  showSuccess.value = true;

  // Clear cart
  cartStore.clearCart();
}

function closeSuccess() {
  showSuccess.value = false;
  // Redirect to order tracking
  router.push(`/order-tracking/${orderId.value}`);
}

function continueShopping() {
  showSuccess.value = false;
  router.push("/");
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.cart-page {
  background: #fef6e4;
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
  border-bottom: 3px solid #001858;
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
  color: #001858;
  opacity: 0.3;
}

.step:last-child::after {
  display: none;
}

.step-number {
  width: 40px;
  height: 40px;
  border: 3px solid #001858;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #172c66;
}

.step.active .step-number {
  background: #f582ae;
  color: #001858;
}

.step.completed .step-number {
  background: #8bd3dd;
  color: #001858;
}

.step-label {
  font-weight: 600;
  color: #172c66;
}

.step.active .step-label {
  color: #001858;
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

/* Cart Items */
.cart-section {
  background: white;
  border: 3px solid #001858;
}

.section-header {
  padding: 24px;
  border-bottom: 3px solid #001858;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #001858;
}

.cart-items {
  padding: 24px;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 20px;
  padding: 20px;
  border: 3px solid #001858;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.cart-item:hover {
  background: #f3d2c1;
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
  color: #001858;
}

.item-size {
  font-size: 14px;
  color: #001858;
  font-weight: 500;
}

.item-price {
  font-size: 20px;
  font-weight: 700;
  color: #001858;
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
  border: 3px solid #001858;
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
  border-right: 3px solid #001858;
}

.qty-btn.plus {
  border-left: 3px solid #001858;
}

.qty-display {
  width: 50px;
  text-align: center;
  font-weight: 700;
  color: #001858;
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
  color: #172c66;
  margin-bottom: 24px;
}

/* Order Summary */
.summary-section {
  background: white;
  border: 3px solid #001858;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.summary-content {
  padding: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 16px;
  color: #172c66;
}

.summary-row.total {
  border-top: 3px solid #001858;
  margin-top: 12px;
  padding-top: 20px;
  font-size: 24px;
  font-weight: 700;
  color: #001858;
}

.delivery-info {
  background: #f3d2c1;
  border: 3px solid #001858;
  padding: 16px;
  margin: 16px 0;
}

.delivery-info-title {
  font-weight: 700;
  color: #001858;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.delivery-info-text {
  font-size: 14px;
  color: #172c66;
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
  border: 3px solid #001858;
  border-right: none;
  font-family: "DM Sans", sans-serif;
  outline: none;
}

.promo-btn {
  padding: 12px 20px;
  border: 3px solid #001858;
  background: white;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
}

.promo-btn:hover {
  background: #8bd3dd;
}

.checkout-btn {
  width: 100%;
  background: #f582ae;
  color: #001858;
  border: 3px solid #001858;
  padding: 18px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
  margin-top: 16px;
}

.checkout-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 #001858;
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.continue-shopping {
  width: 100%;
  background: white;
  color: #001858;
  border: 3px solid #001858;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
  margin-top: 12px;
}

.continue-shopping:hover {
  background: #f3d2c1;
}

/* Checkout Form */
.checkout-section {
  display: block;
}

.form-section {
  background: white;
  border: 3px solid #001858;
  padding: 24px;
  margin-bottom: 20px;
}

.form-section-title {
  font-size: 20px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 700;
  color: #001858;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 14px 16px;
  border: 3px solid #001858;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
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
  border: 3px solid #001858;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.slot-option:hover {
  background: #f3d2c1;
}

.slot-option.selected {
  background: #f582ae;
  border-color: #001858;
}

.slot-time {
  font-weight: 700;
  color: #001858;
  margin-bottom: 4px;
}

.slot-availability {
  font-size: 12px;
  color: #172c66;
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
  border: 3px solid #001858;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-option:hover {
  background: #f3d2c1;
}

.payment-option.selected {
  background: #8bd3dd;
  border-color: #001858;
}

.payment-icon {
  font-size: 24px;
}

.payment-name {
  font-weight: 700;
  color: #001858;
}

.payment-description {
  font-size: 12px;
  color: #001858;
  font-weight: 500;
}

.back-to-cart {
  background: white;
  color: #001858;
  border: 3px solid #001858;
  padding: 14px 24px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
  margin-right: 12px;
}

.back-to-cart:hover {
  background: #f3d2c1;
}

/* Success Message */
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
  border: 3px solid #001858;
  box-shadow: 8px 8px 0 #001858;
  padding: 60px;
  text-align: center;
  max-width: 500px;
}

.success-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.success-title {
  font-size: 32px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 16px;
}

.success-text {
  font-size: 16px;
  color: #172c66;
  margin-bottom: 32px;
}

.order-number {
  background: #f3d2c1;
  border: 3px solid #001858;
  padding: 16px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 24px;
}

/* Responsive */
@media (max-width: 968px) {
  .cart-layout,
  .checkout-layout {
    grid-template-columns: 1fr;
  }

  .summary-section {
    position: static;
  }

  .steps {
    gap: 20px;
  }

  .step-label {
    display: none;
  }

  .cart-item {
    grid-template-columns: 60px 1fr;
  }

  .item-actions {
    grid-column: 2;
    flex-direction: row;
    justify-content: space-between;
  }
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
