<!--
  TileComponent - Individual tile with drag/resize capabilities

  This component represents a single tile in the dashboard grid.
  It handles its own drag and drop operations, resize functionality,
  and provides a clean interface for tile content.

  Key Features:
  - Drag and drop support
  - Resize handles (corner and edge)
  - Visual states (hover, active, dragging, resizing)
  - Delete functionality with confirmation
  - Grid-based positioning and sizing
  - Touch support for mobile devices
-->

<template>
  <div
    ref="tileElement"
    class="tile-component"
    :class="tileClasses"
    :style="tileStyle"
    :draggable="!isResizing"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <!-- Tile Header -->
    <div class="tile-header">
      <!-- Drag Handle (moved to front) -->
      <div
        class="drag-handle-inline"
        @mousedown.stop="startDragFromHandle"
        @touchstart.stop="startTouchDragFromHandle"
        :title="'Drag ' + tile.title"
      >
        <i class="fas fa-grip-vertical" aria-hidden="true"></i>
      </div>

      <h6 class="tile-title" :title="tile.title">
        {{ tile.title }}
      </h6>

      <div class="tile-controls">
        <button
          class="btn btn-outline-secondary btn-sm tile-control-btn"
          type="button"
          @click="handleEdit"
          :title="'Edit ' + tile.title"
          aria-label="Edit tile"
        >
          <i class="fas fa-edit" aria-hidden="true"></i>
        </button>

        <button
          class="btn btn-outline-danger btn-sm tile-control-btn"
          type="button"
          @click="handleDelete"
          :title="'Delete ' + tile.title"
          aria-label="Delete tile"
        >
          <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- Tile Content -->
    <div class="tile-content">
      <div class="tile-placeholder">
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
      v-if="isResizing"
      class="resize-indicator"
    >
      <div class="resize-indicator-content">
        <strong>{{ currentResizeWidth }}×{{ currentResizeHeight }}</strong>
        <br>
        <small>{{ currentResizeWidth * currentResizeHeight }} units</small>
      </div>
    </div>

    <!-- Resize Handles -->
    <div
      v-if="!isDragging"
      class="resize-handles"
    >
      <!-- Corner resize handle (southeast) -->
      <div
        class="resize-handle resize-handle-se"
        @mousedown.stop="startResize('se', $event)"
        @touchstart.stop="startTouchResize('se', $event)"
        title="Resize tile"
        aria-label="Resize tile"
      >
        <i class="fas fa-expand-alt" aria-hidden="true"></i>
      </div>

      <!-- Edge resize handles -->
      <div
        class="resize-handle resize-handle-e"
        @mousedown.stop="startResize('e', $event)"
        @touchstart.stop="startTouchResize('e', $event)"
        title="Resize width"
        aria-label="Resize tile width"
      ></div>

      <div
        class="resize-handle resize-handle-s"
        @mousedown.stop="startResize('s', $event)"
        @touchstart.stop="startTouchResize('s', $event)"
        title="Resize height"
        aria-label="Resize tile height"
      ></div>
    </div>

    <!-- Selection Indicator -->
    <div
      v-if="isSelected"
      class="selection-indicator"
    ></div>

    <!-- Dragging Ghost -->
    <div
      v-if="isDragging"
      class="drag-ghost"
      :style="dragGhostStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Tile } from '@/types/dashboard';
import { DEFAULT_TILE_SIZE } from '@/types/dashboard';
import { useDashboardStore } from '@/stores/dashboard';

// Props
interface Props {
  tile: Tile;
  gridColumns: number;
  gridGap: number;
  rowHeight: number;
  isDragging?: boolean;
  isResizing?: boolean;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  isResizing: false,
  isSelected: false,
});

// Emits
interface Emits {
  tileDelete: [tileId: string];
  tileEdit: [tileId: string];
  dragStart: [tileId: string];
  dragMove: [position: { x: number; y: number }];
  dragEnd: [commit: boolean];
  resizeStart: [tileId: string, handle: 'se' | 'e' | 's'];
  resizeMove: [size: { width: number; height: number }];
  resizeEnd: [commit: boolean];
}

const emit = defineEmits<Emits>();

// Refs
const tileElement = ref<HTMLElement>();

// State
const isMouseDown = ref(false);
const dragStartPosition = ref<{ x: number; y: number } | null>(null);
const resizeStartData = ref<{
  handle: 'se' | 'e' | 's';
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
} | null>(null);

// Computed properties
const tileClasses = computed(() => ({
  'tile-dragging': props.isDragging,
  'tile-resizing': props.isResizing,
  'tile-selected': props.isSelected,
  'tile-hover': !props.isDragging && !props.isResizing,
}));

