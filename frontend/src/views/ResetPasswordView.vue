<template>
  <div class="reset-page">
    <div class="reset-box">
      <h2>Set New Password</h2>
      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="success" class="success-msg">Password updated! <router-link to="/login">Sign in</router-link></p>
      <form v-if="!success" @submit.prevent="handleReset">
        <div class="form-group">
          <label>New Password</label>
          <input v-model="password" type="password" minlength="6" placeholder="At least 6 characters" required />
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input v-model="confirm" type="password" minlength="6" placeholder="Repeat your password" required />
        </div>
        <button class="submit-btn" type="submit" :disabled="loading">
          {{ loading ? "Updating…" : "Update Password" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const password = ref("");
const confirm = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

async function handleReset() {
  error.value = "";
  if (password.value !== confirm.value) {
    error.value = "Passwords do not match.";
    return;
  }
  loading.value = true;
  try {
    const { error: err } = await supabase.auth.updateUser({ password: password.value });
    if (err) throw err;
    success.value = true;
    setTimeout(() => router.push("/login"), 3000);
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : null) || "Failed to update password.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.reset-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-box {
  background: white;
  border: 3px solid var(--stroke);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

h2 {
  color: var(--headline);
  margin-bottom: 20px;
}

input {
  box-sizing: border-box;
  border-radius: 8px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--headline);
  color: white;
  border: none;
  border-radius: 8px;
  margin-top: 4px;
}

.error-msg {
  color: #e74c3c;
  margin-bottom: 12px;
}

.success-msg {
  color: #27ae60;
  font-weight: 600;
}
</style>
