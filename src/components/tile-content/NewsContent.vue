<!--
  NewsContent - News feed tile content component

  Displays latest news articles from Google News with comprehensive
  formatting, error handling, and responsive design. Supports various
  news topics and search queries with automatic refresh capabilities.
-->

<template>
  <div class="news-content">
    <!-- Loading State -->
    <div v-if="isLoading" class="news-loading">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading news...</span>
      </div>
      <div class="loading-text">Fetching latest news...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="news-error">
      <i class="fas fa-exclamation-triangle text-warning"></i>
      <div class="error-message">
        <div class="fw-bold">News Unavailable</div>
        <small class="text-muted">{{ error }}</small>
      </div>
      <button
        class="btn btn-sm btn-outline-primary mt-2"
        @click="fetchNews"
      >
        <i class="fas fa-sync-alt"></i>
        Retry
      </button>
    </div>

    <!-- News Articles -->
    <div v-else-if="newsData && newsData.articles.length > 0" class="news-articles">
      <!-- Header -->
      <div class="news-header">
        <div class="news-title">
          <i class="fas fa-newspaper text-primary"></i>
          {{ getDisplayTitle() }}
        </div>
        <div class="news-meta">
          <small class="text-muted">
            {{ newsData.articles.length }} articles
            <span v-if="lastUpdated">
              • Updated {{ formatLastUpdated() }}
            </span>
          </small>
        </div>
      </div>

      <!-- Articles List -->
      <div class="articles-list" :class="{ 'compact-view': config.displayOptions?.compactView }">
        <article
          v-for="(article, index) in displayedArticles"
          :key="`${article.url}-${index}`"
          class="news-article"
          @click="openArticle(article.url)"
        >
          <!-- Article Image (if enabled and available) -->
          <div
            v-if="config.displayOptions?.showImages && article.imageUrl"
            class="article-image"
          >
            <img
              :src="article.imageUrl"
              :alt="article.title"
              @error="handleImageError"
            />
          </div>

          <!-- Article Content -->
          <div class="article-content">
            <!-- Title -->
            <h3 class="article-title">{{ article.title }}</h3>

            <!-- Description -->
            <p v-if="article.description" class="article-description">
              {{ article.description }}
            </p>

            <!-- Metadata -->
            <div class="article-meta">
              <!-- Source -->
              <span v-if="config.displayOptions?.showSource" class="article-source">
                <i class="fas fa-external-link-alt"></i>
                {{ article.source }}
              </span>

              <!-- Timestamp -->
              <span v-if="config.displayOptions?.showTimestamp" class="article-time">
                <i class="far fa-clock"></i>
                {{ formatArticleTime(article.publishedAt) }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <!-- View More Button -->
      <div v-if="hasMoreArticles" class="news-footer">
        <button
          class="btn btn-sm btn-outline-primary w-100"
          @click="showMoreArticles"
        >
          <i class="fas fa-plus"></i>
          Show {{ Math.min(3, newsData.articles.length - displayedArticles.length) }} more
        </button>
      </div>
    </div>

    <!-- No Results -->
    <div v-else class="news-empty">
      <i class="fas fa-search text-muted"></i>
      <div class="empty-message">
        <div class="fw-bold">No News Found</div>
        <small class="text-muted">
          No articles found for "{{ config.query }}"
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { NewsContent } from '@/types/dashboard';
import { googleNewsService } from '@/services/googleNewsService';
import type { NewsResponse } from '@/services/googleNewsService';

/**
 * Props interface for the news component
 */
interface Props {
  /** News content configuration */
  config: NewsContent;
  /** Tile dimensions */
  tileSize: { width: number; height: number };
}

const props = defineProps<Props>();

// Reactive state
const newsData = ref<NewsResponse | null>(null);
const isLoading = ref(false);
const error = ref('');
const lastUpdated = ref<Date | null>(null);
const displayCount = ref(0);

// Auto-refresh timer
let refreshTimer: number | null = null;

/**
 * Computed property for displayed articles based on tile size and display count
 */
const displayedArticles = computed(() => {
  if (!newsData.value) return [];

  // Calculate how many articles to show based on tile size
  const baseCount = Math.min(
    props.config.articleCount || 5,
    calculateMaxArticles()
  );

  const totalToShow = displayCount.value || baseCount;
  return newsData.value.articles.slice(0, totalToShow);
});

/**
 * Computed property to check if there are more articles to display
 */
const hasMoreArticles = computed(() => {
  if (!newsData.value) return false;
  return displayedArticles.value.length < newsData.value.articles.length;
});

/**
 * Calculate maximum articles that can fit in the tile based on size
 * Uses tile height to determine optimal article count
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
function calculateMaxArticles(): number {
  const tileHeight = props.tileSize.height;
  const isCompact = props.config.displayOptions?.compactView;

  if (isCompact) {
    // Compact view can fit more articles
    return Math.max(1, Math.min(10, Math.floor(tileHeight * 2.5)));
  } else {
    // Standard view with descriptions
    return Math.max(1, Math.min(8, Math.floor(tileHeight * 1.5)));
  }
}

/**
 * Fetches news articles based on configuration
 * Implements comprehensive error handling and fallback strategies
 */
async function fetchNews(): Promise<void> {
  if (!props.config.query) {
    error.value = 'No news query specified';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    console.log(`Fetching news for query: "${props.config.query}"`);

    // Build news configuration
    const newsConfig = {
      query: props.config.query,
      limit: props.config.articleCount || 5,
      language: props.config.language || 'en',
      country: props.config.country || 'US',
    };

    // Fetch news from Google News service
    const response = await googleNewsService.getNews(newsConfig);

    newsData.value = response;
    lastUpdated.value = new Date();
    displayCount.value = 0; // Reset display count

    console.log(`Successfully fetched ${response.articles.length} news articles`);

  } catch (err) {
    console.error('Failed to fetch news:', err);

    if (err instanceof Error) {
      if (err.message.includes('CORS') || err.message.includes('proxy')) {
        error.value = 'Unable to access news due to network restrictions. Please try again.';
      } else if (err.message.includes('timeout')) {
        error.value = 'Request timeout while fetching news. Please try again.';
      } else if (err.message.includes('rate limit')) {
        error.value = 'Too many requests. Please wait before refreshing.';
      } else {
        error.value = `Error fetching news: ${err.message}`;
      }
    } else {
      error.value = 'Failed to fetch news articles';
    }
  } finally {
    isLoading.value = false;
  }
}

/**
 * Shows additional articles by increasing display count
 */
function showMoreArticles(): void {
  const currentCount = displayedArticles.value.length;
  const additionalCount = Math.min(3, newsData.value!.articles.length - currentCount);
  displayCount.value = currentCount + additionalCount;
}

/**
 * Opens article in new tab/window
 *
 * @param url - Article URL to open
 */
function openArticle(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Handles image loading errors by hiding the image
 */
function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}

/**
 * Gets display title for the news feed
 * Formats topic names for better readability
 */
function getDisplayTitle(): string {
  const query = props.config.query;

  // Capitalize and format common topics
  const topicMap: Record<string, string> = {
    'technology': 'Technology News',
    'business': 'Business News',
    'world': 'World News',
    'sports': 'Sports News',
    'health': 'Health News',
    'science': 'Science News',
    'entertainment': 'Entertainment News',
  };

  return topicMap[query.toLowerCase()] || `${query.charAt(0).toUpperCase() + query.slice(1)} News`;
}

/**
 * Formats the last updated timestamp for display
 */
function formatLastUpdated(): string {
  if (!lastUpdated.value) return '';

  const now = new Date();
  const diffMs = now.getTime() - lastUpdated.value.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }
}

