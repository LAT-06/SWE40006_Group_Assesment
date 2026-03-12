<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">Manage your product catalog</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">+ Add Product</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in productStore.products" :key="product.id">
            <td>
              <div style="font-weight: 700">{{ product.name }}</div>
              <div style="font-size: 12px; color: var(--paragraph); opacity: 0.7">{{ product.slug }}</div>
            </td>
            <td>{{ product.category?.name || 'Uncategorized' }}</td>
            <td>
              <div style="font-weight: 700">${{ product.price }}</div>
              <div v-if="product.original_price" style="font-size: 12px; text-decoration: line-through; opacity: 0.7">${{ product.original_price }}</div>
            </td>
            <td>{{ product.quantity || 0 }}</td>
            <td>
              <span :class="['badge', product.in_stock ? 'badge-delivered' : 'badge-pending']">
                {{ product.in_stock ? 'In Stock' : 'Out of Stock' }}
              </span>
            </td>
            <td>
              <button class="btn" style="margin-right: 8px; padding: 4px 8px; font-size: 12px" @click="openEditModal(product)">Edit</button>
              <button class="btn" style="padding: 4px 8px; font-size: 12px; border-color: #e74c3c; color: #e74c3c" @click="deleteProduct(product.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="productStore.products.length === 0">
            <td colspan="6" style="text-align: center; padding: 20px">No products found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Product Modal -->
    <BaseModal v-if="showModal" :title="isEditing ? 'Edit Product' : 'Add Product'" max-width="600px" @close="showModal = false">
      <div class="form-group">
        <label class="form-label">Name *</label>
        <input v-model="editing.name" type="text" class="form-input" placeholder="Product name" />
      </div>
      <div class="form-group">
        <label class="form-label">Slug</label>
        <input v-model="editing.slug" type="text" class="form-input" placeholder="product-slug" />
      </div>
      <div class="form-group">
        <label class="form-label">Category *</label>
        <select v-model="editing.category_id" class="form-select">
          <option value="">Select category</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <div class="form-group">
          <label class="form-label">Price *</label>
          <input v-model.number="editing.price" type="number" class="form-input" min="0" step="0.01" />
        </div>
        <div class="form-group">
          <label class="form-label">Original Price</label>
          <input v-model.number="editing.original_price" type="number" class="form-input" min="0" step="0.01" />
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <div class="form-group">
          <label class="form-label">Weight/Size</label>
          <input v-model="editing.weight" type="text" class="form-input" placeholder="e.g. 500g" />
        </div>
        <div class="form-group">
          <label class="form-label">Quantity</label>
          <input v-model.number="editing.quantity" type="number" class="form-input" min="0" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea v-model="editing.description" class="form-input" rows="3" placeholder="Product description"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Storage Instructions</label>
        <input v-model="editing.storage" type="text" class="form-input" placeholder="e.g. Keep refrigerated" />
      </div>
      <div class="form-group">
        <label class="form-label">Nutrition</label>
        <div v-for="(entry, idx) in editing.nutrition" :key="idx" style="display: flex; gap: 8px; margin-bottom: 8px">
          <input v-model="entry.label" class="form-input" placeholder="Label" style="flex: 1" />
          <input v-model="entry.value" class="form-input" placeholder="Value" style="flex: 1" />
          <button class="btn btn-cancel" style="padding: 4px 8px" @click="removeNutritionRow(idx)">✕</button>
        </div>
        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 13px" @click="addNutritionRow">+ Add Row</button>
      </div>
      <div class="form-group">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer">
          <input type="checkbox" v-model="editing.in_stock" style="width: 16px; height: 16px" />
          In Stock
        </label>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
        <button class="btn btn-primary" @click="save">{{ isEditing ? 'Save Changes' : 'Add Product' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProductStore } from '@/stores/products'
import { useToast } from '@/composables/useToast'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import type { Product } from '@/types'
import type { Tables } from '@/lib/models'
import BaseModal from '@/components/ui/BaseModal.vue'

type Category = Tables<'categories'>
type NutritionEntry = { label: string; value: string }
type EditableProduct = Omit<Partial<Product>, 'nutrition'> & { nutrition?: NutritionEntry[] }

const props = defineProps<{
  categories: Category[]
}>()

const productStore = useProductStore()
const toast = useToast()
const { confirm } = useConfirmDialog()

const showModal = ref(false)
const editing = ref<EditableProduct>({})
const isEditing = ref(false)

const openAddModal = () => {
  editing.value = {
    in_stock: true, quantity: 0, price: 0, original_price: 0,
    name: '', slug: '', weight: '', category_id: '', description: '', nutrition: [], storage: '',
  }
  isEditing.value = false
  showModal.value = true
}

const openEditModal = (product: Product) => {
  editing.value = { ...product, nutrition: (product.nutrition ?? []) as NutritionEntry[] }
  isEditing.value = true
  showModal.value = true
}

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')

watch(() => editing.value.name, (newName) => {
  if (!isEditing.value && newName) editing.value.slug = generateSlug(newName)
})

const save = async () => {
  try {
    const payload = editing.value as Partial<Product>
    if (isEditing.value && payload.id) {
      await productStore.updateProduct(payload.id, payload)
    } else {
      await productStore.addProduct(payload)
    }
    showModal.value = false
  } catch (e: unknown) {
    toast.error('Error saving product: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const addNutritionRow = () => {
  if (!editing.value.nutrition) editing.value.nutrition = []
  editing.value.nutrition.push({ label: '', value: '' })
}

const removeNutritionRow = (idx: number) => {
  editing.value.nutrition?.splice(idx, 1)
}

const deleteProduct = async (id: string) => {
  if (await confirm({ message: 'Delete this product?', variant: 'danger', confirmText: 'Delete' })) {
    try { await productStore.deleteProduct(id) }
    catch (e: unknown) { toast.error('Error deleting product: ' + (e instanceof Error ? e.message : String(e))) }
  }
}
</script>
