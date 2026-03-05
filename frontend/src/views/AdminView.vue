<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProductStore, type Product } from "@/stores/products";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/models";

const router = useRouter();
const authStore = useAuthStore();
const productStore = useProductStore();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const activeSection = ref("dashboard");

const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

// ─── MARK: Categories ────────────────────────────────────────────────────
type Category = Tables<"categories">;
const categories = ref<Category[]>([]);
const showCategoryModal = ref(false);
const editingCategory = ref<Partial<Category>>({});
const isEditingCategory = ref(false);

const fetchCategories = async () => {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description, created_at");
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

// ─── MARK: Orders ────────────────────────────────────────────────────────
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
  user_id?: string;
}
const orders = ref<Order[]>([]);
const ordersLoading = ref(false);
const ordersError = ref("");
const activeOrderTab = ref("all");
const selectedOrder = ref<Order | null>(null);
const orderDetailLoading = ref(false);
const ordersTotal = ref(0);
const ordersPage = ref(1);
const ordersLimit = 25;

const filteredOrders = computed(() => {
  if (activeOrderTab.value === "all") return orders.value;
  return orders.value.filter((o) => o.status === activeOrderTab.value);
});

const totalPages = computed(() => Math.ceil(ordersTotal.value / ordersLimit));

const fetchOrders = async (page = 1) => {
  ordersLoading.value = true;
  ordersError.value = "";
  try {
    const from = (page - 1) * ordersLimit;
    const to = from + ordersLimit - 1;

    const { data, error, count } = await supabase
      .from("orders")
      .select(
        `id, user_id, status, total_amount, shipping_address, created_at, notes,
         user:profiles!orders_user_id_profile_fkey(full_name)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    orders.value = (data as any[]) ?? [];
    ordersTotal.value = count ?? 0;
    ordersPage.value = page;
  } catch (e: any) {
    ordersError.value = e.message || "Failed to load orders";
    console.error("Failed to fetch orders", e);
  } finally {
    ordersLoading.value = false;
  }
};

const openOrderDetail = async (order: Order) => {
  selectedOrder.value = order;
  if (!order.order_items) {
    orderDetailLoading.value = true;
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `*, order_items(quantity, price_at_purchase, product:products(name, image_url))`,
        )
        .eq("id", order.id)
        .single();

      if (error) throw error;
      selectedOrder.value = { ...order, ...(data as any) };
      const idx = orders.value.findIndex((o) => o.id === order.id);
      if (idx !== -1) orders.value[idx] = selectedOrder.value!;
    } catch (e) {
      console.error("Failed to load order detail", e);
    } finally {
      orderDetailLoading.value = false;
    }
  }
};

const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: status as "pending" | "processing" | "shipped" | "delivered" | "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) throw error;
    const idx = orders.value.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      const updatedOrder = { ...orders.value[idx], status };
      orders.value[idx] = updatedOrder as Order;
    }
    if (selectedOrder.value?.id === orderId)
      selectedOrder.value = { ...selectedOrder.value, status } as Order;
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

// ─── MARK: Stock ─────────────────────────────────────────────────────────
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

// ─── MARK: Delivery Slots ────────────────────────────────────────────────
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

// ─── MARK: Products ──────────────────────────────────────────────────────
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
    description: "",
    nutrition: [],
    storage: "",
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

const addNutritionRow = () => {
  if (!editingProduct.value.nutrition) editingProduct.value.nutrition = [];
  editingProduct.value.nutrition.push({ label: "", value: "" });
};

const removeNutritionRow = (idx: number) => {
  editingProduct.value.nutrition?.splice(idx, 1);
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

// ─── MARK: Users ────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "customer" | "admin";
  provider: string;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
}
const users = ref<AdminUser[]>([]);
const usersLoading = ref(false);
const usersError = ref("");
const userSearch = ref("");
const userRoleFilter = ref<"all" | "admin" | "customer">("all");

const filteredUsers = computed(() => {
  let list = users.value;
  if (userRoleFilter.value !== "all")
    list = list.filter((u) => u.role === userRoleFilter.value);
  const q = userSearch.value.toLowerCase().trim();
  if (q)
    list = list.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q),
    );
  return list;
});

const fetchUsers = async () => {
  usersLoading.value = true;
  usersError.value = "";
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    users.value = data.users ?? [];
  } catch (e: any) {
    usersError.value = e.message || "Failed to load users";
  } finally {
    usersLoading.value = false;
  }
};

const updateUserRole = async (userId: string, role: "customer" | "admin") => {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update role");
    }
    const idx = users.value.findIndex((u) => u.id === userId);
    if (idx !== -1) users.value[idx] = { ...users.value[idx], role } as typeof users.value[number];
  } catch (e: any) {
    alert("Error updating role: " + e.message);
  }
};

const userInitials = (user: AdminUser) => {
  if (user.full_name) return user.full_name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return "?";
};

// ─── MARK: Stores ────────────────────────────────────────────────────────
type Store = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  opening_hours: Record<string, string> | null;
  is_active: boolean;
  created_at: string | null;
};

const stores = ref<Store[]>([]);
const storesLoading = ref(false);
const storesError = ref<string | null>(null);
const showStoreModal = ref(false);
const editingStore = ref<Partial<Store>>({});
const isEditingStore = ref(false);
const storeInventoryStore = ref<Store | null>(null);
const storeInventory = ref<any[]>([]);
const storeInventoryLoading = ref(false);

const fetchStores = async () => {
  storesLoading.value = true;
  storesError.value = null;
  try {
    const res = await fetch(`${API_URL}/stores`);
    const json = await res.json();
    stores.value = json.data ?? [];
  } catch (e: any) {
    storesError.value = e.message;
  } finally {
    storesLoading.value = false;
  }
};

const openAddStoreModal = () => {
  isEditingStore.value = false;
  editingStore.value = { is_active: true };
  showStoreModal.value = true;
};

const openEditStoreModal = (s: Store) => {
  isEditingStore.value = true;
  editingStore.value = { ...s };
  showStoreModal.value = true;
};

const saveStore = async () => {
  const token = await getToken();
  if (!token) return;
  const { id, ...body } = editingStore.value as Store;
  const url = isEditingStore.value ? `${API_URL}/admin/stores/${id}` : `${API_URL}/admin/stores`;
  const method = isEditingStore.value ? "PATCH" : "POST";
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { alert("Failed to save store"); return; }
  showStoreModal.value = false;
  await fetchStores();
};

const deleteStore = async (id: string) => {
  if (!confirm("Delete this store?")) return;
  const token = await getToken();
  if (!token) return;
  await fetch(`${API_URL}/admin/stores/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await fetchStores();
};

const openStoreInventory = async (s: Store) => {
  storeInventoryStore.value = s;
  storeInventoryLoading.value = true;
  storeInventory.value = [];
  // Load all products then merge with inventory
  const [invRes, prodRes] = await Promise.all([
    fetch(`${API_URL}/stores/${s.id}/inventory`),
    fetch(`${API_URL}/products?limit=200`),
  ]);
  const invJson = await invRes.json();
  const prodJson = await prodRes.json();
  const invMap = new Map((invJson.data ?? []).map((i: any) => [i.product_id, i]));
  storeInventory.value = (prodJson.data ?? []).map((p: any) => {
    const inv: any = invMap.get(p.id) ?? {};
    return { ...p, inv_quantity: inv.quantity ?? 0, inv_in_stock: inv.in_stock ?? false };
  });
  storeInventoryLoading.value = false;
};

const updateStoreInventory = async (productId: string, field: "quantity" | "in_stock", value: any) => {
  const token = await getToken();
  if (!token || !storeInventoryStore.value) return;
  await fetch(`${API_URL}/admin/stores/${storeInventoryStore.value.id}/inventory/${productId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  const idx = storeInventory.value.findIndex((p) => p.id === productId);
  if (idx !== -1) storeInventory.value[idx][field === "quantity" ? "inv_quantity" : "inv_in_stock"] = value;
};

// ─── MARK: Delivery Zones ────────────────────────────────────────────────
type DeliveryZone = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  suburbs: string[];
  created_at: string | null;
};

const zones = ref<DeliveryZone[]>([]);
const zonesLoading = ref(false);
const showZoneModal = ref(false);
const editingZone = ref<Partial<DeliveryZone> & { suburbsText?: string }>({});
const isEditingZone = ref(false);

const fetchZones = async () => {
  zonesLoading.value = true;
  try {
    const res = await fetch(`${API_URL}/delivery-zones`);
    const data = await res.json();
    zones.value = (Array.isArray(data) ? data : data.data ?? []).map((z: any) => ({
      ...z,
      suburbs: z.suburbs ?? [],
    }));
  } catch (e) {
    console.error("Failed to fetch zones", e);
  } finally {
    zonesLoading.value = false;
  }
};

const openAddZoneModal = () => {
  isEditingZone.value = false;
  editingZone.value = { is_active: true, suburbs: [], suburbsText: "" };
  showZoneModal.value = true;
};

const openEditZoneModal = (z: DeliveryZone) => {
  isEditingZone.value = true;
  editingZone.value = { ...z, suburbsText: (z.suburbs ?? []).join(", ") };
  showZoneModal.value = true;
};

const saveZone = async () => {
  const token = await getToken();
  if (!token) return;
  const { id, suburbsText, ...rest } = editingZone.value as DeliveryZone & { suburbsText: string };
  const suburbs = (suburbsText || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const body = { ...rest, suburbs };
  const url = isEditingZone.value ? `${API_URL}/delivery-zones/${id}` : `${API_URL}/delivery-zones`;
  const method = isEditingZone.value ? "PATCH" : "POST";
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { alert("Failed to save zone"); return; }
  showZoneModal.value = false;
  await fetchZones();
};

const toggleZoneActive = async (z: DeliveryZone) => {
  const token = await getToken();
  if (!token) return;
  await fetch(`${API_URL}/delivery-zones/${z.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: !z.is_active }),
  });
  await fetchZones();
};

