<!--
  EquityQuoteContent - Stock quote display component for tiles

  This component fetches and displays real-time stock market data,
  including price, change indicators, and basic market information.

  Key Features:
  - Real-time stock price display
  - Price change indicators with color coding
  - Volume and market data
  - Auto-refresh capability
  - Error handling and loading states
  - Responsive design for different tile sizes
-->

<template>
  <div class="equity-quote-content">
    <!-- Loading State -->
    <div v-if="isLoading" class="quote-loading">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="ms-2">Loading {{ config.symbol }}...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="quote-error">
      <i class="fas fa-exclamation-triangle text-warning me-2"></i>
      <div>
        <div class="fw-bold">Unable to load quote</div>
        <small class="text-muted">{{ error }}</small>
        <div class="mt-2">
          <button
            class="btn btn-sm btn-outline-primary"
            @click="fetchQuote"
            :disabled="isLoading"
          >
            <i class="fas fa-redo me-1"></i>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Quote Display -->
    <div v-else-if="quoteData" class="quote-display">
      <!-- Header -->
      <div class="quote-header">
        <div class="symbol-name">
          <span class="symbol">{{ quoteData.symbol }}</span>
          <span v-if="quoteData.name" class="company-name">{{ quoteData.name }}</span>
        </div>
        <div class="last-updated">
          <small class="text-muted">
            <i class="fas fa-clock me-1"></i>
            {{ formatTime(lastUpdated) }}
          </small>
        </div>
      </div>

      <!-- Price Information -->
      <div class="price-section">
        <div class="current-price">
          ${{ formatPrice(quoteData.price) }}
        </div>

        <div v-if="config.displayOptions?.showChange" class="price-change">
          <span
            class="change-amount"
            :class="getChangeColorClass(quoteData.change)"
          >
            <i :class="getChangeIcon(quoteData.change)" class="me-1"></i>
            {{ formatChange(quoteData.change) }}
          </span>

          <span
            v-if="config.displayOptions?.showPercentChange"
            class="change-percent ms-2"
            :class="getChangeColorClass(quoteData.changePercent)"
          >
            ({{ formatPercent(quoteData.changePercent) }})
          </span>
        </div>
      </div>

      <!-- Additional Info -->
      <div v-if="shouldShowAdditionalInfo" class="additional-info">
        <div v-if="config.displayOptions?.showVolume && quoteData.volume" class="info-item">
          <span class="info-label">Volume:</span>
          <span class="info-value">{{ formatVolume(quoteData.volume) }}</span>
        </div>

        <div v-if="quoteData.marketCap" class="info-item">
          <span class="info-label">Market Cap:</span>
          <span class="info-value">{{ formatMarketCap(quoteData.marketCap) }}</span>
        </div>
      </div>
    </div>

    <!-- Placeholder for no data -->
    <div v-else class="quote-placeholder">
      <i class="fas fa-chart-line placeholder-icon"></i>
      <div class="placeholder-text">No data available</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { EquityQuoteContent } from '@/types/dashboard';

/**
 * Props interface for the equity quote component
 */
interface Props {
  /** Content configuration */
  config: EquityQuoteContent;
  /** Tile dimensions for responsive behavior */
  tileSize: { width: number; height: number };
}

/**
 * Stock quote data structure
 */
interface QuoteData {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  timestamp: number;
}

const props = defineProps<Props>();

// Reactive state
const isLoading = ref<boolean>(false);
const error = ref<string>('');
const quoteData = ref<QuoteData | null>(null);
const lastUpdated = ref<Date>(new Date());
const refreshTimer = ref<number | null>(null);

// Computed properties
const shouldShowAdditionalInfo = computed(() => {
  // Show additional info if tile is large enough (at least 2x2)
  return props.tileSize.width >= 2 && props.tileSize.height >= 2;
});

// Methods

/**
 * Fetches stock quote data from a financial data service
 * Note: This is a mock implementation. In production, you would integrate with a real API.
 */
async function fetchQuote(): Promise<void> {
  if (!props.config.symbol) {
    error.value = 'No symbol specified';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    // Mock API call - in production, replace with real financial data API
    // Examples: Alpha Vantage, Yahoo Finance, Polygon.io, etc.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    // Mock data generation for demonstration
    const mockData = generateMockQuoteData(props.config.symbol);

    quoteData.value = mockData;
    lastUpdated.value = new Date();

  } catch (err) {
    console.error('Failed to fetch quote:', err);
    error.value = err instanceof Error ? err.message : 'Failed to fetch quote data';
  } finally {
    isLoading.value = false;
  }
}

/**
 * Generates mock quote data for demonstration purposes
 * In production, this would be replaced with real API integration
 */
function generateMockQuoteData(symbol: string): QuoteData {
  const basePrice = getBasePriceForSymbol(symbol);
  const changePercent = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
  const change = basePrice * (changePercent / 100);
  const currentPrice = basePrice + change;

  return {
    symbol: symbol.toUpperCase(),
    name: getCompanyName(symbol),
    price: currentPrice,
    change: change,
    changePercent: changePercent,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    marketCap: Math.floor(Math.random() * 1000000000000) + 100000000000,
    timestamp: Date.now(),
  };
}

