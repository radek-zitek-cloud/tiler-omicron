<!--
  DashboardContainer - Refactored main container for the dashboard tiling system

  This component serves as the primary container for the dashboard using
  composable architecture for better maintainability and separation of concerns.
  
  Refactored Architecture:
  - Uses useDashboardGrid composable for grid management
  - Uses useDashboardOperations composable for tile operations
  - Uses DashboardHeader component for header interface
  - Focused on layout coordination and event handling

  Key Features:
  - Responsive grid system with breakpoints
  - Drag and drop coordination via composables
  - Tile management and controls via composables
  - Layout persistence via composables
  - Visual feedback for operations
  - Modular header component
-->

<template>
  <div class="dashboard-container">
    <!-- Dashboard Header Component -->
    <DashboardHeader
      :operation-message="operationMessage"
      :operation-message-class="operationMessageClass"
      :is-operation-in-progress="isOperationInProgress"
      @add-tile="handleAddTile"
      @clear-dashboard="handleClearDashboard"
      @export-layout="exportLayout"
      @import-layout="importLayout"
      @show-layout-info="showLayoutInfo"
    />

    <!-- Grid Container -->
    <div
      ref="gridContainer"
      class="grid-container"
      :class="{
        'dragging': dashboardStore.dragState.isDragging,
        'resizing': dashboardStore.resizeState.isResizing
      }"
      :style="gridContainerStyle"
      @dragover.prevent
      @drop="handleGridDrop"
    >
      <!-- Grid Lines (for visual guidance during operations) -->
      <div
        v-if="showGridLines"
        class="grid-lines"
        :style="gridLinesStyle"
      >
        <div
          v-for="col in dashboardStore.gridColumns"
          :key="`col-${col}`"
          class="grid-line grid-line-vertical"
          :style="{ left: `${((col - 1) / dashboardStore.gridColumns) * 100}%` }"
        ></div>
      </div>

      <!-- Tiles -->
      <TileComponent
        v-for="tile in dashboardStore.tiles"
        :key="tile.id"
        :tile="tile"
        :grid-columns="dashboardStore.gridColumns"
        :grid-gap="dashboardStore.gridConfig.gap"
        :row-height="dashboardStore.gridConfig.rowHeight"
        :is-dragging="dashboardStore.dragState.draggedTileId === tile.id"
        :is-resizing="dashboardStore.resizeState.resizedTileId === tile.id"
        @tile-delete="handleTileDelete"
        @tile-edit="handleTileEdit"
        @drag-start="handleDragStart"
        @drag-move="handleDragMove"
        @drag-end="handleDragEnd"
        @resize-start="handleResizeStart"
        @resize-move="handleResizeMove"
        @resize-end="handleResizeEnd"
      />

      <!-- Drop Zone Indicator -->
      <div
        v-if="dashboardStore.dragState.isDragging && dropZone"
        class="drop-zone-indicator"
        :style="dropZoneStyle"
      >
        <div class="drop-zone-content">
          <i class="fas fa-crosshairs" aria-hidden="true"></i>
          <span class="drop-zone-text">Drop here</span>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="dashboardStore.tiles.length === 0"
        class="empty-state"
      >
        <div class="empty-state-content">
          <i class="fas fa-th-large empty-state-icon" aria-hidden="true"></i>
          <h3 class="empty-state-title">No tiles yet</h3>
          <p class="empty-state-text">
            Start building your dashboard by adding your first tile using the Actions menu above.
          </p>
          <button
            class="btn btn-primary btn-lg"
            @click="() => handleAddTile()"
          >
            <i class="fas fa-plus me-2" aria-hidden="true"></i>
            Add Your First Tile
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden file input for importing layouts -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />

    <!-- Confirmation Modal -->
    <div
      class="modal fade"
      id="confirmationModal"
      ref="confirmationModal"
      tabindex="-1"
      aria-labelledby="confirmationModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="confirmationModalLabel">
              {{ confirmationTitle }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p>{{ confirmationMessage }}</p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="confirmAction"
              data-bs-dismiss="modal"
            >
              {{ confirmationAction }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DashboardContainer - Refactored with Composable Architecture
 * 
 * Main dashboard container that orchestrates grid management, tile operations,
 * and user interactions using dedicated composables for better separation of concerns.
 * 
 * Architecture:
 * - useDashboardGrid: Handles grid layout and drag/drop zones
 * - useDashboardOperations: Manages tile operations and layout management
 * - DashboardHeader: Separate component for header controls
 * 
 * @author Dashboard System
 * @version 2.0.0 (Refactored)
 */

import { ref, onMounted } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import { useDashboardGrid } from '@/composables/useDashboardGrid';
import { useDashboardOperations } from '@/composables/useDashboardOperations';
import TileComponent from './TileComponent.vue';
import DashboardHeader from './DashboardHeader.vue';

// Dashboard store access
const dashboardStore = useDashboardStore();

// Template refs
const gridContainer = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const confirmationModal = ref<HTMLElement>();

/**
 * Initialize grid management composable
 * 
 * Provides grid layout, drag zones, and visual feedback functionality.
 */
const {
  showGridLines,
  dropZone,
  isOperationInProgress,
  gridContainerStyle,
  gridLinesStyle,
  dropZoneStyle,
  updateDropZone,
  clearDropZone,
  showGridLinesTemporary,
  hideGridLines,
  handleGridDrop,
} = useDashboardGrid({
  gridContainer,
});

/**
 * Initialize dashboard operations composable
 * 
 * Provides tile management, layout operations, and user feedback.
 */
const {
  operationMessage,
  operationMessageClass,
  confirmationTitle,
  confirmationMessage,
  confirmationAction,
  handleAddTile,
  handleTileDelete,
  handleTileEdit,
  handleClearDashboard,
  exportLayout,
  importLayout,
  handleFileImport,
  showLayoutInfo,
  confirmAction,
} = useDashboardOperations({
  confirmationModal,
  fileInput,
});

/**
 * Handles drag start event from tiles
 * 
 * Initiates drag operation in the store and shows visual feedback.
 * 
 * @param tileId - ID of the tile being dragged
 */
function handleDragStart(tileId: string): void {
  dashboardStore.startDrag(tileId);
  showGridLinesTemporary();
  console.debug(`Drag started for tile: ${tileId}`);
}

/**
 * Handles drag move event from tiles
 * 
 * Updates drag position in store and manages drop zone visualization.
 * 
 * @param position - Current drag position in grid coordinates
 */
function handleDragMove(position: { x: number; y: number }): void {
  dashboardStore.updateDrag(position.x, position.y);

  // Update drop zone visualization
  const draggedTile = dashboardStore.tiles.find(
    t => t.id === dashboardStore.dragState.draggedTileId
  );
  
  if (draggedTile) {
    updateDropZone(position, draggedTile);
  }
}

/**
 * Handles drag end event from tiles
 * 
 * Completes drag operation and cleans up visual feedback.
 * 
 * @param commit - Whether to commit the move operation
 */
function handleDragEnd(commit: boolean = true): void {
  const wasSuccessful = commit && dashboardStore.dragState.currentPosition;
  
  dashboardStore.endDrag(commit);
  clearDropZone();
  hideGridLines();
  
  if (wasSuccessful) {
    console.debug('Drag operation completed successfully');
  } else {
    console.debug('Drag operation cancelled or failed');
  }
}

/**
 * Handles resize start event from tiles
 * 
 * Initiates resize operation in the store.
 * 
 * @param tileId - ID of the tile being resized
 * @param handle - Type of resize handle being used
 */
function handleResizeStart(tileId: string, handle: 'se' | 'e' | 's'): void {
  dashboardStore.startResize(tileId, handle);
  console.debug(`Resize started for tile: ${tileId}, handle: ${handle}`);
}

/**
 * Handles resize move event from tiles
 * 
 * Updates resize dimensions in the store for real-time feedback.
 * 
 * @param size - New size dimensions
 */
function handleResizeMove(size: { width: number; height: number }): void {
  dashboardStore.updateResize(size.width, size.height);
}

/**
 * Handles resize end event from tiles
 * 
 * Completes resize operation and applies final dimensions.
 * 
 * @param commit - Whether to commit the resize operation
 */
function handleResizeEnd(commit: boolean = true): void {
  const wasSuccessful = commit && dashboardStore.resizeState.currentSize;
  
  dashboardStore.endResize(commit);
  
  if (wasSuccessful) {
    console.debug('Resize operation completed successfully');
  } else {
    console.debug('Resize operation cancelled or failed');
  }
}

/**
 * Component lifecycle: onMounted
 * 
 * Performs initialization when the component is mounted.
 * Loads saved layout and sets up any necessary event listeners.
 */
onMounted(() => {
  // Load saved layout if available
  try {
    dashboardStore.loadLayout();
    console.debug('Dashboard container mounted and layout loaded');
  } catch (error) {
    console.error('Failed to load layout on mount:', error);
  }
});
</script>

<style scoped>
/**
 * DashboardContainer Styles
 * 
 * Comprehensive styling for the dashboard container including grid layout,
 * drag/drop visual feedback, and responsive design.
 */

.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bs-light);
}

