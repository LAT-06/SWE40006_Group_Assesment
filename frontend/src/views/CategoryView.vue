<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "@/stores/cart";

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

// View state
const viewMode = ref<"grid" | "list">("grid");
const sortBy = ref("featured");
const searchQuery = ref("");

// Filter state
interface Filters {
  categories: string[];
  priceMin: number | null;
  priceMax: number | null;
  brands: string[];
  dietary: string[];
  inStock: boolean;
  onSale: boolean;
}

const filters = ref<Filters>({
  categories: ["fruits"],
  priceMin: null,
  priceMax: null,
  brands: [],
  dietary: [],
  inStock: true,
  onSale: false,
});

// Mock products data
interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  weight: string;
  emoji: string;
  badge?: string;
  inStock: boolean;
  dietary: string[];
}

const allProducts = ref<Product[]>([
  {
    id: "1",
    name: "Organic Avocado",
    category: "fruits",
    brand: "organic",
    price: 5.99,
    originalPrice: 7.49,
    weight: "4 pack",
    emoji: "🥑",
    badge: "20% OFF",
    inStock: true,
    dietary: ["organic-cert", "non-gmo"],
  },
  {
    id: "2",
    name: "Fresh Strawberries",
    category: "fruits",
    brand: "fresh",
    price: 4.49,
    weight: "1 lb",
    emoji: "🍓",
    inStock: true,
    dietary: ["local-grown"],
  },
  {
    id: "3",
    name: "Heirloom Tomatoes",
    category: "vegetables",
    brand: "local",
    price: 5.49,
    weight: "1 lb",
    emoji: "🍅",
    inStock: true,
    dietary: ["organic-cert", "local-grown"],
  },
  {
    id: "4",
    name: "Organic Spinach",
    category: "vegetables",
    brand: "organic",
    price: 3.99,
    weight: "1 bunch",
    emoji: "🥬",
    badge: "NEW",
    inStock: true,
    dietary: ["organic-cert", "non-gmo"],
  },
  {
    id: "5",
    name: "English Cucumber",
    category: "vegetables",
    brand: "fresh",
    price: 2.99,
    weight: "Each",
    emoji: "🥒",
    inStock: true,
    dietary: [],
  },
  {
    id: "6",
    name: "Navel Oranges",
    category: "fruits",
    brand: "fresh",
    price: 6.99,
    originalPrice: 8.19,
    weight: "3 lb bag",
    emoji: "🍊",
    badge: "15% OFF",
    inStock: true,
    dietary: ["non-gmo"],
  },
  {
    id: "7",
    name: "Organic Carrots",
    category: "vegetables",
    brand: "organic",
    price: 3.49,
    weight: "2 lb bag",
    emoji: "🥕",
    inStock: true,
    dietary: ["organic-cert", "non-gmo", "local-grown"],
  },
  {
    id: "8",
    name: "Fresh Lemons",
    category: "fruits",
    brand: "local",
    price: 4.99,
    weight: "1 lb bag",
    emoji: "🍋",
    inStock: true,
    dietary: ["local-grown"],
  },
  {
    id: "9",
    name: "Baby Kale",
    category: "salads",
    brand: "organic",
    price: 4.49,
    weight: "5 oz",
    emoji: "🥗",
    inStock: true,
    dietary: ["organic-cert", "non-gmo"],
  },
  {
    id: "10",
    name: "Fresh Basil",
    category: "herbs",
    brand: "fresh",
    price: 2.99,
    weight: "1 bunch",
    emoji: "🌿",
    inStock: true,
    dietary: ["organic-cert"],
  },
  {
    id: "11",
    name: "Red Bell Peppers",
    category: "vegetables",
    brand: "fresh",
    price: 5.99,
    weight: "3 pack",
    emoji: "🫑",
    inStock: true,
    dietary: [],
  },
  {
    id: "12",
    name: "Fresh Blueberries",
    category: "fruits",
    brand: "organic",
    price: 6.49,
    weight: "1 pint",
    emoji: "🫐",
    inStock: true,
    dietary: ["organic-cert", "non-gmo"],
  },
]);

