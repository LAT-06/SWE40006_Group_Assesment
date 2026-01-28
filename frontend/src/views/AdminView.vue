<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const activeSection = ref("dashboard");
const activeTab = ref("all-orders");

const switchSection = (sectionId: string) => {
  activeSection.value = sectionId;
};

const logout = async () => {
  if (confirm("Are you sure you want to logout?")) {
    await authStore.signOut();
    router.push("/login");
  }
};

const stats = ref({
  todayOrders: 142,
  todayRevenue: 8450,
  activeDeliveries: 28,
  lowStockItems: 12,
});
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
              <a
                href="#"
                class="nav-item"
                :class="{ active: activeSection === 'settings' }"
                @click.prevent="switchSection('settings')"
              >
                <span>Settings</span>
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
                <div class="stat-trend up">↑ 18% from yesterday</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Revenue Today</div>
                <div class="stat-value">
                  ${{ stats.todayRevenue.toLocaleString() }}
                </div>
                <div class="stat-trend up">↑ 12% from yesterday</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Active Deliveries</div>
                <div class="stat-value">{{ stats.activeDeliveries }}</div>
                <div class="stat-trend down">↓ 5% from yesterday</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Low Stock Items</div>
                <div class="stat-value">{{ stats.lowStockItems }}</div>
                <div class="stat-trend up">↑ 3 items</div>
              </div>
            </div>

            <div class="table-container">
              <div class="table-header">
                <h3 class="table-title">Recent Orders</h3>
                <button
                  class="btn btn-primary"
                  @click="switchSection('orders')"
                >
                  View All
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Delivery Slot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#ORD-1234</td>
                    <td>Nguyen Van A</td>
                    <td>8 items</td>
                    <td>$125.50</td>
                    <td><span class="badge badge-paid">Paid</span></td>
                    <td>Today, 2-4 PM</td>
                  </tr>
                  <tr>
                    <td>#ORD-1233</td>
                    <td>Tran Thi B</td>
                    <td>5 items</td>
                    <td>$89.00</td>
                    <td>
                      <span class="badge badge-delivered">Delivered</span>
                    </td>
                    <td>Today, 10-12 AM</td>
                  </tr>
                  <tr>
                    <td>#ORD-1232</td>
                    <td>Le Van C</td>
                    <td>12 items</td>
                    <td>$210.75</td>
                    <td><span class="badge badge-pending">Pending</span></td>
                    <td>Tomorrow, 8-10 AM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Other sections placeholder -->
          <section
            v-show="activeSection !== 'dashboard'"
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
