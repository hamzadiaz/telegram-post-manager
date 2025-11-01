# 🎬 Reels Downloader Bot

A Firebase Functions-powered Telegram bot that downloads Instagram Reels and generates AI-optimized captions with hashtags.

## ✨ Features

- 📥 **Download Instagram Reels**: Send any Instagram Reels link and get the video file
- 🤖 **AI Caption Generation**: Transform your text into engaging, optimized captions with hashtags using Google Gemini 2.5 Flash
- ⚡ **Fast & Reliable**: Built on Firebase Functions for scalability
- 🔒 **Secure**: Webhook validation and environment variable protection

## 🚀 Commands

### Download Reels
Simply send any Instagram Reels URL:
```
https://www.instagram.com/reel/ABC123/
```

### Generate AI Caption
Use the `/caption` command followed by your text:
```
/caption Amazing sunset at the beach today
```

### Other Commands
- `/start` - Welcome message and instructions
- `/help` - Show help information

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Firebase CLI
- Telegram Bot Token
- Google Gemini API Key

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
```

3. **Initialize Firebase:**
```bash
firebase login
firebase init functions
```

4. **Set Firebase environment variables:**
```bash
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
firebase functions:config:set telegram.webhook_secret="YOUR_WEBHOOK_SECRET"
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
firebase functions:config:set firebase.project_id="YOUR_PROJECT_ID"
```

5. **Build and deploy:**
```bash
npm run build
npm run deploy
```

### Local Development

1. **Start the emulator:**
```bash
npm run serve
```

2. **Set up webhook (for testing):**
Use ngrok or similar to expose your local server:
```bash
ngrok http 5001
```

Then set your bot webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.io/your-project/us-central1/webhook"}'
```

## 📁 Project Structure

```
src/
├── index.ts                 # Main Firebase Functions entry point
├── config/
│   └── environment.ts       # Environment configuration
├── handlers/
│   └── telegramHandler.ts   # Telegram webhook handler
└── services/
    ├── reelsDownloader.ts   # Instagram Reels download service
    └── captionGenerator.ts  # AI caption generation service
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather | ✅ |
| `TELEGRAM_WEBHOOK_SECRET` | Secret token for webhook validation | ❌ |
| `GEMINI_API_KEY` | Google Gemini API key for caption generation | ✅ |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | ❌ |
| `MAX_FILE_SIZE_MB` | Maximum file size for downloads (default: 50) | ❌ |
| `DOWNLOAD_TIMEOUT_MS` | Download timeout in milliseconds (default: 30000) | ❌ |

### Firebase Functions Configuration

The functions are configured with:
- **Timeout**: 540 seconds (9 minutes)
- **Memory**: 1GB
- **Runtime**: Node.js 18

## 🤖 Bot Setup

1. **Create a Telegram Bot:**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Follow the instructions to get your bot token

2. **Set Bot Commands (optional):**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Start the bot"},
      {"command": "help", "description": "Show help information"},
      {"command": "caption", "description": "Generate AI caption"}
    ]
  }'
```

## 📝 API Endpoints

### Webhook Endpoint
- **URL**: `https://your-project.cloudfunctions.net/webhook`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Telegram-Bot-Api-Secret-Token: YOUR_WEBHOOK_SECRET` (if configured)

### Health Check
- **URL**: `https://your-project.cloudfunctions.net/health`
- **Method**: GET
- **Response**: `{"status": "healthy", "timestamp": "...", "service": "reels-downloader-bot"}`

## 🚨 Limitations

- **File Size**: Maximum 50MB per download (configurable)
- **Timeout**: 9 minutes maximum processing time
- **Rate Limits**: Subject to Google Gemini API rate limits
- **Instagram**: May not work with private accounts or stories

## 🛡️ Security

- Webhook secret validation
- Environment variable protection
- Input validation and sanitization
- Error handling and logging

## 📊 Monitoring

Firebase Functions automatically provides:
- Function execution logs
- Performance metrics
- Error tracking
- Usage statistics

Access via Firebase Console → Functions → Logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the Firebase Functions logs
2. Verify your environment variables
3. Ensure your bot token is valid
4. Check Google Gemini API quota and limits

## 🔄 Updates

To update the bot:
1. Make your changes
2. Build: `npm run build`
3. Deploy: `npm run deploy`
4. Monitor logs for any issues
"# telegram-post-manager" 
