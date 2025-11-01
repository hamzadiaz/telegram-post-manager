declare module 'instagram-url-direct' {
  export interface InstagramResult {
    results_number: number;
    post_info: {
      owner_username: string;
      owner_fullname: string;
      is_verified: boolean;
      is_private: boolean;
      likes: number;
      is_ad: boolean;
    };
    url_list: string[];
    media_details: {
      type: 'video' | 'image';
      dimensions: { 
        height: string; 
        width: string;
      };
      video_view_count: number;
      url: string;
      thumbnail: string;
    }[];
  }

  export function instagramGetUrl(url: string): Promise<InstagramResult>;
}
