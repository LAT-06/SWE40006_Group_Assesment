# Plan: Grocery Delivery Frontend — Gaps & Enterprise Refactoring

The project has solid foundations (Vue 3 Composition API, Pinia, Supabase, TypeScript) but suffers from **missing features**, **monolithic 600-800 line views**, **weak type safety (`any` everywhere)**, **no error boundaries**, **a broken Dockerfile**, and **zero tests**. This plan addresses both functional gaps and code quality in 6 phases.

---

## Phase 1: Foundation & Configuration Fixes
*Quick wins that unblock everything else.*

1. **Fix `env.d.ts`** — add `ImportMetaEnv` interface declaring `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`. Currently has zero type safety for env vars.
2. **Fix `index.html`** — set `lang="en"`, change title from "Vite App" to project name, add `<meta description>` and OG tags.
3. **Rewrite `Dockerfile`** — currently runs `npm run dev` in production as root user. Replace with multi-stage build: build stage (`npm ci` + `npm run build`) → serve stage (`nginx:alpine`, non-root user). Add `.dockerignore`.
4. **Remove hardcoded localhost** in `src/stores/products.ts` — the `|| 'http://localhost:3000'` fallback is dangerous in production. Fail fast if `VITE_API_URL` is missing.
5. **Add global error handler** in `src/main.ts` — `app.config.errorHandler` to catch unhandled errors.
6. **Delete unused boilerplate** — 5 icon components (`IconCommunity`, `IconDocumentation`, `IconEcosystem`, `IconSupport`, `IconTooling`) and `src/stores/counter.ts` are Vue starter template leftovers referenced nowhere.

---

## Phase 2: TypeScript & Type Safety Hardening
*Eliminate `any` types across the codebase.*

1. **Create `src/types/index.ts`** — central type barrel exporting `Product`, `Category`, `Order`, `OrderItem`, `DeliverySlot`, `DeliveryZone`, `PromoCode`, `UserAddress` derived from the Supabase `Tables<>` helper in `src/lib/models.ts`.
2. **Refactor stores** — replace `any` casts and `as unknown as Product[]` in `products.ts`. Fix cart ID generation in `cart.ts` (`Math.max(...ids)+1` → `crypto.randomUUID()`).
3. **Type route meta** in `src/router/index.ts` — augment `vue-router` module with typed `RouteMeta`.
4. **Type all view reactive state** — AdminView, CartView, OrderTrackingView, ProductDetailView, ProfileView, CategoryView all use `any` extensively for API responses.

---

## Phase 3: Component Decomposition
*Break monolithic views into reusable, testable components. This is the largest phase.*

1. **Create shared layout** — Extract the header/nav/cart-badge/auth-buttons from `HomeView.vue` into `AppHeader.vue` and footer into `AppFooter.vue`. Wrap `<RouterView />` in `App.vue` with these. **Currently other views have no navigation at all** — this is a critical UX gap.

2. **Decompose `AdminView.vue` (~600+ lines)** into 7 components under `src/components/admin/`: `AdminDashboard`, `AdminCategories`, `AdminOrders`, `AdminStock`, `AdminDeliverySlots`, `AdminProducts`, `AdminUsers`. AdminView becomes a thin tab-navigation shell.

3. **Decompose `CartView.vue` (~800+ lines)** into 6 components under `src/components/cart/`: `CartItemList`, `CheckoutForm`, `OrderSummary`, `PromoCodeInput`, `AddressSelector`, `DeliverySlotPicker`. The last two are reusable in ProfileView.

4. **Decompose `ProfileView.vue` (~500+ lines)** into 4 components under `src/components/profile/`: `ProfileInfo`, `OrderHistory`, `SavedAddresses`, `ProfileSettings`.

5. **Create reusable UI primitives** under `src/components/ui/`: `BaseModal`, `BaseButton` (with loading prop), `BaseInput` (with validation), `BaseBadge`, `LoadingSpinner`, `EmptyState`, `Pagination`, `ConfirmDialog`. These replace all inline modal markup, `confirm()` dialogs, and repeated loading/empty patterns.

6. **Extract `ProductCard.vue`** — used in HomeView (featured), CategoryView (grid/list), ProductDetailView (related). Props: `product`, `viewMode`.

---

## Phase 4: Missing Features
*Fill the functional gaps found in the codebase.*

