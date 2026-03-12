<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, shallowRef } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "@/stores/cart";
import { useProductStore } from "@/stores/products";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import type { Tables } from "@/lib/models";
import ProductReviews from "@/components/ProductReviews.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const productStore = useProductStore();

const quantity = ref(1);
const activeTab = ref("description");
const addedToCart = ref(false);
const loading = ref(true);
const product = shallowRef<Product | null>(null);
const relatedProducts = ref<Pick<Tables<'products'>, 'id' | 'name' | 'price' | 'image_url'>[]>([]);

const fetchProduct = async (id: string) => {
  // Clean up any existing stock subscription for the old product
  if (stockChannel) {
    await supabase.removeChannel(stockChannel);
    stockChannel = null;
  }
  loading.value = true;
  product.value = null;
  relatedProducts.value = [];
  quantity.value = 1;
  activeTab.value = "description";
  storeAvailability.value = [];
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`*, category:categories(name, slug)`)
      .eq("id", id)
      .single();

    if (error) throw error;
    product.value = data as Product;
    subscribeToStock(id);

    // Fetch related products in same category
    if (data?.category_id) {
      const { data: related } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .eq("category_id", data.category_id)
        .neq("id", id)
        .limit(4);
      relatedProducts.value = related || [];
    }
  } catch (err) {
    console.error("Failed to fetch product:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchProduct(route.params.id as string));

watch(
  () => route.params.id,
  (newId) => { if (newId) fetchProduct(newId as string); }
);

const displayImage = computed(() => product.value?.image_url || "🛒");
const categoryName = computed(() => product.value?.category?.name || "");

const updateQuantity = (change: number) => {
  const max = product.value?.quantity ?? Infinity;
  quantity.value = Math.min(Math.max(1, quantity.value + change), max as number);
};

const nutritionRows = computed(() =>
  (product.value?.nutrition ?? []) as Array<{ label: string; value: string }>
);

const handleAddToCart = () => {
  if (!product.value) return;
  cartStore.addItem({
    productId: product.value.id,
    name: product.value.name,
    price: product.value.price,
    size: product.value.weight || "",
    icon: product.value.image_url || "🛒",
    quantity: quantity.value,
  });
  addedToCart.value = true;
  setTimeout(() => {
    addedToCart.value = false;
  }, 2000);
};

const buyNow = () => {
  handleAddToCart();
  setTimeout(() => router.push("/cart"), 500);
};

const switchTab = (tabId: string) => {
  activeTab.value = tabId;
  if (tabId === 'stores' && storeAvailability.value.length === 0) fetchStoreAvailability();
};

// ─── Store Availability ───────────────────────────────────────────────────
interface StoreStock {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  quantity: number;
  in_stock: boolean;
}
const storeAvailability = ref<StoreStock[]>([]);
const storeAvailabilityLoading = ref(false);
const API_URL = import.meta.env.VITE_API_URL;

const fetchStoreAvailability = async () => {
  if (!product.value) return;
  storeAvailabilityLoading.value = true;
  try {
    const res = await fetch(`${API_URL}/products/${product.value.id}/stores`);
    const json = await res.json();
    storeAvailability.value = json.data ?? [];
  } catch {
    storeAvailability.value = [];
  } finally {
    storeAvailabilityLoading.value = false;
  }
};

// ─── Real-time stock subscription ────────────────────────────────────────
let stockChannel: ReturnType<typeof supabase.channel> | null = null;

const subscribeToStock = (productId: string) => {
  stockChannel = supabase
    .channel(`product-stock-${productId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${productId}` },
      (payload) => {
        if (product.value) {
          const updated = payload.new as Tables<'products'>;
          const newQty = updated.quantity ?? product.value.quantity;
          const newInStock = updated.in_stock ?? product.value.in_stock;
          product.value = { ...product.value, quantity: newQty, in_stock: newInStock };
          // Clamp selected quantity to new available stock
          if (newQty != null && quantity.value > newQty) {
            quantity.value = Math.max(1, newQty);
          }
        }
      }
    )
    .subscribe();
};

onUnmounted(() => {
  if (stockChannel) supabase.removeChannel(stockChannel);
});
</script>

<template>
  <div class="product-page">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" message="Loading product..." size="48px" padding="80px" />
    <div v-else-if="!product" style="text-align: center; padding: 80px">
      Product not found.
    </div>
    <template v-else>
      <!-- Breadcrumb -->
      <div class="container">
        <div class="breadcrumb">
          <router-link to="/">Home</router-link>
          <span>›</span>
          <a href="#">{{ categoryName }}</a>
          <span>›</span>
          <strong>{{ product.name }}</strong>
        </div>
      </div>

      <!-- Product Section -->
      <div class="product-section">
        <div class="container">
          <div class="product-grid">
            <!-- Product Image -->
            <div>
              <div class="product-image-section">
                <div v-if="product.badge" class="product-badge">
                  {{ product.badge }}
                </div>
                <div class="product-main-image">{{ displayImage }}</div>
              </div>
              <div class="image-thumbnails">
                <div class="thumbnail active">{{ displayImage }}</div>
                <div class="thumbnail">{{ displayImage }}</div>
                <div class="thumbnail">{{ displayImage }}</div>
              </div>
            </div>

            <!-- Product Info -->
            <div class="product-info">
              <div class="product-category">{{ categoryName }}</div>
              <h1 class="product-title">{{ product.name }}</h1>

              <div class="product-price">
                ${{ product.price?.toFixed(2) }}
                <span v-if="product.weight" class="price-unit">/ {{ product.weight }}</span>
              </div>

              <div class="product-description">
                {{ product.description }}
              </div>

              <!-- Purchase Box -->
              <div class="purchase-box">
                <!-- Real-time stock badge -->
                <div class="stock-status" :style="product.in_stock === false || (product.quantity != null && product.quantity === 0)
                  ? 'color:#c0392b; background:#fdecea; border-radius:4px; padding:4px 10px; font-weight:700;'
                  : 'color:#27ae60; background:#eafaf1; border-radius:4px; padding:4px 10px; font-weight:700;'
                ">
                  {{ product.in_stock === false || (product.quantity != null && product.quantity === 0)
                    ? '✗ Out of Stock'
                    : product.quantity != null && product.quantity <= 10
                      ? `Low Stock — only ${product.quantity} left`
                      : '✓ In Stock'
                  }}
                </div>

                <div v-if="product.in_stock !== false && (product.quantity == null || product.quantity > 0)" class="quantity-selector">
                  <label class="quantity-label">Quantity:</label>
                  <div class="quantity-control">
                    <button class="qty-btn minus" @click="updateQuantity(-1)">
                      −
                    </button>
                    <div class="qty-display">{{ quantity }}</div>
                    <button class="qty-btn plus"
                      :disabled="product.quantity != null && quantity >= product.quantity"
                      @click="updateQuantity(1)">
                      +
                    </button>
                  </div>
                </div>

                <button class="add-to-cart-btn" :class="{ added: addedToCart }"
                  :disabled="product.in_stock === false || (product.quantity != null && product.quantity === 0)"
                  @click="handleAddToCart">
                  {{ addedToCart ? "✓ Added to Cart!" : "🛒 Add to Cart" }}
                </button>
                <button class="buy-now-btn"
                  :disabled="product.in_stock === false || (product.quantity != null && product.quantity === 0)"
                  @click="buyNow">⚡ Buy Now</button>
              </div>
            </div>
          </div>

          <!-- Product Details Tabs -->
          <div class="product-details-section">
            <div class="tabs">
              <div class="tab" :class="{ active: activeTab === 'description' }" @click="switchTab('description')">
                Description
              </div>
              <div class="tab" :class="{ active: activeTab === 'nutrition' }" @click="switchTab('nutrition')">
                Nutrition
              </div>
              <div class="tab" :class="{ active: activeTab === 'storage' }" @click="switchTab('storage')">
                Storage
              </div>
              <div class="tab" :class="{ active: activeTab === 'reviews' }" @click="switchTab('reviews')">
                Reviews
              </div>
              <div class="tab" :class="{ active: activeTab === 'stores' }" @click="switchTab('stores')">
                Store Availability
              </div>
            </div>

            <div class="tab-content" :class="{ active: activeTab === 'description' }">
              <h3>About This Product</h3>
              <p v-if="product?.description" style="white-space: pre-line;">{{ product.description }}</p>
              <p v-else style="color:#999;">No description available.</p>
            </div>

            <div class="tab-content" :class="{ active: activeTab === 'nutrition' }">
              <h3>Nutritional Information</h3>
              <template v-if="nutritionRows.length">
                <table class="nutrition-table">
                  <tbody>
                    <tr v-for="row in nutritionRows" :key="row.label">
                      <td>{{ row.label }}</td>
                      <td>{{ row.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
              <p v-else style="color:#999;">No nutritional information available.</p>
            </div>

            <div class="tab-content" :class="{ active: activeTab === 'storage' }">
              <h3>Storage Instructions</h3>
              <p v-if="product?.storage" style="white-space: pre-line;">{{ product.storage }}</p>
              <p v-else style="color:#999;">No storage instructions available.</p>
            </div>

            <div class="tab-content" :class="{ active: activeTab === 'reviews' }">
              <ProductReviews v-if="product" :product-id="product.id" />
            </div>

            <div class="tab-content" :class="{ active: activeTab === 'stores' }">
              <h3>Store Availability</h3>
              <p style="color:#999; font-size:14px; margin-bottom:16px;">Check which of our stores currently has this product in stock.</p>
              <div v-if="storeAvailabilityLoading" style="color:#999; padding:16px 0;">Loading stores…</div>
              <div v-else-if="storeAvailability.length === 0" style="color:#999;">No store data available yet.</div>
              <table v-else style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                  <tr style="border-bottom:2px solid #eee;">
                    <th style="text-align:left; padding:8px 12px; font-weight:700;">Store</th>
                    <th style="text-align:left; padding:8px 12px; font-weight:700;">Address</th>
                    <th style="text-align:left; padding:8px 12px; font-weight:700;">Phone</th>
                    <th style="text-align:center; padding:8px 12px; font-weight:700;">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in storeAvailability" :key="s.id" style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:10px 12px; font-weight:600;">{{ s.name }}</td>
                    <td style="padding:10px 12px; color:#555;">{{ s.address }}</td>
                    <td style="padding:10px 12px; color:#555;">{{ s.phone || '—' }}</td>
                    <td style="padding:10px 12px; text-align:center;">
                      <span :style="`display:inline-block; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:700; background:${s.in_stock ? '#d4edda' : '#f8d7da'}; color:${s.in_stock ? '#155724' : '#721c24'};`">
                        {{ s.in_stock ? `✓ In Stock${s.quantity > 0 ? ' (' + s.quantity + ')' : ''}` : '✗ Out of Stock' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Related Products -->
          <div class="related-products">
            <h2 class="section-title">You May Also Like</h2>
            <div class="products-grid">
              <router-link v-for="rel in relatedProducts" :key="rel.id" :to="`/product/${rel.id}`" class="product-card">
                <div class="product-card-image">
                  {{ rel.image_url || "🛒" }}
                </div>
                <div class="product-card-info">
                  <div class="product-card-title">{{ rel.name }}</div>
                  <div class="product-card-price">
                    ${{ rel.price?.toFixed(2) }}
                  </div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.product-page {
  min-height: 100vh;
}

.header-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

/* Product Section */
.product-section {
  padding: 40px 0;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
}

/* Product Image */
.product-image-section {
  background: white;
  border: 3px solid var(--stroke);
  padding: 60px;
  text-align: center;
  position: relative;
}

.product-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: var(--tertiary);
  color: var(--headline);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  border: 3px solid var(--stroke);
}

.product-main-image {
  font-size: 200px;
  margin-bottom: 30px;
}

.image-thumbnails {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border: 3px solid var(--stroke);
  background: var(--bg);
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.thumbnail:hover,
.thumbnail.active {
  background: var(--main);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-category {
  font-size: 14px;
  font-weight: 700;
  color: var(--button);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.product-title {
  font-size: 42px;
  font-weight: 700;
  color: var(--headline);
  line-height: 1.2;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stars {
  color: #ffd700;
  font-size: 20px;
}

.rating-text {
  font-size: 14px;
  color: var(--paragraph);
}

.product-price {
  font-size: 48px;
  font-weight: 700;
  color: var(--headline);
}

.price-unit {
  font-size: 18px;
  color: var(--paragraph);
  opacity: 0.7;
}

.product-description {
  font-size: 16px;
  color: var(--paragraph);
  line-height: 1.8;
  padding: 20px;
  background: var(--main);
  border: 3px solid var(--stroke);
}

.product-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border: 2px solid var(--stroke);
  font-size: 14px;
  font-weight: 600;
}

.feature-icon {
  font-size: 20px;
}

/* Purchase Section */
.purchase-box {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
}

.stock-status {
  display: inline-block;
  padding: 8px 16px;
  background: #d4edda;
  border: 2px solid #28a745;
  color: #155724;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 20px;
}

.quantity-selector {
  margin-bottom: 20px;
}

.quantity-label {
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
  display: block;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  border: 3px solid var(--stroke);
}

.qty-btn {
  width: 50px;
  height: 50px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 24px;
  font-weight: 700;
  transition: background 0.2s;
}

.qty-btn:hover {
  background: var(--secondary);
}

.qty-btn.minus {
  border-right: 3px solid var(--stroke);
}

.qty-btn.plus {
  border-left: 3px solid var(--stroke);
}

.qty-display {
  width: 80px;
  text-align: center;
  font-weight: 700;
  font-size: 20px;
  color: var(--headline);
}

.add-to-cart-btn {
  width: 100%;
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 18px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.add-to-cart-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.add-to-cart-btn.added {
  background: #8bd3dd;
}

.buy-now-btn {
  width: 100%;
  background: var(--headline);
  color: white;
  border: 3px solid var(--stroke);
  padding: 18px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-now-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

/* Product Details Tabs */
.product-details-section {
  margin-top: 60px;
  background: white;
  border: 3px solid var(--stroke);
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 3px solid var(--stroke);
}

.tab {
  padding: 20px 32px;
  background: var(--bg);
  border-right: 3px solid var(--stroke);
  cursor: pointer;
  font-weight: 600;
  color: var(--paragraph);
  transition: all 0.2s;
}

.tab:hover {
  background: var(--main);
}

.tab.active {
  background: white;
  font-weight: 700;
  color: var(--headline);
}

.tab-content {
  padding: 32px;
  display: none;
}

.tab-content.active {
  display: block;
}

.tab-content h3 {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 16px;
}

.tab-content p {
  font-size: 16px;
  color: var(--paragraph);
  line-height: 1.8;
  margin-bottom: 16px;
}

.nutrition-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.nutrition-table tr {
  border-bottom: 2px solid var(--stroke);
}

.nutrition-table td {
  padding: 12px;
}

.nutrition-table td:first-child {
  font-weight: 600;
  color: var(--headline);
}

/* Related Products */
.related-products {
  margin-top: 60px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 30px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

.product-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 0;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0 var(--stroke);
}

.product-card-image {
  background: var(--bg);
  padding: 40px;
  text-align: center;
  font-size: 80px;
  border-bottom: 3px solid var(--stroke);
}

.product-card-info {
  padding: 20px;
}

.product-card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.product-card-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
}

/* Responsive */
@media (max-width: 968px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .product-title {
    font-size: 32px;
  }

  .product-features {
    grid-template-columns: 1fr;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 640px) {
  .product-main-image {
    font-size: 120px;
  }

  .product-price {
    font-size: 36px;
  }
}
</style>
