/**
 * Interface for image storage repository operations
 * Following clean architecture principles by defining a port for image storage
 */
export interface ImageRepository {
  /**
   * Delete an image from storage by its key
   * @param key The unique key of the image to delete
   * @returns A promise that resolves when the image is deleted
   * @throws Error if the deletion fails
   */
  deleteImage(key: string): Promise<void>;
}
