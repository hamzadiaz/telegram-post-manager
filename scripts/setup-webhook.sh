#!/bin/bash

# Reels Downloader Bot - Webhook Setup Script
# This script helps set up the Telegram webhook

set -e

echo "🤖 Telegram Bot Webhook Setup"
echo "=============================="

# Check if required environment variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN environment variable is not set."
    echo "Please set it first:"
    echo "export TELEGRAM_BOT_TOKEN=your_bot_token_here"
    exit 1
fi

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ FIREBASE_PROJECT_ID environment variable is not set."
    echo "Please set it first:"
    echo "export FIREBASE_PROJECT_ID=your_project_id_here"
    exit 1
fi

# Construct webhook URL
WEBHOOK_URL="https://${FIREBASE_PROJECT_ID}.cloudfunctions.net/webhook"

echo "🔗 Setting webhook URL: $WEBHOOK_URL"

# Set webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$WEBHOOK_URL\"}")

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook set successfully!"
    echo ""
    echo "📋 Webhook Info:"
    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.'
else
    echo "❌ Failed to set webhook:"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Your bot should now respond to messages."
echo ""
echo "💡 Test your bot:"
echo "1. Open Telegram"
echo "2. Find your bot"
echo "3. Send /start"
echo ""
echo "📊 Monitor logs:"
echo "firebase functions:log --only webhook"
