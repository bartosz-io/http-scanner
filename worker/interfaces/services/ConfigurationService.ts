/**
 * Interface for loading configuration files
 */
export interface ConfigurationService {
  /**
   * Loads security headers configuration with weights
   * @returns Promise with a map of header names to their weights
   */
  loadSecurityHeaders(): Promise<Record<string, number>>;

  /**
   * Loads leaking headers configuration with weights
   * @returns Promise with a map of header names to their weights
   */
  loadLeakingHeaders(): Promise<Record<string, number>>;
}
