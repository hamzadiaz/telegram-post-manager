import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment';
import * as functions from 'firebase-functions';

export interface CaptionResult {
  success: boolean;
  caption?: string;
  error?: string;
  metadata?: {
    hashtags?: string[];
    wordCount?: number;
    sentiment?: string;
    model?: string;
  };
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

export const generateCaption = async (originalText: string): Promise<CaptionResult> => {
  try {
    functions.logger.info(`Generating caption with Gemini for text: ${originalText.substring(0, 100)}...`);

    if (!originalText.trim()) {
      return { success: false, error: 'Empty text provided' };
    }

    if (originalText.length > 1000) {
      return { success: false, error: 'Text too long - maximum 1000 characters' };
    }

    // Get the generative model (Gemini 2.5 Flash)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500,
      }
    });

    const prompt = createCaptionPrompt(originalText);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedCaption = response.text();
    
    if (!generatedCaption) {
      return { success: false, error: 'No caption generated' };
    }

    // Extract hashtags and metadata
    const hashtags = extractHashtags(generatedCaption);
    const wordCount = generatedCaption.split(/\s+/).length;
    const sentiment = analyzeSentiment(generatedCaption);

    functions.logger.info(`Successfully generated caption with ${hashtags.length} hashtags using Gemini`);

    return {
      success: true,
      caption: generatedCaption.trim(),
      metadata: {
        hashtags,
        wordCount,
        sentiment,
        model: 'gemini-2.5-flash-lite'
      }
    };

  } catch (error) {
    functions.logger.error('Error generating caption with Gemini:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return { success: false, error: 'Gemini API key not configured or invalid' };
      } else if (error.message.includes('quota') || error.message.includes('QUOTA')) {
        return { success: false, error: 'API quota exceeded - please try again later' };
      } else if (error.message.includes('rate') || error.message.includes('RATE_LIMIT')) {
        return { success: false, error: 'Rate limit exceeded - please wait a moment' };
      } else if (error.message.includes('SAFETY')) {
        return { success: false, error: 'Content filtered by safety settings - try different text' };
      }
    }
    
    return { 
      success: false, 
      error: 'Failed to generate caption - please try again' 
    };
  }
};

const createCaptionPrompt = (originalText: string): string => {
  return `
You are an expert Instagram Reels content creator specializing in TERRIFYING and SCARY content that goes viral. Your page is all about spine-chilling, bone-chilling, and absolutely terrifying things that will keep viewers on the edge of their seats.

Original text: "${originalText}"

CONTENT FOCUS: This is for a page dedicated to TERRIFYING content - scary places, haunted locations, creepy mysteries, spine-chilling facts, horrifying discoveries, and nightmare-inducing content.

Requirements:
1. START with a TERRIFYING hook that immediately grabs attention (e.g., "This place will haunt your nightmares forever..." or "What they found here will chill you to the bone...")
2. Use SCARY and CAPTIVATING language with words like: terrifying, spine-chilling, bone-chilling, nightmare-inducing, haunting, horrifying, blood-curdling, petrifying
3. Build suspense and mystery throughout the caption
4. Add strategic emojis: 😱💀👻🔥⚡️🌙🖤💯 (don't overuse)
5. Create urgency and curiosity that makes people NEED to watch
6. END with an engaging QUESTION that encourages comments (e.g., "Would you dare visit this place?" or "What's the scariest thing you've ever encountered?")
7. Keep the main caption under 120 words for maximum impact
8. Use line breaks for dramatic effect

MANDATORY HASHTAGS (ALWAYS include these first):
#viralreel #viral #scary #mrincredible #mrincrediblefiles

Then add 10-15 additional relevant hashtags focusing on:
- Horror/scary content (#horror #creepy #haunted #nightmare #terrifying)
- Viral content (#fyp #foryou #trending #explore)
- Engagement (#reels #instagram #viral)
- Specific to content (location-based, mystery, etc.)

Format: 
[Terrifying hook opening line]

[2-3 lines building suspense and describing the scary content]

[Engaging question to drive comments]

[All hashtags starting with the mandatory ones]
  `.trim();
};

const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
};

