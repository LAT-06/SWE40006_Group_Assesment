<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

// Get order ID from route params or use default
const orderId = ref(route.params.orderId || "1234");
const lastUpdateMinutes = ref(15);

// Mock order data - in a real app, this would come from an API
const order = ref({
  id: orderId.value,
  placedDate: "Jan 28, 2026",
  placedTime: "10:30 AM",
  currentStatus: "Out for Delivery",
  currentStatusIcon: "🚚",
  estimatedArrival: "2:30 PM - 3:00 PM",
  deliveryAddress: {
    name: "Nguyen Van A",
    phone: "+84 123 456 789",
    address: "123 Nguyen Hue St, District 1, HCMC",
    deliverySlot: "2:00 PM - 4:00 PM",
  },
  payment: {
    method: "Google Pay",
    subtotal: 17.98,
    deliveryFee: 2.0,
    total: 19.98,
  },
  items: [
    {
      id: 1,
      name: "Organic Avocado",
      details: "4 pack × 2",
      price: 11.98,
      icon: "🥑",
    },
    {
      id: 2,
      name: "Fresh Strawberries",
      details: "1 lb × 1",
      price: 4.49,
      icon: "🍓",
    },
    {
      id: 3,
      name: "Organic Whole Milk",
      details: "1 gallon × 1",
      price: 7.49,
      icon: "🥛",
    },
  ],
  timeline: [
    {
      id: 1,
      title: "Order Placed",
      time: "Jan 28, 2026 at 10:30 AM",
      description: "Your order has been received and confirmed",
      icon: "✓",
      status: "completed",
    },
    {
      id: 2,
      title: "Payment Confirmed",
      time: "Jan 28, 2026 at 10:32 AM",
      description: "Payment successfully processed via Google Pay",
      icon: "✓",
      status: "completed",
    },
    {
      id: 3,
      title: "Order Picked",
      time: "Jan 28, 2026 at 11:45 AM",
      description: "Items picked from Store A - District 1",
      icon: "✓",
      status: "completed",
    },
    {
      id: 4,
      title: "Order Packed",
      time: "Jan 28, 2026 at 12:15 PM",
      description: "Your order has been packed and quality checked",
      icon: "✓",
      status: "completed",
    },
    {
      id: 5,
      title: "Out for Delivery",
      time: "Jan 28, 2026 at 2:00 PM",
      description:
        "Your order is on the way. Driver will arrive between 2:30 PM - 3:00 PM",
      icon: "🚚",
      status: "active",
    },
    {
      id: 6,
      title: "Delivered",
      time: "Pending",
      description: "Order will be marked as delivered upon arrival",
      icon: "📦",
      status: "pending",
    },
  ],
});

// Simulate live updates
let updateInterval: number | null = null;

const simulateStatusUpdate = () => {
  const minutes = Math.floor(Math.random() * 5) + 1;
  lastUpdateMinutes.value = minutes;
};

