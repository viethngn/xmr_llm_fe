I'll scan the API-related files to extract routes, request/response models, and any middleware/config used for integration, reading them in parallel for speed.

[5 tools called]

I scanned the FastAPI modules and pulled out all routes, request/response models, and CORS/config.

### Base
- **Server**: FastAPI app in `app.py`
- **Base path**: `/api`
- **Docs**: `/docs` (Swagger), `/redoc`
- **CORS**: `*` origins, all methods/headers (adjust in prod)
- **Auth**: None (no auth middleware)

### Endpoints

- **Health**
  - GET `/api/`
  - **Resp**: `HealthResponse` { status: str, version: str, providers: string[] }

- **CSV Upload**
  - POST `/api/csv-upload`
  - **Req**: multipart/form-data with `file`: UploadFile (CSV)
  - **Resp**: JSON with:
    - id, userId, filename, originalName, size, createdAt
    - data_source_id: number
    - conversation_id: number
    - columns: string[]
    - row_count: number
    - message: string

- **Chat (context-aware if CSV uploaded for the conversation)**
  - POST `/api/chat`
  - **Req**: `InsertMessage`
    - { conversationId: number, role: 'user' | 'assistant', content: string, sqlQuery?: string, sqlResults?: any[], chartData?: ChartData }
    - For normal use, send `role: 'user'`.
  - **Resp**: `Message`
    - { id: number, conversationId: number, role: 'assistant', content: string, sqlQuery?: string, sqlResults?: any[], chartData?: ChartData, createdAt: datetime }
  - Notes:
    - If the conversation has CSV context, the LLM agent plus tools are used and may return `sqlQuery`, `sqlResults`, `chartData`.
    - Otherwise it falls back to `"Echo: <content>"`.

- **Conversation (LLM agent) history and model info (string-based LLM conv IDs)**
  - GET `/api/chat/{conversation_id}/history`
    - conversation_id: string (agent-level conversation)
    - **Resp**: `ConversationHistoryResponse` { conversation_id: string, messages: {role, content}[], total_messages: number }
  - DELETE `/api/chat/{conversation_id}/history`
    - **Resp**: { message: string, conversation_id: string }
  - DELETE `/api/chat/{conversation_id}`
    - **Resp**: { message: string, conversation_id: string }
  - GET `/api/chat/{conversation_id}/model`
    - **Resp**: `ModelInfoResponse` { provider: string, model: string, temperature: number, max_tokens: number }

- **Providers**
  - GET `/api/providers`
    - **Resp**: string[] (provider keys)
  - GET `/api/providers/{provider}`
    - **Resp**: `ProviderInfoResponse` { name: string, models: string[], default_model: string }
  - GET `/api/models/{provider}`
    - **Resp**: { provider: string, models: string[] }

- **Data sources**
  - GET `/api/data-sources`
    - **Resp**: `DataSource`[]
  - POST `/api/data-sources`
    - **Req**: `InsertDataSource`
      - { name: string, type: 'postgresql'|'mysql'|'sqlite'|'csv', connectionString?, csvFileName?, csvTableName? }
    - **Resp**: `DataSource`
      - { id, userId, name, type, connectionString?, csvFileName?, csvTableName?, createdAt }
  - DELETE `/api/data-sources/{ds_id}`
    - **Resp**: { message: string, id: number }

- **Conversations (numeric, tied to data sources)**
  - GET `/api/conversations`
    - **Resp**: `Conversation`[]
      - { id, userId, title, dataSourceId?, createdAt }
  - POST `/api/conversations`
    - **Req**: `InsertConversation` { title: string }
    - **Resp**: `Conversation`
  - GET `/api/conversations/{conv_id}/messages`
    - **Resp**: `Message`[]

### Data shapes for charting
- **ChartData**
  - { type: 'xmr' | 'table', data: any[], insights?: ChartDataInsights, statistics?: ChartDataStatistics }
- **ChartDataInsights**
  - { processStable: bool, outOfControlPoints: number[], averageValue: number, averageRange: number, processCapability?: string, recommendations?: string[] }
- **ChartDataStatistics**
  - { individualLimits: Record<string, number>, movingRangeLimits: Record<string, number>, totalPoints: number, validRanges: number }

### Typical FE flow
1. Upload CSV: POST `/api/csv-upload` → get `conversation_id` (number) and `data_source_id`.
2. Send user messages: POST `/api/chat` with `{ conversationId, role: 'user', content }`.
3. Render assistant `Message`, including optional `chartData`.
4. List conversations/messages for UI: GET `/api/conversations`, GET `/api/conversations/{id}/messages`.

### Minimal examples

- Upload CSV
```bash
curl -X POST http://localhost:8000/api/csv-upload \
  -F "file=@/path/to/data.csv"
```

- Send chat
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId": 1, "role": "user", "content": "Analyze the data"}'
```

- List messages
```bash
curl http://localhost:8000/api/conversations/1/messages
```

- Providers
```bash
curl http://localhost:8000/api/providers
```

- Health
```bash
curl http://localhost:8000/api/
```

Note: There are two “conversation” concepts: numeric conversation IDs for data-source-linked chat messages (FE uses these), and string conversation IDs for the internal LLM agent history endpoints. For FE integration tied to CSV/data, use the numeric IDs returned by `/api/csv-upload` and used by `/api/chat`.

- API base: `/api`, open CORS, no auth.
- Core endpoints: CSV upload, chat, conversations, data sources, providers.
- Important distinction: numeric conversation IDs for FE; string IDs for agent-only history/model endpoints.