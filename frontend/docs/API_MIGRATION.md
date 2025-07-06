# API Migration Guide

## Overview

This document outlines the evolution of stock quote data fetching in the Tiler application, from multiple API fallbacks through Google Finance scraping to the current Alpha Vantage API implementation.

## Current Implementation: Alpha Vantage API

**Status:** ✅ **Active**

### Configuration

- **API Provider:** Alpha Vantage
- **Endpoint:** Global Quote (GLOBAL_QUOTE)
- **API Key:** Configured with user-provided key
- **Base URL:** `https://www.alphavantage.co/query`

### Features

- **Real-time quotes:** Current price, change, volume
- **Rate limiting:** 5 API requests per minute, 500 per day (free tier)
- **Symbol support:** US stocks, ETFs, international symbols
- **Data reliability:** Official API with consistent uptime
- **No CORS issues:** Direct API access from browser

### Implementation Details

```typescript
// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = 'PH76AIY52D5VVUHX'
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

// API call format
const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
```

### Data Transformation

Alpha Vantage Global Quote response is transformed to our internal `QuoteData` format:

```typescript
interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string
    '05. price': string
    '09. change': string
    '10. change percent': string
    '06. volume': string
    '03. high': string
    '04. low': string
    '08. previous close': string
  }
}
```

### Error Handling

- API rate limit detection and user-friendly messages
- Invalid symbol validation
- Network timeout handling
- Mock data fallback for development (AAPL only)

### Error Handling

- **401 Errors**: CORS policy violations, try next API
- **404 Errors**: Invalid symbol, clear user feedback
- **429 Errors**: Rate limiting, suggest retry
- **Network Errors**: Connection issues, suggest retry
- **All APIs Failed**: Clear message about service availability

### Production Considerations

For production use, consider:

- **Paid API Keys**: More reliable and higher rate limits
- **Backend Proxy**: Server-side API calls to avoid CORS
- **Caching**: Reduce API calls and improve performance
- **WebSocket**: Real-time updates for better UX

### Testing

Test with various symbols:

- Large cap: AAPL, MSFT, GOOGL
- Small cap: Various symbols
- Invalid symbols: TEST123 (should show appropriate error)

### Rate Limiting

- IEX Sandbox: Limited requests per month
- FMP Free: Limited requests per month
- Yahoo Finance: Unofficial, rate limits unknown

Monitor usage and implement caching if needed.

## Migration History

### Phase 1: Finnhub Implementation (2024-01)

- **API**: Finnhub.io
- **Status**: Abandoned due to CORS restrictions
- **Issue**: Browser-based requests blocked by CORS policy
- **Lesson**: Even with valid API keys, CORS can prevent browser access

### Phase 2: Financial Modeling Prep (2024-01)

- **API**: Financial Modeling Prep
- **Status**: Working but limited
- **Issues**: Free tier has rate limits, inconsistent CORS support

### Phase 3: Yahoo Finance (2024-01)

- **API**: Yahoo Finance quoteSummary
- **Status**: CORS 401 errors encountered
- **Issue**: Access denied due to CORS policy restrictions

### Phase 5: Google Finance Only (Current - July 2025)

**Current Implementation**: Google Finance Scraping Service

- **Status**: Active - Single data source approach
- **Benefits**: Unified data format, international market support, no API keys required
- **CORS Solution**: Multiple proxy fallback system with enhanced error handling

## Data Structure

All data is normalized to this interface:

```typescript
interface QuoteData {
  symbol: string
  name?: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  timestamp: number
  high?: number
  low?: number
  previousClose?: number
}
```

The Google Finance service provides additional fields that are mapped to this structure.
