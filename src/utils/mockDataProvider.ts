/**
 * Mock Financial Data Provider
 * 
 * Provides realistic mock financial data for development, testing, and fallback scenarios.
 * Includes dynamic price generation, market simulation, and comprehensive symbol coverage.
 * 
 * Features:
 * - Realistic stock and ETF data simulation
 * - Dynamic price movement generation  
 * - Multiple market support (US, UK, EU, Asia)
 * - Configurable market hours simulation
 * - Historical data generation capabilities
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

import type { GoogleFinanceQuote } from '@/services/googleFinanceService';

/**
 * Configuration for mock data generation
 */
export interface MockDataConfig {
  /** Enable realistic price movements */
  enablePriceMovement: boolean;
  /** Volatility factor for price changes (0-1) */
  volatility: number;
  /** Simulate market hours */
  simulateMarketHours: boolean;
  /** Enable random delays */
  enableNetworkDelay: boolean;
  /** Maximum network delay in milliseconds */
  maxDelay: number;
}

/**
 * Base stock information for mock data
 */
interface MockStockInfo {
  name: string;
  basePrice: number;
  currency: string;
  exchange: string;
  sector: string;
  marketCap: string;
  volatility: number;
}

/**
 * Default mock data configuration
 */
const DEFAULT_MOCK_CONFIG: MockDataConfig = {
  enablePriceMovement: true,
  volatility: 0.02, // 2% daily volatility
  simulateMarketHours: true,
  enableNetworkDelay: true,
  maxDelay: 2000,
};

/**
 * Comprehensive mock stock database
 */
const MOCK_STOCKS: Record<string, MockStockInfo> = {
  // US Stocks
  'AAPL': {
    name: 'Apple Inc.',
    basePrice: 189.25,
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    marketCap: '$2.95T',
    volatility: 0.025,
  },
  'MSFT': {
    name: 'Microsoft Corporation',
    basePrice: 378.85,
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    marketCap: '$2.82T',
    volatility: 0.022,
  },
  'GOOGL': {
    name: 'Alphabet Inc. Class A',
    basePrice: 138.75,
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    marketCap: '$1.71T',
    volatility: 0.028,
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    basePrice: 151.94,
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Consumer Discretionary',
    marketCap: '$1.57T',
    volatility: 0.030,
  },
  'TSLA': {
    name: 'Tesla Inc.',
    basePrice: 248.50,
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Automotive',
    marketCap: '$789B',
    volatility: 0.045,
  },
  'NVDA': {
    name: 'NVIDIA Corporation',
    basePrice: 875.28,
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    marketCap: '$2.16T',
    volatility: 0.040,
  },

  // UK ETFs and Stocks
  'CSPX:LON': {
    name: 'iShares Core S&P 500 UCITS ETF',
    basePrice: 645.20,
    currency: 'GBP',
    exchange: 'LSE',
    sector: 'ETF',
    marketCap: '£45.2B',
    volatility: 0.015,
  },
  'VUSA:LON': {
    name: 'Vanguard S&P 500 UCITS ETF',
    basePrice: 97.42,
    currency: 'GBP',
    exchange: 'LSE',
    sector: 'ETF',
    marketCap: '£12.8B',
    volatility: 0.015,
  },
  'VWRL:LON': {
    name: 'Vanguard FTSE All-World UCITS ETF',
    basePrice: 108.86,
    currency: 'GBP',
    exchange: 'LSE',
    sector: 'ETF',
    marketCap: '£8.9B',
    volatility: 0.018,
  },
  'EUNL:LON': {
    name: 'iShares Core MSCI World UCITS ETF',
    basePrice: 82.15,
    currency: 'GBP',
    exchange: 'LSE',
    sector: 'ETF',
    marketCap: '£35.4B',
    volatility: 0.016,
  },

  // European Stocks
  'ASML:AMS': {
    name: 'ASML Holding N.V.',
    basePrice: 712.30,
    currency: 'EUR',
    exchange: 'Euronext',
    sector: 'Technology',
    marketCap: '€290B',
    volatility: 0.035,
  },
  'SAP:ETR': {
    name: 'SAP SE',
    basePrice: 158.44,
    currency: 'EUR',
    exchange: 'XETRA',
    sector: 'Technology',
    marketCap: '€189B',
    volatility: 0.025,
  },

  // Asian Stocks
  'TSM': {
    name: 'Taiwan Semiconductor Manufacturing',
    basePrice: 102.45,
    currency: 'USD',
    exchange: 'NYSE',
    sector: 'Technology',
    marketCap: '$531B',
    volatility: 0.030,
  },
  '7203:TYO': {
    name: 'Toyota Motor Corporation',
    basePrice: 2847,
    currency: 'JPY',
    exchange: 'TSE',
    sector: 'Automotive',
    marketCap: '¥36.2T',
    volatility: 0.020,
  },
};

