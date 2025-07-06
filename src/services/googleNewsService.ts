/**
 * Google News Service
 *
 * Provides functionality to fetch news articles from Google News using web scraping.
 * Handles CORS issues through proxy services and transforms HTML content into
 * structured news data.
 *
 * Features:
 * - Topic-based news fetching (business, technology, health, etc.)
 * - Search query support for specific news topics
 * - Multiple CORS proxy fallback system
 * - Comprehensive error handling
 * - Mock data for development and testing
 *
 * @author Copilot
 * @version 1.0.0
 */

/**
 * Interface for a single news article
 *
 * @interface NewsArticle
 */
export interface NewsArticle {
  /** Article headline/title */
  title: string;
  /** Brief description or snippet */
  description: string;
  /** URL to the full article */
  url: string;
  /** Publication source (e.g., "CNN", "BBC") */
  source: string;
  /** Publication timestamp in milliseconds */
  publishedAt: number;
  /** URL to article image (optional) */
  imageUrl?: string;
  /** Category/topic of the article */
  category?: string;
}

/**
 * Response interface for news fetch operations
 *
 * @interface NewsResponse
 */
export interface NewsResponse {
  /** Array of news articles */
  articles: NewsArticle[];
  /** Total number of articles available */
  totalResults: number;
  /** Query or topic used for fetching */
  query: string;
  /** Timestamp when data was fetched */
  timestamp: number;
  /** Source of the data (e.g., "Google News") */
  source: string;
}

/**
 * Configuration for news fetching
 *
 * @interface NewsConfig
 */
export interface NewsConfig {
  /** Topic or search query */
  query: string;
  /** Number of articles to fetch (default: 10, max: 20) */
  limit?: number;
  /** Language code (default: 'en') */
  language?: string;
  /** Country code (default: 'US') */
  country?: string;
  /** Time period for news (e.g., '1d', '7d', '30d') */
  period?: string;
}

/**
 * CORS proxy services for browser compatibility
 * Ordered by reliability and response time
 */
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
] as const;

/**
 * Base URL for Google News RSS feeds
 */
const GOOGLE_NEWS_BASE_URL = 'https://news.google.com/rss';

/**
 * Popular news topics/categories available on Google News
 */
export const NEWS_TOPICS = {
  top: 'Top Stories',
  world: 'World',
  nation: 'U.S.',
  business: 'Business',
  technology: 'Technology',
  entertainment: 'Entertainment',
  sports: 'Sports',
  science: 'Science',
  health: 'Health',
} as const;

/**
 * Type for news topic keys
 */
export type NewsTopic = keyof typeof NEWS_TOPICS;

/**
 * Google News Service Class
 *
 * Handles fetching and parsing news from Google News RSS feeds
 * with comprehensive error handling and CORS proxy support.
 */
class GoogleNewsService {
  /**
   * Fetches news articles based on configuration
   *
   * @param config - News fetching configuration
   * @returns Promise resolving to news response
   * @throws {Error} When news fetching fails
   *
   * @example
   * ```typescript
   * const news = await googleNewsService.getNews({
   *   query: 'technology',
   *   limit: 5,
   *   language: 'en'
   * });
   * ```
   */
  async getNews(config: NewsConfig): Promise<NewsResponse> {
    const { query, limit = 10, language = 'en', country = 'US' } = config;

    console.log(`Fetching news for query: "${query}" (limit: ${limit})`);

    try {
      // Build Google News RSS URL
      const newsUrl = this.buildNewsUrl(query, language, country);
      console.log(`Google News URL: ${newsUrl}`);

      // Fetch RSS content with CORS proxy fallback
      const rssContent = await this.fetchWithProxyFallback(newsUrl);

      // Parse RSS XML to extract articles
      const articles = this.parseRssContent(rssContent, limit);

      const response: NewsResponse = {
        articles,
        totalResults: articles.length,
        query,
        timestamp: Date.now(),
        source: 'Google News',
      };

      console.log(`Successfully fetched ${articles.length} news articles`);
      return response;

    } catch (error) {
      console.error('Failed to fetch news:', error);

      // Return mock data for development/testing
      if (query.toLowerCase().includes('technology')) {
        console.log('Using mock technology news data');
        return this.getMockNewsResponse(query);
      }

      throw error;
    }
  }

