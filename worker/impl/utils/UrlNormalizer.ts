/**
 * Utility class for normalizing URLs
 * Responsible for standardizing URLs by removing query parameters, fragments, etc.
 */
export class UrlNormalizer {
  /**
   * Normalize a URL by removing query parameters and fragments
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
      
      return parsedUrl.toString();
    } catch {
      // If URL parsing fails, return the original URL
      return url;
    }
  }
}
