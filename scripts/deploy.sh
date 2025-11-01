#!/bin/bash

# Reels Downloader Bot - Deployment Script
# This script builds and deploys the Firebase Functions

set -e

echo "🚀 Starting deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Your bot is now live!"
    echo ""
    echo "Next steps:"
    echo "1. Set up your Telegram webhook:"
    echo "   curl -X POST \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook\" \\"
    echo "        -H \"Content-Type: application/json\" \\"
    echo "        -d '{\"url\": \"https://YOUR_PROJECT.cloudfunctions.net/webhook\"}'"
    echo ""
    echo "2. Test your bot by sending it a message!"
    echo ""
    echo "📊 Monitor your functions:"
    echo "   firebase functions:log"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