const tileStyle = computed(() => {
  const columnWidth = 100 / props.gridColumns;

  // Use current resize dimensions when resizing, otherwise use tile dimensions
  let currentWidth = props.tile.width;
  let currentHeight = props.tile.height;

  // Check if this tile is being resized and get current size from store
  const dashboardStore = useDashboardStore();
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
    '--column-width': `${columnWidth}%`,
  };
});

/**
 * Current resize width for real-time display
 */
const currentResizeWidth = computed(() => {
  const dashboardStore = useDashboardStore();
  if (props.isResizing && dashboardStore.resizeState.currentSize) {
    return dashboardStore.resizeState.currentSize.width;
  }
  return props.tile.width;
});

/**
 * Current resize height for real-time display
 */
const currentResizeHeight = computed(() => {
  const dashboardStore = useDashboardStore();
  if (props.isResizing && dashboardStore.resizeState.currentSize) {
    return dashboardStore.resizeState.currentSize.height;
  }
  return props.tile.height;
});

const dragGhostStyle = computed(() => ({
  position: 'fixed' as const,
  pointerEvents: 'none' as const,
  zIndex: 1000,
  opacity: 0.7,
}));

// Methods

/**
 * Calculates grid position from pixel coordinates
 * @param {number} clientX - X coordinate in pixels
 * @param {number} clientY - Y coordinate in pixels
 * @returns {object} Grid position
 */
function getGridPositionFromCoordinates(clientX: number, clientY: number): { x: number; y: number } {
  const container = tileElement.value?.closest('.grid-container') as HTMLElement;
  if (!container) return { x: 0, y: 0 };

  const rect = container.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;

  const columnWidth = rect.width / props.gridColumns;

  return {
    x: Math.max(0, Math.min(props.gridColumns - props.tile.width, Math.floor(relativeX / columnWidth))),
    y: Math.max(0, Math.floor(relativeY / props.rowHeight)),
  };
}

// Tile operations

/**
 * Handles tile deletion
 */
function handleDelete(): void {
  emit('tileDelete', props.tile.id);
}

/**
 * Handles tile editing (placeholder for future content editing)
 */
function handleEdit(): void {
  emit('tileEdit', props.tile.id);
  // For now, just show an alert - in the future this would open an edit modal
  alert(`Edit functionality for "${props.tile.title}" - Coming in Phase 2!`);
}

// Drag and drop handlers

/**
 * Handles HTML5 drag start event
 * @param {DragEvent} event - Drag event
 */
function handleDragStart(event: DragEvent): void {
  if (props.isResizing) {
    event.preventDefault();
    return;
  }

  // Set drag data for HTML5 drag and drop
  event.dataTransfer?.setData('text/plain', props.tile.id);

  const rect = tileElement.value?.getBoundingClientRect();
  if (rect && event.dataTransfer) {
    event.dataTransfer.setDragImage(tileElement.value!, event.clientX - rect.left, event.clientY - rect.top);
  }

  emit('dragStart', props.tile.id);
}

/**
 * Handles HTML5 drag end event
 * @param {DragEvent} event - Drag event
 */
function handleDragEnd(): void {
  emit('dragEnd', true);
}

/**
 * Starts drag from the drag handle
 * @param {MouseEvent} event - Mouse event
 */
function startDragFromHandle(event: MouseEvent): void {
  event.preventDefault();

  if (props.isResizing) return;

  dragStartPosition.value = { x: event.clientX, y: event.clientY };
  isMouseDown.value = true;

  emit('dragStart', props.tile.id);

  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragStop);
}

/**
 * Starts touch drag from the drag handle
 * @param {TouchEvent} event - Touch event
 */
function startTouchDragFromHandle(event: TouchEvent): void {
  event.preventDefault();

  if (props.isResizing || event.touches.length !== 1) return;

  const touch = event.touches[0];
  dragStartPosition.value = { x: touch.clientX, y: touch.clientY };
  isMouseDown.value = true;

  emit('dragStart', props.tile.id);

  document.addEventListener('touchmove', handleTouchDragMove, { passive: false });
  document.addEventListener('touchend', handleTouchDragStop);
}

/**
 * Handles mouse down on tile (for drag initiation)
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseDown(event: MouseEvent): void {
  // Only start drag if clicking on the tile content, not controls
  if ((event.target as HTMLElement).closest('.tile-controls') ||
      (event.target as HTMLElement).closest('.resize-handle')) {
    return;
  }

  startDragFromHandle(event);
}

/**
 * Handles touch start on tile (for drag initiation)
 * @param {TouchEvent} event - Touch event
 */
