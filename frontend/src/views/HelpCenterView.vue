<template>
  <div class="help-page">
    <div class="container">
      <!-- Hero -->
      <section class="page-hero">
        <h1>Help Center</h1>
        <p class="hero-subtitle">
          Find answers to common questions or get in touch with our support team.
        </p>
      </section>

      <!-- FAQ -->
      <section class="page-section">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-list">
          <details class="faq-item">
            <summary>How do I place an order?</summary>
            <p>Browse our categories, add items to your cart, then proceed to checkout. You'll need to create an account or sign in to complete your order.</p>
          </details>
          <details class="faq-item">
            <summary>What are the delivery hours?</summary>
            <p>We deliver 7 days a week. Available time slots vary by your delivery zone. You can view available slots during checkout.</p>
          </details>
          <details class="faq-item">
            <summary>Can I change or cancel my order?</summary>
            <p>You can modify or cancel your order within 30 minutes of placing it. After that, the order enters preparation and cannot be changed.</p>
          </details>
          <details class="faq-item">
            <summary>What if an item is out of stock?</summary>
            <p>If an item is unavailable, we'll notify you before delivery and offer a suitable substitute or a refund for that item.</p>
          </details>
          <details class="faq-item">
            <summary>How do I track my order?</summary>
            <p>Go to your profile and select "Orders" to see your order status, or use the <router-link to="/order-tracking">Order Tracking</router-link> page with your order ID.</p>
          </details>
          <details class="faq-item">
            <summary>What payment methods do you accept?</summary>
            <p>We accept Visa, Mastercard, American Express, and PayPal. All payments are processed securely.</p>
          </details>
          <details class="faq-item">
            <summary>Is there a minimum order value?</summary>
            <p>No — there is no minimum order required. However, free delivery is available on orders over $50.</p>
          </details>
          <details class="faq-item">
            <summary>How do I return a product?</summary>
            <p>Please see our <router-link to="/returns">Returns Policy</router-link> page for full details on how to request a return or refund.</p>
          </details>
        </div>
      </section>

      <!-- Still need help -->
      <section class="page-cta">
        <h2>Still need help?</h2>
        <p>Our support team is here for you.</p>
        <router-link to="/contact" class="cta-btn">Contact Us →</router-link>
      </section>
    </div>
  </div>
</template>

<style scoped>
.help-page {
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
  margin-bottom: 60px;
}

.page-section h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 20px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: white;
  border: 3px solid var(--stroke);
  padding: 0;
}

.faq-item summary {
  padding: 18px 24px;
  font-weight: 700;
  font-size: 16px;
  color: var(--headline);
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-item summary::after {
  content: '+';
  font-size: 22px;
  font-weight: 700;
  color: var(--headline);
  transition: transform 0.2s;
}

.faq-item[open] summary::after {
  content: '−';
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item p {
  padding: 0 24px 18px;
  color: var(--paragraph);
  line-height: 1.7;
  font-size: 15px;
}

.faq-item a {
  color: var(--button);
  font-weight: 600;
  text-decoration: underline;
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
}
</style>
