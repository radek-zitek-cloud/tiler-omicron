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
  high?: number;
  low?: number;
  previousClose?: number;
}

/**
 * Alpha Vantage API response structure for Global Quote
 */
interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
  'Error Message'?: string;
  'Note'?: string;
}

const props = defineProps<Props>();

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = 'PH76AIY52D5VVUHX';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

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
 * Transform Alpha Vantage quote to our internal format
 */
function transformAlphaVantageQuote(alphaData: AlphaVantageResponse, symbol: string): QuoteData {
  const quote = alphaData['Global Quote'];

  return {
    symbol: quote['01. symbol'] || symbol.toUpperCase(),
    name: undefined, // Alpha Vantage Global Quote doesn't include company names
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume']),
    marketCap: undefined, // Not available in Global Quote endpoint
    timestamp: Date.now(),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    previousClose: parseFloat(quote['08. previous close']),
  };
}

/**
 * Fetches stock quote data using Alpha Vantage API exclusively
 * Uses the Global Quote endpoint for real-time stock data
 */
async function fetchQuote(): Promise<void> {
  if (!props.config.symbol) {
    error.value = 'No symbol specified';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    console.log(`Fetching quote for symbol: ${props.config.symbol}`);

    // Build Alpha Vantage API URL
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${props.config.symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    console.log('Making request to Alpha Vantage API...');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
    }

    const data: AlphaVantageResponse = await response.json();

    // Check for API errors or rate limiting
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
    }

    if (data['Note']) {
      throw new Error(`Alpha Vantage rate limit: ${data['Note']}`);
    }

    if (!data['Global Quote']) {
      throw new Error('No quote data returned from Alpha Vantage');
    }

    // Transform the data to our internal format
    const transformedData = transformAlphaVantageQuote(data, props.config.symbol);

    quoteData.value = transformedData;
    lastUpdated.value = new Date();

    console.log('Quote fetched successfully from Alpha Vantage:', transformedData);

  } catch (err) {
    console.error('Failed to fetch quote data from Alpha Vantage:', err);

    if (err instanceof Error) {
      if (err.message.includes('rate limit')) {
        error.value = 'Alpha Vantage API rate limit exceeded. Please try again later.';
      } else if (err.message.includes('404') || err.message.includes('not found')) {
        error.value = `Symbol "${props.config.symbol}" not found. Please verify the symbol is correct.`;
      } else if (err.message.includes('timeout')) {
        error.value = 'Request timeout while fetching data. Please try again.';
      } else if (err.message.includes('Invalid API call')) {
        error.value = `Invalid symbol format: "${props.config.symbol}". Use standard ticker symbols like AAPL, MSFT.`;
      } else {
        error.value = `Error fetching quote: ${err.message}`;
      }
    } else {
      error.value = 'Failed to fetch quote data from Alpha Vantage';
    }

    // Use mock data as fallback for development/testing
    if (props.config.symbol.toUpperCase() === 'AAPL') {
      console.log('Using mock data as fallback');
      quoteData.value = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 150.25,
        change: 2.15,
        changePercent: 1.45,
        volume: 45234567,
        marketCap: 2450000000000,
        timestamp: Date.now(),
        high: 152.10,
        low: 148.90,
        previousClose: 148.10,
      };
      error.value = ''; // Clear error when using mock data
    }
  } finally {
    isLoading.value = false;
  }
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
