<!--
  Main Application Component for Dashboard Tiling System
  
  This is the root component that sets up the dashboard application
  with Bootstrap styling and navigation.
-->

<script setup lang="ts">
import { onMounted } from 'vue';
import DashboardContainer from './components/DashboardContainer.vue';

// Initialize Bootstrap JavaScript components when the app mounts
onMounted(() => {
  // This ensures Bootstrap's JavaScript is available for dropdowns, modals, etc.
  if (typeof window !== 'undefined' && (window as unknown as { bootstrap: unknown }).bootstrap) {
    console.log('Bootstrap JavaScript loaded successfully');
  }
});
</script>

<template>
  <div id="app" class="min-vh-100">
    <!-- Main Dashboard -->
    <DashboardContainer />
  </div>
</template>

<style>
/* Global styles for the dashboard application */
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Ensure full height for proper layout */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

/* Custom CSS variables for consistent theming */
:root {
  --dashboard-primary: #007bff;
  --dashboard-secondary: #6c757d;
  --dashboard-success: #28a745;
  --dashboard-danger: #dc3545;
  --dashboard-warning: #ffc107;
  --dashboard-info: #17a2b8;
  --dashboard-light: #f8f9fa;
  --dashboard-dark: #343a40;
  
  /* Grid system variables */
  --grid-gap: 8px;
  --container-padding: 16px;
  --tile-border-radius: 8px;
  --tile-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --tile-shadow-hover: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Utility classes for consistent spacing and layout */
.dashboard-card {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: var(--tile-border-radius);
  box-shadow: var(--tile-shadow);
  transition: box-shadow 0.15s ease-in-out;
}

.dashboard-card:hover {
  box-shadow: var(--tile-shadow-hover);
}

/* Focus styles for accessibility */
.btn:focus,
.form-control:focus,
.form-select:focus {
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Firefox scrollbar styles */
* {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* Prevent text selection during drag operations */
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Animation classes for smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
  
  .dashboard-container {
    background: white !important;
    box-shadow: none !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .dashboard-card {
    border-width: 2px;
  }
  
  .btn {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Dark mode support (preparation for future enhancement) */
@media (prefers-color-scheme: dark) {
  :root {
    --dashboard-light: #2d3748;
    --dashboard-dark: #f7fafc;
  }
}
</style>
