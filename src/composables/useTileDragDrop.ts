/**
 * Tile Drag and Drop Composable
 * 
 * Provides reusable drag and drop functionality for tiles, supporting both
 * mouse and touch events with comprehensive state management.
 * 
 * Features:
 * - Mouse and touch event handling
 * - Drag initiation from handle or tile body
 * - Grid position calculation
 * - Event emission for parent coordination
 * - Accessibility support
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import { ref, type Ref } from 'vue';
import type { Tile } from '@/types/dashboard';

/**
 * Drag and drop state interface
 */
interface DragState {
  isMouseDown: boolean;
  dragStartPosition: { x: number; y: number } | null;
}

/**
 * Grid position interface
 */
interface GridPosition {
  x: number;
  y: number;
}

/**
 * Drag and drop event emitter interface
 */
interface DragDropEmits {
  dragStart: [tileId: string];
  dragMove: [position: GridPosition];
  dragEnd: [commit: boolean];
}

/**
 * Composable options interface
 */
interface UseTileDragDropOptions {
  tile: Tile;
  tileElement: Ref<HTMLElement | undefined>;
  gridColumns: number;
  rowHeight: number;
  isResizing: Ref<boolean>;
  emit: (event: string, ...args: unknown[]) => void;
}

/**
 * Tile Drag and Drop Composable
 * 
 * Provides comprehensive drag and drop functionality with mouse and touch support.
 * Calculates grid positions and manages drag state with proper cleanup.
 * 
 * Time Complexity: O(1) for all operations
 * Space Complexity: O(1)
 * 
 * @param options - Configuration options for drag and drop behavior
 * @returns Drag and drop handlers and state
 * 
 * @example
 * ```typescript
 * const { 
 *   handleDragStart, 
 *   startDragFromHandle,
 *   isMouseDown 
 * } = useTileDragDrop({
 *   tile: tileRef.value,
 *   tileElement,
 *   gridColumns: 12,
 *   rowHeight: 100,
 *   isResizing,
 *   emit
 * });
 * ```
 */
