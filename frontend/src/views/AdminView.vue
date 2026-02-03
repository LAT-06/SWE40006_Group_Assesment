<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProductStore, type Product } from "@/stores/products";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const authStore = useAuthStore();
const productStore = useProductStore();

const activeSection = ref("dashboard");
const activeTab = ref("all-orders");

// Categories state
interface Category {
  id: string;
  name: string;
  slug: string;
}
const categories = ref<Category[]>([]);

const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('id, name, slug');
  if (data) {
    categories.value = data;
  }
};

const switchSection = async (sectionId: string) => {
  activeSection.value = sectionId;
  if (sectionId === 'products') {
    productStore.fetchProducts();
    await fetchCategories();
  } else if (sectionId === 'dashboard') {
    fetchStats();
  }
};

const logout = async () => {
  if (confirm("Are you sure you want to logout?")) {
    await authStore.signOut();
    router.push("/login");
  }
};

const stats = ref({
  todayOrders: 0,
  todayOrdersTrend: 0,
  todayRevenue: 0,
  todayRevenueTrend: 0,
  activeDeliveries: 0,
  activeDeliveriesTrend: 0,
  lowStockItems: 0,
  lowStockItemsTrend: 0
});

const fetchStats = async () => {
  try {
    const session = authStore.session;
    const token = session?.access_token;

    if (!token) return;

    const response = await fetch("http://localhost:3000/admin/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      stats.value = {
        ...stats.value, // Keep structure
        ...data // Overwrite with API data
      };
    }
  } catch (error) {
    console.error("Failed to fetch admin stats", error);
  }
};

// Product Management
const showProductModal = ref(false);
const editingProduct = ref<Partial<Product>>({});
const isEditing = ref(false);

const openAddProductModal = () => {
  editingProduct.value = {
    in_stock: true,
    quantity: 0,
    price: 0,
    original_price: 0,
    name: '',
    slug: '',
    weight: '',
    category_id: ''
  };
  isEditing.value = false;
  showProductModal.value = true;
};

const openEditProductModal = (product: Product) => {
  editingProduct.value = { ...product };
  isEditing.value = true;
  showProductModal.value = true;
};

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

// Auto-generate slug when name changes (only in create mode)
watch(() => editingProduct.value.name, (newName) => {
  if (!isEditing.value && newName) {
    editingProduct.value.slug = generateSlug(newName);
  }
});

const saveProduct = async () => {
  try {
    if (isEditing.value && editingProduct.value.id) {
      await productStore.updateProduct(editingProduct.value.id, editingProduct.value);
    } else {
      await productStore.addProduct(editingProduct.value);
    }
    showProductModal.value = false;
    // alert("Product saved!");
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

// Initial fetch
onMounted(() => {
  if (activeSection.value === 'products') {
    fetchCategories();
  } else if (activeSection.value === 'dashboard') {
    fetchStats();
  }
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
                <div :class="['stat-trend', stats.todayOrdersTrend >= 0 ? 'up' : 'down']">
                  {{ stats.todayOrdersTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(stats.todayOrdersTrend) }}% from yesterday
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Revenue Today</div>
                <div class="stat-value">
                  ${{ stats.todayRevenue.toLocaleString() }}
                </div>
                <div :class="['stat-trend', stats.todayRevenueTrend >= 0 ? 'up' : 'down']">
                  {{ stats.todayRevenueTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(stats.todayRevenueTrend) }}% from yesterday
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Active Deliveries</div>
                <div class="stat-value">{{ stats.activeDeliveries }}</div>
                <div class="stat-trend">
                  - <!-- No trend data yet -->
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Low Stock Items</div>
                <div class="stat-value">{{ stats.lowStockItems }}</div>
                <div class="stat-trend">
                  - <!-- No trend data yet -->
                </div>
              </div>
            </div>
          </section>

          <!-- Products Section -->
          <section v-show="activeSection === 'products'">
            <div class="page-header" style="display:flex; justify-content:space-between;">
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
                  <tr v-for="product in productStore.products" :key="product.id">
                    <td>
                      <div style="font-weight:700">{{ product.name }}</div>
                      <div style="font-size:12px; color:var(--paragraph); opacity:0.7">{{ product.slug }}</div>
                    </td>
                    <td>{{ product.category?.name || 'Uncategorized' }}</td>
                    <td>
                      <div style="font-weight:700">${{ product.price }}</div>
                      <div v-if="product.original_price" style="font-size:12px; text-decoration:line-through; opacity:0.7">
                        ${{ product.original_price }}
                      </div>
                    </td>
                    <td>{{ product.quantity || 0 }}</td>
                    <td>
                      <span :class="['badge', product.in_stock ? 'badge-delivered' : 'badge-pending']">
                        {{ product.in_stock ? 'In Stock' : 'Out of Stock' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn" style="margin-right:8px; padding: 4px 8px; font-size:12px" @click="openEditProductModal(product)">Edit</button>
                      <button class="btn" style="padding: 4px 8px; font-size:12px; border-color: #e74c3c; color: #e74c3c;" @click="deleteProduct(product.id)">Delete</button>
                    </td>
                  </tr>
                  <tr v-if="productStore.products.length === 0">
                    <td colspan="5" style="text-align:center; padding: 20px;">No products found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Placeholder for other sections -->
          <section
            v-show="activeSection !== 'dashboard' && activeSection !== 'products'"
            class="placeholder-section"
          >
            <div class="page-header">
              <h1 class="page-title">
                {{ activeSection.charAt(0).toUpperCase() + activeSection.slice(1) }}
              </h1>
              <p class="page-subtitle">This section is under development</p>
            </div>
            <div class="placeholder-content">
              <p>
                The {{ activeSection }} management interface will be implemented here.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>

    <!-- Simple Product Modal -->
    <div v-if="showProductModal" class="modal-overlay">
      <div class="modal">
        <h2>{{ isEditing ? 'Edit Product' : 'Add Product' }}</h2>
        <form @submit.prevent="saveProduct">
          <div class="form-group">
            <label>Name</label>
            <input v-model="editingProduct.name" placeholder="e.g. Organic Avocados" required />
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
            <input v-model="editingProduct.image_url" placeholder="https://example.com/image.png or 🥑" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Sale Price ($)</label>
              <input type="number" step="0.01" v-model.number="editingProduct.price" required />
            </div>
            <div class="form-group">
              <label>Original Price ($)</label>
              <input type="number" step="0.01" v-model.number="editingProduct.original_price" placeholder="Optional" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Weight / Unit</label>
              <input v-model="editingProduct.weight" placeholder="e.g. 1kg, 500g, 1 bunch" required />
            </div>
            <div class="form-group">
              <label>Slug (Auto-generated)</label>
              <input v-model="editingProduct.slug" placeholder="url-friendly-name" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Quantity</label>
              <input type="number" v-model.number="editingProduct.quantity" required />
            </div>
            <div class="form-group">
              <label>Stock Status</label>
              <label style="font-weight:normal; display:flex; align-items:center; gap:8px; color: var(--headline); height: 48px;">
                <input type="checkbox" v-model="editingProduct.in_stock" style="width:auto;" /> Available In Stock
              </label>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn" @click="showProductModal = false">Cancel</button>
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