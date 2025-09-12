# XMR Data Insights - Frontend

This is the standalone React frontend for the XMR Data Insights analytics platform. It provides a conversational interface for data exploration with XmR chart visualizations.

## Features

- 🎨 **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- 💬 **Chat Interface**: Conversational data queries with history
- 📊 **XmR Charts**: Statistical process control chart visualizations using Recharts
- 🔌 **Multi-Source Support**: Interface for connecting to databases and uploading CSV files
- 🎯 **Real-time Updates**: Live query results and chart generation
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **TanStack Query** for server state management
- **Wouter** for routing
- **Recharts** for data visualization
- **React Hook Form** with Zod validation

## Quick Start

### Prerequisites
- Node.js 18+
- A backend server running on port 8000 (or update the proxy in vite.config.ts)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Integration

This frontend expects a backend API running on `http://localhost:8000` with these endpoints:

- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/chat` - Send chat message
- `GET /api/data-sources` - List data sources
- `POST /api/data-sources` - Create data source
- `DELETE /api/data-sources/:id` - Delete data source
- `POST /api/csv-upload` - Upload CSV file

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── charts/         # Chart components (XmR charts)
│   ├── chat/           # Chat interface components
│   ├── sidebar/        # Sidebar navigation components
│   └── ui/             # Base UI components (shadcn/ui)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API client
├── pages/              # Page components
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── index.css           # Global styles
```

## Key Components

### Chat Interface
- `ChatInterface` - Main chat component with message history
- `MessageBubble` - Individual message display
- `ChatInput` - Message input with send functionality

### XmR Charts
- `XmRChart` - Statistical process control chart implementation
- `ChartLegend` - Chart legend and insights display
- `ChartContainer` - Responsive chart wrapper

### Data Sources
- `DataSourcesPanel` - Manage database connections and CSV uploads
- `DataSourceCard` - Individual data source display
- `CSVUpload` - File upload component

### Sidebar Navigation
- `ConversationSidebar` - Chat history and navigation
- `ConversationList` - List of previous conversations

## Customization

### Styling
The app uses Tailwind CSS with custom design tokens defined in `index.css`. You can customize:

- Color scheme in CSS variables
- Component styles in individual component files
- Global styles in `index.css`

### API Integration
Update the API base URL in `src/lib/api.ts` or modify the Vite proxy configuration in `vite.config.ts`.

### Chart Configuration
XmR chart settings can be modified in `src/components/charts/xmr-chart.tsx`:

- Control limit calculations
- Chart colors and styling
- Statistical thresholds

## Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

The built files will be in the `dist/` directory.

## Environment Variables

Create a `.env.local` file for development:

```env
VITE_API_URL=http://localhost:8000
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint TypeScript files
- `npm run type-check` - Type check without emitting files

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Add proper type definitions
4. Test components thoroughly
5. Update documentation for new features

## License

MIT License - see LICENSE file for details
