import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/ui/data-table";
import XmRChart from "@/components/charts/xmr-chart";
import UniversalChart from "@/components/charts/universal-chart";
import ChartImageDisplay from "@/components/charts/chart-image-display";
import ChartErrorBoundary from "@/components/charts/chart-error-boundary";
import { Copy, Download, FileText, BarChart3, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { componentLogger } from "@/lib/logger";
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

  const renderChart = (chartData: any) => {
    try {
      if (!chartData) return null;
      
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
        return <XmRChart data={chartData.data} title={chartData.title} insights={chartData.insights} />;
      }

      // Use UniversalChart for all other chart types
      // Provide fallback for undefined/null chart types
      const chartType = chartData.type || 'bar';
      console.log('Using chart type:', chartType);
      
      return (
        <UniversalChart
          data={chartData.data}
          chartType={chartType as 'line' | 'bar' | 'pie' | 'table'}
          title={chartData.title}
          xAxisKey={chartData.xAxisKey}
          yAxisKey={chartData.yAxisKey}
          insights={chartData.insights}
        />
      );
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
                        {renderChart(message.chartData)}
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
