<template>
  <div class="not-found-page">
    <div class="not-found-box">
      <div class="not-found-icon">404</div>
      <h1>Page Not Found</h1>
      <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
      <div class="not-found-actions">
        <router-link to="/" class="btn-primary">Go Home</router-link>
        <router-link to="/category" class="btn-secondary">Browse Products</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.not-found-box {
  text-align: center;
  max-width: 500px;
}

.not-found-icon {
  font-size: 120px;
  font-weight: 900;
  color: var(--button);
  line-height: 1;
  margin-bottom: 16px;
  font-family: 'Space Mono', monospace;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--headline);
  margin-bottom: 12px;
}

p {
  font-size: 16px;
  color: var(--paragraph);
  margin-bottom: 32px;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  border: 3px solid var(--stroke);
  text-decoration: none;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-primary {
  background: var(--button);
  color: var(--button-text);
}

.btn-secondary {
  background: white;
  color: var(--headline);
}

.btn-primary:hover,
.btn-secondary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--stroke);
}
</style>
