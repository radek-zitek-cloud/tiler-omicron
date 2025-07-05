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
          @mousedown.stop
          @touchstart.stop
          :title="'Edit ' + tile.title"
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
          :title="'Delete ' + tile.title"
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

    <!-- Edit Modal -->
    <div
      class="modal fade"
      :id="`editModal-${tile.id}`"
      ref="editModal"
      tabindex="-1"
      :aria-labelledby="`editModalLabel-${tile.id}`"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h5 class="modal-title" :id="`editModalLabel-${tile.id}`">
              Edit Tile Properties
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSaveEdit">
              <div class="mb-3">
                <label :for="`tileTitle-${tile.id}`" class="form-label">
                  <strong>Title</strong>
                </label>
                <input
                  type="text"
                  class="form-control"
                  :id="`tileTitle-${tile.id}`"
                  v-model="editTitle"
                  :placeholder="tile.title"
                  maxlength="100"
                  required
                />
                <div class="form-text">
                  Enter a descriptive title for this tile (max 100 characters)
                </div>
              </div>

              <div class="mb-3">
                <label :for="`contentType-${tile.id}`" class="form-label">
                  <strong>Content Type</strong>
                </label>

                <select
                  class="form-select"
                  :id="`contentType-${tile.id}`"
                  v-model="editContentType"
                  @change="handleContentTypeChange"
                >
                  <option value="">No Content (Placeholder)</option>
                  <option
                    v-for="(typeInfo, type) in contentTypes"
                    :key="type"
                    :value="type"
                  >
                    {{ typeInfo.displayName }}
                  </option>
                </select>
                <div class="form-text">
                  {{ getContentTypeDescription(editContentType) }}
                </div>
              </div>

              <!-- Content Configuration -->
              <div v-if="editContentType" class="mb-3">
                <label class="form-label">
                  <strong>Content Configuration</strong>
                </label>

                <!-- Equity Quote Configuration -->
                <div v-if="editContentType === 'equity-quote'" class="content-config">
                  <div class="mb-2">
                    <label :for="`symbol-${tile.id}`" class="form-label">Stock Symbol</label>
                    <input
                      type="text"
                      class="form-control"
                      :id="`symbol-${tile.id}`"
                      v-model="editContentConfig.symbol"
                      placeholder="e.g., AAPL, GOOGL, MSFT"
                      maxlength="10"
                      style="text-transform: uppercase;"
                      required
                    />
                  </div>

                  <div class="row">
                    <div class="col-sm-6">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="`showChange-${tile.id}`"
                          v-model="editContentConfig.displayOptions.showChange"
                        />
                        <label class="form-check-label" :for="`showChange-${tile.id}`">
                          Show Price Change
                        </label>
                      </div>
                    </div>
                    <div class="col-sm-6">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="`showPercent-${tile.id}`"
                          v-model="editContentConfig.displayOptions.showPercentChange"
                        />
                        <label class="form-check-label" :for="`showPercent-${tile.id}`">
                          Show Percent Change
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="row mt-2">
                    <div class="col-sm-6">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="`showVolume-${tile.id}`"
                          v-model="editContentConfig.displayOptions.showVolume"
                        />
                        <label class="form-check-label" :for="`showVolume-${tile.id}`">
                          Show Volume
                        </label>
                      </div>
                    </div>
                    <div class="col-sm-6">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="`autoRefresh-${tile.id}`"
                          v-model="editContentConfig.autoRefresh"
                        />
                        <label class="form-check-label" :for="`autoRefresh-${tile.id}`">
                          Auto Refresh
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Placeholder Configuration -->
                <div v-else-if="editContentType === 'placeholder'" class="content-config">
                  <div class="mb-2">
                    <label :for="`message-${tile.id}`" class="form-label">Custom Message</label>
                    <textarea
                      class="form-control"
                      :id="`message-${tile.id}`"
                      v-model="editContentConfig.message"
                      placeholder="Enter custom message..."
                      rows="3"
                      maxlength="200"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">
                  <strong>Tile Information</strong>
                </label>
                <div class="tile-info-display">
                  <div class="row">
                    <div class="col-sm-6">
                      <small class="text-muted">
                        <i class="fas fa-expand-arrows-alt me-1"></i>
                        Size: {{ tile.width }}×{{ tile.height }} units
                      </small>
                    </div>
                    <div class="col-sm-6">
                      <small class="text-muted">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        Position: ({{ tile.x }}, {{ tile.y }})
                      </small>
                    </div>
                  </div>
                  <div class="row mt-1">
                    <div class="col-sm-6">
                      <small class="text-muted">
                        <i class="fas fa-calendar-plus me-1"></i>
                        Created: {{ formatDate(tile.created) }}
                      </small>
                    </div>
                    <div class="col-sm-6">
                      <small class="text-muted">
                        <i class="fas fa-edit me-1"></i>
                        Modified: {{ formatDate(tile.modified) }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </form>
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
              class="btn btn-primary"
              @click="handleSaveEdit"
              :disabled="!isEditValid"
            >
              <i class="fas fa-save me-1"></i>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Tile } from '@/types/dashboard';
