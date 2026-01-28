<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

// Initialize auth session on app mount
onMounted(async () => {
  await authStore.initialize();

  // If user just logged in via OAuth and is admin, redirect to admin dashboard
  if (
    authStore.isAuthenticated &&
    authStore.isAdmin &&
    router.currentRoute.value.path === "/"
  ) {
    router.push("/admin");
  }
});
</script>

<template>
  <RouterView />
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
</style>