  /**
   * Fetches news for a specific predefined topic
   *
   * @param topic - News topic from NEWS_TOPICS
   * @param limit - Number of articles to fetch
   * @returns Promise resolving to news response
   *
   * @example
   * ```typescript
   * const businessNews = await googleNewsService.getTopicNews('business', 8);
   * ```
   */
  async getTopicNews(topic: NewsTopic, limit = 10): Promise<NewsResponse> {
    return this.getNews({
      query: topic,
      limit,
    });
  }

  /**
   * Builds Google News RSS URL based on parameters
   *
   * @param query - Search query or topic
   * @param language - Language code
   * @param country - Country code
   * @returns Formatted Google News RSS URL
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private buildNewsUrl(query: string, language: string, country: string): string {
    // Check if it's a predefined topic
    const isTopicSearch = query in NEWS_TOPICS;

    if (isTopicSearch) {
      // Use topic-specific RSS feed
      return `${GOOGLE_NEWS_BASE_URL}/headlines/section/topic/${query.toUpperCase()}?hl=${language}&gl=${country}&ceid=${country}:${language}`;
    } else {
      // Use search query RSS feed
      const encodedQuery = encodeURIComponent(query);
      return `${GOOGLE_NEWS_BASE_URL}/search?q=${encodedQuery}&hl=${language}&gl=${country}&ceid=${country}:${language}`;
    }
  }

  /**
   * Fetches content with CORS proxy fallback system
   * Tries each proxy in sequence until one succeeds
   *
   * @param url - Target URL to fetch
   * @returns Promise resolving to response text
   * @throws {Error} When all proxies fail
   *
   * Time Complexity: O(n) where n is number of proxies
   * Space Complexity: O(1)
   */
  private async fetchWithProxyFallback(url: string): Promise<string> {
    let lastError: Error | null = null;

    // Try each CORS proxy in sequence
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;

      try {
        console.log(`Attempting proxy ${i + 1}/${CORS_PROXIES.length}: ${proxy}`);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)',
          },
          // Set reasonable timeout
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();

        if (!content || content.length < 100) {
          throw new Error('Empty or invalid RSS content received');
        }

