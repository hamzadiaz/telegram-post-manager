# 🔐 Setting Up Google Cloud Secret Manager

## Prerequisites
Make sure you have gcloud CLI installed and authenticated:
```bash
gcloud auth login
gcloud config set project reelsmanager-50367
```

## Enable Secret Manager API
```bash
gcloud services enable secretmanager.googleapis.com
```

## Create Secrets

### 1. Create Telegram Bot Token Secret
```bash
echo "8263009865:AAEPvA3pg0RPF3oa2tKbtN7VKfxHYmVQkn0" | gcloud secrets create TELEGRAM_BOT_TOKEN --data-file=-
```

### 2. Create Gemini API Key Secret (replace with your actual key)
```bash
echo "your_gemini_api_key_here" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

### 3. Grant Firebase Functions Access to Secrets
```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe reelsmanager-50367 --format="value(projectNumber)")

# Grant access to Telegram bot token
gcloud secrets add-iam-policy-binding TELEGRAM_BOT_TOKEN \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Grant access to Gemini API key
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Verify Secrets
```bash
# List all secrets
gcloud secrets list

# Test access to secrets
gcloud secrets versions access latest --secret="TELEGRAM_BOT_TOKEN"
gcloud secrets versions access latest --secret="GEMINI_API_KEY"
```

## For Local Testing
For local testing, you can set environment variables:
```bash
# PowerShell
$env:TELEGRAM_BOT_TOKEN="8263009865:AAEPvA3pg0RPF3oa2tKbtN7VKfxHYmVQkn0"
$env:GEMINI_API_KEY="your_gemini_api_key_here"

# Or use gcloud to get secrets
$env:TELEGRAM_BOT_TOKEN=(gcloud secrets versions access latest --secret="TELEGRAM_BOT_TOKEN")
$env:GEMINI_API_KEY=(gcloud secrets versions access latest --secret="GEMINI_API_KEY")
```

## Deploy with Secrets
When you deploy, Firebase Functions will automatically access the secrets:
```bash
firebase deploy --only functions
```
