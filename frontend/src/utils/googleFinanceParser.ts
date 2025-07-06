/**
 * Google Finance HTML Parser Utility
 * 
 * Specialized utility for extracting financial data from Google Finance HTML pages.
 * Handles various data formats, currency conversion, and field validation.
 * 
 * Features:
 * - Robust HTML parsing with multiple extraction strategies
 * - Currency symbol mapping and normalization
 * - Volume string parsing (K, M, B notation)
 * - Data validation and error handling
 * - Multiple regex patterns for data extraction
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import type { GoogleFinanceQuote } from '@/services/googleFinanceService';

/**
 * Configuration for HTML parsing
 */
export interface ParserConfig {
  /** Timeout for parsing operations */
  parseTimeout: number;
  /** Enable debug logging */
  debug: boolean;
  /** Strict mode for validation */
  strictMode: boolean;
}

/**
 * Default parser configuration
 */
const DEFAULT_PARSER_CONFIG: ParserConfig = {
  parseTimeout: 5000,
  debug: false,
  strictMode: false,
};

/**
 * Currency symbol mappings for normalization
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD',
  '£': 'GBP',
  '€': 'EUR',
  '¥': 'JPY',
  '₹': 'INR',
  'C$': 'CAD',
  'A$': 'AUD',
  'CHF': 'CHF',
  'kr': 'SEK',
  'R$': 'BRL',
  '₽': 'RUB',
  '₩': 'KRW',
  'HK$': 'HKD',
  'S$': 'SGD',
  'NT$': 'TWD',
};

/**
 * Volume multiplier mappings
 */
const VOLUME_MULTIPLIERS: Record<string, number> = {
  'K': 1000,
  'M': 1000000,
  'B': 1000000000,
  'T': 1000000000000,
};

/**
 * Google Finance HTML Parser
 * 
 * Specialized parser for extracting financial data from Google Finance pages.
 * Uses multiple extraction strategies to handle various page layouts and formats.
 * 
 * Time Complexity: O(n) where n is HTML content length
 * Space Complexity: O(1) for most operations
 * 
 * @example
 * ```typescript
 * const parser = new GoogleFinanceParser();
 * const quote = parser.parseHTML(htmlContent, 'AAPL:NASDAQ');
 * console.log(quote.price, quote.currency);
 * ```
 */
export class GoogleFinanceParser {
  private config: ParserConfig;

