import { Context } from 'hono';
import { AdminStatsResponseDTO, FetchStatsQueryModel } from '../../../src/types';
import { FetchStatsUseCase } from '../../usecases/FetchStatsUseCase';

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
    // Extract query parameters
    const from = c.req.query('from') ? parseInt(c.req.query('from') as string, 10) : undefined;
    const to = c.req.query('to') ? parseInt(c.req.query('to') as string, 10) : undefined;

    // Create query model
    const query: FetchStatsQueryModel = { from, to };

    // Execute use case
    const stats = await this.fetchStatsUseCase.execute(query);

    // Return response
    return c.json<AdminStatsResponseDTO>({
      total_scans: stats.total_scans,
      unique_domains: stats.unique_domains,
      timeout_errors: stats.timeout_errors
    }, 200);
  }
}
