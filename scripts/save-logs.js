#!/usr/bin/env node

/**
 * Script to save logs to the logs/ folder
 * This script can be run to generate log files from localStorage data
 * 
 * Usage:
 *   node scripts/save-logs.js
 * 
 * Or in browser console, run:
 *   window.saveLogsToProject()
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function saveLogsToFile(logs, stats, format = 'text') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = format === 'json' ? 'json' : 'log';
  const filename = `app-log-${timestamp}.${extension}`;
  const filepath = path.join(LOGS_DIR, filename);

  if (format === 'json') {
    const content = JSON.stringify({ stats, logs }, null, 2);
    fs.writeFileSync(filepath, content, 'utf8');
  } else {
    const header = `# Application Logs Export
# Generated: ${new Date().toISOString()}
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

    const lines = logs.map(log => {
      const dataStr = log.data ? `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
      return `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${dataStr}`;
    });

    const content = header + lines.join('\n\n');
    fs.writeFileSync(filepath, content, 'utf8');
  }

  console.log(`✅ Logs saved to: ${filepath}`);
  return filepath;
}

// Browser version - inject this into the page
const browserScript = `
(function() {
  if (typeof window === 'undefined') return;
  
  window.saveLogsToProject = function(format = 'text') {
    if (!window.fileLogger) {
      console.error('fileLogger not found');
      return;
    }
    
    const logs = window.fileLogger.getLogs();
    const stats = window.fileLogger.getStats();
    
    // Create the log content
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'json' ? 'json' : 'log';
    const filename = \`app-log-\${timestamp}.\${extension}\`;
    
    let content, mimeType;
    
    if (format === 'json') {
      content = JSON.stringify({ stats, logs }, null, 2);
      mimeType = 'application/json';
    } else {
      const header = \`# Application Logs Export
# Generated: \${new Date().toISOString()}
# Total Logs: \${stats.total}
# Errors: \${stats.byLevel.error}
# Warnings: \${stats.byLevel.warn}
# Info: \${stats.byLevel.info}
# Log: \${stats.byLevel.log}
# Debug: \${stats.byLevel.debug}
# 
# Categories: \${Object.keys(stats.byCategory).join(', ')}
# 
# ============================================
# LOGS
# ============================================

\`;
      
      const lines = logs.map(log => {
        const dataStr = log.data ? \`\\n  Data: \${JSON.stringify(log.data, null, 2)}\` : '';
        return \`[\${log.timestamp}] [\${log.level.toUpperCase()}] [\${log.category}] \${log.message}\${dataStr}\`;
      });
      
      content = header + lines.join('\\n\\n');
      mimeType = 'text/plain';
    }
    
    // Download the file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(\`✅ Logs exported: \${filename}\`);
    console.log(\`📁 Please move this file to the project's logs/ folder\`);
    console.log(\`   Or use: cp ~/Downloads/\${filename} logs/\`);
    
    return { filename, content, stats, logs };
  };
  
  console.log('✅ saveLogsToProject() function available');
  console.log('   Usage: saveLogsToProject() or saveLogsToProject("json")');
})();
`;

// If running in Node.js (not in browser)
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  // Check if logs data file exists (from browser export)
  const logsDataPath = path.join(LOGS_DIR, 'logs-data.json');
  
  if (fs.existsSync(logsDataPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(logsDataPath, 'utf8'));
      saveLogsToFile(data.logs || [], data.stats || {}, 'text');
      saveLogsToFile(data.logs || [], data.stats || {}, 'json');
    } catch (error) {
      console.error('Error reading logs data:', error);
    }
  } else {
    console.log('No logs data file found. Run this in the browser console:');
    console.log(browserScript);
  }
  
  module.exports = { saveLogsToFile, browserScript };
}

