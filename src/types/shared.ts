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
  connectionString?: string;
  csvFileName?: string;
  csvTableName?: string;
  createdAt: Date;
}

export interface Conversation {
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string;
  sqlResults?: any[];
  chartData?: ChartData;
  createdAt: Date;
}

export interface CSVUpload {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  size: number;
  createdAt: Date;
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
      center: number;
      upper: number;
      lower: number;
    };
    movingRangeLimits: {
      center: number;
      upper: number;
      lower: number;
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