import { DEFAULT_TILE_SIZE, TILE_CONTENT_TYPES, type TileContentType } from '@/types/dashboard';
import { useDashboardStore } from '@/stores/dashboard';
import TileContentRenderer from './tile-content/TileContentRenderer.vue';

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
  tileEdit: [tileId: string, changes?: { title?: string; content?: object | null }];
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
const editModal = ref<HTMLElement>();

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

// Edit state
const editTitle = ref<string>('');
const editContentType = ref<TileContentType | ''>('');
const editContentConfig = ref<{
  symbol?: string;
  message?: string;
  autoRefresh?: boolean;
  displayOptions: {
    showChange: boolean;
    showPercentChange: boolean;
    showVolume: boolean;
    showChart: boolean;
  };
}>({
  displayOptions: {
    showChange: true,
    showPercentChange: true,
    showVolume: true,
    showChart: false,
  },
});

// Content types registry
const contentTypes = TILE_CONTENT_TYPES;

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

/**
 * Validates if the edit form is valid
 */
const isEditValid = computed(() => {
  return editTitle.value.trim().length > 0 && editTitle.value.trim().length <= 100;
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
 * Handles tile editing (opens edit modal)
 */
function handleEdit(): void {
  // Initialize edit form with current values
  editTitle.value = props.tile.title;

  // Initialize content type and configuration from current tile
  if (props.tile.content) {
    editContentType.value = props.tile.content.type;

    // Initialize content configuration based on content type
    if (props.tile.content.type === 'equity-quote') {
      editContentConfig.value = {
        symbol: props.tile.content.symbol || 'AAPL',
        autoRefresh: props.tile.content.autoRefresh || true,
        displayOptions: {
          showChange: props.tile.content.displayOptions?.showChange ?? true,
          showPercentChange: props.tile.content.displayOptions?.showPercentChange ?? true,
          showVolume: props.tile.content.displayOptions?.showVolume ?? true,
          showChart: props.tile.content.displayOptions?.showChart ?? false,
        },
      };
    } else if (props.tile.content.type === 'placeholder') {
      editContentConfig.value = {
        message: props.tile.content.message || 'Content coming soon...',
        displayOptions: {
          showChange: true,
          showPercentChange: true,
          showVolume: true,
          showChart: false,
        },
      };
    }
  } else {
    // No content - initialize as empty
    editContentType.value = '';
    editContentConfig.value = {
      displayOptions: {
        showChange: true,
        showPercentChange: true,
        showVolume: true,
        showChart: false,
      },
    };
  }

  // The modal will be shown by Bootstrap's data attributes
  // No need for programmatic modal handling
}

/**
 * Handles saving edit changes
 */
function handleSaveEdit(): void {
  if (!isEditValid.value) return;

  const trimmedTitle = editTitle.value.trim();

  // Prepare the changes object
  const changes: { title?: string; content?: object | null } = {};

  // Check if title changed
  if (trimmedTitle !== props.tile.title) {
    changes.title = trimmedTitle;
  }

  // Prepare content based on selected type
  let newContent = null;
  if (editContentType.value) {
    if (editContentType.value === 'equity-quote') {
      newContent = {
        type: 'equity-quote' as const,
        displayName: 'Stock Quote',
        symbol: editContentConfig.value.symbol || 'AAPL',
        autoRefresh: editContentConfig.value.autoRefresh ?? true,
        refreshInterval: 60,
        displayOptions: {
          showChange: editContentConfig.value.displayOptions?.showChange ?? true,
          showPercentChange: editContentConfig.value.displayOptions?.showPercentChange ?? true,
          showVolume: editContentConfig.value.displayOptions?.showVolume ?? true,
          showChart: editContentConfig.value.displayOptions?.showChart ?? false,
        },
      };
    } else if (editContentType.value === 'placeholder') {
      newContent = {
        type: 'placeholder' as const,
        displayName: 'Placeholder',
        message: editContentConfig.value.message || 'Content coming soon...',
      };
    }
  }

  // Check if content changed
  const currentContentJson = JSON.stringify(props.tile.content);
  const newContentJson = JSON.stringify(newContent);
  if (currentContentJson !== newContentJson) {
    changes.content = newContent;
  }

  // If no changes, just return
  if (Object.keys(changes).length === 0) {
    return;
  }

  // Emit the tile edit event with all changes
  emit('tileEdit', props.tile.id, changes);

  // Close modal using Bootstrap's programmatic API
  if (editModal.value) {
    try {
      const windowWithBootstrap = window as {
        bootstrap?: {
          Modal: {
            getInstance(element: HTMLElement): { hide(): void } | null;
          };
        };
      };
      if (windowWithBootstrap.bootstrap && windowWithBootstrap.bootstrap.Modal) {
        const modalInstance = windowWithBootstrap.bootstrap.Modal.getInstance(editModal.value);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
    } catch (error) {
      console.error('Error hiding modal:', error);
    }
  }
}

/**
 * Formats a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Gets description for a content type
 * @param {string} type - Content type
 * @returns {string} Description
 */
function getContentTypeDescription(type: string): string {
  if (!type) return 'Default placeholder content will be displayed';
  return contentTypes[type as TileContentType]?.description || 'Unknown content type';
}

/**
 * Handles content type change
 */
function handleContentTypeChange(): void {
  // Initialize default configuration for the selected content type
  if (!editContentType.value) {
    editContentConfig.value = {
      displayOptions: {
        showChange: true,
        showPercentChange: true,
        showVolume: true,
        showChart: false,
      },
    };
    return;
  }

  const defaultConfig = contentTypes[editContentType.value]?.defaultConfig || {};
  const configDisplayOptions = defaultConfig.type === 'equity-quote' ?
    (defaultConfig as { displayOptions?: typeof editContentConfig.value.displayOptions }).displayOptions :
    undefined;

  editContentConfig.value = {
    ...defaultConfig,
    displayOptions: {
      showChange: true,
      showPercentChange: true,
      showVolume: true,
      showChart: false,
      ...configDisplayOptions,
    },
  };
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
  // Only start drag if clicking on the tile content, not controls or interactive elements
  if ((event.target as HTMLElement).closest('.tile-controls') ||
      (event.target as HTMLElement).closest('.resize-handle') ||
      (event.target as HTMLElement).closest('button') ||
      (event.target as HTMLElement).closest('input') ||
      (event.target as HTMLElement).closest('select') ||
      (event.target as HTMLElement).closest('textarea') ||
      (event.target as HTMLElement).closest('.modal')) {
    return;
  }

  startDragFromHandle(event);
}

/**
 * Handles touch start on tile (for drag initiation)
 * @param {TouchEvent} event - Touch event
 */
function handleTouchStart(event: TouchEvent): void {
  // Only start drag if touching the tile content, not controls or interactive elements
  if ((event.target as HTMLElement).closest('.tile-controls') ||
      (event.target as HTMLElement).closest('.resize-handle') ||
      (event.target as HTMLElement).closest('button') ||
      (event.target as HTMLElement).closest('input') ||
      (event.target as HTMLElement).closest('select') ||
      (event.target as HTMLElement).closest('textarea') ||
      (event.target as HTMLElement).closest('.modal')) {
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
  // Clean up modal instance
  if (editModal.value) {
    try {
      const windowWithBootstrap = window as {
        bootstrap?: {
          Modal: {
            getInstance(element: HTMLElement): { dispose(): void } | null;
          };
        };
      };
      if (windowWithBootstrap.bootstrap && windowWithBootstrap.bootstrap.Modal) {
        const modalInstance = windowWithBootstrap.bootstrap.Modal.getInstance(editModal.value);
        if (modalInstance) {
          modalInstance.dispose();
        }
      }
    } catch (error) {
      console.error('Error disposing modal:', error);
    }
  }

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

/* Edit modal styling */
.modal {
  z-index: 1055 !important; /* Ensure modal is above everything */
}

.modal-backdrop {
  z-index: 1050 !important; /* Backdrop below modal but above content */
}

.modal-dialog {
  pointer-events: auto !important;
}

.modal-content {
  pointer-events: auto !important;
  position: relative;
  z-index: 1;
}

.tile-info-display {
  background-color: var(--bs-light);
  border: 1px solid var(--bs-border-color);
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.tile-info-display .row {
  margin: 0;
}

.tile-info-display .col-sm-6 {
  padding: 0.125rem 0.5rem;
}

.tile-info-display small {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
}

.tile-info-display .fas {
  width: 14px;
  opacity: 0.7;
}
</style>
