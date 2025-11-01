# 🤖 Bot Communication Flow

## 📡 How Telegram Bot API Works

### 1. **Webhook Method (Production)**
```
User sends message → Telegram servers → Your Firebase Function → Bot processes → Response back to user
```

**Flow:**
1. User sends message to your bot
2. Telegram receives the message
3. Telegram sends HTTP POST request to your webhook URL
4. Your Firebase Function processes the request
5. Your bot sends response back to Telegram API
6. Telegram delivers response to user

### 2. **Polling Method (Local Testing)**
```
Your bot → Asks Telegram "Any new messages?" → Telegram responds → Bot processes → Response back
```

**Flow:**
1. Your bot continuously asks Telegram for updates
2. Telegram returns any new messages
3. Your bot processes messages locally
4. Bot sends responses back to Telegram API

---

## 🔄 Communication Architecture

### Incoming Messages (Webhook)
```javascript
// Telegram sends this to your webhook:
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 7796115316,
      "first_name": "Hamza",
      "last_name": "Diaz"
    },
    "chat": {
      "id": 7796115316,
      "type": "private"
    },
    "date": 1234567890,
    "text": "/start"
  }
}
```

### Outgoing Messages (Your Bot Response)
```javascript
// Your bot sends this to Telegram API:
const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: 7796115316,
    text: "Hello Hamza! Welcome to the Reels Downloader Bot!"
  })
});
```

---

## 🛠️ Technical Implementation

### In Your Firebase Function:
```typescript
export const webhook = functions.https.onRequest(async (req, res) => {
  // 1. Receive webhook from Telegram
  const update = req.body;
  const message = update.message;
  
  // 2. Process the message
  if (message.text === '/start') {
    // 3. Send response back to Telegram
    await bot.sendMessage(message.chat.id, 'Welcome!');
  }
  
  // 4. Acknowledge receipt to Telegram
  res.status(200).send('OK');
});
```

### Bot Instance:
```typescript
import TelegramBot from 'node-telegram-bot-api';

// This handles all API communication
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN);

// Send message
await bot.sendMessage(chatId, 'Hello!');

// Send video
await bot.sendVideo(chatId, videoBuffer);

// Send photo
await bot.sendPhoto(chatId, photoBuffer);
```

---

## 🌐 API Endpoints Used

### Telegram Bot API Endpoints:
- `POST /bot<token>/setWebhook` - Set webhook URL
- `POST /bot<token>/sendMessage` - Send text message
- `POST /bot<token>/sendVideo` - Send video file
- `POST /bot<token>/sendPhoto` - Send photo
- `GET /bot<token>/getWebhookInfo` - Check webhook status

### Your Firebase Endpoints:
- `POST /webhook` - Receives messages from Telegram
- `GET /health` - Health check endpoint

---

## 🔐 Security & Authentication

### Bot Token Authentication:
```javascript
// Every API call includes your bot token
const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
```

### Webhook Secret (Optional):
```javascript
// Telegram includes this header if you set a secret
const secret = req.headers['x-telegram-bot-api-secret-token'];
if (secret !== WEBHOOK_SECRET) {
  return res.status(401).send('Unauthorized');
}
```

---

## 📊 Message Types Handled

### Text Messages:
- Commands: `/start`, `/help`, `/caption`
- Instagram URLs: Auto-detected and processed
- Regular text: For caption generation

### File Messages:
- Photos, videos, documents (future feature)

### Callback Queries:
- Inline keyboard responses (future feature)

---

## 🚀 Local vs Production Differences

### Local Development:
```javascript
// Uses polling instead of webhooks
const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
  // Handle message directly
});
```

### Production (Firebase):
```javascript
// Uses webhooks
export const webhook = functions.https.onRequest(async (req, res) => {
  // Handle webhook payload
  const update = req.body;
  // Process and respond
});
```

---

## 🔍 Debugging Communication

### Check Webhook Status:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Test API Connection:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

### Send Test Message:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=7796115316&text=Test message"
```

---

## ⚡ Performance Considerations

### Response Time:
- Telegram expects response within 60 seconds
- Your function has 9 minutes timeout
- Use async/await for better performance

### Rate Limits:
- Telegram: 30 messages/second per bot
- Gemini API: 15 requests/minute (free tier)
- Firebase Functions: Based on your plan

### Error Handling:
```typescript
try {
  await bot.sendMessage(chatId, message);
} catch (error) {
  console.error('Failed to send message:', error);
  // Handle gracefully
}
```
