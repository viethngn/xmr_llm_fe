/**
 * Auto-save logs to project folder
 * This module automatically saves logs to the logs/ folder in development mode
 */

import { fileLogger } from './file-logger';

let autoSaveInterval: number | null = null;
let stopAutoSave: (() => void) | null = null;

export function startAutoSaveLogs(intervalMs: number = 300000) { // Default: every 5 minutes
  if (import.meta.env.PROD) {
    console.log('Auto-save logs disabled in production');
    return;
  }

  if (autoSaveInterval) {
    console.log('Auto-save already running');
    return;
  }

  console.log(`📝 Starting auto-save logs (every ${intervalMs / 1000} seconds)`);
  
  stopAutoSave = fileLogger.startAutoSave(intervalMs);
  
  // Also save on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fileLogger.exportAsText(`app-log-${timestamp}.log`);
    });
  }
}

export function stopAutoSaveLogs() {
  if (stopAutoSave) {
    stopAutoSave();
    stopAutoSave = null;
    autoSaveInterval = null;
  }
}

// Auto-start in development mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Start after a short delay to ensure fileLogger is initialized
  setTimeout(() => {
    startAutoSaveLogs(300000); // Every 5 minutes
  }, 2000);
}

