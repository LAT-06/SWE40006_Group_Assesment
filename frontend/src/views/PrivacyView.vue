<template>
  <div class="legal-page">
    <div class="container">
      <h1>Privacy Policy</h1>
      <p class="last-updated">Last updated: March 2026</p>

      <section>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide when creating an account (name, email), placing
          orders (delivery address, phone number), and browsing our platform (usage analytics).
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>
          Your information is used to process orders, deliver groceries, communicate order
          updates, improve our service, and personalise your shopping experience. We do not sell
          your personal data to third parties.
        </p>
      </section>

      <section>
        <h2>3. Data Storage & Security</h2>
        <p>
          Your data is stored securely using industry-standard encryption. We use Supabase for
          authentication and data storage, which provides row-level security and encrypted
          connections.
        </p>
      </section>

      <section>
        <h2>4. Cookies</h2>
        <p>
          We use essential cookies to maintain your session and cart. We do not use third-party
          tracking cookies. Local storage is used to persist your cart between visits.
        </p>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data at any time through
          your profile settings. You may also request a copy of your data by contacting our
          support team.
        </p>
      </section>

      <section>
        <h2>6. Third-Party Services</h2>
        <p>
          We use Google OAuth for social sign-in. When you sign in with Google, their privacy
          policy applies to the data they collect. We only receive your name and email from
          Google.
        </p>
      </section>

      <section>
        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify registered users of
          significant changes via email. Continued use of the Service constitutes acceptance of
          the updated policy.
        </p>
      </section>

      <div class="back-link">
        <router-link to="/">← Back to Home</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 80vh;
  padding: 60px 0;
}

.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  font-size: 36px;
  font-weight: 900;
  color: var(--headline);
  margin-bottom: 8px;
}

.last-updated {
  color: var(--paragraph);
  opacity: 0.7;
  font-size: 14px;
  margin-bottom: 40px;
}

section {
  margin-bottom: 32px;
}

h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

p {
  color: var(--paragraph);
  line-height: 1.8;
  font-size: 15px;
}

.back-link {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid var(--stroke);
}

.back-link a {
  color: var(--button);
  font-weight: 700;
  text-decoration: none;
}
</style>
