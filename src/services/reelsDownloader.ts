import { instagramGetUrl } from 'instagram-url-direct';
import axios from 'axios';
import { config } from '../config/environment';
import * as functions from 'firebase-functions';
import { URLSearchParams } from 'url';

export interface DownloadResult {
  success: boolean;
  videoBuffer?: Buffer;
  error?: string;
  metadata?: {
    title?: string;
    duration?: number;
    thumbnail?: string;
    shortcode?: string;
    owner_username?: string;
    owner_fullname?: string;
    likes?: number;
    is_verified?: boolean;
  };
}

export const downloadReels = async (url: string): Promise<DownloadResult> => {
  try {
    functions.logger.info(`Starting instagram-url-direct download for URL: ${url}`);
    
    // Validate URL
    if (!isValidInstagramUrl(url)) {
      return { success: false, error: 'Invalid Instagram URL' };
    }

    // Extract shortcode from URL
    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return { success: false, error: 'Could not extract shortcode from URL' };
    }

    functions.logger.info(`Extracted shortcode: ${shortcode}`);

    // Get video URL using instagram-url-direct with enhanced headers to mimic local environment
    functions.logger.info('Using instagram-url-direct to get video URL...');
    let result;
    
    try {
      // Set up environment to mimic local conditions
      const originalUserAgent = process.env.HTTP_USER_AGENT;
      process.env.HTTP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      result = await instagramGetUrl(url);
      
      // Restore original user agent
      if (originalUserAgent) {
        process.env.HTTP_USER_AGENT = originalUserAgent;
      } else {
        delete process.env.HTTP_USER_AGENT;
      }
      
    } catch (error) {
      functions.logger.warn('instagram-url-direct failed, trying with different approach:', error);
      
      // If 401 error, try with clean URL format first
      if (error instanceof Error && error.message.includes('401')) {
        functions.logger.info('Trying with clean URL format due to 401 error...');
        
        try {
          const cleanUrl = `https://www.instagram.com/reel/${shortcode}/`;
          result = await instagramGetUrl(cleanUrl);
          functions.logger.info('Clean URL format worked!');
        } catch (cleanError) {
          functions.logger.warn('Clean URL also failed, trying local headers method:', cleanError);
          const localResult = await downloadReelsWithLocalHeaders(url);
          if (localResult.success) {
            return localResult;
          }
          
                 functions.logger.warn('Local headers method also failed, trying GraphQL approach');
                 const graphqlResult = await downloadReelsGraphQL(url);
                 if (graphqlResult.success) {
                   return graphqlResult;
                 }
                 
                 functions.logger.warn('GraphQL method also failed, trying direct scraping');
                 return await downloadReelsDirect(url);
        }
      } else {
        throw error;
      }
    }
    
    if (!result || !result.url_list || result.url_list.length === 0) {
      functions.logger.error('instagram-url-direct returned no video URLs');
      return { 
        success: false, 
        error: 'Could not extract video URL - reel might be private, deleted, or temporarily unavailable' 
      };
    }

    const videoUrl = result.url_list[0]; // Get the first (usually best quality) video URL
    functions.logger.info(`Got video URL from instagram-url-direct: ${videoUrl.substring(0, 100)}...`);

    // Log additional metadata
    if (result.post_info) {
      functions.logger.info(`Post info - Owner: ${result.post_info.owner_username}, Likes: ${result.post_info.likes}, Verified: ${result.post_info.is_verified}`);
    }

    // Download the video from the URL provided by instagram-url-direct
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: config.DOWNLOAD_TIMEOUT_MS,
      maxContentLength: config.MAX_FILE_SIZE_MB * 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const videoBuffer = Buffer.from(videoResponse.data);
    
    functions.logger.info(`Successfully downloaded video using instagram-url-direct, size: ${videoBuffer.length} bytes`);

    return {
      success: true,
      videoBuffer,
      metadata: {
        shortcode,
        title: `Instagram Reel ${shortcode}`,
        owner_username: result.post_info?.owner_username,
        owner_fullname: result.post_info?.owner_fullname,
        likes: result.post_info?.likes,
        is_verified: result.post_info?.is_verified
      }
    };

  } catch (error) {
    functions.logger.error('Error downloading reel with instagram-url-direct:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return { success: false, error: 'Download timeout - the reel might be too large or connection is slow' };
      } else if (error.message.includes('maxContentLength')) {
        return { success: false, error: `File too large - maximum size is ${config.MAX_FILE_SIZE_MB}MB` };
      } else if (error.message.includes('Network Error') || error.message.includes('ENOTFOUND')) {
        return { success: false, error: 'Network error - please try again later' };
      } else if (error.message.includes('Request failed with status code 404')) {
        return { success: false, error: 'Reel not found - it might be deleted or private' };
      } else if (error.message.includes('Request failed with status code 403')) {
        return { success: false, error: 'Access denied - the reel might be private' };
      } else if (error.message.includes('private') || error.message.includes('Private')) {
        return { success: false, error: 'This reel is private and cannot be downloaded' };
      } else if (error.message.includes('Post not found') || error.message.includes('not found')) {
        return { success: false, error: 'Reel not found - please check the URL and try again' };
      }
    }
    
    return { 
      success: false, 
      error: 'Failed to download reel - it might be private, deleted, or temporarily unavailable' 
    };
  }
};

