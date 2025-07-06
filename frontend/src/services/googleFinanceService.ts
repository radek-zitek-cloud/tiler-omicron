/**
 * Google Finance Service - Refactored with Utilities
 * 
 * Main service for fetching financial data from Google Finance, refactored to use
 * dedicated utility modules for better separation of concerns and maintainability.
 * 
 * Refactored Architecture:
 * - NetworkService: Handles HTTP requests and CORS proxying
 * - GoogleFinanceParser: Handles HTML parsing and data extraction
 * - MockDataProvider: Provides fallback mock data
 * - GoogleFinanceService: Orchestrates the above utilities
 * 
 * Features:
 * - Robust data fetching with proxy fallback
 * - Comprehensive HTML parsing
 * - Mock data support for development/testing
 * - Symbol validation and formatting
 * - Error handling and recovery strategies
 * 
 * @author Dashboard System
 * @version 2.0.0 (Refactored)
 */

import { NetworkService, type NetworkConfig } from '@/utils/networkService';
import { GoogleFinanceParser, type ParserConfig } from '@/utils/googleFinanceParser';
import { MockDataProvider, type MockDataConfig } from '@/utils/mockDataProvider';

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
}

/**
 * Configuration for Google Finance Service
 */
export interface GoogleFinanceConfig {
  /** Base URL for Google Finance */
  baseUrl: string;
  /** Enable mock data mode */
  useMockData: boolean;
  /** Enable automatic fallback to mock data */
  enableMockFallback: boolean;
  /** Network configuration */
  network: Partial<NetworkConfig>;
  /** Parser configuration */
  parser: Partial<ParserConfig>;
  /** Mock data configuration */
  mockData: Partial<MockDataConfig>;
}

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: GoogleFinanceConfig = {
  baseUrl: 'https://www.google.com/finance/quote',
  useMockData: false,
  enableMockFallback: true,
  network: {
    useProxy: true,
    timeout: 30000,
    maxRetries: 3,
  },
  parser: {
    debug: false,
    strictMode: false,
  },
  mockData: {
    enablePriceMovement: true,
    volatility: 0.02,
  },
};

/**
 * Google Finance Service - Refactored
 * 
 * Main service class that orchestrates financial data fetching using dedicated
 * utility classes for network requests, HTML parsing, and mock data generation.
 * 
 * Time Complexity: Varies by operation (network O(1), parsing O(n))
 * Space Complexity: O(1) for most operations
 * 
 * @example
 * ```typescript
 * const service = new GoogleFinanceService({
 *   useMockData: false,
 *   enableMockFallback: true
 * });
 * 
 * const quote = await service.getQuote('AAPL:NASDAQ');
 * console.log(`${quote.name}: $${quote.price}`);
 * ```
 */
export class GoogleFinanceService {
  private config: GoogleFinanceConfig;
  private networkService: NetworkService;
  private parser: GoogleFinanceParser;
  private mockProvider: MockDataProvider;

  /**
   * Creates a new GoogleFinanceService instance
   * 
   * @param config - Optional service configuration
   */
  constructor(config: Partial<GoogleFinanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize utility services
    this.networkService = new NetworkService(this.config.network);
    this.parser = new GoogleFinanceParser(this.config.parser);
    this.mockProvider = new MockDataProvider(this.config.mockData);
    
    console.debug('GoogleFinanceService initialized with config:', this.config);
  }

  /**
   * Fetches stock quote from Google Finance or mock data
   * 
   * Main entry point for getting financial data. Handles both live data
   * fetching and mock data generation based on configuration.
   * 
   * @param symbol - Stock symbol with exchange (e.g., "CSPX:LON", "AAPL:NASDAQ")
   * @returns Promise resolving to stock quote data
   * @throws Error if all data sources fail
   * 
   * Time Complexity: O(n) where n is HTML content size for parsing
   * Space Complexity: O(1)
   * 
   * @example
   * ```typescript
   * const quote = await service.getQuote('AAPL');
   * console.log(`Price: $${quote.price}, Change: ${quote.changePercent}%`);
   * ```
   */
  async getQuote(symbol: string): Promise<GoogleFinanceQuote> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    
    console.debug(`Fetching quote for symbol: ${normalizedSymbol}`);
    
