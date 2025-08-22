import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/ui/data-table";
import XmRChart from "@/components/charts/xmr-chart";
import { Copy, Download, Search, BarChart3, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  error?: string | null;
}

export default function MessageList({ messages, isLoading, error }: MessageListProps) {
  const { toast } = useToast();

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

  const renderChart = (chartData: any) => {
    if (!chartData) return null;

    switch (chartData.type) {
      case 'xmr':
        return <XmRChart data={chartData.data} insights={chartData.insights} />;
      default:
        return null;
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
                <p className={message.role === 'user' ? 'text-primary-foreground' : 'text-slate-700'}>
                  {message.content}
                </p>
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
              {message.role === 'assistant' && message.queryResults && Array.isArray(message.queryResults) && message.queryResults.length > 0 && (
                <Card className="p-4 border-slate-200">
                  <DataTable 
                    data={message.queryResults} 
                    maxRows={10}
                  />
                  
                  <div className="flex items-center space-x-3 mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {/* Handle create chart */}}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Create Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportData(message.queryResults as any[], 'query-results.csv')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Handle drill down */}}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Drill Down
                    </Button>
                  </div>

                  {/* Execution time display */}
                  {message.executionTime && (
                    <div className="mt-3 text-xs text-slate-500">
                      Query executed in {message.executionTime}s • {message.queryResults.length} rows returned
                    </div>
                  )}
                </Card>
              )}

              {/* Chart Display */}
              {message.role === 'assistant' && message.chartData && (
                <Card className="p-4 border-slate-200">
                  {renderChart(message.chartData)}
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
