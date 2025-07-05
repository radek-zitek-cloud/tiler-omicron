<!--
  DashboardContainer - Main container for the dashboard tiling system

  This component serves as the primary container for the dashboard,
  handling the grid layout, responsive behavior, and coordinating
  all tile operations.

  Key Features:
  - Responsive grid system with breakpoints
  - Drag and drop coordination
  - Tile management and controls
  - Layout persistence
  - Visual feedback for operations
-->

<template>
  <div class="dashboard-container">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="d-flex justify-content-between align-items-center">
        <h1 class="dashboard-title">
          {{ dashboardStore.currentLayout.name }}
        </h1>

        <div class="dashboard-controls">
          <button
            class="btn btn-primary btn-sm me-2"
            @click="handleAddTile"
            :disabled="isOperationInProgress"
          >
            <i class="fas fa-plus me-1" aria-hidden="true"></i>
            Add Tile
          </button>

          <button
            class="btn btn-outline-secondary btn-sm me-2"
            @click="handleClearDashboard"
            :disabled="isOperationInProgress || dashboardStore.tiles.length === 0"
          >
            <i class="fas fa-trash me-1" aria-hidden="true"></i>
            Clear All
          </button>

          <div class="dropdown">
            <button
              class="btn btn-outline-secondary btn-sm dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="fas fa-cog me-1" aria-hidden="true"></i>
              Options
            </button>
            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" href="#" @click.prevent="exportLayout">
                  <i class="fas fa-download me-1" aria-hidden="true"></i>
                  Export Layout
                </a>
              </li>
              <li>
                <a class="dropdown-item" href="#" @click.prevent="importLayout">
                  <i class="fas fa-upload me-1" aria-hidden="true"></i>
                  Import Layout
                </a>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <a class="dropdown-item" href="#" @click.prevent="showLayoutInfo">
                  <i class="fas fa-info-circle me-1" aria-hidden="true"></i>
                  Layout Info
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Compact Status Info -->
        <div class="dashboard-status-compact ms-3">
          <small class="text-muted">
            {{ dashboardStore.tiles.length }} tiles • {{ dashboardStore.gridColumns }} cols
          </small>
          <div v-if="operationMessage" class="ms-2">
            <small :class="operationMessageClass">
              {{ operationMessage }}
            </small>
          </div>
        </div>
      </div>
    </div>

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
        :is-dragging="dashboardStore.dragState.draggedTileId === tile.id"
        :is-resizing="dashboardStore.resizeState.resizedTileId === tile.id"
        @tile-delete="handleTileDelete"
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
      ></div>

      <!-- Empty State -->
      <div
        v-if="dashboardStore.tiles.length === 0"
        class="empty-state"
      >
        <div class="empty-state-content">
          <i class="fas fa-th-large empty-state-icon" aria-hidden="true"></i>
          <h3 class="empty-state-title">No tiles yet</h3>
          <p class="empty-state-text">
            Start building your dashboard by adding your first tile.
          </p>
          <button
            class="btn btn-primary btn-lg"
            @click="handleAddTile"
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
            {{ confirmationMessage }}
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import type { DashboardLayout, Tile } from '@/types/dashboard';
import TileComponent from './TileComponent.vue';

// Store
const dashboardStore = useDashboardStore();

// Refs
const gridContainer = ref<HTMLElement>();
const confirmationModal = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();

// State
const operationMessage = ref<string>('');
const operationMessageClass = ref<string>('text-success');
const showGridLines = ref<boolean>(false);
const dropZone = ref<{ x: number; y: number; width: number; height: number } | null>(null);

// Confirmation modal state
const confirmationTitle = ref<string>('');
const confirmationMessage = ref<string>('');
const confirmationAction = ref<string>('');
const pendingAction = ref<(() => void) | null>(null);

// Computed properties
const isOperationInProgress = computed(() =>
  dashboardStore.dragState.isDragging || dashboardStore.resizeState.isResizing
);

const gridContainerStyle = computed(() => ({
  '--grid-columns': dashboardStore.gridColumns,
  '--grid-gap': `${dashboardStore.gridConfig.gap}px`,
  '--container-padding': `${dashboardStore.gridConfig.padding}px`,
}));

const gridLinesStyle = computed(() => ({
  '--grid-columns': dashboardStore.gridColumns,
}));

const dropZoneStyle = computed(() => {
  if (!dropZone.value) return {};

  return {
    left: `${(dropZone.value.x / dashboardStore.gridColumns) * 100}%`,
    top: `${dropZone.value.y * 60}px`, // Approximate row height
    width: `${(dropZone.value.width / dashboardStore.gridColumns) * 100}%`,
    height: `${dropZone.value.height * 60}px`,
  };
});

