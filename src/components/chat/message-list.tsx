import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/ui/data-table";
import XmRChart from "@/components/charts/xmr-chart";
import BarChartComponent from "@/components/charts/bar-chart";
import PieChartComponent from "@/components/charts/pie-chart";
import LineChartComponent from "@/components/charts/line-chart";
import UniversalChart from "@/components/charts/universal-chart";
import ChartImageDisplay from "@/components/charts/chart-image-display";
import ChartErrorBoundary from "@/components/charts/chart-error-boundary";
import { Copy, Download, FileText, BarChart3, Image, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { componentLogger, fileLogger } from "@/lib/logger";
import type { Message } from "@/types/shared";
import { useState } from "react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  error?: string | null;
}

export default function MessageList({ messages, isLoading, error }: MessageListProps) {
  const { toast } = useToast();
  const [showStaticCharts, setShowStaticCharts] = useState<{ [messageId: number]: boolean }>({});

  // Log message data for debugging
  componentLogger.render('MessageList', { 
    messagesCount: messages.length, 
    isLoading, 
    error 
  });
  
  // Log chart data in messages
  messages.forEach((message, index) => {
    if (message.chartData) {
      componentLogger.chartData(`Message ${index}`, message.chartData);
      console.log(`🔍 Message ${index} Full Structure:`, {
        messageId: message.id,
        role: message.role,
        hasChartData: !!message.chartData,
        chartDataType: message.chartData?.type,
        chartDataLength: Array.isArray(message.chartData?.data) ? message.chartData.data.length : 'N/A',
        hasSqlResults: !!message.sqlResults,
        sqlResultsLength: Array.isArray(message.sqlResults) ? message.sqlResults.length : 'N/A',
        sqlResultsSample: Array.isArray(message.sqlResults) && message.sqlResults.length > 0 
          ? message.sqlResults.slice(0, 2) 
          : 'N/A',
        fullMessage: message
      });
    }
  });

  const handleCopySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
    toast({
      title: "SQL Copied",
      description: "The SQL query has been copied to your clipboard.",
    });
  };

  const handleExportData = (data: any[], filename?: string) => {
    // Convert data to CSV and download
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  // Helper function to transform insights object to string array for chart components
  const transformInsightsToStrings = (insights: any): string[] => {
    if (!insights) return [];
    
    // If already an array, return as-is
    if (Array.isArray(insights)) return insights;
    
    // If it's an object with ChartData.insights structure, transform to strings
    if (typeof insights === 'object') {
      const result: string[] = [];
      
      if (insights.processStable !== undefined) {
        result.push(insights.processStable ? 'Process is stable' : 'Process shows variation');
      }
      
      if (insights.outOfControlPoints && insights.outOfControlPoints.length > 0) {
        result.push(`${insights.outOfControlPoints.length} out-of-control points detected`);
      }
      
      if (insights.averageValue !== undefined) {
        result.push(`Average value: ${insights.averageValue.toLocaleString()}`);
      }
      
      if (insights.averageRange !== undefined) {
        result.push(`Average range: ${insights.averageRange.toLocaleString()}`);
      }
      
      if (insights.processCapability) {
        result.push(`Process capability: ${insights.processCapability}`);
      }
      
      if (insights.recommendations && Array.isArray(insights.recommendations)) {
        result.push(...insights.recommendations);
      }
      
      return result;
    }
    
    return [];
  };

  const formatMessageContent = (content: string) => {
    // Split by newlines and process each line
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Check for code blocks (lines starting with ```)
      if (line.trim().startsWith('```')) {
        return (
          <div key={index} className="bg-slate-100 rounded-lg p-3 my-2 font-mono text-sm">
            <code className="whitespace-pre-wrap">{line.replace('```', '')}</code>
          </div>
        );
      }
      
      // Check for bullet points (lines starting with - or *)
      if (line.trim().match(/^[-*]\s/)) {
        return (
          <div key={index} className="flex items-start my-1">
            <span className="text-slate-500 mr-2 mt-1">•</span>
            <span className="flex-1">{line.replace(/^[-*]\s/, '')}</span>
          </div>
        );
      }
      
      // Check for numbered lists (lines starting with numbers)
      if (line.trim().match(/^\d+\.\s/)) {
        return (
          <div key={index} className="flex items-start my-1">
            <span className="text-slate-500 mr-2 mt-1 font-medium">
              {line.match(/^\d+/)?.[0]}.
            </span>
            <span className="flex-1">{line.replace(/^\d+\.\s/, '')}</span>
          </div>
        );
      }
      
      // Check for headers (lines starting with #)
      if (line.trim().startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s/, '');
        const className = level === 1 ? 'text-lg font-bold' : level === 2 ? 'text-base font-semibold' : 'text-sm font-medium';
        return (
          <div key={index} className={`${className} mt-4 mb-2 ${index > 0 ? 'pt-2' : ''}`}>
            {text}
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className={index > 0 ? 'mt-2' : ''}>
          {line}
        </p>
      );
    });
  };

  const renderChart = (chartData: any, message?: Message) => {
    try {
      if (!chartData) return null;
      
      // Helper function to find data from previous messages in the conversation
      const findDataFromPreviousMessages = (): any[] | null => {
        if (!message || !messages || messages.length === 0) return null;
        
        // Find the current message's index
        const currentIndex = messages.findIndex(m => m.id === message.id);
        if (currentIndex === -1) return null;
        
        // Look backwards through previous messages for sqlResults
        for (let i = currentIndex - 1; i >= 0; i--) {
          const prevMessage = messages[i];
          if (prevMessage?.sqlResults && 
              Array.isArray(prevMessage.sqlResults) && 
              prevMessage.sqlResults.length > 0) {
            console.log(`✅ MessageList: Found data in previous message ${prevMessage.id}`, {
              messageId: prevMessage.id,
              sqlResultsLength: prevMessage.sqlResults.length,
              sqlResultsSample: prevMessage.sqlResults.slice(0, 2)
            });
            fileLogger.info('MESSAGE_LIST', `Found data in previous message ${prevMessage.id}`, {
              currentMessageId: message.id,
              previousMessageId: prevMessage.id,
              sqlResultsLength: prevMessage.sqlResults.length
            });
            return prevMessage.sqlResults;
          }
        }
        
        return null;
      };
      
      // Comprehensive debug logging
      console.log('🔍 CHART DEBUG - Rendering chart with data:', {
        type: chartData.type,
        typeType: typeof chartData.type,
        typeValue: JSON.stringify(chartData.type),
        typeStrictEqual: chartData.type === 'xmr',
        typeLooseEqual: chartData.type == 'xmr',
        title: chartData.title,
        dataLength: chartData.data?.length,
        hasImages: !!chartData.images,
        hasStatistics: !!chartData.statistics,
        hasInsights: !!chartData.insights,
        imageTypes: chartData.images ? {
          main: chartData.images.main_chart?.type,
          summary: chartData.images.summary_chart?.type
        } : 'No images',
        fullChartData: chartData
      });

      // Detect XmR charts by multiple criteria
      const isXmRChart = chartData.type === 'xmr' || 
                        chartData.type === 'XmR' ||
                        chartData.type === 'XMR' ||
                        (chartData.images && (
                          chartData.images.main_chart?.type?.includes('xmr') ||
                          chartData.images.summary_chart?.type?.includes('xmr') ||
                          chartData.images.main_chart?.title?.toLowerCase().includes('xmr') ||
                          chartData.images.summary_chart?.title?.toLowerCase().includes('xmr')
                        )) ||
                        (chartData.title && chartData.title.toLowerCase().includes('xmr')) ||
                        (chartData.statistics && chartData.statistics.individualLimits) ||
                        (chartData.insights && chartData.insights.processStable !== undefined) ||
                        // Additional data structure checks
                        (chartData.data && Array.isArray(chartData.data) && 
                         chartData.data.some((item: any) => 
                           item && typeof item === 'object' && 
                           (item.UCL !== undefined || item.LCL !== undefined || item.average !== undefined)
                         ));

      console.log('🔍 XmR Detection:', {
        typeCheck: chartData.type === 'xmr',
        imageCheck: chartData.images && (
          chartData.images.main_chart?.type?.includes('xmr') ||
          chartData.images.summary_chart?.type?.includes('xmr')
        ),
        titleCheck: chartData.title && chartData.title.toLowerCase().includes('xmr'),
        statisticsCheck: chartData.statistics && chartData.statistics.individualLimits,
        insightsCheck: chartData.insights && chartData.insights.processStable !== undefined,
        dataStructureCheck: chartData.data && Array.isArray(chartData.data) && 
                           chartData.data.some((item: any) => 
                             item && typeof item === 'object' && 
                             (item.UCL !== undefined || item.LCL !== undefined || item.average !== undefined)
                           ),
        finalResult: isXmRChart
      });

      // Use XmRChart for XmR charts (detected by multiple criteria)
      if (isXmRChart) {
        console.log('✅ Using XmRChart component');
        
        // Apply the same data source selection logic for XmRChart
        // Prioritize message.sqlResults over chartData.data since sqlResults is the actual query result
        let xmrDataToUse: any = null;
        
        if (message?.sqlResults && Array.isArray(message.sqlResults) && message.sqlResults.length > 0) {
          console.log('✅ XmRChart: Using message.sqlResults as primary data source');
          fileLogger.info('MESSAGE_LIST', 'XmRChart using message.sqlResults as primary data source', { 
            sqlResultsLength: message.sqlResults.length 
          });
          xmrDataToUse = message.sqlResults;
        } else if (chartData.data && Array.isArray(chartData.data) && chartData.data.length > 0) {
          console.log('✅ XmRChart: Using chartData.data as data source');
          fileLogger.info('MESSAGE_LIST', 'XmRChart using chartData.data as data source', { 
            chartDataLength: chartData.data.length 
          });
          xmrDataToUse = chartData.data;
        } else {
          const previousData = findDataFromPreviousMessages();
          if (previousData) {
            console.log('✅ XmRChart: Using data from previous message');
            fileLogger.info('MESSAGE_LIST', 'XmRChart using data from previous message', { 
              dataLength: previousData.length 
            });
            xmrDataToUse = previousData;
          }
        }
        
        if (!xmrDataToUse || (Array.isArray(xmrDataToUse) && xmrDataToUse.length === 0)) {
          console.error('❌ XmRChart: No data available - skipping render');
          fileLogger.error('MESSAGE_LIST', 'XmRChart no data available - skipping render');
          return null;
        }
        
        return <XmRChart data={xmrDataToUse} title={chartData.title} insights={transformInsightsToStrings(chartData.insights)} />;
      }

      // Use specialized components for each chart type
      // Try to determine chart type from multiple sources
      let chartType = chartData.type;
      
      // Normalize the initial type
      if (chartType) {
        chartType = String(chartType).toLowerCase().trim();
        // If it's empty after trim, treat as missing
        if (chartType === '') {
          chartType = null;
        }
      }
      
      // Track if we have a valid non-default type
      const hasValidType = chartType && chartType !== 'bar';
      
      // If type is missing or is the default 'bar', try to infer from image metadata (type and filename)
      // This allows us to override a default 'bar' with the actual chart type from the image
      if (!hasValidType) {
        // Check image type first (most reliable)
        if (chartData.images?.main_chart?.type) {
          const imageType = String(chartData.images.main_chart.type).toLowerCase();
          if (imageType.includes('line')) {
            chartType = 'line';
          } else if (imageType.includes('pie')) {
            chartType = 'pie';
          } else if (imageType.includes('xmr')) {
            chartType = 'xmr';
          } else if (imageType.includes('bar') && !chartType) {
            chartType = 'bar';
          }
        }
        
        // Also check filename if type still not determined
        if ((!chartType || chartType === 'bar') && chartData.images?.main_chart?.filename) {
          const filename = String(chartData.images.main_chart.filename).toLowerCase();
          if (filename.includes('line')) {
            chartType = 'line';
          } else if (filename.includes('pie')) {
            chartType = 'pie';
          } else if (filename.includes('xmr')) {
            chartType = 'xmr';
          } else if (filename.includes('bar') && !chartType) {
            chartType = 'bar';
          }
        }
      }
      
      // If still missing, try to infer from title
      if (!chartType || chartType === 'bar') {
        if (chartData.title) {
          const titleLower = String(chartData.title).toLowerCase();
          if (titleLower.includes('line chart') || titleLower.includes('trend') || titleLower.includes('line')) {
            chartType = 'line';
          } else if (titleLower.includes('pie chart') || titleLower.includes('pie')) {
            chartType = 'pie';
          } else if (titleLower.includes('bar chart') && !chartType) {
            chartType = 'bar';
          }
        }
      }
      
      // Default to 'bar' only if we still can't determine
      chartType = chartType || 'bar';
      
      // Log the chart type determination
      console.log('🔍 Chart type determination:', {
        chartDataType: chartData.type,
        imageType: chartData.images?.main_chart?.type,
        title: chartData.title,
        determinedType: chartType
      });
      fileLogger.debug('MESSAGE_LIST', 'Chart type determination', {
        chartDataType: chartData.type,
        imageType: chartData.images?.main_chart?.type,
        title: chartData.title,
        determinedType: chartType
      });
      // Log message.sqlResults BEFORE data source selection
      console.log('🔍 MessageList: Checking data sources BEFORE selection', {
        messageId: message?.id,
        hasSqlResults: !!message?.sqlResults,
        sqlResultsType: typeof message?.sqlResults,
        sqlResultsIsArray: Array.isArray(message?.sqlResults),
        sqlResultsLength: Array.isArray(message?.sqlResults) ? message.sqlResults.length : 'N/A',
        sqlResultsSample: Array.isArray(message?.sqlResults) && message.sqlResults.length > 0 
          ? message.sqlResults.slice(0, 2) 
          : message?.sqlResults,
        hasChartData: !!chartData.data,
        chartDataType: typeof chartData.data,
        chartDataIsArray: Array.isArray(chartData.data),
        chartDataLength: Array.isArray(chartData.data) ? chartData.data.length : 'N/A',
        chartDataSample: Array.isArray(chartData.data) && chartData.data.length > 0 
          ? chartData.data.slice(0, 2) 
          : chartData.data,
        // Check for data in other possible locations
        fullMessageKeys: message ? Object.keys(message) : [],
        fullChartDataKeys: chartData ? Object.keys(chartData) : [],
        chartDataStringified: JSON.stringify(chartData).substring(0, 500) // First 500 chars
      });
      fileLogger.debug('MESSAGE_LIST', 'Checking data sources BEFORE selection', {
        messageId: message?.id,
        hasSqlResults: !!message?.sqlResults,
        sqlResultsLength: Array.isArray(message?.sqlResults) ? message.sqlResults.length : 'N/A',
        chartDataLength: Array.isArray(chartData.data) ? chartData.data.length : 'N/A',
        fullMessageKeys: message ? Object.keys(message) : [],
        fullChartDataKeys: chartData ? Object.keys(chartData) : []
      });
      
      const routingInfo = {
        chartType,
        hasData: !!chartData.data,
        dataType: typeof chartData.data,
        isArray: Array.isArray(chartData.data),
        dataLength: Array.isArray(chartData.data) ? chartData.data.length : 'N/A',
        dataSample: Array.isArray(chartData.data) && chartData.data.length > 0 
          ? chartData.data.slice(0, 3) 
          : chartData.data,
        fullChartData: chartData
      };
      console.log('🔍 MessageList: Routing to specialized chart component', routingInfo);
      fileLogger.debug('MESSAGE_LIST', 'Routing to specialized chart component', routingInfo);
      
      // Prioritize message.sqlResults over chartData.data since sqlResults is the actual query result for this message
      // chartData.data might contain stale or incorrect data from previous queries
      let chartDataToUse: any = null;
      
      // First priority: Use message.sqlResults if available (this is the actual query result)
      if (message?.sqlResults && Array.isArray(message.sqlResults) && message.sqlResults.length > 0) {
        console.log('✅ MessageList: Using message.sqlResults as primary data source (actual query result)');
        fileLogger.info('MESSAGE_LIST', 'Using message.sqlResults as primary data source', { 
          sqlResultsLength: message.sqlResults.length,
          sqlResultsSample: message.sqlResults.slice(0, 2)
        });
        chartDataToUse = message.sqlResults;
      } 
      // Second priority: Use chartData.data if sqlResults is not available
      else if (chartData.data && Array.isArray(chartData.data) && chartData.data.length > 0) {
        console.log('✅ MessageList: Using chartData.data as data source (sqlResults not available)');
        fileLogger.info('MESSAGE_LIST', 'Using chartData.data as data source', { 
          chartDataLength: chartData.data.length,
          chartDataSample: chartData.data.slice(0, 2)
        });
        chartDataToUse = chartData.data;
      }
      // Third priority: Try to find data from previous messages in the conversation
      // This handles the case where backend generates static charts but doesn't send raw data
      else {
        const previousData = findDataFromPreviousMessages();
        if (previousData) {
          console.log('✅ MessageList: Using data from previous message (backend sent static charts but no raw data)');
          fileLogger.info('MESSAGE_LIST', 'Using data from previous message', { 
            dataLength: previousData.length,
            dataSample: previousData.slice(0, 2),
            currentMessageId: message?.id
          });
          chartDataToUse = previousData;
        } else {
          console.error('❌ MessageList: No data available in message.sqlResults, chartData.data, or previous messages - skipping chart render');
          fileLogger.error('MESSAGE_LIST', 'No data available in message.sqlResults, chartData.data, or previous messages - skipping chart render', { 
            chartData, 
            hasSqlResults: !!message?.sqlResults,
            sqlResultsLength: Array.isArray(message?.sqlResults) ? message.sqlResults.length : 0,
            hasChartData: !!chartData.data,
            chartDataLength: Array.isArray(chartData.data) ? chartData.data.length : 0,
            messageId: message?.id,
            totalMessages: messages.length
          });
          // Return null to prevent rendering chart with no data
          return null;
        }
      }
      
      // Ensure chartDataToUse is not null before proceeding
      if (!chartDataToUse || (Array.isArray(chartDataToUse) && chartDataToUse.length === 0)) {
        console.error('❌ MessageList: chartDataToUse is null or empty after data source selection');
        fileLogger.error('MESSAGE_LIST', 'chartDataToUse is null or empty after data source selection', {
          chartData,
          message: message ? { id: message.id, hasSqlResults: !!message.sqlResults } : null,
          chartDataToUse
        });
        return null;
      }
      
      const dataSourceInfo = {
        chartDataToUse: chartDataToUse,
        chartDataToUseType: typeof chartDataToUse,
        chartDataToUseIsArray: Array.isArray(chartDataToUse),
        chartDataToUseLength: Array.isArray(chartDataToUse) ? chartDataToUse.length : 'N/A',
        hasMessage: !!message,
        hasMessageSqlResults: !!message?.sqlResults,
        messageSqlResultsType: typeof message?.sqlResults,
        messageSqlResultsIsArray: Array.isArray(message?.sqlResults),
        messageSqlResultsLength: Array.isArray(message?.sqlResults) ? message.sqlResults.length : 'N/A',
        messageSqlResultsSample: Array.isArray(message?.sqlResults) && message.sqlResults.length > 0 
          ? message.sqlResults.slice(0, 2) 
          : 'N/A',
        hasChartData: !!chartData.data,
        chartDataLength: Array.isArray(chartData.data) ? chartData.data.length : 'N/A'
      };
      console.log('🔍 MessageList: Checking data sources', dataSourceInfo);
      fileLogger.debug('MESSAGE_LIST', 'Checking data sources', dataSourceInfo);
      
      // Final safety check: Ensure chartDataToUse has valid data before rendering
      if (!chartDataToUse || (Array.isArray(chartDataToUse) && chartDataToUse.length === 0)) {
        console.error('❌ MessageList: Final safety check failed - chartDataToUse is null or empty, skipping chart render');
        fileLogger.error('MESSAGE_LIST', 'Final safety check failed - chartDataToUse is null or empty', {
          chartDataToUse,
          chartDataToUseType: typeof chartDataToUse,
          chartDataToUseIsArray: Array.isArray(chartDataToUse),
          chartDataToUseLength: Array.isArray(chartDataToUse) ? chartDataToUse.length : 'N/A',
          messageId: message?.id,
          chartType
        });
        return null;
      }
      
      // Log what we're passing to the chart component
      console.log('✅ MessageList: Passing data to chart component', {
        chartType,
        dataLength: Array.isArray(chartDataToUse) ? chartDataToUse.length : 'N/A',
        dataSample: Array.isArray(chartDataToUse) && chartDataToUse.length > 0 
          ? chartDataToUse.slice(0, 2) 
          : chartDataToUse
      });
      fileLogger.info('MESSAGE_LIST', `Passing data to ${chartType} chart component`, {
        chartType,
        dataLength: Array.isArray(chartDataToUse) ? chartDataToUse.length : 'N/A',
        dataSample: Array.isArray(chartDataToUse) && chartDataToUse.length > 0 
          ? chartDataToUse.slice(0, 2) 
          : chartDataToUse,
        xAxisKey: chartData.xAxisKey,
        yAxisKey: chartData.yAxisKey,
        title: chartData.title
      });
      
      // Route to specialized components
      switch (chartType) {
        case 'bar':
          return (
            <BarChartComponent
              data={chartDataToUse}
              title={chartData.title}
              xAxisKey={chartData.xAxisKey}
              yAxisKey={chartData.yAxisKey}
              insights={transformInsightsToStrings(chartData.insights)}
            />
          );
        
        case 'pie':
          return (
            <PieChartComponent
              data={chartDataToUse}
              title={chartData.title}
              xAxisKey={chartData.xAxisKey}
              yAxisKey={chartData.yAxisKey}
              insights={transformInsightsToStrings(chartData.insights)}
            />
          );
        
        case 'line':
          return (
            <LineChartComponent
              data={chartDataToUse}
              title={chartData.title}
              xAxisKey={chartData.xAxisKey}
              yAxisKey={chartData.yAxisKey}
              insights={transformInsightsToStrings(chartData.insights)}
            />
          );
        
        case 'table':
        default:
          // Fallback to UniversalChart for table or unknown types
          return (
            <UniversalChart
              data={chartDataToUse}
              chartType={chartType as 'line' | 'bar' | 'pie' | 'table'}
              title={chartData.title}
              xAxisKey={chartData.xAxisKey}
              yAxisKey={chartData.yAxisKey}
              insights={transformInsightsToStrings(chartData.insights)}
            />
          );
      }
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-center text-red-600">
            <p className="text-sm font-medium">Chart Rendering Error</p>
            <p className="text-xs mt-1">Failed to render chart. Check console for details.</p>
          </div>
        </Card>
      );
    }
  };

  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div key={message.id} className={`chat-message max-w-4xl ${message.role === 'user' ? 'ml-auto' : ''}`}>
          <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className={`flex-1 space-y-4 ${message.role === 'user' ? 'max-w-3xl' : ''}`}>
              <Card className={`p-4 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'border-slate-200'
              }`}>
                <div className={message.role === 'user' ? 'text-primary-foreground' : 'text-slate-700'}>
                  {formatMessageContent(message.content)}
                </div>
              </Card>

              {/* SQL Query Display */}
              {message.role === 'assistant' && message.sqlQuery && (
                <Card className="p-4 border-slate-200">
                  <div className="code-block rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-400">Generated SQL Query</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySQL(message.sqlQuery!)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <code className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                      {message.sqlQuery}
                    </code>
                  </div>
                </Card>
              )}

              {/* Data Table */}
              {message.role === 'assistant' && message.sqlResults && Array.isArray(message.sqlResults) && message.sqlResults.length > 0 && (
                <Card className="p-4 border-slate-200">
                  <DataTable 
                    data={message.sqlResults as any[]} 
                    maxRows={10}
                  />
                  
                   <div className="flex items-center space-x-3 mt-4">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleExportData(message.sqlResults as any[], 'query-results.csv')}
                     >
                       <Download className="w-4 h-4 mr-2" />
                       Export CSV
                     </Button>
                   </div>

                  {/* Execution time display */}
                  {/** Optional: executionTime not guaranteed */}
                  {false && (message as any).executionTime && (
                    <div className="mt-3 text-xs text-slate-500">
                      Query executed in {(message as any).executionTime}s • {(message as any).sqlResults.length} rows returned
                    </div>
                  )}
                </Card>
              )}

              {/* Enhanced Chart Display with Toggle */}
              {message.role === 'assistant' && message.chartData && (
                (() => {
                  // Pre-check: Only render chart card if we have data OR static images
                  const hasData = (message.sqlResults && Array.isArray(message.sqlResults) && message.sqlResults.length > 0) ||
                                  (message.chartData.data && Array.isArray(message.chartData.data) && message.chartData.data.length > 0);
                  const hasImages = message.chartData.images && 
                                    (message.chartData.images.main_chart?.base64_data || message.chartData.images.main_chart?.filename);
                  
                  // Don't render chart card if there's no data and no images
                  if (!hasData && !hasImages) {
                    console.log('⏭️ MessageList: Skipping chart card render - no data and no images', {
                      messageId: message.id,
                      hasSqlResults: !!message.sqlResults,
                      sqlResultsLength: Array.isArray(message.sqlResults) ? message.sqlResults.length : 0,
                      hasChartData: !!message.chartData.data,
                      chartDataLength: Array.isArray(message.chartData.data) ? message.chartData.data.length : 0,
                      hasImages: !!message.chartData.images
                    });
                    fileLogger.debug('MESSAGE_LIST', 'Skipping chart card render - no data and no images', {
                      messageId: message.id,
                      hasSqlResults: !!message.sqlResults,
                      sqlResultsLength: Array.isArray(message.sqlResults) ? message.sqlResults.length : 0,
                      hasChartData: !!message.chartData.data,
                      chartDataLength: Array.isArray(message.chartData.data) ? message.chartData.data.length : 0
                    });
                    return null;
                  }
                  
                  return (
                    <Card className="p-4 border-slate-200">
                      <div className="space-y-4">
                        {/* Chart Type Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm font-medium text-slate-600">
                            <BarChart3 className="h-4 w-4" />
                            <span>Chart Visualizations</span>
                          </div>
                          {message.chartData.images && (
                            <div className="flex items-center space-x-2">
                              <Button
                                variant={!showStaticCharts[message.id] ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowStaticCharts(prev => ({ ...prev, [message.id]: false }))}
                                className="flex items-center space-x-1"
                              >
                                <BarChart3 className="h-3 w-3" />
                                <span>Interactive</span>
                              </Button>
                              <Button
                                variant={showStaticCharts[message.id] ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowStaticCharts(prev => ({ ...prev, [message.id]: true }))}
                                className="flex items-center space-x-1"
                              >
                                <Image className="h-3 w-3" />
                                <span>Static Images</span>
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Interactive Chart (Default) */}
                        {!showStaticCharts[message.id] && (
                          <ChartErrorBoundary>
                            {(() => {
                              const chartComponent = renderChart(message.chartData, message);
                              // If chart component is null (no data) but static images exist, show helpful message
                              if (!chartComponent && hasImages) {
                                return (
                                  <Card className="p-4 border-amber-200 bg-amber-50">
                                    <div className="text-center text-amber-600">
                                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                                      <p className="text-sm font-medium">Interactive Chart Data Not Available</p>
                                      <p className="text-xs mt-1 mb-3">
                                        The raw data needed for interactive charts is not available, but static chart images are available.
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowStaticCharts(prev => ({ ...prev, [message.id]: true }))}
                                        className="flex items-center space-x-1 mx-auto"
                                      >
                                        <Image className="h-3 w-3" />
                                        <span>View Static Images</span>
                                      </Button>
                                    </div>
                                  </Card>
                                );
                              }
                              return chartComponent;
                            })()}
                          </ChartErrorBoundary>
                        )}

                        {/* Static Chart Images (Optional) */}
                        {showStaticCharts[message.id] && message.chartData.images && (
                          <ChartImageDisplay images={message.chartData.images} />
                        )}

                        {/* Fallback when no images available but static view requested */}
                        {showStaticCharts[message.id] && !message.chartData.images && (
                          <div className="text-center text-slate-500 py-8">
                            <Image className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Chart images are not available</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Chart data is available, but image generation is not enabled or failed.
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })()
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-slate-300 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-4xl">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <Card className="p-4 border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-slate-600 text-sm">Processing your query...</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-4xl">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-destructive rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-destructive-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <Card className="p-4 border-destructive bg-destructive/5">
              <p className="text-destructive text-sm">{error}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
