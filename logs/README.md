# Logs Directory

This directory contains exported application logs.

## How to Export Logs to This Folder

### Method 1: Automatic Log Watcher (Easiest) ⭐

**Logs will automatically appear in this folder!**

1. In a separate terminal, run:
   ```bash
   npm run dev:logs
   ```
2. This watches your Downloads folder and automatically moves any `app-log-*.log` or `app-log-*.json` files here
3. Logs are auto-saved every 5 minutes in development mode, so they'll appear automatically!

### Method 2: Quick Manual Export

1. Open the browser console (F12)
2. Run: `window.fileLogger.exportToProjectLogs()`
3. The file downloads to your Downloads folder
4. If you have the log watcher running (`npm run dev:logs`), it will automatically move here
5. Otherwise, run this command to move it manually:
   ```bash
   ./scripts/move-logs.sh
   ```
   Or manually:
   ```bash
   cp ~/Downloads/app-log-*.log logs/
   ```

### Method 4: Manual Export

1. Open the browser console (F12)
2. Run one of these commands:

```javascript
// Export as text file (.log)
window.fileLogger.exportAsText('app.log')

// Export as JSON file
window.fileLogger.exportAsJSON('app.json')

// Export with auto-generated filename
window.fileLogger.exportToProjectLogs()
```
3. Move the downloaded file to this `logs/` folder

### Method 2: Using the Log Viewer Component

If the LogViewer component is added to your UI:
1. Open the Log Viewer
2. Click "Export .log" or "Export .json"
3. The file will download to your Downloads folder
4. Move it to this `logs/` directory

### Method 3: Programmatic Export

```javascript
// Get logs as text
const logs = window.fileLogger.getLogs();
const stats = window.fileLogger.getStats();

// Export with custom filename
window.fileLogger.exportAsText('logs/my-custom-log.log');
```

## Log File Format

Log files are saved in plain text format with:
- Header with statistics
- Timestamped entries
- Log level (ERROR, WARN, INFO, LOG, DEBUG)
- Category
- Message
- Data (if available)

## Automatic Logging

The following events are automatically logged:
- API requests and responses
- API errors
- Chat messages and responses
- Chart data processing
- Component renders (in development mode)

## Log Storage

Logs are stored in:
- **Memory**: Up to 1000 entries (fast access)
- **localStorage**: Up to 500 entries (persists across sessions)

## Clearing Logs

```javascript
// Clear all logs
window.fileLogger.clear()
```

