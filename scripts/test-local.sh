#!/bin/bash

# Reels Downloader Bot - Local Testing Script
# This script helps test the bot locally using Firebase emulators

set -e

echo "🧪 Starting local testing environment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if ngrok is available (optional but recommended)
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok found - you can use it to expose your local server"
    NGROK_AVAILABLE=true
else
    echo "⚠️  ngrok not found - you'll need to manually expose your local server for webhook testing"
    NGROK_AVAILABLE=false
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    echo "📁 Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. Make sure to set environment variables manually."
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Start Firebase emulators
echo "🚀 Starting Firebase emulators..."
echo "Functions will be available at: http://localhost:5001"

if [ "$NGROK_AVAILABLE" = true ]; then
    echo ""
    echo "💡 To test webhooks:"
    echo "1. In another terminal, run: ngrok http 5001"
    echo "2. Copy the HTTPS URL from ngrok"
    echo "3. Set webhook: curl -X POST \"https://api.telegram.org/bot\$TELEGRAM_BOT_TOKEN/setWebhook\" -d '{\"url\": \"https://YOUR_NGROK_URL.ngrok.io/YOUR_PROJECT/us-central1/webhook\"}'"
    echo ""
fi

# Start emulators
firebase emulators:start --only functions
