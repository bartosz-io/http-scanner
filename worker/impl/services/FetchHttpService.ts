import { HttpService } from '../../interfaces/services/HttpService';

export class FetchHttpService implements HttpService {
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 5000;
  private readonly CLOUDFLARE_ADDED_HEADERS = [
    'cf-ray',
    'cf-cache-status',
    'cf-mitigated',
    'cf-worker',
    'cf-edge-cache',
    'cf-connecting-ip',
    'cf-bgj',
    'cf-visitor',
    'cf-apo-via',
    'alt-svc'
  ];

  async fetchHeaders(url: string): Promise<Record<string, string>> {
    console.log(`[FetchHttpService] Starting fetchHeaders for URL: ${url}`);
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
        console.log(`[FetchHttpService] Final URL after redirects: ${response.url}`);
        
        // Check if the response status is not in the successful range (200-299)
        if (response.status < 200 || response.status >= 300) {
          console.log(`[FetchHttpService] Received non-successful status code: ${response.status}`);
          throw new Error(`URL returned status code ${response.status}`);
        }
        
        // Log if we're on HTTPS which is required for STS header
        console.log(`[FetchHttpService] Protocol: ${new URL(response.url).protocol}`);
        
        // Log all headers as a complete object
        const headersObj: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        console.log('[FetchHttpService] All response headers:', JSON.stringify(headersObj, null, 2));
        
        // Log specific security headers directly from response
        console.log(`[FetchHttpService] Direct STS header check: ${response.headers.get('strict-transport-security')}`);
        console.log(`[FetchHttpService] Direct CSP header check: ${response.headers.get('content-security-policy')}`);
        
        // Extract and filter Cloudflare-added headers
        const extractedHeaders = this.extractHeaders(response.headers);
        const filteredHeaders = this.filterCloudflareHeaders(extractedHeaders);
        
        console.log('[FetchHttpService] Final headers after filtering:', JSON.stringify(filteredHeaders, null, 2));
        
        // Verify STS header in extracted result
        console.log(`[FetchHttpService] STS in extracted headers: ${filteredHeaders['strict-transport-security']}`);
        
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

  private extractHeaders(headers: Headers): Record<string, string> {
    console.log(`[FetchHttpService] Extracting headers from Headers object`);
    const result: Record<string, string> = {};
    
    console.log(`[FetchHttpService] Headers entries:`);
    headers.forEach((value, key) => {
      console.log(`[FetchHttpService]   - ${key}: ${value}`);
      result[key.toLowerCase()] = value;
    });

    console.log(`[FetchHttpService] Final extracted headers count: ${Object.keys(result).length}`);
    
    return result;
  }

  private filterCloudflareHeaders(headers: Record<string, string>): Record<string, string> {
    console.log(`[FetchHttpService] Filtering out Cloudflare-specific headers`);
    const filteredHeaders: Record<string, string> = { ...headers };
    
    // Remove known Cloudflare headers
    this.CLOUDFLARE_ADDED_HEADERS.forEach(header => {
      if (filteredHeaders[header]) {
        console.log(`[FetchHttpService] Removing Cloudflare header: ${header}`);
        delete filteredHeaders[header];
      }
    });
    
    // Special case for server header with Cloudflare value
    if (filteredHeaders['server']?.toLowerCase().includes('cloudflare')) {
      console.log(`[FetchHttpService] Removing Cloudflare server header`);
      delete filteredHeaders['server'];
    }
    
    return filteredHeaders;
  }
}
