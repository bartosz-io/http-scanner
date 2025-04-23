/**
 * Utility class for validating URLs
 * Responsible for checking if URLs are valid and safe to scan
 */
export class UrlValidator {
  private static readonly MAX_URL_LENGTH = 2048;
  private static readonly VALID_PROTOCOLS = ['http:', 'https:'];
  private static readonly PRIVATE_IP_RANGES = [
    // localhost
    /^127\.\d+\.\d+\.\d+$/,
    // private networks
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    // link-local
    /^169\.254\.\d+\.\d+$/
  ];

  /**
   * Validate a URL for scanning
   * @param url The URL to validate
   * @returns The prepared URL with protocol if valid
   * @throws Error if the URL is invalid
   */
  static validate(url: string): string {
    // Check URL length
    if (!url || url.length > this.MAX_URL_LENGTH) {
      throw new Error('INVALID_URL');
    }

    // Prepare URL for validation
    let urlToValidate = url.trim();
    
    // If URL doesn't have a protocol, add https:// as default
    if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
      urlToValidate = 'https://' + urlToValidate;
    }
    
    // Parse the URL to validate its format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlToValidate);
      
      // Check if protocol is valid
      if (!this.VALID_PROTOCOLS.includes(parsedUrl.protocol)) {
        throw new Error('INVALID_URL');
      }
    } catch {
      throw new Error('INVALID_URL');
    }

    // Check for private IP addresses
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      this.PRIVATE_IP_RANGES.some(pattern => pattern.test(hostname))
    ) {
      throw new Error('INVALID_URL');
    }

    // Return the validated URL (without normalization)
    return parsedUrl.toString();
  }
  
  /**
   * Asynchronously check if a URL is accessible with the given protocol
   * This would be used during the actual scanning process
   * @param url The URL to check
   * @returns Promise resolving to the accessible URL or null if not accessible
   */
  static async checkUrlAccessibility(url: string): Promise<string | null> {
    // Extract the domain part without protocol if present
    const trimmedUrl = url.trim();
    
    // Extract domain part (without protocol)
    let domainPart = trimmedUrl;
    
    // Remove protocol if present
    if (trimmedUrl.startsWith('http://')) {
      domainPart = trimmedUrl.substring(7);
    } else if (trimmedUrl.startsWith('https://')) {
      domainPart = trimmedUrl.substring(8);
    }
    
    // First try with HTTPS protocol
    const httpsUrl = 'https://' + domainPart;
    try {
      // Try to fetch the URL with a HEAD request to minimize data transfer
      const response = await fetch(httpsUrl, { method: 'HEAD' });
      if (response.ok) {
        return httpsUrl;
      }
    } catch {
      // HTTPS fetch failed, continue to HTTP fallback
    }
    
    // If HTTPS failed, try with HTTP
    const httpUrl = 'http://' + domainPart;
    try {
      const response = await fetch(httpUrl, { method: 'HEAD' });
      if (response.ok) {
        return httpUrl;
      }
    } catch {
      // HTTP also failed
    }
    
    // Both protocols failed
    return null;
  }
}
