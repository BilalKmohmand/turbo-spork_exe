#!/bin/bash
# Quick Start Script for Academia Link Desktop App
# Run this script to start both backend and desktop app

cd "$(dirname "$0")"

echo "=========================================="
echo "  Academia Link Desktop App Launcher"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed!"
    echo "Run: npm install"
    echo "Then: cd welcome-hub-main && npm install"
    exit 1
fi

# Start backend in background
echo "🚀 Starting Backend Server..."
npx tsx -r dotenv/config server/index.ts &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5050/health > /dev/null 2>&1; then
        echo "✅ Backend is running on port 5050"
        break
    fi
    sleep 1
done

# Check if backend is actually running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check for errors above."
    exit 1
fi

echo ""
echo "🖥️  Starting Desktop App..."
cd welcome-hub-main
npm run desktop:dev

# Cleanup when desktop closes
echo ""
echo "🛑 Shutting down backend..."
kill $BACKEND_PID 2>/dev/null

echo "✅ Done!"
