#!/bin/bash

# Script to move log files from Downloads to logs folder

LOGS_DIR="$(dirname "$0")/../logs"
DOWNLOADS_DIR="$HOME/Downloads"

echo "📁 Moving log files from Downloads to logs/ folder..."

# Find and move all app-log files
find "$DOWNLOADS_DIR" -name "app-log-*.log" -type f -exec mv {} "$LOGS_DIR" \;
find "$DOWNLOADS_DIR" -name "app-log-*.json" -type f -exec mv {} "$LOGS_DIR" \;

echo "✅ Done! Check the logs/ folder for your log files."

