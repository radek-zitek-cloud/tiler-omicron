/**
 * Core types for the Dashboard Tiling System
 * 
 * This file defines the TypeScript interfaces and types used throughout
 * the dashboard application, based on the requirements specification.
 */

/**
 * Represents a single tile in the dashboard grid system.
 * 
 * @interface Tile
 */
export interface Tile {
  /** Unique identifier for the tile */
  id: string;
  
  /** Display title for the tile */
  title: string;
  
  /** Grid column position (0-based) */
  x: number;
  
  /** Grid row position (0-based) */
  y: number;
  
  /** Width in grid units */
  width: number;
  
  /** Height in grid units */
  height: number;
  
  /** Minimum width constraint (optional) */
  minWidth?: number;
  
  /** Minimum height constraint (optional) */
  minHeight?: number;
  
  /** Maximum width constraint (optional) */
  maxWidth?: number;
  
  /** Maximum height constraint (optional) */
  maxHeight?: number;
  
  /** Timestamp when tile was created */
  created: Date;
  
  /** Timestamp when tile was last modified */
  modified: Date;
}

/**
 * Represents the complete dashboard layout configuration.
 * 
 * @interface DashboardLayout
 */
export interface DashboardLayout {
  /** Unique identifier for the layout */
  id: string;
  
  /** Human-readable name for the layout */
  name: string;
  
  /** Array of tiles in this layout */
  tiles: Tile[];
  
  /** Number of columns in the grid system */
  gridColumns: number;
  
  /** Timestamp when layout was created */
  created: Date;
  
  /** Timestamp when layout was last modified */
  modified: Date;
}

/**
 * Configuration for grid system breakpoints and responsiveness.
 * 
 * @interface GridConfig
 */
export interface GridConfig {
  /** Number of columns for desktop view (1200px+) */
  desktop: number;
  
  /** Number of columns for tablet view (768px-1199px) */
  tablet: number;
  
  /** Number of columns for mobile view (576px-767px) */
  mobile: number;
  
  /** Number of columns for small mobile view (<576px) */
  smallMobile: number;
  
  /** Gap between tiles in pixels */
  gap: number;
  
  /** Container padding in pixels */
  padding: number;
}

/**
 * Drag and drop operation state tracking.
 * 
 * @interface DragState
 */
export interface DragState {
  /** Whether a drag operation is currently active */
  isDragging: boolean;
  
  /** ID of the tile being dragged */
  draggedTileId: string | null;
  
  /** Original position of dragged tile */
  originalPosition: { x: number; y: number } | null;
  
  /** Current drag position */
  currentPosition: { x: number; y: number } | null;
}

/**
 * Resize operation state tracking.
 * 
 * @interface ResizeState
 */
export interface ResizeState {
  /** Whether a resize operation is currently active */
  isResizing: boolean;
  
  /** ID of the tile being resized */
  resizedTileId: string | null;
  
  /** Original size of resized tile */
  originalSize: { width: number; height: number } | null;
  
  /** Current resize dimensions */
  currentSize: { width: number; height: number } | null;
  
  /** Which handle is being used for resizing */
  resizeHandle: 'se' | 'e' | 's' | null;
}

/**
 * Available tile operation types.
 */
export type TileOperation = 'create' | 'delete' | 'move' | 'resize';

/**
 * Event payload for tile operations.
 * 
 * @interface TileOperationEvent
 */
export interface TileOperationEvent {
  /** Type of operation performed */
  operation: TileOperation;
  
  /** ID of the affected tile */
  tileId: string;
  
  /** Additional operation-specific data */
  data?: unknown;
  
  /** Timestamp of the operation */
  timestamp: Date;
}

/**
 * Grid position calculation result.
 * 
 * @interface GridPosition
 */
export interface GridPosition {
  /** Column position in grid */
  x: number;
  
  /** Row position in grid */
  y: number;
  
  /** Whether this position is valid/available */
  isValid: boolean;
  
  /** Whether this position would cause conflicts */
  hasConflicts: boolean;
}

/**
 * Default configuration values for the grid system.
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  desktop: 12,
  tablet: 8,
  mobile: 4,
  smallMobile: 1,
  gap: 8,
  padding: 16,
};

/**
 * Default tile dimensions.
 */
export const DEFAULT_TILE_SIZE = {
  width: 2,
  height: 2,
  minWidth: 1,
  minHeight: 1,
};

/**
 * Responsive breakpoint values in pixels.
 */
export const BREAKPOINTS = {
  smallMobile: 576,
  mobile: 768,
  tablet: 1200,
} as const;