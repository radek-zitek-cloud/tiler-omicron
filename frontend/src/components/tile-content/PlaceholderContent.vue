<!--
  PlaceholderContent - Default placeholder content for tiles

  This component serves as a fallback when no specific content is configured
  or as a template for future content types.
-->

<template>
  <div class="placeholder-content">
    <div class="placeholder-display">
      <i class="fas fa-cube placeholder-icon" aria-hidden="true"></i>
      <p class="placeholder-message">
        {{ config.message || 'Tile Content Area' }}
      </p>
      <small class="placeholder-info">
        {{ tileSize.width }}×{{ tileSize.height }} grid units
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlaceholderContent } from '@/types/dashboard';

/**
 * Props interface for the placeholder component
 */
interface Props {
  /** Content configuration */
  config: PlaceholderContent;
  /** Tile dimensions */
  tileSize: { width: number; height: number };
}

defineProps<Props>();
</script>

<style scoped>
.placeholder-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.placeholder-display {
  text-align: center;
  color: var(--bs-secondary);
}

.placeholder-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.7;
}

.placeholder-message {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.placeholder-info {
  font-size: 0.8rem;
  opacity: 0.8;
}
</style>
