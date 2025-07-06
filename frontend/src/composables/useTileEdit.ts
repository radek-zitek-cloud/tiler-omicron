/**
 * Tile Edit Composable
 * 
 * Provides reusable edit functionality for tiles, including form validation,
 * content type management, and modal interaction handling.
 * 
 * Features:
 * - Form state management for tile editing
 * - Content type configuration with validation
 * - Modal lifecycle management
 * - Bootstrap modal integration
 * - Real-time form validation
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import { ref, computed, type Ref } from 'vue';
import type { Tile, TileContentType } from '@/types/dashboard';
import { TILE_CONTENT_TYPES } from '@/types/dashboard';

/**
 * Edit configuration interface for different content types
 */
interface EditContentConfig {
  // Equity quote properties
  symbol?: string;
  // Placeholder properties  
  message?: string;
  // News properties
  query?: string;
  articleCount?: number;
  language?: string;
  country?: string;
  // Common properties
  autoRefresh?: boolean;
  refreshInterval?: number;
  displayOptions: {
    // Equity display options
    showChange: boolean;
    showPercentChange: boolean;
    showVolume: boolean;
    showChart: boolean;
    // News display options
    showImages?: boolean;
    showSource?: boolean;
    showTimestamp?: boolean;
    compactView?: boolean;
  };
}

/**
 * Edit form change data interface
 */
interface TileEditChanges {
  title?: string;
  content?: object | null;
}

/**
 * Edit event emitter interface
 */
interface EditEmits {
  tileEdit: [tileId: string, changes?: TileEditChanges];
}

/**
 * Composable options interface
 */
interface UseTileEditOptions {
  tile: Tile;
  editModal: Ref<HTMLElement | undefined>;
  emit: (event: keyof EditEmits, ...args: any[]) => void;
}

/**
 * Default display options for all content types
 */
const DEFAULT_DISPLAY_OPTIONS = {
  showChange: true,
  showPercentChange: true,
  showVolume: true,
  showChart: false,
  showImages: false,
  showSource: true,
  showTimestamp: true,
  compactView: false,
} as const;

/**
 * Tile Edit Composable
 * 
 * Manages tile editing operations with comprehensive form validation,
 * content type configuration, and modal interactions. Provides a clean
 * interface for tile property modifications.
 * 
 * Time Complexity: O(1) for most operations, O(n) for content validation where n is config size
 * Space Complexity: O(1)
 * 
 * @param options - Configuration options for edit behavior
 * @returns Edit handlers, form state, and validation functions
 * 
 * @example
 * ```typescript
 * const { 
 *   editTitle,
 *   editContentType,
 *   handleEdit,
 *   handleSaveEdit,
 *   isEditValid 
 * } = useTileEdit({
 *   tile: tileRef.value,
 *   editModal,
 *   emit
 * });
 * ```
 */
