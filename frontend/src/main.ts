import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error]', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

app.use(createPinia())
app.use(router)

app.mount('#app')
