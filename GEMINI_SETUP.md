# 🤖 Google Gemini API Setup Guide

This guide will help you set up Google Gemini API for the Reels Downloader Bot.

## 🚀 Getting Your Gemini API Key

### Step 1: Access Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account

### Step 2: Create API Key
1. Click on "Get API key" in the left sidebar
2. Click "Create API key"
3. Choose "Create API key in new project" or select an existing project
4. Copy your API key (it starts with `AIza...`)

### Step 3: Configure Your Bot
1. Add the API key to your environment variables:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

2. Or add it to your `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. For Firebase Functions, set it using:
   ```bash
   firebase functions:config:set gemini.api_key="your_api_key_here"
   ```

## 🔒 Security Best Practices

### API Key Security
- **Never commit your API key to version control**
- Store it securely in environment variables
- Use Firebase Functions config for production
- Rotate your API key regularly

### Usage Limits
- Gemini 2.0 Flash has generous free tier limits
- Monitor your usage in Google AI Studio
- Set up billing alerts if needed

## 💰 Pricing Information

### Free Tier (as of 2024)
- **Gemini 2.0 Flash**: 1,500 requests per day
- **Rate Limit**: 15 requests per minute
- **Context Window**: Up to 1M tokens

### Paid Tier
- Pay-per-use pricing
- Higher rate limits
- Priority access

## 🛠️ Testing Your Setup

### Test API Key
```bash
curl -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello, Gemini!"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY"
```

### Expected Response
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Hello! How can I help you today?"
          }
        ],
        "role": "model"
      }
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues

#### "API key not valid"
- Check if your API key is correct
- Ensure there are no extra spaces
- Verify the API key hasn't been restricted

#### "Quota exceeded"
- Check your daily usage in Google AI Studio
- Wait for quota reset (daily)
- Consider upgrading to paid tier

#### "Model not found"
- Ensure you're using the correct model name: `gemini-2.0-flash-exp`
- Check if the model is available in your region

#### "Safety filter triggered"
- The content was filtered by Gemini's safety systems
- Try rephrasing your input
- Avoid potentially harmful content

## 📊 Monitoring Usage

### Google AI Studio Dashboard
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Check "API usage" section
3. Monitor daily requests and tokens

### Firebase Functions Logs
```bash
firebase functions:log --only webhook
```

## 🔄 Migration from OpenAI

If you're migrating from OpenAI:

1. **Remove OpenAI dependency**:
   ```bash
   npm uninstall openai
   ```

2. **Install Gemini SDK**:
   ```bash
   npm install @google/generative-ai
   ```

3. **Update environment variables**:
   - Remove `OPENAI_API_KEY`
   - Add `GEMINI_API_KEY`

4. **Update Firebase config**:
   ```bash
   firebase functions:config:unset openai
   firebase functions:config:set gemini.api_key="your_key"
   ```

## 🌟 Benefits of Gemini 2.0 Flash

- **Faster responses** than GPT-3.5
- **Lower latency** for real-time applications
- **Better multilingual support**
- **More cost-effective** for high-volume usage
- **Generous free tier** for development

## 📞 Support

If you need help:
- Check [Google AI documentation](https://ai.google.dev/)
- Visit [Google AI Studio Help](https://aistudio.google.com/help)
- Review Firebase Functions logs for errors
