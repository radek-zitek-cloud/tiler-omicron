<!--
  TileComponent - Refactored individual tile with composable architecture

  This component represents a single tile in the dashboard grid using
  composable architecture for better maintainability and reusability.
  
  Refactored Architecture:
  - Uses useTileDragDrop composable for drag and drop operations
  - Uses useTileResize composable for resize functionality
  - Uses TileEditModal component for edit interface
  - Focused on core tile rendering and event coordination

  Key Features:
  - Drag and drop support via composable
  - Resize handles (corner and edge) via composable
  - Visual states (hover, active, dragging, resizing)
  - Delete functionality with confirmation
  - Grid-based positioning and sizing
  - Touch support for mobile devices
  - Modular edit modal component
-->

<template>
  <div
    ref="tileElement"
    class="tile-component"
    :class="tileClasses"
    :style="tileStyle"
    :draggable="!props.isResizing"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <!-- Tile Header -->
    <div class="tile-header">
      <!-- Drag Handle -->
      <div
        class="drag-handle-inline"
        @mousedown.stop="startDragFromHandle"
        @touchstart.stop="startTouchDragFromHandle"
        :title="`Drag ${tile.title}`"
        role="button"
        tabindex="0"
        aria-label="Drag tile"
        @keydown.enter="$event.preventDefault()"
        @keydown.space="$event.preventDefault()"
      >
        <i class="fas fa-grip-vertical" aria-hidden="true"></i>
      </div>

      <!-- Tile Title -->
      <h6 class="tile-title" :title="tile.title">
        {{ tile.title }}
      </h6>

      <!-- Tile Controls -->
      <div class="tile-controls">
        <button
          class="btn btn-outline-secondary btn-sm tile-control-btn"
          type="button"
          @click="openEditModal"
          @mousedown.stop
          @touchstart.stop
          :title="`Edit ${tile.title}`"
          aria-label="Edit tile"
          :data-bs-toggle="'modal'"
          :data-bs-target="`#editModal-${tile.id}`"
        >
          <i class="fas fa-edit" aria-hidden="true"></i>
        </button>

        <button
          class="btn btn-outline-danger btn-sm tile-control-btn"
          type="button"
          @click="handleDelete"
          @mousedown.stop
          @touchstart.stop
          :title="`Delete ${tile.title}`"
          aria-label="Delete tile"
        >
          <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- Tile Content -->
    <div class="tile-content">
      <!-- Dynamic Content Renderer -->
      <TileContentRenderer
        v-if="tile.content"
        :content="tile.content"
        :tile-width="currentResizeWidth"
        :tile-height="currentResizeHeight"
      />

      <!-- Default Placeholder -->
      <div v-else class="tile-placeholder">
        <i class="fas fa-cube tile-placeholder-icon" aria-hidden="true"></i>
        <p class="tile-placeholder-text">
          Tile Content Area
        </p>
        <small class="tile-info">
          {{ currentResizeWidth }}×{{ currentResizeHeight }} grid units<br>
          Position: ({{ tile.x }}, {{ tile.y }})
        </small>
      </div>
    </div>

    <!-- Real-time Resize Indicator -->
    <div
      v-if="props.isResizing"
      class="resize-indicator"
    >
      <div class="resize-indicator-content">
        {{ currentResizeWidth }}×{{ currentResizeHeight }}
        <br>
        <small>Grid Units</small>
      </div>
    </div>

    <!-- Resize Handles -->
    <div
      v-if="!props.isDragging"
      class="resize-handle resize-handle-se"
      @mousedown.stop="startResize('se', $event)"
      @touchstart.stop="startTouchResize('se', $event)"
      :title="`Resize ${tile.title}`"
      tabindex="0"
      role="button"
      aria-label="Resize tile diagonally"
      @keydown.enter="$event.preventDefault()"
      @keydown.space="$event.preventDefault()"
    >
      <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i>
    </div>

    <div
      v-if="!props.isDragging && tile.width < props.gridColumns - tile.x"
      class="resize-handle resize-handle-e"
      @mousedown.stop="startResize('e', $event)"
      @touchstart.stop="startTouchResize('e', $event)"
      :title="`Resize width of ${tile.title}`"
      tabindex="0"
      role="button"
      aria-label="Resize tile width"
      @keydown.enter="$event.preventDefault()"
      @keydown.space="$event.preventDefault()"
    >
      <i class="fas fa-arrows-alt-h" aria-hidden="true"></i>
    </div>

    <div
      v-if="!props.isDragging"
      class="resize-handle resize-handle-s"
      @mousedown.stop="startResize('s', $event)"
      @touchstart.stop="startTouchResize('s', $event)"
      :title="`Resize height of ${tile.title}`"
      tabindex="0"
      role="button"
      aria-label="Resize tile height"
      @keydown.enter="$event.preventDefault()"
      @keydown.space="$event.preventDefault()"
    >
      <i class="fas fa-arrows-alt-v" aria-hidden="true"></i>
    </div>

    <!-- Edit Modal Component -->
    <TileEditModal
      ref="editModalComponent"
      :tile="tile"
      @tile-edit="handleTileEdit"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * TileComponent - Refactored with Composable Architecture
 * 
 * Main tile component that orchestrates drag/drop, resize, and edit operations
 * using dedicated composables for better separation of concerns and reusability.
 * 
 * Architecture:
 * - useTileDragDrop: Handles all drag and drop operations
 * - useTileResize: Manages resize functionality 
 * - TileEditModal: Separate component for edit interface
 * 
 * @author Dashboard System
 * @version 2.0.0 (Refactored)
 */