        console.log(`✓ Proxy ${i + 1} successful, content length: ${content.length}`);
        return content;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`✗ Proxy ${i + 1} failed: ${errorMsg}`);
        lastError = error instanceof Error ? error : new Error(errorMsg);

        // Continue to next proxy
        continue;
      }
    }

    // All proxies failed
    const errorMessage = `All CORS proxies failed. Last error: ${lastError?.message || 'Unknown'}`;
    throw new Error(errorMessage);
  }

  /**
   * Parses RSS XML content to extract news articles
   *
   * @param rssContent - Raw RSS XML content
   * @param limit - Maximum number of articles to extract
   * @returns Array of parsed news articles
   *
   * Time Complexity: O(n) where n is number of items in RSS
   * Space Complexity: O(n)
   */
  private parseRssContent(rssContent: string, limit: number): NewsArticle[] {
    const articles: NewsArticle[] = [];

    try {
      // Parse XML using DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rssContent, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Failed to parse RSS XML');
      }

      // Extract items from RSS
      const items = xmlDoc.querySelectorAll('item');
      const maxItems = Math.min(items.length, limit);

      for (let i = 0; i < maxItems; i++) {
        const item = items[i];

        try {
          const article = this.parseRssItem(item);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          console.warn(`Failed to parse RSS item ${i + 1}:`, error);
          // Continue with next item
        }
      }

      console.log(`Parsed ${articles.length} articles from RSS feed`);
      return articles;

    } catch (error) {
      console.error('RSS parsing error:', error);
      throw new Error(`Failed to parse RSS content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parses a single RSS item element into a NewsArticle
   *
   * @param item - RSS item element
   * @returns Parsed NewsArticle or null if parsing fails
   *
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private parseRssItem(item: Element): NewsArticle | null {
    // Extract basic fields
    const title = item.querySelector('title')?.textContent?.trim();
    const description = item.querySelector('description')?.textContent?.trim();
    const link = item.querySelector('link')?.textContent?.trim();
    const pubDate = item.querySelector('pubDate')?.textContent?.trim();

    if (!title || !link) {
      return null; // Invalid item
    }

    // Parse publication date
    let publishedAt = Date.now();
    if (pubDate) {
      const parsedDate = new Date(pubDate);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.getTime();
      }
    }

    // Extract source from description or link
    const source = this.extractSource(description || '', link);

    // Clean description (remove HTML tags and source attribution)
    const cleanDescription = this.cleanDescription(description || '');

    return {
      title: this.cleanTitle(title),
      description: cleanDescription,
      url: link,
      source,
      publishedAt,
      category: 'news', // Default category
    };
  }

  /**
   * Extracts news source from description or URL
   *
   * @param description - Article description
   * @param url - Article URL
   * @returns Source name
   */
  private extractSource(description: string, url: string): string {
    // Try to extract from description (Google News often includes source)
    const sourceMatch = description.match(/^([^-]+)\s*-/);
    if (sourceMatch) {
      return sourceMatch[1].trim();
    }

    // Extract from URL domain
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');

      // Map common domains to readable names
      const domainMap: Record<string, string> = {
        'cnn.com': 'CNN',
        'bbc.com': 'BBC',
        'reuters.com': 'Reuters',
        'bloomberg.com': 'Bloomberg',
        'wsj.com': 'Wall Street Journal',
        'nytimes.com': 'New York Times',
        'washingtonpost.com': 'Washington Post',
        'techcrunch.com': 'TechCrunch',
        'theverge.com': 'The Verge',
        'engadget.com': 'Engadget',
      };

      return domainMap[domain] || domain;
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Cleans article title by removing extra formatting
   *
   * @param title - Raw title
   * @returns Cleaned title
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\s*-\s*/, '') // Remove leading dash
      .trim();
  }

  /**
   * Cleans article description by removing HTML and extra content
   *
   * @param description - Raw description
   * @returns Cleaned description
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/^\s*[^-]+-\s*/, '') // Remove source prefix
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 200) // Limit length
      + (description.length > 200 ? '...' : '');
  }

  /**
   * Provides mock news data for development and testing
   *
   * @param query - Search query for context
   * @returns Mock news response
   */
  private getMockNewsResponse(query: string): NewsResponse {
    const mockArticles: NewsArticle[] = [
      {
        title: 'Apple Unveils Revolutionary AI-Powered MacBook Pro',
        description: 'Apple announces new MacBook Pro with custom AI chips, promising breakthrough performance for machine learning workloads and creative applications.',
        url: 'https://example.com/apple-ai-macbook',
        source: 'TechCrunch',
        publishedAt: Date.now() - 3600000, // 1 hour ago
        category: 'technology',
      },
      {
        title: 'Google Releases Open Source Large Language Model',
        description: 'Google open sources its latest language model, enabling developers worldwide to build advanced AI applications with state-of-the-art capabilities.',
        url: 'https://example.com/google-llm-open-source',
        source: 'The Verge',
        publishedAt: Date.now() - 7200000, // 2 hours ago
        category: 'technology',
      },
      {
        title: 'Microsoft Azure AI Services Reach 100M Users',
        description: 'Microsoft announces that Azure AI services have reached 100 million active users, highlighting the growing adoption of cloud-based artificial intelligence.',
        url: 'https://example.com/microsoft-azure-ai-milestone',
        source: 'Reuters',
        publishedAt: Date.now() - 10800000, // 3 hours ago
        category: 'technology',
      },
      {
        title: 'Quantum Computing Breakthrough in Error Correction',
        description: 'Researchers achieve major breakthrough in quantum error correction, bringing practical quantum computers closer to reality for enterprise applications.',
        url: 'https://example.com/quantum-computing-breakthrough',
        source: 'MIT Technology Review',
        publishedAt: Date.now() - 14400000, // 4 hours ago
        category: 'science',
      },
      {
        title: 'SpaceX Successfully Launches Starship Mission',
        description: 'SpaceX completes another successful Starship test flight, marking significant progress toward Mars exploration and commercial space travel goals.',
        url: 'https://example.com/spacex-starship-success',
        source: 'Space News',
        publishedAt: Date.now() - 18000000, // 5 hours ago
        category: 'science',
      },
    ];

    return {
      articles: mockArticles,
      totalResults: mockArticles.length,
      query,
      timestamp: Date.now(),
      source: 'Mock Data',
    };
  }
}

// Export singleton instance
export const googleNewsService = new GoogleNewsService();
