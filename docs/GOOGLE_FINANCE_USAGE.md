# Google Finance Service - Primary Data Source

This document provides examples of how to use the Google Finance scraping service as the **primary and only** data source for stock quotes in the Vue.js dashboard application.

## Overview

The application now uses Google Finance scraping exclusively for all stock quote data. This provides:

- **Unified data source**: Consistent data format and availability
- **International support**: US, London, European, and Asian markets
- **Rich data**: Company names, market status, financial metrics
- **No API keys**: Completely free without registration
- **Real-time data**: Direct access to Google's financial information

## Basic Usage

### 1. Import the Service

```typescript
import { GoogleFinanceService, type GoogleFinanceQuote } from '@/services/googleFinanceService'
```

### 2. Create Service Instance

```typescript
// Basic instance with default settings
const googleService = new GoogleFinanceService()

// Custom configuration
const googleService = new GoogleFinanceService({
  useProxy: true, // Use CORS proxy for browser requests
  timeout: 10000, // 10 second timeout
  proxyUrl: 'https://api.allorigins.win/raw?url=', // Custom proxy URL
})
```

### 3. Fetch Stock Quote

```typescript
async function fetchStockQuote(symbol: string) {
  try {
    const quote = await googleService.getQuote(symbol)

    console.log(`Company: ${quote.name}`)
    console.log(`Price: ${quote.currency} ${quote.price}`)
    console.log(`Change: ${quote.change} (${quote.changePercent}%)`)
    console.log(`Market Status: ${quote.marketStatus}`)

    return quote
  } catch (error) {
    console.error('Failed to fetch quote:', error)
    throw error
  }
}
```

## Symbol Formats

### US Stocks

```typescript
// These will be automatically mapped to their exchanges
await googleService.getQuote('AAPL') // Maps to AAPL:NASDAQ
await googleService.getQuote('MSFT') // Maps to MSFT:NASDAQ
await googleService.getQuote('JPM') // Maps to JPM:NYSE
```

### International Stocks

```typescript
// London Stock Exchange (ETFs and stocks)
await googleService.getQuote('CSPX:LON') // iShares Core S&P 500 UCITS ETF
await googleService.getQuote('VUSA:LON') // Vanguard S&P 500 UCITS ETF
await googleService.getQuote('VWRL:LON') // Vanguard FTSE All-World UCITS ETF

// European stocks
await googleService.getQuote('ASML:AMS') // ASML (Amsterdam)
await googleService.getQuote('SAP:ETR') // SAP (Frankfurt)
```

## Integration with Vue Components

### Reactive Quote Component

```vue
<template>
  <div class="stock-quote">
    <div v-if="isLoading">Loading {{ symbol }}...</div>

    <div v-else-if="error" class="error">Error: {{ error }}</div>

    <div v-else-if="quote" class="quote-data">
      <h3>{{ quote.name }}</h3>
      <div class="price">{{ quote.currency }} {{ quote.price.toFixed(2) }}</div>
      <div class="change" :class="changeClass">
        {{ formatChange(quote.change) }} ({{ formatPercent(quote.changePercent) }})
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { GoogleFinanceService, type GoogleFinanceQuote } from '@/services/googleFinanceService'

interface Props {
  symbol: string
  autoRefresh?: boolean
  refreshInterval?: number // seconds
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 60,
})

const googleService = new GoogleFinanceService({ useProxy: true })

const isLoading = ref(false)
const error = ref('')
const quote = ref<GoogleFinanceQuote | null>(null)

const changeClass = computed(() => {
  if (!quote.value) return ''
  return quote.value.change > 0 ? 'positive' : 'negative'
})

async function fetchQuote() {
  isLoading.value = true
  error.value = ''

  try {
    quote.value = await googleService.getQuote(props.symbol)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch quote'
  } finally {
    isLoading.value = false
  }
}

function formatChange(change: number): string {
  return change >= 0 ? `+${change.toFixed(2)}` : `${change.toFixed(2)}`
}

function formatPercent(percent: number): string {
  return percent >= 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`
}

onMounted(() => {
  fetchQuote()

  if (props.autoRefresh) {
    setInterval(fetchQuote, props.refreshInterval * 1000)
  }
})
</script>

<style scoped>
.positive {
  color: green;
}
.negative {
  color: red;
}
.error {
  color: red;
}
</style>
```

### Usage in Parent Component

```vue
<template>
  <div class="portfolio">
    <StockQuote symbol="CSPX:LON" :auto-refresh="true" :refresh-interval="30" />
    <StockQuote symbol="AAPL" :auto-refresh="true" :refresh-interval="30" />
    <StockQuote symbol="VUSA:LON" />
  </div>
</template>

