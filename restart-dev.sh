#!/bin/bash

echo "🛑 Stopping dev server..."
# Kill any running Next.js dev server
pkill -f "next dev" 2>/dev/null || true

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🚀 Starting dev server..."
npm run dev
