<script setup lang="ts">
import { onMounted, computed } from "vue";
import { RouterView, useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import ToastContainer from "@/components/ui/ToastContainer.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();
const route = useRoute();

const hideLayout = computed(() => {
  const name = route.name;
  return ['admin', 'login', 'signup', 'auth-callback', 'reset-password', 'forgot-password'].includes(name as string);
});

onMounted(async () => {
  // If the URL has OAuth tokens in the hash (old redirect URL still pointing to /),
  // forward to the callback view which handles them properly
  if (window.location.hash.startsWith("#access_token=")) {
    await router.replace("/auth/callback" + window.location.hash);
    return;
  }

  await authStore.initialize();
  if (authStore.isAuthenticated) {
    cartStore.mergeOnLogin();
  }
});
</script>

<template>
  <template v-if="!authStore.initialized && !hideLayout">
    <div class="auth-loading">
      <LoadingSpinner message="Loading..." size="48px" />
    </div>
  </template>
  <template v-else>
    <AppHeader v-if="!hideLayout" />
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
    <AppFooter v-if="!hideLayout" />
  </template>
  <ToastContainer />
  <ConfirmDialog />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  min-height: 100vh;
}

.auth-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