    // Use mock data if configured
    if (this.config.useMockData) {
      console.debug('Using mock data mode');
      return this.mockProvider.getQuote(normalizedSymbol);
    }

    try {
      // Attempt to fetch live data
      return await this.fetchLiveQuote(normalizedSymbol);
    } catch (error) {
      console.warn(`Live data fetch failed for ${normalizedSymbol}:`, error);
      
      // Fallback to mock data if enabled
      if (this.config.enableMockFallback) {
        console.debug('Falling back to mock data');
        return this.mockProvider.getQuote(normalizedSymbol);
      }
      
      throw new Error(`Failed to fetch quote for ${normalizedSymbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Fetches live quote data from Google Finance
   * 
   * Handles the complete process of fetching and parsing live financial data
   * from Google Finance using the network and parser utilities.
   * 
   * @param symbol - Normalized stock symbol
   * @returns Promise resolving to live quote data
   * 
   * Time Complexity: O(n) where n is HTML content size
   * Space Complexity: O(1)
   */
  private async fetchLiveQuote(symbol: string): Promise<GoogleFinanceQuote> {
    // Validate symbol format
    if (!this.isValidSymbol(symbol)) {
      throw new Error(`Invalid symbol format: ${symbol}. Expected format: SYMBOL:EXCHANGE or SYMBOL`);
    }

    // Construct Google Finance URL
    const url = `${this.config.baseUrl}/${encodeURIComponent(symbol)}`;
    console.debug(`Fetching from URL: ${url}`);

    try {
      // Fetch HTML content using network service
      const networkResult = await this.networkService.fetchContent(url);
      console.debug(`Content fetched successfully (${networkResult.content.length} chars, proxy: ${networkResult.usedProxy})`);

      // Parse HTML content using parser
      const quote = this.parser.parseHTML(networkResult.content, symbol);
      console.debug(`Quote parsed successfully: ${quote.name} = ${quote.currency}${quote.price}`);

      return quote;
    } catch (error) {
      console.error(`Failed to fetch live quote for ${symbol}:`, error);
      throw this.enhanceError(error as Error, symbol);
    }
  }

  /**
   * Normalizes symbol format for consistency
   * 
   * Ensures symbols are in a consistent format and adds default exchange
   * if not specified.
   * 
   * @param symbol - Input symbol
   * @returns Normalized symbol
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private normalizeSymbol(symbol: string): string {
    const cleaned = symbol.trim().toUpperCase();
    
    // Add default exchange if not specified
    if (!cleaned.includes(':')) {
      // Default to NASDAQ for US stocks
      return `${cleaned}:NASDAQ`;
    }
    
    return cleaned;
  }

  /**
   * Validates symbol format
   * 
   * Checks if the symbol follows expected patterns for Google Finance.
   * 
   * @param symbol - Symbol to validate
   * @returns True if symbol format is valid
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private isValidSymbol(symbol: string): boolean {
    // Allow various symbol formats
    const symbolPatterns = [
      /^[A-Z]{1,6}:[A-Z]{2,10}$/, // SYMBOL:EXCHANGE
      /^[A-Z]{1,6}$/, // SYMBOL only
      /^[A-Z0-9]{1,8}:[A-Z]{2,10}$/, // Alphanumeric symbol with exchange
    ];
    
    return symbolPatterns.some(pattern => pattern.test(symbol));
  }

  /**
   * Enhances error messages with context and suggestions
   * 
   * @param error - Original error
   * @param symbol - Symbol that caused the error
   * @returns Enhanced error with better messaging
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private enhanceError(error: Error, symbol: string): Error {
    const message = error.message.toLowerCase();
    
    if (message.includes('cors') || message.includes('proxy')) {
      return new Error(`CORS/Network error when fetching ${symbol}. Consider enabling mock data or trying a different proxy.`);
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return new Error(`Symbol ${symbol} not found on Google Finance. Please check the symbol format.`);
    }
    
    if (message.includes('timeout')) {
      return new Error(`Timeout while fetching ${symbol}. Please try again or enable mock data.`);
    }
    
    if (message.includes('blocked') || message.includes('rate limit')) {
      return new Error(`Request blocked by Google Finance. Try again later or enable mock data.`);
    }
    
    if (message.includes('parse') || message.includes('extract')) {
      return new Error(`Failed to parse data for ${symbol}. The page format may have changed.`);
    }
    
    return new Error(`Failed to fetch quote for ${symbol}: ${error.message}`);
  }

  /**
   * Gets mock data for testing purposes
   * 
   * Convenience method for explicitly getting mock data regardless of configuration.
   * 
   * @param symbol - Stock symbol
   * @returns Promise resolving to mock quote data
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  async getMockQuote(symbol: string): Promise<GoogleFinanceQuote> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    return this.mockProvider.getQuote(normalizedSymbol);
  }

  /**
   * Gets list of available mock symbols
   * 
   * @returns Array of available mock symbols
   */
  getAvailableMockSymbols(): string[] {
    return this.mockProvider.getAvailableSymbols();
  }

  /**
   * Tests network connectivity and service health
   * 
   * Performs a test request to verify the service is working correctly.
   * 
   * @returns Promise resolving to health check results
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  async healthCheck(): Promise<{
    network: boolean;
    parser: boolean;
    mockData: boolean;
    overall: boolean;
  }> {
    const results = {
      network: false,
      parser: false,
      mockData: false,
      overall: false,
    };

    try {
      // Test network connectivity with a simple request
      await this.networkService.fetchContent('https://httpbin.org/status/200');
      results.network = true;
    } catch (error) {
      console.warn('Network health check failed:', error);
    }

    try {
      // Test parser with sample HTML
      const sampleHtml = '<div data-last-price="100.50">Test</div>';
      this.parser.parseHTML(sampleHtml, 'TEST');
      results.parser = true;
    } catch (error) {
      console.warn('Parser health check failed:', error);
    }

    try {
      // Test mock data provider
      await this.mockProvider.getQuote('AAPL');
      results.mockData = true;
    } catch (error) {
      console.warn('Mock data health check failed:', error);
    }

    results.overall = results.network && results.parser && results.mockData;
    
    console.debug('Health check results:', results);
    return results;
  }

  /**
   * Updates service configuration
   * 
   * @param newConfig - Configuration updates to apply
   */
  updateConfig(newConfig: Partial<GoogleFinanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update utility configurations
    if (newConfig.network) {
      this.networkService.updateConfig(newConfig.network);
    }
    
    if (newConfig.parser) {
      this.parser.updateConfig(newConfig.parser);
    }
    
    if (newConfig.mockData) {
      this.mockProvider.updateConfig(newConfig.mockData);
    }
    
    console.debug('Service configuration updated:', newConfig);
  }

  /**
   * Gets current service configuration
   * 
   * @returns Current configuration object
   */
  getConfig(): GoogleFinanceConfig {
    return { ...this.config };
  }

  /**
   * Gets service statistics and health information
   * 
   * @returns Object containing service statistics
   */
  getStats(): {
    config: GoogleFinanceConfig;
    network: ReturnType<NetworkService['getStats']>;
    mockSymbols: number;
    lastUpdate: number;
  } {
    return {
      config: this.getConfig(),
      network: this.networkService.getStats(),
      mockSymbols: this.mockProvider.getAvailableSymbols().length,
      lastUpdate: Date.now(),
    };
  }
}