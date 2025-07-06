# News Tile Content Documentation

## Overview

The News Tile Content feature provides a comprehensive news feed component for the Tiler dashboard application. It fetches and displays the latest news articles from Google News with support for various topics, search queries, and customizable display options.

## Features

### Core Functionality
- **Google News Integration**: Fetches news from Google News RSS feeds
- **Topic-Based News**: Support for predefined topics (technology, business, world, etc.)
- **Custom Search**: Ability to search for specific news topics or keywords
- **Auto-Refresh**: Configurable automatic news updates
- **Responsive Display**: Adapts to different tile sizes with optimal article count

### Display Options
- **Compact View**: Space-saving layout for smaller tiles
- **Article Images**: Optional image display (when available)
- **Source Attribution**: Display news source and publication time
- **Interactive Articles**: Click to open full articles in new tab
- **Load More**: Progressive loading of additional articles

## Configuration

### Basic Configuration

```typescript
{
  type: 'news',
  displayName: 'Technology News',
  query: 'technology',
  articleCount: 5,
  autoRefresh: true,
  refreshInterval: 300, // 5 minutes
}
```

### Advanced Configuration

```typescript
{
  type: 'news',
  displayName: 'Custom News Feed',
  query: 'artificial intelligence',
  articleCount: 8,
  language: 'en',
  country: 'US',
  autoRefresh: true,
  refreshInterval: 180, // 3 minutes
  displayOptions: {
    showImages: false,
    showSource: true,
    showTimestamp: true,
    compactView: false,
  },
}
```

## Configuration Options

### Required Fields
- **`query`**: News topic or search query (string)

### Optional Fields

#### Basic Options
- **`articleCount`**: Number of articles to display (1-10, default: 5)
- **`language`**: Language code for news (default: 'en')
- **`country`**: Country code for localized news (default: 'US')
- **`autoRefresh`**: Enable automatic refresh (default: true)
- **`refreshInterval`**: Refresh interval in seconds (default: 300)

#### Display Options
- **`showImages`**: Display article images when available (default: false)
- **`showSource`**: Show news source attribution (default: true)
- **`showTimestamp`**: Display publication timestamps (default: true)
- **`compactView`**: Use space-saving compact layout (default: false)

## Supported News Topics

### Predefined Topics
The following topics have dedicated Google News RSS feeds:

- **`top`**: Top Stories
- **`world`**: World News
- **`nation`**: U.S. National News
- **`business`**: Business & Finance
- **`technology`**: Technology News
- **`entertainment`**: Entertainment News
- **`sports`**: Sports News
- **`science`**: Science News
- **`health`**: Health News

### Custom Search Queries
Any search term can be used as a query:
- `"artificial intelligence"`
- `"climate change"`
- `"electric vehicles"`
- `"space exploration"`
- `"cryptocurrency"`

## Usage Examples

### Technology News Tile
```typescript
{
  type: 'news',
  displayName: 'Tech News',
  query: 'technology',
  articleCount: 6,
  displayOptions: {
    showSource: true,
    showTimestamp: true,
    compactView: false,
  },
}
```

### Business News (Compact)
```typescript
{
  type: 'news',
  displayName: 'Business Headlines',
  query: 'business',
  articleCount: 8,
  displayOptions: {
    showSource: true,
    showTimestamp: false,
    compactView: true,
  },
}
```

### Custom Search Query
```typescript
{
  type: 'news',
  displayName: 'AI News',
  query: 'artificial intelligence',
  articleCount: 5,
  refreshInterval: 600, // 10 minutes
  displayOptions: {
    showImages: false,
    showSource: true,
    showTimestamp: true,
  },
}
```

## Technical Implementation

### Service Architecture

#### GoogleNewsService
- **Location**: `src/services/googleNewsService.ts`
- **Purpose**: Handles Google News RSS feed fetching and parsing
- **Features**: CORS proxy fallback, error handling, mock data

#### Key Methods
```typescript
// Fetch news by query
await googleNewsService.getNews({
  query: 'technology',
  limit: 5,
  language: 'en',
  country: 'US'
});

// Fetch predefined topic news
await googleNewsService.getTopicNews('business', 8);
```

### Component Architecture

#### NewsContent.vue
- **Location**: `src/components/tile-content/NewsContent.vue`
- **Purpose**: Vue component for displaying news articles
- **Features**: Responsive layout, auto-refresh, error handling

#### Key Features
- **Adaptive Display**: Adjusts article count based on tile size
- **Progressive Loading**: "Show More" functionality for additional articles
- **Error Handling**: Comprehensive error states with retry functionality
- **Auto-Refresh**: Configurable automatic content updates

### Data Flow

1. **Configuration**: News tile configured in dashboard with query and options
2. **Service Call**: NewsContent component calls GoogleNewsService
3. **RSS Fetching**: Service fetches Google News RSS with CORS proxy fallback
4. **Parsing**: Raw RSS XML parsed into structured article data
5. **Display**: Articles rendered with responsive layout and formatting
6. **Auto-Refresh**: Periodic updates based on configuration

## CORS and Proxy System

### Challenge
Google News RSS feeds require CORS handling for browser-based access.

