<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useProductStore } from "@/stores/products";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const productStore = useProductStore();

const searchQuery = ref("");

onMounted(() => {
  productStore.fetchProducts();
});

const addToCart = (product: any) => {
  cartStore.addItem({
    productId: product.id,
    name: product.name,
    price: product.price,
    size: product.weight,
    icon: product.image_url,
    quantity: 1,
  });
  console.log(`Added ${product.name} to cart`);
};

const handleSignIn = () => {
  router.push("/login");
};

const handleCart = () => {
  router.push("/cart");
};
</script>

<template>
  <div class="home-page">
    <div class="grocery-platform">
      <!-- Header -->
      <header>
        <div class="container">
          <div class="header-content">
            <router-link to="/" class="logo">Deployma</router-link>

            <div class="search-bar">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search for products, categories..."
              />
            </div>

            <div class="header-actions">
              <button
                v-if="!authStore.isAuthenticated"
                class="icon-btn"
                @click="handleSignIn"
              >
                Sign In
              </button>
              <template v-else>
                <button class="icon-btn" @click="router.push('/profile')">
                  Profile
                </button>
                <button class="icon-btn" @click="authStore.signOut">
                  Sign Out
                </button>
              </template>
              <button class="cart-btn" @click="handleCart">
                Cart
                <span class="cart-count">{{ cartStore.totalItems }}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Navigation -->
      <nav>
        <div class="container">
          <div class="nav-content">
            <router-link to="/category" class="nav-item active"
              >All Categories</router-link
            >
            <router-link to="/category/fresh-produce" class="nav-item"
              >Fresh Produce</router-link
            >
            <router-link to="/category/meat-seafood" class="nav-item"
              >Meat & Seafood</router-link
            >
            <router-link to="/category/dairy-eggs" class="nav-item"
              >Dairy & Eggs</router-link
            >
            <router-link to="/category/bakery" class="nav-item"
              >Bakery</router-link
            >
            <router-link to="/category/pantry-staples" class="nav-item"
              >Pantry</router-link
            >
            <router-link to="/category/snacks" class="nav-item"
              >Snacks</router-link
            >
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
            <router-link to="/category" class="view-all"
              >View all →</router-link
            >
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
            <router-link to="/category" class="view-all"
              >View all →</router-link
            >
          </div>

          <div
            v-if="productStore.loading"
            style="text-align: center; padding: 40px"
          >
            Loading products...
          </div>

          <div v-else class="product-grid">
            <div
              v-for="product in productStore.featuredProducts"
              :key="product.id"
              class="product-card"
              @click="router.push(`/product/${product.id}`)"
              style="cursor: pointer"
            >
              <div v-if="product.badge" class="product-badge">
                {{ product.badge }}
              </div>
              <div class="product-image">{{ product.image_url || "📦" }}</div>
              <div class="product-info">
                <div class="product-title">{{ product.name }}</div>
                <div class="product-weight">{{ product.weight }}</div>
                <div class="product-footer">
                  <div class="product-price">${{ product.price }}</div>
                  <button class="add-to-cart" @click.stop="addToCart(product)">
                    Add
                  </button>
                </div>
              </div>
            </div>
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

      <!-- Footer -->
      <footer>
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>About Deployma</h3>
              <ul class="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Customer Service</h3>
              <ul class="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Track Order</a></li>
                <li><a href="#">Returns</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Categories</h3>
              <ul class="footer-links">
                <li><a href="#">Fresh Produce</a></li>
                <li><a href="#">Meat & Seafood</a></li>
                <li><a href="#">Dairy & Eggs</a></li>
                <li><a href="#">Pantry</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Connect</h3>
              <ul class="footer-links">
                <li><a href="#">Facebook</a></li>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">Twitter</a></li>
                <li><a href="#">Newsletter</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">© 2026 Deployma. All rights reserved.</div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style>
/* Import Google Fonts */
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.home-page {
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

.home-page .grocery-platform {
  width: 100%;
  font-family: "DM Sans", sans-serif;
  background: var(--bg);
  color: var(--paragraph);
  line-height: 1.6;
}

.home-page .container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.home-page header {
  background: var(--bg);
  border-bottom: 3px solid var(--stroke);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.home-page .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.home-page .logo {
  font-family: "Space Mono", monospace;
  font-size: 28px;
  font-weight: 700;
  color: var(--headline);
  text-decoration: none;
}

.home-page .search-bar {
  flex: 1;
  max-width: 600px;
  position: relative;
}

.home-page .search-bar input {
  width: 100%;
  padding: 14px 20px;
  border: 3px solid var(--stroke);
  border-radius: 0;
  font-size: 16px;
  font-family: "DM Sans", sans-serif;
  background: white;
  outline: none;
  transition: all 0.2s;
}

.home-page .search-bar input:focus {
  border-color: var(--button);
}

.home-page .header-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.home-page .icon-btn {
  background: none;
  border: none;
  color: var(--headline);
  font-size: 14px;
  cursor: pointer;
  padding: 8px 16px;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  transition: color 0.2s;
}

.home-page .icon-btn:hover {
  color: var(--button);
}

.home-page .cart-btn {
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 10px 24px;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  transition: all 0.2s;
  position: relative;
}

.home-page .cart-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}

.home-page .cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--headline);
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
  font-family: "DM Sans", sans-serif;
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

.home-page .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.home-page .section-header h2 {
  font-size: 36px;
  color: var(--headline);
  font-weight: 700;
}

.view-all {
  color: var(--headline);
  text-decoration: none;
  font-weight: 500;
  border-bottom: 2px solid var(--button);
  padding-bottom: 2px;
  transition: color 0.2s;
}

.view-all:hover {
  color: var(--button);
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

.product-card {
  background: var(--bg);
  border: 3px solid var(--stroke);
  padding: 0;
  transition: all 0.3s;
  position: relative;
}

.product-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0 var(--stroke);
}

.product-image {
  background: white;
  border-bottom: 3px solid var(--stroke);
  padding: 40px;
  text-align: center;
  font-size: 80px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--tertiary);
  color: var(--headline);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid var(--stroke);
}

.product-info {
  padding: 20px;
}

.product-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.product-weight {
  font-size: 14px;
  color: var(--paragraph);
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
  color: var(--headline);
}

.add-to-cart {
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  transition: all 0.2s;
}

.add-to-cart:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
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

/* Footer */
.home-page footer {
  background: var(--headline);
  color: white;
  padding: 60px 0 30px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
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

.footer-bottom {
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  padding-top: 30px;
  text-align: center;
  opacity: 0.6;
  font-size: 14px;
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
