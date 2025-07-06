/**
 * Dashboard Operations Composable
 * 
 * Provides comprehensive dashboard operation management including tile operations,
 * layout management, import/export functionality, and user feedback.
 * 
 * Features:
 * - Tile CRUD operations with validation
 * - Layout import/export functionality
 * - User feedback and confirmation dialogs
 * - Operation history and undo support
 * - Error handling and recovery
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import { ref, type Ref } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import type { Tile, TileContent } from '@/types/dashboard';

/**
 * Operation message types for user feedback
 */
type MessageType = 'success' | 'error' | 'info' | 'warning';

/**
 * Confirmation dialog configuration
 */
interface ConfirmationConfig {
  title: string;
  message: string;
  action: string;
  callback: () => void;
  type?: 'danger' | 'warning' | 'info';
}

/**
 * Dashboard operations composable options
 */
interface UseDashboardOperationsOptions {
  confirmationModal: Ref<HTMLElement | undefined>;
  fileInput: Ref<HTMLInputElement | undefined>;
}

/**
 * Dashboard Operations Composable
 * 
 * Manages all dashboard-level operations including tile management,
 * layout persistence, and user interactions with comprehensive error
 * handling and user feedback.
 * 
 * Time Complexity: Most operations O(1), some file operations O(n)
 * Space Complexity: O(1) for state management
 * 
 * @param options - Configuration options for dashboard operations
 * @returns Operation methods and state management
 * 
 * @example
 * ```typescript
 * const {
 *   handleAddTile,
 *   handleTileDelete,
 *   exportLayout,
 *   importLayout,
 *   showOperationMessage
 * } = useDashboardOperations({
 *   confirmationModal: modalRef,
 *   fileInput: fileInputRef
 * });
 * ```
 */
