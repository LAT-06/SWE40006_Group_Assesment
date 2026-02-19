<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProductStore, type Product } from "@/stores/products";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const authStore = useAuthStore();
const productStore = useProductStore();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const activeSection = ref("dashboard");

const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

// ─── Categories ────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}
const categories = ref<Category[]>([]);
const showCategoryModal = ref(false);
const editingCategory = ref<Partial<Category>>({});
const isEditingCategory = ref(false);

const fetchCategories = async () => {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description");
  if (data) categories.value = data;
};

const openAddCategoryModal = () => {
  editingCategory.value = { name: "", slug: "", icon: "", description: "" };
  isEditingCategory.value = false;
  showCategoryModal.value = true;
};
const openEditCategoryModal = (cat: Category) => {
  editingCategory.value = { ...cat };
  isEditingCategory.value = true;
  showCategoryModal.value = true;
};

watch(
  () => editingCategory.value.name,
  (name) => {
    if (!isEditingCategory.value && name) {
      editingCategory.value.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
  },
);

const saveCategory = async () => {
  try {
    const token = await getToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }
    const isEdit = isEditingCategory.value && editingCategory.value.id;
    const url = isEdit
      ? `${API_URL}/categories/${editingCategory.value.id}`
      : `${API_URL}/categories`;
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editingCategory.value),
    });
    if (!res.ok) {
      const text = await res.text();
      let errMsg = "Request failed with status " + res.status;
      try {
        errMsg = JSON.parse(text).error || errMsg;
      } catch {
        errMsg = text || errMsg;
      }
      throw new Error(errMsg);
    }
    showCategoryModal.value = false;
    await fetchCategories();
  } catch (e: any) {
    alert("Error saving category: " + e.message);
  }
};

const deleteCategory = async (id: string) => {
  if (!confirm("Delete this category?")) return;
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
    await fetchCategories();
  } catch (e: any) {
    alert("Error deleting category: " + e.message);
  }
};

// ─── Orders ────────────────────────────────────────────────────────
interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: any;
  user?: { full_name?: string; email?: string };
  order_items?: {
    quantity: number;
    price_at_purchase: number;
    product?: { name: string; image_url?: string };
  }[];
}
const orders = ref<Order[]>([]);
const ordersLoading = ref(false);
const activeOrderTab = ref("all");
const selectedOrder = ref<Order | null>(null);

const filteredOrders = computed(() => {
  if (activeOrderTab.value === "all") return orders.value;
  return orders.value.filter((o) => o.status === activeOrderTab.value);
});

const fetchOrders = async () => {
  ordersLoading.value = true;
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) orders.value = await res.json();
  } catch (e) {
    console.error("Failed to fetch orders", e);
  } finally {
    ordersLoading.value = false;
  }
};

const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed");
    const updated = await res.json();
    const idx = orders.value.findIndex((o) => o.id === orderId);
    if (idx !== -1) orders.value[idx] = { ...orders.value[idx], ...updated };
    if (selectedOrder.value?.id === orderId)
      selectedOrder.value = { ...selectedOrder.value, status };
  } catch (e: any) {
    alert("Error updating order: " + e.message);
  }
};

const orderStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "badge-pending",
    processing: "badge-paid",
    shipped: "badge-shipped",
    delivered: "badge-delivered",
    cancelled: "badge-cancelled",
  };
  return map[status] || "badge-pending";
};

// ─── Stock ─────────────────────────────────────────────────────────
const stockProducts = computed(() =>
  [...productStore.products].sort(
    (a: any, b: any) => (a.quantity ?? 0) - (b.quantity ?? 0),
  ),
);
const stockFilter = ref<"all" | "low" | "out">("all");
const visibleStock = computed(() => {
  if (stockFilter.value === "low")
    return stockProducts.value.filter(
      (p: any) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 10,
    );
  if (stockFilter.value === "out")
    return stockProducts.value.filter(
      (p: any) => (p.quantity ?? 0) === 0 || !p.in_stock,
    );
  return stockProducts.value;
});

const updateStock = async (product: Product & { quantity?: number }) => {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/admin/stock/${product.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        quantity: product.quantity ?? 0,
        in_stock: (product.quantity ?? 0) > 0,
      }),
    });
    if (!res.ok) throw new Error("Failed");
    // Refresh
    await productStore.fetchProducts();
  } catch (e: any) {
    alert("Error updating stock: " + e.message);
  }
};