/**
 * Mock Financial Data Provider
 * 
 * Generates realistic financial data for development and testing scenarios.
 * Simulates market conditions, price movements, and various market states.
 * 
 * Time Complexity: O(1) for data generation
 * Space Complexity: O(1)
 * 
 * @example
 * ```typescript
 * const provider = new MockDataProvider({
 *   enablePriceMovement: true,
 *   volatility: 0.03
 * });
 * 
 * const quote = await provider.getQuote('AAPL');
 * console.log(quote.price, quote.change);
 * ```
 */
export class MockDataProvider {
  private config: MockDataConfig;
  private priceCache: Map<string, number> = new Map();
  private lastUpdateTime: Map<string, number> = new Map();

  /**
   * Creates a new MockDataProvider instance
   * 
   * @param config - Optional configuration for mock data generation
   */
  constructor(config: Partial<MockDataConfig> = {}) {
    this.config = { ...DEFAULT_MOCK_CONFIG, ...config };
    console.debug('MockDataProvider initialized with config:', this.config);
  }

  /**
   * Generates mock quote data for a given symbol
   * 
   * Creates realistic financial data with optional price movement simulation
   * and market condition modeling.
   * 
   * @param symbol - Stock symbol to generate data for
   * @returns Promise resolving to mock quote data
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  async getQuote(symbol: string): Promise<GoogleFinanceQuote> {
    // Simulate network delay if enabled
    if (this.config.enableNetworkDelay) {
      const delay = Math.random() * this.config.maxDelay;
      await this.delay(delay);
    }

    const stockInfo = this.getStockInfo(symbol);
    const currentPrice = this.generateCurrentPrice(symbol, stockInfo);
    const previousClose = this.getPreviousClose(symbol, stockInfo);
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Generate additional market data
    const additionalData = this.generateAdditionalData(stockInfo, currentPrice);

    const quote: GoogleFinanceQuote = {
      symbol,
      name: stockInfo.name,
      price: this.roundPrice(currentPrice),
      currency: stockInfo.currency,
      change: this.roundPrice(change),
      changePercent: this.roundPercent(changePercent),
      previousClose: this.roundPrice(previousClose),
      marketStatus: this.getMarketStatus(stockInfo.exchange),
      timestamp: Date.now(),
      ...additionalData,
    };

    console.debug(`Mock quote generated for ${symbol}:`, {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
    });

    return quote;
  }

  /**
   * Gets stock information for a symbol
   * 
   * @param symbol - Stock symbol
   * @returns Stock information or default data
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private getStockInfo(symbol: string): MockStockInfo {
    return MOCK_STOCKS[symbol] || {
      name: `${symbol} Company`,
      basePrice: 100,
      currency: 'USD',
      exchange: 'NASDAQ',
      sector: 'Unknown',
      marketCap: '$1B',
      volatility: 0.025,
    };
  }

  /**
   * Generates current price with optional movement simulation
   * 
   * @param symbol - Stock symbol
   * @param stockInfo - Stock information
   * @returns Current price
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private generateCurrentPrice(symbol: string, stockInfo: MockStockInfo): number {
    if (!this.config.enablePriceMovement) {
      return stockInfo.basePrice;
    }

    const cachedPrice = this.priceCache.get(symbol);
    const lastUpdate = this.lastUpdateTime.get(symbol) || 0;
    const now = Date.now();

    // Update price if cache is old (older than 5 minutes)
    if (!cachedPrice || (now - lastUpdate) > 300000) {
      const newPrice = this.simulatePriceMovement(symbol, stockInfo);
      this.priceCache.set(symbol, newPrice);
      this.lastUpdateTime.set(symbol, now);
      return newPrice;
    }

    return cachedPrice;
  }

  /**
   * Simulates realistic price movement
   * 
   * @param symbol - Stock symbol
   * @param stockInfo - Stock information
   * @returns New price after movement
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private simulatePriceMovement(symbol: string, stockInfo: MockStockInfo): number {
    const currentPrice = this.priceCache.get(symbol) || stockInfo.basePrice;
    const volatility = stockInfo.volatility * this.config.volatility;
    
    // Generate random price movement using normal distribution approximation
    const randomMovement = (Math.random() - 0.5) * 2; // -1 to 1
    const priceChange = currentPrice * volatility * randomMovement;
    
    // Apply some momentum (trend continuation)
    const momentum = this.getMomentum(symbol);
    const adjustedChange = priceChange + (momentum * priceChange * 0.3);
    
    const newPrice = Math.max(0.01, currentPrice + adjustedChange);
    
    // Store momentum for next calculation
    this.storeMomentum(symbol, adjustedChange > 0 ? 1 : -1);
    
    return newPrice;
  }

  /**
   * Gets momentum factor for a symbol
   * 
   * @param symbol - Stock symbol
   * @returns Momentum factor (-1 to 1)
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private getMomentum(symbol: string): number {
    // Simplified momentum calculation
    const hash = this.hashCode(symbol);
    return (hash % 3) - 1; // -1, 0, or 1
  }

  /**
   * Stores momentum for a symbol (placeholder for more complex implementation)
   * 
   * @param _symbol - Stock symbol (unused in current implementation)
   * @param _momentum - Momentum value (unused in current implementation)
   */
  private storeMomentum(_symbol: string, _momentum: number): void {
    // In a real implementation, this would store momentum data
    // For now, we'll just use a simple hash-based approach
  }

