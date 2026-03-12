import { defineStore } from "pinia";
import { ref, computed, shallowRef } from "vue";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

export type { Product };

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('Missing required environment variable: VITE_API_URL');
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export const useProductStore = defineStore("products", () => {
  const products = shallowRef<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const featuredProducts = computed((): Product[] => {
    const withBadge = products.value.filter((p) => p.badge);
    if (withBadge.length > 0) return withBadge.slice(0, 8);
    return products.value.slice(0, 8);
  });

  // Actions
  const fetchProducts = async (page = 1, limit = 50) => {
    loading.value = true;
    error.value = null;
    try {
      const { data: res, error: err } = await supabase
        .from("products")
        .select(
          `*, category:categories(name, slug)`,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (err) throw err;
      if (page === 1) {
        products.value = (res ?? []) as Product[];
      } else {
        products.value = [...products.value, ...((res ?? []) as Product[])];
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  };

  const getProductsByCategory = (categorySlug: string) => {
    return products.value.filter((p) => p.category?.slug === categorySlug);
  };

  // Admin Actions — routed through backend (uses service role, bypasses RLS)
  const addProduct = async (product: Partial<Product>) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    // Remove relation object before sending
    const { category, ...productData } = product;

    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create product");
    }

    const data: Product = await res.json();
    products.value = [data, ...products.value];
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const { category, ...updateData } = updates;

    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update product");
    }

    const data: Product = await res.json();
    const index = products.value.findIndex((p) => p.id === id);
    if (index !== -1) {
      const updated = [...products.value];
      updated[index] = { ...updated[index], ...data };
      products.value = updated;
    }
    return data;
  };

  const deleteProduct = async (id: string) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete product");
    }

    products.value = products.value.filter((p) => p.id !== id);
  };

  return {
    products,
    loading,
    error,
    featuredProducts,
    fetchProducts,
    getProductsByCategory,
    addProduct,
    updateProduct,
    deleteProduct,
  };
});
