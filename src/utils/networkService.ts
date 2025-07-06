/**
 * Network Utility for HTTP Requests with CORS Handling
 * 
 * Provides robust HTTP request functionality with automatic CORS proxy
 * handling, retry logic, and comprehensive error management for web scraping.
 * 
 * Features:
 * - Multiple CORS proxy fallback support
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - User agent randomization
 * - Error classification and handling
 * 
 * @author Dashboard System
 * @version 1.0.0
 */

/**
 * Configuration for network requests
 */
export interface NetworkConfig {
  /** Use CORS proxy for requests */
  useProxy: boolean;
  /** Primary CORS proxy URL */
  proxyUrl: string;
  /** Fallback proxy URLs */
  fallbackProxies: string[];
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Custom headers to include */
  headers: Record<string, string>;
  /** User agent strings for rotation */
  userAgents: string[];
}

/**
 * Network request result interface
 */
export interface NetworkResult {
  /** Response text content */
  content: string;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Final URL after redirects */
  finalUrl: string;
  /** Whether proxy was used */
  usedProxy: boolean;
}

/**
 * Default network configuration
 */
const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  useProxy: true,
  proxyUrl: 'https://api.allorigins.win/raw?url=',
  fallbackProxies: [
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest=',
  ],
  timeout: 30000,
  maxRetries: 3,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
  ],
};

/**
 * Network utility class for HTTP requests with CORS handling
 * 
 * Provides robust network functionality for web scraping scenarios where
 * CORS restrictions need to be bypassed using proxy services.
 * 
 * Time Complexity: O(1) for configuration, O(n) for retry operations
 * Space Complexity: O(1)
 * 
 * @example
 * ```typescript
 * const network = new NetworkService({
 *   useProxy: true,
 *   timeout: 15000
 * });
 * 
 * const result = await network.fetchContent('https://example.com');
 * console.log(result.content);
 * ```
 */
export class NetworkService {
  private config: NetworkConfig;

  /**
   * Creates a new NetworkService instance
   * 
   * @param config - Optional configuration overrides
   */
  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
    console.debug('NetworkService initialized with config:', this.config);
  }

  /**
   * Fetches content from a URL with CORS proxy support
   * 
   * Attempts to fetch content using configured proxy services with automatic
   * fallback and retry logic. Handles various network errors gracefully.
   * 
   * @param url - Target URL to fetch
   * @param options - Additional fetch options
   * @returns Promise resolving to network result
   * 
   * Time Complexity: O(n*m) where n is retry attempts, m is proxy count
   * Space Complexity: O(1)
   */
  async fetchContent(
    url: string, 
    options: RequestInit = {}
  ): Promise<NetworkResult> {
    const startTime = Date.now();
    console.debug(`Fetching content from: ${url}`);

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    let lastError: Error | null = null;
    
    // Try direct request first if proxy is disabled
    if (!this.config.useProxy) {
      try {
        return await this.attemptDirectRequest(url, options);
      } catch (error) {
        console.warn('Direct request failed, falling back to proxy:', error);
        // Fall through to proxy attempts
      }
    }

    // Try each proxy in sequence
    const allProxies = [this.config.proxyUrl, ...this.config.fallbackProxies];
    
    for (let proxyIndex = 0; proxyIndex < allProxies.length; proxyIndex++) {
      const proxy = allProxies[proxyIndex];
      
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          console.debug(`Attempt ${attempt}/${this.config.maxRetries} using proxy ${proxyIndex + 1}/${allProxies.length}`);
          
          const result = await this.attemptProxyRequest(url, proxy, options, attempt);
          
          const duration = Date.now() - startTime;
          console.debug(`Request successful after ${duration}ms using proxy: ${proxy}`);
          
          return result;
        } catch (error) {
          lastError = error as Error;
          console.warn(`Proxy attempt failed (${proxy}, attempt ${attempt}):`, error);
          
          // Wait before retry (exponential backoff)
          if (attempt < this.config.maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await this.delay(delay);
          }
        }
      }
    }

    // All attempts failed
    const duration = Date.now() - startTime;
    const errorMessage = `All network attempts failed after ${duration}ms. Last error: ${lastError?.message || 'Unknown error'}`;
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Attempts a direct request without proxy
   * 
   * @param url - Target URL
   * @param options - Fetch options
   * @returns Promise resolving to network result
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private async attemptDirectRequest(
    url: string, 
    options: RequestInit
  ): Promise<NetworkResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers = this.buildHeaders();
      
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      
      return {
        content,
        status: response.status,
        headers: response.headers,
        finalUrl: response.url,
        usedProxy: false,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }
        throw new Error(`Direct request failed: ${error.message}`);
      }
      
      throw new Error('Direct request failed with unknown error');
    }
  }

  /**
   * Attempts a request through a CORS proxy
   * 
   * @param url - Target URL
   * @param proxy - Proxy URL to use
   * @param options - Fetch options
   * @param attempt - Current attempt number
   * @returns Promise resolving to network result
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private async attemptProxyRequest(
    url: string,
    proxy: string,
    options: RequestInit,
    attempt: number
  ): Promise<NetworkResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const headers = this.buildHeaders(attempt);
      
      const response = await fetch(proxyUrl, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Proxy HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      
      // Validate content is not a proxy error page
      if (this.isProxyErrorResponse(content)) {
        throw new Error('Proxy returned error page');
      }
      
      return {
        content,
        status: response.status,
        headers: response.headers,
        finalUrl: proxyUrl,
        usedProxy: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Proxy request timeout after ${this.config.timeout}ms`);
        }
        throw new Error(`Proxy request failed: ${error.message}`);
      }
      
      throw new Error('Proxy request failed with unknown error');
    }
  }

  /**
   * Builds HTTP headers for requests
   * 
   * Includes user agent rotation and standard headers for web scraping.
   * 
   * @param attempt - Current attempt number for user agent rotation
   * @returns Headers object
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private buildHeaders(attempt: number = 1): Record<string, string> {
    const userAgentIndex = (attempt - 1) % this.config.userAgents.length;
    const userAgent = this.config.userAgents[userAgentIndex];
    
    return {
      ...this.config.headers,
      'User-Agent': userAgent,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
  }

  /**
   * Validates URL format
   * 
   * @param url - URL to validate
   * @returns True if URL is valid
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if response content indicates a proxy error
   * 
   * @param content - Response content to check
   * @returns True if content appears to be a proxy error
   * 
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private isProxyErrorResponse(content: string): boolean {
    const errorIndicators = [
      'proxy error',
      'cors error',
      'access denied',
      'rate limit',
      'too many requests',
      '<!DOCTYPE html>', // Unexpected HTML when expecting data
    ];
    
    const lowerContent = content.toLowerCase();
    return errorIndicators.some(indicator => lowerContent.includes(indicator));
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
   * Updates network configuration
   * 
   * @param newConfig - Configuration updates to apply
   */
  updateConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.debug('Network configuration updated:', newConfig);
  }

  /**
   * Gets current network configuration
   * 
   * @returns Current configuration object
   */
  getConfig(): NetworkConfig {
    return { ...this.config };
  }

  /**
   * Gets network health statistics
   * 
   * @returns Object containing network statistics
   */
  getStats(): {
    proxyCount: number;
    timeout: number;
    maxRetries: number;
    userAgentCount: number;
  } {
    return {
      proxyCount: this.config.fallbackProxies.length + 1,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      userAgentCount: this.config.userAgents.length,
    };
  }
}