  /**
   * Calculates previous close price
   * 
   * @param symbol - Stock symbol
   * @param stockInfo - Stock information
   * @returns Previous close price
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private getPreviousClose(symbol: string, stockInfo: MockStockInfo): number {
    const currentPrice = this.priceCache.get(symbol) || stockInfo.basePrice;
    const dailyMovement = (Math.random() - 0.5) * stockInfo.volatility * 2;
    return currentPrice / (1 + dailyMovement);
  }

  /**
   * Generates additional market data
   * 
   * @param stockInfo - Stock information
   * @param currentPrice - Current stock price
   * @returns Additional market data
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private generateAdditionalData(
    stockInfo: MockStockInfo, 
    currentPrice: number
  ): Partial<GoogleFinanceQuote> {
    const baseVolume = this.getBaseVolume(stockInfo.sector);
    const volumeVariation = 0.5 + (Math.random() * 1.0); // 0.5x to 1.5x
    
    return {
      volume: Math.round(baseVolume * volumeVariation),
      marketCap: stockInfo.marketCap,
      dayHigh: currentPrice * (1 + Math.random() * 0.02),
      dayLow: currentPrice * (1 - Math.random() * 0.02),
      week52High: currentPrice * (1.1 + Math.random() * 0.3),
      week52Low: currentPrice * (0.7 + Math.random() * 0.2),
    };
  }

  /**
   * Gets base trading volume for a sector
   * 
   * @param sector - Market sector
   * @returns Base volume
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private getBaseVolume(sector: string): number {
    const sectorVolumes: Record<string, number> = {
      'Technology': 25000000,
      'ETF': 5000000,
      'Automotive': 15000000,
      'Consumer Discretionary': 20000000,
      'Unknown': 10000000,
    };
    
    return sectorVolumes[sector] || 10000000;
  }

  /**
   * Determines market status based on exchange and time
   * 
   * @param exchange - Stock exchange
   * @returns Market status
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private getMarketStatus(exchange: string): string {
    if (!this.config.simulateMarketHours) {
      return 'OPEN';
    }

    const now = new Date();
    const hour = now.getUTCHours();
    
    // Simplified market hours (UTC)
    const marketHours: Record<string, { open: number; close: number }> = {
      'NASDAQ': { open: 14, close: 21 }, // 9:30 AM - 4:00 PM EST
      'NYSE': { open: 14, close: 21 },
      'LSE': { open: 8, close: 16 }, // 8:00 AM - 4:30 PM GMT
      'XETRA': { open: 8, close: 17 }, // 9:00 AM - 5:30 PM CET
      'TSE': { open: 0, close: 6 }, // 9:00 AM - 3:00 PM JST
    };
    
    const hours = marketHours[exchange] || marketHours['NASDAQ'];
    
    if (hour >= hours.open && hour < hours.close) {
      return 'OPEN';
    } else if (hour >= hours.close || hour < 6) {
      return 'CLOSED';
    } else {
      return 'PRE_MARKET';
    }
  }

  /**
   * Rounds price to appropriate decimal places
   * 
   * @param price - Price to round
   * @returns Rounded price
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private roundPrice(price: number): number {
    return Math.round(price * 100) / 100;
  }

  /**
   * Rounds percentage to appropriate decimal places
   * 
   * @param percent - Percentage to round
   * @returns Rounded percentage
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private roundPercent(percent: number): number {
    return Math.round(percent * 100) / 100;
  }

  /**
   * Generates a hash code for a string
   * 
   * @param str - String to hash
   * @returns Hash code
   * 
   * Time Complexity: O(n) where n is string length
   * Space Complexity: O(1)
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Delays execution for specified milliseconds
   * 
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Updates mock data configuration
   * 
   * @param newConfig - Configuration updates
   */
  updateConfig(newConfig: Partial<MockDataConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.debug('Mock data configuration updated:', newConfig);
  }

  /**
   * Gets current configuration
   * 
   * @returns Current configuration object
   */
  getConfig(): MockDataConfig {
    return { ...this.config };
  }

  /**
   * Clears price cache (useful for testing)
   */
  clearCache(): void {
    this.priceCache.clear();
    this.lastUpdateTime.clear();
    console.debug('Mock data cache cleared');
  }

  /**
   * Gets list of available mock symbols
   * 
   * @returns Array of available symbols
   */
  getAvailableSymbols(): string[] {
    return Object.keys(MOCK_STOCKS);
  }
}