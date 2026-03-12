<template>
  <div class="legal-page">
    <div class="container">
      <h1>Terms of Service</h1>
      <p class="last-updated">Last updated: March 2026</p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Deployma ("the Service"), you agree to be bound by these Terms of
          Service. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Account Registration</h2>
        <p>
          You must provide accurate information when creating an account. You are responsible for
          maintaining the security of your account credentials and for all activity that occurs
          under your account.
        </p>
      </section>

      <section>
        <h2>3. Orders & Pricing</h2>
        <p>
          All prices are displayed in Australian Dollars (AUD) and include GST where applicable.
          We reserve the right to adjust prices at any time. Orders are subject to product
          availability, and we may cancel or modify orders if items are out of stock.
        </p>
      </section>

      <section>
        <h2>4. Delivery</h2>
        <p>
          Delivery is available within designated delivery zones. Delivery fees and timeframes
          vary by zone. We will make reasonable efforts to deliver within booked time slots but
          cannot guarantee exact delivery times.
        </p>
      </section>

      <section>
        <h2>5. Returns & Refunds</h2>
        <p>
          If you receive damaged, spoiled, or incorrect items, please contact us within 24 hours
          of delivery. We will arrange a replacement or refund at our discretion.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          Deployma is provided "as is" without warranties of any kind. To the maximum extent
          permitted by law, we shall not be liable for indirect, incidental, or consequential
          damages arising from your use of the Service.
        </p>
      </section>

      <section>
        <h2>7. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Service after changes
          constitutes your acceptance of the updated Terms.
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
