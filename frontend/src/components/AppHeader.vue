<template>
  <header>
    <div class="container">
      <div class="header-content">
        <router-link to="/" class="logo">Deployma</router-link>

        <div class="search-bar">
          <input v-model="searchQuery" type="text" placeholder="Search for products, categories..."
            @input="onSearchInput" @keydown.enter="handleSearch" />
        </div>

        <div class="header-actions">
          <template v-if="!authStore.isAuthenticated">
            <button class="icon-btn" @click="router.push('/login')">Sign In</button>
          </template>
          <template v-else>
            <button class="icon-btn" @click="router.push('/profile')">Profile</button>
            <button v-if="authStore.isAdmin" class="icon-btn" @click="router.push('/admin')">Admin</button>
            <button class="icon-btn" @click="authStore.signOut">Sign Out</button>
          </template>
          <button class="cart-btn" @click="router.push('/cart')">
            Cart
            <span class="cart-count">{{ cartStore.totalItems }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const searchQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (q) {
    router.push({ path: '/category', query: { search: q } })
  }
}

const onSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    handleSearch()
  }, 400)
}
</script>

<style scoped>
header {
  background: var(--bg);
  border-bottom: 3px solid var(--stroke);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--headline);
  font-size: 14px;
  cursor: pointer;
  padding: 8px 16px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  transition: color 0.2s;
}

.icon-btn:hover {
  color: var(--button);
}
</style>
