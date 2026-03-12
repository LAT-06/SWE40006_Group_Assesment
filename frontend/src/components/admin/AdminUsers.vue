<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Users</h1>
      <p class="page-subtitle">Manage registered users and their roles</p>
    </div>

    <!-- Toolbar -->
    <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; align-items:center;">
      <input v-model="userSearch" placeholder="Search by name or email…"
        style="flex:1; min-width:200px; padding:8px 12px; border:2px solid var(--stroke); font-size:14px;" />
      <div style="display:flex; gap:8px;">
        <button
          v-for="f in [['all','All'],['admin','Admins'],['customer','Customers']]"
          :key="f[0]"
          class="btn"
          :class="{ 'btn-primary': userRoleFilter === f[0] }"
          style="padding:6px 14px; font-size:13px;"
          @click="userRoleFilter = f[0] as 'all' | 'admin' | 'customer'"
        >{{ f[1] }}</button>
      </div>
      <button class="btn btn-secondary" style="padding:6px 12px; font-size:13px;" @click="fetchUsers()">Refresh</button>
    </div>

    <div v-if="usersLoading" style="text-align:center; padding:40px; color:#666;">Loading users…</div>
    <div v-else-if="usersError" style="text-align:center; padding:24px; color:#e74c3c; font-weight:600;">
      ⚠ {{ usersError }}
      <button class="btn" style="margin-left:12px;" @click="fetchUsers()">Retry</button>
    </div>
    <div v-else class="table-container">
      <div style="padding:12px 16px; background:#f9f9f9; border-bottom:2px solid var(--stroke); font-size:13px; color:#666;">
        Showing {{ filteredUsers.length }} of {{ users.length }} users
      </div>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Provider</th>
            <th>Joined</th>
            <th>Last Sign-in</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <div v-if="user.avatar_url" style="width:34px; height:34px; border-radius:50%; overflow:hidden; flex-shrink:0;">
                  <img :src="user.avatar_url" style="width:100%; height:100%; object-fit:cover;" />
                </div>
                <div v-else style="width:34px; height:34px; border-radius:50%; background:var(--highlight); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0;">
                  {{ userInitials(user) }}
                </div>
                <div>
                  <div style="font-weight:700; font-size:14px;">{{ user.full_name || '—' }}</div>
                  <div style="font-size:11px; font-family:monospace; color:#999;">{{ user.id.slice(0,8) }}</div>
                </div>
              </div>
            </td>
            <td style="font-size:13px;">{{ user.email || '—' }}</td>
            <td>
              <span style="font-size:12px; padding:2px 8px; border:1px solid var(--stroke); border-radius:99px; text-transform:capitalize;">
                {{ user.provider }}
              </span>
            </td>
            <td style="font-size:13px;">{{ new Date(user.created_at).toLocaleDateString() }}</td>
            <td style="font-size:13px;">
              {{ user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '—' }}
            </td>
            <td @click.stop>
              <select
                :value="user.role"
                :disabled="user.id === currentUserId"
                @change="updateUserRole(user.id, ($event.target as HTMLSelectElement).value as 'customer' | 'admin')"
                :style="`padding:4px 8px; border:2px solid ${user.role === 'admin' ? '#6c5ce7' : 'var(--stroke)'}; font-size:12px; cursor:pointer; background:${user.role === 'admin' ? '#f5f3ff' : 'white'}; font-family:'DM Sans',sans-serif; border-radius:4px;`"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
              <span v-if="user.id === currentUserId" style="font-size:11px; color:#999; margin-left:6px;">(you)</span>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" style="text-align:center; padding:30px; color:#999;">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const API_URL = import.meta.env.VITE_API_URL
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'customer' | 'admin'
  provider: string
  confirmed_at: string | null
  last_sign_in_at: string | null
  created_at: string
}

const users = ref<AdminUser[]>([])
const usersLoading = ref(false)
const usersError = ref('')
const userSearch = ref('')
const userRoleFilter = ref<'all' | 'admin' | 'customer'>('all')

const filteredUsers = computed(() => {
  let list = users.value
  if (userRoleFilter.value !== 'all')
    list = list.filter((u) => u.role === userRoleFilter.value)
  const q = userSearch.value.toLowerCase().trim()
  if (q)
    list = list.filter((u) => u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q))
  return list
})

const getToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

const fetchUsers = async () => {
  usersLoading.value = true
  usersError.value = ''
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    users.value = data.users ?? []
  } catch (e: unknown) {
    usersError.value = e instanceof Error ? e.message : 'Failed to load users'
  } finally {
    usersLoading.value = false
  }
}

const updateUserRole = async (userId: string, role: 'customer' | 'admin') => {
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to update role')
    }
    const idx = users.value.findIndex((u) => u.id === userId)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], role } as typeof users.value[number]
  } catch (e: unknown) {
    useToast().error('Error updating role: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const userInitials = (user: AdminUser) => {
  if (user.full_name) return user.full_name.charAt(0).toUpperCase()
  if (user.email) return user.email.charAt(0).toUpperCase()
  return '?'
}

defineExpose({ fetchUsers, users })
</script>
