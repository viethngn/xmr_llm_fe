// Shared types for the frontend (extracted from backend schema)

export interface User {
  id: number;
  username: string;
  createdAt: Date;
}

export interface DataSource {
  id: number;
  userId: number;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'csv';
  connectionString?: string | null;
  csvFileName?: string | null;
  csvTableName?: string | null;
  createdAt: string; // ISO 8601 datetime
}

export interface Conversation {
  id: number;
  userId: number;
  title: string;
  dataSourceId?: number | null;
  createdAt: string; // ISO 8601 datetime
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string | null;
  sqlResults?: any[] | null;
  chartData?: ChartData | null;
  createdAt: string; // ISO 8601 datetime
}

export interface CSVUpload {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  size: number;
  createdAt: string; // ISO 8601 datetime
  data_source_id: number;
  conversation_id: number;
  columns: string[];
  row_count: number;
  message: string;
}

export interface ChartData {
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
}

// Insert types
export interface InsertDataSource {
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'csv';
  connectionString?: string;
  csvFileName?: string;
  csvTableName?: string;
}

export interface InsertConversation {
  title: string;
}

export interface InsertMessage {
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string;
  sqlResults?: any[];
  chartData?: ChartData;
}