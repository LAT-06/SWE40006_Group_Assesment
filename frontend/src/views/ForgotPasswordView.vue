<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

async function handleSubmit() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = 'Please enter your email address'
    return
  }
  if (!isValidEmail(email.value)) {
    error.value = 'Please enter a valid email address'
    return
  }
  loading.value = true
  try {
    const { error: err } = await authStore.resetPassword(email.value.trim())
    if (err) throw err
    success.value = true
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : null) || 'Failed to send reset email. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot-page">
    <div class="auth-page">
      <header>
        <div class="header-content">
          <router-link to="/" class="logo">Deployma</router-link>
          <router-link to="/login" class="back-link">← Back to Login</router-link>
        </div>
      </header>

      <div class="auth-container">
        <div class="auth-wrapper">
          <div class="auth-side">
            <h1 class="auth-title">Forgot Password</h1>
            <p class="auth-subtitle">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <div v-if="error" class="error-message">{{ error }}</div>

            <div v-if="success" class="success-box">
              <div class="success-icon">✉️</div>
              <h3>Check Your Email</h3>
              <p>We've sent a password reset link to <strong>{{ email }}</strong>. Check your inbox and follow the instructions.</p>
              <router-link to="/login" class="form-link">← Back to Sign In</router-link>
            </div>

            <form v-else @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label" for="forgot-email">Email Address</label>
                <input
                  v-model="email"
                  type="email"
                  id="forgot-email"
                  class="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button type="submit" class="submit-btn" :disabled="loading">
                {{ loading ? 'Sending…' : 'Send Reset Link' }}
              </button>

              <div style="text-align: center; margin-top: 16px">
                <router-link to="/login" class="form-link">← Back to Sign In</router-link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <footer>
        © 2026 Deployma. All rights reserved.
      </footer>
    </div>
  </div>
</template>

<style scoped>
.forgot-page {
  width: 100%;
  min-height: 100vh;
}

.forgot-page .auth-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.forgot-page .header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.forgot-page .auth-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.forgot-page .auth-wrapper {
  width: 100%;
  max-width: 500px;
  background: white;
  border: 3px solid var(--stroke);
  box-shadow: 8px 8px 0 var(--stroke);
}

.forgot-page .auth-side {
  padding: 50px;
}

.forgot-page .auth-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

.auth-subtitle {
  font-size: 16px;
  color: var(--paragraph);
  margin-bottom: 32px;
}

.forgot-page .submit-btn {
  width: 100%;
}

.success-box {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.success-box h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

.success-box p {
  color: var(--paragraph);
  margin-bottom: 20px;
  line-height: 1.6;
}

@media (max-width: 480px) {
  .forgot-page .auth-side {
    padding: 30px 20px;
  }

  .forgot-page .auth-title {
    font-size: 24px;
  }
}
</style>