import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Tile } from '@/types/dashboard';
import { useDashboardStore } from '@/stores/dashboard';
import { useTileDragDrop } from '@/composables/useTileDragDrop';
import { useTileResize } from '@/composables/useTileResize';
import TileContentRenderer from './tile-content/TileContentRenderer.vue';
import TileEditModal from './TileEditModal.vue';

/**
 * Component props interface
 */
interface Props {
  tile: Tile;
  gridColumns: number;
  gridGap: number;
  rowHeight: number;
  isDragging?: boolean;
  isResizing?: boolean;
  isSelected?: boolean;
}

/**
 * Component emits interface  
 */
interface Emits {
  tileDelete: [tileId: string];
  tileEdit: [tileId: string, changes?: { title?: string; content?: object | null }];
  dragStart: [tileId: string];
  dragMove: [position: { x: number; y: number }];
  dragEnd: [commit: boolean];
  resizeStart: [tileId: string, handle: 'se' | 'e' | 's'];
  resizeMove: [size: { width: number; height: number }];
  resizeEnd: [commit: boolean];
}

// Props and emits setup
const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  isResizing: false,
  isSelected: false,
});

const emit = defineEmits<Emits>();

// Template refs
const tileElement = ref<HTMLElement>();
const editModalComponent = ref<InstanceType<typeof TileEditModal>>();

// Dashboard store for resize state access
const dashboardStore = useDashboardStore();

// Reactive state flags
const isDragginReactive = computed(() => props.isDragging);
const isResizingReactive = computed(() => props.isResizing);

/**
 * Initialize drag and drop composable
 * 
 * Provides all drag and drop functionality including mouse/touch events,
 * grid position calculation, and state management.
 */
const {
  handleDragStart,
  handleDragEnd,
  startDragFromHandle,
  startTouchDragFromHandle,
  handleMouseDown,
  handleTouchStart,
  cleanup: cleanupDragDrop,
} = useTileDragDrop({
  tile: props.tile,
  tileElement,
  gridColumns: props.gridColumns,
  rowHeight: props.rowHeight,
  isResizing: isResizingReactive,
  emit: (event: any, ...args: any[]) => (emit as any)(event, ...args),
});

/**
 * Initialize resize composable
 * 
 * Provides all resize functionality including multiple handles,
 * size constraints, and real-time feedback.
 */
