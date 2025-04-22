import { ConfigurationService } from '../../interfaces/services/ConfigurationService';

/**
 * Service for loading configuration from JSON files
 */
export class FileConfigurationService implements ConfigurationService {
  /**
   * Loads security headers configuration with weights
   * @returns Promise with a map of header names to their weights
   */
  async loadSecurityHeaders(): Promise<Record<string, number>> {
    try {
      // Import the weights.json file dynamically
      const weights = await import('../../../src/assets/weights.json');
      return weights.default || weights;
    } catch (error) {
      console.error('Error loading security headers configuration:', error);
      // Return empty object in case of error
      return {};
    }
  }

  /**
   * Loads leaking headers configuration with weights
   * @returns Promise with a map of header names to their weights
   */
  async loadLeakingHeaders(): Promise<Record<string, number>> {
    try {
      // Import the headers-leak.json file dynamically
      const leakingHeaders = await import('../../../src/assets/headers-leak.json');
      return leakingHeaders.default || leakingHeaders;
    } catch (error) {
      console.error('Error loading leaking headers configuration:', error);
      // Return empty object in case of error
      return {};
    }
  }
}
