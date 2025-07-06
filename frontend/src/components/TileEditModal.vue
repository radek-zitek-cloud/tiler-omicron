<!--
  TileEditModal - Dedicated modal component for tile editing

  This component handles the complete tile editing interface, including
  form validation, content type selection, and configuration options.
  
  Features:
  - Content type selection with descriptions
  - Type-specific configuration forms
  - Real-time validation feedback
  - Tile information display
  - Bootstrap modal integration
-->

<template>
  <div
    :id="`editModal-${tile.id}`"
    ref="editModal"
    class="modal fade"
    tabindex="-1"
    :aria-labelledby="`editModalLabel-${tile.id}`"
    aria-hidden="true"
    data-bs-backdrop="static"
    data-bs-keyboard="false"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 :id="`editModalLabel-${tile.id}`" class="modal-title">
            <i class="fas fa-edit me-2" aria-hidden="true"></i>
            Edit Tile
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
            <!-- Tile Title -->
            <div class="mb-3">
              <label :for="`title-${tile.id}`" class="form-label">
                <strong>Tile Title</strong>
              </label>
              <input
                type="text"
                class="form-control"
                :id="`title-${tile.id}`"
                v-model="editTitle"
                placeholder="Enter tile title..."
                maxlength="100"
                required
                :class="{ 'is-invalid': editTitle.trim() === '' }"
              />
              <div class="form-text">
                Enter a descriptive title for this tile (1-100 characters)
              </div>
            </div>

            <!-- Content Type Selection -->
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
                  v-for="(contentType, key) in contentTypes"
                  :key="key"
                  :value="key"
                >
                  {{ contentType.displayName }}
                </option>
              </select>
              <div class="form-text">
                {{ getContentTypeDescription(editContentType) }}
              </div>
            </div>

            <!-- Content Configuration -->
            <div v-if="editContentType" class="mb-3">
              <label class="form-label">
                <strong>{{ contentTypes[editContentType]?.displayName }} Configuration</strong>
              </label>

              <!-- Equity Quote Configuration -->
              <div v-if="editContentType === 'equity-quote'" class="content-config">
                <div class="row mb-2">
                  <div class="col-sm-6">
                    <label :for="`symbol-${tile.id}`" class="form-label">Stock Symbol</label>
                    <input
                      type="text"
                      class="form-control"
                      :id="`symbol-${tile.id}`"
                      v-model="editContentConfig.symbol"
                      placeholder="e.g., AAPL, MSFT, GOOGL"
                      maxlength="10"
                      style="text-transform: uppercase"
                      required
                    />
                  </div>
                  <div class="col-sm-6">
                    <label :for="`refreshIntervalEquity-${tile.id}`" class="form-label">Refresh Interval</label>
                    <select
                      class="form-select"
                      :id="`refreshIntervalEquity-${tile.id}`"
                      v-model="editContentConfig.refreshInterval"
                    >
                      <option :value="30">30 seconds</option>
                      <option :value="60">1 minute</option>
                      <option :value="300">5 minutes</option>
                      <option :value="900">15 minutes</option>
                    </select>
                  </div>
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
                        :id="`showPercentChange-${tile.id}`"
                        v-model="editContentConfig.displayOptions.showPercentChange"
                      />
                      <label class="form-check-label" :for="`showPercentChange-${tile.id}`">
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
                        :id="`autoRefreshEquity-${tile.id}`"
                        v-model="editContentConfig.autoRefresh"
                      />
                      <label class="form-check-label" :for="`autoRefreshEquity-${tile.id}`">
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

              <!-- News Configuration -->
              <div v-else-if="editContentType === 'news'" class="content-config">
                <div class="mb-2">
                  <label :for="`query-${tile.id}`" class="form-label">News Topic or Search Query</label>
                  <input
                    type="text"
                    class="form-control"
                    :id="`query-${tile.id}`"
                    v-model="editContentConfig.query"
                    placeholder="e.g., technology, business, artificial intelligence"
                    maxlength="100"
                    required
                  />
                  <div class="form-text">
                    Use predefined topics (technology, business, world) or custom search terms
                  </div>
                </div>

                <div class="row mb-2">
                  <div class="col-sm-6">
                    <label :for="`articleCount-${tile.id}`" class="form-label">Article Count</label>
                    <select
                      class="form-select"
                      :id="`articleCount-${tile.id}`"
                      v-model="editContentConfig.articleCount"
                    >
                      <option :value="3">3 articles</option>
                      <option :value="5">5 articles</option>
                      <option :value="8">8 articles</option>
                      <option :value="10">10 articles</option>
                    </select>
                  </div>
                  <div class="col-sm-6">
                    <label :for="`refreshInterval-${tile.id}`" class="form-label">Refresh Interval</label>
                    <select
                      class="form-select"
                      :id="`refreshInterval-${tile.id}`"
                      v-model="editContentConfig.refreshInterval"
                    >
                      <option :value="180">3 minutes</option>
                      <option :value="300">5 minutes</option>
                      <option :value="600">10 minutes</option>
                      <option :value="1800">30 minutes</option>
                    </select>
                  </div>
                </div>

                <div class="row">
                  <div class="col-sm-6">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="`showSource-${tile.id}`"
                        v-model="editContentConfig.displayOptions.showSource"
                      />
                      <label class="form-check-label" :for="`showSource-${tile.id}`">
                        Show News Source
                      </label>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="`showTimestamp-${tile.id}`"
                        v-model="editContentConfig.displayOptions.showTimestamp"
                      />
                      <label class="form-check-label" :for="`showTimestamp-${tile.id}`">
                        Show Timestamps
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
                        :id="`compactView-${tile.id}`"
                        v-model="editContentConfig.displayOptions.compactView"
                      />
                      <label class="form-check-label" :for="`compactView-${tile.id}`">
                        Compact View
                      </label>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="`autoRefreshNews-${tile.id}`"
                        v-model="editContentConfig.autoRefresh"
                      />
                      <label class="form-check-label" :for="`autoRefreshNews-${tile.id}`">
                        Auto Refresh
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tile Information Display -->
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
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import type { Tile } from '@/types/dashboard';
import { useTileEdit } from '@/composables/useTileEdit';