const {
  startResize,
  startTouchResize,
  cleanup: cleanupResize,
} = useTileResize({
  tile: props.tile,
  tileElement,
  gridColumns: props.gridColumns,
  rowHeight: props.rowHeight,
  isDragging: isDragginReactive,
  emit: (event: any, ...args: any[]) => (emit as any)(event, ...args),
});

/**
 * Computed tile CSS classes for visual states
 * 
 * Determines visual appearance based on current interaction state.
 * 
 * @returns Object containing CSS class flags
 */
const tileClasses = computed(() => ({
  'tile-dragging': props.isDragging,
  'tile-resizing': props.isResizing,
  'tile-selected': props.isSelected,
  'tile-hover': !props.isDragging && !props.isResizing,
}));

/**
 * Computed tile CSS Grid styling
 * 
 * Calculates grid positioning and sizing with support for real-time
 * resize feedback from the dashboard store.
 * 
 * @returns CSS Grid style object
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
const tileStyle = computed(() => {
  // Use current resize dimensions when resizing, otherwise use tile dimensions
  let currentWidth = props.tile.width;
  let currentHeight = props.tile.height;

  // Get real-time resize dimensions from store if available
  if (props.isResizing && dashboardStore.resizeState.currentSize) {
    currentWidth = dashboardStore.resizeState.currentSize.width;
    currentHeight = dashboardStore.resizeState.currentSize.height;
  }

  return {
    gridColumn: `${props.tile.x + 1} / span ${currentWidth}`,
    gridRow: `${props.tile.y + 1} / span ${currentHeight}`,
    '--tile-x': props.tile.x,
    '--tile-y': props.tile.y,
    '--tile-width': currentWidth,
    '--tile-height': currentHeight,
    '--column-width': `${100 / props.gridColumns}%`,
  };
});

/**
 * Current resize width for real-time display
 * 
 * Shows current width during resize operations or normal width otherwise.
 * 
 * @returns Current tile width in grid units
 */
const currentResizeWidth = computed(() => {
  if (props.isResizing && dashboardStore.resizeState.currentSize) {
    return dashboardStore.resizeState.currentSize.width;
  }
  return props.tile.width;
});

/**
 * Current resize height for real-time display
 * 
 * Shows current height during resize operations or normal height otherwise.
 * 
 * @returns Current tile height in grid units
 */
const currentResizeHeight = computed(() => {
  if (props.isResizing && dashboardStore.resizeState.currentSize) {
    return dashboardStore.resizeState.currentSize.height;
  }
  return props.tile.height;
});

/**
 * Handles tile deletion
 * 
 * Emits deletion event to parent component for confirmation and processing.
 * The actual deletion logic is handled by the parent container.
 */
function handleDelete(): void {
  emit('tileDelete', props.tile.id);
  console.debug(`Delete requested for tile: ${props.tile.id}`);
}

/**
 * Opens the edit modal
 * 
 * Delegates to the edit modal component to handle form initialization
 * and display. Uses Bootstrap modal data attributes for triggering.
 */
function openEditModal(): void {
  editModalComponent.value?.handleEdit();
  console.debug(`Edit modal opened for tile: ${props.tile.id}`);
}

/**
 * Handles tile edit save event from modal
 * 
 * Processes edit changes from the modal component and forwards
 * them to the parent container.
 * 
 * @param tileId - ID of the tile being edited
 * @param changes - Object containing the changes made
 */
function handleTileEdit(
  tileId: string, 
  changes?: { title?: string; content?: object | null }
): void {
  emit('tileEdit', tileId, changes);
  console.debug(`Tile edit completed for ${tileId}:`, changes);
}

/**
 * Component lifecycle: onMounted
 * 
 * Performs any necessary initialization when the component is mounted.
 * Currently reserved for future initialization needs.
 */
onMounted(() => {
  console.debug(`Tile component mounted: ${props.tile.id}`);
});

