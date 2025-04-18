export interface HttpService {
  /**
   * Fetch HTTP headers from a URL
   * @param url The URL to fetch headers from
   */
  fetchHeaders(url: string): Promise<Record<string, string>>;
}
