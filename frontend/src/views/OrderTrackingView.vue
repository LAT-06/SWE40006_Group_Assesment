<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from "vue";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/stores/cart";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import type { Order, OrderItemWithProduct } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

const orderId = route.params.orderId as string;
const loading = ref(true);
const error = ref<string | null>(null);

// ─── MARK: Real order data ────────────────────────────────────────────────
const order = shallowRef<Order | null>(null);

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
    order.value = data as Order;
  } catch (e: unknown) {
    error.value = "Order not found or you don't have access.";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// ─── MARK: Computed helpers ───────────────────────────────────────────────
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
  const o = order.value;
  if (!o) return [];
  const current = o.status as string;

  if (current === "cancelled") {
    return [
      {
        ...statusSteps[0],
        status: "completed",
        time: formatDate(o.created_at),
      },
      {
        ...cancelledStep,
        status: "active",
        time: o.cancelled_at
          ? formatDate(o.cancelled_at)
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
        ? formatDate(o.created_at)
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
  return map[order.value.status ?? ''] || order.value.status;
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
  return map[order.value.status ?? ''] || "📋";
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
    (sum: number, item: OrderItemWithProduct) =>
      sum + (item.price_at_purchase ?? 0) * (item.quantity ?? 1),
    0,
  );
});

const deliveryFee = computed(() => {
  const total = order.value?.total_amount ?? 0;
  return Math.max(total - subtotal.value, 0);
});

// ─── MARK: Utilities ──────────────────────────────────────────────────────
const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ─── MARK: Actions ────────────────────────────────────────────────────────
const handlePrint = () => window.print();

const handleReorder = async () => {
  if (!order.value?.order_items?.length) {
    router.push("/");
    return;
  }
  if (!await useConfirmDialog().confirm("Add these items to your cart?")) return;
  order.value.order_items.forEach((item: OrderItemWithProduct) => {
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

// ─── Real-time subscription ───────────────────────────────────────────────
let orderChannel: ReturnType<typeof supabase.channel> | null = null;

const subscribeToOrder = () => {
  if (!orderId) return;
  orderChannel = supabase
    .channel(`order-tracking-${orderId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
      (payload) => {
        const updated = payload.new as Record<string, unknown>;
        if (order.value) {
          order.value = {
            ...order.value,
            status: (updated.status as typeof order.value.status) ?? order.value.status,
            cancelled_at: (updated.cancelled_at as string | null) ?? order.value.cancelled_at,
            updated_at: (updated.updated_at as string) ?? order.value.updated_at,
          };
        }
      }
    )
    .subscribe();
};

onMounted(() => {
  fetchOrder();
  subscribeToOrder();
});

onUnmounted(() => {
  if (orderChannel) supabase.removeChannel(orderChannel);
});
</script>

<template>
  <div class="order-tracking-page">
    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <!-- Loading -->
        <LoadingSpinner v-if="loading" message="Loading order..." size="48px" padding="60px" />

        <!-- Error -->
        <div v-else-if="error" style="padding: 60px; text-align: center; color: #e74c3c">
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
                  <p v-if="order.status === 'cancelled'" style="color: #e74c3c; font-size: 13px; margin: 0">
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
              <div v-for="(item, idx) in timeline" :key="idx" class="timeline-item" :class="item.status">
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
                <span class="detail-value" style="color: #999">No address provided</span>
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
                <span class="detail-value total-price">${{ (order.total_amount ?? 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Items List -->
          <div class="items-card">
            <h3 class="detail-title">
              <span>📦</span>
              <span>Order Items ({{ order.order_items?.length ?? 0 }} items)</span>
            </h3>
            <div class="items-list">
              <div v-for="item in order.order_items" :key="item.product?.id" class="item">
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
            <button v-if="order.status !== 'cancelled'" class="btn btn-primary" @click="handleReorder">
              🛒 Order Again
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-tracking-page {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
}

/* Main Content */
.main-content {
  padding: 40px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.order-number {
  font-size: 20px;
  color: var(--paragraph);
}

.order-number strong {
  color: var(--headline);
  font-weight: 700;
}

/* Status Timeline */
.status-section {
  background: white;
  border: 3px solid var(--stroke);
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
  color: var(--headline);
  margin-bottom: 4px;
}

.status-time {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
}

.eta-box {
  background: var(--secondary);
  border: 3px solid var(--stroke);
  padding: 20px 24px;
  text-align: right;
}

.eta-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--headline);
  opacity: 0.7;
  margin-bottom: 4px;
}

.eta-time {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
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
  background: var(--stroke);
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
  border: 4px solid var(--stroke);
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.timeline-item.completed .timeline-marker {
  background: var(--secondary);
}

.timeline-item.active .timeline-marker {
  background: var(--button);
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
  background: var(--bg);
  border: 3px solid var(--stroke);
  padding: 20px;
}

.timeline-item.completed .timeline-content {
  background: var(--main);
}

.timeline-item.active .timeline-content {
  background: white;
}

.timeline-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
  margin-bottom: 8px;
}

.timeline-description {
  font-size: 14px;
  color: var(--paragraph);
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
  border: 3px solid var(--stroke);
  padding: 24px;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 2px solid var(--stroke);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--paragraph);
  opacity: 0.8;
}

.detail-value {
  font-weight: 600;
  color: var(--headline);
}

.total-price {
  font-size: 20px;
  color: var(--button);
}

/* Items List */
.items-card {
  background: white;
  border: 3px solid var(--stroke);
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
  border: 2px solid var(--stroke);
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
  color: var(--headline);
  margin-bottom: 4px;
}

.item-details {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
}

.item-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
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
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
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
