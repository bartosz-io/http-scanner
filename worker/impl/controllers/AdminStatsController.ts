import { Context } from 'hono';
import { AdminStatsResponseDTO, FetchStatsQueryModel } from '../../../src/types';
import { FetchStatsUseCase } from '../../usecases/FetchStatsUseCase';
import { Logger } from '../utils/Logger';

/**
 * Controller for handling admin statistics requests
 */
export class AdminStatsController {
  constructor(private readonly fetchStatsUseCase: FetchStatsUseCase) {}

  /**
   * Handle GET /admin/stats requests
   * @param c Hono context
   * @returns Response with statistics data
   */
  async handleFetchStats(c: Context): Promise<Response> {
    // Get the authenticated user's email from the context (set by the middleware)
    const authenticatedEmail = c.get('authenticatedEmail') as string;
    
    // Extract query parameters
    const from = c.req.query('from') ? parseInt(c.req.query('from') as string, 10) : undefined;
    const to = c.req.query('to') ? parseInt(c.req.query('to') as string, 10) : undefined;

    // Log the stats request
    Logger.info('AdminStats', `Stats requested by ${authenticatedEmail}`, { from, to });

    // Create query model
    const query: FetchStatsQueryModel = { from, to };

    try {
      // Execute use case
      const stats = await this.fetchStatsUseCase.execute(query);

      // Log the successful stats retrieval
      Logger.info('AdminStats', `Stats successfully retrieved for time range`, { from, to, stats });

      // Return response
      return c.json<AdminStatsResponseDTO>({
        total_scans: stats.total_scans,
        unique_domains: stats.unique_domains,
        timeout_errors: stats.timeout_errors
      }, 200);
    } catch (error) {
      // Log the error
      Logger.error('AdminStats', `Error retrieving stats`, error);
      
      // Re-throw the error to be handled by the global error handler
      throw error;
    }
  }
}
