import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { initTelegramWebApp } from './telegram'

// Initialize Telegram Web App if available
initTelegramWebApp()

createApp(App).mount('#app')
