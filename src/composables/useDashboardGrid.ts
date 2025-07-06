/**
 * Dashboard Grid Management Composable
 * 
 * Provides comprehensive grid management functionality for the dashboard,
 * including layout calculations, responsive behavior, and visual feedback.
 * 
 * Features:
 * - Grid positioning and sizing calculations
 * - Drag and drop zone management
 * - Grid line visualization
 * - Responsive grid adjustments
 * - Drop zone calculations and styling
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import { ref, computed, type Ref } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import type { Tile } from '@/types/dashboard';

/**
 * Drop zone interface for drag operations
 */
interface DropZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Grid management composable options
 */
interface UseDashboardGridOptions {
  gridContainer: Ref<HTMLElement | undefined>;
}

/**
 * Dashboard Grid Management Composable
 * 
 * Manages all aspects of the dashboard grid system including layout calculations,
 * drag zones, grid lines, and responsive behavior.
 * 
 * Time Complexity: O(1) for most operations, O(n) for grid calculations where n is grid size
 * Space Complexity: O(1)
 * 
 * @param options - Configuration options for grid management
 * @returns Grid management state and methods
 * 
 * @example
 * ```typescript
 * const {
 *   showGridLines,
 *   dropZone,
 *   gridContainerStyle,
 *   handleDragStart,
 *   handleDragMove
 * } = useDashboardGrid({
 *   gridContainer: gridContainerRef
 * });
 * ```
 */
