/**
 * Interface for image generation and storage service
 */
export interface ImageService {
  /**
   * Generates a share image for a scan result and stores it in R2 storage
   * @param hash - Unique identifier for the report
   * @param url - The URL that was scanned
   * @param score - The security score calculated for the URL
   * @returns The key of the stored image or null if generation failed
   */
  generateShareImage(hash: string, url: string, score: number): Promise<string | null>;
}