/**
 * Component props interface
 */
interface Props {
  tile: Tile;
}

/**
 * Component emits interface
 */
interface Emits {
  tileEdit: [tileId: string, changes?: { title?: string; content?: object | null }];
}

// Props and emits
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Template refs
const editModal = ref<HTMLElement>();

// Use the tile edit composable
const {
  editTitle,
  editContentType,
  editContentConfig,
  isEditValid,
  contentTypes,
  handleEdit,
  handleSaveEdit,
  handleContentTypeChange,
  formatDate,
  getContentTypeDescription,
  cleanup,
} = useTileEdit({
  tile: props.tile,
  editModal,
  emit,
});

// Expose handleEdit for parent component
defineExpose({
  handleEdit,
});

// Cleanup on unmount
onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
/**
 * Modal content styling for tile edit form
 * Provides consistent spacing and visual hierarchy
 */

.content-config {
  background-color: var(--bs-light);
  border: 1px solid var(--bs-border-color);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
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

/* Form validation styling */
.form-control.is-invalid {
  border-color: var(--bs-danger);
}

.form-control.is-invalid:focus {
  border-color: var(--bs-danger);
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

/* Modal dialog enhancements */
.modal-dialog {
  max-width: 600px;
}

.modal-header {
  background-color: var(--bs-light);
  border-bottom: 1px solid var(--bs-border-color);
}

.modal-title {
  color: var(--bs-dark);
  font-weight: 600;
}

.modal-footer {
  background-color: var(--bs-light);
  border-top: 1px solid var(--bs-border-color);
}

/* Form section spacing */
.form-label strong {
  color: var(--bs-dark);
}

.form-text {
  font-size: 0.875rem;
  color: var(--bs-secondary);
}

/* Checkbox and form controls spacing */
.form-check {
  margin-bottom: 0.5rem;
}

.form-check-label {
  font-size: 0.9rem;
}

/* Content configuration sections */
.content-config .row {
  margin-bottom: 0.5rem;
}

.content-config .row:last-child {
  margin-bottom: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-dialog {
    margin: 0.5rem;
    max-width: none;
  }
  
  .tile-info-display .col-sm-6 {
    padding: 0.25rem 0;
  }
  
  .content-config .col-sm-6 {
    margin-bottom: 0.75rem;
  }
}
</style>