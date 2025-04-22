import { Context } from 'hono';
import { DeleteReportRequestDTO } from '../../../src/types';
import { DeleteReportUseCase } from '../../usecases/DeleteReportUseCase';

/**
 * Controller for handling report deletion requests
 * Following clean architecture principles by separating controller logic from use cases
 */
export class DeleteReportController {
  constructor(
    private readonly deleteReportUseCase: DeleteReportUseCase
  ) {}

  /**
   * Handle POST /report/delete requests
   * @param c Hono context
   * @returns HTTP response with appropriate status code
   */
  async handleDeleteReport(c: Context): Promise<Response> {
    try {
      // Parse and validate request body
      const body = await c.req.json<DeleteReportRequestDTO>();
      
      if (!body || !body.hash || !body.deleteToken) {
        return c.json(
          { error: 'Missing required fields', code: 'MISSING_REQUIRED_FIELDS' },
          400
        );
      }
      
      // Execute use case
      const deleted = await this.deleteReportUseCase.execute({
        hash: body.hash,
        deleteToken: body.deleteToken
      });
      
      // If report was not found or token didn't match, return 401
      if (!deleted) {
        return c.json(
          { error: 'Invalid hash or deleteToken', code: 'UNAUTHORIZED' },
          401
        );
      }
      
      // Return 204 No Content on success
      return new Response(null, { status: 204 });
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        switch (error.message) {
          case 'INVALID_HASH_FORMAT':
          case 'INVALID_TOKEN_FORMAT':
            return c.json(
              { error: 'Invalid format for hash or deleteToken', code: 'INVALID_FORMAT' },
              400
            );
          case 'MISSING_REQUIRED_FIELDS':
            return c.json(
              { error: 'Missing required fields', code: 'MISSING_REQUIRED_FIELDS' },
              400
            );
          case 'RATE_LIMIT_EXCEEDED':
            return c.json(
              { error: 'Rate limit exceeded: Maximum 5 delete attempts per hour', code: 'RATE_LIMIT_EXCEEDED' },
              429
            );
        }
      }
      
      // Log unexpected errors
      console.error('[DeleteReportController] Unexpected error:', error);
      
      // Return 500 for all other errors
      return c.json(
        { error: 'An internal error occurred', code: 'INTERNAL_ERROR' },
        500
      );
    }
  }
}
