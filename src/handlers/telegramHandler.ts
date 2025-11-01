import { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { config, validateConfig } from '../config/environment';
import { downloadReels } from '../services/reelsDownloader';
import { generateCaption } from '../services/captionGenerator';
import * as functions from 'firebase-functions';

// Initialize bot
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN);

export const telegramWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate configuration
    validateConfig();

    // Verify webhook secret if provided
    if (config.TELEGRAM_WEBHOOK_SECRET) {
      const providedSecret = req.headers['x-telegram-bot-api-secret-token'];
      if (providedSecret !== config.TELEGRAM_WEBHOOK_SECRET) {
        functions.logger.warn('Invalid webhook secret');
        res.status(401).send('Unauthorized');
        return;
      }
    }

    const update = req.body;
    
    if (!update.message) {
      res.status(200).send('OK');
      return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';

    functions.logger.info(`Received message from ${chatId}: ${text}`);

    // Handle commands
    if (text.startsWith('/start')) {
      await handleStartCommand(chatId);
    } else if (text.startsWith('/help')) {
      await handleHelpCommand(chatId);
    } else if (isInstagramReelsUrl(text)) {
      await handleReelsDownload(chatId, text, message.message_id);
    } else if (text.startsWith('/caption ')) {
      const captionText = text.substring(9); // Remove '/caption '
      await handleCaptionGeneration(chatId, captionText, message.message_id);
    } else {
      await handleUnknownCommand(chatId);
    }

    res.status(200).send('OK');
  } catch (error) {
    functions.logger.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};

const handleStartCommand = async (chatId: number): Promise<void> => {
  const welcomeMessage = `
🎬 Welcome to Reels Downloader Bot!

I can help you with:
📥 Download Instagram Reels - Just send me a reels link
✨ Generate AI captions - Use /caption followed by your text

Commands:
/help - Show this help message
/caption <your text> - Generate optimized caption with hashtags

Just send me an Instagram reels link to download it!
  `;
  
  await bot.sendMessage(chatId, welcomeMessage);
};

const handleHelpCommand = async (chatId: number): Promise<void> => {
  const helpMessage = `
🤖 Reels Downloader Bot Help

📥 **Download Reels:**
Send me any Instagram reels link and I'll download it for you.
Example: https://www.instagram.com/reel/ABC123/

✨ **Generate Caption:**
Use: /caption <your text>
Example: /caption Amazing sunset at the beach

The bot will generate an optimized caption with relevant hashtags for maximum engagement.

Need more help? Contact the developer!
  `;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
};

const handleReelsDownload = async (chatId: number, url: string, messageId: number): Promise<void> => {
  try {
    // Send "processing" message
    const processingMsg = await bot.sendMessage(chatId, '📥 Downloading your reel... Please wait!', {
      reply_to_message_id: messageId
    });

    const result = await downloadReels(url);
    
    if (result.success && result.videoBuffer) {
      // Delete processing message
      await bot.deleteMessage(chatId, processingMsg.message_id);
      
      // Send the video
      await bot.sendVideo(chatId, result.videoBuffer, {
        caption: `✅ Downloaded successfully!\n\n🔗 Original: ${url}`,
        reply_to_message_id: messageId
      });
    } else {
      // Update processing message with error
      await bot.editMessageText(
        `❌ Failed to download reel: ${result.error || 'Unknown error'}`,
        {
          chat_id: chatId,
          message_id: processingMsg.message_id
        }
      );
    }
  } catch (error) {
    functions.logger.error('Error downloading reel:', error);
    await bot.sendMessage(chatId, '❌ Sorry, something went wrong while downloading the reel.', {
      reply_to_message_id: messageId
    });
  }
};

const handleCaptionGeneration = async (chatId: number, text: string, messageId: number): Promise<void> => {
  try {
    if (!text.trim()) {
      await bot.sendMessage(chatId, '❌ Please provide text after /caption command.\nExample: /caption Amazing sunset at the beach', {
        reply_to_message_id: messageId
      });
      return;
    }

    // Send "processing" message
    const processingMsg = await bot.sendMessage(chatId, '✨ Generating optimized caption... Please wait!', {
      reply_to_message_id: messageId
    });

    const result = await generateCaption(text);
    
    if (result.success && result.caption) {
      // Delete processing message
      await bot.deleteMessage(chatId, processingMsg.message_id);
      
      // Send the generated caption
      await bot.sendMessage(chatId, `✨ **Optimized Caption:**\n\n${result.caption}`, {
        parse_mode: 'Markdown',
        reply_to_message_id: messageId
      });
    } else {
      // Update processing message with error
      await bot.editMessageText(
        `❌ Failed to generate caption: ${result.error || 'Unknown error'}`,
        {
          chat_id: chatId,
          message_id: processingMsg.message_id
        }
      );
    }
  } catch (error) {
    functions.logger.error('Error generating caption:', error);
    await bot.sendMessage(chatId, '❌ Sorry, something went wrong while generating the caption.', {
      reply_to_message_id: messageId
    });
  }
};

const handleUnknownCommand = async (chatId: number): Promise<void> => {
  await bot.sendMessage(chatId, `
❓ I didn't understand that command.

Send me:
📥 Instagram reels link to download
✨ /caption <text> to generate optimized caption
🆘 /help for more information
  `);
};

const isInstagramReelsUrl = (text: string): boolean => {
  const instagramReelsRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/;
  return instagramReelsRegex.test(text);
};
