<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const showPasswordForm = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = false

  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return
  }
  if (!/[a-z]/.test(newPassword.value) || !/[A-Z]/.test(newPassword.value) || !/\d/.test(newPassword.value)) {
    passwordError.value = 'Password must include uppercase, lowercase, and a number'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
    return
  }

  passwordLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) throw error
    passwordSuccess.value = true
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => {
      showPasswordForm.value = false
      passwordSuccess.value = false
    }, 2000)
  } catch (e: unknown) {
    passwordError.value = (e instanceof Error ? e.message : null) || 'Failed to update password'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <section class="content-section active">
    <div class="section-header">
      <h1 class="section-title">Settings</h1>
      <p class="section-subtitle">Manage your account preferences</p>
    </div>

    <div class="info-card">
      <div class="info-card-title">
        <span>Notifications</span>
      </div>
      <div class="info-row">
        <span class="info-label">Order Updates:</span>
        <span class="info-value" style="color: #27ae60">✓ Enabled</span>
      </div>
      <div class="info-row">
        <span class="info-label">Promotions:</span>
        <span class="info-value" style="color: #27ae60">✓ Enabled</span>
      </div>
      <div class="info-row">
        <span class="info-label">SMS Alerts:</span>
        <span class="info-value" style="color: #e74c3c">✗ Disabled</span>
      </div>
    </div>

    <div class="info-card">
      <div class="info-card-title">
        <span>Security</span>
        <button class="edit-btn" @click="showPasswordForm = !showPasswordForm">
          {{ showPasswordForm ? 'Cancel' : 'Change Password' }}
        </button>
      </div>
      <div v-if="showPasswordForm" class="password-form">
        <div v-if="passwordError" class="error-msg">{{ passwordError }}</div>
        <div v-if="passwordSuccess" class="success-msg">Password updated successfully!</div>
        <form v-if="!passwordSuccess" @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input v-model="newPassword" type="password" class="form-input" placeholder="At least 8 characters" required minlength="8" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input v-model="confirmPassword" type="password" class="form-input" placeholder="Repeat password" required />
          </div>
          <button type="submit" class="edit-btn" :disabled="passwordLoading" style="width: 100%">
            {{ passwordLoading ? 'Updating…' : 'Update Password' }}
          </button>
        </form>
      </div>
      <template v-else>
        <div class="info-row">
          <span class="info-label">Password:</span>
          <span class="info-value">••••••••</span>
        </div>
        <div class="info-row">
          <span class="info-label">Two-Factor Auth:</span>
          <span class="info-value" style="color: #e74c3c">✗ Disabled</span>
        </div>
      </template>
    </div>

    <div class="info-card">
      <div class="info-card-title">
        <span>Privacy</span>
      </div>
      <div class="info-row">
        <span class="info-label">Share Purchase History:</span>
        <span class="info-value" style="color: #e74c3c">✗ Disabled</span>
      </div>
      <div class="info-row">
        <span class="info-label">Personalized Recommendations:</span>
        <span class="info-value" style="color: #27ae60">✓ Enabled</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.content-section {
  display: none;
}
.content-section.active {
  display: block;
}
.section-header {
  margin-bottom: 30px;
}
.section-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}
.section-subtitle {
  font-size: 16px;
  color: var(--paragraph);
  opacity: 0.8;
}

.info-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
  margin-bottom: 20px;
}
.info-card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.edit-btn {
  background: var(--secondary);
  border: 2px solid var(--stroke);
  color: var(--button-text);
  padding: 8px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.edit-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 2px solid var(--stroke);
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  color: var(--paragraph);
  opacity: 0.8;
  font-weight: 600;
}
.info-value {
  color: var(--headline);
  font-weight: 600;
}
.password-form {
  padding-top: 8px;
}
.password-form .form-group {
  margin-bottom: 16px;
}
.password-form .form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--headline);
}
.password-form .form-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--stroke);
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;
}
.error-msg {
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}
.success-msg {
  color: #27ae60;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}
</style>
