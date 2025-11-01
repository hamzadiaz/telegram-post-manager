export const config = {
  TELEGRAM_BOT_TOKEN: (process.env.TELEGRAM_BOT_TOKEN || '').trim(),
  TELEGRAM_WEBHOOK_SECRET: (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim(),
  GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),
  FIREBASE_PROJECT_ID: 'reelsmanager-50367',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
  DOWNLOAD_TIMEOUT_MS: parseInt(process.env.DOWNLOAD_TIMEOUT_MS || '30000'),
};

// Validate required environment variables
export const validateConfig = (): void => {
  const required = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY'];
  const missing = required.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