### Solution
Multi-tier proxy fallback system:

```typescript
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
];
```

### Fallback Strategy
1. Attempt proxy 1
2. If failed, attempt proxy 2
3. If failed, attempt proxy 3
4. If all fail, use mock data (development only)

## Error Handling

### Network Errors
- **CORS Issues**: Automatic proxy fallback
- **Timeout**: Retry with user notification
- **Proxy Failures**: Sequential proxy attempts
- **Rate Limiting**: Graceful degradation with user feedback

### Data Errors
- **Invalid RSS**: XML parsing error handling
- **Empty Results**: User-friendly "no results" state
- **Malformed Articles**: Skip invalid items, continue processing

### User Experience
- **Loading States**: Visual feedback during fetch operations
- **Error Messages**: Clear, actionable error descriptions
- **Retry Functionality**: Manual retry buttons for failed requests
- **Mock Data**: Development fallback for testing

## Performance Considerations

### Optimization Features
- **Lazy Loading**: Articles loaded progressively
- **Adaptive Count**: Article limit based on tile size
- **Caching**: Browser-level RSS response caching
- **Debounced Refresh**: Prevents excessive API calls

### Resource Management
- **Memory Efficient**: Limit displayed articles to prevent memory bloat
- **Network Aware**: Reasonable timeouts and retry limits
- **CPU Optimized**: Efficient RSS parsing with minimal DOM manipulation

## Responsive Design

### Tile Size Adaptation
- **Small Tiles**: Compact view with 2-3 articles
- **Medium Tiles**: Standard view with 4-6 articles
- **Large Tiles**: Extended view with 6-10 articles

### Mobile Compatibility
- **Touch Friendly**: Adequate tap targets for mobile devices
- **Readable Text**: Appropriate font sizes for all screen sizes
- **Efficient Layout**: Optimized for narrow screens

## Accessibility

### Screen Reader Support
- **Semantic HTML**: Proper article structure with headings
- **ARIA Labels**: Descriptive labels for interactive elements
- **Focus Management**: Keyboard navigation support

### Visual Accessibility
- **Color Contrast**: High contrast text and backgrounds
- **Scalable Text**: Respects user font size preferences
- **Clear Hierarchy**: Visual structure matches semantic structure

## Testing and Development

### Mock Data
Development fallback data available for testing:
- Technology news articles
- Realistic publication times
- Varied sources and content lengths

### Testing Queries
Recommended test queries:
- `technology` - High volume, reliable results
- `business` - Consistent corporate news
- `invalid_query` - Test error handling

### Debug Features
- **Console Logging**: Detailed fetch and parsing logs
- **Error Visualization**: Clear error states in UI
- **Performance Metrics**: Response time tracking

## Troubleshooting

### Common Issues

#### 1. No Articles Loading
**Symptoms**: Loading spinner never resolves
**Causes**: 
- All CORS proxies blocked
- Invalid news query
- Network connectivity issues

**Solutions**:
- Check browser console for network errors
- Verify query is valid search term
- Try different network connection

#### 2. Articles Not Refreshing
**Symptoms**: Stale content despite auto-refresh enabled
**Causes**:
- Auto-refresh disabled in configuration
- Browser tab not active (some browsers pause timers)
- Service errors preventing updates

**Solutions**:
- Verify `autoRefresh: true` in configuration
- Check `refreshInterval` is reasonable (>= 60 seconds)
- Manually refresh to test service connectivity

#### 3. Layout Issues
**Symptoms**: Articles overlapping or cut off
**Causes**:
- Tile too small for content
- CSS conflicts with global styles
- Browser compatibility issues

**Solutions**:
- Increase tile size or enable compact view
- Check for CSS specificity conflicts
- Test in different browsers

### Browser Compatibility
- **Chrome**: Full support, optimal performance
- **Firefox**: Full support with minor styling differences
- **Safari**: Supported, may have CORS proxy limitations
- **Edge**: Full support, equivalent to Chrome

### Network Requirements
- **Internet Connection**: Required for live news fetching
- **CORS Proxy Access**: At least one proxy must be accessible
- **RSS Feed Access**: Google News RSS must be reachable

## Future Enhancements

### Planned Features
1. **Local Caching**: Browser storage for offline article access
2. **Real-time Updates**: WebSocket integration for live news
3. **Article Categorization**: Automatic topic detection and filtering
4. **Social Media Integration**: Twitter/Reddit news integration
5. **Bookmark Functionality**: Save articles for later reading

### Performance Improvements
1. **Image Optimization**: Lazy loading and compression
2. **Bundle Splitting**: Separate news service into own chunk
3. **Service Worker**: Offline capabilities and background sync
4. **CDN Integration**: Faster content delivery

### User Experience Enhancements
1. **Article Preview**: In-tile article summary display
2. **Reading Time**: Estimated reading time for articles
3. **Topic Suggestions**: Smart query recommendations
4. **Sharing Features**: Share articles via social media

---

**Last Updated**: July 2025  
**Version**: 1.0.0  
**Component**: NewsContent.vue  
**Service**: GoogleNewsService.ts
