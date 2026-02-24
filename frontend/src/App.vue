<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  // If the URL has OAuth tokens in the hash (old redirect URL still pointing to /),
  // forward to the callback view which handles them properly
  if (window.location.hash.startsWith("#access_token=")) {
    await router.replace("/auth/callback" + window.location.hash);
    return;
  }

  await authStore.initialize();
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
