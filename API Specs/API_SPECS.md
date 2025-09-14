# XMR LLM Backend API Specifications

## Overview
This API provides a comprehensive backend for LLM-powered data analysis with XmR (Individual Moving Range) Control Chart capabilities and conversation memory.

**Base URL**: `http://localhost:8000/api`  
**Content-Type**: `application/json` (except file uploads)  
**API Version**: 1.0.0

## Authentication
Currently no authentication required. All endpoints are publicly accessible.

## Error Handling
All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a `detail` field with error message:
```json
{
  "detail": "Error message here"
}
```

---

## Endpoints

### 1. Health Check

#### `GET /`
Check API health and get available providers.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "providers": ["openai", "anthropic"]
}
```

---

### 2. Conversations

#### `GET /conversations`
Get all conversations.

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Sales Analysis",
    "dataSourceId": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### `POST /conversations`
Create a new conversation.

**Request:**
```json
{
  "title": "New Analysis Session"
}
```

**Response:**
```json
{
  "id": 2,
  "userId": 1,
  "title": "New Analysis Session",
  "dataSourceId": null,
  "createdAt": "2024-01-15T10:35:00Z"
}
```

#### `GET /conversations/{conv_id}/messages`
Get all messages for a specific conversation.

**Response:**
```json
[
  {
    "id": 1,
    "conversationId": 1,
    "role": "user",
    "content": "Hello, can you analyze this data?",
    "sqlQuery": null,
    "sqlResults": null,
    "chartData": null,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "conversationId": 1,
    "role": "assistant",
    "content": "I'd be happy to help analyze your data!",
    "sqlQuery": null,
    "sqlResults": null,
    "chartData": {
      "type": "xmr",
      "data": [...],
      "insights": {
        "processStable": true,
        "outOfControlPoints": [],
        "averageValue": 1000.0,
        "averageRange": 150.0
      },
      "statistics": {
        "individualLimits": {
          "UCL": 1200.0,
          "LCL": 800.0,
          "mean": 1000.0
        },
        "totalPoints": 10,
        "validRanges": 9
      }
    },
    "createdAt": "2024-01-15T10:30:15Z"
  }
]
```

---

### 3. Chat & Messaging

#### `POST /chat`
Send a message to a conversation. **This is the main endpoint for chat functionality with memory.**

**Request:**
```json
{
  "conversationId": 1,
  "role": "user",
  "content": "Can you analyze the sales trends in this data?",
  "sqlQuery": null,
  "sqlResults": null,
  "chartData": null
}
```

**Response:**
```json
{
  "id": 3,
  "conversationId": 1,
  "role": "assistant",
  "content": "Based on the sales data analysis, I can see several trends...",
  "sqlQuery": "SELECT date, AVG(sales) FROM data GROUP BY date",
  "sqlResults": [
    {"date": "2024-01-01", "avg_sales": 1000.0},
    {"date": "2024-01-02", "avg_sales": 1200.0}
  ],
  "chartData": {
    "type": "xmr",
    "data": [
      {"x": "2024-01-01", "y": 1000, "pointType": "normal"},
      {"x": "2024-01-02", "y": 1200, "pointType": "normal"}
    ],
    "insights": {
      "processStable": true,
      "outOfControlPoints": [],
      "averageValue": 1100.0,
      "averageRange": 100.0,
      "recommendations": ["Continue monitoring", "Process is stable"]
    },
    "images": {
      "main_chart": {
        "file_path": "charts/xmr_chart_20240115_103500.png",
        "base64_data": "iVBORw0KGgoAAAANSUhEUgAA...",
        "title": "XmR Control Chart - sales vs date",
        "type": "xmr_control_chart",
        "filename": "xmr_chart_20240115_103500.png"
      },
      "summary_chart": {
        "file_path": "charts/xmr_summary_20240115_103500.png",
        "base64_data": "iVBORw0KGgoAAAANSUhEUgAA...",
        "title": "XmR Summary - sales",
        "type": "xmr_summary",
        "filename": "xmr_summary_20240115_103500.png"
      }
    }
  },
  "createdAt": "2024-01-15T10:35:00Z"
}
```

**Key Features:**
- **Conversation Memory**: AI remembers previous messages in the same conversation
- **Context Awareness**: AI can reference previous analysis and decisions
- **File Context**: When conversation has associated data, AI can analyze it
- **Tool Integration**: AI can generate charts, run analysis, and provide insights

---

### 4. File Management

#### `POST /csv-upload`
Upload a CSV file and create a conversation with data context.

**Request:** `multipart/form-data`
```
file: [CSV file]
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "filename": "sales_data.csv",
  "originalName": "sales_data.csv",
  "size": 1024,
  "createdAt": "2024-01-15T10:30:00Z",
  "data_source_id": 1,
  "conversation_id": 2,
  "columns": ["date", "sales", "region"],
  "row_count": 100,
  "message": "File uploaded successfully! 100 rows with columns: date, sales, region"
}
```

**Supported CSV Format:**
- Must have at least 2 columns
- First column should be date/time
- Second column should be numeric values
- Additional columns are supported

---

### 5. Data Sources

#### `GET /data-sources`
Get all data sources.

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "CSV: sales_data.csv",
    "type": "csv",
    "connectionString": null,
    "csvFileName": "sales_data.csv",
    "csvTableName": "uploaded_data",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### `POST /data-sources`
Create a new data source.

**Request:**
```json
{
  "name": "Production Database",
  "type": "postgresql",
  "connectionString": "postgresql://user:pass@localhost/db",
  "csvFileName": null,
  "csvTableName": null
}
```

#### `DELETE /data-sources/{ds_id}`
Delete a data source.

**Response:**
```json
{
  "message": "Data source deleted",
  "id": 1
}
```

---

### 6. Provider Information

#### `GET /providers`
Get available LLM providers.

**Response:**
```json
["openai", "anthropic"]
```

#### `GET /providers/{provider}`
Get information about a specific provider.

**Response:**
```json
{
  "name": "openai",
  "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo-preview"],
  "default_model": "gpt-3.5-turbo"
}
```

#### `GET /models/{provider}`
Get available models for a provider.

**Response:**
```json
{
  "provider": "openai",
  "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo-preview"]
}
```

---

## Data Models

### Message
```typescript
interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string;
  sqlResults?: any[];
  chartData?: ChartData;
  createdAt: string; // ISO datetime
}
```

### Conversation
```typescript
interface Conversation {
  id: number;
  userId: number;
  title: string;
  dataSourceId?: number;
  createdAt: string; // ISO datetime
}
```

### ChartData
```typescript
interface ChartData {
  type: 'xmr' | 'table';
  data: any[];
  insights?: {
    processStable: boolean;
    outOfControlPoints: number[];
    averageValue: number;
    averageRange: number;
    processCapability?: string;
    recommendations?: string[];
  };
  statistics?: {
    individualLimits: {
      UCL: number;
      LCL: number;
      mean: number;
    };
    movingRangeLimits: {
      UCL: number;
      LCL: number;
    };
    totalPoints: number;
    validRanges: number;
  };
  images?: {
    main_chart: ChartImage;
    summary_chart: ChartImage;
  };
}

