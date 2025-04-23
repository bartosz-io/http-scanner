import { Context } from 'hono';
import { ReportsResponseDTO, FetchReportsQueryModel } from '../../../src/types';
import { FetchReportsUseCase } from '../../usecases/FetchReportsUseCase';
import { ReportMapper } from '../mappers/ReportMapper';

/**
 * Controller for handling paginated reports list endpoint
 * Following clean architecture principles by keeping HTTP handling separate from business logic
 */
export class ReportsController {
  constructor(
    private readonly fetchReportsUseCase: FetchReportsUseCase,
    private readonly cdnDomain: string
  ) {}

  /**
   * Handle GET /reports request
   * @param c Hono context
   * @returns HTTP response with paginated reports list
   */
  async handleFetchReports(c: Context): Promise<Response> {
    try {
      // Get and validate query parameters
      const limitParam = c.req.query('limit');
      const cursor = c.req.query('cursor');
      const sort = c.req.query('sort') || 'created_at';
      
      // Parse limit
      let limit = 20; // Default limit
      if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
          return c.json({ error: 'Invalid limit parameter', code: 'INVALID_PARAMETERS' }, 400);
        }
        limit = parsedLimit;
      }
      
      // Parse sorting
      let sortField: 'created_at' | 'score' = 'created_at';
      let sortDirection: 'asc' | 'desc' = 'desc';
      
      if (sort.startsWith('-')) {
        const field = sort.substring(1);
        if (field !== 'created_at' && field !== 'score') {
          return c.json({ error: 'Invalid sort parameter', code: 'INVALID_PARAMETERS' }, 400);
        }
        sortField = field as 'created_at' | 'score';
        sortDirection = 'desc';
      } else {
        if (sort !== 'created_at' && sort !== 'score') {
          return c.json({ error: 'Invalid sort parameter', code: 'INVALID_PARAMETERS' }, 400);
        }
        sortField = sort as 'created_at' | 'score';
        sortDirection = 'asc';
      }
      
      // Create query model
      const queryModel: FetchReportsQueryModel = {
        limit,
        cursor,
        sortField,
        sortDirection
      };
      
      // Execute use case
      const { reports, nextCursor } = await this.fetchReportsUseCase.execute(queryModel);
      
      // Map results to DTO
      const responseDTO = ReportMapper.toReportsResponseDTO(reports, nextCursor, this.cdnDomain);
      
      // Return response
      return c.json<ReportsResponseDTO>(responseDTO, 200);
    } catch (error) {
      console.error('Error fetching reports:', error);
      return c.json({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' }, 500);
    }
  }
}
