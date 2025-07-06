<!--
  DashboardHeader - Header component for dashboard controls and status

  This component provides the dashboard title, action controls, and status information.
  It's extracted from DashboardContainer for better separation of concerns.
  
  Features:
  - Dashboard title display
  - Actions dropdown menu (Add, Clear, Import, Export, Info)
  - Status information with tile count and grid info
  - Operation message display
  - Responsive design for different screen sizes
-->

<template>
  <div class="dashboard-header">
    <div class="d-flex justify-content-between align-items-center">
      <!-- Dashboard Title -->
      <h1 class="dashboard-title">
        {{ dashboardStore.currentLayout.name }}
      </h1>

      <!-- Action Controls -->
      <div class="dashboard-controls">
        <div class="dropdown">
          <button
            class="btn btn-outline-secondary btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            :disabled="isOperationInProgress"
            aria-label="Dashboard actions"
          >
            <i class="fas fa-ellipsis-v me-1" aria-hidden="true"></i>
            Actions
          </button>
          
          <ul class="dropdown-menu dropdown-menu-end">
            <!-- Add Tile -->
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="handleAddTile"
                :class="{ 'disabled': isOperationInProgress }"
                role="button"
                tabindex="0"
                @keydown.enter="handleAddTile"
                @keydown.space.prevent="handleAddTile"
              >
                <i class="fas fa-plus me-2" aria-hidden="true"></i>
                Add Tile
              </a>
            </li>
            
            <!-- Clear All -->
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="handleClearDashboard"
                :class="{ 
                  'disabled': isOperationInProgress || dashboardStore.tiles.length === 0 
                }"
                role="button"
                tabindex="0"
                @keydown.enter="handleClearDashboard"
                @keydown.space.prevent="handleClearDashboard"
              >
                <i class="fas fa-trash me-2" aria-hidden="true"></i>
                Clear All
                <small v-if="dashboardStore.tiles.length > 0" class="text-muted ms-1">
                  ({{ dashboardStore.tiles.length }} tiles)
                </small>
              </a>
            </li>
            
            <li><hr class="dropdown-divider"></li>
            
            <!-- Export Layout -->
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="exportLayout"
                :class="{ 'disabled': dashboardStore.tiles.length === 0 }"
                role="button"
                tabindex="0"
                @keydown.enter="exportLayout"
                @keydown.space.prevent="exportLayout"
              >
                <i class="fas fa-download me-2" aria-hidden="true"></i>
                Export Layout
              </a>
            </li>
            
            <!-- Import Layout -->
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="importLayout"
                :class="{ 'disabled': isOperationInProgress }"
                role="button"
                tabindex="0"
                @keydown.enter="importLayout"
                @keydown.space.prevent="importLayout"
              >
                <i class="fas fa-upload me-2" aria-hidden="true"></i>
                Import Layout
              </a>
            </li>
            
            <li><hr class="dropdown-divider"></li>
            
            <!-- Layout Info -->
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="showLayoutInfo"
                role="button"
                tabindex="0"
                @keydown.enter="showLayoutInfo"
                @keydown.space.prevent="showLayoutInfo"
              >
                <i class="fas fa-info-circle me-2" aria-hidden="true"></i>
                Layout Info
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Status Information -->
      <div class="dashboard-status-compact ms-3">
        <small class="text-muted">
          <span class="status-item">
            <i class="fas fa-th-small me-1" aria-hidden="true"></i>
            {{ dashboardStore.tiles.length }} tiles
          </span>
          <span class="status-separator">•</span>
          <span class="status-item">
            <i class="fas fa-grip-lines-vertical me-1" aria-hidden="true"></i>
            {{ dashboardStore.gridColumns }} cols
          </span>
        </small>
        
        <!-- Operation Message -->
        <div v-if="operationMessage" class="ms-2 operation-message">
          <small :class="operationMessageClass">
            <i 
              class="fas me-1" 
              :class="{
                'fa-check-circle': operationMessageClass.includes('success'),
                'fa-exclamation-triangle': operationMessageClass.includes('danger'),
                'fa-info-circle': operationMessageClass.includes('info'),
                'fa-exclamation-circle': operationMessageClass.includes('warning')
              }"
              aria-hidden="true"
            ></i>
            {{ operationMessage }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DashboardHeader Component
 * 
 * Provides dashboard navigation, controls, and status information.
 * Extracted from main DashboardContainer for better modularity.
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import { computed } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';

/**
 * Component props interface
 */
interface Props {
  operationMessage: string;
  operationMessageClass: string;
  isOperationInProgress: boolean;
}

/**
 * Component emits interface
 */
interface Emits {
  addTile: [];
  clearDashboard: [];
  exportLayout: [];
  importLayout: [];
  showLayoutInfo: [];
}

// Props and emits setup
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Dashboard store access
const dashboardStore = useDashboardStore();

/**
 * Computed property for dashboard statistics
 * 
 * Provides useful information about the current dashboard state
 * for display in the status section.
 * 
 * @returns Dashboard statistics object
 */
const dashboardStats = computed(() => {
  const tiles = dashboardStore.tiles;
  const totalArea = tiles.reduce((sum, tile) => sum + (tile.width * tile.height), 0);
  
  return {
    tileCount: tiles.length,
    gridColumns: dashboardStore.gridColumns,
    totalArea,
    avgTileSize: tiles.length > 0 ? Math.round(totalArea / tiles.length * 10) / 10 : 0,
    layoutName: dashboardStore.currentLayout.name,
  };
});

/**
 * Handles add tile action
 * 
 * Delegates to parent component for actual tile creation.
 */
function handleAddTile(): void {
  emit('addTile');
}

/**
 * Handles clear dashboard action
 * 
 * Delegates to parent component for confirmation and clearing.
 */
function handleClearDashboard(): void {
  emit('clearDashboard');
}

/**
 * Handles export layout action
 * 
 * Delegates to parent component for export functionality.
 */
function exportLayout(): void {
  emit('exportLayout');
}

/**
 * Handles import layout action
 * 
 * Delegates to parent component for import functionality.
 */
function importLayout(): void {
  emit('importLayout');
}

/**
 * Handles show layout info action
 * 
 * Delegates to parent component for info display.
 */
function showLayoutInfo(): void {
  emit('showLayoutInfo');
}
</script>

<style scoped>
/**
 * DashboardHeader Styles
 * 
 * Comprehensive styling for dashboard header including responsive design,
 * accessibility features, and visual hierarchy.
 */

.dashboard-header {
  background: var(--bs-white);
  border-bottom: 1px solid var(--bs-border-color);
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Dashboard title */
.dashboard-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--bs-dark);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

/* Control section */
.dashboard-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Dropdown menu enhancements */
.dropdown-menu {
  border-radius: 8px;
  border: 1px solid var(--bs-border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  min-width: 200px;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--bs-dark);
  transition: all 0.2s ease;
  border: none;
  background: none;
}

.dropdown-item:hover:not(.disabled) {
  background-color: var(--bs-primary);
  color: var(--bs-white);
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.dropdown-item i {
  width: 16px;
  text-align: center;
}

.dropdown-item small {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Status section */
.dashboard-status-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0; /* Allow text truncation */
}

.status-item {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.status-separator {
  margin: 0 0.5rem;
  opacity: 0.6;
}

/* Operation message */
.operation-message {
  display: flex;
  align-items: center;
  max-width: 200px;
}

.operation-message small {
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Action button styling */
.btn-outline-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .dashboard-title {
    font-size: 1.25rem;
    max-width: none;
    text-align: center;
  }
  
  .d-flex {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .dashboard-controls,
  .dashboard-status-compact {
    justify-content: center;
    margin-left: 0 !important;
  }
  
  .operation-message {
    max-width: none;
    justify-content: center;
  }
  
  .dropdown-menu {
    min-width: 180px;
  }
}

@media (max-width: 576px) {
  .dashboard-header {
    padding: 0.5rem 0.75rem;
  }
  
  .dashboard-title {
    font-size: 1.125rem;
  }
  
  .status-item {
    font-size: 0.75rem;
  }
  
  /* Stack status items on very small screens */
  .dashboard-status-compact {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .status-separator {
    display: none;
  }
}

/* Animation for operation messages */
.operation-message {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Focus states for accessibility */
.dropdown-item:focus {
  outline: 2px solid var(--bs-primary);
  outline-offset: -2px;
}

.btn:focus {
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .dashboard-header {
    border-bottom-width: 2px;
  }
  
  .dropdown-menu {
    border-width: 2px;
  }
}

/* Print styles */
@media print {
  .dashboard-controls {
    display: none;
  }
  
  .operation-message {
    display: none;
  }
  
  .dashboard-header {
    border-bottom: 1px solid #000;
    box-shadow: none;
  }
}
</style>