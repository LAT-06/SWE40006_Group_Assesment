<template>
  <div class="returns-page">
    <div class="container">
      <!-- Hero -->
      <section class="page-hero">
        <h1>Returns Policy</h1>
        <p class="hero-subtitle">
          Your satisfaction is our priority. Here's how returns and refunds work at Deployma.
        </p>
      </section>

      <!-- Policy Sections -->
      <section class="page-section">
        <h2>Our Guarantee</h2>
        <p>
          We stand behind the quality of every product we deliver. If you receive an item that is
          damaged, expired, or not as described, we'll make it right — no questions asked.
        </p>
      </section>

      <section class="page-section">
        <h2>Eligible Returns</h2>
        <div class="policy-grid">
          <div class="policy-card accept">
            <h3>✅ We Accept Returns For</h3>
            <ul>
              <li>Damaged or broken items on arrival</li>
              <li>Expired or spoiled products</li>
              <li>Wrong items delivered</li>
              <li>Missing items from your order</li>
              <li>Products significantly different from description</li>
            </ul>
          </div>
          <div class="policy-card decline">
            <h3>❌ We Cannot Accept Returns For</h3>
            <ul>
              <li>Change of mind after delivery</li>
              <li>Items consumed or partially used</li>
              <li>Products stored improperly after delivery</li>
              <li>Orders reported more than 48 hours after delivery</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="page-section">
        <h2>How to Request a Return</h2>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Report the Issue</h3>
              <p>Go to your <router-link to="/profile">Profile → Orders</router-link> and select the order. Click "Report Issue" on the affected item within 48 hours of delivery.</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Provide Details</h3>
              <p>Describe the problem and attach a photo if possible. This helps us resolve your case quickly.</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Get Your Refund</h3>
              <p>Once approved, refunds are processed within 3–5 business days to your original payment method.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="page-section">
        <h2>Refund Timeline</h2>
        <div class="timeline-table">
          <div class="timeline-row header">
            <span>Method</span>
            <span>Processing Time</span>
          </div>
          <div class="timeline-row">
            <span>Credit / Debit Card</span>
            <span>3–5 business days</span>
          </div>
          <div class="timeline-row">
            <span>PayPal</span>
            <span>1–3 business days</span>
          </div>
          <div class="timeline-row">
            <span>Store Credit</span>
            <span>Instant</span>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="page-cta">
        <h2>Need help with a return?</h2>
        <p>Our support team is ready to assist you.</p>
        <router-link to="/contact" class="cta-btn">Contact Support →</router-link>
      </section>
    </div>
  </div>
</template>

<style scoped>
.returns-page {
  min-height: 80vh;
  padding: 60px 0;
}

.container {
  max-width: 900px;
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

.page-section {
  margin-bottom: 48px;
}

.page-section h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 16px;
}

.page-section > p {
  color: var(--paragraph);
  line-height: 1.8;
  font-size: 16px;
}

.policy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.policy-card {
  border: 3px solid var(--stroke);
  padding: 24px;
}

.policy-card.accept {
  background: #f0fdf4;
}

.policy-card.decline {
  background: #fef2f2;
}

.policy-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 14px;
}

.policy-card ul {
  list-style: none;
  padding: 0;
}

.policy-card li {
  color: var(--paragraph);
  font-size: 14px;
  line-height: 1.6;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.policy-card li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--headline);
  font-weight: 700;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
}

.step-number {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: var(--button);
  color: var(--button-text);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 18px;
}

.step-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 6px;
}

.step-content p {
  color: var(--paragraph);
  font-size: 14px;
  line-height: 1.6;
}

.step-content a {
  color: var(--button);
  font-weight: 600;
  text-decoration: underline;
}

.timeline-table {
  border: 3px solid var(--stroke);
  overflow: hidden;
}

.timeline-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 14px 24px;
  border-bottom: 2px solid var(--stroke);
  font-size: 15px;
  color: var(--paragraph);
}

.timeline-row:last-child {
  border-bottom: none;
}

.timeline-row.header {
  background: var(--headline);
  color: white;
  font-weight: 700;
}

.page-cta {
  text-align: center;
  background: var(--main);
  border: 3px solid var(--stroke);
  padding: 40px;
  margin-bottom: 40px;
}

.page-cta h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

.page-cta p {
  color: var(--paragraph);
  font-size: 16px;
  margin-bottom: 20px;
}

.cta-btn {
  background: var(--button);
  color: var(--button-text);
  border: 3px solid var(--stroke);
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
}

.cta-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

@media (max-width: 640px) {
  .page-hero h1 {
    font-size: 32px;
  }

  .policy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
