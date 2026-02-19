import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  description?: string;
  category_id?: string;
  category?: {
    name: string;
    slug: string;
  };
  brand?: string;
  weight?: string;
  image_url?: string; // This will map to 'icon' or 'image' in UI
  badge?: string;
  in_stock: boolean;
  quantity?: number;
  dietary_tags: string[];
  created_at?: string;
}

export const useProductStore = defineStore("products", () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const featuredProducts = computed(() => {
    // Return products with a badge, or just first 8 if none/few have badges
    const withBadge = products.value.filter((p) => p.badge);
    if (withBadge.length > 0) return withBadge.slice(0, 8);
    return products.value.slice(0, 8);
  });

  // Actions
  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(name, slug)
        `,
        )
        .order("created_at", { ascending: false });

      if (err) throw err;
      products.value = data as Product[];
    } catch (err: any) {
      console.error("Error fetching products:", err);
      error.value = err.message;
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
    const { category, ...productData } = product as any;

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
    products.value.unshift(data);
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const { category, ...updateData } = updates as any;

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
    if (index !== -1)
      products.value[index] = { ...products.value[index], ...data };
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
