import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { telegramWebhook } from './handlers/telegramHandler';

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets
const telegramBotTokenSecret = defineSecret('TELEGRAM_BOT_TOKEN');
const geminiApiKeySecret = defineSecret('GEMINI_API_KEY');

// Main webhook function for Telegram with Secret Manager
export const webhook = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
    secrets: [telegramBotTokenSecret, geminiApiKeySecret]
  })
  .https
  .onRequest(telegramWebhook);

// Health check endpoint
export const health = functions.https.onRequest((req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'reels-downloader-bot'
  });
});