/* Grid container */
.grid-container {
  flex: 1;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  grid-auto-rows: var(--row-height);
  gap: var(--grid-gap);
  padding: var(--container-padding);
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* Allow flex shrinking */
}

/* Grid container states */
.grid-container.dragging {
  background-color: rgba(0, 123, 255, 0.05);
}

.grid-container.resizing {
  background-color: rgba(40, 167, 69, 0.05);
}

/* Grid lines for visual guidance */
.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.grid-line {
  position: absolute;
  background-color: rgba(0, 123, 255, 0.3);
  pointer-events: none;
}

.grid-line-vertical {
  width: 1px;
  height: 100%;
  opacity: 0.6;
}

/* Drop zone indicator */
.drop-zone-indicator {
  position: absolute;
  background-color: rgba(0, 123, 255, 0.2);
  border: 2px dashed var(--bs-primary);
  border-radius: 8px;
  z-index: 10;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--bs-primary);
  font-weight: 600;
  text-align: center;
}

.drop-zone-content .fas {
  font-size: 1.5rem;
  opacity: 0.8;
}

.drop-zone-text {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Empty state */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: var(--bs-secondary);
}

.empty-state-content {
  max-width: 400px;
  padding: 2rem;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
  color: var(--bs-primary);
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--bs-dark);
}

