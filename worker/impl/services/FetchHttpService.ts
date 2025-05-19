import { HttpService } from '../../interfaces/services/HttpService';

export class FetchHttpService implements HttpService {
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 5000;

  async fetchHeaders(url: string): Promise<Record<string, string>> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < this.MAX_RETRIES) {
      try {
        // Use GET method directly
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
        
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en,pl-PL;q=0.9,pl;q=0.8,en-US;q=0.7',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1'
          },
          cf: {
            cacheEverything: false,
            scrapeShield: false,
            resolveOverride: new URL(url).hostname
          }
        });
        
        clearTimeout(timeoutId);
        return this.extractHeaders(response.headers);
      } catch (error) {
        lastError = error as Error;
        retries++;
        
        // Exponential backoff
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }
    }

    // If we've exhausted all retries
    if (lastError) {
      if (lastError.name === 'AbortError') {
        throw new Error('SCAN_TIMEOUT');
      }
      throw lastError;
    }
    
    throw new Error('Failed to fetch headers after multiple attempts');
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
    
    return result;
  }
}
