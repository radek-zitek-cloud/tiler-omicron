/**
 * Google Finance Scraping Service
 *
 * This service handles scraping stock quotes from Google Finance.
 * Due to CORS restrictions, this service is designed to work with:
 * 1. A backend proxy service
 * 2. A CORS proxy (for development)
 * 3. Browser extensions that bypass CORS
 *
 * Example URL: https://www.google.com/finance/quote/CSPX:LON
 *
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * Interface for Google Finance stock data
 */
export interface GoogleFinanceQuote {
  /** Stock symbol (e.g., "CSPX:LON") */
  symbol: string;
  /** Company name */
  name: string;
  /** Current price */
  price: number;
  /** Currency of the price */
  currency: string;
  /** Price change in absolute value */
  change: number;
  /** Price change as percentage */
  changePercent: number;
  /** Previous close price */
  previousClose?: number;
  /** Market status (OPEN, CLOSED, PRE_MARKET, AFTER_HOURS) */
  marketStatus?: string;
  /** Last update timestamp */
  timestamp: number;
  /** Trading volume (if available) */
  volume?: number;
  /** Market capitalization (if available) */
  marketCap?: string;
  /** Day's high price */
  dayHigh?: number;
  /** Day's low price */
  dayLow?: number;
  /** 52-week high */
  week52High?: number;
  /** 52-week low */
  week52Low?: number;
  /** Price/Earnings ratio */
  peRatio?: number;
  /** Dividend yield */
  dividendYield?: number;
}

/**
 * Google Finance scraping service configuration
 */
export interface GoogleFinanceConfig {
  /** Base URL for Google Finance */
  baseUrl: string;
  /** CORS proxy URL (if using one) */
  proxyUrl?: string;
  /** Fallback proxy URLs to try if primary fails */
  fallbackProxies?: string[];
  /** Request timeout in milliseconds */
  timeout: number;
  /** Whether to use a proxy for CORS bypass */
  useProxy: boolean;
}

/**
 * Default configuration for Google Finance service
 */
const DEFAULT_CONFIG: GoogleFinanceConfig = {
  baseUrl: 'https://www.google.com/finance/quote',
  proxyUrl: 'https://corsproxy.io/?',
  fallbackProxies: [
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors-anywhere.herokuapp.com/',
  ],
  timeout: 10000,
  useProxy: true,
};

/**
 * Google Finance Service Class
 *
 * Handles scraping and parsing of stock data from Google Finance pages.
 * Implements multiple strategies to overcome CORS restrictions.
 */
export class GoogleFinanceService {
  private config: GoogleFinanceConfig;

  /**
   * Initialize the Google Finance service
   * @param config - Service configuration options
   */
  constructor(config: Partial<GoogleFinanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fetch stock quote from Google Finance
   *
   * @param symbol - Stock symbol with exchange (e.g., "CSPX:LON", "AAPL:NASDAQ")
   * @returns Promise resolving to stock quote data
   * @throws Error if scraping fails
   *
   * @example
   * ```typescript
   * const service = new GoogleFinanceService();
   * const quote = await service.getQuote('CSPX:LON');
   * console.log(`${quote.name}: $${quote.price}`);
   * ```
   */
  async getQuote(symbol: string): Promise<GoogleFinanceQuote> {
    try {
      // Validate symbol format
      if (!this.isValidSymbol(symbol)) {
        throw new Error(`Invalid symbol format: ${symbol}. Expected format: SYMBOL:EXCHANGE`);
      }

      // Construct the Google Finance URL
      const googleUrl = `${this.config.baseUrl}/${encodeURIComponent(symbol)}`;

      // Get the HTML content
      const htmlContent = await this.fetchHtmlContent(googleUrl);

      // Parse the HTML to extract quote data
      const quoteData = this.parseGoogleFinanceHTML(htmlContent, symbol);

      return quoteData;

    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);

      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.message.includes('CORS') || error.message.includes('proxy') || error.message.includes('Network error')) {
          throw new Error(`CORS/Network error when fetching ${symbol}. Consider using a backend proxy or trying direct mode.`);
        } else if (error.message.includes('404')) {
          throw new Error(`Symbol ${symbol} not found on Google Finance.`);
        } else if (error.message.includes('timeout')) {
          throw new Error(`Timeout while fetching ${symbol}. Please try again.`);
        } else if (error.message.includes('blocked')) {
          throw new Error(`Request blocked by Google Finance. Try again later or use a different approach.`);
        } else {
          throw new Error(`Failed to fetch quote for ${symbol}: ${error.message}`);
        }
      }