<script setup lang="ts">
import StockQuote from './StockQuote.vue'
</script>
```

## Error Handling

### Common Error Scenarios

```typescript
async function robustQuoteFetch(symbol: string) {
  try {
    const quote = await googleService.getQuote(symbol)
    return { success: true, data: quote, error: null }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('CORS')) {
        return {
          success: false,
          data: null,
          error: 'CORS error - try enabling proxy mode',
        }
      } else if (error.message.includes('404')) {
        return {
          success: false,
          data: null,
          error: 'Symbol not found - check symbol format',
        }
      } else if (error.message.includes('timeout')) {
        return {
          success: false,
          data: null,
          error: 'Request timeout - try again later',
        }
      }
    }

    return {
      success: false,
      data: null,
      error: 'Unknown error occurred',
    }
  }
}
```

## Configuration Options

### Service Configuration

```typescript
interface GoogleFinanceConfig {
  baseUrl: string // Google Finance base URL
  proxyUrl?: string // CORS proxy URL
  timeout: number // Request timeout in milliseconds
  useProxy: boolean // Whether to use CORS proxy
}

// Default configuration
const defaultConfig = {
  baseUrl: 'https://www.google.com/finance/quote',
  proxyUrl: 'https://api.allorigins.win/raw?url=',
  timeout: 10000,
  useProxy: true,
}

// Update configuration at runtime
googleService.updateConfig({
  timeout: 15000,
  useProxy: false,
})
```

### Environment-Based Configuration

```typescript
// In your environment files
// .env.development
VITE_GOOGLE_FINANCE_USE_PROXY = true
VITE_GOOGLE_FINANCE_TIMEOUT = 10000

// .env.production
VITE_GOOGLE_FINANCE_USE_PROXY = false
VITE_GOOGLE_FINANCE_TIMEOUT = 5000

// In your service setup
const googleService = new GoogleFinanceService({
  useProxy: import.meta.env.VITE_GOOGLE_FINANCE_USE_PROXY === 'true',
  timeout: Number(import.meta.env.VITE_GOOGLE_FINANCE_TIMEOUT) || 10000,
})
```

## Production Considerations

### 1. Backend Proxy (Recommended)

For production applications, implement a backend proxy to avoid CORS issues:

```typescript
// Backend endpoint: /api/quote/:symbol
async function fetchViaBackend(symbol: string) {
  const response = await fetch(`/api/quote/${encodeURIComponent(symbol)}`)
  return response.json()
}

// Configure service to use backend
const googleService = new GoogleFinanceService({
  baseUrl: '/api/quote', // Your backend endpoint
  useProxy: false,
  timeout: 5000,
})
```

### 2. Rate Limiting

Implement client-side rate limiting to be respectful:

```typescript
class RateLimitedGoogleService {
  private lastRequest = 0
  private minInterval = 1000 // 1 second between requests

  async getQuote(symbol: string) {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequest

    if (timeSinceLastRequest < this.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minInterval - timeSinceLastRequest))
    }

    this.lastRequest = Date.now()
    return googleService.getQuote(symbol)
  }
}
```

### 3. Caching

Implement caching to reduce API calls:

```typescript
interface CachedQuote {
  data: GoogleFinanceQuote
  timestamp: number
}

class CachedGoogleService {
  private cache = new Map<string, CachedQuote>()
  private cacheExpiry = 60000 // 1 minute

  async getQuote(symbol: string): Promise<GoogleFinanceQuote> {
    const cached = this.cache.get(symbol)

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data
    }

    const quote = await googleService.getQuote(symbol)
    this.cache.set(symbol, { data: quote, timestamp: Date.now() })

    return quote
  }
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GoogleFinanceService } from '@/services/googleFinanceService'

describe('GoogleFinanceService', () => {
  it('should validate symbol format correctly', () => {
    const service = new GoogleFinanceService()

    expect(service.isValidSymbol('AAPL:NASDAQ')).toBe(true)
    expect(service.isValidSymbol('CSPX:LON')).toBe(true)
    expect(service.isValidSymbol('INVALID')).toBe(false)
  })

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const service = new GoogleFinanceService()

    await expect(service.getQuote('AAPL:NASDAQ')).rejects.toThrow()
  })
})
```

## Supported Exchanges and Symbols

### Major Exchanges

- **NASDAQ**: AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA
- **NYSE**: JPM, JNJ, V, PG, UNH, MA, HD, BAC, DIS
- **London (LON)**: CSPX, VUSA, VWRL, VWRA, IWDA, EUNL
- **Amsterdam (AMS)**: ASML, ADYEN
- **Frankfurt (ETR)**: SAP, SIE
- **Tokyo (TYO)**: 7203 (Toyota), 9984 (SoftBank)

### ETF Examples

- **CSPX:LON** - iShares Core S&P 500 UCITS ETF
- **VUSA:LON** - Vanguard S&P 500 UCITS ETF
- **VWRL:LON** - Vanguard FTSE All-World UCITS ETF
- **IWDA:LON** - iShares Core MSCI World UCITS ETF
- **EUNL:LON** - iShares Core MSCI Europe UCITS ETF

This service provides a robust way to fetch stock data from Google Finance while handling the complexities of web scraping and CORS restrictions.
