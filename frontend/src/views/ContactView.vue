<template>
  <div class="contact-page">
    <div class="container">
      <!-- Hero -->
      <section class="page-hero">
        <h1>Contact Us</h1>
        <p class="hero-subtitle">
          Have a question, suggestion, or issue? We'd love to hear from you.
        </p>
      </section>

      <div class="contact-grid">
        <!-- Contact Form -->
        <section class="contact-form-section">
          <h2>Send Us a Message</h2>
          <form class="contact-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="name">Full Name</label>
              <input id="name" v-model="form.name" type="text" required maxlength="100" placeholder="Your name" />
            </div>
            <div class="form-group">
              <label for="email">Email Address</label>
              <input id="email" v-model="form.email" type="email" required maxlength="150" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label for="subject">Subject</label>
              <select id="subject" v-model="form.subject" required>
                <option value="" disabled>Select a topic</option>
                <option value="order">Order Issue</option>
                <option value="delivery">Delivery Question</option>
                <option value="product">Product Inquiry</option>
                <option value="account">Account Help</option>
                <option value="feedback">General Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" v-model="form.message" required maxlength="2000" rows="5" placeholder="Tell us how we can help..."></textarea>
            </div>
            <button type="submit" class="submit-btn" :disabled="submitted">
              {{ submitted ? 'Message Sent ✓' : 'Send Message' }}
            </button>
          </form>
        </section>

        <!-- Contact Info -->
        <section class="contact-info-section">
          <h2>Other Ways to Reach Us</h2>
          <div class="info-cards">
            <div class="info-card">
              <div class="info-icon">📧</div>
              <h3>Email</h3>
              <p>support@deployma.com</p>
            </div>
            <div class="info-card">
              <div class="info-icon">📞</div>
              <h3>Phone</h3>
              <p>1800 DEPLOY (1800 337 569)</p>
              <p class="info-note">Mon–Fri, 8 AM – 6 PM AEST</p>
            </div>
            <div class="info-card">
              <div class="info-icon">📍</div>
              <h3>Office</h3>
              <p>123 Grocery Lane<br />Melbourne VIC 3000<br />Australia</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const submitted = ref(false)

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

function handleSubmit() {
  submitted.value = true
  toast.success('Thank you! Your message has been sent. We\'ll get back to you soon.')
}
</script>

<style scoped>
.contact-page {
  min-height: 80vh;
  padding: 60px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-hero {
  text-align: center;
  margin-bottom: 60px;
}

.page-hero h1 {
  font-size: 48px;
  font-weight: 900;
  color: var(--headline);
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 20px;
  color: var(--paragraph);
  max-width: 550px;
  margin: 0 auto;
  line-height: 1.6;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}

.contact-form-section h2,
.contact-info-section h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 24px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group label {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: var(--headline);
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 3px solid var(--stroke);
  font-size: 15px;
  font-family: inherit;
  background: white;
  color: var(--headline);
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--button);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.submit-btn {
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.submit-btn:hover:not(:disabled) {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.info-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
}

.info-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.info-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 6px;
}

.info-card p {
  color: var(--paragraph);
  font-size: 15px;
  line-height: 1.6;
}

.info-note {
  font-size: 13px !important;
  opacity: 0.7;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }

  .page-hero h1 {
    font-size: 32px;
  }
}
</style>
