# XMR LLM Backend - Technical API Specifications

## Base Configuration
- **Base URL**: `http://localhost:8000/api`
- **Protocol**: HTTP/HTTPS
- **Content-Type**: `application/json` (except file uploads)
- **API Version**: 1.0.0

---

## Complete API Reference

### 1. Health & System Information

#### GET `/`
**Description**: Health check and system information

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "providers": ["openai", "anthropic"]
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/"
```

---

### 2. Conversation Management

#### GET `/conversations`
**Description**: List all conversations

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Sales Analysis Q1",
    "dataSourceId": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/conversations"
```

#### POST `/conversations`
**Description**: Create a new conversation

**Request Body**:
```json
{
  "title": "New Analysis Session"
}
```

**Response**:
```json
{
  "id": 2,
  "userId": 1,
  "title": "New Analysis Session",
  "dataSourceId": null,
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/conversations" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Analysis Session"}'
```

#### GET `/conversations/{conv_id}/messages`
**Description**: Get all messages for a conversation

**Path Parameters**:
- `conv_id` (integer): Conversation ID

**Response**:
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
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "conversationId": 1,
    "role": "assistant",
    "content": "I'd be happy to help analyze your data! Let me examine the information you've provided.",
    "sqlQuery": null,
    "sqlResults": null,
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
        "processCapability": "Good",
        "recommendations": ["Continue monitoring", "Process is stable"]
      },
      "statistics": {
        "individualLimits": {
          "UCL": 1300.0,
          "LCL": 900.0,
          "mean": 1100.0
        },
        "movingRangeLimits": {
          "UCL": 300.0,
          "LCL": 0.0
        },
        "totalPoints": 10,
        "validRanges": 9
      },
      "images": {
        "main_chart": {
          "file_path": "charts/xmr_chart_20240115_103015.png",
          "base64_data": "iVBORw0KGgoAAAANSUhEUgAA...",
          "title": "XmR Control Chart - sales vs date",
          "type": "xmr_control_chart",
          "filename": "xmr_chart_20240115_103015.png"
        },
        "summary_chart": {
          "file_path": "charts/xmr_summary_20240115_103015.png",
          "base64_data": "iVBORw0KGgoAAAANSUhEUgAA...",
          "title": "XmR Summary - sales",
          "type": "xmr_summary",
          "filename": "xmr_summary_20240115_103015.png"
        }
      }
    },
    "createdAt": "2024-01-15T10:30:15.000Z"
  }
]
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/conversations/1/messages"
```

---

### 3. Chat & Messaging (Main Feature)

#### POST `/chat`
**Description**: Send a message to a conversation with memory support

**Request Body**:
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

**Request Fields**:
- `conversationId` (integer, required): ID of the conversation
- `role` (string, required): "user" or "assistant"
- `content` (string, required): Message content
- `sqlQuery` (string, optional): SQL query if applicable
- `sqlResults` (array, optional): SQL results if applicable
- `chartData` (object, optional): Chart data if applicable

**Response**:
```json
{
  "id": 3,
  "conversationId": 1,
  "role": "assistant",
  "content": "Based on the sales data analysis, I can see several interesting trends. The data shows a steady increase in sales over the period, with some seasonal variations. Let me create an XmR control chart to identify any unusual patterns or outliers in the data.",
  "sqlQuery": "SELECT date, AVG(sales) as avg_sales FROM sales_data GROUP BY date ORDER BY date",
  "sqlResults": [
    {"date": "2024-01-01", "avg_sales": 1000.0},
    {"date": "2024-01-02", "avg_sales": 1200.0},
    {"date": "2024-01-03", "avg_sales": 1100.0}
  ],
  "chartData": {
    "type": "xmr",
    "data": [
      {"x": "2024-01-01", "y": 1000, "pointType": "normal"},
      {"x": "2024-01-02", "y": 1200, "pointType": "normal"},
      {"x": "2024-01-03", "y": 1100, "pointType": "normal"}
    ],
    "insights": {
      "processStable": true,
      "outOfControlPoints": [],
      "averageValue": 1100.0,
      "averageRange": 100.0,
      "processCapability": "Good",
      "recommendations": [
        "Continue monitoring the process",
        "The current variation is within acceptable limits",
        "Consider investigating the slight upward trend"
      ]
    },
    "statistics": {
      "individualLimits": {
        "UCL": 1300.0,
        "LCL": 900.0,
        "mean": 1100.0
      },
      "movingRangeLimits": {
        "UCL": 300.0,
        "LCL": 0.0
      },
      "totalPoints": 10,
      "validRanges": 9
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
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 1,
    "role": "user",
    "content": "Can you analyze the sales trends in this data?"
  }'
```

**Memory Features**:
- AI remembers previous conversation context
- Can reference earlier analysis and decisions
- Maintains context across multiple messages
- Automatically limits memory to prevent token overflow

---

### 4. File Upload & Data Management

#### POST `/csv-upload`
**Description**: Upload a CSV file and create a conversation with data context

**Request**: `multipart/form-data`
- `file`: CSV file

**Response**:
```json
{
  "id": 1,
  "userId": 1,
  "filename": "sales_data.csv",
  "originalName": "sales_data.csv",
  "size": 2048,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "data_source_id": 1,
  "conversation_id": 2,
  "columns": ["date", "sales", "region"],
  "row_count": 100,
  "message": "File uploaded successfully! 100 rows with columns: date, sales, region"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/csv-upload" \
  -F "file=@sales_data.csv"
```

**Supported CSV Format**:
- Minimum 2 columns required
- First column: date/time values
- Second column: numeric values
- Additional columns supported
- UTF-8 encoding preferred

---

### 5. Data Source Management

#### GET `/data-sources`
**Description**: List all data sources

**Response**:
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
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/data-sources"
```

#### POST `/data-sources`
**Description**: Create a new data source

**Request Body**:
```json
{
  "name": "Production Database",
  "type": "postgresql",
  "connectionString": "postgresql://user:pass@localhost:5432/dbname",
  "csvFileName": null,
  "csvTableName": null
}
```

**Response**:
```json
{
  "id": 2,
  "userId": 1,
  "name": "Production Database",
  "type": "postgresql",
  "connectionString": "postgresql://user:pass@localhost:5432/dbname",
  "csvFileName": null,
  "csvTableName": null,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/data-sources" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Database",
    "type": "postgresql",
    "connectionString": "postgresql://user:pass@localhost:5432/dbname"
  }'
```

#### DELETE `/data-sources/{ds_id}`
**Description**: Delete a data source

**Path Parameters**:
- `ds_id` (integer): Data source ID

**Response**:
```json
{
  "message": "Data source deleted",
  "id": 1
}
```

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8000/api/data-sources/1"
```

---

### 6. Provider Information

#### GET `/providers`
**Description**: Get available LLM providers

**Response**:
```json
["openai", "anthropic"]
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/providers"
```

#### GET `/providers/{provider}`
**Description**: Get information about a specific provider

**Path Parameters**:
- `provider` (string): Provider name (openai, anthropic)

**Response**:
```json
{
  "name": "openai",
  "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo-preview"],
  "default_model": "gpt-3.5-turbo"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/providers/openai"
```

#### GET `/models/{provider}`
**Description**: Get available models for a provider

**Path Parameters**:
- `provider` (string): Provider name

**Response**:
```json
{
  "provider": "openai",
  "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo-preview"]
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/models/openai"
```

---

## Data Models (TypeScript Interfaces)

### Message
```typescript
interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string | null;
  sqlResults?: any[] | null;
  chartData?: ChartData | null;
  createdAt: string; // ISO 8601 datetime
}
```

### Conversation
```typescript
interface Conversation {
  id: number;
  userId: number;
  title: string;
  dataSourceId?: number | null;
  createdAt: string; // ISO 8601 datetime
}
```

### DataSource
```typescript
interface DataSource {
  id: number;
  userId: number;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'csv';
  connectionString?: string | null;
  csvFileName?: string | null;
  csvTableName?: string | null;
  createdAt: string; // ISO 8601 datetime
}
```

### ChartData
```typescript
interface ChartData {
  type: 'xmr' | 'table';
  data: any[];
  insights?: ChartDataInsights;
  statistics?: ChartDataStatistics;
  images?: {
    main_chart: ChartImage;
    summary_chart: ChartImage;
  };
}

interface ChartDataInsights {
  processStable: boolean;
  outOfControlPoints: number[];
  averageValue: number;
  averageRange: number;
  processCapability?: string | null;
  recommendations?: string[] | null;
}

interface ChartDataStatistics {
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

## Chart Image Features

### Automatic Image Generation
The API automatically generates PNG images for XmR control charts when chart data is created. Images are included in the response for immediate display in the frontend.

### Image Types
- **Main Chart**: Complete XmR control chart with control limits, quartile lines, and violation highlights
- **Summary Chart**: 4-panel overview with time series, distribution, statistics, and process stability

### Image Data Structure
Each chart image includes:
- `file_path`: Local file path for debugging (server-side only)
- `base64_data`: Base64 encoded image data for immediate display
- `title`: Descriptive title for the chart
- `type`: Chart type identifier (xmr_control_chart, xmr_summary)
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
1. **Base64 Display**: Use `base64_data` for immediate inline display
2. **URL Display**: Use `url` field for external links or iframe embedding
3. **File Download**: Use `file_path` for direct file access (development only)

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

## Frontend Integration Examples

### React/JavaScript Examples

#### 1. Basic Chat Component
```javascript
import React, { useState, useEffect } from 'react';

const ChatComponent = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  // Send message
  const sendMessage = async (content) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        role: 'user',
        content
      })
    });
    
    const newMessage = await response.json();
    setMessages(prev => [...prev, newMessage]);
  };

  // Get conversation history
  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data);
    };
    
    fetchMessages();
  }, [conversationId]);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id} className={`message ${msg.role}`}>
          <strong>{msg.role}:</strong> {msg.content}
          {msg.chartData && <ChartRenderer data={msg.chartData} />}
          {msg.chartData?.images && <ChartImageDisplay images={msg.chartData.images} />}
        </div>
      ))}
      
      <input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
      />
    </div>
  );
};
```

#### 2. Chart Image Display Component
```javascript
const ChartImageDisplay = ({ images }) => {
  const { main_chart, summary_chart } = images;
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  return (
    <div className="chart-images">
      {main_chart.base64_data && (
        <div className="chart-container">
          <h4>{main_chart.title}</h4>
          <img 
            src={`data:image/png;base64,${main_chart.base64_data}`}
            alt={main_chart.title}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <a href={`${API_BASE_URL}/api/charts/${main_chart.filename}`} 
             target="_blank" rel="noopener noreferrer">
            View Full Size
          </a>
        </div>
      )}
      
      {summary_chart.base64_data && (
        <div className="chart-container">
          <h4>{summary_chart.title}</h4>
          <img 
            src={`data:image/png;base64,${summary_chart.base64_data}`}
            alt={summary_chart.title}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <a href={`${API_BASE_URL}/api/charts/${summary_chart.filename}`} 
             target="_blank" rel="noopener noreferrer">
            View Full Size
          </a>
        </div>
      )}
      
      {/* Error handling */}
      {main_chart.error && (
        <div className="chart-error">
          <p>Chart generation failed: {main_chart.error}</p>
        </div>
      )}
    </div>
  );
};
```

#### 3. File Upload Component
```javascript
const FileUpload = ({ onUploadComplete }) => {
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/csv-upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    onUploadComplete(result);
  };

  return (
    <input
      type="file"
      accept=".csv"
      onChange={(e) => handleFileUpload(e.target.files[0])}
    />
  );
};
```

#### 3. Chart Rendering
```javascript
const ChartRenderer = ({ data }) => {
  if (data.type === 'xmr') {
    return <XmRChart data={data.data} insights={data.insights} />;
  } else if (data.type === 'table') {
    return <DataTable data={data.data} />;
  }
  return null;
};
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

#### 404 Not Found
```json
{
  "detail": "Conversation not found"
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error occurred"
}
```

### Frontend Error Handling
```javascript
const handleApiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API call failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Handle error in UI
  }
};
```

---

## Testing

### Test the API
```bash
# Start the server
python app.py

# Run comprehensive tests
python test_api.py

# Run quick memory test
python test_memory_only.py
```

### Manual Testing with cURL
```bash
# 1. Health check
curl http://localhost:8000/api/

# 2. Create conversation
curl -X POST http://localhost:8000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Conversation"}'

# 3. Send message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId": 1, "role": "user", "content": "Hello!"}'

# 4. Upload file
curl -X POST http://localhost:8000/api/csv-upload \
  -F "file=@test_data.csv"
```

---

## Configuration

### Memory Settings
- **max_conversation_messages**: 5 (number of previous message pairs to include)
- **conversation_memory_enabled**: true (enable/disable memory)
- **include_system_messages**: true (include assistant messages in context)

### Server Configuration
- **Host**: localhost
- **Port**: 8000
- **CORS**: Enabled for all origins
- **Rate Limiting**: None (currently)

This comprehensive API specification provides everything the frontend engineers need to integrate with the XMR LLM Backend, including detailed examples, data models, and error handling patterns.
