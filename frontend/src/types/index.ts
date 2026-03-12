import type { Tables, Enums } from '@/lib/models'

// ─── Core entity types derived from Supabase schema ──────────────────────

export type Category = Tables<'categories'>

export type Product = Tables<'products'> & {
  category?: Pick<Category, 'name' | 'slug'> | null
}

export type NutritionEntry = { label: string; value: string }

export type Order = Tables<'orders'> & {
  user?: Pick<Tables<'profiles'>, 'full_name' | 'email'> | null
  order_items?: OrderItemWithProduct[]
  delivery_slot?: DeliverySlotWithZone | null
}

export type OrderItem = Tables<'order_items'>

export type OrderItemWithProduct = Pick<OrderItem, 'quantity' | 'price_at_purchase'> & {
  product?: Pick<Tables<'products'>, 'id' | 'name' | 'image_url' | 'price'> | null
}

/**
 * Lightweight order-item shape returned when `price_at_purchase` is not selected
 * (e.g. ProfileView orders list).
 */
export type OrderItemBasic = Pick<OrderItem, 'quantity'> & {
  product?: Pick<Tables<'products'>, 'id' | 'name' | 'image_url' | 'price'> | null
}

export type DeliverySlot = Tables<'delivery_slots'>

export type DeliverySlotWithZone = DeliverySlot & {
  delivery_zones?: Pick<DeliveryZone, 'name'> | null
}

export type DeliveryZone = Tables<'delivery_zones'>

export type PromoCode = Tables<'promo_codes'>

export type UserAddress = Tables<'user_addresses'>

export type Review = Tables<'reviews'>

export type Profile = Tables<'profiles'>

export type Store = Tables<'stores'>

export type StoreInventory = Tables<'store_inventory'>

// ─── Enums ───────────────────────────────────────────────────────────────

export type OrderStatus = Enums<'order_status'>
export type SlotStatus = Enums<'slot_status'>
export type UserRole = Enums<'user_role'>
