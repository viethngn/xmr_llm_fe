import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export function logWriterPlugin(): Plugin {
  return {
    name: 'log-writer',
    configureServer(server) {
      // Add middleware BEFORE the proxy (so it intercepts /api/logs first)
      server.middlewares.use((req, res, next) => {
        // Only handle POST requests to /api/logs
        if (req.url === '/api/logs' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const { level, category, message, logData, timestamp } = data;

              // Create log entry
              const logEntry = {
                timestamp: timestamp || new Date().toISOString(),
                level: level || 'log',
                category: category || 'UNKNOWN',
                message: message || '',
                data: logData || null
              };

              // Format log line
              const dataStr = logEntry.data ? `\n  Data: ${JSON.stringify(logEntry.data, null, 2)}` : '';
              const logLine = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.category}] ${logEntry.message}${dataStr}\n`;

              // Get or create today's log file
              const today = new Date().toISOString().split('T')[0];
              const logFile = path.join(LOGS_DIR, `app-${today}.log`);

              // Append to log file
              fs.appendFileSync(logFile, logLine, 'utf8');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, file: logFile }));
            } catch (error: any) {
              console.error('Error writing log:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
        } else {
          // Not our endpoint, continue to next middleware
          next();
        }
      });
    }
  };
}