.empty-state-text {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: var(--bs-secondary);
}

/* Modal styling */
.modal-content {
  border-radius: 12px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-header {
  background-color: var(--bs-light);
  border-bottom: 1px solid var(--bs-border-color);
  border-radius: 12px 12px 0 0;
  padding: 1.25rem 1.5rem;
}

.modal-title {
  font-weight: 600;
  color: var(--bs-dark);
}

.modal-body {
  padding: 1.5rem;
  font-size: 1rem;
  line-height: 1.6;
}

.modal-footer {
  background-color: var(--bs-light);
  border-top: 1px solid var(--bs-border-color);
  border-radius: 0 0 12px 12px;
  padding: 1rem 1.5rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .grid-container {
    padding: calc(var(--container-padding) * 0.75);
    gap: calc(var(--grid-gap) * 0.75);
  }
  
  .empty-state {
    min-height: 300px;
  }
  
  .empty-state-content {
    padding: 1.5rem;
  }
  
  .empty-state-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .empty-state-title {
    font-size: 1.25rem;
  }
  
  .empty-state-text {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 576px) {
  .grid-container {
    padding: calc(var(--container-padding) * 0.5);
    gap: calc(var(--grid-gap) * 0.5);
  }
  
  .drop-zone-content {
    gap: 0.25rem;
  }
  
  .drop-zone-content .fas {
    font-size: 1.25rem;
  }
  
  .drop-zone-text {
    font-size: 0.75rem;
  }
}

/* Animation for smooth transitions */
.grid-container {
  transition: background-color 0.3s ease;
}

.drop-zone-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .grid-container,
  .drop-zone-indicator {
    transition: none;
    animation: none;
  }
}

/* Print styles */
@media print {
  .grid-container {
    overflow: visible;
    height: auto;
  }
  
  .drop-zone-indicator,
  .grid-lines {
    display: none;
  }
}
</style>