// ─── Delivery Slots ────────────────────────────────────────────────
interface DeliverySlot {
  id: string;
  zone_id?: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
  status: "open" | "full" | "closed";
  delivery_zones?: { name: string };
}
const slots = ref<DeliverySlot[]>([]);
const slotsLoading = ref(false);
const slotDateFilter = ref("");
const showSlotModal = ref(false);
const editingSlot = ref<Partial<DeliverySlot>>({});
const isEditingSlot = ref(false);

const fetchSlots = async () => {
  slotsLoading.value = true;
  try {
    const url = slotDateFilter.value
      ? `${API_URL}/delivery-slots?date=${slotDateFilter.value}`
      : `${API_URL}/delivery-slots`;
    const res = await fetch(url);
    if (res.ok) slots.value = await res.json();
  } catch (e) {
    console.error("Failed to fetch slots", e);
  } finally {
    slotsLoading.value = false;
  }
};

const openAddSlotModal = () => {
  editingSlot.value = {
    slot_date: "",
    start_time: "",
    end_time: "",
    capacity: 20,
    status: "open",
  };
  isEditingSlot.value = false;
  showSlotModal.value = true;
};

const openEditSlotModal = (slot: DeliverySlot) => {
  editingSlot.value = { ...slot };
  isEditingSlot.value = true;
  showSlotModal.value = true;
};

const saveSlot = async () => {
  try {
    const token = await getToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }
    const isEdit = isEditingSlot.value && editingSlot.value.id;
    const url = isEdit
      ? `${API_URL}/delivery-slots/${editingSlot.value.id}`
      : `${API_URL}/delivery-slots`;
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editingSlot.value),
    });
    if (!res.ok) {
      const text = await res.text();
      let errMsg = "Request failed with status " + res.status;
      try {
        errMsg = JSON.parse(text).error || errMsg;
      } catch {
        errMsg = text || errMsg;
      }
      throw new Error(errMsg);
    }
    showSlotModal.value = false;
    await fetchSlots();
  } catch (e: any) {
    alert("Error saving slot: " + e.message);
  }
};

const deleteSlot = async (id: string) => {
  if (!confirm("Delete this delivery slot?")) return;
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/delivery-slots/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to delete");
    }
    await fetchSlots();
  } catch (e: any) {
    alert("Error: " + e.message);
  }
};

const slotStatusClass = (status: string) => {
  const map: Record<string, string> = {
    open: "badge-paid",
    full: "badge-pending",
    closed: "badge-cancelled",
  };
  return map[status] || "badge-pending";
};

