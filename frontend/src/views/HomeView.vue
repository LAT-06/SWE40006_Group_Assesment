<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";
import { useProductStore, type Product } from "@/stores/products";
import ProductCard from "@/components/ProductCard.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import EmptyState from "@/components/ui/EmptyState.vue";

const router = useRouter();
const cartStore = useCartStore();
const productStore = useProductStore();

onMounted(() => {
  productStore.fetchProducts();
});

const addToCart = (product: Product) => {
  cartStore.addItem({
    productId: product.id,
    name: product.name,
    price: product.price,
    size: product.weight ?? "",
    icon: product.image_url ?? "",
    quantity: 1,
  });
};
</script>

<template>
  <div class="home-page">
    <div class="grocery-platform">

      <!-- Navigation -->
      <nav>
        <div class="container">
          <div class="nav-content">
            <router-link to="/category" class="nav-item active">All Categories</router-link>
            <router-link to="/category/fresh-produce" class="nav-item">Fresh Produce</router-link>
            <router-link to="/category/meat-seafood" class="nav-item">Meat & Seafood</router-link>
            <router-link to="/category/dairy-eggs" class="nav-item">Dairy & Eggs</router-link>
            <router-link to="/category/bakery" class="nav-item">Bakery</router-link>
            <router-link to="/category/pantry-staples" class="nav-item">Pantry</router-link>
            <router-link to="/category/snacks" class="nav-item">Snacks</router-link>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <h1>Fresh groceries delivered to your door</h1>
              <p>
                Shop from thousands of products with same-day delivery. No
                minimum order required.
              </p>
              <a href="#products" class="hero-btn">Start Shopping</a>
            </div>
            <div class="hero-image">
              <div class="hero-product">
                <div class="product-icon">🥑</div>
                <div class="product-name">Fresh Avocados</div>
              </div>
              <div class="hero-product">
                <div class="product-icon">🥖</div>
                <div class="product-name">Artisan Bread</div>
              </div>
              <div class="hero-product">
                <div class="product-icon">🥛</div>
                <div class="product-name">Organic Milk</div>
              </div>
              <div class="hero-product">
                <div class="product-icon">🍓</div>
                <div class="product-name">Fresh Berries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="categories">
        <div class="container">
          <div class="section-header">
            <h2>Shop by Category</h2>
            <router-link to="/category" class="view-all">View all →</router-link>
          </div>
          <div class="category-grid">
            <router-link to="/category/fresh-produce" class="category-card">
              <div class="category-icon">🥬</div>
              <div class="category-name">Fresh Produce</div>
              <div class="category-count">Items</div>
            </router-link>
            <router-link to="/category/meat-seafood" class="category-card">
              <div class="category-icon">🥩</div>
              <div class="category-name">Meat & Seafood</div>
              <div class="category-count">Items</div>
            </router-link>
            <router-link to="/category/dairy-eggs" class="category-card">
              <div class="category-icon">🧀</div>
              <div class="category-name">Dairy & Eggs</div>
              <div class="category-count">Items</div>
            </router-link>
            <router-link to="/category/bakery" class="category-card">
              <div class="category-icon">🍞</div>
              <div class="category-name">Bakery</div>
              <div class="category-count">Items</div>
            </router-link>
            <router-link to="/category/pantry-staples" class="category-card">
              <div class="category-icon">🥫</div>
              <div class="category-name">Pantry Staples</div>
              <div class="category-count">Items</div>
            </router-link>
            <router-link to="/category/snacks" class="category-card">
              <div class="category-icon">🍪</div>
              <div class="category-name">Snacks</div>
              <div class="category-count">Items</div>
            </router-link>
          </div>
        </div>
      </section>

      <!-- Products -->
      <section id="products" class="products">
        <div class="container">
          <div class="section-header">
            <h2>Today's Best Deals</h2>
            <router-link to="/category" class="view-all">View all →</router-link>
          </div>

          <LoadingSpinner v-if="productStore.loading" message="Loading products..." />

          <div v-else-if="productStore.error" class="error-state" style="text-align: center; padding: 40px">
            <p>Failed to load products. <a href="#" @click.prevent="productStore.fetchProducts()">Try again</a></p>
          </div>

          <EmptyState v-else-if="productStore.featuredProducts.length === 0" icon="🛒" message="No products available yet." />

          <div v-else class="product-grid">
            <ProductCard
              v-for="product in productStore.featuredProducts"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
              @click="router.push(`/product/${product.id}`)"
            />
          </div>
        </div>
      </section>

      <!-- Services -->
      <section class="services">
        <div class="container">
          <div class="section-header">
            <h2>Why Choose Deployma</h2>
          </div>
          <div class="service-grid">
            <div class="service-card">
              <div class="service-icon">🚚</div>
              <div class="service-title">Fast Delivery</div>
              <div class="service-text">
                Same-day delivery available for orders placed before 2 PM
              </div>
            </div>
            <div class="service-card">
              <div class="service-icon">✨</div>
              <div class="service-title">Fresh Quality</div>
              <div class="service-text">
                Hand-picked products with 100% freshness guarantee
              </div>
            </div>
            <div class="service-card">
              <div class="service-icon">💰</div>
              <div class="service-title">Best Prices</div>
              <div class="service-text">
                Competitive pricing with weekly deals and promotions
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer Links -->
      <section class="home-footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>About Deployma</h3>
              <ul class="footer-links">
                <li><router-link to="/about">About Us</router-link></li>
                <li><router-link to="/careers">Careers</router-link></li>
                <li><a href="https://co-opmart.com.vn/tin-tuc-su-kien#">Press</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Customer Service</h3>
              <ul class="footer-links">
                <li><router-link to="/help">Help Center</router-link></li>
                <li><router-link to="/order-tracking">Track Order</router-link></li>
                <li><router-link to="/returns">Returns Policy</router-link></li>
                <li><router-link to="/contact">Contact Us</router-link></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Categories</h3>
              <ul class="footer-links">
                <li><router-link to="/category/fresh-produce">Fresh Produce</router-link></li>
                <li><router-link to="/category/meat-seafood">Meat &amp; Seafood</router-link></li>
                <li><router-link to="/category/dairy-eggs">Dairy &amp; Eggs</router-link></li>
                <li><router-link to="/category/pantry-staples">Pantry</router-link></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Connect</h3>
              <ul class="footer-links">
                <li><a href="https://www.facebook.com/hethongcoopmartvn">Facebook</a></li>
                <li><a href="https://www.instagram.com/sieuthicoopmart/">Instagram</a></li>
                <li><a href="https://www.tiktok.com/@co.opmart.official">Tiktok</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