// Filtered and sorted products
const filteredProducts = computed(() => {
  let products = allProducts.value;

  // Filter by search query
  if (searchQuery.value) {
    products = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
  }

  // Filter by categories
  if (filters.value.categories.length > 0) {
    products = products.filter((p) =>
      filters.value.categories.includes(p.category),
    );
  }

  // Filter by brands
  if (filters.value.brands.length > 0) {
    products = products.filter((p) => filters.value.brands.includes(p.brand));
  }

  // Filter by dietary
  if (filters.value.dietary.length > 0) {
    products = products.filter((p) =>
      filters.value.dietary.some((d) => p.dietary.includes(d)),
    );
  }

  // Filter by price range
  if (filters.value.priceMin !== null) {
    products = products.filter((p) => p.price >= filters.value.priceMin!);
  }
  if (filters.value.priceMax !== null) {
    products = products.filter((p) => p.price <= filters.value.priceMax!);
  }

  // Filter by stock
  if (filters.value.inStock) {
    products = products.filter((p) => p.inStock);
  }

  // Filter by sale
  if (filters.value.onSale) {
    products = products.filter((p) => p.originalPrice !== undefined);
  }

  // Sort products
  switch (sortBy.value) {
    case "price-low":
      products = [...products].sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      products = [...products].sort((a, b) => b.price - a.price);
      break;
    case "name-az":
      products = [...products].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
      products = [...products].reverse();
      break;
  }

  return products;
});

// Active filter tags
const activeFilterTags = computed(() => {
  const tags: Array<{ key: string; label: string; value: any }> = [];

  filters.value.categories.forEach((cat) => {
    tags.push({
      key: "category",
      label: categoryLabels[cat] || cat,
      value: cat,
    });
  });

  filters.value.brands.forEach((brand) => {
    tags.push({
      key: "brand",
      label: brandLabels[brand] || brand,
      value: brand,
    });
  });

  filters.value.dietary.forEach((diet) => {
    tags.push({
      key: "dietary",
      label: dietaryLabels[diet] || diet,
      value: diet,
    });
  });

  if (filters.value.inStock) {
    tags.push({ key: "inStock", label: "In Stock", value: true });
  }

  if (filters.value.onSale) {
    tags.push({ key: "onSale", label: "On Sale", value: true });
  }

  return tags;
});

// Labels for filters
const categoryLabels: Record<string, string> = {
  fruits: "Fruits",
  vegetables: "Vegetables",
  herbs: "Herbs",
  salads: "Salads",
};

const brandLabels: Record<string, string> = {
  organic: "Organic Valley",
  fresh: "Fresh Farms",
  local: "Local Harvest",
};

const dietaryLabels: Record<string, string> = {
  "organic-cert": "Organic Certified",
  "non-gmo": "Non-GMO",
  "local-grown": "Locally Grown",
};

// Filter counts
const filterCounts = computed(
  (): Record<string, number> => ({
    fruits: allProducts.value.filter((p) => p.category === "fruits").length,
    vegetables: allProducts.value.filter((p) => p.category === "vegetables")
      .length,
    herbs: allProducts.value.filter((p) => p.category === "herbs").length,
    salads: allProducts.value.filter((p) => p.category === "salads").length,
    organic: allProducts.value.filter((p) => p.brand === "organic").length,
    fresh: allProducts.value.filter((p) => p.brand === "fresh").length,
    local: allProducts.value.filter((p) => p.brand === "local").length,
    "organic-cert": allProducts.value.filter((p) =>
      p.dietary.includes("organic-cert"),
    ).length,
    "non-gmo": allProducts.value.filter((p) => p.dietary.includes("non-gmo"))
      .length,
    "local-grown": allProducts.value.filter((p) =>
      p.dietary.includes("local-grown"),
    ).length,
  }),
);

// Methods
const toggleView = (mode: "grid" | "list") => {
  viewMode.value = mode;
};

const toggleFilter = (type: keyof Filters, value: string) => {
  const filterArray = filters.value[type] as string[];
  const index = filterArray.indexOf(value);

  if (index > -1) {
    filterArray.splice(index, 1);
  } else {
    filterArray.push(value);
  }
};

const toggleBooleanFilter = (type: "inStock" | "onSale") => {
  filters.value[type] = !filters.value[type];
};

