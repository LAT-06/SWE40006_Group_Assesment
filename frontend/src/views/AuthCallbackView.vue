<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef6e4;
      font-family: 'DM Sans', sans-serif;
    "
  >
    <div style="text-align: center">
      <div style="font-size: 40px; margin-bottom: 16px">🔑</div>
      <p style="color: #001858; font-weight: 600; font-size: 18px">
        Signing you in…
      </p>
      <p v-if="error" style="color: #e74c3c; margin-top: 12px">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const error = ref("");

async function redirect() {
  await router.replace(authStore.isAdmin ? "/admin" : "/");
}

onMounted(async () => {
  // Initialize auth (processes hash/PKCE tokens from URL)
  await authStore.initialize();

  // If session was immediately available, redirect now
  if (authStore.isAuthenticated) {
    await redirect();
    return;
  }

  // Supabase may process hash tokens asynchronously —
  // watch isAuthenticated until it becomes true (or times out)
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("timeout")), 15_000);

    const unwatch = watch(
      () => authStore.isAuthenticated,
      async (isAuth) => {
        if (isAuth) {
          clearTimeout(timeout);
          unwatch();
          await redirect();
          resolve();
        }
      },
    );

    // Safety re-check after watch is registered
    if (authStore.isAuthenticated) {
      clearTimeout(timeout);
      unwatch();
      redirect().then(resolve);
    }
  }).catch(() => {
    error.value = "Authentication failed. Please try again.";
    setTimeout(() => router.replace("/login"), 2500);
  });
});
</script>
