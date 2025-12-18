/**
 * Auto-save logs to project folder
 * This module provides optional log export functionality.
 * File downloads are DISABLED by default - logs go to browser console instead.
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

// Auto-save is DISABLED - logs are output to browser console instead
// To manually export logs, use: window.fileLogger.exportAsText() in the browser console
// To enable auto-save, uncomment the code below:
//
// if (import.meta.env.DEV && typeof window !== 'undefined') {
//   setTimeout(() => {
//     startAutoSaveLogs(300000); // Every 5 minutes
//   }, 2000);
// }

