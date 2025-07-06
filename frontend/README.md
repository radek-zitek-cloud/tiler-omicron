# Dashboard Tiling System

A flexible, responsive web-based dashboard featuring a tile-based layout system with intuitive drag-and-drop functionality.

![Dashboard Empty State](https://github.com/user-attachments/assets/8b105f46-811b-4330-a4a5-b0223a4f1598)

## 🎯 Features

### Core Tile Operations

- ✅ **Tile Creation** - Add new tiles with a simple "Add Tile" button
- ✅ **Tile Deletion** - Remove tiles with confirmation dialogs
- ✅ **Tile Resizing** - Resize tiles using corner and edge handles
- ✅ **Tile Rearrangement** - Drag and drop tiles to new positions

### Grid System

- ✅ **Responsive Grid** - 12-column system that adapts to screen size
- ✅ **Grid Constraints** - Tiles snap to grid positions, no overlapping
- ✅ **Automatic Layout** - Smart positioning for new tiles
- ✅ **Visual Feedback** - Grid lines and drop zones during operations

### Layout Persistence

- ✅ **Auto-Save** - Layout automatically saved to localStorage
- ✅ **Session Persistence** - Restore exact layout on page reload
- ✅ **Layout Export** - Export layout configuration as JSON
- ✅ **Layout Import** - Import layout from JSON file with validation

### Responsive Design

- ✅ **Desktop** (1200px+) - 12-column grid
- ✅ **Tablet** (768px-1199px) - 8-column grid
- ✅ **Mobile** (576px-767px) - 4-column grid
- ✅ **Small Mobile** (<576px) - 1-column stack

![Desktop Layout](https://github.com/user-attachments/assets/512b6872-bfa9-48cf-9ed7-1f59cf333156)

![Mobile Layout](https://github.com/user-attachments/assets/96f9f4b1-8a67-469f-99ba-6e8a68cf7797)

## 🛠️ Technology Stack

- **Frontend Framework**: Vue.js 3 with Composition API
- **Language**: TypeScript for type safety
- **State Management**: Pinia store
- **UI Framework**: Bootstrap 5
- **Build Tool**: Vite
- **Icons**: Font Awesome
- **Testing**: Vitest + Playwright

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/radek-zitek-cloud/tiler-omicron.git
cd tiler-omicron

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Development Server

The application will be available at `http://localhost:5173`

## 📖 Usage

### Basic Operations

1. **Adding Tiles**: Click the "Add Tile" button to create new tiles
2. **Deleting Tiles**: Click the delete (🗑️) button on any tile and confirm
3. **Resizing Tiles**: Drag the resize handle in the bottom-right corner
4. **Moving Tiles**: Drag tiles to new positions using the drag handle (⋮⋮)

### Advanced Features

- **Clear All**: Remove all tiles at once (with confirmation)
- **Export Layout**: Download current layout as JSON
- **Import Layout**: Upload and restore layout from JSON file
- **Responsive**: Layout automatically adapts to screen size

## 🧩 Tile Content Types

The dashboard supports various content types for tiles:

### Available Content Types

#### 📈 Stock Quote (`equity-quote`)

- Real-time stock price data from Alpha Vantage API
- Displays price, change, volume, and market data
- Auto-refresh with configurable intervals
- Support for US and international symbols

**Configuration:**

```typescript
{
  type: 'equity-quote',
  symbol: 'AAPL',
  displayOptions: {
    showChange: true,
    showPercentChange: true,
    showVolume: true
  }
}
```

#### 📰 News Feed (`news`)

- Latest news articles from Google News
- Support for topic-based and custom search queries
- Configurable article count and display options
- Auto-refresh with CORS proxy fallback system

**Configuration:**

```typescript
{
  type: 'news',
  query: 'technology',
  articleCount: 5,
  displayOptions: {
    showSource: true,
    showTimestamp: true,
    compactView: false
  }
}
```

**Supported News Topics:**

- `technology` - Technology news
- `business` - Business & finance
- `world` - World news
- `sports` - Sports news
- `science` - Science news
- Custom search queries (e.g., "artificial intelligence")

#### 📦 Placeholder (`placeholder`)

- Simple placeholder content for testing
- Customizable message display
- Useful for layout planning

**Documentation:**

- 📊 **Stock Quotes**: See `docs/API_MIGRATION.md` for Alpha Vantage API details
- 📰 **News Feed**: See `docs/NEWS_TILE_USAGE.md` for comprehensive news configuration

## 🏗️ Architecture

### Component Structure

```text
src/
├── components/
│   ├── DashboardContainer.vue    # Main dashboard container
│   └── TileComponent.vue         # Individual tile component
├── stores/
│   └── dashboard.ts              # Pinia store for state management
├── types/
│   └── dashboard.ts              # TypeScript type definitions
├── views/
│   ├── DashboardView.vue         # Main dashboard page
│   └── AboutView.vue             # About page
├── router/
│   └── index.ts                  # Vue Router configuration
└── main.ts                       # Application entry point
```

### Key Components

- **DashboardContainer**: Manages grid system, responsive behavior, and tile coordination
- **TileComponent**: Individual tiles with drag/resize capabilities
- **Dashboard Store**: Centralized state management with Pinia
- **Type Definitions**: Comprehensive TypeScript interfaces

### Grid System Specifications

- **Default Grid**: 12 columns
- **Tile Constraints**: 1x1 minimum, configurable maximum
- **Grid Gap**: 8px between tiles
- **Container Padding**: 16px

## 🎨 UI/UX Features

- **Visual Feedback**: Hover states, drag indicators, resize handles
- **Animations**: Smooth transitions for tile operations
- **Accessibility**: ARIA labels, keyboard navigation support
- **Touch Support**: Mobile-friendly drag and drop
- **Error Handling**: User-friendly error messages and confirmations

## 📊 Performance

- **Target Metrics**:
  - Tile operations: <100ms response time
  - Page load: <3 seconds
  - Supports: 50+ tiles without performance degradation
  - Memory: Stable during extended use

## 🧪 Testing

```bash
# Run unit tests
npm run test:unit

# Run end-to-end tests
npm run test:e2e

# Type checking
npm run type-check
```

## 📋 Requirements Fulfilled

All requirements from `docs/REQUIREMENTS.md` have been implemented:

### Functional Requirements ✅

- **FR-1**: Tile Creation
- **FR-2**: Tile Deletion
- **FR-3**: Tile Resizing
- **FR-4**: Tile Rearrangement
- **FR-5**: Grid Layout Engine
- **FR-6**: Layout Persistence
- **FR-7**: Visual Design
- **FR-8**: Interaction Feedback

### Technical Requirements ✅

- **TR-1**: Technology Stack (Vue.js, Bootstrap, Vite)
- **TR-2**: Performance Requirements
- **TR-3**: Responsive Design
- **TR-4**: Code Architecture

## 🔮 Future Enhancements (Phase 2)

- Tile content management system
- Template tiles with predefined layouts
- Dashboard sharing and collaboration
- Advanced grid options (nested grids)
- Undo/redo functionality
- Tile grouping and sections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Vue.js team for the excellent framework
- Bootstrap team for the UI components
- Font Awesome for the icons