const formatSlotTime = (slot: DeliverySlot) => {
  const d = new Date(slot.slot_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${d} · ${slot.start_time?.slice(0, 5)}–${slot.end_time?.slice(0, 5)}`;
};
const stats = ref({
  todayOrders: 0,
  todayOrdersTrend: 0,
  todayRevenue: 0,
  todayRevenueTrend: 0,
  activeDeliveries: 0,
  activeDeliveriesTrend: 0,
  lowStockItems: 0,
  lowStockItemsTrend: 0,
});

const fetchStats = async () => {
  try {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) stats.value = { ...stats.value, ...(await res.json()) };
  } catch (e) {
    console.error("Failed to fetch stats", e);
  }
};

// ─── Products ──────────────────────────────────────────────────────
const showProductModal = ref(false);
const editingProduct = ref<Partial<Product>>({});
const isEditing = ref(false);

const openAddProductModal = () => {
  editingProduct.value = {
    in_stock: true,
    quantity: 0,
    price: 0,
    original_price: 0,
    name: "",
    slug: "",
    weight: "",
    category_id: "",
  };
  isEditing.value = false;
  showProductModal.value = true;
};
const openEditProductModal = (product: Product) => {
  editingProduct.value = { ...product };
  isEditing.value = true;
  showProductModal.value = true;
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

watch(
  () => editingProduct.value.name,
  (newName) => {
    if (!isEditing.value && newName)
      editingProduct.value.slug = generateSlug(newName);
  },
);

const saveProduct = async () => {
  try {
    if (isEditing.value && editingProduct.value.id) {
      await productStore.updateProduct(
        editingProduct.value.id,
        editingProduct.value,
      );
    } else {
      await productStore.addProduct(editingProduct.value);
    }
    showProductModal.value = false;
  } catch (e: any) {
    alert("Error saving product: " + e.message);
  }
};

const deleteProduct = async (id: string) => {
  if (confirm("Delete this product?")) {
    try {
      await productStore.deleteProduct(id);
    } catch (e: any) {
      alert("Error deleting product: " + e.message);
    }
  }
};

// ─── Navigation ────────────────────────────────────────────────────
const switchSection = async (sectionId: string) => {
  activeSection.value = sectionId;
  selectedOrder.value = null;
  if (sectionId === "products") {
    productStore.fetchProducts();
    await fetchCategories();
  } else if (sectionId === "dashboard") fetchStats();
  else if (sectionId === "categories") await fetchCategories();
  else if (sectionId === "orders") await fetchOrders();
  else if (sectionId === "stock") {
    await productStore.fetchProducts();
  } else if (sectionId === "slots") await fetchSlots();
};

const logout = async () => {
  if (confirm("Are you sure you want to logout?")) {
    await authStore.signOut();
    router.push("/login");
  }
};

onMounted(() => fetchStats());
</script>

<template>
  <div class="admin-page-wrapper">
    <div class="admin-page">
      <!-- Header -->
      <header>
        <div class="header-content">
          <div style="display: flex; align-items: center; gap: 16px">
            <div class="logo">Deployma Admin</div>
            <span class="admin-badge">ADMIN PORTAL</span>
          </div>
          <div class="header-actions">
            <div class="user-info">
              <div class="user-avatar">
                {{ authStore.user?.email?.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div style="font-weight: 700">
                  {{ authStore.user?.user_metadata?.full_name || "Admin User" }}
                </div>
                <div style="font-size: 12px; opacity: 0.7">
                  {{ authStore.user?.email }}
                </div>
              </div>
            </div>
            <button class="logout-btn" @click="logout">Logout</button>
          </div>
        </div>
      </header>

      <!-- Admin Layout -->
      <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <nav>
            <div class="nav-section">
              <div class="nav-title">OVERVIEW</div>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'dashboard' }"
                @click.prevent="switchSection('dashboard')"
              >
                <span>Dashboard</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">CATALOG</div>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'products' }"
                @click.prevent="switchSection('products')"
              >
                <span>Products</span>
              </a>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'categories' }"
                @click.prevent="switchSection('categories')"
              >
                <span>Categories</span>
              </a>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'stock' }"
                @click.prevent="switchSection('stock')"
              >
                <span>Stock Management</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">ORDERS</div>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'orders' }"
                @click.prevent="switchSection('orders')"
              >
                <span>All Orders</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">DELIVERY</div>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'zones' }"
                @click.prevent="switchSection('zones')"
              >
                <span>Delivery Zones</span>
              </a>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'slots' }"
                @click.prevent="switchSection('slots')"
              >
                <span>Delivery Slots</span>
              </a>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'stores' }"
                @click.prevent="switchSection('stores')"
              >
                <span>Stores/Warehouses</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">SYSTEM</div>
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'users' }"
                @click.prevent="switchSection('users')"
              >
                <span>Users</span>
              </a>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- Dashboard Section -->
          <section v-show="activeSection === 'dashboard'">
            <div class="page-header">
              <h1 class="page-title">Dashboard</h1>
              <p class="page-subtitle">
                Overview of your grocery delivery platform
              </p>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Orders Today</div>
                <div class="stat-value">{{ stats.todayOrders }}</div>
                <div
                  :class="[
                    'stat-trend',
                    stats.todayOrdersTrend >= 0 ? 'up' : 'down',
                  ]"
                >
                  {{ stats.todayOrdersTrend >= 0 ? "↑" : "↓" }}
                  {{ Math.abs(stats.todayOrdersTrend) }}% from yesterday
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Revenue Today</div>
                <div class="stat-value">
                  ${{ stats.todayRevenue.toLocaleString() }}
                </div>
                <div
                  :class="[
                    'stat-trend',
                    stats.todayRevenueTrend >= 0 ? 'up' : 'down',
                  ]"
                >
                  {{ stats.todayRevenueTrend >= 0 ? "↑" : "↓" }}
                  {{ Math.abs(stats.todayRevenueTrend) }}% from yesterday
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Active Deliveries</div>
                <div class="stat-value">{{ stats.activeDeliveries }}</div>
                <div class="stat-trend">
                  -
                  <!-- No trend data yet -->
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Low Stock Items</div>
                <div class="stat-value">{{ stats.lowStockItems }}</div>
                <div class="stat-trend">
                  -
                  <!-- No trend data yet -->
                </div>
              </div>
            </div>
          </section>

          <!-- Products Section -->
          <section v-show="activeSection === 'products'">
            <div
              class="page-header"
              style="display: flex; justify-content: space-between"
            >
              <div>
                <h1 class="page-title">Products</h1>
                <p class="page-subtitle">Manage your product catalog</p>
              </div>
              <button class="btn btn-primary" @click="openAddProductModal">
                + Add Product
              </button>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="product in productStore.products"
                    :key="product.id"
                  >
                    <td>
                      <div style="font-weight: 700">{{ product.name }}</div>
                      <div
                        style="
                          font-size: 12px;
                          color: var(--paragraph);
                          opacity: 0.7;
                        "
                      >
                        {{ product.slug }}
                      </div>
                    </td>
                    <td>{{ product.category?.name || "Uncategorized" }}</td>
                    <td>
                      <div style="font-weight: 700">${{ product.price }}</div>
                      <div
                        v-if="product.original_price"
                        style="
                          font-size: 12px;
                          text-decoration: line-through;
                          opacity: 0.7;
                        "
                      >
                        ${{ product.original_price }}
                      </div>
                    </td>
                    <td>{{ product.quantity || 0 }}</td>
                    <td>
                      <span
                        :class="[
                          'badge',
                          product.in_stock
                            ? 'badge-delivered'
                            : 'badge-pending',
                        ]"
                      >
                        {{ product.in_stock ? "In Stock" : "Out of Stock" }}
                      </span>
                    </td>
                    <td>
                      <button
                        class="btn"
                        style="
                          margin-right: 8px;
                          padding: 4px 8px;
                          font-size: 12px;
                        "
                        @click="openEditProductModal(product)"
                      >
                        Edit
                      </button>
                      <button
                        class="btn"
                        style="
                          padding: 4px 8px;
                          font-size: 12px;
                          border-color: #e74c3c;
                          color: #e74c3c;
                        "
                        @click="deleteProduct(product.id)"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  <tr v-if="productStore.products.length === 0">
                    <td colspan="5" style="text-align: center; padding: 20px">
                      No products found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Categories Section -->
          <section v-show="activeSection === 'categories'">
            <div
              class="page-header"
              style="display: flex; justify-content: space-between"
            >
              <div>
                <h1 class="page-title">Categories</h1>
                <p class="page-subtitle">Manage product categories</p>
              </div>
              <button class="btn btn-primary" @click="openAddCategoryModal">
                + Add Category
              </button>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cat in categories" :key="cat.id">
                    <td style="font-size: 24px">{{ cat.icon || "📦" }}</td>
                    <td style="font-weight: 700">{{ cat.name }}</td>
                    <td>
                      <code style="font-size: 12px">{{ cat.slug }}</code>
                    </td>
                    <td style="opacity: 0.7; font-size: 13px">
                      {{ cat.description || "—" }}
                    </td>
                    <td>
                      <button
                        class="btn"
                        style="
                          margin-right: 8px;
                          padding: 4px 8px;
                          font-size: 12px;
                        "
                        @click="openEditCategoryModal(cat)"
                      >
                        Edit
                      </button>
                      <button
                        class="btn"
                        style="
                          padding: 4px 8px;
                          font-size: 12px;
                          border-color: #e74c3c;
                          color: #e74c3c;
                        "
                        @click="deleteCategory(cat.id)"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  <tr v-if="categories.length === 0">
                    <td colspan="5" style="text-align: center; padding: 20px">
                      No categories found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Orders Section -->
          <section v-show="activeSection === 'orders'">
            <div v-if="!selectedOrder">
              <div class="page-header">
                <h1 class="page-title">Orders</h1>
                <p class="page-subtitle">Manage all customer orders</p>
              </div>
              <div
                class="orders-filter"
                style="display: flex; gap: 8px; margin-bottom: 20px"
              >
                <button
                  v-for="tab in [
                    'all',
                    'pending',
                    'processing',
                    'shipped',
                    'delivered',
                    'cancelled',
                  ]"
                  :key="tab"
                  class="btn"
                  :class="{ 'btn-primary': activeOrderTab === tab }"
                  style="
                    padding: 6px 14px;
                    font-size: 13px;
                    text-transform: capitalize;
                  "
                  @click="activeOrderTab = tab"
                >
                  {{
                    tab === "all"
                      ? "All"
                      : tab.charAt(0).toUpperCase() + tab.slice(1)
                  }}
                </button>
              </div>
              <div
                v-if="ordersLoading"
                style="text-align: center; padding: 40px"
              >
                Loading orders...
              </div>
              <div v-else class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="order in filteredOrders"
                      :key="order.id"
                      style="cursor: pointer"
                      @click="selectedOrder = order"
                    >
                      <td
                        style="
                          font-weight: 700;
                          font-family: monospace;
                          font-size: 13px;
                        "
                      >
                        {{ order.id.slice(0, 8).toUpperCase() }}
                      </td>
                      <td>
                        {{
                          order.user?.full_name ||
                          order.user?.email ||
                          "Customer"
                        }}
                      </td>
                      <td style="font-size: 13px">
                        {{ new Date(order.created_at).toLocaleDateString() }}
                      </td>
                      <td style="font-weight: 700">
                        ${{ order.total_amount?.toFixed(2) }}
                      </td>
                      <td>
                        <span
                          :class="['badge', orderStatusClass(order.status)]"
                          style="text-transform: capitalize"
                          >{{ order.status }}</span
                        >
                      </td>
                      <td @click.stop>
                        <select
                          :value="order.status"
                          @change="
                            updateOrderStatus(
                              order.id,
                              ($event.target as HTMLSelectElement).value,
                            )
                          "
                          style="
                            padding: 4px 8px;
                            border: 2px solid var(--stroke);
                            font-size: 12px;
                            cursor: pointer;
                            background: white;
                            font-family: &quot;DM Sans&quot;, sans-serif;
                          "
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                    <tr v-if="filteredOrders.length === 0">
                      <td colspan="6" style="text-align: center; padding: 20px">
                        No orders found.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Order Detail -->
            <div v-else>
              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  margin-bottom: 24px;
                "
              >
                <button class="btn" @click="selectedOrder = null">
                  ← Back
                </button>
                <h1 class="page-title" style="margin: 0">
                  Order #{{ selectedOrder.id.slice(0, 8).toUpperCase() }}
                </h1>
                <span
                  :class="['badge', orderStatusClass(selectedOrder.status)]"
                  style="text-transform: capitalize"
                  >{{ selectedOrder.status }}</span
                >
              </div>
              <div
                style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 24px;
                "
              >
                <div class="table-container" style="padding: 20px">
                  <div
                    style="
                      font-weight: 700;
                      margin-bottom: 12px;
                      color: var(--headline);
                    "
                  >
                    Customer Info
                  </div>
                  <div style="margin-bottom: 8px">
                    <strong>Name:</strong>
                    {{ selectedOrder.user?.full_name || "—" }}
                  </div>
                  <div style="margin-bottom: 8px">
                    <strong>Email:</strong>
                    {{ selectedOrder.user?.email || "—" }}
                  </div>
                  <div style="margin-bottom: 8px">
                    <strong>Date:</strong>
                    {{ new Date(selectedOrder.created_at).toLocaleString() }}
                  </div>
                  <div>
                    <strong>Address:</strong>
                    {{
                      typeof selectedOrder.shipping_address === "object"
                        ? JSON.stringify(selectedOrder.shipping_address)
                        : selectedOrder.shipping_address
                    }}
                  </div>
                </div>
                <div class="table-container" style="padding: 20px">
                  <div
                    style="
                      font-weight: 700;
                      margin-bottom: 12px;
                      color: var(--headline);
                    "
                  >
                    Update Status
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px">
                    <button
                      v-for="s in [
                        'pending',
                        'processing',
                        'shipped',
                        'delivered',
                        'cancelled',
                      ]"
                      :key="s"
                      class="btn"
                      :class="{ 'btn-primary': selectedOrder.status === s }"
                      style="text-transform: capitalize"
                      @click="updateOrderStatus(selectedOrder.id, s)"
                    >
                      {{ s }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in selectedOrder.order_items"
                      :key="item.product?.name"
                    >
                      <td>{{ item.product?.name || "—" }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>${{ item.price_at_purchase?.toFixed(2) }}</td>
                      <td style="font-weight: 700">
                        ${{
                          (item.price_at_purchase * item.quantity).toFixed(2)
                        }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colspan="3"
                        style="
                          text-align: right;
                          font-weight: 700;
                          padding: 16px;
                        "
                      >
                        Total:
                      </td>
                      <td style="font-weight: 700; font-size: 18px">
                        ${{ selectedOrder.total_amount?.toFixed(2) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>

          <!-- Stock Section -->
          <section v-show="activeSection === 'stock'">
            <div class="page-header">
              <h1 class="page-title">Stock Management</h1>
              <p class="page-subtitle">
                Monitor and update product inventory levels
              </p>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 20px">
              <button
                v-for="f in [
                  ['all', 'All Products'],
                  ['low', 'Low Stock (≤10)'],
                  ['out', 'Out of Stock'],
                ]"
                :key="f[0]"
                class="btn"
                :class="{ 'btn-primary': stockFilter === f[0] }"
                style="padding: 6px 14px; font-size: 13px"
                @click="stockFilter = f[0] as any"
              >
                {{ f[1] }}
              </button>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in visibleStock"
                    :key="p.id"
                    :style="
                      (p as any).quantity === 0
                        ? 'background:#fff5f5;'
                        : (p as any).quantity <= 10
                          ? 'background:#fffbf0;'
                          : ''
                    "
                  >
                    <td>
                      <div style="font-weight: 700">{{ p.name }}</div>
                      <div style="font-size: 12px; opacity: 0.6">
                        {{ p.weight }}
                      </div>
                    </td>
                    <td>{{ p.category?.name || "—" }}</td>
                    <td>
                      <span
                        :style="
                          (p as any).quantity === 0
                            ? 'color:#e74c3c; font-weight:700;'
                            : (p as any).quantity <= 10
                              ? 'color:#f39c12; font-weight:700;'
                              : 'font-weight:700;'
                        "
                      >
                        {{ (p as any).quantity ?? 0 }}
                      </span>
                    </td>
                    <td>
                      <span
                        :class="[
                          'badge',
                          p.in_stock ? 'badge-delivered' : 'badge-cancelled',
                        ]"
                      >
                        {{ p.in_stock ? "In Stock" : "Out of Stock" }}
                      </span>
                    </td>
                    <td
                      @click.stop
                      style="
                        display: flex;
                        gap: 8px;
                        align-items: center;
                        padding: 16px;
                      "
                    >
                      <input
                        type="number"
                        min="0"
                        :value="(p as any).quantity ?? 0"
                        @change="
                          (e) => {
                            (p as any).quantity =
                              parseInt((e.target as HTMLInputElement).value) ||
                              0;
                          }
                        "
                        style="
                          width: 70px;
                          padding: 6px;
                          border: 2px solid var(--stroke);
                          font-size: 14px;
                          text-align: center;
                        "
                      />
                      <button
                        class="btn btn-primary"
                        style="padding: 4px 10px; font-size: 12px"
                        @click="updateStock(p as any)"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                  <tr v-if="visibleStock.length === 0">
                    <td colspan="5" style="text-align: center; padding: 20px">
                      No products.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Delivery Slots Section -->
          <section v-show="activeSection === 'slots'">
            <div
              class="page-header"
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <div>
                <h1 class="page-title">Delivery Slots</h1>
                <p class="page-subtitle">
                  Manage available delivery time windows
                </p>
              </div>
              <button class="btn btn-primary" @click="openAddSlotModal">
                + Add Slot
              </button>
            </div>

            <!-- Filter bar -->
            <div
              style="
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                align-items: center;
              "
            >
              <label style="font-weight: 700; font-size: 13px"
                >Filter by Date:</label
              >
              <input
                type="date"
                v-model="slotDateFilter"
                @change="fetchSlots()"
                style="
                  padding: 8px 12px;
                  border: 2px solid #001858;
                  border-radius: 0;
                  font-size: 14px;
                "
              />
              <button
                v-if="slotDateFilter"
                class="btn btn-secondary"
                style="padding: 6px 12px; font-size: 13px"
                @click="
                  slotDateFilter = '';
                  fetchSlots();
                "
              >
                Clear
              </button>
              <button
                class="btn btn-secondary"
                style="padding: 6px 12px; font-size: 13px"
                @click="fetchSlots()"
              >
                🔄 Refresh
              </button>
            </div>

            <div v-if="slotsLoading" style="padding: 20px; text-align: center">
              Loading slots...
            </div>
            <div
              v-else-if="slots.length === 0"
              style="padding: 20px; text-align: center; color: #666"
            >
              No delivery slots found. Click "Add Slot" to create one.
            </div>
            <div v-else class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Zone</th>
                    <th>Capacity</th>
                    <th>Booked</th>
                    <th>Available</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="slot in slots"
                    :key="slot.id"
                    :style="
                      slot.booked >= slot.capacity ? 'background:#fff0f0;' : ''
                    "
                  >
                    <td style="font-weight: 600">{{ formatSlotTime(slot) }}</td>
                    <td>{{ slot.delivery_zones?.name || "—" }}</td>
                    <td>{{ slot.capacity }}</td>
                    <td
                      :style="
                        slot.booked >= slot.capacity
                          ? 'color:#e74c3c; font-weight:700;'
                          : ''
                      "
                    >
                      {{ slot.booked }}
                    </td>
                    <td
                      :style="
                        slot.capacity - slot.booked === 0
                          ? 'color:#e74c3c;'
                          : 'color:#27ae60;'
                      "
                    >
                      {{ slot.capacity - slot.booked }}
                    </td>
                    <td>
                      <span
                        class="badge"
                        :class="slotStatusClass(slot.status)"
                        >{{ slot.status }}</span
                      >
                    </td>
                    <td>
                      <div style="display: flex; gap: 8px">
                        <button
                          class="btn btn-secondary"
                          style="padding: 4px 10px; font-size: 12px"
                          @click="openEditSlotModal(slot)"
                        >
                          Edit
                        </button>
                        <button
                          class="btn"
                          style="
                            padding: 4px 10px;
                            font-size: 12px;
                            background: #fff0f0;
                            color: #e74c3c;
                            border-color: #e74c3c;
                          "
                          @click="deleteSlot(slot.id)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Placeholder for other sections -->
          <section
            v-show="
              ![
                'dashboard',
                'products',
                'categories',
                'orders',
                'stock',
                'slots',
              ].includes(activeSection)
            "
            class="placeholder-section"
          >
            <div class="page-header">
              <h1 class="page-title">
                {{
                  activeSection.charAt(0).toUpperCase() + activeSection.slice(1)
                }}
              </h1>
              <p class="page-subtitle">This section is under development</p>
            </div>
            <div class="placeholder-content">
              <p>
                The {{ activeSection }} management interface will be implemented
                here.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showCategoryModal" class="modal-overlay">
      <div class="modal">
        <h2>{{ isEditingCategory ? "Edit Category" : "Add Category" }}</h2>
        <form @submit.prevent="saveCategory">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Name</label>
              <input
                v-model="editingCategory.name"
                placeholder="e.g. Fresh Produce"
                required
              />
            </div>
            <div class="form-group">
              <label>Icon (Emoji)</label>
              <input v-model="editingCategory.icon" placeholder="e.g. 🥦" />
            </div>
          </div>
          <div class="form-group">
            <label>Slug (Auto-generated)</label>
            <input
              v-model="editingCategory.slug"
              placeholder="url-friendly-name"
              required
            />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input
              v-model="editingCategory.description"
              placeholder="Optional description"
            />
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn"
              @click="showCategoryModal = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Product Modal -->
    <div v-if="showProductModal" class="modal-overlay">
      <div class="modal">
        <h2>{{ isEditing ? "Edit Product" : "Add Product" }}</h2>
        <form @submit.prevent="saveProduct">
          <div class="form-group">
            <label>Name</label>
            <input
              v-model="editingProduct.name"
              placeholder="e.g. Organic Avocados"
              required
            />
          </div>

          <div class="form-group">
            <label>Category</label>
            <select v-model="editingProduct.category_id" required>
              <option value="" disabled>Select a Category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Image URL (or Emoji)</label>
            <input
              v-model="editingProduct.image_url"
              placeholder="https://example.com/image.png or 🥑"
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Sale Price ($)</label>
              <input
                type="number"
                step="0.01"
                v-model.number="editingProduct.price"
                required
              />
            </div>
            <div class="form-group">
              <label>Original Price ($)</label>
              <input
                type="number"
                step="0.01"
                v-model.number="editingProduct.original_price"
                placeholder="Optional"
              />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Weight / Unit</label>
              <input
                v-model="editingProduct.weight"
                placeholder="e.g. 1kg, 500g, 1 bunch"
                required
              />
            </div>
            <div class="form-group">
              <label>Slug (Auto-generated)</label>
              <input
                v-model="editingProduct.slug"
                placeholder="url-friendly-name"
                required
              />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Quantity</label>
              <input
                type="number"
                v-model.number="editingProduct.quantity"
                required
              />
            </div>
            <div class="form-group">
              <label>Stock Status</label>
              <label
                style="
                  font-weight: normal;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  color: var(--headline);
                  height: 48px;
                "
              >
                <input
                  type="checkbox"
                  v-model="editingProduct.in_stock"
                  style="width: auto"
                />
                Available In Stock
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn" @click="showProductModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Slot Modal -->
    <div v-if="showSlotModal" class="modal-overlay">
      <div class="modal">
        <h2>
          {{ isEditingSlot ? "Edit Delivery Slot" : "Add Delivery Slot" }}
        </h2>
        <form @submit.prevent="saveSlot">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Date</label>
              <input type="date" v-model="editingSlot.slot_date" required />
            </div>
            <div class="form-group">
              <label>Capacity</label>
              <input
                type="number"
                v-model="editingSlot.capacity"
                min="1"
                placeholder="20"
                required
              />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Start Time</label>
              <input type="time" v-model="editingSlot.start_time" required />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input type="time" v-model="editingSlot.end_time" required />
            </div>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="editingSlot.status">
              <option value="open">Open</option>
              <option value="full">Full</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showSlotModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.admin-page-wrapper {
  width: 100%;
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

.admin-page-wrapper .admin-page {
  width: 100%;
  min-height: 100vh;
  font-family: "DM Sans", sans-serif;
  background: var(--bg);
  color: var(--paragraph);
  line-height: 1.6;
}

/* Header */
.admin-page-wrapper header {
  background: var(--headline);
  color: white;
  padding: 20px 0;
  border-bottom: 3px solid var(--stroke);
}

.admin-page-wrapper .header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-page-wrapper .logo {
  font-family: "Space Mono", monospace;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.admin-page-wrapper .admin-badge {
  background: var(--button);
  color: var(--button-text);
  padding: 6px 16px;
  font-weight: 700;
  font-size: 12px;
  border: 2px solid white;
}

.header-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: var(--button);
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--headline);
}

.logout-btn {
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 8px 16px;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: white;
  color: var(--headline);
}

/* Layout */
.admin-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  max-width: 1600px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

/* Sidebar */
.admin-page-wrapper .sidebar {
  background: white;
  border-right: 3px solid var(--stroke);
  padding: 30px 0;
}

.admin-page-wrapper .nav-section {
  margin-bottom: 30px;
}

.nav-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--paragraph);
  opacity: 0.6;
  padding: 0 24px;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.admin-page-wrapper .nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  color: var(--paragraph);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border-left: 4px solid transparent;
  cursor: pointer;
}

.admin-page-wrapper .nav-item:hover {
  background: var(--main);
}

.admin-page-wrapper .nav-item.active {
  background: var(--button);
  color: var(--button-text);
  font-weight: 700;
  border-left-color: var(--stroke);
}

.nav-icon {
  font-size: 20px;
}

/* Main Content */
.admin-page-wrapper .main-content {
  padding: 30px;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.page-subtitle {
  color: var(--paragraph);
  opacity: 0.8;
}

/* Stats Cards */
.admin-page-wrapper .stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.stat-label {
  font-size: 14px;
  color: var(--paragraph);
  margin-bottom: 8px;
  font-weight: 600;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 13px;
  font-weight: 600;
}

.stat-trend.up {
  color: #27ae60;
}

.stat-trend.down {
  color: #e74c3c;
}

/* Table */
.admin-page-wrapper .table-container {
  background: white;
  border: 3px solid var(--stroke);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 3px solid var(--stroke);
}

.table-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
}

.admin-page-wrapper .btn {
  padding: 10px 20px;
  border: 3px solid var(--stroke);
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  transition: all 0.2s;
  background: white;
  color: var(--headline);
}

.admin-page-wrapper .btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.admin-page-wrapper .btn-primary {
  background: var(--button);
  color: var(--button-text);
}

.admin-page-wrapper table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--bg);
}

th {
  padding: 16px;
  text-align: left;
  font-weight: 700;
  color: var(--headline);
  border-bottom: 3px solid var(--stroke);
  font-size: 14px;
}

td {
  padding: 16px;
  border-bottom: 2px solid var(--stroke);
}

tbody tr:hover {
  background: var(--main);
}

tbody tr:last-child td {
  border-bottom: none;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border: 2px solid var(--stroke);
  font-size: 12px;
  font-weight: 700;
}

.badge-pending {
  background: #ffd93d;
  color: var(--headline);
}

.badge-paid {
  background: #8bd3dd;
  color: var(--headline);
}

.badge-delivered {
  background: #6bcf7f;
  color: white;
}

.badge-shipped {
  background: #8bd3dd;
  color: var(--headline);
}

.badge-cancelled {
  background: #e74c3c;
  color: white;
}

/* Placeholder Section */
.placeholder-section {
  background: white;
  border: 3px solid var(--stroke);
  padding: 60px;
  text-align: center;
}

.placeholder-content {
  margin-top: 30px;
  font-size: 18px;
  color: var(--paragraph);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border: 4px solid var(--stroke);
  padding: 40px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 10px 10px 0 var(--stroke);
  color: var(--headline);
}

.modal h2 {
  margin-bottom: 24px;
  font-size: 28px;
  font-weight: 700;
  color: var(--headline);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: var(--headline);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 3px solid var(--stroke);
  background: white;
  color: var(--headline);
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  outline: none;
}

.form-group input:focus {
  border-color: var(--button);
  background: var(--highlight);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
}

/* Responsive */
@media (max-width: 968px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 3px solid var(--stroke);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
