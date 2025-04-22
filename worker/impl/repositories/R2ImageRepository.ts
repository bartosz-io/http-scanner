import { ImageRepository } from '../../interfaces/repositories/ImageRepository';

/**
 * Repository implementation for managing images in Cloudflare R2 storage
 * Following clean architecture principles as an adapter for the R2 storage
 */
export class R2ImageRepository implements ImageRepository {
  constructor(private readonly r2Bucket: R2Bucket) {}

  /**
   * Delete an image from R2 storage by its key
   * @param key The unique key of the image to delete
   * @throws Error if the deletion fails
   */
  async deleteImage(key: string): Promise<void> {
    try {
      // Check if the image exists before attempting to delete
      const imageExists = await this.r2Bucket.head(key);
      
      if (!imageExists) {
        console.log(`[R2ImageRepository] Image with key ${key} not found, nothing to delete`);
        return;
      }
      
      // Delete the image from R2
      await this.r2Bucket.delete(key);
      console.log(`[R2ImageRepository] Successfully deleted image with key: ${key}`);
    } catch (error) {
      console.error(`[R2ImageRepository] Error deleting image with key ${key}:`, error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