      throw new Error(`Unknown error while fetching quote for ${symbol}`);
    }
  }

  /**
   * Get mock data for testing when live data is unavailable
   * This is useful for development and testing scenarios
   */
  async getMockQuote(symbol: string): Promise<GoogleFinanceQuote> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData: Record<string, Partial<GoogleFinanceQuote>> = {
      'CSPX:LON': {
        name: 'iShares Core S&P 500 UCITS ETF',
        price: 645.20,
        currency: 'GBP',
        change: 2.15,
        changePercent: 0.33,
        previousClose: 643.05,
        volume: 1234567,
        marketCap: '£45.2B',
        dayHigh: 647.80,
        dayLow: 642.10,
        marketStatus: 'CLOSED',
      },
      'VUSA:LON': {
        name: 'Vanguard S&P 500 UCITS ETF',
        price: 97.42,
        currency: 'GBP',
        change: 0.18,
        changePercent: 0.18,
        previousClose: 97.24,
        volume: 987654,
        marketCap: '£12.8B',
        dayHigh: 97.55,
        dayLow: 97.20,
        marketStatus: 'CLOSED',
      },
      'AAPL': {
        name: 'Apple Inc.',
        price: 189.25,
        currency: 'USD',
        change: -1.75,
        changePercent: -0.92,
        previousClose: 191.00,
        volume: 45678900,
        marketCap: '$2.95T',
        dayHigh: 192.10,
        dayLow: 188.80,
        peRatio: 28.5,
        marketStatus: 'CLOSED',
      },
    };

    const mock = mockData[symbol.toUpperCase()] || mockData['AAPL'];

    return {
      symbol: symbol.toUpperCase(),
      name: mock.name || 'Unknown Company',
      price: mock.price || 100.00,
      currency: mock.currency || 'USD',
      change: mock.change || 0,
      changePercent: mock.changePercent || 0,
      timestamp: Date.now(),
      previousClose: mock.previousClose,
      volume: mock.volume,
      marketCap: mock.marketCap,
      dayHigh: mock.dayHigh,
      dayLow: mock.dayLow,
      peRatio: mock.peRatio,
      marketStatus: mock.marketStatus || 'CLOSED',
    };
  }

  /**
   * Validate symbol format (SYMBOL:EXCHANGE)
   *
   * @param symbol - Symbol to validate
   * @returns True if symbol format is valid
   *
   * @example
   * ```typescript
   * isValidSymbol('AAPL:NASDAQ') // true
   * isValidSymbol('CSPX:LON')    // true
   * isValidSymbol('INVALID')     // false
   * ```
   */
  private isValidSymbol(symbol: string): boolean {
    // Google Finance typically uses SYMBOL:EXCHANGE format
    const symbolPattern = /^[A-Z0-9\-\.]+:[A-Z]+$/i;
    return symbolPattern.test(symbol.trim());
  }

  /**
   * Fetch HTML content from Google Finance
   * Handles CORS using proxy if configured, with fallback proxy support
   *
   * @param url - Google Finance URL to fetch
   * @returns Promise resolving to HTML content
   */
  private async fetchHtmlContent(url: string): Promise<string> {
    if (!this.config.useProxy) {
      // Direct request without proxy
      return this.fetchWithProxy(url, '');
    }

    // Try primary proxy first
    if (this.config.proxyUrl) {
      try {
        return await this.fetchWithProxy(url, this.config.proxyUrl);
      } catch (error) {
        console.warn('Primary proxy failed, trying fallbacks:', error);
      }
    }

    // Try fallback proxies
    if (this.config.fallbackProxies) {
      for (const proxyUrl of this.config.fallbackProxies) {
        try {
          console.log(`Trying fallback proxy: ${proxyUrl}`);
          return await this.fetchWithProxy(url, proxyUrl);
        } catch (error) {
          console.warn(`Fallback proxy ${proxyUrl} failed:`, error);
          continue;
        }
      }
    }

    throw new Error('All proxy services failed. Google Finance may be blocking requests or proxies are unavailable.');
  }

  /**
   * Fetch content using a specific proxy
   */
  private async fetchWithProxy(url: string, proxyUrl: string): Promise<string> {
    const fetchUrl = proxyUrl ? `${proxyUrl}${encodeURIComponent(url)}` : url;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // Minimal headers to avoid CORS issues
      const headers: Record<string, string> = {
        'Accept': 'text/html,application/xhtml+xml',
      };

      // Only add User-Agent for direct requests (no proxy)
      if (!proxyUrl) {
        headers['User-Agent'] = 'Mozilla/5.0 (compatible; StockQuoteBot/1.0)';
      }

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
        mode: proxyUrl ? 'cors' : 'no-cors',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Validate response content
      if (!html || html.length < 500) {
        throw new Error('Received empty or incomplete response');
      }

      // Check if we got an error page instead of the actual content
      if (html.includes('blocked') || html.includes('captcha') || html.includes('rate limit')) {
        throw new Error('Request blocked by Google Finance');
      }

      return html;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('Load failed')) {
          throw new Error('Network error or CORS blocked');
        }
        throw error;
      }

      throw new Error('Unknown error while fetching content');
    }
  }

  /**
   * Parse Google Finance HTML to extract stock quote data
   *
   * This function uses regex patterns and string parsing to extract data
   * from the Google Finance page HTML structure.
   *
   * @param html - HTML content from Google Finance page
   * @param symbol - Stock symbol for validation
   * @returns Parsed quote data
   */
  private parseGoogleFinanceHTML(html: string, symbol: string): GoogleFinanceQuote {
    try {
      // Extract company name
      const name = this.extractCompanyName(html);

      // Extract current price and currency
      const { price, currency } = this.extractPrice(html);

      // Extract price change data
      const { change, changePercent } = this.extractPriceChange(html);

      // Extract additional market data
      const additionalData = this.extractAdditionalData(html);

      // Determine market status
      const marketStatus = this.extractMarketStatus(html);

      const quote: GoogleFinanceQuote = {
        symbol: symbol.toUpperCase(),
        name,
        price,
        currency,
        change,
        changePercent,
        marketStatus,
        timestamp: Date.now(),
        ...additionalData,
      };

      // Validate the extracted data
      this.validateQuoteData(quote);

      return quote;

    } catch (error) {
      console.error('Error parsing Google Finance HTML:', error);
      throw new Error(`Failed to parse quote data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }

  /**
   * Extract company name from HTML
   */
  private extractCompanyName(html: string): string {
    // Try multiple patterns for company name extraction
    const patterns = [
      /<meta\s+property="og:title"\s+content="([^"]+)"/i,
      /<title[^>]*>([^<]+)/i,
      /<h1[^>]*>([^<]+)</i,
      /class="[^"]*company[^"]*"[^>]*>([^<]+)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let name = match[1].trim();
        // Clean up the name (remove " Stock Price" or similar suffixes)
        name = name.replace(/\s*-\s*Google Finance$/i, '');
        name = name.replace(/\s*Stock Price.*$/i, '');
        name = name.replace(/\s*Share Price.*$/i, '');

        if (name.length > 2) {
          return name;
        }
      }
    }

    throw new Error('Could not extract company name from HTML');
  }

  /**
   * Extract current price and currency from HTML
   */
  private extractPrice(html: string): { price: number; currency: string } {
    // Patterns for price extraction
    const pricePatterns = [
      /data-last-price="([^"]+)"/i,
      /class="[^"]*price[^"]*"[^>]*>\s*([A-Z$£€¥₹]+)?\s*([\d,]+\.?\d*)/i,
      /"price"[^}]*"raw":\s*([\d.]+)/i,
      />\s*([A-Z$£€¥₹]+)?\s*([\d,]+\.?\d*)\s*<\/[^>]*price/i,
    ];

    let price: number | null = null;
    let currency = 'USD'; // Default currency

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);        if (match) {
        if (match[2]) {
          // Pattern with currency and price
          const currencySymbol = match[1];
          const priceStr = match[2].replace(/,/g, '');
          const parsedPrice = parseFloat(priceStr);

          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            price = parsedPrice;
            if (currencySymbol) {
              currency = this.mapCurrencySymbol(currencySymbol);
            }
          }
        } else if (match[1]) {
          // Pattern with just price
          const priceStr = match[1].replace(/,/g, '');
          const parsedPrice = parseFloat(priceStr);

          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            price = parsedPrice;
          }
        }

        if (price !== null && price > 0) {
          break;
        }
      }
    }

    if (price === null || isNaN(price) || price <= 0) {
      throw new Error('Could not extract valid price from HTML');
    }

    return { price, currency };
  }

  /**
   * Extract price change and percentage change from HTML
   */
  private extractPriceChange(html: string): { change: number; changePercent: number } {
    const changePatterns = [
      /data-last-change="([^"]+)"/i,
      /"change"[^}]*"raw":\s*([-\d.]+)/i,
      /class="[^"]*change[^"]*"[^>]*>\s*([-+]?[\d,]+\.?\d*)/i,
    ];

    const percentPatterns = [
      /data-last-change-percentage="([^"]+)"/i,
      /"changePercent"[^}]*"raw":\s*([-\d.]+)/i,
      /\(([-+]?[\d.]+)%\)/i,
    ];

    let change = 0;
    let changePercent = 0;

    // Extract absolute change
    for (const pattern of changePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const changeStr = match[1].replace(/,/g, '');
        const parsedChange = parseFloat(changeStr);
        if (!isNaN(parsedChange)) {
          change = parsedChange;
          break;
        }
      }
    }

    // Extract percentage change
    for (const pattern of percentPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const percentStr = match[1].replace(/%/g, '');
        const parsedPercent = parseFloat(percentStr);
        if (!isNaN(parsedPercent)) {
          changePercent = parsedPercent;
          break;
        }
      }
    }

    return { change, changePercent };
  }

  /**
   * Extract additional market data (volume, market cap, etc.)
   */
  private extractAdditionalData(html: string): Partial<GoogleFinanceQuote> {
    const data: Partial<GoogleFinanceQuote> = {};

    // Extract volume
    const volumeMatch = html.match(/volume[^>]*>\s*([\d,KMB.]+)/i);
    if (volumeMatch && volumeMatch[1]) {
      data.volume = this.parseVolumeString(volumeMatch[1]);
    }

    // Extract market cap
    const marketCapMatch = html.match(/market\s*cap[^>]*>\s*([A-Z$£€¥₹]?[\d,KMB.]+)/i);
    if (marketCapMatch && marketCapMatch[1]) {
      data.marketCap = marketCapMatch[1];
    }

    // Extract P/E ratio
    const peMatch = html.match(/P\/E\s*ratio[^>]*>\s*([\d.]+)/i);
    if (peMatch && peMatch[1]) {
      data.peRatio = parseFloat(peMatch[1]);
    }

    // Extract dividend yield
    const dividendMatch = html.match(/dividend\s*yield[^>]*>\s*([\d.]+)%/i);
    if (dividendMatch && dividendMatch[1]) {
      data.dividendYield = parseFloat(dividendMatch[1]);
    }

    return data;
  }

  /**
   * Extract market status from HTML
   */
  private extractMarketStatus(html: string): string {
    const statusPatterns = [
      /market\s*status[^>]*>\s*([^<]+)/i,
      /class="[^"]*status[^"]*"[^>]*>\s*([^<]+)/i,
      /(OPEN|CLOSED|PRE_MARKET|AFTER_HOURS)/i,
    ];

    for (const pattern of statusPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const status = match[1].trim().toUpperCase();
        if (['OPEN', 'CLOSED', 'PRE_MARKET', 'AFTER_HOURS'].includes(status)) {
          return status;
        }
      }
    }

    return 'UNKNOWN';
  }

  /**
   * Map currency symbols to currency codes
   */
  private mapCurrencySymbol(symbol: string): string {
    const currencyMap: Record<string, string> = {
      '$': 'USD',
      '£': 'GBP',
      '€': 'EUR',
      '¥': 'JPY',
      '₹': 'INR',
    };

    return currencyMap[symbol] || 'USD';
  }

  /**
   * Parse volume string (e.g., "1.2M" -> 1200000)
   */
  private parseVolumeString(volumeStr: string): number {
    const cleanStr = volumeStr.replace(/,/g, '').toUpperCase();
    const match = cleanStr.match(/([\d.]+)([KMB]?)/);

    if (!match) return 0;

    const number = parseFloat(match[1]);
    const suffix = match[2];

    switch (suffix) {
      case 'K': return number * 1000;
      case 'M': return number * 1000000;
      case 'B': return number * 1000000000;
      default: return number;
    }
  }

  /**
   * Validate extracted quote data
   */
  private validateQuoteData(quote: GoogleFinanceQuote): void {
    if (!quote.symbol || quote.symbol.length === 0) {
      throw new Error('Invalid symbol in quote data');
    }

    if (!quote.name || quote.name.length === 0) {
      throw new Error('Invalid company name in quote data');
    }

    if (isNaN(quote.price) || quote.price <= 0) {
      throw new Error('Invalid price in quote data');
    }

    if (!quote.currency || quote.currency.length === 0) {
      throw new Error('Invalid currency in quote data');
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<GoogleFinanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current service configuration
   */
  getConfig(): GoogleFinanceConfig {
    return { ...this.config };
  }
}

/**
 * Utility function to create a Google Finance service instance
 *
 * @param config - Optional configuration
 * @returns New GoogleFinanceService instance
 *
 * @example
 * ```typescript
 * const service = createGoogleFinanceService({ useProxy: false });
 * const quote = await service.getQuote('AAPL:NASDAQ');
 * ```
 */
export function createGoogleFinanceService(config?: Partial<GoogleFinanceConfig>): GoogleFinanceService {
  return new GoogleFinanceService(config);
}

/**
 * Helper function to convert symbol to Google Finance format
 *
 * @param symbol - Basic symbol (e.g., "AAPL")
 * @param exchange - Exchange code (e.g., "NASDAQ")
 * @returns Google Finance formatted symbol (e.g., "AAPL:NASDAQ")
 *
 * @example
 * ```typescript
 * const googleSymbol = formatSymbolForGoogle('AAPL', 'NASDAQ');
 * // Returns: "AAPL:NASDAQ"
 * ```
 */
export function formatSymbolForGoogle(symbol: string, exchange: string): string {
  return `${symbol.toUpperCase()}:${exchange.toUpperCase()}`;
}

/**
 * Helper function to parse Google Finance symbol back to components
 *
 * @param googleSymbol - Google Finance symbol (e.g., "AAPL:NASDAQ")
 * @returns Object with symbol and exchange
 *
 * @example
 * ```typescript
 * const { symbol, exchange } = parseGoogleSymbol('AAPL:NASDAQ');
 * // Returns: { symbol: 'AAPL', exchange: 'NASDAQ' }
 * ```
 */
export function parseGoogleSymbol(googleSymbol: string): { symbol: string; exchange: string } {
  const parts = googleSymbol.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid Google Finance symbol format: ${googleSymbol}`);
  }

  return {
    symbol: parts[0].trim().toUpperCase(),
    exchange: parts[1].trim().toUpperCase(),
  };
}

// Export the service instance for convenience
export default GoogleFinanceService;
