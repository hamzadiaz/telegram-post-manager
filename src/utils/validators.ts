export class Validators {
  
  /**
   * Validates Instagram URL format
   */
  static isValidInstagramUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+/;
    return instagramRegex.test(url.trim());
  }

  /**
   * Validates Telegram user ID
   */
  static isValidTelegramUserId(userId: any): boolean {
    return typeof userId === 'number' && userId > 0;
  }

  /**
   * Validates text length for caption generation
   */
  static isValidCaptionText(text: string, maxLength: number = 1000): boolean {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    return trimmed.length > 0 && trimmed.length <= maxLength;
  }

  /**
   * Sanitizes text input to prevent injection attacks
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  /**
   * Validates file size
   */
  static isValidFileSize(sizeInBytes: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return sizeInBytes > 0 && sizeInBytes <= maxSizeBytes;
  }

  /**
   * Validates URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extracts Instagram post ID from URL
   */
  static extractInstagramPostId(url: string): string | null {
    if (!this.isValidInstagramUrl(url)) return null;
    
    const match = url.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validates webhook secret
   */
  static validateWebhookSecret(provided: string, expected: string): boolean {
    if (!expected) return true; // If no secret is configured, allow all
    return provided === expected;
  }

  /**
   * Validates environment configuration
   */
  static validateEnvironmentConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.TELEGRAM_BOT_TOKEN) {
      errors.push('TELEGRAM_BOT_TOKEN is required');
    }
    
    if (!config.GEMINI_API_KEY) {
      errors.push('GEMINI_API_KEY is required');
    }
    
    if (config.MAX_FILE_SIZE_MB && (isNaN(config.MAX_FILE_SIZE_MB) || config.MAX_FILE_SIZE_MB <= 0)) {
      errors.push('MAX_FILE_SIZE_MB must be a positive number');
    }
    
    if (config.DOWNLOAD_TIMEOUT_MS && (isNaN(config.DOWNLOAD_TIMEOUT_MS) || config.DOWNLOAD_TIMEOUT_MS <= 0)) {
      errors.push('DOWNLOAD_TIMEOUT_MS must be a positive number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates caption style
   */
  static isValidCaptionStyle(style: string): boolean {
    const validStyles = ['casual', 'professional', 'funny', 'motivational', 'trendy'];
    return validStyles.includes(style.toLowerCase());
  }

  /**
   * Validates hashtag format
   */
  static isValidHashtag(hashtag: string): boolean {
    if (!hashtag || typeof hashtag !== 'string') return false;
    
    const hashtagRegex = /^#[a-zA-Z0-9_]+$/;
    return hashtagRegex.test(hashtag) && hashtag.length <= 100;
  }

  /**
   * Extracts and validates hashtags from text
   */
  static extractValidHashtags(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex) || [];
    
    return matches
      .filter(tag => this.isValidHashtag(tag))
      .map(tag => tag.toLowerCase())
      .slice(0, 30); // Limit to 30 hashtags
  }
}
