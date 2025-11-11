#!/usr/bin/env node

/**
 * Watch Downloads folder and automatically move log files to logs/
 * Run this script alongside your dev server: npm run dev:logs
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');
const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

console.log(`📁 Watching: ${DOWNLOADS_DIR}`);
console.log(`📁 Target: ${LOGS_DIR}`);
console.log('🔄 Waiting for log files...\n');

// Function to move log files
function moveLogFiles() {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const logFiles = files.filter(file => 
      file.startsWith('app-log-') && 
      (file.endsWith('.log') || file.endsWith('.json'))
    );

    if (logFiles.length === 0) {
      return;
    }

    logFiles.forEach(file => {
      const sourcePath = path.join(DOWNLOADS_DIR, file);
      const targetPath = path.join(LOGS_DIR, file);

      try {
        // Check if file is still being written (size hasn't changed in 1 second)
        const stats = fs.statSync(sourcePath);
        const now = Date.now();
        const mtime = stats.mtimeMs;
        
        // Only move if file hasn't been modified in the last 2 seconds
        if (now - mtime > 2000) {
          // Check if target already exists
          if (fs.existsSync(targetPath)) {
            // Add timestamp to avoid overwriting
            const ext = path.extname(file);
            const name = path.basename(file, ext);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const newName = `${name}-${timestamp}${ext}`;
            const newTargetPath = path.join(LOGS_DIR, newName);
            fs.renameSync(sourcePath, newTargetPath);
            console.log(`✅ Moved: ${file} → ${newName}`);
          } else {
            fs.renameSync(sourcePath, targetPath);
            console.log(`✅ Moved: ${file} → logs/${file}`);
          }
        }
      } catch (err) {
        // File might be locked or still being written
        if (err.code !== 'ENOENT') {
          console.warn(`⚠️  Could not move ${file}: ${err.message}`);
        }
      }
    });
  } catch (err) {
    console.error(`❌ Error reading Downloads: ${err.message}`);
  }
}

// Watch Downloads folder for new files
let watchTimeout;
fs.watch(DOWNLOADS_DIR, (eventType, filename) => {
  if (filename && (filename.endsWith('.log') || filename.endsWith('.json'))) {
    // Debounce: wait 2 seconds after last change
    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      moveLogFiles();
    }, 2000);
  }
});

// Also check immediately and then periodically
moveLogFiles();
setInterval(moveLogFiles, 5000); // Check every 5 seconds

console.log('✨ Log watcher is running. Press Ctrl+C to stop.\n');

