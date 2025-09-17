# XMR LLM Backend - Quick Reference for Frontend

## 🚀 Quick Start
- **Base URL**: `http://localhost:8000/api`
- **Content-Type**: `application/json` (except file uploads)

## 🔑 Key Endpoints

### 1. Chat (Main Feature)
```javascript
// Send message with memory
POST /chat
{
  "conversationId": 1,
  "role": "user",
  "content": "Your message here"
}
```

### 2. Conversations
```javascript
// Create conversation
POST /conversations
{ "title": "My Analysis" }

// Get messages
GET /conversations/{id}/messages
```

### 3. File Upload
```javascript
// Upload CSV (multipart/form-data)
POST /csv-upload
file: [CSV file]
```

## 💾 Memory Features
- ✅ AI remembers previous conversation context
- ✅ Can reference earlier analysis and decisions  
- ✅ Memory limited to 5 recent message pairs
- ✅ Works with uploaded data files

## 📊 Response Data
```typescript
interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  chartData?: {
    type: 'xmr' | 'table';
    data: any[];
    insights?: {
      processStable: boolean;
      outOfControlPoints: number[];
      averageValue: number;
      recommendations?: string[];
    };
    images?: {
      main_chart: ChartImage;
      summary_chart: ChartImage;
    };
  };
  createdAt: string;
}

interface ChartImage {
  file_path?: string;        // Local file path for debugging
  base64_data?: string;      // Base64 encoded image data
  title: string;             // Chart title
  type: string;              // Chart type
  url?: string;              // Public URL for accessing the chart
  error?: string;            // Error message if generation failed
}
```

## 🔄 Typical Flow
1. **Create conversation** → `POST /conversations`
2. **Upload data** → `POST /csv-upload` (optional)
3. **Send messages** → `POST /chat` (with memory)
4. **Get history** → `GET /conversations/{id}/messages`

## 🧪 Test the API
```bash
# Start server
python app.py

# Test everything
python test_api.py
```

## 📁 Files Created
- `API_SPECS.md` - Complete API documentation
- `API_TECHNICAL_SPECS.md` - Detailed technical specs with examples
- `XMR_LLM_API.postman_collection.json` - Postman collection
- `API_QUICK_REFERENCE.md` - This quick reference

## 🖼️ Chart Images
- **Automatic Generation**: PNG images created for all XmR charts
- **Base64 Data**: Images included in API response for immediate display
- **Two Chart Types**: Main control chart + summary overview
- **Configurable**: Output directory, format, quality, and cleanup settings
- **Error Handling**: Graceful fallback if image generation fails

### Quick Image Display
```javascript
// Display chart images from API response
if (message.chartData?.images) {
  const { main_chart, summary_chart } = message.chartData.images;
  
  // Show main chart
  if (main_chart.base64_data) {
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${main_chart.base64_data}`;
    document.getElementById('charts').appendChild(img);
  }
}
```

## 🎯 Key Features for Frontend
- **Conversation Memory**: AI remembers context across messages
- **File Analysis**: Upload CSV files for data analysis
- **Chart Generation**: AI can generate XmR control charts with images
- **Real-time Chat**: Send/receive messages with full context
- **Data Insights**: Get statistical analysis and recommendations
- **Visual Charts**: Professional PNG images for immediate display
