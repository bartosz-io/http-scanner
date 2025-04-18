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
          signal: controller.signal
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
