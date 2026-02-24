<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const activeSection = ref("profile");

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const orders = ref<any[]>([]);
const ordersLoading = ref(false);

// ─── Delivery Slots ─────────────────────────────────────────────────
const availableSlots = ref<any[]>([]);
const slotsLoading = ref(false);

const fetchAvailableSlots = async () => {
  slotsLoading.value = true;
  try {
    const res = await fetch(`${API_URL}/delivery-slots`);
    if (res.ok) availableSlots.value = await res.json();
  } catch (e) {
    console.error("Failed to fetch delivery slots", e);
  } finally {
    slotsLoading.value = false;
  }
};

const formatSlot = (slot: any) => {
  if (!slot) return "—";
  const date = new Date(slot.slot_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date} · ${slot.start_time?.slice(0, 5)} – ${slot.end_time?.slice(0, 5)}${slot.delivery_zones?.name ? " · " + slot.delivery_zones.name : ""}`;
};

// ─── Cancel Order ────────────────────────────────────────────────────
const cancelOrder = async (orderId: string) => {
  if (!confirm("Cancel this order? This cannot be undone.")) return;
  try {
    const token = await getToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }
    const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to cancel order");
    }
    await fetchOrders();
  } catch (e: any) {
    alert("Error: " + e.message);
  }
};

// ─── Select Delivery Slot ─────────────────────────────────────────────
const slotPickerOrderId = ref<string | null>(null);
const selectedSlotId = ref<string>("");
const slotNotes = ref<string>("");

const openSlotPicker = (orderId: string, currentSlotId?: string) => {
  slotPickerOrderId.value = orderId;
  selectedSlotId.value = currentSlotId || "";
  slotNotes.value = "";
};

const confirmSlotSelection = async () => {
  if (!slotPickerOrderId.value || !selectedSlotId.value) {
    alert("Please select a delivery slot.");
    return;
  }
  try {
    const token = await getToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }
    const res = await fetch(
      `${API_URL}/orders/${slotPickerOrderId.value}/slot`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          delivery_slot_id: selectedSlotId.value,
          notes: slotNotes.value,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to assign slot");
    }
    slotPickerOrderId.value = null;
    selectedSlotId.value = "";
    slotNotes.value = "";
    await fetchOrders();
  } catch (e: any) {
    alert("Error: " + e.message);
  }
};

const memberSince = computed(() => {
  const createdAt = authStore.user?.created_at;
  if (!createdAt) return "—";
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});

const totalSpent = computed(() =>
  orders.value.reduce((sum, o) => sum + (o.total_amount || 0), 0),
);

const statusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "status-delivered";
    case "cancelled":
      return "status-cancelled";
    default:
      return "status-processing";
  }
};

const fetchOrders = async () => {
  const userId = authStore.user?.id;
  if (!userId) return;
  ordersLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, order_items:order_items(quantity, product:products(id, name, image_url)), delivery_slot:delivery_slots(id, slot_date, start_time, end_time, delivery_zones(name))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    orders.value = data || [];
  } catch (err) {
    console.error("Error fetching orders:", err);
  } finally {
    ordersLoading.value = false;
  }
};

onMounted(async () => {
  await fetchOrders();
  await fetchAvailableSlots();
  await fetchAddresses();
});

const switchSection = (sectionId: string) => {
  activeSection.value = sectionId;
};

const reorder = (order: any) => {
  if (!order?.order_items) return;
  if (confirm("Add these items to your cart?")) {
    order.order_items.forEach((item: any) => {
      cartStore.addItem({
        productId: item.product?.id,
        name: item.product?.name || "Product",
        price: item.product?.price ?? 0,
        size: "",
        icon: item.product?.image_url || "🛒",
        quantity: item.quantity,
      });
    });
    router.push("/cart");
  }
};

// ─── Saved Addresses ────────────────────────────────────────────────
interface UserAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  district: string;
  is_default: boolean;
}
const userAddresses = ref<UserAddress[]>([]);
const showAddressModal = ref(false);
const editingAddressId = ref<string | null>(null);
const addressForm = ref({ label: "Home", full_name: "", phone: "", address: "", district: "" });

const districtOptions = [
  { value: "zone-a", label: "District 1" },
  { value: "zone-a", label: "District 3" },
  { value: "zone-a", label: "District 5" },
  { value: "zone-b", label: "District 2" },
  { value: "zone-b", label: "District 7" },
  { value: "zone-b", label: "District 9" },
  { value: "zone-c", label: "District 12" },
  { value: "zone-c", label: "Thu Duc" },
];

const fetchAddresses = async () => {
  const userId = authStore.user?.id;
  if (!userId) return;
  const { data } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  if (data) userAddresses.value = data;
};

const openAddAddress = () => {
  editingAddressId.value = null;
  addressForm.value = { label: "Home", full_name: "", phone: "", address: "", district: "" };
  showAddressModal.value = true;
};

const openEditAddress = (addr: UserAddress) => {
  editingAddressId.value = addr.id;
  addressForm.value = { label: addr.label, full_name: addr.full_name, phone: addr.phone, address: addr.address, district: addr.district };
  showAddressModal.value = true;
};

const saveAddress = async () => {
  const userId = authStore.user?.id;
  if (!userId) return;
  const payload = { ...addressForm.value, user_id: userId };
  if (editingAddressId.value) {
    await supabase.from("user_addresses").update(payload).eq("id", editingAddressId.value);
  } else {
    const isFirst = userAddresses.value.length === 0;
    await supabase.from("user_addresses").insert({ ...payload, is_default: isFirst });
  }
  showAddressModal.value = false;
  await fetchAddresses();
};

const deleteAddress = async (id: string) => {
  if (!confirm("Delete this address?")) return;
  await supabase.from("user_addresses").delete().eq("id", id);
  await fetchAddresses();
};

const setDefaultAddress = async (id: string) => {
  const userId = authStore.user?.id;
  if (!userId) return;
  await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", userId);
  await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
  await fetchAddresses();
};

const logout = () => {
  authStore.signOut();
  router.push("/");
};
</script>

<template>
  <div class="profile-page">
    <!-- Header -->
    <header>
      <div class="container">
        <div class="header-content">
          <router-link to="/" class="logo">Deployma</router-link>
          <router-link to="/" class="back-link">← Back to Home</router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <div class="account-layout">
          <!-- Sidebar -->
          <aside class="sidebar">
            <div class="profile-header">
              <div class="avatar">
                {{ authStore.user?.user_metadata?.name?.charAt(0) || "U" }}
              </div>
              <div class="profile-name">
                {{ authStore.user?.user_metadata?.name || "User" }}
              </div>
              <div class="profile-email">
                {{ authStore.user?.email || "user@email.com" }}
              </div>
            </div>
            <nav class="nav-menu">
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'profile' }"
                @click.prevent="switchSection('profile')"
              >
                <span class="nav-icon">👤</span>
                <span>Profile</span>
              </a>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'orders' }"
                @click.prevent="switchSection('orders')"
              >
                <span class="nav-icon">📦</span>
                <span>My Orders</span>
              </a>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'addresses' }"
                @click.prevent="switchSection('addresses')"
              >
                <span class="nav-icon">📍</span>
                <span>Saved Addresses</span>
              </a>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'settings' }"
                @click.prevent="switchSection('settings')"
              >
                <span class="nav-icon">⚙️</span>
                <span>Settings</span>
              </a>
              <a
                href="#"
                class="nav-item"
                style="color: #e74c3c"
                @click.prevent="logout"
              >
                <span class="nav-icon">🚪</span>
                <span>Logout</span>
              </a>
            </nav>
          </aside>

          <!-- Main Content -->
          <main>
            <!-- Profile Section -->
            <section
              id="profile"
              class="content-section"
              :class="{ active: activeSection === 'profile' }"
            >
              <div class="section-header">
                <h1 class="section-title">My Profile</h1>
                <p class="section-subtitle">Manage your personal information</p>
              </div>

              <div class="info-card">
                <div class="info-card-title">
                  <span>Personal Information</span>
                  <button class="edit-btn">✏️ Edit</button>
                </div>
                <div class="info-row">
                  <span class="info-label">Full Name:</span>
                  <span class="info-value">{{
                    authStore.user?.user_metadata?.name || "Nguyen Van A"
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{{
                    authStore.user?.email || "nguyen@email.com"
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">+84 123 456 789</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Member Since:</span>
                  <span class="info-value">{{ memberSince }}</span>
                </div>
              </div>

              <div class="info-card">
                <div class="info-card-title">
                  <span>Account Statistics</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Orders:</span>
                  <span class="info-value">{{ orders.length }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Spent:</span>
                  <span class="info-value">${{ totalSpent.toFixed(2) }}</span>
                </div>
              </div>
            </section>

            <!-- Orders Section -->
            <section
              id="orders"
              class="content-section"
              :class="{ active: activeSection === 'orders' }"
            >
              <div class="section-header">
                <h1 class="section-title">My Orders</h1>
                <p class="section-subtitle">
                  View and track your order history
                </p>
              </div>

              <div
                v-if="ordersLoading"
                style="padding: 20px; text-align: center"
              >
                Loading orders...
              </div>
              <div
                v-else-if="orders.length === 0"
                style="padding: 20px; text-align: center; color: #666"
              >
                No orders yet.
              </div>
              <div
                v-else
                v-for="order in orders"
                :key="order.id"
                class="order-card"
              >
                <div class="order-header">
                  <div>
                    <div class="order-id">
                      Order #{{ order.id.slice(0, 8).toUpperCase() }}
                    </div>
                    <div class="order-date">
                      Placed on
                      {{
                        new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }}
                    </div>
                  </div>
                  <div class="order-status" :class="statusClass(order.status)">
                    {{ order.status || "Processing" }}
                  </div>
                </div>
                <div class="order-body">
                  <div class="order-items">
                    <div
                      v-for="item in order.order_items"
                      :key="item.product?.id"
                      class="order-item"
                    >
                      <div class="item-icon">
                        {{ item.product?.image_url || "🛒" }}
                      </div>
                      <div>
                        <div class="item-name">
                          {{ item.product?.name || "Product" }}
                        </div>
                        <div class="item-qty">Qty: {{ item.quantity }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Delivery Slot Info -->
                  <div v-if="order.delivery_slot" class="delivery-slot-info">
                    <span class="slot-label">🚚 Delivery Slot:</span>
                    <span class="slot-value">{{
                      formatSlot(order.delivery_slot)
                    }}</span>
                  </div>
                  <div
                    v-else-if="order.status === 'pending'"
                    class="delivery-slot-info no-slot"
                  >
                    <span class="slot-label">🚚 Delivery Slot:</span>
                    <span class="slot-value" style="color: #e74c3c"
                      >Not selected</span
                    >
                  </div>

                  <!-- Order Notes -->
                  <div v-if="order.notes" class="delivery-slot-info">
                    <span class="slot-label">📝 Notes:</span>
                    <span class="slot-value">{{ order.notes }}</span>
                  </div>

                  <div class="order-footer">
                    <div class="order-total">
                      Total: ${{ order.total_amount?.toFixed(2) || "—" }}
                    </div>
                    <div class="order-actions">
                      <router-link
                        :to="`/order-tracking/${order.id}`"
                        class="btn btn-primary"
                        >Track Order</router-link
                      >
                      <button class="btn btn-secondary" @click="reorder(order)">
                        🔄 Reorder
                      </button>
                      <!-- Select / Change Delivery Slot (pending only) -->
                      <button
                        v-if="order.status === 'pending'"
                        class="btn btn-secondary"
                        @click="
                          openSlotPicker(order.id, order.delivery_slot_id)
                        "
                      >
                        🗓
                        {{
                          order.delivery_slot_id ? "Change Slot" : "Select Slot"
                        }}
                      </button>
                      <!-- Cancel Order (pending only) -->
                      <button
                        v-if="order.status === 'pending'"
                        class="btn btn-cancel"
                        @click="cancelOrder(order.id)"
                      >
                        ✕ Cancel Order
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Slot Picker Inline Panel -->
                <div
                  v-if="slotPickerOrderId === order.id"
                  class="slot-picker-panel"
                >
                  <h3 style="margin: 0 0 12px; font-size: 16px">
                    Select Delivery Slot
                  </h3>
                  <div v-if="slotsLoading">Loading slots...</div>
                  <div
                    v-else-if="availableSlots.length === 0"
                    style="color: #666"
                  >
                    No available slots at the moment.
                  </div>
                  <div v-else>
                    <div class="form-group">
                      <label style="font-weight: 700; font-size: 13px"
                        >Available Slots</label
                      >
                      <select
                        v-model="selectedSlotId"
                        style="
                          width: 100%;
                          padding: 8px;
                          border: 2px solid #001858;
                          border-radius: 6px;
                          margin-top: 6px;
                        "
                      >
                        <option value="" disabled>Choose a slot…</option>
                        <option
                          v-for="slot in availableSlots"
                          :key="slot.id"
                          :value="slot.id"
                        >
                          {{ formatSlot(slot) }} ({{
                            slot.capacity - slot.booked
                          }}
                          spots left)
                        </option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-top: 10px">
                      <label style="font-weight: 700; font-size: 13px"
                        >Delivery Notes (optional)</label
                      >
                      <input
                        v-model="slotNotes"
                        placeholder="e.g. Leave at door"
                        style="
                          width: 100%;
                          padding: 8px;
                          border: 2px solid #001858;
                          border-radius: 6px;
                          margin-top: 6px;
                          box-sizing: border-box;
                        "
                      />
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 14px">
                      <button
                        class="btn btn-primary"
                        @click="confirmSlotSelection"
                      >
                        Confirm
                      </button>
                      <button
                        class="btn btn-secondary"
                        @click="slotPickerOrderId = null"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Addresses Section -->
            <section
              id="addresses"
              class="content-section"
              :class="{ active: activeSection === 'addresses' }"
            >
              <div class="section-header">
                <h1 class="section-title">Saved Addresses</h1>
                <p class="section-subtitle">Manage your delivery addresses</p>
              </div>

              <div class="addresses-grid">
                <div
                  v-for="addr in userAddresses"
                  :key="addr.id"
                  class="address-card"
                  :class="{ default: addr.is_default }"
                >
                  <div v-if="addr.is_default" class="default-badge">DEFAULT</div>
                  <div class="address-name">{{ addr.label }}</div>
                  <div class="address-details">
                    {{ addr.full_name }}<br />
                    {{ addr.phone }}<br />
                    {{ addr.address }}<br />
                    {{ addr.district }}, Ho Chi Minh City
                  </div>
                  <div class="address-actions">
                    <button v-if="!addr.is_default" class="btn btn-secondary" @click="setDefaultAddress(addr.id)">Set Default</button>
                    <button class="btn btn-secondary" @click="openEditAddress(addr)">Edit</button>
                    <button class="btn btn-secondary" @click="deleteAddress(addr.id)">Delete</button>
                  </div>
                </div>

                <div class="add-address-card" @click="openAddAddress">
                  <div class="add-icon">➕</div>
                  <div style="font-weight: 700; color: var(--headline)">
                    Add New Address
                  </div>
                </div>
              </div>

              <!-- Address Modal -->
              <div v-if="showAddressModal" class="modal-overlay" @click.self="showAddressModal = false">
                <div class="modal-box">
                  <h3 style="margin-bottom: 16px; color: #001858;">{{ editingAddressId ? 'Edit Address' : 'Add New Address' }}</h3>
                  <div class="form-group">
                    <label class="form-label">Label</label>
                    <input v-model="addressForm.label" type="text" class="form-input" placeholder="e.g. Home, Office" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input v-model="addressForm.full_name" type="text" class="form-input" placeholder="Recipient name" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone *</label>
                    <input v-model="addressForm.phone" type="tel" class="form-input" placeholder="+84 123 456 789" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Street Address *</label>
                    <input v-model="addressForm.address" type="text" class="form-input" placeholder="House number and street name" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">District *</label>
                    <select v-model="addressForm.district" class="form-input" required>
                      <option value="">Select district</option>
                      <option v-for="opt in districtOptions" :key="opt.label" :value="opt.label">{{ opt.label }}</option>
                    </select>
                  </div>
                  <div style="display:flex; gap:12px; margin-top:20px;">
                    <button class="btn btn-secondary" @click="showAddressModal = false">Cancel</button>
                    <button class="checkout-btn" style="flex:1; padding:12px;" @click="saveAddress">Save Address</button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Settings Section -->
            <section
              id="settings"
              class="content-section"
              :class="{ active: activeSection === 'settings' }"
            >
              <div class="section-header">
                <h1 class="section-title">Settings</h1>
                <p class="section-subtitle">Manage your account preferences</p>
              </div>

              <div class="info-card">
                <div class="info-card-title">
                  <span>Notifications</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Updates:</span>
                  <span class="info-value" style="color: #27ae60"
                    >✓ Enabled</span
                  >
                </div>
                <div class="info-row">
                  <span class="info-label">Promotions:</span>
                  <span class="info-value" style="color: #27ae60"
                    >✓ Enabled</span
                  >
                </div>
                <div class="info-row">
                  <span class="info-label">SMS Alerts:</span>
                  <span class="info-value" style="color: #e74c3c"
                    >✗ Disabled</span
                  >
                </div>
              </div>

              <div class="info-card">
                <div class="info-card-title">
                  <span>Security</span>
                  <button class="edit-btn">Change Password</button>
                </div>
                <div class="info-row">
                  <span class="info-label">Password:</span>
                  <span class="info-value">••••••••</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Two-Factor Auth:</span>
                  <span class="info-value" style="color: #e74c3c"
                    >✗ Disabled</span
                  >
                </div>
              </div>

              <div class="info-card">
                <div class="info-card-title">
                  <span>Privacy</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Share Purchase History:</span>
                  <span class="info-value" style="color: #e74c3c"
                    >✗ Disabled</span
                  >
                </div>
                <div class="info-row">
                  <span class="info-label">Personalized Recommendations:</span>
                  <span class="info-value" style="color: #27ae60"
                    >✓ Enabled</span
                  >
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.profile-page {
  font-family: "DM Sans", sans-serif;
  background: var(--bg);
  color: var(--paragraph);
  line-height: 1.6;
  min-height: 100vh;
  --bg: #fef6e4;
  --headline: #001858;
  --paragraph: #172c66;
  --button: #f582ae;
  --button-text: #001858;
  --stroke: #001858;
  --main: #f3d2c1;
  --highlight: #fef6e4;
  --secondary: #8bd3dd;
  --tertiary: #f582ae;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
header {
  background: var(--bg);
  border-bottom: 3px solid var(--stroke);
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
  color: var(--headline);
  text-decoration: none;
}

.back-link {
  color: var(--headline);
  text-decoration: none;
  font-weight: 500;
  padding: 10px 20px;
  border: 3px solid var(--stroke);
  background: white;
  transition: all 0.2s;
}

.back-link:hover {
  background: var(--main);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

/* Main Layout */
.main-content {
  padding: 40px 0;
}

.account-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
}

/* Sidebar */
.sidebar {
  background: white;
  border: 3px solid var(--stroke);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.profile-header {
  padding: 30px;
  text-align: center;
  border-bottom: 3px solid var(--stroke);
  background: var(--main);
}

.avatar {
  width: 100px;
  height: 100px;
  background: var(--button);
  border: 4px solid var(--stroke);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 700;
  color: var(--headline);
  margin: 0 auto 16px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 4px;
}

.profile-email {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
}

.nav-menu {
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  color: var(--paragraph);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.nav-item:hover {
  background: var(--main);
}

.nav-item.active {
  background: var(--button);
  color: var(--button-text);
  font-weight: 700;
  border-left-color: var(--stroke);
}

.nav-icon {
  font-size: 20px;
}

/* Content Sections */
.content-section {
  display: none;
}

.content-section.active {
  display: block;
}

.section-header {
  margin-bottom: 30px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 16px;
  color: var(--paragraph);
  opacity: 0.8;
}

/* Profile Info */
.info-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  margin-bottom: 20px;
}

.info-card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-btn {
  background: var(--secondary);
  border: 2px solid var(--stroke);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 2px solid var(--stroke);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--paragraph);
  opacity: 0.8;
  font-weight: 600;
}

.info-value {
  color: var(--headline);
  font-weight: 600;
}

/* Orders */
.orders-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 10px 20px;
  background: white;
  border: 3px solid var(--stroke);
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--main);
}

.filter-btn.active {
  background: var(--button);
  color: var(--button-text);
}

.order-card {
  background: white;
  border: 3px solid var(--stroke);
  margin-bottom: 20px;
  transition: all 0.2s;
}

.order-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}

.order-header {
  padding: 20px 24px;
  border-bottom: 3px solid var(--stroke);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg);
}

.order-id {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
}

.order-date {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
}

.order-status {
  display: inline-block;
  padding: 6px 16px;
  border: 2px solid var(--stroke);
  font-size: 12px;
  font-weight: 700;
}

.status-delivered {
  background: #d4edda;
  color: #155724;
}

.status-processing {
  background: #d1ecf1;
  color: #0c5460;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.order-body {
  padding: 20px 24px;
}

.order-items {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  font-size: 32px;
}

.item-name {
  font-size: 14px;
  color: var(--paragraph);
}

.item-qty {
  font-size: 12px;
  opacity: 0.7;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 2px solid var(--stroke);
}

.order-total {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
}

.order-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: 3px solid var(--stroke);
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: var(--button);
  color: var(--button-text);
}

.btn-secondary {
  background: white;
  color: var(--headline);
}

.btn-cancel {
  background: #fff0f0;
  color: #e74c3c;
  border-color: #e74c3c;
}

.btn-cancel:hover {
  background: #e74c3c;
  color: white;
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

/* Delivery Slot Info */
.delivery-slot-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px dashed #ccc;
  font-size: 14px;
}

.slot-label {
  font-weight: 700;
  color: var(--headline);
  white-space: nowrap;
}

.slot-value {
  color: #333;
}

/* Slot Picker Panel */
.slot-picker-panel {
  border-top: 3px solid var(--stroke);
  padding: 18px;
  background: #fef6e4;
  margin-top: 12px;
}

.slot-picker-panel .form-group label {
  display: block;
}

/* Addresses */
.addresses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.address-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  position: relative;
}

.address-card.default {
  background: var(--main);
}

.default-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--button);
  border: 2px solid var(--stroke);
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--button-text);
}

.address-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

.address-details {
  font-size: 14px;
  color: var(--paragraph);
  line-height: 1.8;
  margin-bottom: 16px;
}

.address-actions {
  display: flex;
  gap: 8px;
}

.add-address-card {
  background: var(--secondary);
  border: 3px dashed var(--stroke);
  padding: 60px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.add-address-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}

.add-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border: 3px solid #001858;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

/* Empty State */
.empty-state {
  background: white;
  border: 3px solid var(--stroke);
  padding: 60px;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  color: var(--paragraph);
  margin-bottom: 24px;
}

/* Responsive */
@media (max-width: 968px) {
  .account-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .orders-filter {
    flex-wrap: wrap;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .addresses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