function handleTouchStart(event: TouchEvent): void {
  // Only start drag if touching the tile content, not controls
  if ((event.target as HTMLElement).closest('.tile-controls') ||
      (event.target as HTMLElement).closest('.resize-handle')) {
    return;
  }

  startTouchDragFromHandle(event);
}

/**
 * Handles drag move
 * @param {MouseEvent} event - Mouse event
 */
function handleDragMove(event: MouseEvent): void {
  if (!isMouseDown.value || !dragStartPosition.value) return;

  event.preventDefault();

  const position = getGridPositionFromCoordinates(event.clientX, event.clientY);
  emit('dragMove', position);
}

/**
 * Handles touch drag move
 * @param {TouchEvent} event - Touch event
 */
function handleTouchDragMove(event: TouchEvent): void {
  if (!isMouseDown.value || !dragStartPosition.value || event.touches.length !== 1) return;

  event.preventDefault();

  const touch = event.touches[0];
  const position = getGridPositionFromCoordinates(touch.clientX, touch.clientY);
  emit('dragMove', position);
}

/**
 * Handles drag stop
 */
function handleDragStop(): void {
  if (!isMouseDown.value) return;

  isMouseDown.value = false;
  dragStartPosition.value = null;

  emit('dragEnd', true);

  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragStop);
}

/**
 * Handles touch drag stop
 */
function handleTouchDragStop(): void {
  if (!isMouseDown.value) return;

  isMouseDown.value = false;
  dragStartPosition.value = null;

  emit('dragEnd', true);

  document.removeEventListener('touchmove', handleTouchDragMove);
  document.removeEventListener('touchend', handleTouchDragStop);
}

// Resize handlers

/**
 * Starts resize operation
 * @param {'se' | 'e' | 's'} handle - Resize handle type
 * @param {MouseEvent} event - Mouse event
 */
function startResize(handle: 'se' | 'e' | 's', event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();

  if (props.isDragging) return;

  resizeStartData.value = {
    handle,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: props.tile.width,
    startHeight: props.tile.height,
  };

  emit('resizeStart', props.tile.id, handle);

  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeStop);
}

/**
 * Starts touch resize operation
 * @param {'se' | 'e' | 's'} handle - Resize handle type
 * @param {TouchEvent} event - Touch event
 */
function startTouchResize(handle: 'se' | 'e' | 's', event: TouchEvent): void {
  event.preventDefault();
  event.stopPropagation();

  if (props.isDragging || event.touches.length !== 1) return;

  const touch = event.touches[0];
  resizeStartData.value = {
    handle,
    startX: touch.clientX,
    startY: touch.clientY,
    startWidth: props.tile.width,
    startHeight: props.tile.height,
  };

  emit('resizeStart', props.tile.id, handle);

  document.addEventListener('touchmove', handleTouchResizeMove, { passive: false });
  document.addEventListener('touchend', handleTouchResizeStop);
}

/**
 * Handles resize move
 * @param {MouseEvent} event - Mouse event
 */
function handleResizeMove(event: MouseEvent): void {
  if (!resizeStartData.value) return;

  event.preventDefault();

  const deltaX = event.clientX - resizeStartData.value.startX;
  const deltaY = event.clientY - resizeStartData.value.startY;

  calculateAndEmitNewSize(deltaX, deltaY);
}

/**
 * Handles touch resize move
 * @param {TouchEvent} event - Touch event
 */
function handleTouchResizeMove(event: TouchEvent): void {
  if (!resizeStartData.value || event.touches.length !== 1) return;

  event.preventDefault();

  const touch = event.touches[0];
  const deltaX = touch.clientX - resizeStartData.value.startX;
  const deltaY = touch.clientY - resizeStartData.value.startY;

  calculateAndEmitNewSize(deltaX, deltaY);
}

/**
 * Calculates and emits new size based on deltas
 * @param {number} deltaX - X delta in pixels
 * @param {number} deltaY - Y delta in pixels
 */
function calculateAndEmitNewSize(deltaX: number, deltaY: number): void {
  if (!resizeStartData.value) return;

  const container = tileElement.value?.closest('.grid-container') as HTMLElement;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const columnWidth = rect.width / props.gridColumns;

  let newWidth = resizeStartData.value.startWidth;
  let newHeight = resizeStartData.value.startHeight;

  // Calculate new dimensions based on handle type
  switch (resizeStartData.value.handle) {
    case 'se':
      newWidth = resizeStartData.value.startWidth + Math.round(deltaX / columnWidth);
      newHeight = resizeStartData.value.startHeight + Math.round(deltaY / props.rowHeight);
      break;
    case 'e':
      newWidth = resizeStartData.value.startWidth + Math.round(deltaX / columnWidth);
      break;
    case 's':
      newHeight = resizeStartData.value.startHeight + Math.round(deltaY / props.rowHeight);
      break;
  }

  // Apply constraints
  const minWidth = props.tile.minWidth || DEFAULT_TILE_SIZE.minWidth;
  const minHeight = props.tile.minHeight || DEFAULT_TILE_SIZE.minHeight;
  const maxWidth = Math.min(props.tile.maxWidth || props.gridColumns, props.gridColumns - props.tile.x);
  const maxHeight = props.tile.maxHeight || 20;

  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

  emit('resizeMove', { width: newWidth, height: newHeight });
}