// Methods

/**
 * Shows an operation message to the user
 * @param {string} message - Message to display
 * @param {'success' | 'error' | 'info'} type - Message type
 */
function showOperationMessage(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
  operationMessage.value = message;
  operationMessageClass.value = `text-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'}`;

  // Clear message after 3 seconds
  setTimeout(() => {
    operationMessage.value = '';
  }, 3000);
}

/**
 * Shows a confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} action - Action button text
 * @param {Function} callback - Function to call on confirmation
 */
function showConfirmation(
  title: string,
  message: string,
  action: string,
  callback: () => void
): void {
  confirmationTitle.value = title;
  confirmationMessage.value = message;
  confirmationAction.value = action;
  pendingAction.value = callback;

  // Show modal using Bootstrap's modal API
  if (confirmationModal.value) {
    try {
      // Check if Bootstrap is available
      const windowWithBootstrap = window as unknown as { bootstrap?: { Modal: new (element: HTMLElement) => { show(): void } } };
      if (windowWithBootstrap.bootstrap && windowWithBootstrap.bootstrap.Modal) {
        const modal = new windowWithBootstrap.bootstrap.Modal(confirmationModal.value);
        modal.show();
      } else {
        // Fallback to direct confirmation if Bootstrap is not available
        if (confirm(`${title}\n\n${message}`)) {
          callback();
        }
      }
    } catch (error) {
      console.error('Error showing modal:', error);
      // Fallback to direct confirmation
      if (confirm(`${title}\n\n${message}`)) {
        callback();
      }
    }
  }
}

/**
 * Executes the pending confirmation action
 */
function confirmAction(): void {
  if (pendingAction.value) {
    pendingAction.value();
    pendingAction.value = null;
  }
}

// Tile operations

/**
 * Handles adding a new tile
 */
function handleAddTile(): void {
  try {
    const newTile = dashboardStore.createTile();
    showOperationMessage(`Created tile "${newTile.title}"`);
  } catch (error) {
    console.error('Failed to create tile:', error);
    showOperationMessage('Failed to create tile', 'error');
  }
}

/**
 * Handles tile deletion with confirmation
 * @param {string} tileId - ID of tile to delete
 */
function handleTileDelete(tileId: string): void {
  const tile = dashboardStore.tiles.find(t => t.id === tileId);
  if (!tile) return;

  showConfirmation(
    'Delete Tile',
    `Are you sure you want to delete "${tile.title}"? This action cannot be undone.`,
    'Delete',
    () => {
      if (dashboardStore.deleteTile(tileId)) {
        showOperationMessage(`Deleted tile "${tile.title}"`);
      } else {
        showOperationMessage('Failed to delete tile', 'error');
      }
    }
  );
}

/**
 * Handles clearing all tiles with confirmation
 */
function handleClearDashboard(): void {
  showConfirmation(
    'Clear Dashboard',
    'Are you sure you want to remove all tiles? This action cannot be undone.',
    'Clear All',
    () => {
      const tileCount = dashboardStore.tiles.length;
      dashboardStore.clearDashboard();
      showOperationMessage(`Removed ${tileCount} tiles`);
    }
  );
}

// Drag and drop handlers

/**
 * Handles drag start event
 * @param {string} tileId - ID of tile being dragged
 */
function handleDragStart(tileId: string): void {
  dashboardStore.startDrag(tileId);
  showGridLines.value = true;
}

/**
 * Handles drag move event
 * @param {object} position - Current drag position
 */
function handleDragMove(position: { x: number; y: number }): void {
  dashboardStore.updateDrag(position.x, position.y);

  // Update drop zone visualization
  const draggedTile = dashboardStore.tiles.find(t => t.id === dashboardStore.dragState.draggedTileId);
  if (draggedTile) {
    dropZone.value = {
      x: position.x,
      y: position.y,
      width: draggedTile.width,
      height: draggedTile.height,
    };
  }
}

/**
 * Handles drag end event
 * @param {boolean} commit - Whether to commit the move
 */
function handleDragEnd(commit: boolean = true): void {
  const wasSuccessful = commit && dashboardStore.dragState.currentPosition;

  dashboardStore.endDrag(commit);
  showGridLines.value = false;
  dropZone.value = null;

  if (wasSuccessful) {
    showOperationMessage('Tile moved successfully');
  } else if (commit) {
    showOperationMessage('Invalid position for tile', 'error');
  }
}

/**
 * Handles grid drop event
 * @param {DragEvent} event - Drop event
 */