/* Import Google Fonts */
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.home-page {
  width: 100%;
  min-height: 100vh;
}

.home-page .grocery-platform {
  width: 100%;
}

.home-page .container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Navigation */
.home-page nav {
  background: white;
  border-bottom: 3px solid var(--stroke);
  padding: 0;
}

.home-page .nav-content {
  display: flex;
  gap: 0;
  overflow-x: auto;
}

.home-page .nav-content::-webkit-scrollbar {
  height: 0;
}

.home-page .nav-item {
  padding: 16px 24px;
  border-right: 3px solid var(--stroke);
  text-decoration: none;
  color: var(--headline);
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.2s;
  background: white;
}

.home-page .nav-item:hover {
  background: var(--main);
}

.home-page .nav-item.active {
  background: var(--button);
  color: var(--button-text);
  font-weight: 700;
}

/* Hero Section */
.home-page .hero {
  padding: 60px 0;
  background: linear-gradient(135deg, var(--main) 0%, var(--secondary) 100%);
  border-bottom: 3px solid var(--stroke);
  position: relative;
  overflow: hidden;
}

.home-page .hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.home-page .hero-text h1 {
  font-size: 56px;
  color: var(--headline);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 24px;
}

.home-page .hero-text p {
  font-size: 20px;
  color: var(--paragraph);
  margin-bottom: 32px;
}

.home-page .hero-btn {
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-block;
  text-decoration: none;
}

.home-page .hero-btn:hover {
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0 var(--stroke);
}

.home-page .hero-image {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.home-page .hero-product {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
}

.home-page .hero-product:hover {
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0 var(--stroke);
}

.product-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.product-name {
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 4px;
}

/* Categories */
.home-page .categories {
  padding: 60px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.category-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
}

.category-card:hover {
  background: var(--main);
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.category-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.category-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.category-count {
  font-size: 14px;
  color: var(--paragraph);
}

/* Products */
.home-page .products {
  padding: 60px 0;
  background: white;
  border-top: 3px solid var(--stroke);
  border-bottom: 3px solid var(--stroke);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* Services */
.home-page .services {
  padding: 60px 0;
  background: var(--secondary);
  border-bottom: 3px solid var(--stroke);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.service-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 32px;
  text-align: center;
}

.service-icon {
  font-size: 56px;
  margin-bottom: 20px;
}

.service-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

.service-text {
  font-size: 16px;
  color: var(--paragraph);
}

/* Home Footer Links */
.home-footer {
  background: var(--headline);
  color: white;
  padding: 60px 0 40px;
}

.home-page .footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.footer-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.footer-links a:hover {
  opacity: 1;
}

/* Responsive */
@media (max-width: 968px) {
  .hero-content {
    grid-template-columns: 1fr;
  }

  .hero-text h1 {
    font-size: 42px;
  }

  .header-content {
    flex-wrap: wrap;
  }

  .search-bar {
    order: 3;
    flex-basis: 100%;
  }

  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 640px) {
  .hero-text h1 {
    font-size: 32px;
  }

  .hero-image {
    grid-template-columns: 1fr;
  }

  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
