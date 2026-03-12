<template>
  <div class="careers-page">
    <div class="container">
      <!-- Hero -->
      <section class="page-hero">
        <h1>Careers at Deployma</h1>
        <p class="hero-subtitle">
          Join our team and help deliver fresh groceries to thousands of households every day.
        </p>
      </section>

      <!-- Why Join -->
      <section class="page-section">
        <h2>Why Work With Us</h2>
        <div class="perks-grid">
          <div class="perk-card">
            <div class="perk-icon">🚀</div>
            <h3>Growth Opportunities</h3>
            <p>We invest in our people with training, mentorship, and clear career paths.</p>
          </div>
          <div class="perk-card">
            <div class="perk-icon">🏡</div>
            <h3>Flexible Work</h3>
            <p>Hybrid and remote options available for many roles across the company.</p>
          </div>
          <div class="perk-card">
            <div class="perk-icon">💚</div>
            <h3>Mission-Driven</h3>
            <p>Make a real impact by connecting communities with fresh, affordable food.</p>
          </div>
          <div class="perk-card">
            <div class="perk-icon">🎉</div>
            <h3>Great Benefits</h3>
            <p>Competitive salary, health cover, employee discounts, and team events.</p>
          </div>
        </div>
      </section>

      <!-- Open Positions -->
      <section class="page-section">
        <h2>Open Positions</h2>
        <div class="positions-list">
          <div class="position-card">
            <div class="position-info">
              <h3>Full-Stack Developer</h3>
              <span class="position-tag">Engineering</span>
              <span class="position-tag">Remote</span>
            </div>
            <span class="position-type">Full-time</span>
          </div>
          <div class="position-card">
            <div class="position-info">
              <h3>Delivery Operations Manager</h3>
              <span class="position-tag">Operations</span>
              <span class="position-tag">Melbourne</span>
            </div>
            <span class="position-type">Full-time</span>
          </div>
          <div class="position-card">
            <div class="position-info">
              <h3>Customer Support Specialist</h3>
              <span class="position-tag">Support</span>
              <span class="position-tag">Hybrid</span>
            </div>
            <span class="position-type">Full-time</span>
          </div>
          <div class="position-card">
            <div class="position-info">
              <h3>UX/UI Designer</h3>
              <span class="position-tag">Design</span>
              <span class="position-tag">Remote</span>
            </div>
            <span class="position-type">Contract</span>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="page-cta">
        <h2>Don't see a role that fits?</h2>
        <p>We're always looking for talented people. Send your CV to <strong>careers@deployma.com</strong> and we'll be in touch.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.careers-page {
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

.perks-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.perk-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 24px;
}

.perk-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.perk-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.perk-card p {
  color: var(--paragraph);
  font-size: 14px;
  line-height: 1.6;
}

.positions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.position-card {
  background: white;
  border: 3px solid var(--stroke);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.position-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 var(--stroke);
}

.position-info h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 8px;
}

.position-tag {
  display: inline-block;
  background: var(--main);
  border: 2px solid var(--stroke);
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
}

.position-type {
  font-weight: 700;
  font-size: 14px;
  color: var(--paragraph);
  white-space: nowrap;
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
  line-height: 1.6;
}

@media (max-width: 640px) {
  .page-hero h1 {
    font-size: 32px;
  }

  .perks-grid {
    grid-template-columns: 1fr;
  }

  .position-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
