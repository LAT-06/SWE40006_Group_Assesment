<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between">
      <div>
        <h1 class="page-title">Categories</h1>
        <p class="page-subtitle">Manage product categories</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">+ Add Category</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Icon</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td style="font-size: 24px">{{ cat.icon || '📦' }}</td>
            <td style="font-weight: 700">{{ cat.name }}</td>
            <td><code style="font-size: 12px">{{ cat.slug }}</code></td>
            <td style="opacity: 0.7; font-size: 13px">{{ cat.description || '—' }}</td>
            <td>
              <button class="btn" style="margin-right: 8px; padding: 4px 8px; font-size: 12px" @click="openEditModal(cat)">Edit</button>
              <button class="btn" style="padding: 4px 8px; font-size: 12px; border-color: #e74c3c; color: #e74c3c" @click="deleteCategory(cat.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="5" style="text-align: center; padding: 20px">No categories found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Category Modal -->
    <BaseModal v-if="showModal" :title="isEditing ? 'Edit Category' : 'Add Category'" @close="showModal = false">
      <div class="form-group">
        <label class="form-label">Name *</label>
        <input v-model="editing.name" type="text" class="form-input" placeholder="Category name" />
      </div>
      <div class="form-group">
        <label class="form-label">Slug</label>
        <input v-model="editing.slug" type="text" class="form-input" placeholder="category-slug" />
      </div>
      <div class="form-group">
        <label class="form-label">Icon (emoji)</label>
        <input v-model="editing.icon" type="text" class="form-input" placeholder="🥬" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input v-model="editing.description" type="text" class="form-input" placeholder="Short description" />
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
        <button class="btn btn-primary" @click="save">{{ isEditing ? 'Save Changes' : 'Add Category' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import type { Tables } from '@/lib/models'
import BaseModal from '@/components/ui/BaseModal.vue'

type Category = Tables<'categories'>

const API_URL = import.meta.env.VITE_API_URL

const categories = ref<Category[]>([])
const showModal = ref(false)
const editing = ref<Partial<Category>>({})
const isEditing = ref(false)
const toast = useToast()
const { confirm } = useConfirmDialog()

const getToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const fetchCategories = async () => {
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, created_at')
  if (data) categories.value = data
}

const openAddModal = () => {
  editing.value = { name: '', slug: '', icon: '', description: '' }
  isEditing.value = false
  showModal.value = true
}

const openEditModal = (cat: Category) => {
  editing.value = { ...cat }
  isEditing.value = true
  showModal.value = true
}

watch(() => editing.value.name, (name) => {
  if (!isEditing.value && name) {
    editing.value.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
})

const save = async () => {
  try {
    const token = await getToken()
    if (!token) { toast.error('Not authenticated'); return }
    const isEdit = isEditing.value && editing.value.id
    const url = isEdit ? `${API_URL}/categories/${editing.value.id}` : `${API_URL}/categories`
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editing.value),
    })
    if (!res.ok) {
      const text = await res.text()
      let errMsg = 'Request failed with status ' + res.status
      try { errMsg = JSON.parse(text).error || errMsg } catch { errMsg = text || errMsg }
      throw new Error(errMsg)
    }
    showModal.value = false
    await fetchCategories()
  } catch (e: unknown) {
    toast.error('Error saving category: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const deleteCategory = async (id: string) => {
  if (!await confirm({ message: 'Delete this category?', variant: 'danger', confirmText: 'Delete' })) return
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete')
    await fetchCategories()
  } catch (e: unknown) {
    toast.error('Error deleting category: ' + (e instanceof Error ? e.message : String(e)))
  }
}

defineExpose({ fetchCategories, categories })
</script>
