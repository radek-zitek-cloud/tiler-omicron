<!--
  Google Finance Test Component

  This component demonstrates how to use the Google Finance scraping service
  to fetch stock quotes from finance.google.com.

  Key Features:
  - Tests multiple symbol formats (US stocks, London ETFs)
  - Shows error handling for CORS issues
  - Displays comprehensive quote information
  - Real-time data fetching and display
-->

<template>
  <div class="google-finance-test">
    <div class="container mt-4">
      <h2 class="mb-4">
        <i class="fas fa-chart-line me-2"></i>
        Google Finance Service Test
      </h2>

      <!-- Symbol Input -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Test Stock Symbol</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label for="symbolInput" class="form-label">Enter Symbol</label>
                <input
                  id="symbolInput"
                  v-model="testSymbol"
                  type="text"
                  class="form-control"
                  placeholder="e.g., CSPX:LON, AAPL, MSFT"
                  @keyup.enter="fetchQuote"
                />
                <div class="form-text">
                  Examples: CSPX:LON, AAPL, MSFT, GOOGL, VUSA:LON
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input
                    id="useProxy"
                    v-model="useProxy"
                    class="form-check-input"
                    type="checkbox"
                  />
                  <label class="form-check-label" for="useProxy">
                    Use CORS Proxy (recommended for browser testing)
                  </label>
                </div>
                <div class="form-check">
                  <input
                    id="useMockData"
                    v-model="useMockData"
                    class="form-check-input"
                    type="checkbox"
                  />
                  <label class="form-check-label" for="useMockData">
                    Use Mock Data (for testing when proxies fail)
                  </label>
                </div>
              </div>

              <button
                class="btn btn-primary"
                @click="fetchQuote"
                :disabled="isLoading || !testSymbol.trim()"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="fas fa-search me-2"></i>
                {{ isLoading ? 'Fetching...' : 'Fetch Quote' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Test Buttons -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Quick Tests</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="testSymbol = 'CSPX:LON'; fetchQuote()"
                  :disabled="isLoading"
                >
                  Test CSPX (London ETF)
                </button>
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="testSymbol = 'AAPL'; fetchQuote()"
                  :disabled="isLoading"
                >
                  Test AAPL (US Stock)
                </button>
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="testSymbol = 'VUSA:LON'; fetchQuote()"
                  :disabled="isLoading"
                >
                  Test VUSA (London ETF)
                </button>
                <button
                  class="btn btn-outline-secondary btn-sm"
                  @click="testSymbol = 'INVALID:TEST'; fetchQuote()"
                  :disabled="isLoading"
                >
                  Test Invalid Symbol
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="row">
        <div class="col-12">
          <!-- Loading State -->
          <div v-if="isLoading" class="card">
            <div class="card-body text-center">
              <div class="spinner-border text-primary mb-3"></div>
              <h5>Fetching quote for {{ testSymbol }}...</h5>
              <p class="text-muted">This may take a few seconds due to CORS proxy</p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="card border-danger">
            <div class="card-header bg-danger text-white">
              <h5 class="mb-0">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error Fetching Quote
              </h5>
            </div>
            <div class="card-body">
              <div class="alert alert-danger mb-3">
                <strong>Error:</strong> {{ error }}
              </div>

              <h6>Troubleshooting:</h6>
              <div class="card">
                <div class="card-body">
                  <h6>Current Configuration:</h6>
                  <ul class="list-group list-group-flush mb-3">
                    <li class="list-group-item">
                      <strong>Use Proxy:</strong> {{ useProxy ? 'Yes' : 'No' }}
                    </li>
                    <li class="list-group-item">
                      <strong>Primary Proxy:</strong> {{ googleFinanceService.getConfig().network.proxyUrl || 'Not configured' }}
                    </li>
                    <li class="list-group-item">
                      <strong>Fallback Proxies:</strong> {{ googleFinanceService.getConfig().network.fallbackProxies?.length || 0 }} available
                    </li>
                    <li class="list-group-item">
                      <strong>Timeout:</strong> {{ googleFinanceService.getConfig().network.timeout || 30000 }}ms
                    </li>
                  </ul>

                  <h6>Common Solutions:</h6>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                      <strong>CORS/Proxy Issues:</strong> Try disabling proxy mode for direct requests
                    </li>
                    <li class="list-group-item">
                      <strong>Invalid Symbol:</strong> Use format SYMBOL:EXCHANGE (e.g., CSPX:LON)
                    </li>
                    <li class="list-group-item">
                      <strong>Network Issues:</strong> Check internet connection
                    </li>
                    <li class="list-group-item">
                      <strong>Service Blocked:</strong> Google Finance may be blocking automated requests
                    </li>
                  </ul>
                </div>
              </div>

              <button class="btn btn-outline-primary mt-3 me-2" @click="fetchQuote">
                <i class="fas fa-redo me-2"></i>
                Try Again
              </button>

              <button class="btn btn-outline-success mt-3" @click="useMockData = true; fetchQuote()">
                <i class="fas fa-vial me-2"></i>
                Try Mock Data
              </button>
            </div>
          </div>

          <!-- Success State -->
          <div v-else-if="quoteData" class="card border-success">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0">
                <i class="fas fa-check-circle me-2"></i>
                Quote Data for {{ quoteData.symbol }}
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <!-- Main Quote Info -->
                <div class="col-md-6">
                  <h3 class="text-primary">{{ quoteData.name || quoteData.symbol }}</h3>
                  <div class="display-4 fw-bold mb-2">
                    {{ formatCurrency(quoteData.price, quoteData.currency) }}
                  </div>

                  <div class="d-flex align-items-center mb-3">
                    <span
                      class="badge fs-6 me-2"
                      :class="getChangeColorClass(quoteData.change)"
                    >
                      <i :class="getChangeIcon(quoteData.change)" class="me-1"></i>
                      {{ formatChange(quoteData.change, quoteData.currency) }}
                    </span>
                    <span
                      class="badge fs-6"
                      :class="getChangeColorClass(quoteData.changePercent)"
                    >
                      {{ formatPercent(quoteData.changePercent) }}
                    </span>
                  </div>

                  <p class="text-muted">
                    <i class="fas fa-clock me-1"></i>
                    Last updated: {{ formatTimestamp(quoteData.timestamp) }}
                  </p>
                </div>

                <!-- Additional Data -->
                <div class="col-md-6">
                  <table class="table table-sm">
                    <tbody>
                      <tr v-if="quoteData.previousClose">
                        <td><strong>Previous Close:</strong></td>
                        <td>{{ formatCurrency(quoteData.previousClose, quoteData.currency) }}</td>
                      </tr>
                      <tr v-if="quoteData.dayHigh">
                        <td><strong>Day High:</strong></td>
                        <td>{{ formatCurrency(quoteData.dayHigh, quoteData.currency) }}</td>
                      </tr>
                      <tr v-if="quoteData.dayLow">
                        <td><strong>Day Low:</strong></td>
                        <td>{{ formatCurrency(quoteData.dayLow, quoteData.currency) }}</td>
                      </tr>
                      <tr v-if="quoteData.volume">
                        <td><strong>Volume:</strong></td>
                        <td>{{ formatVolume(quoteData.volume) }}</td>
                      </tr>
                      <tr v-if="quoteData.marketCap">
                        <td><strong>Market Cap:</strong></td>
                        <td>{{ quoteData.marketCap }}</td>
                      </tr>
                      <tr v-if="quoteData.peRatio">
                        <td><strong>P/E Ratio:</strong></td>
                        <td>{{ quoteData.peRatio.toFixed(2) }}</td>
                      </tr>
                      <tr v-if="quoteData.peRatio">
                        <td><strong>P/E Ratio:</strong></td>
                        <td>{{ quoteData.peRatio.toFixed(2) }}</td>
                      </tr>
                      <tr v-if="quoteData.marketStatus">
                        <td><strong>Market Status:</strong></td>
                        <td>
                          <span class="badge" :class="getMarketStatusClass(quoteData.marketStatus)">
                            {{ quoteData.marketStatus }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Raw Data -->
              <div class="mt-4">
                <button
                  class="btn btn-outline-secondary btn-sm"
                  @click="showRawData = !showRawData"
                >
                  <i class="fas fa-code me-2"></i>
                  {{ showRawData ? 'Hide' : 'Show' }} Raw Data
                </button>

                <div v-if="showRawData" class="mt-3">
                  <pre class="bg-light p-3 rounded"><code>{{ JSON.stringify(quoteData, null, 2) }}</code></pre>
                </div>
              </div>
            </div>
          </div>

          <!-- Initial State -->
          <div v-else class="card">
            <div class="card-body text-center">
              <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
              <h5>Google Finance Service Ready</h5>
              <p class="text-muted">Enter a stock symbol above to test the service</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Service Information -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Service Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>How it works:</h6>
                  <ul>
                    <li>Scrapes data from Google Finance pages</li>
                    <li>Parses HTML to extract quote information</li>
                    <li>Uses CORS proxy to bypass browser restrictions</li>
                    <li>Supports multiple symbol formats</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h6>Supported Exchanges:</h6>
                  <ul>
                    <li><strong>US:</strong> NASDAQ, NYSE (AAPL, MSFT, etc.)</li>
                    <li><strong>London:</strong> LSE (CSPX:LON, VUSA:LON, etc.)</li>
                    <li><strong>Others:</strong> Various international exchanges</li>
                    <li><strong>Format:</strong> SYMBOL:EXCHANGE</li>
                  </ul>
                </div>
              </div>

              <div class="alert alert-info mt-3">
                <strong>Note:</strong> This service is for demonstration purposes.
                For production use, consider using official APIs or backend scraping
                to avoid CORS limitations and rate limiting. You can use mock data
                to test the UI when live data is unavailable.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GoogleFinanceService, type GoogleFinanceQuote } from '@/services/googleFinanceService';

// Reactive state
const testSymbol = ref<string>('CSPX:LON');
const useProxy = ref<boolean>(true);
const useMockData = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const error = ref<string>('');
const quoteData = ref<GoogleFinanceQuote | null>(null);
const showRawData = ref<boolean>(false);

// Google Finance service instance
const googleFinanceService = new GoogleFinanceService({
  useMockData: false,
  enableMockFallback: true,
  network: {
    useProxy: true,
    timeout: 15000, // Increased timeout for proxy requests
    proxyUrl: 'https://corsproxy.io/?',
    fallbackProxies: [
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://thingproxy.freeboard.io/fetch/',
      'https://api.allorigins.win/raw?url=',
    ],
  },
});

/**
 * Fetch quote for the current test symbol
 */
async function fetchQuote(): Promise<void> {
  if (!testSymbol.value.trim()) {
    error.value = 'Please enter a symbol';
    return;
  }

  // Update service configuration
  googleFinanceService.updateConfig({ 
    network: { useProxy: useProxy.value } 
  });

  isLoading.value = true;
  error.value = '';
  quoteData.value = null;

  try {
    console.log(`Fetching quote for: ${testSymbol.value}`);

    let quote: GoogleFinanceQuote;
    if (useMockData.value) {
      console.log('Using mock data for testing');
      quote = await googleFinanceService.getMockQuote(testSymbol.value.trim());
    } else {
      quote = await googleFinanceService.getQuote(testSymbol.value.trim());
    }

    quoteData.value = quote;
    console.log('Quote fetched successfully:', quote);

  } catch (err) {
    console.error('Error fetching quote:', err);

    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Unknown error occurred';
    }
  } finally {
    isLoading.value = false;
  }
}

/**
 * Format currency value
 */
function formatCurrency(value: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
    'JPY': '¥',
    'INR': '₹',
  };

  const symbol = symbols[currency] || '$';
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * Format change value
 */
function formatChange(change: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
    'JPY': '¥',
    'INR': '₹',
  };

  const symbol = symbols[currency] || '$';
  const formatted = Math.abs(change).toFixed(2);
  return change >= 0 ? `+${symbol}${formatted}` : `-${symbol}${formatted}`;
}

