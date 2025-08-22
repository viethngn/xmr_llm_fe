# XMR Data Insights - Standalone Frontend Setup

This directory contains **only the frontend React application** extracted from the full-stack project. You can use this as a standalone frontend that connects to any compatible backend API.

## What's Included

✅ **Complete React Application**
- All React components and pages
- XmR chart implementations
- Chat interface
- Data source management UI
- Tailwind CSS styling with Shadcn/ui components

✅ **Standalone Configuration**
- Independent `package.json` with only frontend dependencies
- Vite configuration with API proxy
- TypeScript configuration
- Standalone API client

✅ **Type Definitions**
- All necessary TypeScript types in `src/types/shared.ts`
- Proper API type definitions
- Component prop types

## Quick Start

```bash
# Navigate to frontend directory
cd frontend-only

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API calls to `http://localhost:5000`

## Backend Requirements

This frontend expects a backend API with these endpoints:

### Required API Endpoints
```
GET    /api/conversations              # List conversations
POST   /api/conversations              # Create conversation
GET    /api/conversations/:id/messages # Get messages
POST   /api/chat                       # Send chat message
GET    /api/data-sources               # List data sources
POST   /api/data-sources               # Create data source
DELETE /api/data-sources/:id           # Delete data source
POST   /api/csv-upload                 # Upload CSV file
```

### Expected Response Formats
The API should return JSON responses matching the types in `src/types/shared.ts`:

```typescript
// Data Source
{
  id: number,
  userId: number,
  name: string,
  type: 'postgresql' | 'mysql' | 'sqlite' | 'csv',
  connectionString?: string,
  csvFileName?: string,
  csvTableName?: string,
  createdAt: Date
}

// Message with XmR Chart Data
{
  id: number,
  conversationId: number,
  role: 'user' | 'assistant',
  content: string,
  sqlQuery?: string,
  sqlResults?: any[],
  chartData?: {
    type: 'xmr' | 'table',
    data: any[],
    insights?: {
      processStable: boolean,
      outOfControlPoints: number[],
      averageValue: number,
      averageRange: number,
      processCapability?: string,
      recommendations?: string[]
    }
  },
  createdAt: Date
}
```

## Configuration

### Environment Variables
Create `.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

### API URL Configuration
- **Development**: Automatically proxies to `localhost:8000`
- **Production**: Set `VITE_API_URL` environment variable

### Vite Proxy Configuration
In `vite.config.ts`:
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true
    }
  }
}
```

## Integration with Your Backend

### Option 1: Use with Your Python Backend
Your existing Python LangChain backend can serve this frontend by:
1. Adding CORS headers for `localhost:3000`
2. Implementing the required API endpoints
3. Returning JSON responses in the expected format

### Option 2: Use with Any Backend
This frontend is backend-agnostic. Any server that implements the API specification can work:
- Node.js/Express
- Python/FastAPI
- Python/Django
- Go/Gin
- Java/Spring Boot
- etc.

## Key Features

### Chat Interface
- Real-time conversation with backend
- Message history persistence
- Support for both text and chart responses

### XmR Charts
- Statistical process control charts
- Proper XmR methodology implementation
- Interactive visualizations with Recharts
- Control limits and insights display

### Data Source Management
- Connect to multiple database types
- CSV file upload interface
- Connection testing and validation

### UI Components
- Modern design with Tailwind CSS
- Accessible components with Radix UI
- Responsive layout for all screen sizes
- Dark/light theme support

## Building for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

Built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## File Structure

```
frontend-only/
├── src/
│   ├── components/      # React components
│   │   ├── charts/     # XmR chart components
│   │   ├── chat/       # Chat interface
│   │   ├── sidebar/    # Navigation components
│   │   └── ui/         # Base UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API client
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   └── App.tsx         # Main application
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind CSS config
└── README.md           # Documentation
```

This standalone frontend gives you complete control over the UI while allowing you to integrate with any backend that matches the API specification!