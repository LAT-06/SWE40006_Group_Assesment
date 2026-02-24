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
  } catch (e: any) {
    error.value = e.message || "Failed to update password.";
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
  background: #fef6e4;
}
.reset-box {
  background: white;
  border: 3px solid #001858;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
}
h2 { color: #001858; margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
label { display: block; font-weight: 600; margin-bottom: 6px; color: #001858; }
input {
  width: 100%; padding: 10px 14px; border: 2px solid #001858;
  border-radius: 8px; font-size: 15px; box-sizing: border-box;
}
.submit-btn {
  width: 100%; padding: 12px; background: #001858; color: white;
  border: none; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer;
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #e74c3c; margin-bottom: 12px; }
.success-msg { color: #27ae60; font-weight: 600; }
</style>