// Alternative method using direct axios with local-like headers
const downloadReelsWithLocalHeaders = async (url: string): Promise<DownloadResult> => {
  try {
    functions.logger.info('Trying instagram-url-direct with local-like environment...');
    
    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return { success: false, error: 'Could not extract shortcode from URL' };
    }

    // Create a custom axios instance with headers that mimic local environment
    const localAxios = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    // Override the default axios for instagram-url-direct
    const originalAxios = (global as any).axios;
    (global as any).axios = localAxios;

    try {
      const result = await instagramGetUrl(url);
      
      // Restore original axios
      if (originalAxios) {
        (global as any).axios = originalAxios;
      }

      if (result && result.url_list && result.url_list.length > 0) {
        const videoUrl = result.url_list[0];
        functions.logger.info(`Local-like headers worked! Got video URL: ${videoUrl.substring(0, 100)}...`);

        // Download the video
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: config.DOWNLOAD_TIMEOUT_MS,
          maxContentLength: config.MAX_FILE_SIZE_MB * 1024 * 1024,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.instagram.com/'
          }
        });

        const videoBuffer = Buffer.from(videoResponse.data);
        functions.logger.info(`Successfully downloaded video with local headers, size: ${videoBuffer.length} bytes`);

        return {
          success: true,
          videoBuffer,
          metadata: {
            shortcode,
            title: `Instagram Reel ${shortcode}`,
            owner_username: result.post_info?.owner_username,
            owner_fullname: result.post_info?.owner_fullname,
            likes: result.post_info?.likes,
            is_verified: result.post_info?.is_verified
          }
        };
      }
    } catch (error) {
      // Restore original axios
      if (originalAxios) {
        (global as any).axios = originalAxios;
      }
      throw error;
    }

    return { success: false, error: 'No video URLs found with local headers' };
    
  } catch (error) {
    functions.logger.error('Local headers method failed:', error);
    return { success: false, error: 'Local headers method failed' };
  }
};

