// File-based logging for frontend
// Stores logs in memory and localStorage, allows export as file

interface LogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  category: string;
  message: string;
  data?: any;
}

class FileLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Maximum logs to keep in memory
  private storageKey = 'app_logs';
  private maxStorageLogs = 500; // Maximum logs in localStorage
  private storageIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Load logs from localStorage on initialization
    this.loadFromStorage();
    
    // Save logs to localStorage periodically
    this.storageIntervalId = setInterval(() => {
      this.saveToStorage();
    }, 5000); // Every 5 seconds
  }

  // Method to stop the periodic storage saves (useful for cleanup)
  stopPeriodicSave() {
    if (this.storageIntervalId !== null) {
      clearInterval(this.storageIntervalId);
      this.storageIntervalId = null;
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
        // Keep only the most recent logs
        if (this.logs.length > this.maxStorageLogs) {
          this.logs = this.logs.slice(-this.maxStorageLogs);
        }
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      // Keep only the most recent logs for storage
      const logsToStore = this.logs.slice(-this.maxStorageLogs);
      localStorage.setItem(this.storageKey, JSON.stringify(logsToStore));
    } catch (error) {
      // If storage is full, try to clear old logs
      console.warn('Failed to save logs to storage, clearing old logs:', error);
      try {
        localStorage.removeItem(this.storageKey);
        this.logs = this.logs.slice(-100); // Keep only last 100
        localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      } catch (e) {
        console.error('Failed to clear and save logs:', e);
      }
    }
  }

  private addLog(level: LogEntry['level'], category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined // Deep clone to avoid circular references
    };

    this.logs.push(entry);

    // Keep only the most recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console
    const consoleMethod = console[level] || console.log;
    consoleMethod(`[${category}] ${message}`, data || '');

    // Write directly to server log file (only in development)
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      this.writeToServer(entry).catch(err => {
        // Silently fail - don't break the app if logging fails
        console.debug('Failed to write log to server:', err);
      });
    }
  }

  private async writeToServer(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: entry.level,
          category: entry.category,
          message: entry.message,
          logData: entry.data,
          timestamp: entry.timestamp
        })
      });
    } catch (error) {
      // Silently fail - server might not be running or endpoint might not exist
    }
  }

  log(category: string, message: string, data?: any) {
    this.addLog('log', category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.addLog('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.addLog('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.addLog('error', category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.addLog('debug', category, message, data);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs filtered by level
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get logs filtered by category
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // Clear all logs
  clear() {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
  }

  // Export logs as JSON file
  exportAsJSON(filename: string = `app-log-${new Date().toISOString().split('T')[0]}.json`) {
    const logsJson = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Export logs as text file (readable format)
  exportAsText(filename: string = `app-log-${new Date().toISOString().split('T')[0]}.log`) {
    const stats = this.getStats();
    const timestamp = new Date().toISOString();
    
    const header = `# Application Logs Export
# Generated: ${timestamp}
# Total Logs: ${stats.total}
# Errors: ${stats.byLevel.error}
# Warnings: ${stats.byLevel.warn}
# Info: ${stats.byLevel.info}
# Log: ${stats.byLevel.log}
# Debug: ${stats.byLevel.debug}
# 
# Categories: ${Object.keys(stats.byCategory).join(', ')}
# 
# ============================================
# LOGS
# ============================================

`;

    const lines = this.logs.map(log => {
      const dataStr = log.data ? `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
      return `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${dataStr}`;
    });
    
    const text = header + lines.join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return text; // Return the text content for potential server-side saving
  }
  
  // Export logs to project logs folder (saves with timestamp)
  exportToProjectLogs() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `app-log-${timestamp}.log`;
    const text = this.exportAsText(filename);
    console.log(`✅ Logs exported to: ${filename}`);
    console.log(`📁 Save this file to the project's logs/ folder`);
    console.log(`💡 Tip: Run this command to move it automatically:`);
    console.log(`   cp ~/Downloads/${filename} logs/`);
    return { filename, content: text };
  }
  
  // Auto-save logs periodically (development mode)
  startAutoSave(intervalMs: number = 60000) { // Default: every minute
    if (typeof window === 'undefined') return;
    
    const autoSave = () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `app-log-${timestamp}.log`;
      this.exportAsText(filename);
      console.log(`📝 Auto-saved logs: ${filename}`);
    };
    
    const intervalId = setInterval(autoSave, intervalMs);
    console.log(`✅ Auto-save enabled (every ${intervalMs / 1000} seconds)`);
    
    // Return function to stop auto-save
    return () => {
      clearInterval(intervalId);
      console.log('⏹️ Auto-save disabled');
    };
  }

  // Get log statistics
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        log: this.logs.filter(l => l.level === 'log').length,
        info: this.logs.filter(l => l.level === 'info').length,
        warn: this.logs.filter(l => l.level === 'warn').length,
        error: this.logs.filter(l => l.level === 'error').length,
        debug: this.logs.filter(l => l.level === 'debug').length,
      },
      byCategory: {} as Record<string, number>,
      oldest: this.logs[0]?.timestamp,
      newest: this.logs[this.logs.length - 1]?.timestamp,
    };

    // Count by category
    this.logs.forEach(log => {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
export const fileLogger = new FileLogger();

// Helper function to integrate with existing console logging
export function logToFile(level: LogEntry['level'], category: string, message: string, data?: any) {
  fileLogger[level](category, message, data);
}

// Make fileLogger available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).fileLogger = fileLogger;
}

