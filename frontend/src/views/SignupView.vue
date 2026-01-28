<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// Signup form
const signupName = ref("");
const signupEmail = ref("");
const signupPassword = ref("");
const signupConfirm = ref("");
const agreeToTerms = ref(false);
const signupError = ref("");
const signupSuccess = ref("");

const passwordStrength = computed(() => {
  const password = signupPassword.value;
  if (password.length === 0) return { level: "", text: "" };

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  if (strength <= 2) return { level: "weak", text: "Weak password" };
  if (strength <= 4) return { level: "medium", text: "Medium strength" };
  return { level: "strong", text: "Strong password" };
});

const handleSignup = async () => {
  signupError.value = "";
  signupSuccess.value = "";

  if (
    !signupName.value ||
    !signupEmail.value ||
    !signupPassword.value ||
    !signupConfirm.value
  ) {
    signupError.value = "Please fill in all fields";
    return;
  }

  if (!isValidEmail(signupEmail.value)) {
    signupError.value = "Please enter a valid email address";
    return;
  }

  if (signupPassword.value.length < 8) {
    signupError.value = "Password must be at least 8 characters long";
    return;
  }

  if (signupPassword.value !== signupConfirm.value) {
    signupError.value = "Passwords do not match";
    return;
  }

  if (!agreeToTerms.value) {
    signupError.value = "Please agree to the Terms and Privacy Policy";
    return;
  }

  const { error } = await authStore.signUp(
    signupEmail.value,
    signupPassword.value,
    signupName.value,
  );

  if (error) {
    signupError.value = error.message || "Signup failed. Please try again.";
  } else {
    signupSuccess.value = "Account created successfully! Redirecting...";
    setTimeout(() => {
      router.push("/");
    }, 1500);
  }
};

const handleGoogleLogin = async () => {
  const { error } = await authStore.signInWithGoogle();
  if (error) {
    signupError.value = "Google sign in failed. Please try again.";
  }
};

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
</script>

<template>
  <div class="signup-page">
    <div class="auth-page">
      <!-- Header -->
      <header>
        <div class="header-content">
          <router-link to="/" class="logo">FreshCart</router-link>
          <router-link to="/" class="back-link">← Back to Home</router-link>
        </div>
      </header>

      <!-- Auth Container -->
      <div class="auth-container">
        <div class="auth-wrapper">
          <!-- Signup Side -->
          <div class="auth-side signup-side">
            <h1 class="auth-title">Create account</h1>
            <p class="auth-subtitle">
              Join FreshCart and get fresh groceries delivered
            </p>

            <div v-if="signupError" class="error-message">{{ signupError }}</div>
            <div v-if="signupSuccess" class="success-message">
              {{ signupSuccess }}
            </div>

            <form @submit.prevent="handleSignup">
              <div class="form-group">
                <label class="form-label" for="signup-name">Full Name</label>
                <input
                  v-model="signupName"
                  type="text"
                  id="signup-name"
                  class="form-input"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="signup-email">Email Address</label>
                <input
                  v-model="signupEmail"
                  type="email"
                  id="signup-email"
                  class="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="signup-password">Password</label>
                <input
                  v-model="signupPassword"
                  type="password"
                  id="signup-password"
                  class="form-input"
                  placeholder="Create a strong password"
                  required
                />
                <div class="password-strength">
                  <div class="strength-bar">
                    <div
                      class="strength-fill"
                      :class="passwordStrength.level"
                    ></div>
                  </div>
                  <div class="strength-text">{{ passwordStrength.text }}</div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="signup-confirm"
                  >Confirm Password</label
                >
                <input
                  v-model="signupConfirm"
                  type="password"
                  id="signup-confirm"
                  class="form-input"
                  placeholder="Re-enter your password"
                  required
                />
              </div>

              <div class="form-checkbox">
                <input
                  v-model="agreeToTerms"
                  type="checkbox"
                  id="terms"
                  required
                />
                <label for="terms"
                  >I agree to the <a href="#" class="form-link">Terms</a> and
                  <a href="#" class="form-link">Privacy Policy</a></label
                >
              </div>

              <button
                type="submit"
                class="submit-btn"
                :disabled="authStore.loading"
              >
                {{ authStore.loading ? "Creating account..." : "Create Account" }}
              </button>
            </form>

            <div class="divider"><span>OR</span></div>

            <button
              class="social-btn"
              @click="handleGoogleLogin"
              :disabled="authStore.loading"
            >
              <span>🔵</span>
              Sign up with Google
            </button>

            <div class="login-link-container">
                Already have an account? <router-link to="/login" class="form-link">Sign In</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer>
        © 2026 FreshCart. All rights reserved. | Terms of Service | Privacy Policy
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

.signup-page {
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

.signup-page .auth-page {
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
.signup-page header {
  background: var(--bg);
  border-bottom: 3px solid var(--stroke);
  padding: 20px 0;
}

.signup-page .header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.signup-page .logo {
  font-family: "Space Mono", monospace;
  font-size: 28px;
  font-weight: 700;
  color: var(--headline);
  text-decoration: none;
}

.signup-page .back-link {
  color: var(--headline);
  text-decoration: none;
  font-weight: 500;
  padding: 10px 20px;
  border: 3px solid var(--stroke);
  background: white;
  transition: all 0.2s;
}

.signup-page .back-link:hover {
  background: var(--main);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

/* Main Content */
.signup-page .auth-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.signup-page .auth-wrapper {
  width: 100%;
  max-width: 500px;
  background: white;
  border: 3px solid var(--stroke);
  box-shadow: 8px 8px 0 var(--stroke);
}

.signup-page .auth-side {
  padding: 50px;
}

.signup-page .auth-side.signup-side {
  background: var(--main);
}

.signup-page .auth-title {
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
.signup-page .form-group {
  margin-bottom: 24px;
}

.signup-page .form-label {
  display: block;
  font-weight: 600;
  color: var(--headline);
  margin-bottom: 8px;
  font-size: 14px;
}

.signup-page .form-input {
  width: 100%;
  padding: 14px 16px;
  border: 3px solid var(--stroke);
  font-size: 16px;
  font-family: "DM Sans", sans-serif;
  background: white;
  outline: none;
  transition: all 0.2s;
}

.signup-page .form-input:focus {
  border-color: var(--button);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.signup-page .form-input::placeholder {
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

.signup-page .submit-btn {
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

.signup-page .submit-btn:hover:not(:disabled) {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.signup-page .submit-btn:active:not(:disabled) {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 var(--stroke);
}

.signup-page .submit-btn:disabled {
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

.signup-side .divider span {
  background: var(--main);
}

.signup-page .social-btn {
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

.signup-page .social-btn:hover:not(:disabled) {
  background: var(--secondary);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.signup-page .social-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 6px;
  background: #ddd;
  border: 2px solid var(--stroke);
  margin-bottom: 8px;
}

.strength-fill {
  height: 100%;
  width: 0%;
  background: var(--button);
  transition: all 0.3s;
}

.strength-fill.weak {
  width: 33%;
  background: #ff6b6b;
}

.strength-fill.medium {
  width: 66%;
  background: #ffd93d;
}

.strength-fill.strong {
  width: 100%;
  background: #6bcf7f;
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--paragraph);
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
.signup-page footer {
  background: var(--headline);
  color: white;
  padding: 30px 0;
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
}

.login-link-container {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
}
</style>
