<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProfileInfo from '@/components/profile/ProfileInfo.vue'
import ProfileOrders from '@/components/profile/ProfileOrders.vue'
import ProfileAddresses from '@/components/profile/ProfileAddresses.vue'
import ProfileSettings from '@/components/profile/ProfileSettings.vue'

const router = useRouter()
const authStore = useAuthStore()

const activeSection = ref('profile')
const ordersRef = useTemplateRef<InstanceType<typeof ProfileOrders>>('ordersRef')

const switchSection = (sectionId: string) => {
  activeSection.value = sectionId
}

const logout = () => {
  authStore.signOut()
  router.push('/')
}
</script>

<template>
  <div class="profile-page">
    <div class="main-content">
      <div class="container">
        <div class="account-layout">
          <!-- Sidebar -->
          <aside class="sidebar">
            <div class="profile-header">
              <div class="avatar">
                {{ authStore.user?.user_metadata?.name?.charAt(0) || 'U' }}
              </div>
              <div class="profile-name">
                {{ authStore.user?.user_metadata?.name || 'User' }}
              </div>
              <div class="profile-email">
                {{ authStore.user?.email || 'user@email.com' }}
              </div>
            </div>
            <nav class="nav-menu">
              <a href="#" class="nav-item" :class="{ active: activeSection === 'profile' }"
                @click.prevent="switchSection('profile')">
                <span class="nav-icon">👤</span>
                <span>Profile</span>
              </a>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'orders' }"
                @click.prevent="switchSection('orders')">
                <span class="nav-icon">📦</span>
                <span>My Orders</span>
              </a>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'addresses' }"
                @click.prevent="switchSection('addresses')">
                <span class="nav-icon">📍</span>
                <span>Saved Addresses</span>
              </a>
              <a href="#" class="nav-item" :class="{ active: activeSection === 'settings' }"
                @click.prevent="switchSection('settings')">
                <span class="nav-icon">⚙️</span>
                <span>Settings</span>
              </a>
              <a href="#" class="nav-item" style="color: #e74c3c" @click.prevent="logout">
                <span class="nav-icon">🚪</span>
                <span>Logout</span>
              </a>
            </nav>
          </aside>

          <!-- Main Content -->
          <main>
            <ProfileInfo v-show="activeSection === 'profile'" :orders="ordersRef?.orders ?? []" />
            <ProfileOrders v-show="activeSection === 'orders'" ref="ordersRef" />
            <ProfileAddresses v-show="activeSection === 'addresses'" />
            <ProfileSettings v-show="activeSection === 'settings'" />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.main-content {
  padding: 40px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.account-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
}

/* Sidebar */
.sidebar {
  background: white;
  border: 3px solid var(--stroke);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.profile-header {
  padding: 30px;
  text-align: center;
  border-bottom: 3px solid var(--stroke);
  background: var(--main);
}

.avatar {
  width: 100px;
  height: 100px;
  background: var(--button);
  border: 4px solid var(--stroke);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 700;
  color: var(--headline);
  margin: 0 auto 16px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 4px;
}

.profile-email {
  font-size: 14px;
  color: var(--paragraph);
  opacity: 0.7;
}

.nav-menu {
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  color: var(--paragraph);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.nav-item:hover {
  background: var(--main);
}

.nav-item.active {
  background: var(--button);
  color: var(--button-text);
  font-weight: 700;
  border-left-color: var(--stroke);
}

.nav-icon {
  font-size: 20px;
}

/* Responsive */
@media (max-width: 968px) {
  .account-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
</style>