interface ChartImage {
  file_path?: string;        // Local file path for debugging
  base64_data?: string;      // Base64 encoded image data for immediate display
  title: string;             // Chart title
  type: string;              // Chart type (xmr_control_chart, xmr_summary)
  filename: string;          // Chart filename for API access via GET /api/charts/{filename}
  error?: string;            // Error message if generation failed
}
```

---

## Frontend Integration Examples

### 1. Basic Chat Flow
```javascript
// 1. Create conversation
const createConversation = async (title) => {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return response.json();
};

// 2. Send message
const sendMessage = async (conversationId, content) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      role: 'user',
      content
    })
  });
  return response.json();
};

// 3. Get conversation history
const getMessages = async (conversationId) => {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  return response.json();
};
```

### 2. File Upload Flow
```javascript
// Upload CSV and get conversation with data context
const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/csv-upload', {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```

### 3. Chart Data Handling
```javascript
// Handle chart data from assistant responses
const handleMessage = (message) => {
  if (message.chartData) {
    const { type, data, insights, statistics, images } = message.chartData;
    
    if (type === 'xmr') {
      // Render XmR control chart
      renderXmRChart(data, insights, statistics);
      
      // Display chart images if available
      if (images) {
        displayChartImages(images);
      }
    } else if (type === 'table') {
      // Render data table
      renderDataTable(data);
    }
  }
};

// Display chart images
const displayChartImages = (images) => {
  const { main_chart, summary_chart } = images;
  
  // Display main chart
  if (main_chart.base64_data) {
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${main_chart.base64_data}`;
    img.alt = main_chart.title;
    img.style.maxWidth = '100%';
    document.getElementById('chart-container').appendChild(img);
  }
  
  // Display summary chart
  if (summary_chart.base64_data) {
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${summary_chart.base64_data}`;
    img.alt = summary_chart.title;
    img.style.maxWidth = '100%';
    document.getElementById('summary-container').appendChild(img);
  }
  
  // Or use URLs if available
  if (main_chart.url) {
    const link = document.createElement('a');
    link.href = main_chart.url;
    link.textContent = 'View Main Chart';
    link.target = '_blank';
    document.getElementById('chart-links').appendChild(link);
  }
};
```

---

## Chart Serving Endpoint

### `GET /api/charts/{filename}`

Serves individual chart files for frontend display.

**Parameters:**
- `filename` (path): Chart filename (e.g., `xmr_chart_20240115_103500.png`)

**Response:**
- **200 OK**: Returns the chart image file
- **404 Not Found**: Chart file doesn't exist
- **400 Bad Request**: Invalid filename format

**Security Features:**
- Only serves files with valid chart naming patterns
- Validates file extensions match configured format
- Prevents directory traversal attacks

**Example Usage:**
```javascript
// Frontend implementation
const displayChart = (imageData) => {
  const chartUrl = `${API_BASE_URL}/api/charts/${imageData.filename}`;
  return <img src={chartUrl} alt={imageData.title} />;
};
```

---

## Chart Image Features

### Image Generation
The API automatically generates PNG images for XmR control charts when chart data is created. Images are included in the response for immediate display in the frontend.

### Image Types
- **Main Chart**: Complete XmR control chart with control limits, quartile lines, and violation highlights
- **Summary Chart**: 4-panel overview with time series, distribution, statistics, and process stability

### Image Data Format
Each chart image includes:
- `file_path`: Local file path for debugging (server-side)
- `base64_data`: Base64 encoded image data for immediate display
- `title`: Descriptive title for the chart
- `type`: Chart type identifier
- `url`: Public URL for accessing the chart (if base URL configured)
- `error`: Error message if generation failed

### Configuration Options
Chart generation can be configured via environment variables:
```bash
# Chart Generation Configuration
CHART_OUTPUT_DIRECTORY=charts          # Output directory for chart files
CHART_IMAGE_FORMAT=png                 # Image format (png, jpg, etc.)
CHART_DPI=300                          # Image resolution (150, 300, etc.)
CHART_QUALITY=high                     # Image quality (high, medium, low)
CHART_CLEANUP_ENABLED=true             # Enable automatic cleanup of old charts
CHART_MAX_AGE_DAYS=7                   # Days to keep charts before cleanup
CHART_BASE_URL=http://localhost:8000/api/charts  # Base URL for chart serving
```

### Frontend Display Options

#### 1. **Base64 Display** (Recommended for immediate display)
```javascript
// Use base64_data for immediate inline display
<img src={`data:image/png;base64,${image_data.base64_data}`} 
     alt={image_data.title} />
```

#### 2. **API Access** (Recommended for external links)
```javascript
// Use filename with the chart serving endpoint
const chartUrl = `http://localhost:8000/api/charts/${image_data.filename}`;
<img src={chartUrl} alt={image_data.title} />
```

#### 3. **Security Benefits**
- **No hardcoded URLs**: Frontend constructs URLs dynamically
- **Environment agnostic**: Works across different deployment environments
- **Configuration flexibility**: Base URL can be configured per environment
- **Reduced information disclosure**: No internal server details exposed

#### 4. **File Download** (Development only)
```javascript
// Use file_path for direct file access (development/debugging)
<a href={image_data.file_path} download>Download Chart</a>
```

### Error Handling
If chart generation fails, the `images` object will contain error information:
```json
{
  "images": {
    "main_chart": {
      "file_path": null,
      "base64_data": null,
      "title": "Chart generation failed",
      "type": "error",
      "error": "Error message here"
    }
  }
}
```

---

## Conversation Memory Features

### Memory Configuration
- **Max Messages**: 5 previous message pairs (configurable)
- **Memory Enabled**: Yes (configurable)
- **Include Assistant Messages**: Yes (configurable)

### Memory Behavior
1. **Context Retention**: AI remembers previous conversation context
2. **Reference Capability**: AI can reference earlier analysis and decisions
3. **Automatic Limiting**: Only recent messages are included to prevent token overflow
4. **File Context**: Memory works with uploaded data files

### Example Memory Flow
```
User: "Hi, I'm John working on sales analysis"
AI: "Hello John! I'd be happy to help with your sales analysis..."

User: "Can you analyze this data?"
AI: [Analyzes data and provides insights]

User: "What did you find in the analysis you just did?"
AI: "Based on the analysis I just performed, I found that..." [References previous analysis]
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server error |

## Rate Limiting
Currently no rate limiting implemented.

## CORS
CORS is enabled for all origins.

---

## Testing
Use the provided test suite to verify API functionality:
```bash
python test_api.py
```

The test suite includes comprehensive memory testing to ensure conversation context is properly maintained.