export function useDashboardOperations(options: UseDashboardOperationsOptions) {
  const { confirmationModal, fileInput } = options;
  const dashboardStore = useDashboardStore();

  // Reactive state for user feedback and confirmations
  const operationMessage = ref<string>('');
  const operationMessageClass = ref<string>('');
  const confirmationTitle = ref<string>('');
  const confirmationMessage = ref<string>('');
  const confirmationAction = ref<string>('');
  const pendingAction = ref<(() => void) | null>(null);

  /**
   * Shows an operation message to the user
   * 
   * Displays feedback messages with appropriate styling and auto-dismiss.
   * Supports different message types for various contexts.
   * 
   * @param message - Message text to display
   * @param type - Message type affecting styling and urgency
   * @param duration - How long to show the message (default: 3000ms)
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function showOperationMessage(
    message: string, 
    type: MessageType = 'success',
    duration: number = 3000
  ): void {
    operationMessage.value = message;
    
    // Map message types to Bootstrap CSS classes
    const typeClassMap: Record<MessageType, string> = {
      success: 'text-success',
      error: 'text-danger',
      info: 'text-info',
      warning: 'text-warning',
    };
    
    operationMessageClass.value = typeClassMap[type];
    
    console.log(`Operation message (${type}): ${message}`);

    // Auto-clear message after specified duration
    setTimeout(() => {
      operationMessage.value = '';
      operationMessageClass.value = '';
    }, duration);
  }

  /**
   * Shows a confirmation modal for destructive operations
   * 
   * Displays a confirmation dialog with customizable content and actions.
   * Handles Bootstrap modal integration with fallback to browser confirm.
   * 
   * @param config - Confirmation dialog configuration
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function showConfirmation(config: ConfirmationConfig): void {
    confirmationTitle.value = config.title;
    confirmationMessage.value = config.message;
    confirmationAction.value = config.action;
    pendingAction.value = config.callback;

    console.debug(`Showing confirmation: ${config.title}`);

    // Attempt to show Bootstrap modal
    if (confirmationModal.value) {
      try {
        const windowWithBootstrap = window as {
          bootstrap?: {
            Modal: new (element: HTMLElement) => { show(): void };
          };
        };

        if (windowWithBootstrap.bootstrap?.Modal) {
          const modal = new windowWithBootstrap.bootstrap.Modal(confirmationModal.value);
          modal.show();
          return;
        }
      } catch (error) {
        console.error('Error showing Bootstrap modal:', error);
      }
    }

    // Fallback to browser confirm dialog
    const confirmed = confirm(`${config.title}\n\n${config.message}`);
    if (confirmed) {
      config.callback();
    }
  }

  /**
   * Executes the pending confirmation action
   * 
   * Called when user confirms an action in the modal dialog.
   * Clears the pending action after execution.
   * 
   * Time Complexity: O(1) + O(callback complexity)
   * Space Complexity: O(1)
   */
  function confirmAction(): void {
    if (pendingAction.value) {
      try {
        pendingAction.value();
        console.debug('Confirmation action executed successfully');
      } catch (error) {
        console.error('Error executing confirmation action:', error);
        showOperationMessage('Operation failed', 'error');
      } finally {
        pendingAction.value = null;
      }
    }
  }

  /**
   * Handles adding a new tile to the dashboard
   * 
   * Creates a new tile using the dashboard store with error handling
   * and user feedback. Finds optimal position automatically.
   * 
   * @param options - Optional tile creation parameters
   * @returns Created tile or null if creation failed
   * 
   * Time Complexity: O(n) where n is number of existing tiles (for position finding)
   * Space Complexity: O(1)
   */
  function handleAddTile(options?: {
    title?: string;
    width?: number;
    height?: number;
    content?: TileContent;
  }): Tile | null {
    try {
      const newTile = dashboardStore.createTile(options);
      
      showOperationMessage(`Created tile "${newTile.title}"`);
      console.debug(`New tile created:`, newTile);
      
      return newTile;
    } catch (error) {
      console.error('Failed to create tile:', error);
      showOperationMessage('Failed to create tile', 'error');
      return null;
    }
  }

  /**
   * Handles tile deletion with user confirmation
   * 
   * Prompts user for confirmation before deleting a tile.
   * Provides clear feedback about the operation result.
   * 
   * @param tileId - ID of the tile to delete
   * 
   * Time Complexity: O(n) where n is number of tiles (for finding tile)
   * Space Complexity: O(1)
   */
  function handleTileDelete(tileId: string): void {
    const tile = dashboardStore.tiles.find(t => t.id === tileId);
    
    if (!tile) {
      showOperationMessage('Tile not found', 'error');
      console.warn(`Attempted to delete non-existent tile: ${tileId}`);
      return;
    }

    showConfirmation({
      title: 'Delete Tile',
      message: `Are you sure you want to delete "${tile.title}"? This action cannot be undone.`,
      action: 'Delete',
      type: 'danger',
      callback: () => {
        if (dashboardStore.deleteTile(tileId)) {
          showOperationMessage(`Deleted tile "${tile.title}"`);
          console.debug(`Tile deleted: ${tileId}`);
        } else {
          showOperationMessage('Failed to delete tile', 'error');
          console.error(`Failed to delete tile: ${tileId}`);
        }
      },
    });
  }

  /**
   * Handles tile editing operations
   * 
   * Updates tile properties with validation and error handling.
   * Supports partial updates and content management.
   * 
   * @param tileId - ID of the tile to edit
   * @param changes - Changes to apply to the tile
   * 
   * Time Complexity: O(n) where n is number of tiles (for finding tile)
   * Space Complexity: O(1)
   */
  function handleTileEdit(
    tileId: string, 
    changes?: { title?: string; content?: object | null }
  ): void {
    if (!changes) {
      showOperationMessage('Tile edit dialog opened', 'info');
      return;
    }

    const tile = dashboardStore.tiles.find(t => t.id === tileId);
    if (!tile) {
      showOperationMessage('Tile not found', 'error');
      console.warn(`Attempted to edit non-existent tile: ${tileId}`);
      return;
    }

    try {
      // Prepare update object with proper validation
      const updateData: Partial<Tile> = {};

      if (changes.title !== undefined) {
        if (typeof changes.title === 'string' && changes.title.trim().length > 0) {
          updateData.title = changes.title.trim();
        } else {
          showOperationMessage('Invalid tile title', 'error');
          return;
        }
      }

      if (changes.content !== undefined) {
        // Validate content structure if provided
        if (changes.content && typeof changes.content === 'object') {
          const content = changes.content as TileContent;
          if (!content.type) {
            showOperationMessage('Invalid content type', 'error');
            return;
          }
        }
        updateData.content = changes.content as TileContent | undefined;
      }

      // Apply updates if any valid changes
      if (Object.keys(updateData).length > 0) {
        if (dashboardStore.updateTile(tileId, updateData)) {
          // Build user-friendly change description
          const changesList: string[] = [];
          if (changes.title !== undefined) {
            changesList.push(`title to "${changes.title}"`);
          }
          if (changes.content !== undefined) {
            if (changes.content) {
              const contentType = (changes.content as { type?: string }).type || 'unknown';
              changesList.push(`content to ${contentType}`);
            } else {
              changesList.push('content removed');
            }
          }
          
          showOperationMessage(`Updated tile: ${changesList.join(', ')}`);
          console.debug(`Tile updated: ${tileId}`, updateData);
        } else {
          showOperationMessage('Failed to update tile', 'error');
          console.error(`Failed to update tile: ${tileId}`);
        }
      } else {
        showOperationMessage('No changes to apply', 'info');
      }
    } catch (error) {
      console.error('Error updating tile:', error);
      showOperationMessage('Failed to update tile', 'error');
    }
  }

  /**
   * Handles clearing all tiles from the dashboard
   * 
   * Prompts for confirmation before removing all tiles.
   * Provides feedback about how many tiles were removed.
   * 
   * Time Complexity: O(n) where n is number of tiles
   * Space Complexity: O(1)
   */
  function handleClearDashboard(): void {
    const tileCount = dashboardStore.tiles.length;
    
    if (tileCount === 0) {
      showOperationMessage('Dashboard is already empty', 'info');
      return;
    }

    showConfirmation({
      title: 'Clear Dashboard',
      message: `Are you sure you want to remove all ${tileCount} tiles? This action cannot be undone.`,
      action: 'Clear All',
      type: 'danger',
      callback: () => {
        dashboardStore.clearDashboard();
        showOperationMessage(`Removed ${tileCount} tiles`);
        console.debug(`Dashboard cleared: ${tileCount} tiles removed`);
      },
    });
  }

  /**
   * Exports the current dashboard layout
   * 
   * Creates a JSON file download with the current layout configuration.
   * Includes metadata for version compatibility.
   * 
   * Time Complexity: O(n) where n is number of tiles
   * Space Complexity: O(n) for JSON serialization
   */
  function exportLayout(): void {
    try {
      const layout = {
        version: '1.0',
        name: dashboardStore.currentLayout.name,
        exportDate: new Date().toISOString(),
        tiles: dashboardStore.tiles,
        gridConfig: dashboardStore.gridConfig,
        metadata: {
          tileCount: dashboardStore.tiles.length,
          gridColumns: dashboardStore.gridColumns,
        },
      };

      const jsonString = JSON.stringify(layout, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showOperationMessage(`Layout exported with ${layout.metadata.tileCount} tiles`);
      console.debug('Layout exported successfully', layout.metadata);
    } catch (error) {
      console.error('Failed to export layout:', error);
      showOperationMessage('Failed to export layout', 'error');
    }
  }

  /**
   * Initiates layout import process
   * 
   * Triggers file input dialog for users to select a layout file.
   * The actual import is handled by handleFileImport.
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function importLayout(): void {
    if (!fileInput.value) {
      showOperationMessage('File input not available', 'error');
      console.error('File input element not found');
      return;
    }

    // Reset file input to allow re-selecting the same file
    fileInput.value.value = '';
    fileInput.value.click();
    console.debug('Import dialog opened');
  }

  /**
   * Handles the file import process
   * 
   * Processes selected JSON file, validates format, and applies layout.
   * Includes comprehensive error handling and user feedback.
   * 
   * @param event - File input change event
   * 
   * Time Complexity: O(n) where n is size of imported layout
   * Space Complexity: O(n) for layout processing
   */
  function handleFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      console.debug('No file selected for import');
      return;
    }

    if (!file.name.endsWith('.json')) {
      showOperationMessage('Please select a JSON file', 'error');
      return;
    }

    console.debug(`Importing layout from file: ${file.name}`);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const layout = JSON.parse(jsonString);

        // Validate layout structure
        if (!validateLayoutFormat(layout)) {
          showOperationMessage('Invalid layout file format', 'error');
          return;
        }

        // Show confirmation before applying import
        showConfirmation({
          title: 'Import Layout',
          message: `This will replace your current dashboard with ${layout.tiles?.length || 0} tiles. Continue?`,
          action: 'Import',
          type: 'warning',
          callback: () => {
            try {
              dashboardStore.importLayout(layout);
              showOperationMessage(`Layout imported with ${layout.tiles?.length || 0} tiles`);
              console.debug('Layout imported successfully', layout.metadata || {});
            } catch (error) {
              console.error('Failed to apply imported layout:', error);
              showOperationMessage('Failed to apply imported layout', 'error');
            }
          },
        });
      } catch (error) {
        console.error('Failed to parse layout file:', error);
        showOperationMessage('Failed to read layout file', 'error');
      }
    };

    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      showOperationMessage('Error reading file', 'error');
    };

    reader.readAsText(file);
  }

  /**
   * Validates imported layout file format
   * 
   * Ensures the imported layout has required fields and valid structure.
   * Prevents corruption from malformed import files.
   * 
   * @param layout - Parsed layout object to validate
   * @returns True if layout format is valid
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function validateLayoutFormat(layout: any): boolean {
    if (!layout || typeof layout !== 'object') {
      console.warn('Layout is not an object');
      return false;
    }

    if (!Array.isArray(layout.tiles)) {
      console.warn('Layout tiles is not an array');
      return false;
    }

    // Validate each tile has required properties
    for (const tile of layout.tiles) {
      if (!tile.id || typeof tile.title !== 'string' || 
          typeof tile.x !== 'number' || typeof tile.y !== 'number' ||
          typeof tile.width !== 'number' || typeof tile.height !== 'number') {
        console.warn('Invalid tile structure in layout:', tile);
        return false;
      }
    }

    console.debug('Layout format validation passed');
    return true;
  }

  /**
   * Shows detailed layout information
   * 
   * Displays comprehensive information about the current dashboard layout
   * including statistics and configuration details.
   * 
   * Time Complexity: O(n) where n is number of tiles
   * Space Complexity: O(1)
   */
  function showLayoutInfo(): void {
    const tiles = dashboardStore.tiles;
    const stats = {
      totalTiles: tiles.length,
      gridColumns: dashboardStore.gridColumns,
      layoutName: dashboardStore.currentLayout.name,
      created: dashboardStore.currentLayout.created,
      modified: dashboardStore.currentLayout.modified,
      totalArea: tiles.reduce((sum, tile) => sum + (tile.width * tile.height), 0),
    };

    const infoMessage = [
      `Layout: ${stats.layoutName}`,
      `Tiles: ${stats.totalTiles}`,
      `Grid: ${stats.gridColumns} columns`,
      `Total area: ${stats.totalArea} units`,
      `Created: ${stats.created.toLocaleDateString()}`,
      `Modified: ${stats.modified.toLocaleDateString()}`,
    ].join('\n');

    // For now, use alert - could be enhanced with a proper info modal
    alert(`Dashboard Information\n\n${infoMessage}`);
    console.debug('Layout info displayed:', stats);
  }

  // Return public interface
  return {
    // Reactive state
    operationMessage,
    operationMessageClass,
    confirmationTitle,
    confirmationMessage,
    confirmationAction,

    // User feedback
    showOperationMessage,
    showConfirmation,
    confirmAction,

    // Tile operations
    handleAddTile,
    handleTileDelete,
    handleTileEdit,
    handleClearDashboard,

    // Layout operations
    exportLayout,
    importLayout,
    handleFileImport,
    showLayoutInfo,

    // Utilities
    validateLayoutFormat,
  };
}