/**
 * Formats article publication time for display
 *
 * @param timestamp - Article publication timestamp
 */
function formatArticleTime(timestamp: number): string {
  const now = new Date();
  const articleDate = new Date(timestamp);
  const diffMs = now.getTime() - articleDate.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / 60000);
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return articleDate.toLocaleDateString();
  }
}

/**
 * Sets up auto-refresh timer based on configuration
 */
function setupAutoRefresh(): void {
  // Clear existing timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  // Set up new timer if auto-refresh is enabled
  if (props.config.autoRefresh && props.config.refreshInterval) {
    const intervalMs = props.config.refreshInterval * 1000;
    refreshTimer = window.setInterval(fetchNews, intervalMs);
    console.log(`Auto-refresh enabled: ${props.config.refreshInterval}s`);
  }
}

/**
 * Lifecycle hooks and watchers
 */

// Initial news fetch on component mount
onMounted(async () => {
  await fetchNews();
  setupAutoRefresh();
});

// Cleanup on component unmount
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});

// Watch for configuration changes and refetch news
watch(
  () => [props.config.query, props.config.articleCount, props.config.language],
  async () => {
    await fetchNews();
  },
  { deep: true }
);

// Watch for auto-refresh setting changes
watch(
  () => [props.config.autoRefresh, props.config.refreshInterval],
  () => {
    setupAutoRefresh();
  },
  { deep: true }
);
</script>

<style scoped>
.news-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  background: var(--bs-white);
  border-radius: 0.375rem;
  overflow: hidden;
}

/* Loading State */
.news-loading {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--bs-secondary);
  gap: 0.5rem;
}

.loading-text {
  font-size: 0.8rem;
}

/* Error State */
.news-error {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  color: var(--bs-secondary);
}

.news-error .fas {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-message {
  margin-bottom: 0.5rem;
}

/* Empty State */
.news-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--bs-secondary);
}

.news-empty .fas {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

/* News Header */
.news-header {
  padding: 0.75rem 1rem 0.5rem;
  border-bottom: 1px solid var(--bs-border-color);
  background: var(--bs-light);
}

.news-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--bs-dark);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.news-meta {
  margin-top: 0.25rem;
}

/* Articles List */
.articles-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.articles-list.compact-view .news-article {
  padding: 0.5rem 1rem;
}

.articles-list.compact-view .article-description {
  display: none;
}

/* Individual Article */
.news-article {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--bs-border-color-translucent);
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  gap: 0.75rem;
}

.news-article:hover {
  background-color: var(--bs-light);
}

.news-article:last-child {
  border-bottom: none;
}

/* Article Image */
.article-image {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 0.25rem;
  overflow: hidden;
  background: var(--bs-light);
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Article Content */
.article-content {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 0.25rem 0;
  color: var(--bs-dark);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-description {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--bs-secondary);
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Article Metadata */
.article-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: var(--bs-secondary);
}

.article-source,
.article-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.article-source .fas,
.article-time .far {
  font-size: 0.65rem;
}

/* News Footer */
.news-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--bs-border-color);
  background: var(--bs-light);
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .news-content {
    font-size: 0.8rem;
  }

  .article-title {
    font-size: 0.8rem;
  }

  .article-description {
    font-size: 0.7rem;
  }

  .article-meta {
    font-size: 0.65rem;
  }
}

/* Custom Scrollbar */
.articles-list::-webkit-scrollbar {
  width: 4px;
}

.articles-list::-webkit-scrollbar-track {
  background: transparent;
}

.articles-list::-webkit-scrollbar-thumb {
  background: var(--bs-border-color);
  border-radius: 2px;
}

.articles-list::-webkit-scrollbar-thumb:hover {
  background: var(--bs-secondary);
}
</style>
