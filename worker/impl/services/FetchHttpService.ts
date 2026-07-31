import { HttpService } from '../../interfaces/services/HttpService';
import {
  extractResponseHeaders,
  filterScannerTransportHeaders,
} from './responseHeaders';

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
        console.log(`[FetchHttpService] Setting up request with timeout: ${this.TIMEOUT_MS}ms`);
        
        const hostname = new URL(url).hostname;
        console.log(`[FetchHttpService] Extracted hostname for resolveOverride: ${hostname}`);
        
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en,pl-PL;q=0.9,pl;q=0.8,en-US;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Priority': 'u=0, i',
            'Upgrade-Insecure-Requests': '1'
          },
          cf: {
            // Disable all Cloudflare features that might modify the response
            cacheEverything: false,
            scrapeShield: false,              // Disable email obfuscation, etc
            minify: {
              javascript: false,
              css: false,
              html: false
            },                                // Disable HTML/CSS/JS minification
            mirage: false,                    // Disable image optimization
            apps: false,                      // Disable Cloudflare Apps
            resolveOverride: hostname         // Connect directly to origin's IP
          }
        });
        
        clearTimeout(timeoutId);
        console.log(`[FetchHttpService] Response received, status: ${response.status}, type: ${response.type}`);
        
        // Check if the response status is not in the successful range (200-299)
        if (response.status < 200 || response.status >= 300) {
          console.log(`[FetchHttpService] Received non-successful status code: ${response.status}`);
          throw new Error(`URL returned status code ${response.status}`);
        }
        
        // Extract and filter scanner transport headers
        const extractedHeaders = extractResponseHeaders(response.headers);
        const filteredHeaders = filterScannerTransportHeaders(extractedHeaders);
        console.log(`[FetchHttpService] Extracted response header count: ${Object.keys(extractedHeaders).length}`);
        console.log(`[FetchHttpService] Response header count after transport filtering: ${Object.keys(filteredHeaders).length}`);
        
        return filteredHeaders;
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
    
    console.log(`[FetchHttpService] Failed to fetch headers after ${this.MAX_RETRIES} attempts with no specific error`);
    throw new Error('Failed to fetch headers after multiple attempts');
  }

}