/**
 * Gets a realistic base price for common stock symbols
 */
function getBasePriceForSymbol(symbol: string): number {
  const prices: Record<string, number> = {
    'AAPL': 175.00,
    'GOOGL': 2800.00,
    'MSFT': 340.00,
    'AMZN': 135.00,
    'TSLA': 250.00,
    'META': 320.00,
    'NVDA': 875.00,
    'AMD': 115.00,
    'INTC': 45.00,
    'NFLX': 450.00,
  };

  return prices[symbol.toUpperCase()] || 100.00;
}

/**
 * Gets company name for common symbols
 */
function getCompanyName(symbol: string): string {
  const names: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMD': 'Advanced Micro Devices',
    'INTC': 'Intel Corporation',
    'NFLX': 'Netflix Inc.',
  };

  return names[symbol.toUpperCase()] || symbol.toUpperCase();
}

/**
 * Formats price values for display
 */
function formatPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * Formats change values for display
 */
function formatChange(change: number): string {
  const formatted = Math.abs(change).toFixed(2);
  return change >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

/**
 * Formats percentage values for display
 */
function formatPercent(percent: number): string {
  const formatted = Math.abs(percent).toFixed(2);
  return percent >= 0 ? `+${formatted}%` : `-${formatted}%`;
}

/**
 * Formats volume for display
 */
function formatVolume(volume: number): string {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * Formats market cap for display
 */
function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1000000000000) {
    return `$${(marketCap / 1000000000000).toFixed(1)}T`;
  } else if (marketCap >= 1000000000) {
    return `$${(marketCap / 1000000000).toFixed(1)}B`;
  } else if (marketCap >= 1000000) {
    return `$${(marketCap / 1000000).toFixed(1)}M`;
  }
  return `$${marketCap.toLocaleString()}`;
}

/**
 * Formats timestamp for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Gets CSS class for change color coding
 */
function getChangeColorClass(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-danger';
  return 'text-muted';
}

/**
 * Gets icon for change direction
 */
function getChangeIcon(value: number): string {
  if (value > 0) return 'fas fa-caret-up';
  if (value < 0) return 'fas fa-caret-down';
  return 'fas fa-minus';
}

/**
 * Sets up auto-refresh timer
 */
function setupAutoRefresh(): void {
  if (props.config.autoRefresh && props.config.refreshInterval) {
    refreshTimer.value = window.setInterval(() => {
      fetchQuote();
    }, props.config.refreshInterval * 1000);
  }
}

/**
 * Clears auto-refresh timer
 */
function clearAutoRefresh(): void {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
}

// Watchers
watch(() => props.config.symbol, () => {
  fetchQuote();
});

watch(() => props.config.autoRefresh, (newValue) => {
  if (newValue) {
    setupAutoRefresh();
  } else {
    clearAutoRefresh();
  }
});

// Lifecycle hooks
onMounted(() => {
  fetchQuote();
  setupAutoRefresh();
});

onUnmounted(() => {
  clearAutoRefresh();
});
</script>

<style scoped>
.equity-quote-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.75rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.quote-loading,
.quote-error,
.quote-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  height: 100%;
  color: var(--bs-secondary);
}

.quote-error {
  padding: 1rem;
}

.quote-display {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.symbol-name {
  display: flex;
  flex-direction: column;
}

.symbol {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--bs-primary);
  line-height: 1;
}

.company-name {
  font-size: 0.8rem;
  color: var(--bs-secondary);
  margin-top: 0.125rem;
  line-height: 1;
}

.last-updated {
  flex-shrink: 0;
}

.price-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  margin-bottom: 0.75rem;
}

.current-price {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--bs-dark);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.price-change {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.change-amount,
.change-percent {
  display: flex;
  align-items: center;
}

.additional-info {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  border-top: 1px solid var(--bs-border-color);
  padding-top: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: var(--bs-secondary);
  font-weight: 500;
}

.info-value {
  color: var(--bs-dark);
  font-weight: 600;
}

.placeholder-icon {
  font-size: 2rem;
  color: var(--bs-secondary);
  margin-bottom: 0.5rem;
}

.placeholder-text {
  color: var(--bs-secondary);
  font-size: 0.9rem;
}

/* Responsive adjustments for different tile sizes */
@media (max-width: 300px) {
  .current-price {
    font-size: 1.25rem;
  }

  .price-change {
    font-size: 0.8rem;
  }

  .additional-info {
    font-size: 0.75rem;
  }
}

/* Tile size specific adjustments */
.equity-quote-content[data-tile-size="1x1"] .current-price {
  font-size: 1.25rem;
}

.equity-quote-content[data-tile-size="1x1"] .additional-info {
  display: none;
}

.equity-quote-content[data-tile-size="1x1"] .company-name {
  display: none;
}
</style>
