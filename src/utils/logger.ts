import * as functions from 'firebase-functions';

export class Logger {
  private static instance: Logger;
  private enableConsole: boolean = process.env.NODE_ENV !== 'production';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string, data?: any): void {
    const logData = { message, data, timestamp: new Date().toISOString() };
    functions.logger.info(logData);
    
    if (this.enableConsole) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  public error(message: string, error?: any): void {
    const logData = { 
      message, 
      error: error?.message || error, 
      stack: error?.stack,
      timestamp: new Date().toISOString() 
    };
    functions.logger.error(logData);
    
    if (this.enableConsole) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  }

  public warn(message: string, data?: any): void {
    const logData = { message, data, timestamp: new Date().toISOString() };
    functions.logger.warn(logData);
    
    if (this.enableConsole) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  public debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const logData = { message, data, timestamp: new Date().toISOString() };
      functions.logger.debug(logData);
      
      if (this.enableConsole) {
        console.debug(`[DEBUG] ${message}`, data || '');
      }
    }
  }

  public logUserAction(userId: number, action: string, details?: any): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  public logBotResponse(chatId: number, responseType: string, success: boolean, details?: any): void {
    this.info(`Bot response: ${responseType}`, {
      chatId,
      responseType,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

export const logger = Logger.getInstance();
