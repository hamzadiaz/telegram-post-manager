declare module 'insta-spider' {
  export function instaSpider(cookies?: string[]): Promise<{
    downloadReel(url: string): Promise<string | null>;
  }>;
}
