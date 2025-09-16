import type { 
  DataSource, 
  Conversation, 
  Message, 
  InsertDataSource, 
  InsertConversation, 
  InsertMessage,
  CSVUpload
} from "../types/shared";
import { apiLogger } from "./logger";

// Base API URL - can be configured via environment variable
// Using relative path since Vite proxy handles the backend connection
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function for API requests
export async function api<T = any>(method: string, url: string, data?: unknown): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;
  const requestConfig = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' as RequestCredentials,
    ...(data ? { body: JSON.stringify(data) } : {})
  };

  // Log API request
  apiLogger.request(method, fullUrl, data);

  const response = await fetch(fullUrl, requestConfig);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData = null;
    
    try {
      errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch (parseError) {
      // If response is not JSON, use the default error message
    }
    
    apiLogger.error(method, fullUrl, { status: response.status, error: errorMessage, data: errorData });
    throw new Error(errorMessage);
  }

  try {
    const responseData = await response.json();
    apiLogger.response(method, fullUrl, response, responseData);
    return responseData;
  } catch (parseError) {
    apiLogger.error(method, fullUrl, { parseError, message: 'Failed to parse response as JSON' });
    throw new Error('Failed to parse response as JSON');
  }
}

// Specific API functions for common operations
export const dataSourcesApi = {
  getAll: (): Promise<DataSource[]> => api<DataSource[]>('GET', '/data-sources'),
  getById: (id: number): Promise<DataSource> => api<DataSource>('GET', `/data-sources/${id}`),
  create: (data: InsertDataSource): Promise<DataSource> => api<DataSource>('POST', '/data-sources', data),
  delete: (id: number): Promise<{ message: string; id: number }> => api<{ message: string; id: number }>('DELETE', `/data-sources/${id}`)
};

export const conversationsApi = {
  getAll: (): Promise<Conversation[]> => api<Conversation[]>('GET', '/conversations'),
  getById: (id: number): Promise<Conversation> => api<Conversation>('GET', `/conversations/${id}`),
  create: (data: InsertConversation): Promise<Conversation> => api<Conversation>('POST', '/conversations', data),
  getMessages: (id: number): Promise<Message[]> => api<Message[]>('GET', `/conversations/${id}/messages`)
};

export const chatApi = {
  sendMessage: (data: { conversationId: number; role: 'user' | 'assistant'; content: string; sqlQuery?: string | null; sqlResults?: any[] | null; chartData?: any | null }): Promise<Message> => 
    api<Message>('POST', '/chat', data)
};

export const csvApi = {
  upload: (file: File): Promise<CSVUpload> => {
    const formData = new FormData();
    formData.append('file', file);
    const fullUrl = `${API_BASE_URL}/csv-upload`;
    
    // Log CSV upload request
    apiLogger.request('POST', fullUrl, {
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      },
      formDataEntries: Array.from(formData.entries())
    });
    
    return fetch(fullUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    }).then(async response => {
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (parseError) {
          // If response is not JSON, use the default error message
        }
        
        apiLogger.error('POST', fullUrl, { status: response.status, error: errorMessage });
        throw new Error(errorMessage);
      }
      
      try {
        const responseData = await response.json();
        apiLogger.response('POST', fullUrl, response, responseData);
        return responseData;
      } catch (parseError) {
        apiLogger.error('POST', fullUrl, { parseError, message: 'Failed to parse CSV response as JSON' });
        throw new Error('Failed to parse CSV response as JSON');
      }
    });
  }
};

// Note: Charts are generated as part of chat responses, not separate endpoints
// The AI generates XmR charts and other visualizations in the chatData field of messages

// Health and system information
export const healthApi = {
  check: (): Promise<{ status: string; version: string; providers: string[] }> => 
    api<{ status: string; version: string; providers: string[] }>('GET', '/')
};

// Provider information
export const providersApi = {
  getAll: (): Promise<string[]> => api<string[]>('GET', '/providers'),
  getById: (provider: string): Promise<{ name: string; models: string[]; default_model: string }> => 
    api<{ name: string; models: string[]; default_model: string }>('GET', `/providers/${provider}`),
  getModels: (provider: string): Promise<{ provider: string; models: string[] }> => 
    api<{ provider: string; models: string[] }>('GET', `/models/${provider}`)
};

// Chart serving
export const chartsApi = {
  getImage: (filename: string): string => `${API_BASE_URL}/charts/${filename}`,
  getImageUrl: (filename: string): string => `${API_BASE_URL}/charts/${filename}`
};

// Generic API functions for backward compatibility
export const get = <T = any>(url: string): Promise<T> => api<T>('GET', url);
export const post = <T = any>(url: string, data?: unknown): Promise<T> => api<T>('POST', url, data);
export const del = <T = any>(url: string): Promise<T> => api<T>('DELETE', url);
export const upload = (file: File): Promise<CSVUpload> => csvApi.upload(file);

// Legacy apiRequest function for compatibility
export async function apiRequest(method: string, url: string, data?: unknown) {
  return api(method, url, data);
}
