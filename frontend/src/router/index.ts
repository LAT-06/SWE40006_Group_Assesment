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
      path: "/category/:slug?",
      name: "category",
      component: () => import("../views/CategoryView.vue"),
    },
    {
      path: "/order-tracking/:orderId?",
      name: "order-tracking",
      component: () => import("../views/OrderTrackingView.vue"),
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("../views/ResetPasswordView.vue"),
    },
    {
      path: "/auth/callback",
      name: "auth-callback",
      component: () => import("../views/AuthCallbackView.vue"),
    },
  ],
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Wait for auth initialization before evaluating guards.
  // Skip for the OAuth callback — it manages its own init.
  if (!authStore.initialized && to.name !== "auth-callback") {
    await new Promise<void>((resolve) => {
      // Register subscriber first…
      const unwatch = authStore.$subscribe(() => {
        if (authStore.initialized) {
          unwatch();
          resolve();
        }
      });
      // …then re-check immediately in case it became true between the
      // outer if-check and subscribe registration (eliminates race condition)
      if (authStore.initialized) {
        unwatch();
        resolve();
      }
    });
  }

  // For admin routes, also wait until the role has been fetched from the DB.
  // `initialized` only means the session was resolved — the role query is
  // async and may still be in-flight, so isAdmin would read as false too early.
  if (to.meta.requiresAdmin && authStore.isAuthenticated && !authStore.roleReady) {
    await new Promise<void>((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (authStore.roleReady) {
          unwatch();
          resolve();
        }
      });
      if (authStore.roleReady) {
        unwatch();
        resolve();
      }
    });
  }

  // Debug logging for admin access
  if (to.meta.requiresAdmin) {
    console.log("🔍 Admin Route Access Attempt:");
    console.log("  → Route:", to.path);
    console.log("  → User Email:", authStore.user?.email);
    console.log("  → Is Authenticated:", authStore.isAuthenticated);
    console.log("  → Role (raw):", authStore.userRole);
    console.log("  → Is Admin:", authStore.isAdmin);
    console.log("  → Role Ready:", authStore.roleReady);
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