function handleGridDrop(event: DragEvent): void {
  event.preventDefault();

  if (!dashboardStore.dragState.isDragging) return;

  // Calculate grid position from drop coordinates
  const rect = gridContainer.value?.getBoundingClientRect();
  if (!rect) return;

  const x = Math.floor(((event.clientX - rect.left) / rect.width) * dashboardStore.gridColumns);
  const y = Math.floor((event.clientY - rect.top) / 60); // Approximate row height

  handleDragMove({ x, y });
  handleDragEnd(true);
}

// Resize handlers

/**
 * Handles resize start event
 * @param {string} tileId - ID of tile being resized
 * @param {string} handle - Resize handle being used
 */
function handleResizeStart(tileId: string, handle: 'se' | 'e' | 's'): void {
  dashboardStore.startResize(tileId, handle);
  showGridLines.value = true;
}

/**
 * Handles resize move event
 * @param {object} size - Current resize dimensions
 */
function handleResizeMove(size: { width: number; height: number }): void {
  dashboardStore.updateResize(size.width, size.height);
}

/**
 * Handles resize end event
 * @param {boolean} commit - Whether to commit the resize
 */
function handleResizeEnd(commit: boolean = true): void {
  const wasSuccessful = commit && dashboardStore.resizeState.currentSize;

  dashboardStore.endResize(commit);
  showGridLines.value = false;

  if (wasSuccessful) {
    showOperationMessage('Tile resized successfully');
  } else if (commit) {
    showOperationMessage('Invalid size for tile', 'error');
  }
}

// Layout management

/**
 * Exports the current layout as JSON
 */
function exportLayout(): void {
  try {
    const layoutData = JSON.stringify(dashboardStore.currentLayout, null, 2);
    const blob = new Blob([layoutData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-layout-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    showOperationMessage('Layout exported successfully');
  } catch (error) {
    console.error('Failed to export layout:', error);
    showOperationMessage('Failed to export layout', 'error');
  }
}

/**
 * Triggers the file input for importing a layout
 */
function importLayout(): void {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

/**
 * Handles file selection and import
 * @param {Event} event - File input change event
 */
function handleFileImport(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.json')) {
    showOperationMessage('Please select a valid JSON file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const layoutData = JSON.parse(content);

      // Validate the layout structure
      if (!validateLayoutData(layoutData)) {
        showOperationMessage('Invalid layout file format', 'error');
        return;
      }

      // Show confirmation before importing
      showConfirmation(
        'Import Layout',
        `This will replace your current dashboard with "${layoutData.name || 'Imported Layout'}". Current tiles will be lost. Continue?`,
        'Import',
        () => {
          try {
            importLayoutData(layoutData);
            showOperationMessage(`Layout "${layoutData.name || 'Imported Layout'}" imported successfully`);
          } catch (error) {
            console.error('Failed to import layout:', error);
            showOperationMessage('Failed to import layout', 'error');
          }
        }
      );
    } catch (error) {
      console.error('Failed to parse layout file:', error);
      showOperationMessage('Invalid JSON file format', 'error');
    }
  };

  reader.onerror = () => {
    showOperationMessage('Failed to read file', 'error');
  };

  reader.readAsText(file);

  // Reset the input value so the same file can be selected again
  target.value = '';
}

/**
 * Validates the imported layout data structure
 * @param {unknown} data - Data to validate
 * @returns {boolean} Whether the data is valid
 */
function validateLayoutData(data: unknown): data is {
  id: string;
  name: string;
  tiles: unknown[];
  gridColumns: number;
  created: string;
  modified: string;
} {
  if (typeof data !== 'object' || data === null) return false;

  const layout = data as Record<string, unknown>;

  // Check required properties
  if (typeof layout.id !== 'string') return false;
  if (typeof layout.name !== 'string') return false;
  if (!Array.isArray(layout.tiles)) return false;
  if (typeof layout.gridColumns !== 'number') return false;
  if (typeof layout.created !== 'string') return false;
  if (typeof layout.modified !== 'string') return false;

  // Validate tiles structure
  for (const tile of layout.tiles) {
    if (!validateTileData(tile)) return false;
  }

  return true;
}

/**
 * Validates individual tile data
 * @param {unknown} tile - Tile data to validate
 * @returns {boolean} Whether the tile data is valid
 */
function validateTileData(tile: unknown): boolean {
  if (typeof tile !== 'object' || tile === null) return false;

  const t = tile as Record<string, unknown>;

  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.x === 'number' &&
    typeof t.y === 'number' &&
    typeof t.width === 'number' &&
    typeof t.height === 'number' &&
    typeof t.created === 'string' &&
    typeof t.modified === 'string'
  );
}

/**
 * Imports the validated layout data into the dashboard
 * @param {object} layoutData - Validated layout data
 */
function importLayoutData(layoutData: {
  id: string;
  name: string;
  tiles: unknown[];
  gridColumns: number;
  created: string;
  modified: string;
}): void {
  // Convert string dates back to Date objects and properly type the tiles
  const importedLayout: DashboardLayout = {
    ...layoutData,
    tiles: layoutData.tiles.map((tile: unknown) => {
      const t = tile as Tile & {
        created: string;
        modified: string;
      };
      return {
        id: t.id,
        title: t.title,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        minWidth: t.minWidth,
        minHeight: t.minHeight,
        maxWidth: t.maxWidth,
        maxHeight: t.maxHeight,
        created: new Date(t.created),
        modified: new Date(t.modified),
      } as Tile;
    }),
    created: new Date(layoutData.created),
    modified: new Date(),
  };

  // Use the dashboard store to load the layout
  dashboardStore.loadLayoutData(importedLayout);
}

/**
 * Shows layout information
 */
function showLayoutInfo(): void {
  const layout = dashboardStore.currentLayout;
  const info = `
Layout: ${layout.name}
Tiles: ${layout.tiles.length}
Columns: ${layout.gridColumns}
Created: ${layout.created.toLocaleString()}
Modified: ${layout.modified.toLocaleString()}
  `.trim();

  alert(info); // Simple info display - could be enhanced with a proper modal
}

// Responsive handling

/**
 * Handles window resize for responsive behavior
 */
function handleWindowResize(): void {
  dashboardStore.updateBreakpoint(window.innerWidth);
}

// Lifecycle hooks

onMounted(() => {
  // Set up responsive behavior
  handleWindowResize();
  window.addEventListener('resize', handleWindowResize);

  // Load layout from localStorage
  dashboardStore.loadLayout();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
});

// Watch for breakpoint changes and show notification
watch(
  () => dashboardStore.currentBreakpoint,
  (newBreakpoint, oldBreakpoint) => {
    if (oldBreakpoint) {
      showOperationMessage(`Switched to ${newBreakpoint} layout`, 'info');
    }
  }
);
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: var(--bs-body-bg);
}

