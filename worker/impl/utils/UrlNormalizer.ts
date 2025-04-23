/**
 * Utility class for normalizing URLs
 * Responsible for standardizing URLs by removing query parameters, fragments, etc.
 */
export class UrlNormalizer {
  /**
   * Normalize a URL by removing query parameters, fragments, and trailing slashes
   * @param url The URL to normalize
   * @returns The normalized URL
   */
  static normalize(url: string): string {
    try {
      const parsedUrl = new URL(url);
      
      // Clear all search parameters
      parsedUrl.search = '';
      
      // Clear hash/fragment
      parsedUrl.hash = '';
      
      // Remove trailing slash from pathname if it exists and it's not just '/'
      if (parsedUrl.pathname.length > 1 && parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
      }
      
      // Get the URL as a string
      let normalizedUrl = parsedUrl.toString();
      
      // Handle domain-only URLs (like https://example.com/)
      // For these URLs, the pathname is '/' and toString() will include the trailing slash
      // Check if the URL ends with '/' and the pathname is just '/'
      if (normalizedUrl.endsWith('/') && parsedUrl.pathname === '/') {
        // Remove the trailing slash
        normalizedUrl = normalizedUrl.slice(0, -1);
      }
      
      return normalizedUrl;
    } catch {
      // If URL parsing fails, return the original URL
      return url;
    }
  }
}