/**
 * Format percentage value
 */
function formatPercent(percent: number): string {
  const formatted = Math.abs(percent).toFixed(2);
  return percent >= 0 ? `+${formatted}%` : `-${formatted}%`;
}

/**
 * Format volume
 */
function formatVolume(volume: number): string {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toLocaleString();
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Get CSS class for change color
 */
function getChangeColorClass(value: number): string {
  if (value > 0) return 'bg-success';
  if (value < 0) return 'bg-danger';
  return 'bg-secondary';
}

/**
 * Get icon for change direction
 */
function getChangeIcon(value: number): string {
  if (value > 0) return 'fas fa-caret-up';
  if (value < 0) return 'fas fa-caret-down';
  return 'fas fa-minus';
}

/**
 * Get CSS class for market status
 */
function getMarketStatusClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'OPEN': return 'bg-success';
    case 'CLOSED': return 'bg-secondary';
    case 'PRE_MARKET': return 'bg-warning';
    case 'AFTER_HOURS': return 'bg-info';
    default: return 'bg-secondary';
  }
}
</script>

<style scoped>
.google-finance-test {
  min-height: 100vh;
  background-color: #f8f9fa;
}

pre {
  max-height: 400px;
  overflow-y: auto;
}

.display-4 {
  font-size: 2.5rem;
}

.table td {
  border: none;
  padding: 0.25rem 0.5rem;
}

.badge.fs-6 {
  font-size: 0.875rem !important;
}
</style>
