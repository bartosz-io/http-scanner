import { ReportRepository } from '../interfaces/repositories/ReportRepository';
import { ImageRepository } from '../interfaces/repositories/ImageRepository';

/**
 * Command model for delete report operation
 */
export interface DeleteReportCommandModel {
  hash: string;       // 32-character hex identifier
  deleteToken: string; // 32-character authorization token
}

/**
 * Use case for deleting a report and its associated image
 * Following clean architecture principles by keeping business logic separate from infrastructure
 */
export class DeleteReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly imageRepository: ImageRepository
  ) {}

  /**
   * Execute the use case to delete a report and its associated image
   * @param command The command containing hash and deleteToken
   * @returns True if the report was successfully deleted, false otherwise
   * @throws Error with code 'INVALID_HASH_FORMAT' or 'INVALID_TOKEN_FORMAT' if formats are invalid
   */
  async execute(command: DeleteReportCommandModel): Promise<boolean> {
    // Validate command structure
    if (!command || typeof command !== 'object') {
      throw new Error('INVALID_REQUEST_FORMAT');
    }
    
    const { hash, deleteToken } = command;
    
    // Validate required fields
    if (!hash || !deleteToken) {
      throw new Error('MISSING_REQUIRED_FIELDS');
    }
    
    try {
      // First, find the report to get the image key before deletion
      const report = await this.reportRepository.findByHash(hash);
      const imageKey = report?.share_image_key;
      
      // Delete the report using the repository
      const deleted = await this.reportRepository.deleteByHashAndToken(hash, deleteToken);
      
      // If report was deleted and it had an associated image, delete the image too
      if (deleted && imageKey) {
        try {
          // Delete image asynchronously to not block the response
          // We don't await this to improve performance, as the report deletion is the primary concern
          this.imageRepository.deleteImage(imageKey).catch(error => {
            console.error(`[DeleteReportUseCase] Error deleting image ${imageKey}:`, error);
            // We don't throw here as the report was successfully deleted
          });
        } catch (imageError) {
          // Log but don't fail the operation if image deletion fails
          console.error(`[DeleteReportUseCase] Error initiating image deletion for ${imageKey}:`, imageError);
        }
      }
      
      return deleted;
    } catch (error) {
      // Rethrow validation errors
      if (error instanceof Error && 
          (error.message === 'INVALID_HASH_FORMAT' || 
           error.message === 'INVALID_TOKEN_FORMAT')) {
        throw error;
      }
      
      // Log other errors and throw a generic error
      console.error('[DeleteReportUseCase] Error deleting report:', error);
      throw new Error('INTERNAL_ERROR');
    }
  }
}