export function useTileEdit(options: UseTileEditOptions) {
  const { tile, editModal, emit } = options;

  // Form state management
  const editTitle = ref<string>('');
  const editContentType = ref<TileContentType | ''>('');
  const editContentConfig = ref<EditContentConfig>({
    displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
  });

  // Content types registry
  const contentTypes = TILE_CONTENT_TYPES;

  /**
   * Validates if the edit form has valid data
   * 
   * Checks title length and format requirements.
   * Can be extended for additional validation rules.
   * 
   * @returns True if form is valid, false otherwise
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  const isEditValid = computed(() => {
    const trimmedTitle = editTitle.value.trim();
    return trimmedTitle.length > 0 && trimmedTitle.length <= 100;
  });

  /**
   * Initializes form data with current tile values
   * 
   * Populates edit form fields with existing tile configuration.
   * Handles different content types and their specific configurations.
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function initializeEditForm(): void {
    // Initialize basic tile properties
    editTitle.value = tile.title;

    // Initialize content type and configuration
    if (tile.content) {
      editContentType.value = tile.content.type;
      initializeContentConfig(tile.content);
    } else {
      // No content - initialize as empty
      editContentType.value = '';
      editContentConfig.value = {
        displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
      };
    }

    console.debug(`Edit form initialized for tile: ${tile.id}`);
  }

  /**
   * Initializes content configuration based on tile content
   * 
   * Sets up form fields with current content configuration.
   * Handles type-specific properties and display options.
   * 
   * @param content - Current tile content object
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function initializeContentConfig(content: any): void {
    switch (content.type) {
      case 'equity-quote':
        editContentConfig.value = {
          symbol: content.symbol || 'AAPL',
          autoRefresh: content.autoRefresh ?? true,
          refreshInterval: content.refreshInterval ?? 60,
          displayOptions: {
            showChange: content.displayOptions?.showChange ?? true,
            showPercentChange: content.displayOptions?.showPercentChange ?? true,
            showVolume: content.displayOptions?.showVolume ?? true,
            showChart: content.displayOptions?.showChart ?? false,
            showImages: false,
            showSource: true,
            showTimestamp: true,
            compactView: false,
          },
        };
        break;

      case 'news':
        editContentConfig.value = {
          query: content.query || 'technology',
          articleCount: content.articleCount || 5,
          language: content.language || 'en',
          country: content.country || 'US',
          autoRefresh: content.autoRefresh ?? true,
          refreshInterval: content.refreshInterval ?? 300,
          displayOptions: {
            showChange: true,
            showPercentChange: true,
            showVolume: true,
            showChart: false,
            showImages: content.displayOptions?.showImages ?? false,
            showSource: content.displayOptions?.showSource ?? true,
            showTimestamp: content.displayOptions?.showTimestamp ?? true,
            compactView: content.displayOptions?.compactView ?? false,
          },
        };
        break;

      case 'placeholder':
        editContentConfig.value = {
          message: content.message || 'Content coming soon...',
          displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
        };
        break;

      default:
        console.warn(`Unknown content type: ${content.type}`);
        editContentConfig.value = {
          displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
        };
    }
  }

  /**
   * Handles content type change in the form
   * 
   * Resets content configuration when user changes content type.
   * Applies default values for the newly selected type.
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function handleContentTypeChange(): void {
    if (!editContentType.value) {
      editContentConfig.value = {
        displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
      };
      return;
    }

    const defaultConfig = contentTypes[editContentType.value]?.defaultConfig || {};
    initializeDefaultConfig(editContentType.value, defaultConfig);

    console.debug(`Content type changed to: ${editContentType.value}`);
  }

  /**
   * Initializes default configuration for content type
   * 
   * Sets up default values based on content type and registry configuration.
   * Ensures all required fields have appropriate defaults.
   * 
   * @param contentType - The content type to initialize
   * @param defaultConfig - Default configuration from registry
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function initializeDefaultConfig(contentType: TileContentType, defaultConfig: any): void {
    switch (contentType) {
      case 'equity-quote':
        editContentConfig.value = {
          symbol: defaultConfig.symbol || 'AAPL',
          autoRefresh: defaultConfig.autoRefresh ?? true,
          refreshInterval: defaultConfig.refreshInterval ?? 60,
          displayOptions: {
            ...DEFAULT_DISPLAY_OPTIONS,
            showChange: defaultConfig.displayOptions?.showChange ?? true,
            showPercentChange: defaultConfig.displayOptions?.showPercentChange ?? true,
            showVolume: defaultConfig.displayOptions?.showVolume ?? true,
            showChart: defaultConfig.displayOptions?.showChart ?? false,
          },
        };
        break;

      case 'news':
        editContentConfig.value = {
          query: defaultConfig.query || 'technology',
          articleCount: defaultConfig.articleCount || 5,
          language: defaultConfig.language || 'en',
          country: defaultConfig.country || 'US',
          autoRefresh: defaultConfig.autoRefresh ?? true,
          refreshInterval: defaultConfig.refreshInterval ?? 300,
          displayOptions: {
            ...DEFAULT_DISPLAY_OPTIONS,
            showImages: defaultConfig.displayOptions?.showImages ?? false,
            showSource: defaultConfig.displayOptions?.showSource ?? true,
            showTimestamp: defaultConfig.displayOptions?.showTimestamp ?? true,
            compactView: defaultConfig.displayOptions?.compactView ?? false,
          },
        };
        break;

      case 'placeholder':
        editContentConfig.value = {
          message: defaultConfig.message || 'Content coming soon...',
          displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
        };
        break;

      default:
        editContentConfig.value = {
          displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
        };
    }
  }

  /**
   * Creates content object based on current form state
   * 
   * Builds the content configuration object from form inputs.
   * Validates and formats content for the selected type.
   * 
   * @returns Content object or null if no content type selected
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function createContentFromForm(): object | null {
    if (!editContentType.value) {
      return null;
    }

    switch (editContentType.value) {
      case 'equity-quote':
        return {
          type: 'equity-quote' as const,
          displayName: 'Stock Quote',
          symbol: editContentConfig.value.symbol || 'AAPL',
          autoRefresh: editContentConfig.value.autoRefresh ?? true,
          refreshInterval: editContentConfig.value.refreshInterval ?? 60,
          displayOptions: {
            showChange: editContentConfig.value.displayOptions?.showChange ?? true,
            showPercentChange: editContentConfig.value.displayOptions?.showPercentChange ?? true,
            showVolume: editContentConfig.value.displayOptions?.showVolume ?? true,
            showChart: editContentConfig.value.displayOptions?.showChart ?? false,
          },
        };

      case 'news':
        return {
          type: 'news' as const,
          displayName: 'News Feed',
          query: editContentConfig.value.query || 'technology',
          articleCount: editContentConfig.value.articleCount || 5,
          language: editContentConfig.value.language || 'en',
          country: editContentConfig.value.country || 'US',
          autoRefresh: editContentConfig.value.autoRefresh ?? true,
          refreshInterval: editContentConfig.value.refreshInterval ?? 300,
          displayOptions: {
            showImages: editContentConfig.value.displayOptions?.showImages ?? false,
            showSource: editContentConfig.value.displayOptions?.showSource ?? true,
            showTimestamp: editContentConfig.value.displayOptions?.showTimestamp ?? true,
            compactView: editContentConfig.value.displayOptions?.compactView ?? false,
          },
        };

      case 'placeholder':
        return {
          type: 'placeholder' as const,
          displayName: 'Placeholder',
          message: editContentConfig.value.message || 'Content coming soon...',
        };

      default:
        console.warn(`Cannot create content for unknown type: ${editContentType.value}`);
        return null;
    }
  }

  /**
   * Determines what changes have been made to the tile
   * 
   * Compares current form state with original tile properties.
   * Only includes properties that have actually changed.
   * 
   * @returns Object containing only the changed properties
   * 
   * Time Complexity: O(n) where n is the size of content configuration
   * Space Complexity: O(1)
   */
  function determineChanges(): TileEditChanges {
    const changes: TileEditChanges = {};
    const trimmedTitle = editTitle.value.trim();

    // Check if title changed
    if (trimmedTitle !== tile.title) {
      changes.title = trimmedTitle;
    }

    // Check if content changed
    const newContent = createContentFromForm();
    const currentContentJson = JSON.stringify(tile.content);
    const newContentJson = JSON.stringify(newContent);
    
    if (currentContentJson !== newContentJson) {
      changes.content = newContent;
    }

    return changes;
  }

  /**
   * Handles opening the edit modal
   * 
   * Initializes the edit form with current tile values.
   * Modal visibility is handled by Bootstrap data attributes.
   */
  function handleEdit(): void {
    initializeEditForm();
    console.debug(`Edit modal opened for tile: ${tile.id}`);
    // Modal will be shown by Bootstrap's data attributes
  }

  /**
   * Handles saving edit changes
   * 
   * Validates form data, determines changes, and emits update event.
   * Closes the modal after successful save.
   * 
   * Time Complexity: O(n) where n is the size of content configuration
   * Space Complexity: O(1)
   */
  function handleSaveEdit(): void {
    if (!isEditValid.value) {
      console.warn('Cannot save: form validation failed');
      return;
    }

    const changes = determineChanges();

    // If no changes, don't emit anything
    if (Object.keys(changes).length === 0) {
      console.debug('No changes detected, skipping save');
      closeModal();
      return;
    }

    // Emit the tile edit event with changes
    emit('tileEdit', tile.id, changes);
    console.debug(`Tile edit saved for ${tile.id}:`, changes);

    closeModal();
  }

  /**
   * Closes the edit modal programmatically
   * 
   * Uses Bootstrap's modal API to hide the modal.
   * Handles errors gracefully if Bootstrap is not available.
   */
  function closeModal(): void {
    if (!editModal.value) {
      console.warn('Cannot close modal: modal element not found');
      return;
    }

    try {
      const windowWithBootstrap = window as {
        bootstrap?: {
          Modal: {
            getInstance(element: HTMLElement): { hide(): void } | null;
          };
        };
      };

      if (windowWithBootstrap.bootstrap?.Modal) {
        const modalInstance = windowWithBootstrap.bootstrap.Modal.getInstance(editModal.value);
        if (modalInstance) {
          modalInstance.hide();
          console.debug(`Modal closed for tile: ${tile.id}`);
        }
      }
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }

  /**
   * Formats a date for display in the UI
   * 
   * Provides consistent date formatting across the application.
   * 
   * @param date - Date object to format
   * @returns Formatted date string with date and time
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function formatDate(date: Date): string {
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${dateStr} ${timeStr}`;
  }

  /**
   * Gets description for a content type
   * 
   * Retrieves user-friendly description from content types registry.
   * 
   * @param type - Content type identifier
   * @returns Human-readable description
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  function getContentTypeDescription(type: string): string {
    if (!type) {
      return 'Default placeholder content will be displayed';
    }
    
    return contentTypes[type as TileContentType]?.description || 'Unknown content type';
  }

  /**
   * Cleanup function for component unmounting
   * 
   * Disposes of Bootstrap modal instance to prevent memory leaks.
   * Should be called in onUnmounted lifecycle hook.
   */
  function cleanup(): void {
    if (!editModal.value) {
      return;
    }

    try {
      const windowWithBootstrap = window as {
        bootstrap?: {
          Modal: {
            getInstance(element: HTMLElement): { dispose(): void } | null;
          };
        };
      };

      if (windowWithBootstrap.bootstrap?.Modal) {
        const modalInstance = windowWithBootstrap.bootstrap.Modal.getInstance(editModal.value);
        if (modalInstance) {
          modalInstance.dispose();
          console.debug(`Modal disposed for tile: ${tile.id}`);
        }
      }
    } catch (error) {
      console.error('Error disposing modal:', error);
    }
  }

  // Return public interface
  return {
    // Form state
    editTitle,
    editContentType,
    editContentConfig,
    
    // Computed properties
    isEditValid,
    
    // Content types registry
    contentTypes,
    
    // Event handlers
    handleEdit,
    handleSaveEdit,
    handleContentTypeChange,
    
    // Utility functions
    formatDate,
    getContentTypeDescription,
    closeModal,
    cleanup,
  };
}