export function useDashboardGrid(options: UseDashboardGridOptions) {
  const { gridContainer } = options;
  const dashboardStore = useDashboardStore();

  // Reactive state for grid management
  const showGridLines = ref<boolean>(false);
  const dropZone = ref<DropZone | null>(null);

  /**
   * Computed style for the main grid container
   * 
   * Generates CSS custom properties for grid layout based on current
   * dashboard configuration. Updates reactively when grid settings change.
   * 
   * @returns CSS style object with grid configuration
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  const gridContainerStyle = computed(() => ({
    '--grid-columns': dashboardStore.gridColumns,
    '--grid-gap': `${dashboardStore.gridConfig.gap}px`,
    '--container-padding': `${dashboardStore.gridConfig.padding}px`,
    '--row-height': `${dashboardStore.gridConfig.rowHeight}px`,
  }));

  /**
   * Computed style for grid lines overlay
   * 
   * Provides styling configuration for the visual grid lines that appear
   * during drag operations to help with tile positioning.
   * 
   * @returns CSS style object for grid lines
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  const gridLinesStyle = computed(() => ({
    '--grid-columns': dashboardStore.gridColumns,
  }));

  /**
   * Computed style for drop zone indicator
   * 
   * Calculates positioning and sizing for the drop zone indicator that shows
   * where a dragged tile will be placed. Uses percentage-based positioning
   * for responsive behavior.
   * 
   * @returns CSS style object for drop zone positioning
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  const dropZoneStyle = computed(() => {
    if (!dropZone.value) {
      return {};
    }

    // Calculate percentage-based positioning for responsive behavior
    const leftPercent = (dropZone.value.x / dashboardStore.gridColumns) * 100;
    const widthPercent = (dropZone.value.width / dashboardStore.gridColumns) * 100;
    const topPixels = dropZone.value.y * dashboardStore.gridConfig.rowHeight;
    const heightPixels = dropZone.value.height * dashboardStore.gridConfig.rowHeight;

    return {
      left: `${leftPercent}%`,
      top: `${topPixels}px`,
      width: `${widthPercent}%`,
      height: `${heightPixels}px`,
    };
  });

  /**
   * Checks if any grid operations are currently in progress
   * 
   * Determines if the grid is currently in an interactive state that should
   * prevent other operations or show special visual feedback.
   * 
   * @returns True if drag or resize operations are active
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  const isOperationInProgress = computed(() => 
    dashboardStore.dragState.isDragging || dashboardStore.resizeState.isResizing
  );

  /**
   * Calculates grid position from pixel coordinates
   * 
   * Converts mouse or touch coordinates to grid cell positions,
   * accounting for container boundaries and grid configuration.
   * 
   * @param clientX - X coordinate in pixels relative to viewport
   * @param clientY - Y coordinate in pixels relative to viewport
   * @returns Grid position with x and y coordinates
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function getGridPosition(clientX: number, clientY: number): { x: number; y: number } {
    const container = gridContainer.value;
    if (!container) {
      console.warn('Grid container not available for position calculation');
      return { x: 0, y: 0 };
    }

    const rect = container.getBoundingClientRect();
    const relativeX = clientX - rect.left - dashboardStore.gridConfig.padding;
    const relativeY = clientY - rect.top - dashboardStore.gridConfig.padding;

    // Calculate available width accounting for gaps
    const availableWidth = rect.width - (dashboardStore.gridConfig.padding * 2);
    const columnWidth = availableWidth / dashboardStore.gridColumns;

    // Calculate grid position with boundary checking
    const gridX = Math.max(0, Math.min(
      dashboardStore.gridColumns - 1,
      Math.floor(relativeX / columnWidth)
    ));
    
    const gridY = Math.max(0, Math.floor(
      relativeY / dashboardStore.gridConfig.rowHeight
    ));

    return { x: gridX, y: gridY };
  }

  /**
   * Checks if a position is valid for a tile of given dimensions
   * 
   * Validates that a tile can be placed at the specified position without
   * going out of bounds or overlapping with existing tiles.
   * 
   * @param x - Grid X position
   * @param y - Grid Y position  
   * @param width - Tile width in grid units
   * @param height - Tile height in grid units
   * @param excludeTileId - Optional tile ID to exclude from collision checking
   * @returns True if position is valid
   * 
   * Time Complexity: O(n) where n is number of tiles
   * Space Complexity: O(1)
   */
  function isValidPosition(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    excludeTileId?: string
  ): boolean {
    // Check grid boundaries
    if (x < 0 || y < 0 || x + width > dashboardStore.gridColumns) {
      return false;
    }

    // Check for overlaps with existing tiles
    return !dashboardStore.hasPositionConflicts(x, y, width, height, excludeTileId);
  }

  /**
   * Finds the next available position for a tile
   * 
   * Searches for the first available position where a tile of the specified
   * dimensions can be placed without conflicts.
   * 
   * @param width - Tile width in grid units
   * @param height - Tile height in grid units
   * @returns Next available position or null if none found
   * 
   * Time Complexity: O(n*m) where n is grid height, m is grid width
   * Space Complexity: O(1)
   */
  function findNextAvailablePosition(
    width: number, 
    height: number
  ): { x: number; y: number } | null {
    // Start from top-left and scan row by row
    for (let y = 0; y < 50; y++) { // Reasonable limit to prevent infinite search
      for (let x = 0; x <= dashboardStore.gridColumns - width; x++) {
        if (isValidPosition(x, y, width, height)) {
          return { x, y };
        }
      }
    }
    
    console.warn('No available position found for tile dimensions:', { width, height });
    return null;
  }

  /**
   * Updates drop zone visualization during drag operations
   * 
   * Calculates and updates the drop zone indicator position based on
   * current drag position and tile dimensions.
   * 
   * @param position - Current drag position
   * @param tile - Tile being dragged
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function updateDropZone(position: { x: number; y: number }, tile: Tile): void {
    // Validate position bounds
    const validX = Math.max(0, Math.min(
      position.x, 
      dashboardStore.gridColumns - tile.width
    ));
    
    const validY = Math.max(0, position.y);

    dropZone.value = {
      x: validX,
      y: validY,
      width: tile.width,
      height: tile.height,
    };

    console.debug(`Drop zone updated: ${validX}, ${validY} (${tile.width}x${tile.height})`);
  }

  /**
   * Clears the drop zone visualization
   * 
   * Removes the drop zone indicator, typically called when drag operations end.
   */
  function clearDropZone(): void {
    dropZone.value = null;
    console.debug('Drop zone cleared');
  }

  /**
   * Shows grid lines for visual guidance
   * 
   * Displays grid lines to help users align tiles during drag operations.
   * Automatically hides after a timeout if no operations are in progress.
   */
  function showGridLinesTemporary(): void {
    showGridLines.value = true;
    console.debug('Grid lines shown');
  }

  /**
   * Hides grid lines
   * 
   * Removes grid line visualization, typically called when operations complete.
   */
  function hideGridLines(): void {
    showGridLines.value = false;
    console.debug('Grid lines hidden');
  }

  /**
   * Handles grid drop events for HTML5 drag and drop
   * 
   * Processes drop events when tiles are dropped onto the grid container.
   * Calculates final position and delegates to store for tile updates.
   * 
   * @param event - HTML5 drop event
   */
  function handleGridDrop(event: DragEvent): void {
    event.preventDefault();
    
    const tileId = event.dataTransfer?.getData('text/plain');
    if (!tileId) {
      console.warn('No tile ID found in drop event');
      return;
    }

    const position = getGridPosition(event.clientX, event.clientY);
    const tile = dashboardStore.tiles.find(t => t.id === tileId);
    
    if (!tile) {
      console.warn(`Tile not found for drop: ${tileId}`);
      return;
    }

    if (isValidPosition(position.x, position.y, tile.width, tile.height, tileId)) {
      dashboardStore.moveTile(tileId, position.x, position.y);
      console.debug(`Tile dropped: ${tileId} at ${position.x}, ${position.y}`);
    } else {
      console.warn('Invalid drop position:', position);
    }

    clearDropZone();
    hideGridLines();
  }

  /**
   * Gets grid statistics for debugging and display
   * 
   * Provides useful information about the current grid state.
   * 
   * @returns Object containing grid statistics
   * 
   * Time Complexity: O(n) where n is number of tiles
   * Space Complexity: O(1)
   */
  function getGridStats() {
    const tiles = dashboardStore.tiles;
    const totalCells = dashboardStore.gridColumns * 20; // Assuming max 20 rows for calculation
    const occupiedCells = tiles.reduce((sum, tile) => sum + (tile.width * tile.height), 0);
    
    return {
      totalTiles: tiles.length,
      gridColumns: dashboardStore.gridColumns,
      occupiedCells,
      totalCells,
      utilizationPercent: Math.round((occupiedCells / totalCells) * 100),
    };
  }

  // Return public interface
  return {
    // Reactive state
    showGridLines,
    dropZone,
    isOperationInProgress,
    
    // Computed styles
    gridContainerStyle,
    gridLinesStyle,
    dropZoneStyle,
    
    // Position calculations
    getGridPosition,
    isValidPosition,
    findNextAvailablePosition,
    
    // Drop zone management
    updateDropZone,
    clearDropZone,
    
    // Grid line management
    showGridLinesTemporary,
    hideGridLines,
    
    // Event handlers
    handleGridDrop,
    
    // Utilities
    getGridStats,
  };
}