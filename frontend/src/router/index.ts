import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { logger } from "@/lib/logger";
import HomeView from "../views/HomeView.vue";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
  }
}

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
      path: "/terms",
      name: "terms",
      component: () => import("../views/TermsView.vue"),
    },
    {
      path: "/privacy",
      name: "privacy",
      component: () => import("../views/PrivacyView.vue"),
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
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../views/ForgotPasswordView.vue"),
    },
    {
      path: "/auth/callback",
      name: "auth-callback",
      component: () => import("../views/AuthCallbackView.vue"),
    },
    {
      path: "/careers",
      name: "careers",
      component: () => import("../views/CareersView.vue"),
    },
    {
      path: "/help",
      name: "help-center",
      component: () => import("../views/HelpCenterView.vue"),
    },
    {
      path: "/contact",
      name: "contact",
      component: () => import("../views/ContactView.vue"),
    },
    {
      path: "/returns",
      name: "returns",
      component: () => import("../views/ReturnsView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
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
    logger.log("Admin Route Access Attempt:", to.path, {
      email: authStore.user?.email,
      isAuthenticated: authStore.isAuthenticated,
      role: authStore.userRole,
      isAdmin: authStore.isAdmin,
      roleReady: authStore.roleReady,
    });
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    logger.log("Not authenticated - redirecting to login");
    next({ name: "login", query: { redirect: to.fullPath } });
    return;
  }

  // Check if route requires admin privileges
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    logger.log("Admin access denied - redirecting to home");
    next({ name: "home" });
    return;
  }

  next();
});


export default router;
