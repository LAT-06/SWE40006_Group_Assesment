<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// Login form
const loginEmail = ref("");
const loginPassword = ref("");
const rememberMe = ref(false);
const loginError = ref("");
const loginSuccess = ref("");

const handleLogin = async () => {
  loginError.value = "";
  loginSuccess.value = "";

  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = "Please fill in all fields";
    return;
  }

  if (!isValidEmail(loginEmail.value)) {
    loginError.value = "Please enter a valid email address";
    return;
  }

  const { error } = await authStore.signIn(
    loginEmail.value,
    loginPassword.value,
    rememberMe.value,
  );

  if (error) {
    loginError.value = error.message || "Login failed. Please try again.";
  } else {
    loginSuccess.value = "Login successful! Redirecting...";
    setTimeout(() => {
      // Redirect to admin dashboard if user is admin, otherwise to home
      if (authStore.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }, 1500);
  }
};

const handleGoogleLogin = async () => {
  const { error } = await authStore.signInWithGoogle();
  if (error) {
    loginError.value = "Google sign in failed. Please try again.";
  }
};

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
</script>

<template>
  <div class="login-page">
    <div class="auth-page">
      <!-- Header -->
      <header>
        <div class="header-content">
          <router-link to="/" class="logo">Deployma</router-link>
          <router-link to="/" class="back-link">← Back to Home</router-link>
        </div>
      </header>

      <!-- Auth Container -->
      <div class="auth-container">
        <div class="auth-wrapper">
          <!-- Login Side -->
          <div class="auth-side login-side">
            <h1 class="auth-title">Welcome back</h1>
            <p class="auth-subtitle">
              Sign in to your account to continue shopping
            </p>

            <div v-if="loginError" class="error-message">{{ loginError }}</div>
            <div v-if="loginSuccess" class="success-message">
              {{ loginSuccess }}
            </div>

            <form @submit.prevent="handleLogin">
              <div class="form-group">
                <label class="form-label" for="login-email">Email Address</label>
                <input v-model="loginEmail" type="email" id="login-email" class="form-input"
                  placeholder="your@email.com" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="login-password">Password</label>
                <input v-model="loginPassword" type="password" id="login-password" class="form-input"
                  placeholder="Enter your password" required />
              </div>

              <div class="form-checkbox">
                <input v-model="rememberMe" type="checkbox" id="remember-me" />
                <label for="remember-me">Remember me</label>
              </div>

              <button type="submit" class="submit-btn" :disabled="authStore.loading">
                {{ authStore.loading ? "Signing in..." : "Sign In" }}
              </button>

              <div style="text-align: center; margin-bottom: 20px">
                <a href="#" class="form-link">Forgot password?</a>
              </div>
            </form>

            <div class="divider"><span>OR</span></div>

            <button class="social-btn" @click="handleGoogleLogin" :disabled="authStore.loading">
              <span>🔵</span>
              Continue with Google
            </button>

            <div class="signup-link-container">
              Don't have an account?
              <router-link to="/signup" class="form-link">Sign Up</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer>
        © 2026 Deployma. All rights reserved. | Terms of Service | Privacy
        Policy
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
}

.login-page .auth-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.login-page .header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Main Content */
.login-page .auth-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-page .auth-wrapper {
  width: 100%;
  max-width: 500px;
  background: white;
  border: 3px solid var(--stroke);
  box-shadow: 8px 8px 0 var(--stroke);
}

.login-page .auth-side {
  padding: 50px;
}

.login-page .auth-title {
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

.login-page .submit-btn {
  width: 100%;
  margin-bottom: 16px;
}

.signup-link-container {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 480px) {
  .login-page .auth-side {
    padding: 30px 20px;
  }

  .login-page .auth-title {
    font-size: 24px;
  }
}
</style>