/**
 * Component lifecycle: onUnmounted
 * 
 * Cleans up event listeners and resources to prevent memory leaks.
 * Calls cleanup functions from composables.
 */
onUnmounted(() => {
  cleanupDragDrop();
  cleanupResize();
  console.debug(`Tile component unmounted: ${props.tile.id}`);
});
</script>

<style scoped>
/**
 * TileComponent Styles
 * 
 * Comprehensive styling for tile appearance, interactions, and states.
 * Includes responsive design, accessibility features, and visual feedback.
 */

/* Base tile styling */
.tile-component {
  position: relative;
  background-color: var(--bs-white);
  border: 1px solid var(--bs-border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: move;
  user-select: none;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.tile-component:hover {
  border-color: var(--bs-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Interaction states */
.tile-component.tile-dragging {
  opacity: 0.8;
  transform: rotate(2deg);
  z-index: 1000;
  cursor: grabbing;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.tile-component.tile-resizing {
  border-color: var(--bs-success);
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
  transform: scale(1.005);
}

.tile-component.tile-selected {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* Tile header */
.tile-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--bs-light);
  border-bottom: 1px solid var(--bs-border-color);
  min-height: 40px;
}

/* Drag handle styling */
.drag-handle-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--bs-secondary);
  cursor: grab;
  opacity: 0.7;
  transition: all 0.2s ease;
  border-radius: 2px;
}

.drag-handle-inline:hover {
  color: var(--bs-primary);
  background-color: rgba(0, 123, 255, 0.1);
  opacity: 1;
}

.drag-handle-inline:active {
  cursor: grabbing;
}

/* Tile title */
.tile-title {
  flex: 1;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--bs-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tile controls */
.tile-controls {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tile-component:hover .tile-controls {
  opacity: 1;
}

.tile-control-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.tile-control-btn:hover {
  transform: scale(1.05);
}

/* Tile content area */
.tile-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Placeholder content */
.tile-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 1rem;
  text-align: center;
  color: var(--bs-secondary);
}

.tile-placeholder-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.6;
}

.tile-placeholder-text {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.tile-info {
  font-size: 0.75rem;
  opacity: 0.8;
  line-height: 1.3;
}

/* Resize indicator */
.resize-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(40, 167, 69, 0.95);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  pointer-events: none;
  min-width: 80px;
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.resize-indicator-content {
  line-height: 1.2;
}

.resize-indicator small {
  opacity: 0.9;
  font-size: 0.75rem;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  background: var(--bs-primary);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: nw-resize;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.tile-component:hover .resize-handle {
  opacity: 0.8;
}

.resize-handle:hover {
  opacity: 1;
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Specific resize handle positioning */
.resize-handle-se {
  bottom: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  cursor: se-resize;
}

.resize-handle-e {
  top: 50%;
  right: 2px;
  width: 12px;
  height: 40px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-handle-s {
  bottom: 2px;
  left: 50%;
  width: 40px;
  height: 12px;
  transform: translateX(-50%);
  cursor: s-resize;
}

/* Resize handle icons */
.resize-handle-se .fas {
  font-size: 10px;
}

.resize-handle-e .fas,
.resize-handle-s .fas {
  font-size: 8px;
}

/* Focus styles for accessibility */
.tile-control-btn:focus,
.drag-handle-inline:focus,
.resize-handle:focus {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .tile-component {
    border-width: 2px;
  }

  .tile-component:hover {
    border-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tile-component,
  .tile-controls,
  .drag-handle-inline,
  .resize-handle {
    transition: none;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tile-header {
    padding: 0.4rem 0.6rem;
  }
  
  .tile-title {
    font-size: 0.8rem;
  }
  
  .tile-control-btn {
    width: 24px;
    height: 24px;
  }
  
  .resize-handle {
    opacity: 0.6;
  }
}

/* Print styles */
@media print {
  .tile-controls,
  .resize-handle,
  .drag-handle-inline {
    display: none;
  }
  
  .tile-component {
    break-inside: avoid;
  }
}
</style>