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
   * @returns The normalized URL if valid
   * @throws Error if the URL is invalid
   */
  static validate(url: string): string {
    // Check URL length
    if (!url || url.length > this.MAX_URL_LENGTH) {
      throw new Error('INVALID_URL');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error('INVALID_URL');
    }

    // Check protocol
    if (!this.VALID_PROTOCOLS.includes(parsedUrl.protocol)) {
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

    // Normalize URL by removing tracking parameters and fragments
    // This is a simplified version - in a real implementation, you might want to
    // use a library or more comprehensive list of tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
    
    const normalizedUrl = new URL(url);
    trackingParams.forEach(param => normalizedUrl.searchParams.delete(param));
    normalizedUrl.hash = '';

    return normalizedUrl.toString();
  }
}
