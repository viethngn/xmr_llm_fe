import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, FileText, AlertCircle } from "lucide-react";
import { fileLogger } from "@/lib/file-logger";

export function LogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'log' | 'debug'>('all');
  const [category, setCategory] = useState<string>('all');

  const refreshLogs = () => {
    const allLogs = fileLogger.getLogs();
    setLogs(allLogs);
    setStats(fileLogger.getStats());
  };

  useEffect(() => {
    refreshLogs();
    // Refresh every 2 seconds
    const interval = setInterval(refreshLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (category !== 'all' && log.category !== category) return false;
    return true;
  });

  const categories = Array.from(new Set(logs.map(log => log.category)));

  const handleExportJSON = () => {
    fileLogger.exportAsJSON();
  };

  const handleExportText = () => {
    fileLogger.exportAsText();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      fileLogger.clear();
      refreshLogs();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Application Logs</h3>
            <p className="text-sm text-slate-600">View and export application logs</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportText}>
              <FileText className="w-4 h-4 mr-2" />
              Export .log
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Export .json
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded">
              <div className="text-sm text-slate-600">Total Logs</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <div className="text-sm text-red-600">Errors</div>
              <div className="text-2xl font-bold text-red-800">{stats.byLevel.error}</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-sm text-yellow-600">Warnings</div>
              <div className="text-2xl font-bold text-yellow-800">{stats.byLevel.warn}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm text-blue-600">Info</div>
              <div className="text-2xl font-bold text-blue-800">{stats.byLevel.info}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Level:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="log">Log</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="border rounded-lg max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No logs found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log, index) => (
                <div key={index} className="p-3 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                        <span className="text-xs text-slate-500">{log.timestamp}</span>
                      </div>
                      <div className="text-sm font-medium">{log.message}</div>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer">View data</summary>
                          <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-xs text-slate-500">
          <p>Logs are stored in browser localStorage and persist across sessions.</p>
          <p>Access logs programmatically: <code className="bg-slate-100 px-1 rounded">window.fileLogger</code></p>
        </div>
      </div>
    </Card>
  );
}