const removeFilter = (key: string, value: any) => {
  if (key === "category") {
    const index = filters.value.categories.indexOf(value);
    if (index > -1) filters.value.categories.splice(index, 1);
  } else if (key === "brand") {
    const index = filters.value.brands.indexOf(value);
    if (index > -1) filters.value.brands.splice(index, 1);
  } else if (key === "dietary") {
    const index = filters.value.dietary.indexOf(value);
    if (index > -1) filters.value.dietary.splice(index, 1);
  } else if (key === "inStock") {
    filters.value.inStock = false;
  } else if (key === "onSale") {
    filters.value.onSale = false;
  }
};

const clearAllFilters = () => {
  filters.value = {
    categories: [],
    priceMin: null,
    priceMax: null,
    brands: [],
    dietary: [],
    inStock: false,
    onSale: false,
  };
};

const addToCart = (product: Product) => {
  cartStore.addItem({
    name: product.name,
    size: product.weight,
    price: product.price,
    quantity: 1,
    icon: product.emoji,
  });
};

const goToProduct = (productId: string) => {
  router.push(`/product/${productId}`);
};

const goToCart = () => {
  router.push("/cart");
};
</script>

<template>
  <div class="category-page">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <router-link to="/" class="logo">FreshCart</router-link>
          <div class="search-bar">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search for products..."
              class="search-input"
            />
          </div>
          <button class="cart-btn" @click="goToCart">
            Cart
            <span v-if="cartStore.totalItems > 0" class="cart-count">{{
              cartStore.totalItems
            }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Breadcrumb -->
    <div class="container">
      <div class="breadcrumb">
        <router-link to="/">Home</router-link>
        <span>›</span>
        <strong>Fresh Produce</strong>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container">
        <div class="content-layout">
          <!-- Filters Sidebar -->
          <aside class="filters-sidebar">
            <div class="filters-header">
              <div class="filters-title">
                <span>Filters</span>
                <span class="clear-filters" @click="clearAllFilters"
                  >Clear All</span
                >
              </div>
            </div>

            <!-- Category Filter -->
            <div class="filter-group">
              <div class="filter-group-title">Category</div>
              <div
                v-for="cat in ['fruits', 'vegetables', 'herbs', 'salads']"
                :key="cat"
                class="filter-option"
              >
                <input
                  :id="cat"
                  type="checkbox"
                  :checked="filters.categories.includes(cat)"
                  @change="toggleFilter('categories', cat)"
                />
                <label :for="cat">{{ categoryLabels[cat] }}</label>
                <span class="filter-count">({{ filterCounts[cat] }})</span>
              </div>
            </div>

            <!-- Price Filter -->
            <div class="filter-group">
              <div class="filter-group-title">Price Range</div>
              <div class="price-range">
                <input
                  v-model.number="filters.priceMin"
                  type="number"
                  class="price-input"
                  placeholder="Min"
                  min="0"
                />
                <span>-</span>
                <input
                  v-model.number="filters.priceMax"
                  type="number"
                  class="price-input"
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>

            <!-- Brand Filter -->
            <div class="filter-group">
              <div class="filter-group-title">Brand</div>
              <div
                v-for="brand in ['organic', 'fresh', 'local']"
                :key="brand"
                class="filter-option"
              >
                <input
                  :id="brand"
                  type="checkbox"
                  :checked="filters.brands.includes(brand)"
                  @change="toggleFilter('brands', brand)"
                />
                <label :for="brand">{{ brandLabels[brand] }}</label>
                <span class="filter-count">({{ filterCounts[brand] }})</span>
              </div>
            </div>

            <!-- Dietary Tags -->
            <div class="filter-group">
              <div class="filter-group-title">Dietary</div>
              <div
                v-for="diet in ['organic-cert', 'non-gmo', 'local-grown']"
                :key="diet"
                class="filter-option"
              >
                <input
                  :id="diet"
                  type="checkbox"
                  :checked="filters.dietary.includes(diet)"
                  @change="toggleFilter('dietary', diet)"
                />
                <label :for="diet">{{ dietaryLabels[diet] }}</label>
                <span class="filter-count">({{ filterCounts[diet] }})</span>
              </div>
            </div>

            <!-- Availability -->
            <div class="filter-group">
              <div class="filter-group-title">Availability</div>
              <div class="filter-option">
                <input
                  id="in-stock"
                  type="checkbox"
                  :checked="filters.inStock"
                  @change="toggleBooleanFilter('inStock')"
                />
                <label for="in-stock">In Stock Only</label>
              </div>
              <div class="filter-option">
                <input
                  id="on-sale"
                  type="checkbox"
                  :checked="filters.onSale"
                  @change="toggleBooleanFilter('onSale')"
                />
                <label for="on-sale">On Sale</label>
              </div>
            </div>
          </aside>

          <!-- Products Area -->
          <div class="products-area">
            <!-- Products Header -->
            <div class="products-header">
              <div class="category-info">
                <h1>Fresh Produce</h1>
                <p class="results-count">
                  Showing <span>{{ filteredProducts.length }}</span> products
                </p>
              </div>
              <div class="products-controls">
                <div class="view-toggle">
                  <button
                    class="view-btn"
                    :class="{ active: viewMode === 'grid' }"
                    @click="toggleView('grid')"
                  >
                    ⊞
                  </button>
                  <button
                    class="view-btn"
                    :class="{ active: viewMode === 'list' }"
                    @click="toggleView('list')"
                  >
                    ☰
                  </button>
                </div>
                <select v-model="sortBy" class="sort-select">
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A to Z</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            <!-- Active Filters -->
            <div v-if="activeFilterTags.length > 0" class="active-filters show">
              <span style="font-weight: 700; font-size: 14px"
                >Active Filters:</span
              >
              <span
                v-for="tag in activeFilterTags"
                :key="`${tag.key}-${tag.value}`"
                class="filter-tag"
              >
                {{ tag.label }}
                <span
                  class="remove-filter"
                  @click="removeFilter(tag.key, tag.value)"
                  >×</span
                >
              </span>
            </div>

            <!-- Products Grid -->
            <div class="products-container">
              <div
                class="products-grid"
                :class="{ 'list-view': viewMode === 'list' }"
              >
                <div
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="product-card"
                >
                  <div v-if="product.badge" class="product-badge">
                    {{ product.badge }}
                  </div>
                  <div class="product-image" @click="goToProduct(product.id)">
                    {{ product.emoji }}
                  </div>
                  <div class="product-info">
                    <div class="product-title" @click="goToProduct(product.id)">
                      {{ product.name }}
                    </div>
                    <div class="product-weight">{{ product.weight }}</div>
                    <div class="product-footer">
                      <div class="product-price">
                        ${{ product.price.toFixed(2) }}
                      </div>
                      <button class="add-to-cart" @click="addToCart(product)">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="filteredProducts.length === 0" class="no-results">
                <p>No products found matching your filters.</p>
                <button class="clear-btn" @click="clearAllFilters">
                  Clear All Filters
                </button>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="filteredProducts.length > 0" class="pagination">
              <button class="page-btn">‹</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">2</button>
              <button class="page-btn">3</button>
              <button class="page-btn">4</button>
              <button class="page-btn">›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-page {
  min-height: 100vh;
  background: #fef6e4;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: #fef6e4;
  border-bottom: 3px solid #001858;
  padding: 20px 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.logo {
  font-family: "Space Mono", monospace;
  font-size: 28px;
  font-weight: 700;
  color: #001858;
  text-decoration: none;
}

.search-bar {
  flex: 1;
  max-width: 600px;
}

.search-input {
  width: 100%;
  padding: 14px 20px;
  border: 3px solid #001858;
  font-size: 16px;
  font-family: "DM Sans", sans-serif;
  background: white;
  outline: none;
}

.cart-btn {
  background: #f582ae;
  color: #001858;
  border: 3px solid #001858;
  padding: 10px 24px;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  transition: all 0.2s;
  position: relative;
}

.cart-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #001858;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #001858;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

/* Breadcrumb */
.breadcrumb {
  padding: 20px 0;
  font-size: 14px;
}

.breadcrumb a {
  color: #172c66;
  text-decoration: none;
  opacity: 0.7;
}

.breadcrumb a:hover {
  opacity: 1;
}

.breadcrumb span {
  margin: 0 8px;
  opacity: 0.5;
}

/* Main Layout */
.main-content {
  padding: 40px 0;
}

.content-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
}

/* Sidebar Filters */
.filters-sidebar {
  background: white;
  border: 3px solid #001858;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.filters-header {
  padding: 20px;
  border-bottom: 3px solid #001858;
  background: #f3d2c1;
}

.filters-title {
  font-size: 20px;
  font-weight: 700;
  color: #001858;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-filters {
  font-size: 12px;
  color: #f582ae;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
}

.filter-group {
  padding: 20px;
  border-bottom: 2px solid #001858;
}

.filter-group:last-child {
  border-bottom: none;
}

.filter-group-title {
  font-size: 16px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  cursor: pointer;
}

.filter-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border: 3px solid #001858;
  cursor: pointer;
}

