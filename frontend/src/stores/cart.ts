import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

export interface CartItem {
  id: number;
  productId?: string; // Supabase UUID
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

  watch(items, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
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

  function updateQuantity(itemId: number, change: number) {
    const item = items.value.find((i) => i.id === itemId);
    if (item) item.quantity = Math.max(1, item.quantity + change);
  }

  function removeItem(itemId: number) {
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
    const newId =
      items.value.length > 0 ? Math.max(...items.value.map((i) => i.id)) + 1 : 1;
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
  }

  function updateDeliveryFee(zone: string) {
    const fees: Record<string, number> = { "zone-a": 2.0, "zone-b": 3.5, "zone-c": 5.0 };
    deliveryFee.value = fees[zone] || 3.5;
  }

  return {
    items, deliveryFee, discount, subtotal, total, itemCount, totalItems,
    updateQuantity, removeItem, addItem, applyPromoCode, clearCart, updateDeliveryFee,
  };
});
