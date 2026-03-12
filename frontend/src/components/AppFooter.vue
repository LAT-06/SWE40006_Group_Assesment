<template>
  <footer>
    <div class="container">
      <div class="footer-bottom">
        &copy; {{ year }} Deployma. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
footer {
  background: var(--headline);
  color: white;
  padding: 30px 0;
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
}

.footer-bottom {
  text-align: center;
}
</style>