.filter-option label {
  font-size: 14px;
  cursor: pointer;
  flex: 1;
  color: #001858;
  font-weight: 500;
}

.filter-count {
  font-size: 12px;
  color: #172c66;
  opacity: 0.7;
  font-weight: 600;
}

.price-range {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}

.price-range span {
  color: #001858;
  font-weight: 600;
  flex-shrink: 0;
}

.price-input {
  flex: 1;
  min-width: 0;
  padding: 8px;
  border: 2px solid #001858;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #001858;
}

/* Products Area */
.products-area {
  background: white;
  border: 3px solid #001858;
}

.products-header {
  padding: 20px 24px;
  border-bottom: 3px solid #001858;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.category-info h1 {
  font-size: 28px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 4px;
}

.results-count {
  font-size: 14px;
  color: #172c66;
  opacity: 0.7;
}

.products-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: 0;
  border: 3px solid #001858;
}

.view-btn {
  padding: 8px 16px;
  background: white;
  border: none;
  border-right: 3px solid #001858;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
}

.view-btn:last-child {
  border-right: none;
}

.view-btn:hover,
.view-btn.active {
  background: #8bd3dd;
}

.sort-select {
  padding: 10px 16px;
  border: 3px solid #001858;
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  background: white;
}

/* Active Filters */
.active-filters {
  padding: 16px 24px;
  border-bottom: 3px solid #001858;
  background: #fef6e4;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f582ae;
  border: 2px solid #001858;
  font-size: 13px;
  font-weight: 600;
}

