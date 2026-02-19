import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface CartItem {
  id: number;
  productId?: string; // Supabase UUID
  name: string;
  size: string;
  price: number;
  quantity: number;
  icon: string;
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([]);

  const deliveryFee = ref(3.5);
  const discount = ref(0);

  const subtotal = computed(() => {
    return items.value.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  });

  const total = computed(() => {
    const fee = subtotal.value >= 50 ? 0 : deliveryFee.value;
    return subtotal.value + fee - discount.value;
  });

  const itemCount = computed(() => items.value.length);

  const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  function updateQuantity(itemId: number, change: number) {
    const item = items.value.find((i) => i.id === itemId);
    if (item) {
      item.quantity = Math.max(1, item.quantity + change);
    }
  }

  function removeItem(itemId: number) {
    items.value = items.value.filter((i) => i.id !== itemId);
  }

  function addItem(item: Omit<CartItem, "id">) {
    const newId =
      items.value.length > 0
        ? Math.max(...items.value.map((i) => i.id)) + 1
        : 1;
    items.value.push({ ...item, id: newId });
  }

  function applyPromoCode(code: string): boolean {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode === "FRESH10") {
      discount.value = subtotal.value * 0.1;
      return true;
    }
    return false;
  }

  function clearCart() {
    items.value = [];
    discount.value = 0;
  }

  function updateDeliveryFee(zone: string) {
    const fees: Record<string, number> = {
      "zone-a": 2.0,
      "zone-b": 3.5,
      "zone-c": 5.0,
    };
    deliveryFee.value = fees[zone] || 3.5;
  }

  return {
    items,
    deliveryFee,
    discount,
    subtotal,
    total,
    itemCount,
    totalItems,
    updateQuantity,
    removeItem,
    addItem,
    applyPromoCode,
    clearCart,
    updateDeliveryFee,
  };
});
