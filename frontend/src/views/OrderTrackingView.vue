<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/stores/cart";

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

const orderId = route.params.orderId as string;
const loading = ref(true);
const error = ref<string | null>(null);

// ─── Real order data ────────────────────────────────────────────────
const order = ref<any>(null);

const fetchOrder = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data, error: err } = await supabase
      .from("orders")
      .select(
        `*, order_items:order_items(quantity, price_at_purchase, product:products(id, name, image_url, price)),
         delivery_slot:delivery_slots(id, slot_date, start_time, end_time, delivery_zones(name))`,
      )
      .eq("id", orderId)
      .single();
    if (err) throw err;
    order.value = data;
  } catch (e: any) {
    error.value = "Order not found or you don't have access.";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// ─── Computed helpers ───────────────────────────────────────────────
const statusSteps = [
  {
    key: "pending",
    label: "Order Placed",
    icon: "✓",
    description: "Your order has been received and confirmed.",
  },
  {
    key: "processing",
    label: "Processing",
    icon: "⚙️",
    description: "Your order is being prepared and packed.",
  },
  {
    key: "shipped",
    label: "Out for Delivery",
    icon: "🚚",
    description: "Your order is on its way to you.",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: "📦",
    description: "Order successfully delivered.",
  },
];

const cancelledStep = {
  key: "cancelled",
  label: "Order Cancelled",
  icon: "✕",
  description: "This order was cancelled.",
};

const statusOrder = ["pending", "processing", "shipped", "delivered"];

const timeline = computed(() => {
  if (!order.value) return [];
  const current = order.value.status as string;

  if (current === "cancelled") {
    return [
      {
        ...statusSteps[0],
        status: "completed",
        time: formatDate(order.value.created_at),
      },
      {
        ...cancelledStep,
        status: "active",
        time: order.value.cancelled_at
          ? formatDate(order.value.cancelled_at)
          : "—",
      },
    ];
  }

  const currentIdx = statusOrder.indexOf(current);
  return statusSteps.map((step, idx) => ({
    ...step,
    status:
      idx < currentIdx
        ? "completed"
        : idx === currentIdx
          ? "active"
          : "pending",
    time:
      idx === 0
        ? formatDate(order.value.created_at)
        : idx <= currentIdx
          ? "✓ Done"
          : "Pending",
  }));
});

const currentStatusLabel = computed(() => {
  if (!order.value) return "Loading…";
  const map: Record<string, string> = {
    pending: "Order Placed",
    processing: "Processing",
    shipped: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[order.value.status] || order.value.status;
});

const currentStatusIcon = computed(() => {
  if (!order.value) return "📋";
  const map: Record<string, string> = {
    pending: "✓",
    processing: "⚙️",
    shipped: "🚚",
    delivered: "📦",
    cancelled: "✕",
  };
  return map[order.value.status] || "📋";
});

const deliverySlotLabel = computed(() => {
  const slot = order.value?.delivery_slot;
  if (!slot) return "Not selected";
  const date = new Date(slot.slot_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const zone = slot.delivery_zones?.name
    ? ` · ${slot.delivery_zones.name}`
    : "";
  return `${date} · ${slot.start_time?.slice(0, 5)}–${slot.end_time?.slice(0, 5)}${zone}`;
});

const shippingAddress = computed(() => {
  const addr = order.value?.shipping_address;
  if (!addr) return null;
  if (typeof addr === "string") {
    try {
      return JSON.parse(addr);
    } catch {
      return { address: addr };
    }
  }
  return addr;
});

const subtotal = computed(() => {
  if (!order.value?.order_items) return 0;
  return order.value.order_items.reduce(
    (sum: number, item: any) =>
      sum + (item.price_at_purchase ?? 0) * (item.quantity ?? 1),
    0,
  );
});

const deliveryFee = computed(() => {
  const total = order.value?.total_amount ?? 0;
  return Math.max(total - subtotal.value, 0);
});

// ─── Utilities ──────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ─── Actions ────────────────────────────────────────────────────────
const handlePrint = () => window.print();

const handleReorder = () => {
  if (!order.value?.order_items?.length) {
    router.push("/");
    return;
  }
  if (!confirm("Add these items to your cart?")) return;
  order.value.order_items.forEach((item: any) => {
    cartStore.addItem({
      productId: item.product?.id,
      name: item.product?.name || "Product",
      price: item.price_at_purchase ?? item.product?.price ?? 0,
      size: "",
      icon: item.product?.image_url || "🛒",
      quantity: item.quantity,
    });
  });
  router.push("/cart");
};

onMounted(fetchOrder);
</script>

<template>
  <div class="order-tracking-page">
    <!-- Header -->
    <header>
      <div class="container">
        <div class="header-content">
          <router-link to="/" class="logo">Deployma</router-link>
          <router-link to="/profile" class="back-link">← My Orders</router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <!-- Loading -->
        <div
          v-if="loading"
          style="padding: 60px; text-align: center; font-size: 18px"
        >
          Loading order…
        </div>

        <!-- Error -->
        <div
          v-else-if="error"
          style="padding: 60px; text-align: center; color: #e74c3c"
        >
          {{ error }}
          <br /><router-link to="/profile">← Back to My Orders</router-link>
        </div>

        <!-- Order Content -->
        <template v-else-if="order">
          <div class="page-header">
            <h1 class="page-title">Track Your Order</h1>
            <p class="order-number">
              Order <strong>#{{ order.id.slice(0, 8).toUpperCase() }}</strong> |
              Placed on
              {{ formatDate(order.created_at) }}
            </p>
          </div>

          <!-- Status Section -->
          <div class="status-section">
            <div class="status-header">
              <div class="current-status">
                <div class="status-icon">{{ currentStatusIcon }}</div>
                <div class="status-info">
                  <h3>{{ currentStatusLabel }}</h3>
                  <p
                    v-if="order.status === 'cancelled'"
                    style="color: #e74c3c; font-size: 13px; margin: 0"
                  >
                    Cancelled
                    {{
                      order.cancelled_at ? formatDate(order.cancelled_at) : ""
                    }}
                  </p>
                  <p v-else class="status-time">Status updated by admin</p>
                </div>
              </div>
              <div class="eta-box">
                <div class="eta-label">DELIVERY SLOT</div>
                <div class="eta-time">{{ deliverySlotLabel }}</div>
              </div>
            </div>

            <!-- Timeline -->
            <div class="timeline">
              <div
                v-for="(item, idx) in timeline"
                :key="idx"
                class="timeline-item"
                :class="item.status"
              >
                <div class="timeline-marker">{{ item.icon }}</div>
                <div class="timeline-content">
                  <div class="timeline-title">{{ item.label }}</div>
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
              <template v-if="shippingAddress">
                <div v-if="shippingAddress.name" class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">{{ shippingAddress.name }}</span>
                </div>
                <div v-if="shippingAddress.phone" class="detail-row">
                  <span class="detail-label">Phone:</span>
                  <span class="detail-value">{{ shippingAddress.phone }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">
                    {{
                      shippingAddress.address ||
                      shippingAddress.street ||
                      JSON.stringify(shippingAddress)
                    }}
                  </span>
                </div>
              </template>
              <div v-else class="detail-row">
                <span class="detail-value" style="color: #999"
                  >No address provided</span
                >
              </div>
              <div class="detail-row">
                <span class="detail-label">Delivery Slot:</span>
                <span class="detail-value">{{ deliverySlotLabel }}</span>
              </div>
              <div v-if="order.notes" class="detail-row">
                <span class="detail-label">Notes:</span>
                <span class="detail-value">{{ order.notes }}</span>
              </div>
            </div>

            <div class="detail-card">
              <h3 class="detail-title">
                <span>💳</span>
                <span>Payment &amp; Summary</span>
              </h3>
              <div class="detail-row">
                <span class="detail-label">Subtotal:</span>
                <span class="detail-value">${{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Delivery Fee:</span>
                <span class="detail-value">${{ deliveryFee.toFixed(2) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Paid:</span>
                <span class="detail-value total-price"
                  >${{ (order.total_amount ?? 0).toFixed(2) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Items List -->
          <div class="items-card">
            <h3 class="detail-title">
              <span>📦</span>
              <span
                >Order Items ({{ order.order_items?.length ?? 0 }} items)</span
              >
            </h3>
            <div class="items-list">
              <div
                v-for="item in order.order_items"
                :key="item.product?.id"
                class="item"
              >
                <div class="item-icon">
                  {{ item.product?.image_url || "🛒" }}
                </div>
                <div class="item-info">
                  <div class="item-name">
                    {{ item.product?.name || "Product" }}
                  </div>
                  <div class="item-details">Qty: {{ item.quantity }}</div>
                </div>
                <div class="item-price">
                  ${{
                    ((item.price_at_purchase ?? 0) * item.quantity).toFixed(2)
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="btn btn-secondary" @click="handlePrint">
              📄 Print Receipt
            </button>
            <button
              v-if="order.status !== 'cancelled'"
              class="btn btn-primary"
              @click="handleReorder"
            >
              🛒 Order Again
            </button>
          </div>
        </template>
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
