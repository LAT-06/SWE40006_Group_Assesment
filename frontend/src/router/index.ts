import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("../views/SignupView.vue"),
    },
    {
      path: "/cart",
      name: "cart",
      component: () => import("../views/CartView.vue"),
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("../views/ProfileView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/product/:id",
      name: "product-detail",
      component: () => import("../views/ProductDetailView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/cart",
      name: "cart",
      component: () => import("../views/CartView.vue"),
    },
  ],
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Wait for auth to be initialized (only on first load)
  if (authStore.loading) {
    console.log("⏳ Waiting for auth initialization...");
    await new Promise<void>((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.loading) {
          unwatch();
          resolve();
        }
      });
    });
  }

  // Debug logging for admin access
  if (to.meta.requiresAdmin) {
    console.log("🔍 Admin Route Access Attempt:");
    console.log("  → Route:", to.path);
    console.log("  → User Email:", authStore.user?.email);
    console.log("  → Is Authenticated:", authStore.isAuthenticated);
    console.log("  → Is Admin:", authStore.isAdmin);
    console.log("  → User Metadata:", authStore.user?.user_metadata);
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log("Not authenticated - redirecting to login");
    next({ name: "login", query: { redirect: to.fullPath } });
    return;
  }

  // Check if route requires admin privileges
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    console.log("Admin access denied - redirecting to home");
    next({ name: "home" });
    return;
  }

  console.log("Access granted");
  next();
});

export default router;