onMounted(() => {
  // Update every 30 seconds
  updateInterval = window.setInterval(simulateStatusUpdate, 30000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

const handlePrint = () => {
  window.print();
};

const handleReorder = () => {
  // In a real app, this would add items back to cart
  router.push("/");
};
</script>

<template>
  <div class="order-tracking-page">
    <!-- Header -->
    <header>
      <div class="container">
        <div class="header-content">
          <router-link to="/" class="logo">FreshCart</router-link>
          <router-link to="/" class="back-link">← Back to Home</router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Track Your Order</h1>
          <p class="order-number">
            Order <strong>#ORD-{{ order.id }}</strong> | Placed on
            {{ order.placedDate }} at {{ order.placedTime }}
          </p>
        </div>

        <!-- Status Section -->
        <div class="status-section">
          <div class="status-header">
            <div class="current-status">
              <div class="status-icon">{{ order.currentStatusIcon }}</div>
              <div class="status-info">
                <h3>{{ order.currentStatus }}</h3>
                <p class="status-time">
                  Updated {{ lastUpdateMinutes }} minute{{
                    lastUpdateMinutes > 1 ? "s" : ""
                  }}
                  ago
                </p>
              </div>
            </div>
            <div class="eta-box">
              <div class="eta-label">ESTIMATED ARRIVAL</div>
              <div class="eta-time">{{ order.estimatedArrival }}</div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="timeline">
            <div
              v-for="item in order.timeline"
              :key="item.id"
              class="timeline-item"
              :class="item.status"
            >
              <div class="timeline-marker">{{ item.icon }}</div>
              <div class="timeline-content">
                <div class="timeline-title">{{ item.title }}</div>
                <div class="timeline-time">{{ item.time }}</div>
                <div class="timeline-description">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Details -->
        <div class="details-grid">
          <div class="detail-card">
            <h3 class="detail-title">
              <span>📍</span>
              <span>Delivery Address</span>
            </h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">{{ order.deliveryAddress.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">{{
                order.deliveryAddress.phone
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">{{
                order.deliveryAddress.address
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Delivery Slot:</span>
              <span class="detail-value">{{
                order.deliveryAddress.deliverySlot
              }}</span>
            </div>
          </div>

          <div class="detail-card">
            <h3 class="detail-title">
              <span>💳</span>
              <span>Payment & Summary</span>
            </h3>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">{{ order.payment.method }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Subtotal:</span>
              <span class="detail-value"
                >${{ order.payment.subtotal.toFixed(2) }}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Delivery Fee:</span>
              <span class="detail-value"
                >${{ order.payment.deliveryFee.toFixed(2) }}</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Paid:</span>
              <span class="detail-value total-price"
                >${{ order.payment.total.toFixed(2) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Items List -->
        <div class="items-card">
          <h3 class="detail-title">
            <span>📦</span>
            <span>Order Items ({{ order.items.length }} items)</span>
          </h3>
          <div class="items-list">
            <div v-for="item in order.items" :key="item.id" class="item">
              <div class="item-icon">{{ item.icon }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-details">{{ item.details }}</div>
              </div>
              <div class="item-price">${{ item.price.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn btn-secondary" @click="handlePrint">
            📄 Print Receipt
          </button>
          <button class="btn btn-primary" @click="handleReorder">
            🛒 Order Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.order-tracking-page {
  font-family: "DM Sans", sans-serif;
  background: #fef6e4;
  color: #172c66;
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
header {
  background: #fef6e4;
  border-bottom: 3px solid #001858;
  padding: 20px 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-family: "Space Mono", monospace;
  font-size: 28px;
  font-weight: 700;
  color: #001858;
  text-decoration: none;
}

.back-link {
  color: #001858;
  text-decoration: none;
  font-weight: 500;
  padding: 10px 20px;
  border: 3px solid #001858;
  background: white;
  transition: all 0.2s;
}

.back-link:hover {
  background: #f3d2c1;
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 #001858;
}

/* Main Content */
.main-content {
  padding: 40px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 12px;
}

.order-number {
  font-size: 20px;
  color: #172c66;
}

.order-number strong {
  color: #001858;
  font-weight: 700;
}

/* Status Timeline */
.status-section {
  background: white;
  border: 3px solid #001858;
  padding: 40px;
  margin-bottom: 30px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-icon {
  font-size: 48px;
}

.status-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 4px;
}

.status-time {
  font-size: 14px;
  color: #172c66;
  opacity: 0.7;
}

.eta-box {
  background: #8bd3dd;
  border: 3px solid #001858;
  padding: 20px 24px;
  text-align: right;
}

.eta-label {
  font-size: 12px;
  font-weight: 700;
  color: #001858;
  opacity: 0.7;
  margin-bottom: 4px;
}

.eta-time {
  font-size: 24px;
  font-weight: 700;
  color: #001858;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 60px;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #001858;
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: -52px;
  width: 40px;
  height: 40px;
  border: 4px solid #001858;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.timeline-item.completed .timeline-marker {
  background: #8bd3dd;
}

.timeline-item.active .timeline-marker {
  background: #f582ae;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.timeline-content {
  background: #fef6e4;
  border: 3px solid #001858;
  padding: 20px;
}

.timeline-item.completed .timeline-content {
  background: #f3d2c1;
}

.timeline-item.active .timeline-content {
  background: white;
}

.timeline-title {
  font-size: 18px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 14px;
  color: #172c66;
  opacity: 0.7;
  margin-bottom: 8px;
}

.timeline-description {
  font-size: 14px;
  color: #172c66;
}

/* Order Details */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.detail-card {
  background: white;
  border: 3px solid #001858;
  padding: 24px;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 2px solid #001858;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #172c66;
  opacity: 0.8;
}

.detail-value {
  font-weight: 600;
  color: #001858;
}

.total-price {
  font-size: 20px;
  color: #f582ae;
}

/* Items List */
.items-card {
  background: white;
  border: 3px solid #001858;
  padding: 24px;
}

.items-list {
  margin-top: 20px;
}

.item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #001858;
  margin-bottom: 12px;
}

.item:last-child {
  margin-bottom: 0;
}

.item-icon {
  font-size: 40px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 700;
  color: #001858;
  margin-bottom: 4px;
}

.item-details {
  font-size: 14px;
  color: #172c66;
  opacity: 0.7;
}

.item-price {
  font-size: 18px;
  font-weight: 700;
  color: #001858;
}

/* Actions */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 30px;
}

.btn {
  padding: 14px 32px;
  border: 3px solid #001858;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  background: white;
}

.btn-primary {
  background: #f582ae;
  color: #001858;
}

.btn-secondary {
  background: white;
  color: #001858;
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #001858;
}

/* Responsive */
@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }

  .status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .eta-box {
    text-align: left;
    width: 100%;
  }

  .timeline {
    padding-left: 50px;
  }

  .timeline-marker {
    left: -42px;
    width: 32px;
    height: 32px;
  }
}
</style>