| # | Feature | Details |
|---|---------|---------|
| 4.1 | **Global search** | HomeView/AppHeader search bar is non-functional. Wire it to filter products and navigate to `/category?search=...` with debounced input. |
| 4.2 | **404 page** | No catch-all route exists. Add `/:pathMatch(.*)*` → new `NotFoundView.vue`. |
| 4.3 | **Forgot password flow** | LoginView's "Forgot Password" is `href="#"`. Create `ForgotPasswordView.vue` with email form → `supabase.auth.resetPasswordForEmail()`. |
| 4.4 | **Password change in Profile** | Settings section is an empty placeholder. Add password change form using `supabase.auth.updateUser()`. |
| 4.5 | **Fix promo code validation** | `cart.ts` `applyPromoCode()` is a stub. Query `promo_codes` table to validate existence, expiry, usage limits. |
| 4.6 | **Cart sync for auth users** | Cart is localStorage-only but `carts`/`cart_items` tables exist unused in DB. Merge on login, sync while authenticated. |
| 4.7 | **Real-time order tracking** | `OrderTrackingView.vue` loads once. Add Supabase realtime subscription to update status timeline live. |
| 4.8 | **Product reviews** | `reviews` table exists in schema but zero UI. Add `ProductReviews.vue` as a tab in ProductDetailView. |
| 4.9 | **Complete About page** | Currently just a heading with a typo ("present ourself"). |
| 4.10 | **Terms & Privacy pages** | SignupView links to these with dead `href="#"` links. Create `TermsView.vue`, `PrivacyView.vue`. |

---

## Phase 5: UX & Robustness
*Error handling, loading states, validation, accessibility.*

1. **Vue error boundary** — `ErrorBoundary.vue` using `onErrorCaptured`, wrap `<RouterView />` in App.vue.
2. **Auth loading screen** — show spinner in App.vue while `authStore.initialized === false` to prevent flash of unauthenticated content.
3. **Loading states everywhere** — every async operation should show a spinner during load and an error state on failure (AdminView modals, CartView order placement, CategoryView product fetch, etc.).
4. **Form validation** — phone number format, address length limits, "email already exists" handling, password strength requirements beyond 6 chars.
5. **Replace `alert()`/`confirm()`** with styled ConfirmDialog and a toast notification system (`useToast` composable + `ToastContainer.vue`).
6. **Accessibility** — `aria-label` on icon buttons, heading hierarchy, keyboard nav in modals, color contrast verification.
7. **Remove debug console.logs** from `router/index.ts` — replace with conditional logger (`src/lib/logger.ts` that only logs in dev).

---

## Phase 6: Build & Deploy for S3 + CloudFront

1. **Vite config** — ensure `base: '/'` in `vite.config.ts` for CloudFront root distribution.
2. **CloudFront SPA routing** — configure custom error response: 403/404 → `/index.html` with 200 status. Document in README.
3. **CSS design system** — extend `main.css` with spacing scale (`--space-xs` to `--space-xl`), semantic color tokens (success/warning/error/info), `focus-visible` styles, `.sr-only` utility.
4. **Asset optimization** — replace emoji product placeholders with `image_url` from Supabase Storage, add `loading="lazy"`, create fallback placeholder component.
5. **Dynamic page titles** — `useHead` composable to set `document.title` per route for SEO.

---

## Verification

1. `npm run type-check` passes with zero errors after Phase 2
2. `npm run build` produces clean production bundle after Phase 1
3. All routes navigable — manually test every route
4. Full auth flow: signup → verify → login → profile → logout
5. Full cart flow: add → checkout → order → track
6. Admin flow: categories/products/orders/stock/slots CRUD
7. 404 route works for unknown paths
8. Forgot password sends email and reset completes
9. Docker build produces working image
10. Lighthouse accessibility score ≥ 90 after Phase 5

---

## Decisions

- **Testing skipped** — Vitest is configured but no tests now; can layer in later
- **Keep custom CSS** — improve design tokens instead of adopting a UI library
- **Cart sync strategy** — localStorage wins on merge conflicts when user logs in
- **Supabase `Tables<>` types preferred** over manual interfaces where schema matches
- **Component library is internal** — `src/components/ui/` not an npm package

## Further Considerations

1. **CI/CD Pipeline** — Add a GitHub Actions workflow for type-check → build → S3 deploy → CloudFront invalidation. *Recommended: yes, include it.*
2. **Internationalization** — English-only now. If multi-language ever needed, adopt `vue-i18n`. *Recommendation: skip for now but centralize user-facing strings.*
3. **State persistence** — Consider `pinia-plugin-persistedstate` for consistent persistence instead of manual localStorage in cart store. *Recommendation: adopt for cart store.*