// Enhanced version with retry logic
export const downloadReelsWithRetry = async (url: string, maxRetries: number = 2): Promise<DownloadResult> => {
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      functions.logger.info(`Download attempt ${attempt}/${maxRetries} for URL: ${url}`);
      
      const result = await downloadReels(url);
      
      if (result.success) {
        if (attempt > 1) {
          functions.logger.info(`Download succeeded on attempt ${attempt}`);
        }
        return result;
      } else {
        lastError = result.error || 'Unknown error';
        
        // Don't retry for certain errors
        if (result.error?.includes('private') || 
            result.error?.includes('not found') || 
            result.error?.includes('Invalid URL')) {
          return result;
        }
        
        if (attempt < maxRetries) {
          functions.logger.warn(`Attempt ${attempt} failed: ${result.error}. Retrying...`);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      functions.logger.error(`Attempt ${attempt} threw error:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return { 
    success: false, 
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}` 
  };
};

const isValidInstagramUrl = (url: string): boolean => {
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+/;
  return instagramRegex.test(url);
};

const extractShortcode = (url: string): string | null => {
  const match = url.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
};

// GraphQL approach using Instagram's official API (like instagram-url-direct does)
const downloadReelsGraphQL = async (url: string): Promise<DownloadResult> => {
  try {
    functions.logger.info('Trying GraphQL approach as fallback...');
    
    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return { success: false, error: 'Could not extract shortcode' };
    }

    // First get CSRF token
    const csrfResponse = await axios.get('https://www.instagram.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const setCookieHeader = csrfResponse.headers['set-cookie'];
    if (!setCookieHeader || setCookieHeader.length === 0) {
      throw new Error('CSRF token not found in response headers');
    }

    const csrfCookie = setCookieHeader[0];
    const csrfToken = csrfCookie.split(';')[0].replace('csrftoken=', '');
    
    functions.logger.info(`Got CSRF token: ${csrfToken.substring(0, 10)}...`);

    // Make GraphQL request
    const graphqlUrl = 'https://www.instagram.com/graphql/query';
    const documentId = '9510064595728286';
    
    const postData = new URLSearchParams({
      'variables': JSON.stringify({
        'shortcode': shortcode,
        'fetch_tagged_user_count': null,
        'hoisted_comment_id': null,
        'hoisted_reply_id': null
      }),
      'doc_id': documentId
    });

    const graphqlResponse = await axios.post(graphqlUrl, postData, {
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Requested-With': 'XMLHttpRequest',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Referer': `https://www.instagram.com/p/${shortcode}/`,
        'Cookie': csrfCookie
      },
      timeout: 15000
    });

    const data = graphqlResponse.data;
    if (!data.data?.xdt_shortcode_media) {
      throw new Error('Only posts/reels supported, check if your link is valid');
    }

    const mediaData = data.data.xdt_shortcode_media;
    let videoUrl = null;

    // Check if it's a video
    if (mediaData.is_video && mediaData.video_url) {
      videoUrl = mediaData.video_url;
    } else if (mediaData.__typename === 'XDTGraphSidecar') {
      // Handle sidecar (multiple media)
      const edges = mediaData.edge_sidecar_to_children?.edges || [];
      for (const edge of edges) {
        if (edge.node.is_video && edge.node.video_url) {
          videoUrl = edge.node.video_url;
          break;
        }
      }
    }

    if (!videoUrl) {
      return { success: false, error: 'No video found in this post' };
    }

    functions.logger.info(`GraphQL found video URL: ${videoUrl.substring(0, 100)}...`);

    // Download the video
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: config.DOWNLOAD_TIMEOUT_MS,
      maxContentLength: config.MAX_FILE_SIZE_MB * 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.instagram.com/'
      }
    });

    const videoBuffer = Buffer.from(videoResponse.data);
    functions.logger.info(`GraphQL method success, size: ${videoBuffer.length} bytes`);

    return {
      success: true,
      videoBuffer,
      metadata: {
        shortcode,
        title: `Instagram Reel ${shortcode}`,
        owner_username: mediaData.owner?.username,
        owner_fullname: mediaData.owner?.full_name,
        likes: mediaData.edge_media_preview_like?.count,
        is_verified: mediaData.owner?.is_verified
      }
    };

  } catch (error) {
    functions.logger.error('GraphQL method failed:', error);
    return { success: false, error: 'GraphQL method failed' };
  }
};