const deleteZone = async (id: string) => {
  if (!confirm("Delete this delivery zone?")) return;
  const token = await getToken();
  if (!token) return;
  const res = await fetch(`${API_URL}/delivery-zones/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    alert(body.error || "Failed to delete zone");
    return;
  }
  await fetchZones();
};

// ─── MARK: Navigation ────────────────────────────────────────────────────
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
  else if (sectionId === "users") await fetchUsers();
  else if (sectionId === "stores") await fetchStores();
  else if (sectionId === "zones") await fetchZones();
};

const logout = async () => {
  if (confirm("Are you sure you want to logout?")) {
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
                <div :class="[
                  'stat-trend',
                  stats.todayOrdersTrend >= 0 ? 'up' : 'down',
                ]">
                  {{ stats.todayOrdersTrend >= 0 ? "↑" : "↓" }}
                  {{ Math.abs(stats.todayOrdersTrend) }}% from yesterday
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Revenue Today</div>
                <div class="stat-value">
                  ${{ stats.todayRevenue.toLocaleString() }}
                </div>
                <div :class="[
                  'stat-trend',
                  stats.todayRevenueTrend >= 0 ? 'up' : 'down',
                ]">
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
            <div class="page-header" style="display: flex; justify-content: space-between">
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
                      <div style="font-weight: 700">{{ product.name }}</div>
                      <div style="
                          font-size: 12px;
                          color: var(--paragraph);
                          opacity: 0.7;
                        ">
                        {{ product.slug }}
                      </div>
                    </td>
                    <td>{{ product.category?.name || "Uncategorized" }}</td>
                    <td>
                      <div style="font-weight: 700">${{ product.price }}</div>
                      <div v-if="product.original_price" style="
                          font-size: 12px;
                          text-decoration: line-through;
                          opacity: 0.7;
                        ">
                        ${{ product.original_price }}
                      </div>
                    </td>
                    <td>{{ product.quantity || 0 }}</td>
                    <td>
                      <span :class="[
                        'badge',
                        product.in_stock
                          ? 'badge-delivered'
                          : 'badge-pending',
                      ]">
                        {{ product.in_stock ? "In Stock" : "Out of Stock" }}
                      </span>
                    </td>
                    <td>
                      <button class="btn" style="
                          margin-right: 8px;
                          padding: 4px 8px;
                          font-size: 12px;
                        " @click="openEditProductModal(product)">
                        Edit
                      </button>
                      <button class="btn" style="
                          padding: 4px 8px;
                          font-size: 12px;
                          border-color: #e74c3c;
                          color: #e74c3c;
                        " @click="deleteProduct(product.id)">
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
            <div class="page-header" style="display: flex; justify-content: space-between">
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
                      <button class="btn" style="
                          margin-right: 8px;
                          padding: 4px 8px;
                          font-size: 12px;
                        " @click="openEditCategoryModal(cat)">
                        Edit
                      </button>
                      <button class="btn" style="
                          padding: 4px 8px;
                          font-size: 12px;
                          border-color: #e74c3c;
                          color: #e74c3c;
                        " @click="deleteCategory(cat.id)">
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
              <div class="orders-filter" style="display: flex; gap: 8px; margin-bottom: 20px">
                <button v-for="tab in [
                  'all',
                  'pending',
                  'processing',
                  'shipped',
                  'delivered',
                  'cancelled',
                ]" :key="tab" class="btn" :class="{ 'btn-primary': activeOrderTab === tab }" style="
                    padding: 6px 14px;
                    font-size: 13px;
                    text-transform: capitalize;
                  " @click="activeOrderTab = tab">
                  {{
                    tab === "all"
                      ? "All"
                      : tab.charAt(0).toUpperCase() + tab.slice(1)
                  }}
                </button>
              </div>
              <div v-if="ordersLoading" style="text-align: center; padding: 40px">
                Loading orders...
              </div>
              <div v-else-if="ordersError" style="text-align:center; padding:24px; color:#e74c3c; font-weight:600;">
                ⚠ {{ ordersError }}
                <button class="btn" style="margin-left:12px;" @click="fetchOrders()">Retry</button>
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
                    <tr v-for="order in filteredOrders" :key="order.id" style="cursor: pointer"
                      @click="openOrderDetail(order)">
                      <td style="
                          font-weight: 700;
                          font-family: monospace;
                          font-size: 13px;
                        ">
                        {{ order.id.slice(0, 8).toUpperCase() }}
                      </td>
                      <td>
                        {{
                          order.user?.full_name ||
                          order.user?.email ||
                          (order.user_id ? order.user_id.slice(0, 8).toUpperCase() : "Customer")
                        }}
                      </td>
                      <td style="font-size: 13px">
                        {{ new Date(order.created_at).toLocaleDateString() }}
                      </td>
                      <td style="font-weight: 700">
                        ${{ order.total_amount?.toFixed(2) }}
                      </td>
                      <td>
                        <span :class="['badge', orderStatusClass(order.status)]" style="text-transform: capitalize">{{
                          order.status }}</span>
                      </td>
                      <td @click.stop>
                        <select :value="order.status" @change="
                          updateOrderStatus(
                            order.id,
                            ($event.target as HTMLSelectElement).value,
                          )
                          " style="
                            padding: 4px 8px;
                            border: 2px solid var(--stroke);
                            font-size: 12px;
                            cursor: pointer;
                            background: white;
                            font-family: 'DM Sans', sans-serif;
                          ">
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
              <!-- Pagination -->
              <div v-if="totalPages > 1"
                style="display:flex; align-items:center; gap:12px; margin-top:16px; justify-content:center;">
                <button class="btn" :disabled="ordersPage === 1" @click="fetchOrders(ordersPage - 1)">← Prev</button>
                <span style="font-size:14px; color:#555;">Page {{ ordersPage }} of {{ totalPages }} ({{ ordersTotal }}
                  orders)</span>
                <button class="btn" :disabled="ordersPage >= totalPages" @click="fetchOrders(ordersPage + 1)">Next
                  →</button>
              </div>
            </div>

            <!-- Order Detail -->
            <div v-else>
              <div style="
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  margin-bottom: 24px;
                ">
                <button class="btn" @click="selectedOrder = null">
                  ← Back
                </button>
                <h1 class="page-title" style="margin: 0">
                  Order #{{ selectedOrder.id.slice(0, 8).toUpperCase() }}
                </h1>
                <span :class="['badge', orderStatusClass(selectedOrder.status)]" style="text-transform: capitalize">{{
                  selectedOrder.status }}</span>
              </div>
              <div style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 24px;
                ">
                <div class="table-container" style="padding: 20px">
                  <div style="
                      font-weight: 700;
                      margin-bottom: 12px;
                      color: var(--headline);
                    ">
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
                  <div style="
                      font-weight: 700;
                      margin-bottom: 12px;
                      color: var(--headline);
                    ">
                    Update Status
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px">
                    <button v-for="s in [
                      'pending',
                      'processing',
                      'shipped',
                      'delivered',
                      'cancelled',
                    ]" :key="s" class="btn" :class="{ 'btn-primary': selectedOrder.status === s }"
                      style="text-transform: capitalize" @click="updateOrderStatus(selectedOrder.id, s)">
                      {{ s }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="table-container">
                <div v-if="orderDetailLoading" style="text-align:center; padding:24px; color:#666;">Loading items…</div>
                <table v-else>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedOrder.order_items" :key="item.product?.name">
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
                      <td colspan="3" style="
                          text-align: right;
                          font-weight: 700;
                          padding: 16px;
                        ">
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
              <button v-for="f in [
                ['all', 'All Products'],
                ['low', 'Low Stock (≤10)'],
                ['out', 'Out of Stock'],
              ]" :key="f[0]" class="btn" :class="{ 'btn-primary': stockFilter === f[0] }"
                style="padding: 6px 14px; font-size: 13px" @click="stockFilter = f[0] as any">
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
                  <tr v-for="p in visibleStock" :key="p.id" :style="(p as any).quantity === 0
                    ? 'background:#fff5f5;'
                    : (p as any).quantity <= 10
                      ? 'background:#fffbf0;'
                      : ''
                    ">
                    <td>
                      <div style="font-weight: 700">{{ p.name }}</div>
                      <div style="font-size: 12px; opacity: 0.6">
                        {{ p.weight }}
                      </div>
                    </td>
                    <td>{{ p.category?.name || "—" }}</td>
                    <td>
                      <span :style="(p as any).quantity === 0
                        ? 'color:#e74c3c; font-weight:700;'
                        : (p as any).quantity <= 10
                          ? 'color:#f39c12; font-weight:700;'
                          : 'font-weight:700;'
                        ">
                        {{ (p as any).quantity ?? 0 }}
                      </span>
                    </td>
                    <td>
                      <span :class="[
                        'badge',
                        p.in_stock ? 'badge-delivered' : 'badge-cancelled',
                      ]">
                        {{ p.in_stock ? "In Stock" : "Out of Stock" }}
                      </span>
                    </td>
                    <td @click.stop style="
                        display: flex;
                        gap: 8px;
                        align-items: center;
                        padding: 16px;
                      ">
                      <input type="number" min="0" :value="(p as any).quantity ?? 0" @change="
                        (e) => {
                          (p as any).quantity =
                            parseInt((e.target as HTMLInputElement).value) ||
                            0;
                        }
                      " style="
                          width: 70px;
                          padding: 6px;
                          border: 2px solid var(--stroke);
                          font-size: 14px;
                          text-align: center;
                        " />
                      <button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px"
                        @click="updateStock(p as any)">
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

          <!-- Delivery Zones Section -->
          <section v-show="activeSection === 'zones'">
            <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <h1 class="page-title">Delivery Zones</h1>
                <p class="page-subtitle">Define which areas you deliver to. Inactive zones will block checkout for customers in those areas.</p>
              </div>
              <button class="btn btn-primary" @click="openAddZoneModal">+ Add Zone</button>
            </div>

            <div v-if="zonesLoading" style="text-align:center; padding:40px; color:#666;">Loading zones…</div>
            <div v-else class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Description</th>
                    <th>Covered Areas / Suburbs</th>
                    <th style="text-align:center;">Status</th>
                    <th style="text-align:center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="z in zones" :key="z.id">
                    <td style="font-weight:700;">{{ z.name }}</td>
                    <td style="font-size:13px; color:#555; max-width:200px;">{{ z.description || '—' }}</td>
                    <td>
                      <div style="display:flex; flex-wrap:wrap; gap:4px;">
                        <span v-for="suburb in (z.suburbs ?? [])" :key="suburb"
                          style="display:inline-block; padding:2px 8px; background:#f0f0f0; border-radius:99px; font-size:12px;">
                          {{ suburb }}
                        </span>
                        <span v-if="!z.suburbs?.length" style="font-size:13px; color:#999;">No areas set</span>
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <button
                        :style="`display:inline-block; padding:3px 12px; border-radius:99px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:background .2s; background:${z.is_active ? '#d4edda' : '#f8d7da'}; color:${z.is_active ? '#155724' : '#721c24'};`"
                        :title="z.is_active ? 'Click to deactivate' : 'Click to activate'"
                        @click="toggleZoneActive(z)"
                      >
                        {{ z.is_active ? '✓ Active' : '✗ Inactive' }}
                      </button>
                    </td>
                    <td style="text-align:center;">
                      <div style="display:flex; gap:6px; justify-content:center;">
                        <button class="btn" style="padding:4px 10px; font-size:12px; background:#f0f0f0;" @click="openEditZoneModal(z)">Edit</button>
                        <button class="btn" style="padding:4px 10px; font-size:12px; background:#ffd5d5; color:#c0392b;" @click="deleteZone(z.id)">Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="zones.length === 0">
                    <td colspan="5" style="text-align:center; padding:30px; color:#999;">No delivery zones yet. Add one!</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Add / Edit Zone Modal -->
            <div v-if="showZoneModal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;" @click.self="showZoneModal=false">
              <div style="background:white;padding:32px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto;">
                <h2 style="margin:0 0 24px; font-size:20px;">{{ isEditingZone ? 'Edit Zone' : 'Add Zone' }}</h2>
                <div style="display:flex; flex-direction:column; gap:14px;">
                  <div>
                    <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Zone Name *</label>
                    <input v-model="editingZone.name" style="width:100%; padding:8px 12px; border:2px solid var(--stroke); font-family:inherit; box-sizing:border-box;" placeholder="e.g. Zone A – City Centre" />
                  </div>
                  <div>
                    <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Description</label>
                    <input v-model="editingZone.description" style="width:100%; padding:8px 12px; border:2px solid var(--stroke); font-family:inherit; box-sizing:border-box;" placeholder="Short description of area covered" />
                  </div>
                  <div>
                    <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Covered Areas / Suburbs</label>
                    <textarea v-model="editingZone.suburbsText" rows="3"
                      style="width:100%; padding:8px 12px; border:2px solid var(--stroke); font-family:inherit; box-sizing:border-box; resize:vertical;"
                      placeholder="Comma-separated: District 1, District 3, CBD, Inner City" />
                    <p style="font-size:12px; color:#999; margin:4px 0 0;">Enter suburb/area names separated by commas. These are matched against customer address selections.</p>
                  </div>
                  <div>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:600;">
                      <input type="checkbox" v-model="editingZone.is_active" style="width:16px; height:16px;" />
                      Zone is active (deliveries available)
                    </label>
                    <p v-if="!editingZone.is_active" style="font-size:12px; color:#e74c3c; margin:4px 0 0;">⚠ Customers selecting areas in this zone will see a delivery unavailability notice.</p>
                  </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:28px; justify-content:flex-end;">
                  <button class="btn btn-secondary" @click="showZoneModal=false">Cancel</button>
                  <button class="btn btn-primary" @click="saveZone">{{ isEditingZone ? 'Save Changes' : 'Add Zone' }}</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Delivery Slots Section -->
          <section v-show="activeSection === 'slots'">
            <div class="page-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
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
            <div style="
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                align-items: center;
              ">
              <label style="font-weight: 700; font-size: 13px">Filter by Date:</label>
              <input type="date" v-model="slotDateFilter" @change="fetchSlots()" style="
                  padding: 8px 12px;
                  border: 2px solid var(--stroke);
                  border-radius: 0;
                  font-size: 14px;
                " />
              <button v-if="slotDateFilter" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px" @click="
                slotDateFilter = '';
              fetchSlots();
              ">
                Clear
              </button>
              <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px" @click="fetchSlots()">
                Refresh
              </button>
            </div>

            <div v-if="slotsLoading" style="padding: 20px; text-align: center">
              Loading slots...
            </div>
            <div v-else-if="slots.length === 0" style="padding: 20px; text-align: center; color: #666">
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
                  <tr v-for="slot in slots" :key="slot.id" :style="slot.booked >= slot.capacity ? 'background:#fff0f0;' : ''
                    ">
                    <td style="font-weight: 600">{{ formatSlotTime(slot) }}</td>
                    <td>{{ slot.delivery_zones?.name || "—" }}</td>
                    <td>{{ slot.capacity }}</td>
                    <td :style="slot.booked >= slot.capacity
                      ? 'color:#e74c3c; font-weight:700;'
                      : ''
                      ">
                      {{ slot.booked }}
                    </td>
                    <td :style="slot.capacity - slot.booked === 0
                      ? 'color:#e74c3c;'
                      : 'color:#27ae60;'
                      ">
                      {{ slot.capacity - slot.booked }}
                    </td>
                    <td>
                      <span class="badge" :class="slotStatusClass(slot.status)">{{ slot.status }}</span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 8px">
                        <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px"
                          @click="openEditSlotModal(slot)">
                          Edit
                        </button>
                        <button class="btn" style="
                            padding: 4px 10px;
                            font-size: 12px;
                            background: #fff0f0;
                            color: #e74c3c;
                            border-color: #e74c3c;
                          " @click="deleteSlot(slot.id)">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Users Section -->
          <section v-show="activeSection === 'users'">
            <div class="page-header">
              <h1 class="page-title">Users</h1>
              <p class="page-subtitle">Manage registered users and their roles</p>
            </div>

            <!-- Toolbar -->
            <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; align-items:center;">
              <input
                v-model="userSearch"
                placeholder="Search by name or email…"
                style="flex:1; min-width:200px; padding:8px 12px; border:2px solid var(--stroke); font-size:14px;"
              />
              <div style="display:flex; gap:8px;">
                <button
                  v-for="f in [['all','All'],['admin','Admins'],['customer','Customers']]"
                  :key="f[0]"
                  class="btn"
                  :class="{ 'btn-primary': userRoleFilter === f[0] }"
                  style="padding:6px 14px; font-size:13px;"
                  @click="userRoleFilter = f[0] as any"
                >{{ f[1] }}</button>
              </div>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:13px;" @click="fetchUsers()">Refresh</button>
            </div>

            <div v-if="usersLoading" style="text-align:center; padding:40px; color:#666;">Loading users…</div>
            <div v-else-if="usersError" style="text-align:center; padding:24px; color:#e74c3c; font-weight:600;">
              ⚠ {{ usersError }}
              <button class="btn" style="margin-left:12px;" @click="fetchUsers()">Retry</button>
            </div>
            <div v-else class="table-container">
              <div style="padding:12px 16px; background:#f9f9f9; border-bottom:2px solid var(--stroke); font-size:13px; color:#666;">
                Showing {{ filteredUsers.length }} of {{ users.length }} users
              </div>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Provider</th>
                    <th>Joined</th>
                    <th>Last Sign-in</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in filteredUsers" :key="user.id">
                    <td>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <div v-if="user.avatar_url"
                          style="width:34px; height:34px; border-radius:50%; overflow:hidden; flex-shrink:0;">
                          <img :src="user.avatar_url" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <div v-else
                          style="width:34px; height:34px; border-radius:50%; background:var(--highlight); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0;">
                          {{ userInitials(user) }}
                        </div>
                        <div>
                          <div style="font-weight:700; font-size:14px;">{{ user.full_name || '—' }}</div>
                          <div style="font-size:11px; font-family:monospace; color:#999;">{{ user.id.slice(0,8) }}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-size:13px;">{{ user.email || '—' }}</td>
                    <td>
                      <span style="font-size:12px; padding:2px 8px; border:1px solid var(--stroke); border-radius:99px; text-transform:capitalize;">
                        {{ user.provider }}
                      </span>
                    </td>
                    <td style="font-size:13px;">{{ new Date(user.created_at).toLocaleDateString() }}</td>
                    <td style="font-size:13px;">
                      {{ user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '—' }}
                    </td>
                    <td @click.stop>
                      <select
                        :value="user.role"
                        :disabled="user.id === authStore.user?.id"
                        @change="updateUserRole(user.id, ($event.target as HTMLSelectElement).value as any)"
                        :style="`padding:4px 8px; border:2px solid ${user.role === 'admin' ? '#6c5ce7' : 'var(--stroke)'}; font-size:12px; cursor:pointer; background:${user.role === 'admin' ? '#f5f3ff' : 'white'}; font-family:'DM Sans',sans-serif; border-radius:4px;`"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                      <span v-if="user.id === authStore.user?.id" style="font-size:11px; color:#999; margin-left:6px;">(you)</span>
                    </td>
                  </tr>
                  <tr v-if="filteredUsers.length === 0">
                    <td colspan="6" style="text-align:center; padding:30px; color:#999;">No users found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Stores Section -->
          <section v-show="activeSection === 'stores'">
            <!-- Store inventory detail view -->
            <template v-if="storeInventoryStore">
              <div class="page-header" style="display:flex; align-items:center; gap:16px;">
                <button class="btn btn-secondary" style="padding:6px 14px; font-size:13px;" @click="storeInventoryStore = null">← Back</button>
                <div>
                  <h1 class="page-title">{{ storeInventoryStore.name }} — Inventory</h1>
                  <p class="page-subtitle">{{ storeInventoryStore.address }}</p>
                </div>
              </div>
              <div v-if="storeInventoryLoading" style="text-align:center; padding:40px; color:#666;">Loading inventory…</div>
              <div v-else class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th style="width:120px; text-align:center;">Qty in Store</th>
                      <th style="width:120px; text-align:center;">In Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in storeInventory" :key="p.id">
                      <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                          <span style="font-size:22px;">{{ p.image_url?.startsWith('http') ? '' : (p.image_url || '📦') }}</span>
                          <span style="font-weight:600; font-size:14px;">{{ p.name }}</span>
                        </div>
                      </td>
                      <td style="font-size:13px;">${{ p.price?.toFixed(2) }}</td>
                      <td style="text-align:center;">
                        <input
                          type="number"
                          min="0"
                          :value="p.inv_quantity"
                          style="width:70px; padding:4px 8px; border:2px solid var(--stroke); text-align:center; font-family:inherit;"
                          @change="updateStoreInventory(p.id, 'quantity', Number(($event.target as HTMLInputElement).value))"
                        />
                      </td>
                      <td style="text-align:center;">
                        <label style="display:inline-flex; align-items:center; cursor:pointer; gap:6px;">
                          <input
                            type="checkbox"
                            :checked="p.inv_in_stock"
                            @change="updateStoreInventory(p.id, 'in_stock', ($event.target as HTMLInputElement).checked)"
                            style="width:16px; height:16px; cursor:pointer;"
                          />
                          <span style="font-size:12px;" :style="{ color: p.inv_in_stock ? '#00b894' : '#d63031' }">
                            {{ p.inv_in_stock ? 'In Stock' : 'Out' }}
                          </span>
                        </label>
                      </td>
                    </tr>
                    <tr v-if="storeInventory.length === 0">
                      <td colspan="4" style="text-align:center; padding:30px; color:#999;">No products found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- Store list view -->
            <template v-else>
              <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <h1 class="page-title">Stores / Warehouses</h1>
                  <p class="page-subtitle">Manage physical store locations and their stock</p>
                </div>
                <button class="btn btn-primary" @click="openAddStoreModal">+ Add Store</button>
              </div>

              <div v-if="storesLoading" style="text-align:center; padding:40px; color:#666;">Loading stores…</div>
              <div v-else-if="storesError" style="text-align:center; padding:24px; color:#e74c3c; font-weight:600;">
                ⚠ {{ storesError }}
                <button class="btn" style="margin-left:12px;" @click="fetchStores()">Retry</button>
              </div>
              <div v-else class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Store Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th style="text-align:center;">Status</th>
                      <th style="text-align:center;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in stores" :key="s.id">
                      <td style="font-weight:700;">{{ s.name }}</td>
                      <td style="font-size:13px; color:#555;">{{ s.address }}</td>
                      <td style="font-size:13px;">{{ s.phone || '—' }}</td>
                      <td style="text-align:center;">
                        <span :style="`display:inline-block; padding:3px 10px; border-radius:99px; font-size:12px; font-weight:600; background:${s.is_active ? '#d4edda' : '#f8d7da'}; color:${s.is_active ? '#155724' : '#721c24'};`">
                          {{ s.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td style="text-align:center;">
                        <div style="display:flex; gap:6px; justify-content:center;">
                          <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" @click="openStoreInventory(s)">Inventory</button>
                          <button class="btn" style="padding:4px 10px; font-size:12px; background:#f0f0f0;" @click="openEditStoreModal(s)">Edit</button>
                          <button class="btn" style="padding:4px 10px; font-size:12px; background:#ffd5d5; color:#c0392b;" @click="deleteStore(s.id)">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="stores.length === 0">
                      <td colspan="5" style="text-align:center; padding:30px; color:#999;">No stores yet. Add one!</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- Add / Edit Store Modal -->
            <div v-if="showStoreModal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;" @click.self="showStoreModal=false">
              <div style="background:white;padding:32px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto;">
                <h2 style="margin:0 0 24px; font-size:20px;">{{ isEditingStore ? 'Edit Store' : 'Add Store' }}</h2>
                <div style="display:flex; flex-direction:column; gap:14px;">
                  <div>
                    <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Store Name *</label>
                    <input v-model="editingStore.name" style="width:100%; padding:8px 12px; border:2px solid var(--stroke); font-family:inherit; box-sizing:border-box;" placeholder="e.g. City Central" />
                  </div>
                  <div>
                    <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Address *</label>
                    <input v-model="editingStore.address" style="width:100%; padding:8px 12px; border:2px solid var(--stroke); font-family:inherit; box-sizing:border-box;" placeholder="123 Main St, Melbourne VIC 3000" />
                  </div>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div>
                      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Phone</label>
                      <input v-model="editingStore.phone" style="width:100%; padding:8px 12px; border:2px solid var(--stroke); font-family:inherit; box-sizing:border-box;" placeholder="+61 3 9000 0001" />
                    </div>
                    <div>
                      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">Email</label>
                      <input v-model="editingStore.email" type="email" style="width:100%; padding:8px 12px; border:2px solid var(--stroke); font-family:inherit; box-sizing:border-box;" placeholder="store@example.com" />
                    </div>
                  </div>
                  <div>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:600;">
                      <input type="checkbox" v-model="editingStore.is_active" style="width:16px; height:16px;" />
                      Store is active (visible to customers)
                    </label>
                  </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:28px; justify-content:flex-end;">
                  <button class="btn btn-secondary" @click="showStoreModal=false">Cancel</button>
                  <button class="btn btn-primary" @click="saveStore">{{ isEditingStore ? 'Save Changes' : 'Add Store' }}</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Placeholder for other sections -->
          <section v-show="![
            'dashboard',
            'products',
            'categories',
            'orders',
            'stock',
            'slots',
            'zones',
            'stores',
            'users',
          ].includes(activeSection)
            " class="placeholder-section">
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
              <input v-model="editingCategory.name" placeholder="e.g. Fresh Produce" required />
            </div>
            <div class="form-group">
              <label>Icon (Emoji)</label>
              <input v-model="editingCategory.icon" placeholder="e.g. 🥦" />
            </div>
          </div>
          <div class="form-group">
            <label>Slug (Auto-generated)</label>
            <input v-model="editingCategory.slug" placeholder="url-friendly-name" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input v-model="editingCategory.description" placeholder="Optional description" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showCategoryModal = false">
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

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Sale Price ($)</label>
              <input type="number" step="0.01" v-model.number="editingProduct.price" required />
            </div>
            <div class="form-group">
              <label>Original Price ($)</label>
              <input type="number" step="0.01" v-model.number="editingProduct.original_price" placeholder="Optional" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Weight / Unit</label>
              <input v-model="editingProduct.weight" placeholder="e.g. 1kg, 500g, 1 bunch" required />
            </div>
            <div class="form-group">
              <label>Slug (Auto-generated)</label>
              <input v-model="editingProduct.slug" placeholder="url-friendly-name" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label>Quantity</label>
              <input type="number" v-model.number="editingProduct.quantity" required />
            </div>
            <div class="form-group">
              <label>Stock Status</label>
              <label style="
                  font-weight: normal;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  color: var(--headline);
                  height: 48px;
                ">
                <input type="checkbox" v-model="editingProduct.in_stock" style="width: auto" />
                Available In Stock
              </label>
            </div>
          </div>

          <!-- Description -->
          <div class="form-group" style="margin-top:16px;">
            <label>Description</label>
            <textarea v-model="editingProduct.description" rows="3" placeholder="Product description shown to customers"
              style="width:100%; padding:8px; border:2px solid var(--stroke); border-radius:6px; font-family:inherit; font-size:14px; resize:vertical;"></textarea>
          </div>

          <!-- Nutrition -->
          <div class="form-group" style="margin-top:16px;">
            <label style="display:flex; justify-content:space-between; align-items:center;">
              Nutrition Info
              <button type="button" class="btn" style="padding:4px 10px; font-size:12px;" @click="addNutritionRow">+ Add
                Row</button>
            </label>
            <div v-for="(row, idx) in editingProduct.nutrition" :key="idx"
              style="display:grid; grid-template-columns:1fr 1fr auto; gap:8px; margin-top:6px; align-items:center;">
              <input v-model="row.label" placeholder="e.g. Calories"
                style="padding:6px 8px; border:2px solid var(--stroke); border-radius:6px; font-size:13px;" />
              <input v-model="row.value" placeholder="e.g. 240 kcal"
                style="padding:6px 8px; border:2px solid var(--stroke); border-radius:6px; font-size:13px;" />
              <button type="button" @click="removeNutritionRow(idx)"
                style="background:none; border:none; color:#e74c3c; font-size:18px; cursor:pointer; line-height:1;">✕</button>
            </div>
            <p v-if="!editingProduct.nutrition?.length" style="font-size:13px; color:#999; margin-top:6px;">No nutrition
              rows yet. Click "+ Add Row" to start.</p>
          </div>

          <!-- Storage -->
          <div class="form-group" style="margin-top:16px;">
            <label>Storage Instructions</label>
            <textarea v-model="editingProduct.storage" rows="3"
              placeholder="e.g. Keep refrigerated at 2-4°C. Best before 5 days."
              style="width:100%; padding:8px; border:2px solid var(--stroke); border-radius:6px; font-family:inherit; font-size:14px; resize:vertical;"></textarea>
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
              <input type="number" v-model="editingSlot.capacity" min="1" placeholder="20" required />
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
