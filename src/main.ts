/**
 * Main entry point for the Dashboard Tiling System
 * 
 * This file initializes the Vue.js application with all necessary
 * dependencies including Pinia for state management, Vue Router,
 * and Bootstrap for UI components and styling.
 */

// Import CSS and Bootstrap
import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Import Font Awesome for icons
import '@fortawesome/fontawesome-free/css/all.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Create Vue application instance
const app = createApp(App)

// Configure Pinia store
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)

// Mount the application
app.mount('#app')

// Global error handler for better debugging
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error handler:', err, info)
}
