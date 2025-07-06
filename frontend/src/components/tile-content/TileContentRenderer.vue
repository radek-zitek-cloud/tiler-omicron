<!--
  TileContentRenderer - Dynamic content renderer for tiles

  This component serves as a registry and loader for different tile content types.
  It dynamically loads and renders the appropriate content component based on
  the tile's content configuration.
-->

<template>
  <div class="tile-content-renderer">
    <component
      :is="contentComponent"
      :config="content as any"
      :tile-size="{ width: tileWidth, height: tileHeight }"
      v-if="contentComponent"
    />

    <!-- Fallback for unknown content types -->
    <div v-else class="content-error">
      <i class="fas fa-exclamation-triangle text-warning"></i>
      <div class="error-message">
        <div class="fw-bold">Unknown Content Type</div>
        <small class="text-muted">{{ content.type }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import type { TileContent } from '@/types/dashboard';

/**
 * Props interface for the content renderer
 */
interface Props {
  /** Content configuration to render */
  content: TileContent;
  /** Tile width in grid units */
  tileWidth: number;
  /** Tile height in grid units */
  tileHeight: number;
}

const props = defineProps<Props>();

/**
 * Content component registry with lazy loading
 * Maps content types to their respective Vue components
 */
const contentComponents = {
  'equity-quote': defineAsyncComponent(() => import('./EquityQuoteContent.vue')),
  'placeholder': defineAsyncComponent(() => import('./PlaceholderContent.vue')),
  'news': defineAsyncComponent(() => import('./NewsContent.vue')),
};

/**
 * Dynamically resolves the appropriate content component
 */
const contentComponent = computed(() => {
  return contentComponents[props.content.type] || null;
});
</script>

<style scoped>
.tile-content-renderer {
  height: 100%;
  width: 100%;
}

.content-error {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 1rem;
  color: var(--bs-secondary);
}

.content-error .fas {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 0.9rem;
}
</style>
