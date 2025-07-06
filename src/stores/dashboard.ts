/**
 * Dashboard Store - Pinia store for managing dashboard state
 *
 * This store handles all dashboard state management including tiles,
 * layout persistence, drag/drop operations, and grid configuration.
 *
 * Features:
 * - Tile CRUD operations (create, read, update, delete)
 * - Layout persistence with localStorage
 * - Drag and drop state management
 * - Resize state management
 * - Grid layout calculations
 * - Responsive breakpoint handling
 */

import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type {
  Tile,
  DashboardLayout,
  GridConfig,
  DragState,
  ResizeState,
  TileOperationEvent,
  GridPosition,
} from '@/types/dashboard';
import {
  DEFAULT_GRID_CONFIG,
  DEFAULT_TILE_SIZE,
  BREAKPOINTS,
} from '@/types/dashboard';

/**
 * Dashboard store for managing tile layout and operations
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const currentLayout = ref<DashboardLayout>({
    id: 'default',
    name: 'Default Dashboard',
    tiles: [],
    gridColumns: DEFAULT_GRID_CONFIG.desktop,
    created: new Date(),
    modified: new Date(),
  });

  const gridConfig = ref<GridConfig>({ ...DEFAULT_GRID_CONFIG });
  const currentBreakpoint = ref<'desktop' | 'tablet' | 'mobile' | 'smallMobile'>('desktop');

  const dragState = ref<DragState>({
    isDragging: false,
    draggedTileId: null,
    originalPosition: null,
    currentPosition: null,
  });

  const resizeState = ref<ResizeState>({
    isResizing: false,
    resizedTileId: null,
    originalSize: null,
    currentSize: null,
    resizeHandle: null,
  });

  const operationHistory = ref<TileOperationEvent[]>([]);

  // Computed properties
  const tiles = computed(() => currentLayout.value.tiles);

  const gridColumns = computed(() => {
    switch (currentBreakpoint.value) {
      case 'desktop':
        return gridConfig.value.desktop;
      case 'tablet':
        return gridConfig.value.tablet;
      case 'mobile':
        return gridConfig.value.mobile;
      case 'smallMobile':
        return gridConfig.value.smallMobile;
      default:
        return gridConfig.value.desktop;
    }
  });

  const maxTileId = computed(() => {
    return Math.max(0, ...tiles.value.map(tile => parseInt(tile.id.replace('tile-', ''), 10)));
  });

  // Utility functions

  /**
   * Generates a unique tile ID
   * @returns {string} Unique tile identifier
   */
  function generateTileId(): string {
    return `tile-${maxTileId.value + 1}`;
  }

  /**
   * Finds the next available position for a new tile
   * @param {number} width - Width of the tile in grid units
   * @param {number} height - Height of the tile in grid units
   * @returns {GridPosition} Next available position
   */
  function findNextAvailablePosition(width: number, height: number): GridPosition {
    const occupiedPositions = new Set<string>();

    // Mark all occupied positions
    tiles.value.forEach(tile => {
      for (let x = tile.x; x < tile.x + tile.width; x++) {
        for (let y = tile.y; y < tile.y + tile.height; y++) {
          occupiedPositions.add(`${x}-${y}`);
        }
      }
    });

    // Find first available position
    for (let y = 0; y < 1000; y++) { // Reasonable limit
      for (let x = 0; x <= gridColumns.value - width; x++) {
        let canPlace = true;

        // Check if the entire tile area is free
        for (let checkX = x; checkX < x + width && canPlace; checkX++) {
          for (let checkY = y; checkY < y + height && canPlace; checkY++) {
            if (occupiedPositions.has(`${checkX}-${checkY}`)) {
              canPlace = false;
            }
          }
        }

        if (canPlace) {
          return {
            x,
            y,
            isValid: true,
            hasConflicts: false,
          };
        }
      }
    }

    // Fallback to bottom of grid
    return {
      x: 0,
      y: Math.max(...tiles.value.map(t => t.y + t.height), 0),
      isValid: true,
      hasConflicts: false,
    };
  }

  /**
   * Checks if a tile position would cause conflicts
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width in grid units
   * @param {number} height - Height in grid units
   * @param {string} excludeTileId - Tile ID to exclude from conflict check
   * @returns {boolean} Whether conflicts exist
   */
  function hasPositionConflicts(
    x: number,
    y: number,
    width: number,
    height: number,
    excludeTileId?: string
  ): boolean {
    return tiles.value.some(tile => {
      if (excludeTileId && tile.id === excludeTileId) return false;

      return !(
        x >= tile.x + tile.width ||
        x + width <= tile.x ||
        y >= tile.y + tile.height ||
        y + height <= tile.y
      );
    });
  }

  /**
   * Logs a tile operation for history tracking
   * @param {TileOperationEvent} event - Operation event to log
   */
  function logOperation(event: TileOperationEvent): void {
    operationHistory.value.push(event);

    // Keep only last 100 operations
    if (operationHistory.value.length > 100) {
      operationHistory.value = operationHistory.value.slice(-100);
    }
  }

  // Tile operations

  /**
   * Creates a new tile with default properties
   * @param {Partial<Tile>} tileData - Optional tile properties to override defaults
   * @returns {Tile} The created tile
   */
  function createTile(tileData: Partial<Tile> = {}): Tile {
    const id = generateTileId();
    const now = new Date();
    const position = findNextAvailablePosition(
      tileData.width || DEFAULT_TILE_SIZE.width,
      tileData.height || DEFAULT_TILE_SIZE.height
    );

    const newTile: Tile = {
      id,
      title: `Tile ${id.replace('tile-', '')}`,
      x: position.x,
      y: position.y,
      width: DEFAULT_TILE_SIZE.width,
      height: DEFAULT_TILE_SIZE.height,
      minWidth: DEFAULT_TILE_SIZE.minWidth,
      minHeight: DEFAULT_TILE_SIZE.minHeight,
      created: now,
      modified: now,
      ...tileData,
    };

    currentLayout.value.tiles.push(newTile);
    currentLayout.value.modified = now;

    logOperation({
      operation: 'create',
      tileId: id,
      data: { tile: newTile },
      timestamp: now,
    });

    return newTile;
  }

  /**
   * Deletes a tile by ID
   * @param {string} tileId - ID of tile to delete
   * @returns {boolean} Whether the tile was successfully deleted
   */
  function deleteTile(tileId: string): boolean {
    const index = currentLayout.value.tiles.findIndex(tile => tile.id === tileId);

    if (index === -1) return false;

    const deletedTile = currentLayout.value.tiles[index];
    currentLayout.value.tiles.splice(index, 1);
    currentLayout.value.modified = new Date();

    logOperation({
      operation: 'delete',
      tileId,
      data: { tile: deletedTile },
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Updates a tile's properties
   * @param {string} tileId - ID of tile to update
   * @param {Partial<Tile>} updates - Properties to update
   * @returns {boolean} Whether the tile was successfully updated
   */
  function updateTile(tileId: string, updates: Partial<Tile>): boolean {
    const tile = currentLayout.value.tiles.find(t => t.id === tileId);

    if (!tile) return false;

    const oldValues = { ...tile };
    Object.assign(tile, updates, { modified: new Date() });
    currentLayout.value.modified = new Date();

    logOperation({
      operation: 'move',
      tileId,
      data: { oldValues, newValues: { ...tile } },
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Moves a tile to a new position
   * @param {string} tileId - ID of tile to move
   * @param {number} x - New X position
   * @param {number} y - New Y position
   * @returns {boolean} Whether the move was successful
   */
  function moveTile(tileId: string, x: number, y: number): boolean {
    const tile = currentLayout.value.tiles.find(t => t.id === tileId);

    if (!tile) return false;

    // Check bounds
    if (x < 0 || x + tile.width > gridColumns.value || y < 0) {
      return false;
    }

    // Check conflicts
    if (hasPositionConflicts(x, y, tile.width, tile.height, tileId)) {
      return false;
    }

    return updateTile(tileId, { x, y });
  }

  /**
   * Resizes a tile
   * @param {string} tileId - ID of tile to resize
   * @param {number} width - New width in grid units
   * @param {number} height - New height in grid units
   * @returns {boolean} Whether the resize was successful
   */
  function resizeTile(tileId: string, width: number, height: number): boolean {
    const tile = currentLayout.value.tiles.find(t => t.id === tileId);

    if (!tile) return false;

    // Enforce minimum/maximum constraints
    const minWidth = tile.minWidth || DEFAULT_TILE_SIZE.minWidth;
    const minHeight = tile.minHeight || DEFAULT_TILE_SIZE.minHeight;
    const maxWidth = tile.maxWidth || gridColumns.value;
    const maxHeight = tile.maxHeight || 20; // Reasonable default

    width = Math.max(minWidth, Math.min(maxWidth, width));
    height = Math.max(minHeight, Math.min(maxHeight, height));

    // Check bounds
    if (tile.x + width > gridColumns.value) {
      return false;
    }

    // Check conflicts
    if (hasPositionConflicts(tile.x, tile.y, width, height, tileId)) {
      return false;
    }

    logOperation({
      operation: 'resize',
      tileId,
      data: { oldSize: { width: tile.width, height: tile.height }, newSize: { width, height } },
      timestamp: new Date(),
    });

    return updateTile(tileId, { width, height });
  }

  // Drag and drop operations

  /**
   * Starts a drag operation
   * @param {string} tileId - ID of tile being dragged
   */
  function startDrag(tileId: string): void {
    const tile = tiles.value.find(t => t.id === tileId);
    if (!tile) return;

    dragState.value = {
      isDragging: true,
      draggedTileId: tileId,
      originalPosition: { x: tile.x, y: tile.y },
      currentPosition: { x: tile.x, y: tile.y },
    };
  }

  /**
   * Updates drag position
   * @param {number} x - Current X position
   * @param {number} y - Current Y position
   */
  function updateDrag(x: number, y: number): void {
    if (!dragState.value.isDragging) return;

    dragState.value.currentPosition = { x, y };
  }

  /**
   * Ends a drag operation
   * @param {boolean} commit - Whether to commit the move
   */
  function endDrag(commit: boolean = true): void {
    if (!dragState.value.isDragging || !dragState.value.draggedTileId) return;

    if (commit && dragState.value.currentPosition) {
      moveTile(
        dragState.value.draggedTileId,
        dragState.value.currentPosition.x,
        dragState.value.currentPosition.y
      );
    }

    dragState.value = {
      isDragging: false,
      draggedTileId: null,
      originalPosition: null,
      currentPosition: null,
    };
  }

  // Resize operations

  /**
   * Starts a resize operation
   * @param {string} tileId - ID of tile being resized
   * @param {string} handle - Resize handle being used
   */
  function startResize(tileId: string, handle: 'se' | 'e' | 's'): void {
    const tile = tiles.value.find(t => t.id === tileId);
    if (!tile) return;

    resizeState.value = {
      isResizing: true,
      resizedTileId: tileId,
      originalSize: { width: tile.width, height: tile.height },
      currentSize: { width: tile.width, height: tile.height },
      resizeHandle: handle,
    };
  }

  /**
   * Updates resize dimensions
   * @param {number} width - Current width
   * @param {number} height - Current height
   */
  function updateResize(width: number, height: number): void {
    if (!resizeState.value.isResizing) return;

    resizeState.value.currentSize = { width, height };
  }

  /**
   * Ends a resize operation
   * @param {boolean} commit - Whether to commit the resize
   */
  function endResize(commit: boolean = true): void {
    if (!resizeState.value.isResizing || !resizeState.value.resizedTileId) return;

    if (commit && resizeState.value.currentSize) {
      resizeTile(
        resizeState.value.resizedTileId,
        resizeState.value.currentSize.width,
        resizeState.value.currentSize.height
      );
    }

    resizeState.value = {
      isResizing: false,
      resizedTileId: null,
      originalSize: null,
      currentSize: null,
      resizeHandle: null,
    };
  }

  // Layout persistence

  /**
   * Saves the current layout to localStorage
   */
  function saveLayout(): void {
    try {
      const layoutData = JSON.stringify({
        ...currentLayout.value,
        tiles: currentLayout.value.tiles.map(tile => ({
          ...tile,
          created: tile.created.toISOString(),
          modified: tile.modified.toISOString(),
        })),
        created: currentLayout.value.created.toISOString(),
        modified: currentLayout.value.modified.toISOString(),
      });

      localStorage.setItem('dashboard-layout', layoutData);
    } catch (error) {
      console.error('Failed to save layout to localStorage:', error);
    }
  }

  /**
   * Loads layout from localStorage
   */
  function loadLayout(): void {
    try {
      const savedLayout = localStorage.getItem('dashboard-layout');

      if (savedLayout) {
        const layoutData = JSON.parse(savedLayout);

        currentLayout.value = {
          ...layoutData,
          tiles: layoutData.tiles.map((tile: unknown) => {
            const tileData = tile as {
              created: string;
              modified: string;
              [key: string]: unknown;
            };
            return {
              ...tileData,
              created: new Date(tileData.created),
              modified: new Date(tileData.modified),
            };
          }),
          created: new Date(layoutData.created),
          modified: new Date(layoutData.modified),
        };
      }
    } catch (error) {
      console.error('Failed to load layout from localStorage:', error);
    }
  }

  /**
   * Loads layout data from an imported layout object
   * @param {DashboardLayout} layoutData - Layout data to load
   */
  function loadLayoutData(layoutData: DashboardLayout): void {
    try {
      currentLayout.value = {
        ...layoutData,
        modified: new Date(), // Update modified time to current time
      };

      // Log the import operation
      logOperation({
        operation: 'create',
        tileId: 'layout',
        data: { action: 'import_layout', layoutName: layoutData.name },
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to load layout data:', error);
      throw error;
    }
  }

  /**
   * Updates the current breakpoint based on window width
   * @param {number} width - Current window width
   */
  function updateBreakpoint(width: number): void {
    if (width >= BREAKPOINTS.tablet) {
      currentBreakpoint.value = 'desktop';
    } else if (width >= BREAKPOINTS.mobile) {
      currentBreakpoint.value = 'tablet';
    } else if (width >= BREAKPOINTS.smallMobile) {
      currentBreakpoint.value = 'mobile';
    } else {
      currentBreakpoint.value = 'smallMobile';
    }
  }

  /**
   * Clears all tiles from the dashboard
   */
  function clearDashboard(): void {
    currentLayout.value.tiles = [];
    currentLayout.value.modified = new Date();

    logOperation({
      operation: 'delete',
      tileId: 'all',
      data: { action: 'clear_dashboard' },
      timestamp: new Date(),
    });
  }

  /**
   * Imports a layout from external data
   * @param {object} layoutData - Layout data to import
   */
  function importLayout(layoutData: any): void {
    try {
      // Validate and sanitize imported data
      if (!layoutData || !Array.isArray(layoutData.tiles)) {
        throw new Error('Invalid layout data format');
      }

      const now = new Date();
      
      // Update current layout with imported data
      currentLayout.value = {
        id: layoutData.id || 'imported',
        name: layoutData.name || 'Imported Dashboard',
        tiles: layoutData.tiles.map((tile: any) => ({
          ...tile,
          id: tile.id || generateTileId(),
          created: tile.created ? new Date(tile.created) : now,
          modified: tile.modified ? new Date(tile.modified) : now,
        })),
        gridColumns: layoutData.gridColumns || DEFAULT_GRID_CONFIG.desktop,
        created: layoutData.created ? new Date(layoutData.created) : now,
        modified: now,
      };

      // Update grid configuration if provided
      if (layoutData.gridConfig) {
        gridConfig.value = { ...gridConfig.value, ...layoutData.gridConfig };
      }

      saveLayout();
      
      logOperation({
        operation: 'import',
        tileId: 'layout',
        timestamp: now,
        data: { tilesImported: currentLayout.value.tiles.length },
      });
    } catch (error) {
      console.error('Failed to import layout:', error);
      throw new Error('Failed to import layout: ' + (error as Error).message);
    }
  }

  // Watch for layout changes and auto-save
  watch(
    () => currentLayout.value,
    () => {
      saveLayout();
    },
    { deep: true }
  );

  // Initialize store
  loadLayout();

  return {
    // State
    currentLayout: computed(() => currentLayout.value),
    gridConfig: computed(() => gridConfig.value),
    currentBreakpoint: computed(() => currentBreakpoint.value),
    dragState: computed(() => dragState.value),
    resizeState: computed(() => resizeState.value),
    operationHistory: computed(() => operationHistory.value),

    // Computed
    tiles,
    gridColumns,

    // Actions
    createTile,
    deleteTile,
    updateTile,
    moveTile,
    resizeTile,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize,
    saveLayout,
    loadLayout,
    loadLayoutData,
    updateBreakpoint,
    clearDashboard,
    importLayout,
    findNextAvailablePosition,
    hasPositionConflicts,
  };
});
