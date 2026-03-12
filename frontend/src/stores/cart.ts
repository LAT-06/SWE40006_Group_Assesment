import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  icon: string;
}

const STORAGE_KEY = "deployma_cart";

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>(loadFromStorage());
  const deliveryFee = ref(3.5);
  const discount = ref(0);
  let syncing = false;

  watch(items, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    if (!syncing) syncToDb();
  }, { deep: true });

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const total = computed(() => {
    const fee = subtotal.value >= 50 ? 0 : deliveryFee.value;
    return subtotal.value + fee - discount.value;
  });

  const itemCount = computed(() => items.value.length);
  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  function updateQuantity(itemId: string, change: number) {
    const item = items.value.find((i) => i.id === itemId);
    if (item) item.quantity = Math.max(1, item.quantity + change);
  }

  function removeItem(itemId: string) {
    items.value = items.value.filter((i) => i.id !== itemId);
  }

  function addItem(item: Omit<CartItem, "id">) {
    const existing = items.value.find(
      (i) => i.productId && i.productId === item.productId,
    );
    if (existing) {
      existing.quantity += item.quantity ?? 1;
      return;
    }
    const newId = crypto.randomUUID();
    items.value.push({ ...item, id: newId });
  }

  function applyPromoCode(code: string, discountAmount: number): boolean {
    if (discountAmount > 0) {
      discount.value = discountAmount;
      return true;
    }
    return false;
  }

  function clearCart() {
    items.value = [];
    discount.value = 0;
    localStorage.removeItem(STORAGE_KEY);
    clearDb();
  }

  function updateDeliveryFee(zone: string) {
    const fees: Record<string, number> = { "zone-a": 2.0, "zone-b": 3.5, "zone-c": 5.0 };
    deliveryFee.value = fees[zone] || 3.5;
  }

  // ─── DB Sync ──────────────────────────────────────────────────────────

  async function getOrCreateCart(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (data) return data.id;

    const { data: created } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();
    return created?.id ?? null;
  }

  /** Merge DB cart items with local items on login. localStorage wins conflicts. */
  async function mergeOnLogin() {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) return;

    const cartId = await getOrCreateCart(userId);
    if (!cartId) return;

    const { data: dbItems } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("cart_id", cartId);

    if (dbItems && dbItems.length > 0) {
      // Merge: for each DB item, if not already in local cart, fetch product info and add
      const localProductIds = new Set(items.value.map((i) => i.productId).filter(Boolean));
      const newProductIds = dbItems
        .filter((di) => di.product_id && !localProductIds.has(di.product_id))
        .map((di) => di.product_id!);

      if (newProductIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name, price, weight, image_url")
          .in("id", newProductIds);

        if (products) {
          syncing = true;
          for (const p of products) {
            const dbItem = dbItems.find((di) => di.product_id === p.id);
            items.value.push({
              id: crypto.randomUUID(),
              productId: p.id,
              name: p.name,
              price: p.price,
              size: p.weight ?? "",
              icon: p.image_url ?? "",
              quantity: dbItem?.quantity ?? 1,
            });
          }
          syncing = false;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
        }
      }
    }

    // Sync local state back to DB (local wins)
    await syncToDb();
  }

  let syncTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Debounced sync of local cart state to DB */
  function syncToDb() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => _doSync(), 1000);
  }

  async function _doSync() {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) return;

    const cartId = await getOrCreateCart(userId);
    if (!cartId) return;

    // Clear existing cart items
    await supabase.from("cart_items").delete().eq("cart_id", cartId);

    // Insert current items
    const rows = items.value
      .filter((i) => i.productId)
      .map((i) => ({
        cart_id: cartId,
        product_id: i.productId!,
        quantity: i.quantity,
      }));

    if (rows.length > 0) {
      await supabase.from("cart_items").insert(rows);
    }
  }

  async function clearDb() {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (data) {
      await supabase.from("cart_items").delete().eq("cart_id", data.id);
    }
  }

  return {
    items, deliveryFee, discount, subtotal, total, itemCount, totalItems,
    updateQuantity, removeItem, addItem, applyPromoCode, clearCart, updateDeliveryFee,
    mergeOnLogin,
  };
});