// Direct scraping fallback method when instagram-url-direct fails
const downloadReelsDirect = async (url: string): Promise<DownloadResult> => {
  try {
    functions.logger.info('Trying direct scraping method as fallback...');
    
    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return { success: false, error: 'Could not extract shortcode' };
    }

    // Try multiple approaches to get the video URL
    const approaches = [
      `https://www.instagram.com/p/${shortcode}/`,
      `https://www.instagram.com/reel/${shortcode}/`,
      url // original URL
    ];

    for (const testUrl of approaches) {
      try {
        functions.logger.info(`Trying direct scraping with URL: ${testUrl}`);
        
        const response = await axios.get(testUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
          },
          timeout: 15000
        });

        // Look for video URLs in the response using improved patterns
        let videoUrl = null;
        const htmlContent = response.data;
        
        // Pattern 1: Look for video_url in JSON
        const videoUrlMatch = htmlContent.match(/"video_url":"([^"]+)"/);
        if (videoUrlMatch) {
          videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          functions.logger.info(`Found video_url: ${videoUrl.substring(0, 100)}...`);
        }

        // Pattern 2: Look for video_versions array
        if (!videoUrl) {
          const videoVersionsMatch = htmlContent.match(/"video_versions":\s*\[\s*\{\s*"width":\s*\d+,\s*"height":\s*\d+,\s*"url":\s*"([^"]+)"/);
          if (videoVersionsMatch) {
            videoUrl = videoVersionsMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
            functions.logger.info(`Found video_versions URL: ${videoUrl.substring(0, 100)}...`);
          }
        }

        // Pattern 3: Look for playback_url
        if (!videoUrl) {
          const playbackMatch = htmlContent.match(/"playback_url":"([^"]+)"/);
          if (playbackMatch) {
            videoUrl = playbackMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
            functions.logger.info(`Found playback_url: ${videoUrl.substring(0, 100)}...`);
          }
        }

        // Pattern 4: Look for direct MP4 URLs
        if (!videoUrl) {
          const mp4Match = htmlContent.match(/https:\/\/[^"'\s]*\.mp4[^"'\s]*/);
          if (mp4Match && mp4Match[0].includes('instagram') || mp4Match[0].includes('fbcdn')) {
            videoUrl = mp4Match[0];
            functions.logger.info(`Found direct MP4: ${videoUrl.substring(0, 100)}...`);
          }
        }

        if (videoUrl && videoUrl.startsWith('http') && videoUrl.includes('.mp4')) {
          // Download the video
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: config.DOWNLOAD_TIMEOUT_MS,
            maxContentLength: config.MAX_FILE_SIZE_MB * 1024 * 1024,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.instagram.com/'
            }
          });

          const videoBuffer = Buffer.from(videoResponse.data);
          functions.logger.info(`Direct scraping success, size: ${videoBuffer.length} bytes`);

          return {
            success: true,
            videoBuffer,
            metadata: {
              shortcode,
              title: `Instagram Reel ${shortcode}`
            }
          };
        }
      } catch (error) {
        functions.logger.warn(`Direct scraping failed for ${testUrl}:`, error);
        continue; // Try next URL
      }
    }

    return { success: false, error: 'All direct scraping methods failed - reel might be private or unavailable' };
    
  } catch (error) {
    functions.logger.error('Error in direct scraping method:', error);
    return { success: false, error: 'Direct scraping method failed' };
  }
};

// Backup method using fallback approach
export const downloadReelsWithFallback = async (url: string): Promise<DownloadResult> => {
  try {
    // First try the main method with retry
    const result = await downloadReelsWithRetry(url);
    if (result.success) {
      return result;
    }

    // If main method fails, try with different URL format
    functions.logger.info('Main method failed, trying fallback approach');
    
    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return { success: false, error: 'Could not extract shortcode from URL' };
    }

    // Try direct approach with different URL format
    const directUrl = `https://www.instagram.com/p/${shortcode}/`;
    const fallbackResult = await downloadReels(directUrl);
    
    return fallbackResult;
    
  } catch (error) {
    functions.logger.error('Error in downloadReelsWithFallback:', error);
    return { success: false, error: 'All download methods failed' };
  }
};