<template>
  <div class="about-page">
    <div class="container">
      <!-- Hero -->
      <section class="about-hero">
        <h1>About Deployma</h1>
        <p class="hero-subtitle">
          Fresh groceries delivered to your door — fast, reliable, and affordable.
        </p>
      </section>

      <!-- Mission -->
      <section class="about-section">
        <h2>Our Mission</h2>
        <p>
          At Deployma, we believe everyone deserves access to fresh, high-quality groceries
          without the hassle of crowded supermarkets. We partner with local farms and trusted
          suppliers to bring you the best produce, dairy, bakery items, and pantry staples —
          delivered right to your doorstep.
        </p>
      </section>

      <!-- Values -->
      <section class="about-section">
        <h2>What We Stand For</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">🥬</div>
            <h3>Freshness First</h3>
            <p>Every product is quality-checked before it leaves our warehouse.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🚚</div>
            <h3>Same-Day Delivery</h3>
            <p>Order before 2 PM and get your groceries the same day.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">💚</div>
            <h3>Sustainability</h3>
            <p>Eco-friendly packaging and optimised delivery routes to reduce our footprint.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🤝</div>
            <h3>Community</h3>
            <p>Supporting local farmers and producers in your neighbourhood.</p>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="about-section">
        <h2>How It Works</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>Browse & Add</h3>
            <p>Explore our categories and add items to your cart.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h3>Choose a Slot</h3>
            <p>Pick a delivery time that suits your schedule.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h3>We Deliver</h3>
            <p>Sit back while we bring fresh groceries to your door.</p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="about-cta">
        <h2>Ready to shop?</h2>
        <router-link to="/category" class="cta-btn">Start Shopping →</router-link>
      </section>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 80vh;
  padding: 60px 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.about-hero {
  text-align: center;
  margin-bottom: 60px;
}

.about-hero h1 {
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

.about-section {
  margin-bottom: 60px;
}

.about-section h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 20px;
}

.about-section > p {
  color: var(--paragraph);
  line-height: 1.8;
  font-size: 16px;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.value-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
}

.value-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.value-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.value-card p {
  color: var(--paragraph);
  font-size: 14px;
  line-height: 1.6;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.step-card {
  text-align: center;
  background: var(--main);
  border: 3px solid var(--stroke);
  padding: 24px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--button);
  color: var(--button-text);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 18px;
  margin: 0 auto 12px;
}

.step-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.step-card p {
  color: var(--paragraph);
  font-size: 14px;
  line-height: 1.5;
}

.about-cta {
  text-align: center;
  padding: 40px;
  background: var(--main);
  border: 3px solid var(--stroke);
}

.about-cta h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 20px;
}

.cta-btn {
  display: inline-block;
  background: var(--button);
  color: var(--button-text);
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 700;
  border: 3px solid var(--stroke);
  text-decoration: none;
  transition: all 0.2s;
}

.cta-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}

@media (max-width: 640px) {
  .about-hero h1 {
    font-size: 32px;
  }

  .values-grid,
  .steps-grid {
    grid-template-columns: 1fr;
  }
}
</style>
