// Telegram Bot Types
export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Instagram Types
export interface InstagramReelMetadata {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  author?: {
    username: string;
    full_name?: string;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
}

// Caption Generation Types
export interface CaptionStyle {
  name: string;
  description: string;
  temperature: number;
  keywords: string[];
}

export interface HashtagSuggestion {
  tag: string;
  popularity: 'high' | 'medium' | 'low';
  category: string;
}

// Configuration Types
export interface BotConfig {
  telegram: {
    botToken: string;
    webhookSecret?: string;
  };
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  app: {
    maxFileSizeMB: number;
    downloadTimeoutMS: number;
    enableLogging: boolean;
  };
}

// Error Types
export interface BotError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: number;
  chatId?: number;
}