const analyzeSentiment = (text: string): string => {
  // Simple sentiment analysis based on keywords
  const positiveWords = [
    'amazing', 'awesome', 'great', 'love', 'beautiful', 'perfect', 'incredible', 
    'fantastic', 'wonderful', 'excited', 'happy', 'joy', 'blessed', 'grateful',
    'inspiring', 'motivating', 'success', 'achievement', 'celebration', 'win'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disappointed', 
    'frustrated', 'angry', 'sad', 'difficult', 'problem', 'issue', 'struggle'
  ];
  
  const lowerText = text.toLowerCase();
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Alternative caption generation with different styles
export const generateCaptionWithStyle = async (
  originalText: string, 
  style: 'casual' | 'professional' | 'funny' | 'motivational' | 'trendy'
): Promise<CaptionResult> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: style === 'funny' ? 0.9 : 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500,
      }
    });

           const stylePrompts = {
             casual: 'Create a casually TERRIFYING caption that feels like sharing a scary story with friends. Use everyday language but make it spine-chilling and relatable to horror fans.',
             professional: 'Create a professionally SCARY caption suitable for horror documentary content. Maintain authority while being absolutely terrifying and informative about scary facts.',
             funny: 'Create a humorously CREEPY caption that combines dark humor with scary elements. Use witty wordplay about horror themes that will make people laugh nervously and share.',
             motivational: 'Create an inspiringly DARK caption that motivates through fear and mystery. Include powerful quotes about facing fears or conquering nightmares.',
             trendy: 'Create a trendy HORROR caption using current internet slang, viral scary phrases, and Gen Z horror language. Stay up-to-date with horror trends and memes.'
           };

           const prompt = `
       You are an expert Instagram Reels content creator specializing in TERRIFYING and SCARY content with a ${style} approach. Your page is dedicated to spine-chilling, nightmare-inducing content that goes viral.
       
       Original text: "${originalText}"
       
       Style: ${style}
       Style guidance: ${stylePrompts[style]}
       
       CONTENT FOCUS: This is for a TERRIFYING content page - scary places, haunted locations, creepy mysteries, horrifying discoveries.
       
       Requirements:
       1. Perfect the ${style} tone while maintaining SCARY/TERRIFYING theme
       2. START with a spine-chilling hook that grabs attention immediately
       3. Use terrifying language: spine-chilling, bone-chilling, nightmare-inducing, haunting, horrifying
       4. Add strategic scary emojis: 😱💀👻🔥⚡️🌙🖤💯
       5. Build suspense and mystery throughout
       6. END with an engaging QUESTION to drive comments
       7. Keep main caption under 120 words for impact
       8. Use line breaks for dramatic effect
       
       MANDATORY HASHTAGS (ALWAYS include first):
       #viralreel #viral #scary #mrincredible #mrincrediblefiles
       
       Then add 10-15 additional hashtags: #horror #creepy #haunted #nightmare #terrifying #fyp #foryou #trending #explore #reels #instagram
       
       The caption should be absolutely TERRIFYING while maintaining the ${style} approach and encourage genuine scary interaction.
           `.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedCaption = response.text();
    
    if (!generatedCaption) {
      return { success: false, error: 'No caption generated' };
    }

    const hashtags = extractHashtags(generatedCaption);
    const wordCount = generatedCaption.split(/\s+/).length;
    const sentiment = analyzeSentiment(generatedCaption);

    return {
      success: true,
      caption: generatedCaption.trim(),
      metadata: {
        hashtags,
        wordCount,
        sentiment,
        model: 'gemini-2.5-flash-lite'
      }
    };

  } catch (error) {
    functions.logger.error('Error generating styled caption with Gemini:', error);
    return { success: false, error: 'Failed to generate styled caption' };
  }
};

// Generate multiple caption variations
export const generateCaptionVariations = async (
  originalText: string,
  count: number = 3
): Promise<CaptionResult[]> => {
  try {
    const styles: Array<'casual' | 'professional' | 'funny' | 'motivational' | 'trendy'> = 
      ['casual', 'funny', 'motivational', 'trendy', 'professional'];
    
    const selectedStyles = styles.slice(0, Math.min(count, styles.length));
    
    const promises = selectedStyles.map(style => generateCaptionWithStyle(originalText, style));
    const results = await Promise.all(promises);
    
    return results;
    
  } catch (error) {
    functions.logger.error('Error generating caption variations:', error);
    return [{ success: false, error: 'Failed to generate caption variations' }];
  }
};