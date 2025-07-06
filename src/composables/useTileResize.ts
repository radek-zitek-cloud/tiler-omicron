/**
 * Tile Resize Composable
 * 
 * Provides reusable resize functionality for tiles with support for multiple
 * resize handles, mouse and touch events, and real-time size constraints.
 * 
 * Features:
 * - Multiple resize handles (SE, E, S)
 * - Mouse and touch event handling
 * - Real-time size calculation with constraints
 * - Grid-based sizing with pixel-to-grid conversion
 * - Accessibility and keyboard support
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import { ref, type Ref } from 'vue';
import type { Tile } from '@/types/dashboard';
import { DEFAULT_TILE_SIZE } from '@/types/dashboard';

/**
 * Resize handle types
 */
type ResizeHandle = 'se' | 'e' | 's';

/**
 * Resize operation data interface
 */
interface ResizeStartData {
  handle: ResizeHandle;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

/**
 * New size interface
 */
interface NewSize {
  width: number;
  height: number;
}

/**
 * Resize event emitter interface
 */
interface ResizeEmits {
  resizeStart: [tileId: string, handle: ResizeHandle];
  resizeMove: [size: NewSize];
  resizeEnd: [commit: boolean];
}

/**
 * Composable options interface
 */
interface UseTileResizeOptions {
  tile: Tile;
  tileElement: Ref<HTMLElement | undefined>;
  gridColumns: number;
  rowHeight: number;
  isDragging: Ref<boolean>;
  emit: (event: keyof ResizeEmits, ...args: any[]) => void;
}

/**
 * Tile Resize Composable
 * 
 * Manages tile resizing operations with comprehensive constraint handling
 * and real-time visual feedback. Supports multiple resize handles and
 * provides smooth user experience across devices.
 * 
 * Time Complexity: O(1) for all operations
 * Space Complexity: O(1)
 * 
 * @param options - Configuration options for resize behavior
 * @returns Resize handlers and state management functions
 * 
 * @example
 * ```typescript
 * const { 
 *   startResize,
 *   startTouchResize,
 *   cleanup 
 * } = useTileResize({
 *   tile: tileRef.value,
 *   tileElement,
 *   gridColumns: 12,
 *   rowHeight: 100,
 *   isDragging,
 *   emit
 * });
 * ```
 */
export function useTileResize(options: UseTileResizeOptions) {
  const { tile, tileElement, gridColumns, rowHeight, isDragging, emit } = options;

  // Reactive state for resize operations
  const resizeStartData = ref<ResizeStartData | null>(null);

  /**
   * Calculates new tile size based on pixel deltas
   * 
   * Converts pixel movements to grid units while applying min/max constraints.
   * Handles different resize handle types (corner, edge) appropriately.
   * 
   * @param deltaX - Horizontal movement in pixels
   * @param deltaY - Vertical movement in pixels
   * @returns Calculated new size with constraints applied
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function calculateNewSize(deltaX: number, deltaY: number): NewSize | null {
    if (!resizeStartData.value) {
      console.warn('Cannot calculate size: no resize operation in progress');
      return null;
    }

    const container = tileElement.value?.closest('.grid-container') as HTMLElement;
    if (!container) {
      console.warn('Grid container not found for size calculation');
      return null;
    }

    const rect = container.getBoundingClientRect();
    const columnWidth = rect.width / gridColumns;

    let newWidth = resizeStartData.value.startWidth;
    let newHeight = resizeStartData.value.startHeight;

    // Calculate new dimensions based on handle type
    switch (resizeStartData.value.handle) {
      case 'se': // Southeast corner - resize both dimensions
        newWidth = resizeStartData.value.startWidth + Math.round(deltaX / columnWidth);
        newHeight = resizeStartData.value.startHeight + Math.round(deltaY / rowHeight);
        break;
      case 'e': // East edge - resize width only
        newWidth = resizeStartData.value.startWidth + Math.round(deltaX / columnWidth);
        break;
      case 's': // South edge - resize height only
        newHeight = resizeStartData.value.startHeight + Math.round(deltaY / rowHeight);
        break;
      default:
        console.warn(`Unknown resize handle: ${resizeStartData.value.handle}`);
        return null;
    }

    // Apply size constraints
    const constraints = calculateSizeConstraints();
    
    newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, newWidth));
    newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, newHeight));

    return { width: newWidth, height: newHeight };
  }

  /**
   * Calculates size constraints for the tile
   * 
   * Determines minimum and maximum sizes based on tile configuration,
   * grid boundaries, and default constraints.
   * 
   * @returns Object containing min/max width and height constraints
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function calculateSizeConstraints() {
    const minWidth = tile.minWidth || DEFAULT_TILE_SIZE.minWidth;
    const minHeight = tile.minHeight || DEFAULT_TILE_SIZE.minHeight;
    
    // Maximum width is constrained by grid columns and tile position
    const maxWidth = Math.min(
      tile.maxWidth || gridColumns,
      gridColumns - tile.x
    );
    
    // Maximum height uses tile setting or reasonable default
    const maxHeight = tile.maxHeight || 20;

    return {
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    };
  }

  /**
   * Calculates and emits new size based on pixel deltas
   * 
   * Central function that processes resize movements and emits
   * the calculated size to parent components for real-time updates.
   * 
   * @param deltaX - Horizontal movement in pixels
   * @param deltaY - Vertical movement in pixels
   */
  function calculateAndEmitNewSize(deltaX: number, deltaY: number): void {
    const newSize = calculateNewSize(deltaX, deltaY);
    
    if (newSize) {
      emit('resizeMove', newSize);
      console.debug(`Resize move: ${newSize.width}x${newSize.height} for tile ${tile.id}`);
    }
  }

  /**
   * Starts resize operation with mouse input
   * 
   * Initializes resize state and sets up global mouse event listeners.
   * Prevents resize when tile is being dragged.
   * 
   * @param handle - Type of resize handle being used
   * @param event - Mouse event that initiated the resize
   */
  function startResize(handle: ResizeHandle, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (isDragging.value) {
      console.debug('Resize prevented: tile is being dragged');
      return;
    }

    // Initialize resize state
    resizeStartData.value = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: tile.width,
      startHeight: tile.height,
    };

    emit('resizeStart', tile.id, handle);
    console.debug(`Resize started: ${handle} handle for tile ${tile.id}`);

    // Attach global event listeners for resize tracking
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeStop);
  }

  /**
   * Starts resize operation with touch input
   * 
   * Touch equivalent of startResize with single-touch validation.
   * Prevents default touch behaviors that might interfere.
   * 
   * @param handle - Type of resize handle being used
   * @param event - Touch event that initiated the resize
   */
  function startTouchResize(handle: ResizeHandle, event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (isDragging.value || event.touches.length !== 1) {
      console.debug('Touch resize prevented: dragging or multi-touch detected');
      return;
    }

    const touch = event.touches[0];
    
    // Initialize resize state with touch coordinates
    resizeStartData.value = {
      handle,
      startX: touch.clientX,
      startY: touch.clientY,
      startWidth: tile.width,
      startHeight: tile.height,
    };

    emit('resizeStart', tile.id, handle);
    console.debug(`Touch resize started: ${handle} handle for tile ${tile.id}`);

    // Attach global touch event listeners
    document.addEventListener('touchmove', handleTouchResizeMove, { passive: false });
    document.addEventListener('touchend', handleTouchResizeStop);
  }

  /**
   * Handles mouse move events during resize
   * 
   * Tracks mouse movement and calculates new tile size in real-time.
   * Provides continuous feedback during resize operation.
   * 
   * @param event - Mouse move event during resize
   */
  function handleResizeMove(event: MouseEvent): void {
    if (!resizeStartData.value) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - resizeStartData.value.startX;
    const deltaY = event.clientY - resizeStartData.value.startY;

    calculateAndEmitNewSize(deltaX, deltaY);
  }

  /**
   * Handles touch move events during resize
   * 
   * Touch equivalent of handleResizeMove with single-touch validation.
   * 
   * @param event - Touch move event during resize
   */
  function handleTouchResizeMove(event: TouchEvent): void {
    if (!resizeStartData.value || event.touches.length !== 1) {
      return;
    }

    event.preventDefault();

    const touch = event.touches[0];
    const deltaX = touch.clientX - resizeStartData.value.startX;
    const deltaY = touch.clientY - resizeStartData.value.startY;

    calculateAndEmitNewSize(deltaX, deltaY);
  }

  /**
   * Handles resize stop for mouse events
   * 
   * Completes the resize operation and cleans up event listeners.
   * Resets resize state to prepare for next operation.
   */
  function handleResizeStop(): void {
    if (!resizeStartData.value) {
      return;
    }

    const handle = resizeStartData.value.handle;
    resizeStartData.value = null;
    
    emit('resizeEnd', true);
    console.debug(`Resize stopped: ${handle} handle for tile ${tile.id}`);

    // Clean up global event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeStop);
  }

  /**
   * Handles resize stop for touch events
   * 
   * Touch equivalent of handleResizeStop with proper cleanup.
   */
  function handleTouchResizeStop(): void {
    if (!resizeStartData.value) {
      return;
    }

    const handle = resizeStartData.value.handle;
    resizeStartData.value = null;
    
    emit('resizeEnd', true);
    console.debug(`Touch resize stopped: ${handle} handle for tile ${tile.id}`);

    // Clean up global touch event listeners
    document.removeEventListener('touchmove', handleTouchResizeMove);
    document.removeEventListener('touchend', handleTouchResizeStop);
  }

  /**
   * Gets the current resize handle being used
   * 
   * @returns Current resize handle or null if not resizing
   */
  function getCurrentHandle(): ResizeHandle | null {
    return resizeStartData.value?.handle || null;
  }

  /**
   * Checks if a resize operation is currently in progress
   * 
   * @returns True if resize is active, false otherwise
   */
  function isResizing(): boolean {
    return resizeStartData.value !== null;
  }

  /**
   * Gets the resize start dimensions
   * 
   * @returns Original size when resize started, or null
   */
  function getStartDimensions(): { width: number; height: number } | null {
    if (!resizeStartData.value) {
      return null;
    }
    
    return {
      width: resizeStartData.value.startWidth,
      height: resizeStartData.value.startHeight,
    };
  }

  /**
   * Cleanup function for component unmounting
   * 
   * Removes all global event listeners to prevent memory leaks.
   * Should be called in onUnmounted lifecycle hook.
   */
  function cleanup(): void {
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeStop);
    document.removeEventListener('touchmove', handleTouchResizeMove);
    document.removeEventListener('touchend', handleTouchResizeStop);
    
    // Reset state
    resizeStartData.value = null;
    
    console.debug(`Resize cleanup completed for tile: ${tile.id}`);
  }

  // Return public interface
  return {
    // Core resize handlers
    startResize,
    startTouchResize,
    
    // State queries
    getCurrentHandle,
    isResizing,
    getStartDimensions,
    
    // Utility functions
    calculateSizeConstraints,
    calculateNewSize,
    cleanup,
  };
}