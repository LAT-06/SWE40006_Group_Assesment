import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";

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
    const withBadge = products.value.filter(p => p.badge);
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
        .select(`
          *,
          category:categories(name, slug)
        `)
        .order('created_at', { ascending: false });

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

  // Admin Actions
  const addProduct = async (product: Partial<Product>) => {
    try {
      // Remove 'category' relation object before sending to DB
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { category, ...productData } = product;

      const { data, error: err } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

      if (err) throw err;
      products.value.unshift(data as Product);
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { category, ...updateData } = updates;

      const { data, error: err } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (err) throw err;
      
      const index = products.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...data };
      }
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (err) throw err;
      products.value = products.value.filter((p) => p.id !== id);
    } catch (err: any) {
      throw err;
    }
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
