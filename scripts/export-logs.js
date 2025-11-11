#!/usr/bin/env node

/**
 * Script to export logs from localStorage to a file
 * Run this script in the browser console or use it as a Node.js script
 * 
 * Usage in browser console:
 *   Copy the contents of this file and run it
 * 
 * Or use the fileLogger directly:
 *   window.fileLogger.exportAsText('logs/app.log')
 */

// Browser version - run this in the browser console
if (typeof window !== 'undefined') {
  const exportLogsToFile = () => {
    if (!window.fileLogger) {
      console.error('fileLogger not found. Make sure the app is loaded.');
      return;
    }

    const logs = window.fileLogger.getLogs();
    const stats = window.fileLogger.getStats();
    
    // Create log content
    const timestamp = new Date().toISOString();
    const header = `# Application Logs Export
# Generated: ${timestamp}
# Total Logs: ${stats.total}
# Errors: ${stats.byLevel.error}
# Warnings: ${stats.byLevel.warn}
# Info: ${stats.byLevel.info}
# 
# ============================================
# LOGS
# ============================================

`;

    const logLines = logs.map(log => {
      const dataStr = log.data ? `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
      return `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${dataStr}`;
    });

    const content = header + logLines.join('\n\n');
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-log-${new Date().toISOString().split('T')[0]}-${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Exported ${logs.length} logs to file`);
    return content;
  };

  // Make it available globally
  window.exportLogsToFile = exportLogsToFile;
  console.log('✅ Log export function available. Run: exportLogsToFile()');
}

// Node.js version - for server-side usage
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  const fs = require('fs');
  const path = require('path');

  const exportLogsFromFile = (inputFile, outputFile) => {
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // If inputFile is provided, read from it
      // Otherwise, this would need to read from localStorage dump
      const outputPath = path.join(logsDir, outputFile || `app-log-${Date.now()}.log`);
      
      console.log(`Logs would be exported to: ${outputPath}`);
      console.log('Note: This script needs to be run in the browser to access localStorage.');
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  module.exports = { exportLogsFromFile };
}