  /**
   * Creates a new GoogleFinanceParser instance
   * 
   * @param config - Optional parser configuration
   */
  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_PARSER_CONFIG, ...config };
  }

  /**
   * Parses Google Finance HTML to extract quote data
   * 
   * Uses multiple extraction strategies to handle different page layouts
   * and data formats from Google Finance.
   * 
   * @param html - HTML content from Google Finance page
   * @param symbol - Stock symbol for validation
   * @returns Parsed quote data
   * 
   * Time Complexity: O(n) where n is HTML length
   * Space Complexity: O(1)
   */
  parseHTML(html: string, symbol: string): GoogleFinanceQuote {
    if (!html || html.trim().length === 0) {
      throw new Error('Empty HTML content provided');
    }

    this.debugLog(`Parsing HTML for symbol: ${symbol}`);
    const startTime = Date.now();

    try {
      // Extract basic quote information
      const price = this.extractPrice(html);
      const currency = this.extractCurrency(html);
      const change = this.extractChange(html);
      const changePercent = this.extractChangePercent(html);
      const name = this.extractCompanyName(html, symbol);

      // Extract additional data
      const additionalData = this.extractAdditionalData(html);

      // Build the quote object
      const quote: GoogleFinanceQuote = {
        symbol,
        name,
        price,
        currency,
        change,
        changePercent,
        timestamp: Date.now(),
        previousClose: price - change,
        ...additionalData,
      };

      // Validate the extracted data
      this.validateQuote(quote);

      const duration = Date.now() - startTime;
      this.debugLog(`Parsing completed in ${duration}ms`);

      return quote;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Parsing failed after ${duration}ms:`, error);
      throw new Error(`Failed to parse Google Finance data: ${(error as Error).message}`);
    }
  }

  /**
   * Extracts the current price from HTML
   * 
   * Uses multiple regex patterns to find price information in various formats.
   * 
   * @param html - HTML content
   * @returns Extracted price
   * 
   * Time Complexity: O(n)
   * Space Complexity: O(1)
   */
  private extractPrice(html: string): number {
    const pricePatterns = [
      // Standard price format: data-last-price="123.45"
      /data-last-price="([0-9,]+\.?[0-9]*)"/,
      // Alternative: class price value
      /class="[^"]*price[^"]*"[^>]*>([0-9,]+\.?[0-9]*)/,
      // JSON-LD structured data
      /"price":\s*"?([0-9,]+\.?[0-9]*)"?/,
      // Currency symbol followed by price
      /[$£€¥₹]\s*([0-9,]+\.?[0-9]*)/,
      // Generic number after currency indicators
      /(?:USD|GBP|EUR|JPY|INR)\s*([0-9,]+\.?[0-9]*)/i,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        
        if (!isNaN(price) && price > 0) {
          this.debugLog(`Price extracted: ${price} using pattern: ${pattern.source}`);
          return price;
        }
      }
    }

    throw new Error('Unable to extract price from HTML');
  }

  /**
   * Extracts the currency from HTML
   * 
   * @param html - HTML content
   * @returns Currency code (e.g., 'USD', 'GBP')
   * 
   * Time Complexity: O(n)
   * Space Complexity: O(1)
   */
  private extractCurrency(html: string): string {
    const currencyPatterns = [
      // Currency code in data attributes
      /data-currency="([A-Z]{3})"/,
      // Currency in JSON data
      /"currency":\s*"([A-Z]{3})"/,
      // Currency symbols in content
      /([$£€¥₹])/,
      // Written currency names
      /(USD|GBP|EUR|JPY|INR|CAD|AUD|CHF|SEK|NOK|DKK)/gi,
    ];

    for (const pattern of currencyPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const currency = this.mapCurrencySymbol(match[1]);
        this.debugLog(`Currency extracted: ${currency}`);
        return currency;
      }
    }

    // Default to USD if no currency found
    this.debugLog('Currency not found, defaulting to USD');
    return 'USD';
  }

  /**
   * Extracts price change from HTML
   * 
   * @param html - HTML content
   * @returns Price change value
   * 
   * Time Complexity: O(n)
   * Space Complexity: O(1)
   */
  private extractChange(html: string): number {
    const changePatterns = [
      // Change with plus/minus signs
      /data-change="([-+]?[0-9,]+\.?[0-9]*)"/,
      // Change in spans or divs
      /change[^>]*>.*?([-+]?[0-9,]+\.?[0-9]*)/i,
      // Generic plus/minus patterns
      /([-+]\s*[0-9,]+\.?[0-9]*)/,
    ];

    for (const pattern of changePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const changeStr = match[1].replace(/[,\s]/g, '');
        const change = parseFloat(changeStr);
        
        if (!isNaN(change)) {
          this.debugLog(`Change extracted: ${change}`);
          return change;
        }
      }
    }

    this.debugLog('Change not found, defaulting to 0');
    return 0;
  }

  /**
   * Extracts percentage change from HTML
   * 
   * @param html - HTML content
   * @returns Percentage change value
   * 
   * Time Complexity: O(n)
   * Space Complexity: O(1)
   */
  private extractChangePercent(html: string): number {
    const percentPatterns = [
      // Percentage with data attributes
      /data-change-percent="([-+]?[0-9,]+\.?[0-9]*)%?"/,
      // Percentage in parentheses
      /\(([-+]?[0-9,]+\.?[0-9]*)%\)/,
      // Percentage in spans or divs
      /percent[^>]*>.*?([-+]?[0-9,]+\.?[0-9]*)%/i,
    ];

    for (const pattern of percentPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const percentStr = match[1].replace(/[,\s]/g, '');
        const percent = parseFloat(percentStr);
        
        if (!isNaN(percent)) {
          this.debugLog(`Change percent extracted: ${percent}%`);
          return percent;
        }
      }
    }

    this.debugLog('Change percent not found, defaulting to 0');
    return 0;
  }

  /**
   * Extracts company name from HTML
   * 
   * @param html - HTML content
   * @param symbol - Stock symbol for fallback
   * @returns Company name
   * 
   * Time Complexity: O(n)
   * Space Complexity: O(1)
   */
  private extractCompanyName(html: string, symbol: string): string {
    const namePatterns = [
      // Title tags
      /<title>([^|]+)/i,
      // Company name in headers
      /<h1[^>]*>([^<]+)</,
      // Meta description
      /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
      // JSON-LD name
      /"name":\s*"([^"]+)"/,
    ];

    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim()
          .replace(/\s*-\s*Google Finance.*$/i, '')
          .replace(/\s*\|\s*Google.*$/i, '')
          .replace(/^\s*Google Finance\s*[-|]?\s*/i, '');
        
        if (name.length > 0 && name !== symbol) {
          this.debugLog(`Company name extracted: ${name}`);
          return name;
        }
      }
    }

    // Fallback to symbol
    this.debugLog('Company name not found, using symbol');
    return symbol;
  }

  /**
   * Extracts additional market data (volume, market cap, etc.)
   * 
   * @param html - HTML content
   * @returns Object with additional market data
   * 
   * Time Complexity: O(n)
   * Space Complexity: O(1)
   */
  private extractAdditionalData(html: string): Partial<GoogleFinanceQuote> {
    const data: Partial<GoogleFinanceQuote> = {};

    // Extract volume
    const volumeMatch = html.match(/volume[^>]*>([0-9,.KMB]+)/i);
    if (volumeMatch && volumeMatch[1]) {
      data.volume = this.parseVolumeString(volumeMatch[1]);
    }

    // Extract market cap
    const marketCapMatch = html.match(/market\s*cap[^>]*>([A-Z$£€¥₹]?[0-9,.KMB]+)/i);
    if (marketCapMatch && marketCapMatch[1]) {
      data.marketCap = marketCapMatch[1];
    }

    // Extract day high
    const highMatch = html.match(/(?:day[^>]*high|high[^>]*day)[^>]*>([0-9,.]+)/i);
    if (highMatch && highMatch[1]) {
      data.dayHigh = parseFloat(highMatch[1].replace(/,/g, ''));
    }

    // Extract day low
    const lowMatch = html.match(/(?:day[^>]*low|low[^>]*day)[^>]*>([0-9,.]+)/i);
    if (lowMatch && lowMatch[1]) {
      data.dayLow = parseFloat(lowMatch[1].replace(/,/g, ''));
    }

    return data;
  }

  /**
   * Maps currency symbols to currency codes
   * 
   * @param symbol - Currency symbol or code
   * @returns Standardized currency code
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private mapCurrencySymbol(symbol: string): string {
    const normalizedSymbol = symbol.toUpperCase().trim();
    
    // Return if already a valid currency code
    if (/^[A-Z]{3}$/.test(normalizedSymbol)) {
      return normalizedSymbol;
    }
    
    // Map symbol to code
    return CURRENCY_SYMBOLS[symbol] || normalizedSymbol || 'USD';
  }

  /**
   * Parses volume string (e.g., "1.2M" -> 1200000)
   * 
   * @param volumeStr - Volume string with potential suffixes
   * @returns Parsed volume number
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private parseVolumeString(volumeStr: string): number {
    const cleanStr = volumeStr.replace(/[,\s]/g, '').toUpperCase();
    const match = cleanStr.match(/^([0-9.]+)([KMBT])?$/);
    
    if (!match) {
      return 0;
    }
    
    const baseValue = parseFloat(match[1]);
    const multiplier = match[2] ? VOLUME_MULTIPLIERS[match[2]] : 1;
    
    return Math.round(baseValue * multiplier);
  }

  /**
   * Validates extracted quote data
   * 
   * @param quote - Quote data to validate
   * @throws Error if validation fails in strict mode
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private validateQuote(quote: GoogleFinanceQuote): void {
    const errors: string[] = [];
    
    if (!quote.symbol || quote.symbol.length === 0) {
      errors.push('Invalid symbol');
    }
    
    if (!quote.name || quote.name.length === 0) {
      errors.push('Invalid company name');
    }
    
    if (isNaN(quote.price) || quote.price <= 0) {
      errors.push('Invalid price');
    }
    
    if (!quote.currency || quote.currency.length === 0) {
      errors.push('Invalid currency');
    }
    
    if (errors.length > 0) {
      const errorMessage = `Quote validation failed: ${errors.join(', ')}`;
      
      if (this.config.strictMode) {
        throw new Error(errorMessage);
      } else {
        console.warn(errorMessage);
      }
    }
  }

  /**
   * Logs debug messages if debug mode is enabled
   * 
   * @param message - Message to log
   */
  private debugLog(message: string): void {
    if (this.config.debug) {
      console.debug(`[GoogleFinanceParser] ${message}`);
    }
  }

  /**
   * Updates parser configuration
   * 
   * @param newConfig - Configuration updates
   */
  updateConfig(newConfig: Partial<ParserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current parser configuration
   * 
   * @returns Current configuration
   */
  getConfig(): ParserConfig {
    return { ...this.config };
  }
}