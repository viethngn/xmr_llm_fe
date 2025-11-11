// API Logging Configuration
export const API_LOGGING_ENABLED = import.meta.env.VITE_API_LOGGING === 'true' || import.meta.env.DEV;

// Import file logger
import { fileLogger, logToFile } from './file-logger';

// Enhanced console logging with API context
export const apiLogger = {
  request: (method: string, url: string, data?: any) => {
    if (!API_LOGGING_ENABLED) return;
    
    console.group(`🚀 API Request: ${method} ${url}`);
    console.log('📤 Request Config:', {
      method,
      url,
      timestamp: new Date().toISOString(),
      body: data ? JSON.stringify(data, null, 2) : 'No body'
    });
    if (data) {
      console.log('📦 Request Data:', data);
    }
    console.groupEnd();
    
    // Log to file
    fileLogger.info('API_REQUEST', `${method} ${url}`, { method, url, data });
  },

  response: (method: string, url: string, response: Response, data?: any) => {
    if (!API_LOGGING_ENABLED) return;
    
    console.group(`📥 API Response: ${method} ${url}`);
    console.log('📊 Response Status:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });
    
    if (data) {
      console.log('✅ Response Data:', data);
      
      // Special logging for chart data
      if (data.chartData) {
        console.log('📊 Chart Data Analysis:', {
          type: data.chartData.type,
          hasData: !!data.chartData.data,
          dataType: typeof data.chartData.data,
          dataIsArray: Array.isArray(data.chartData.data),
          dataLength: Array.isArray(data.chartData.data) ? data.chartData.data.length : 'N/A',
          dataSample: Array.isArray(data.chartData.data) && data.chartData.data.length > 0
            ? data.chartData.data.slice(0, 3)
            : data.chartData.data,
          dataKeys: Array.isArray(data.chartData.data) && data.chartData.data.length > 0 && typeof data.chartData.data[0] === 'object'
            ? Object.keys(data.chartData.data[0])
            : 'N/A',
          hasTitle: !!data.chartData.title,
          title: data.chartData.title,
          hasXAxisKey: !!data.chartData.xAxisKey,
          xAxisKey: data.chartData.xAxisKey,
          hasYAxisKey: !!data.chartData.yAxisKey,
          yAxisKey: data.chartData.yAxisKey,
          hasImages: !!data.chartData.images,
          images: data.chartData.images ? {
            main_chart: {
              title: data.chartData.images.main_chart?.title,
              hasBase64: !!data.chartData.images.main_chart?.base64_data,
              base64Length: data.chartData.images.main_chart?.base64_data?.length || 0,
              hasFilename: !!data.chartData.images.main_chart?.filename,
              filename: data.chartData.images.main_chart?.filename,
              hasError: !!data.chartData.images.main_chart?.error,
              type: data.chartData.images.main_chart?.type
            },
            summary_chart: {
              title: data.chartData.images.summary_chart?.title,
              hasBase64: !!data.chartData.images.summary_chart?.base64_data,
              base64Length: data.chartData.images.summary_chart?.base64_data?.length || 0,
              hasFilename: !!data.chartData.images.summary_chart?.filename,
              filename: data.chartData.images.summary_chart?.filename,
              hasError: !!data.chartData.images.summary_chart?.error,
              type: data.chartData.images.summary_chart?.type
            }
          } : 'No images object'
        });
      }
    }
    console.groupEnd();
    
    // Log to file
    fileLogger.info('API_RESPONSE', `${method} ${url}`, { method, url, status: response.status, data });
  },

  error: (method: string, url: string, error: any) => {
    if (!API_LOGGING_ENABLED) return;
    
    console.group(`❌ API Error: ${method} ${url}`);
    console.error('Error details:', error);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    // Log to file
    fileLogger.error('API_ERROR', `${method} ${url}`, { method, url, error });
  },

  chat: (conversationId: number, message: string, response?: any) => {
    if (!API_LOGGING_ENABLED) return;
    
    console.group(`💬 Chat: Conversation ${conversationId}`);
    console.log('📝 Message:', message);
    if (response) {
      console.log('🤖 Response:', response);
      if (response.chartData) {
        console.log('📊 Chart Data in Response:', {
          type: response.chartData.type,
          hasData: !!response.chartData.data,
          dataType: typeof response.chartData.data,
          dataIsArray: Array.isArray(response.chartData.data),
          dataLength: Array.isArray(response.chartData.data) ? response.chartData.data.length : 'N/A',
          dataSample: Array.isArray(response.chartData.data) && response.chartData.data.length > 0
            ? response.chartData.data.slice(0, 3)
            : response.chartData.data,
          dataKeys: Array.isArray(response.chartData.data) && response.chartData.data.length > 0 && typeof response.chartData.data[0] === 'object'
            ? Object.keys(response.chartData.data[0])
            : 'N/A',
          hasTitle: !!response.chartData.title,
          title: response.chartData.title,
          hasXAxisKey: !!response.chartData.xAxisKey,
          xAxisKey: response.chartData.xAxisKey,
          hasYAxisKey: !!response.chartData.yAxisKey,
          yAxisKey: response.chartData.yAxisKey,
          hasImages: !!response.chartData.images,
          imageDetails: response.chartData.images ? {
            main: {
              hasBase64: !!response.chartData.images.main_chart?.base64_data,
              hasFilename: !!response.chartData.images.main_chart?.filename,
              filename: response.chartData.images.main_chart?.filename,
              title: response.chartData.images.main_chart?.title
            },
            summary: {
              hasBase64: !!response.chartData.images.summary_chart?.base64_data,
              hasFilename: !!response.chartData.images.summary_chart?.filename,
              filename: response.chartData.images.summary_chart?.filename,
              title: response.chartData.images.summary_chart?.title
            }
          } : 'No images',
          fullChartData: response.chartData
        });
      } else {
        console.log('⚠️ No chartData in response');
      }
      
      // Also log sqlResults if present
      if (response.sqlResults) {
        console.log('📊 SQL Results in Response:', {
          hasSqlResults: !!response.sqlResults,
          sqlResultsType: typeof response.sqlResults,
          sqlResultsIsArray: Array.isArray(response.sqlResults),
          sqlResultsLength: Array.isArray(response.sqlResults) ? response.sqlResults.length : 'N/A',
          sqlResultsSample: Array.isArray(response.sqlResults) && response.sqlResults.length > 0
            ? response.sqlResults.slice(0, 2)
            : response.sqlResults,
          sqlResultsKeys: Array.isArray(response.sqlResults) && response.sqlResults.length > 0 && typeof response.sqlResults[0] === 'object'
            ? Object.keys(response.sqlResults[0])
            : 'N/A'
        });
      }
    }
    console.groupEnd();
    
    // Log to file
    if (response) {
      fileLogger.info('CHAT', `Conversation ${conversationId}`, { conversationId, message, response });
    }
  }
};

// Development-only logging for component renders
export const componentLogger = {
  render: (componentName: string, props: any) => {
    if (!API_LOGGING_ENABLED) return;
    
    console.group(`🎨 ${componentName} Render`);
    console.log('Props:', props);
    console.groupEnd();
  },

  chartData: (componentName: string, chartData: any) => {
    if (!API_LOGGING_ENABLED) return;
    
    console.group(`📊 ${componentName} Chart Data`);
    console.log('Chart Data:', chartData);
    if (chartData?.images) {
      console.log('Images Analysis:', {
        hasImages: true,
        main_chart: {
          title: chartData.images.main_chart?.title,
          hasBase64: !!chartData.images.main_chart?.base64_data,
          hasFilename: !!chartData.images.main_chart?.filename,
          filename: chartData.images.main_chart?.filename,
          hasError: !!chartData.images.main_chart?.error
        },
        summary_chart: {
          title: chartData.images.summary_chart?.title,
          hasBase64: !!chartData.images.summary_chart?.base64_data,
          hasFilename: !!chartData.images.summary_chart?.filename,
          filename: chartData.images.summary_chart?.filename,
          hasError: !!chartData.images.summary_chart?.error
        }
      });
    } else {
      console.log('No images in chart data');
    }
    console.groupEnd();
    
    // Log to file
    fileLogger.info('CHART_DATA', componentName, { componentName, chartData });
  }
};

// Export fileLogger for use in components
export { fileLogger };