/**
 * Handles resize stop
 */
function handleResizeStop(): void {
  if (!resizeStartData.value) return;

  resizeStartData.value = null;
  emit('resizeEnd', true);

  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeStop);
}

/**
 * Handles touch resize stop
 */
function handleTouchResizeStop(): void {
  if (!resizeStartData.value) return;

  resizeStartData.value = null;
  emit('resizeEnd', true);

  document.removeEventListener('touchmove', handleTouchResizeMove);
  document.removeEventListener('touchend', handleTouchResizeStop);
}

// Lifecycle
onMounted(() => {
  // Any initialization logic
});

onUnmounted(() => {
  // Clean up event listeners
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragStop);
  document.removeEventListener('touchmove', handleTouchDragMove);
  document.removeEventListener('touchend', handleTouchDragStop);
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeStop);
  document.removeEventListener('touchmove', handleTouchResizeMove);
  document.removeEventListener('touchend', handleTouchResizeStop);
});
</script>

<style scoped>
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

.tile-component.tile-dragging {
  opacity: 0.8;
  transform: rotate(2deg);
  z-index: 1000;
  cursor: grabbing;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.tile-component.tile-resizing {
  border-color: var(--bs-success);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  transform: scale(1.005);
}

.tile-component.tile-resizing {
  border-color: var(--bs-success);
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
}

.tile-component.tile-selected {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.tile-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--bs-light);
  border-bottom: 1px solid var(--bs-border-color);
  min-height: 40px;
}

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

.tile-title {
  flex: 1;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--bs-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

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
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1;
  border-radius: 4px;
}

.tile-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bs-white);
}

.tile-placeholder {
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
  color: var(--bs-muted);
  line-height: 1.4;
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  pointer-events: auto;
  z-index: 10;
}

.resize-handle-se {
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: se-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bs-secondary);
  background-color: var(--bs-white);
  border: 1px solid var(--bs-border-color);
  border-radius: 4px 0 0 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.resize-handle-e {
  top: 25%;
  right: -2px;
  width: 4px;
  height: 50%;
  cursor: e-resize;
  background-color: transparent;
  border-right: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.resize-handle-s {
  bottom: -2px;
  left: 25%;
  width: 50%;
  height: 4px;
  cursor: s-resize;
  background-color: transparent;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.tile-component:hover .resize-handle-se {
  opacity: 1;
}

.tile-component:hover .resize-handle-e {
  border-right-color: var(--bs-primary);
}

.tile-component:hover .resize-handle-s {
  border-bottom-color: var(--bs-primary);
}

.resize-handle-se:hover {
  color: var(--bs-primary);
  border-color: var(--bs-primary);
}

.selection-indicator {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--bs-primary);
  border-radius: 10px;
  pointer-events: none;
  animation: selection-pulse 2s infinite;
}

@keyframes selection-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.drag-ghost {
  position: fixed;
  background-color: rgba(0, 123, 255, 0.2);
  border: 2px dashed var(--bs-primary);
  border-radius: 8px;
  pointer-events: none;
}

/* Mobile responsiveness */
@media (max-width: 767px) {
  .tile-header {
    padding: 0.375rem 0.5rem;
    min-height: 36px;
  }

  .tile-title {
    font-size: 0.8rem;
  }

  .tile-content {
    padding: 0.75rem;
  }

  .tile-placeholder-icon {
    font-size: 1.5rem;
  }

  .tile-controls {
    opacity: 1; /* Always show on mobile */
  }

  .drag-handle-inline {
    opacity: 1; /* Always show on mobile */
  }

  .resize-handle-se {
    opacity: 1; /* Always show on mobile */
    width: 24px;
    height: 24px;
  }

  .resize-handle-e,
  .resize-handle-s {
    display: none; /* Hide edge handles on mobile for simplicity */
  }
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
  .resize-handle-se {
    transition: none;
  }

  .selection-indicator {
    animation: none;
  }
}

/* Real-time resize indicator */
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
</style>
