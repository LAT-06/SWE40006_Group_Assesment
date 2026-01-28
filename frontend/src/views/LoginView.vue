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
                <label class="form-label" for="login-email"
                  >Email Address</label
                >
                <input
                  v-model="loginEmail"
                  type="email"
                  id="login-email"
                  class="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="login-password">Password</label>
                <input
                  v-model="loginPassword"
                  type="password"
                  id="login-password"
                  class="form-input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div class="form-checkbox">
                <input v-model="rememberMe" type="checkbox" id="remember-me" />
                <label for="remember-me">Remember me</label>
              </div>

              <button
                type="submit"
                class="submit-btn"
                :disabled="authStore.loading"
              >
                {{ authStore.loading ? "Signing in..." : "Sign In" }}
              </button>

              <div style="text-align: center; margin-bottom: 20px">
                <a href="#" class="form-link">Forgot password?</a>
              </div>
            </form>

            <div class="divider"><span>OR</span></div>

            <button
              class="social-btn"
              @click="handleGoogleLogin"
              :disabled="authStore.loading"
            >
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
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.login-page {
  width: 100%;
  min-height: 100vh;
  --bg: #fef6e4;
  --headline: #001858;
  --paragraph: #172c66;
  --button: #f582ae;
  --button-text: #001858;
  --stroke: #001858;
  --main: #f3d2c1;
  --highlight: #fef6e4;
  --secondary: #8bd3dd;
  --tertiary: #f582ae;
}

.login-page .auth-page {
  width: 100%;
  min-height: 100vh;
  font-family: "DM Sans", sans-serif;
  background: var(--bg);
  color: var(--paragraph);
  line-height: 1.6;
  display: flex;
  flex-direction: column;
}

/* Header */
.login-page header {
  background: var(--bg);
  border-bottom: 3px solid var(--stroke);
  padding: 20px 0;
}

.login-page .header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-page .logo {
  font-family: "Space Mono", monospace;
  font-size: 28px;
  font-weight: 700;
  color: var(--headline);
  text-decoration: none;
}

.login-page .back-link {
  color: var(--headline);
  text-decoration: none;
  font-weight: 500;
  padding: 10px 20px;
  border: 3px solid var(--stroke);
  background: white;
  transition: all 0.2s;
}

.login-page .back-link:hover {
  background: var(--main);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
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

.login-page .auth-side.login-side {
  /* Removed border-right since it's single column now */
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

/* Form Elements */
.login-page .form-group {
  margin-bottom: 24px;
}

.login-page .form-label {
  display: block;
  font-weight: 600;
  color: var(--headline);
  margin-bottom: 8px;
  font-size: 14px;
}

.login-page .form-input {
  width: 100%;
  padding: 14px 16px;
  border: 3px solid var(--stroke);
  font-size: 16px;
  font-family: "DM Sans", sans-serif;
  background: white;
  outline: none;
  transition: all 0.2s;
}

.login-page .form-input:focus {
  border-color: var(--button);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.login-page .form-input::placeholder {
  color: #999;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.form-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  border: 3px solid var(--stroke);
  cursor: pointer;
}

.form-checkbox label {
  font-size: 14px;
  color: var(--paragraph);
  cursor: pointer;
}

.form-link {
  color: var(--headline);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid var(--button);
  padding-bottom: 1px;
  transition: color 0.2s;
}

.form-link:hover {
  color: var(--button);
}

.login-page .submit-btn {
  width: 100%;
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.login-page .submit-btn:hover:not(:disabled) {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.login-page .submit-btn:active:not(:disabled) {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 var(--stroke);
}

.login-page .submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
}

.divider::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 3px;
  background: var(--stroke);
}

.divider span {
  background: white;
  padding: 0 16px;
  position: relative;
  font-weight: 600;
  color: var(--headline);
}

.login-page .social-btn {
  width: 100%;
  background: white;
  color: var(--headline);
  border: 3px solid var(--stroke);
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-page .social-btn:hover:not(:disabled) {
  background: var(--secondary);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.login-page .social-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #ffe0e0;
  border: 3px solid #ff6b6b;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #d63031;
  font-weight: 600;
}

.success-message {
  background: #e0ffe0;
  border: 3px solid #6bcf7f;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #27ae60;
  font-weight: 600;
}

/* Footer */
.login-page footer {
  background: var(--headline);
  color: white;
  padding: 30px 0;
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
}

.signup-link-container {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 480px) {
  .auth-side {
    padding: 30px 20px;
  }

  .auth-title {
    font-size: 24px;
  }
}
</style>