.dashboard-header {
  padding: 0.5rem var(--container-padding);
  background-color: var(--bs-light);
  border-bottom: 1px solid var(--bs-border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.dashboard-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--bs-dark);
  white-space: nowrap;
}

.dashboard-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dashboard-controls .btn {
  white-space: nowrap;
  font-size: 0.875rem;
}

.dashboard-status-compact {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.grid-container {
  position: relative;
  padding: var(--container-padding);
  min-height: calc(100vh - 120px);
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  gap: var(--grid-gap);
  transition: all 0.2s ease;
}

.grid-container.dragging {
  background-color: rgba(0, 123, 255, 0.05);
}

.grid-container.resizing {
  background-color: rgba(40, 167, 69, 0.05);
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.grid-line {
  position: absolute;
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.grid-line-vertical {
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--bs-primary);
}

.drop-zone-indicator {
  position: absolute;
  background-color: rgba(0, 123, 255, 0.2);
  border: 2px dashed var(--bs-primary);
  border-radius: 4px;
  pointer-events: none;
  z-index: 10;
  transition: all 0.1s ease;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.empty-state-content {
  max-width: 400px;
  padding: 2rem;
}

.empty-state-icon {
  font-size: 4rem;
  color: var(--bs-secondary);
  margin-bottom: 1rem;
}

.empty-state-title {
  color: var(--bs-dark);
  margin-bottom: 1rem;
}

.empty-state-text {
  color: var(--bs-secondary);
  margin-bottom: 2rem;
}

/* Responsive adjustments */
@media (max-width: 1199px) {
  .dashboard-header {
    padding: 0.5rem 1rem;
  }

  .grid-container {
    padding: 1rem;
  }
}

@media (max-width: 991px) {
  .dashboard-status-compact {
    display: none; /* Hide status on smaller screens to save space */
  }
}

@media (max-width: 767px) {
  .dashboard-header {
    padding: 0.375rem 0.75rem;
  }

  .dashboard-title {
    font-size: 1.1rem;
  }

  .dashboard-controls {
    gap: 0.25rem;
  }

  .dashboard-controls .btn {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }

  .empty-state-content {
    padding: 1rem;
  }

  .empty-state-icon {
    font-size: 3rem;
  }
}

@media (max-width: 575px) {
  .grid-container {
    display: block;
  }

  .dashboard-title {
    font-size: 1rem;
  }

  .dashboard-controls .btn {
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
  }

  .dashboard-controls .btn .fas {
    margin-right: 0.25rem !important;
  }
}
</style>
