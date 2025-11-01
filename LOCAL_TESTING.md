# 🧪 Local Testing Guide

## 🚀 Method 1: Firebase Emulators + ngrok (Recommended)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
Create a `.env` file from the example:
```bash
cp env.example .env
```

Edit `.env` with your actual values:
```env
TELEGRAM_BOT_TOKEN=8263009865:AAEPvA3pg0RPF3oa2tKbtN7VKfxHYmVQkn0
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Install ngrok
```bash
# Windows (using chocolatey)
choco install ngrok

# Or download from https://ngrok.com/download
```

### Step 4: Start Local Development
```bash
# Terminal 1: Start Firebase emulators
npm run serve

# Terminal 2: Expose local server
ngrok http 5001
```

### Step 5: Set Webhook
Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`) and set webhook:

```bash
curl -X POST "https://api.telegram.org/bot8263009865:AAEPvA3pg0RPF3oa2tKbtN7VKfxHYmVQkn0/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io/reelsmanager-50367/us-central1/webhook"
  }'
```

### Step 6: Test!
- Send `/start` to your bot
- Send an Instagram Reels URL
- Try `/caption hello world`

---

## 🔧 Method 2: Direct API Testing (Without Webhooks)

### Create Test Script
Create `test-bot.js`:
```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = '8263009865:AAEPvA3pg0RPF3oa2tKbtN7VKfxHYmVQkn0';
const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
  console.log('Received:', msg);
  bot.sendMessage(msg.chat.id, 'Hello! Bot is working locally.');
});

console.log('Bot is running locally with polling...');
```

Run it:
```bash
node test-bot.js
```

---

## 🌐 Method 3: Using Postman/curl for API Testing

### Test Webhook Endpoint Directly
```bash
curl -X POST "http://localhost:5001/your-project/us-central1/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 1,
      "chat": {"id": 7796115316, "type": "private"},
      "text": "/start",
      "date": 1234567890
    }
  }'
```

### Test Caption Generation
```bash
curl -X POST "http://localhost:5001/your-project/us-central1/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 2,
      "chat": {"id": 7796115316, "type": "private"},
      "text": "/caption Amazing sunset at the beach",
      "date": 1234567890
    }
  }'
```

---

## 📊 Monitoring Local Development

### Firebase Emulator Logs
```bash
# In another terminal
firebase functions:log --only webhook
```

### Check Function Status
Visit: http://localhost:4000 (Firebase Emulator UI)

---

## 🚨 Troubleshooting Local Testing

### Common Issues:

1. **"Function not found"**
   - Make sure you built the project: `npm run build`
   - Check function name in Firebase console

2. **"Webhook not receiving messages"**
   - Verify ngrok URL is correct
   - Check if webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

3. **"Environment variables not loaded"**
   - Make sure `.env` file exists
   - Restart the emulator after changing `.env`

4. **"Gemini API errors"**
   - Verify your API key is correct
   - Check quota in Google AI Studio

---

## 🔄 Switching Between Local and Production

### For Local Testing:
```bash
# Remove webhook (use polling instead)
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Or set to local ngrok URL
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-ngrok-url.ngrok.io/project/us-central1/webhook"
```

### For Production:
```bash
# Set to production URL
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-project.cloudfunctions.net/webhook"
```
