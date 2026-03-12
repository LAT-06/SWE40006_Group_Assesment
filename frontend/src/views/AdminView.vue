<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProductStore } from "@/stores/products";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/models";

import AdminDashboard from "@/components/admin/AdminDashboard.vue";
import AdminCategories from "@/components/admin/AdminCategories.vue";
import AdminProducts from "@/components/admin/AdminProducts.vue";
import AdminOrders from "@/components/admin/AdminOrders.vue";
import AdminStock from "@/components/admin/AdminStock.vue";
import AdminDeliveryZones from "@/components/admin/AdminDeliveryZones.vue";
import AdminDeliverySlots from "@/components/admin/AdminDeliverySlots.vue";
import AdminUsers from "@/components/admin/AdminUsers.vue";
import AdminStores from "@/components/admin/AdminStores.vue";

const router = useRouter();
const authStore = useAuthStore();
const productStore = useProductStore();

const activeSection = ref("dashboard");

// Template refs for child components
const dashboardRef = ref<InstanceType<typeof AdminDashboard> | null>(null);
const categoriesRef = ref<InstanceType<typeof AdminCategories> | null>(null);
const ordersRef = ref<InstanceType<typeof AdminOrders> | null>(null);
const slotsRef = ref<InstanceType<typeof AdminDeliverySlots> | null>(null);
const usersRef = ref<InstanceType<typeof AdminUsers> | null>(null);
const storesRef = ref<InstanceType<typeof AdminStores> | null>(null);
const zonesRef = ref<InstanceType<typeof AdminDeliveryZones> | null>(null);

// Categories needed by AdminProducts for the dropdown
type Category = Tables<"categories">;
const categories = ref<Category[]>([]);
const fetchCategories = async () => {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description, created_at");
  if (data) categories.value = data;
};

// ─── Navigation ──────────────────────────────────────────────────────────
const switchSection = async (sectionId: string) => {
  activeSection.value = sectionId;
  if (ordersRef.value) ordersRef.value.selectedOrder = null;
  if (sectionId === "products") {
    productStore.fetchProducts();
    await fetchCategories();
  } else if (sectionId === "dashboard") dashboardRef.value?.fetchStats();
  else if (sectionId === "categories") categoriesRef.value?.fetchCategories();
  else if (sectionId === "orders") ordersRef.value?.fetchOrders();
  else if (sectionId === "stock") await productStore.fetchProducts();
  else if (sectionId === "slots") slotsRef.value?.fetchSlots();
  else if (sectionId === "users") usersRef.value?.fetchUsers();
  else if (sectionId === "stores") storesRef.value?.fetchStores();
  else if (sectionId === "zones") zonesRef.value?.fetchZones();
};

const logout = async () => {
  if (await useConfirmDialog().confirm("Are you sure you want to logout?")) {
    await authStore.signOut();
    router.push("/login");
  }
};

// ─── Real-time stock subscription ────────────────────────────────────────
const productStockChannel = supabase
  .channel("admin-products-stock")
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "products" },
    () => { productStore.fetchProducts(); }
  )
  .subscribe();

onUnmounted(() => {
  supabase.removeChannel(productStockChannel);
});

onMounted(() => dashboardRef.value?.fetchStats());
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
              <a href="#" class="nav-item" :class="{ active: activeSection === 'dashboard' }"
                @click.prevent="switchSection('dashboard')">
                <span>Dashboard</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">CATALOG</div>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'products' }"
                @click.prevent="switchSection('products')">
                <span>Products</span>
              </a>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'categories' }"
                @click.prevent="switchSection('categories')">
                <span>Categories</span>
              </a>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'stock' }"
                @click.prevent="switchSection('stock')">
                <span>Stock Management</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">ORDERS</div>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'orders' }"
                @click.prevent="switchSection('orders')">
                <span>All Orders</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">DELIVERY</div>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'zones' }"
                @click.prevent="switchSection('zones')">
                <span>Delivery Zones</span>
              </a>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'slots' }"
                @click.prevent="switchSection('slots')">
                <span>Delivery Slots</span>
              </a>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'stores' }"
                @click.prevent="switchSection('stores')">
                <span>Stores/Warehouses</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="nav-title">SYSTEM</div>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'users' }"
                @click.prevent="switchSection('users')">
                <span>Users</span>
              </a>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <section v-show="activeSection === 'dashboard'">
            <AdminDashboard ref="dashboardRef" />
          </section>

          <section v-show="activeSection === 'products'">
            <AdminProducts :categories="categories" />
          </section>

          <section v-show="activeSection === 'categories'">
            <AdminCategories ref="categoriesRef" />
          </section>

          <section v-show="activeSection === 'orders'">
            <AdminOrders ref="ordersRef" />
          </section>

          <section v-show="activeSection === 'stock'">
            <AdminStock />
          </section>

          <section v-show="activeSection === 'zones'">
            <AdminDeliveryZones ref="zonesRef" />
          </section>

          <section v-show="activeSection === 'slots'">
            <AdminDeliverySlots ref="slotsRef" />
          </section>

          <section v-show="activeSection === 'users'">
            <AdminUsers ref="usersRef" />
          </section>

          <section v-show="activeSection === 'stores'">
            <AdminStores ref="storesRef" />
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.admin-page-wrapper {
  width: 100%;
  min-height: 100vh;
}

.admin-page-wrapper .admin-page {
  width: 100%;
  min-height: 100vh;
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
  font-family: inherit;
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

.admin-page-wrapper .btn-secondary {
  background: var(--bg);
  color: var(--headline);
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
  font-family: inherit;
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