export function useTileDragDrop(options: UseTileDragDropOptions) {
  const { tile, tileElement, gridColumns, rowHeight, isResizing, emit } = options;

  // Reactive state for drag operations
  const dragState = ref<DragState>({
    isMouseDown: false,
    dragStartPosition: null,
  });

  /**
   * Calculates grid position from pixel coordinates
   * 
   * Converts client coordinates to grid positions, ensuring tiles
   * stay within grid boundaries and snap to valid positions.
   * 
   * @param clientX - X coordinate in pixels relative to viewport
   * @param clientY - Y coordinate in pixels relative to viewport
   * @returns Grid position with x and y coordinates
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function getGridPositionFromCoordinates(clientX: number, clientY: number): GridPosition {
    const container = tileElement.value?.closest('.grid-container') as HTMLElement;
    if (!container) {
      console.warn('Grid container not found, returning default position');
      return { x: 0, y: 0 };
    }

    const rect = container.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const columnWidth = rect.width / gridColumns;

    // Calculate grid position with boundary constraints
    const gridX = Math.max(
      0, 
      Math.min(
        gridColumns - tile.width, 
        Math.floor(relativeX / columnWidth)
      )
    );
    const gridY = Math.max(0, Math.floor(relativeY / rowHeight));

    return { x: gridX, y: gridY };
  }

  /**
   * Handles HTML5 drag start event
   * 
   * Initializes HTML5 drag and drop with proper data transfer setup.
   * Prevents dragging when tile is being resized.
   * 
   * @param event - HTML5 drag event
   */
  function handleDragStart(event: DragEvent): void {
    if (isResizing.value) {
      event.preventDefault();
      console.debug('Drag prevented: tile is being resized');
      return;
    }

    // Set drag data for HTML5 drag and drop compatibility
    event.dataTransfer?.setData('text/plain', tile.id);

    // Customize drag image for better visual feedback
    const rect = tileElement.value?.getBoundingClientRect();
    if (rect && event.dataTransfer && tileElement.value) {
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      event.dataTransfer.setDragImage(tileElement.value, offsetX, offsetY);
    }

    emit('dragStart', tile.id);
    console.debug(`Drag started for tile: ${tile.id}`);
  }

  /**
   * Handles HTML5 drag end event
   * 
   * Completes the drag operation and notifies parent components.
   */
  function handleDragEnd(): void {
    emit('dragEnd', true);
    console.debug(`Drag ended for tile: ${tile.id}`);
  }

  /**
   * Starts drag operation from the drag handle
   * 
   * Initiates manual drag handling for better control than HTML5 drag and drop.
   * Sets up mouse event listeners for drag tracking.
   * 
   * @param event - Mouse event from drag handle
   */
  function startDragFromHandle(event: MouseEvent): void {
    event.preventDefault();

    if (isResizing.value) {
      console.debug('Drag from handle prevented: tile is being resized');
      return;
    }

    // Initialize drag state
    dragState.value.dragStartPosition = { 
      x: event.clientX, 
      y: event.clientY 
    };
    dragState.value.isMouseDown = true;

    emit('dragStart', tile.id);
    console.debug(`Manual drag started from handle for tile: ${tile.id}`);

    // Attach global event listeners for drag tracking
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragStop);
  }

  /**
   * Starts touch drag operation from the drag handle
   * 
   * Handles touch-based dragging for mobile devices.
   * Prevents default touch behaviors that might interfere.
   * 
   * @param event - Touch event from drag handle
   */
  function startTouchDragFromHandle(event: TouchEvent): void {
    event.preventDefault();

    if (isResizing.value || event.touches.length !== 1) {
      console.debug('Touch drag prevented: resizing or multi-touch detected');
      return;
    }

    const touch = event.touches[0];
    dragState.value.dragStartPosition = { 
      x: touch.clientX, 
      y: touch.clientY 
    };
    dragState.value.isMouseDown = true;

    emit('dragStart', tile.id);
    console.debug(`Touch drag started from handle for tile: ${tile.id}`);

    // Attach global touch event listeners
    document.addEventListener('touchmove', handleTouchDragMove, { passive: false });
    document.addEventListener('touchend', handleTouchDragStop);
  }

  /**
   * Handles mouse down on tile for drag initiation
   * 
   * Determines if drag should start based on the target element.
   * Prevents dragging when clicking on interactive elements.
   * 
   * @param event - Mouse down event on tile
   */
  function handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Prevent drag when clicking on interactive elements
    const preventDragSelectors = [
      '.tile-controls',
      '.resize-handle', 
      'button',
      'input',
      'select', 
      'textarea',
      '.modal'
    ];

    const shouldPreventDrag = preventDragSelectors.some(selector => 
      target.closest(selector)
    );

    if (shouldPreventDrag) {
      console.debug('Drag prevented: clicked on interactive element');
      return;
    }

    startDragFromHandle(event);
  }

  /**
   * Handles touch start on tile for drag initiation
   * 
   * Touch equivalent of handleMouseDown with same prevention logic.
   * 
   * @param event - Touch start event on tile
   */
  function handleTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    
    // Same prevention logic as mouse events
    const preventDragSelectors = [
      '.tile-controls',
      '.resize-handle',
      'button', 
      'input',
      'select',
      'textarea',
      '.modal'
    ];

    const shouldPreventDrag = preventDragSelectors.some(selector => 
      target.closest(selector)
    );

    if (shouldPreventDrag) {
      console.debug('Touch drag prevented: touched interactive element');
      return;
    }

    startTouchDragFromHandle(event);
  }

  /**
   * Handles drag move events
   * 
   * Tracks mouse movement during drag and emits position updates.
   * Calculates grid position and provides real-time feedback.
   * 
   * @param event - Mouse move event during drag
   */
  function handleDragMove(event: MouseEvent): void {
    if (!dragState.value.isMouseDown || !dragState.value.dragStartPosition) {
      return;
    }

    event.preventDefault();

    const position = getGridPositionFromCoordinates(event.clientX, event.clientY);
    emit('dragMove', position);
  }

  /**
   * Handles touch drag move events
   * 
   * Touch equivalent of handleDragMove for mobile devices.
   * 
   * @param event - Touch move event during drag
   */
  function handleTouchDragMove(event: TouchEvent): void {
    if (!dragState.value.isMouseDown || 
        !dragState.value.dragStartPosition || 
        event.touches.length !== 1) {
      return;
    }

    event.preventDefault();

    const touch = event.touches[0];
    const position = getGridPositionFromCoordinates(touch.clientX, touch.clientY);
    emit('dragMove', position);
  }

  /**
   * Handles drag stop for mouse events
   * 
   * Completes the drag operation and cleans up event listeners.
   * Resets drag state to prepare for next operation.
   */
  function handleDragStop(): void {
    if (!dragState.value.isMouseDown) {
      return;
    }

    // Reset drag state
    dragState.value.isMouseDown = false;
    dragState.value.dragStartPosition = null;

    emit('dragEnd', true);
    console.debug(`Manual drag stopped for tile: ${tile.id}`);

    // Clean up global event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragStop);
  }

  /**
   * Handles drag stop for touch events
   * 
   * Touch equivalent of handleDragStop with proper cleanup.
   */
  function handleTouchDragStop(): void {
    if (!dragState.value.isMouseDown) {
      return;
    }

    // Reset drag state
    dragState.value.isMouseDown = false;
    dragState.value.dragStartPosition = null;

    emit('dragEnd', true);
    console.debug(`Touch drag stopped for tile: ${tile.id}`);

    // Clean up global touch event listeners
    document.removeEventListener('touchmove', handleTouchDragMove);
    document.removeEventListener('touchend', handleTouchDragStop);
  }

  /**
   * Cleanup function for component unmounting
   * 
   * Removes all global event listeners to prevent memory leaks.
   * Should be called in onUnmounted lifecycle hook.
   */
  function cleanup(): void {
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragStop);
    document.removeEventListener('touchmove', handleTouchDragMove);
    document.removeEventListener('touchend', handleTouchDragStop);
    console.debug(`Drag drop cleanup completed for tile: ${tile.id}`);
  }

  // Return public interface
  return {
    // State
    isMouseDown: dragState.value.isMouseDown,
    
    // HTML5 Drag and Drop handlers
    handleDragStart,
    handleDragEnd,
    
    // Manual drag handlers
    startDragFromHandle,
    startTouchDragFromHandle,
    handleMouseDown,
    handleTouchStart,
    
    // Utility functions
    getGridPositionFromCoordinates,
    cleanup,
  };
}