# News Service CORS Issues & Solutions

## 📋 **Overview**

The Tiler News service encounters Cross-Origin Resource Sharing (CORS) issues when attempting to fetch Google News RSS feeds directly from the browser. This is a common limitation in web applications and requires specific solutions for production deployment.

---

## 🚫 **The Problem**

### **CORS Restrictions**

- Modern browsers block cross-origin requests to external domains for security reasons
- Google News RSS feeds do not provide CORS headers that allow browser access
- Public CORS proxy services are unreliable and often return 403/404 errors

### **Error Symptoms**

```
[Error] Preflight response is not successful. Status code: 403
[Error] Fetch API cannot load https://corsproxy.io/?https%3A%2F%2Fnews.google.com%2Frss...
[Warning] ✗ Proxy failed: HTTP 403
```

---

## ✅ **Current Solution (Development)**

### **Mock Data Fallback**

The service automatically falls back to comprehensive mock news data when live feeds fail:

```typescript
// Automatic fallback in googleNewsService.ts
catch (error) {
  console.warn(`Failed to fetch live news: ${error.message}`);
  console.log(`Falling back to mock news data for query: "${query}"`);
  return this.getMockNewsResponse(query, limit);
}
```

### **Benefits**

- ✅ Development continues without interruption
- ✅ UI/UX testing with realistic data
- ✅ Topic-specific mock data (technology, business, world, etc.)
- ✅ No external dependencies during development

---

## 🚀 **Production Solutions**

### **Option 1: Backend Proxy Service (Recommended)**

Create a backend API endpoint that fetches news server-side:

```typescript
// Backend endpoint (Node.js/Express example)
app.get('/api/news', async (req, res) => {
  const { query, limit } = req.query

  try {
    const response = await fetch(`https://news.google.com/rss/search?q=${query}`)
    const rssContent = await response.text()
    const articles = parseRssContent(rssContent, limit)

    res.json({
      articles,
      source: 'Google News',
      timestamp: Date.now(),
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' })
  }
})
```

**Implementation Steps:**

1. Create backend API endpoint
2. Update `googleNewsService.ts` to call your API instead of RSS directly
3. Handle authentication and rate limiting server-side

### **Option 2: News API Service**

Use a dedicated news API service that provides CORS-enabled endpoints:

#### **NewsAPI.org**

- Free tier: 1,000 requests/month
- Paid plans available
- Excellent documentation and reliability

```typescript
// Example integration
const NEWS_API_KEY = 'your-api-key'
const NEWS_API_URL = 'https://newsapi.org/v2/everything'

async function fetchNewsFromAPI(query: string, limit: number) {
  const response = await fetch(
    `${NEWS_API_URL}?q=${query}&pageSize=${limit}&apiKey=${NEWS_API_KEY}`,
  )
  return response.json()
}
```

#### **Other News APIs**

- **Currents API** - Real-time news with free tier
- **MediaStack** - Global news aggregation
- **New York Times API** - High-quality journalism
- **Guardian API** - Free tier available

### **Option 3: Server-Side Rendering (SSR)**

Use Next.js or similar framework with server-side data fetching:

```typescript
// Next.js getServerSideProps
export async function getServerSideProps(context) {
  const news = await fetchNewsServerSide(context.query.topic)

  return {
    props: {
      news,
    },
  }
}
```

### **Option 4: Browser Extension**

For internal/enterprise use, create a browser extension with elevated permissions:

```json
// manifest.json
{
  "permissions": ["https://news.google.com/*"],
  "host_permissions": ["https://news.google.com/*"]
}
```

---

## ⚙️ **Configuration for Production**

### **Environment Variables**

```bash
# .env
VITE_NEWS_API_ENDPOINT=https://your-backend.com/api/news
VITE_NEWS_API_KEY=your-secret-key
VITE_USE_MOCK_DATA=false
```

### **Service Configuration**

```typescript
// Update googleNewsService.ts
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const NEWS_API_ENDPOINT = import.meta.env.VITE_NEWS_API_ENDPOINT;

async getNews(config: NewsConfig): Promise<NewsResponse> {
  if (USE_MOCK_DATA) {
    return this.getMockNewsResponse(config.query, config.limit);
  }

  // Use production API endpoint
  return this.fetchFromProductionAPI(config);
}
```

---

## 🔧 **Implementation Guide**

### **Step 1: Choose Solution**

1. **For MVP/Demo**: Keep current mock data system
2. **For Production**: Implement backend proxy service
3. **For Scale**: Use dedicated news API service

### **Step 2: Update Service**

```typescript
// Add production endpoint support
private async fetchFromProductionAPI(config: NewsConfig): Promise<NewsResponse> {
  const response = await fetch(`/api/news?query=${config.query}&limit=${config.limit}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}
```

### **Step 3: Handle Fallbacks**

```typescript
// Graceful degradation
try {
  return await this.fetchFromProductionAPI(config)
} catch (error) {
  console.warn('Production API failed, using mock data')
  return this.getMockNewsResponse(config.query, config.limit)
}
```

---

## 📊 **Comparison Matrix**

| Solution          | Cost          | Reliability | Setup Complexity | CORS Issues |
| ----------------- | ------------- | ----------- | ---------------- | ----------- |
| Mock Data         | Free          | 100%        | None             | ✅ Solved   |
| Backend Proxy     | Server cost   | High        | Medium           | ✅ Solved   |
| News API          | $0-$100/month | Very High   | Low              | ✅ Solved   |
| SSR               | Hosting cost  | High        | High             | ✅ Solved   |
| Browser Extension | Free          | Medium      | High             | ✅ Solved   |

---

## 🎯 **Recommendations**

### **Development Phase**

- ✅ Continue using mock data system
- ✅ Test all UI components and user flows
- ✅ Implement error handling and loading states

### **MVP/Demo Phase**

- ⚡ Implement simple backend proxy
- ⚡ Use free tier of news API service
- ⚡ Add environment variable configuration

### **Production Phase**

- 🚀 Use dedicated news API service
- 🚀 Implement caching and rate limiting
- 🚀 Add monitoring and error tracking
- 🚀 Consider multiple news source aggregation

---

## 🛠️ **Quick Fix for Testing**

To test with live data in a local development environment, you can:

1. **Disable CORS in Chrome** (temporary, development only):

   ```bash
   # macOS/Linux
   google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_session"

   # Windows
   chrome.exe --disable-web-security --user-data-dir="c:\temp\chrome_dev_session"
   ```

2. **Use a local CORS proxy**:

   ```bash
   # Install cors-anywhere
   npm install -g cors-anywhere

   # Run proxy on localhost:8080
   cors-anywhere
   ```

⚠️ **Warning**: Never disable CORS in production or use these methods for public applications.

---

## 📞 **Support**

For questions about news service implementation or CORS issues:

1. Check the mock data in `googleNewsService.ts`
2. Review error logs in browser developer tools
3. Test with different news queries and topics
4. Consider implementing one of the production solutions above

The current mock data system ensures the news tile functionality works perfectly for development and demonstration purposes.