.remove-filter {
  cursor: pointer;
  font-weight: 700;
}

/* Products Grid */
.products-container {
  padding: 24px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

.products-grid.list-view {
  grid-template-columns: 1fr;
}

.product-card {
  background: #fef6e4;
  border: 3px solid #001858;
  padding: 0;
  transition: all 0.3s;
  position: relative;
}

.product-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0 #001858;
}

.product-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f582ae;
  color: #001858;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid #001858;
  z-index: 1;
}

.product-image {
  background: white;
  border-bottom: 3px solid #001858;
  padding: 40px;
  text-align: center;
  font-size: 80px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-info {
  padding: 20px;
}

.product-title {
  font-size: 18px;
  font-weight: 700;
  color: #001858;
  margin-bottom: 8px;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-title:hover {
  color: #f582ae;
}

.product-weight {
  font-size: 14px;
  color: #172c66;
  margin-bottom: 16px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 24px;
  font-weight: 700;
  color: #001858;
}

.add-to-cart {
  background: #f582ae;
  color: #001858;
  border: 3px solid #001858;
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  transition: all 0.2s;
}

.add-to-cart:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 #001858;
}

/* List View */
.products-grid.list-view .product-card {
  display: grid;
  grid-template-columns: 200px 1fr;
}

.products-grid.list-view .product-image {
  height: 200px;
  border-bottom: none;
  border-right: 3px solid #001858;
}

.products-grid.list-view .product-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results p {
  font-size: 18px;
  color: #172c66;
  margin-bottom: 20px;
}

.clear-btn {
  background: #f582ae;
  color: #001858;
  border: 3px solid #001858;
  padding: 12px 24px;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  transition: all 0.2s;
}

.clear-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 #001858;
}

/* Pagination */
.pagination {
  padding: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;
  border-top: 3px solid #001858;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: 3px solid #001858;
  background: white;
  cursor: pointer;
  font-weight: 700;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
}

.page-btn:hover,
.page-btn.active {
  background: #f582ae;
  color: #001858;
}

/* Responsive */
@media (max-width: 968px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
  }

  .products-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .products-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: 1fr;
  }

  .products-grid.list-view .product-card {
    grid-template-columns: 1fr;
  }

  .products-grid.list-view .product-image {
    border-right: none;
    border-bottom: 3px solid #001858;
  }

  .header-content {
    flex-wrap: wrap;
  }

  .search-bar {
    order: 3;
    max-width: 100%;
    width: 100%;
  }
}
</style>
