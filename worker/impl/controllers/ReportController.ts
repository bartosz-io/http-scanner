import { Context } from 'hono';
import { FetchReportResponseDTO } from '../../../src/types';
import { FetchReportUseCase } from '../../usecases/FetchReportUseCase';
import { ReportMapper } from '../mappers/ReportMapper';

/**
 * Controller for handling report-related endpoints
 * Following clean architecture principles by separating controller logic from use cases
 */
export class ReportController {
  constructor(
    private readonly fetchReportUseCase: FetchReportUseCase,
  ) {}

  /**
   * Handle GET /report/:hash requests
   * @param c Hono context
   * @returns HTTP response with report data or error
   */
  async handleFetchReport(c: Context): Promise<Response> {
    // Extract hash parameter from URL
    const hash = c.req.param('hash');
    
    // Validate hash format (32-character hex string)
    if (!hash || !/^[0-9a-f]{32}$/i.test(hash)) {
      throw new Error('INVALID_HASH_FORMAT');
    }
    
    // Execute use case to fetch the report
    const report = await this.fetchReportUseCase.execute(hash);
    
    // Return 404 if report not found
    if (!report) {
      throw new Error('NOT_FOUND');
    }
    
    // Map to response DTO
    const responseDTO = ReportMapper.toFetchReportResponseDTO(report);
    
    // Return response
    return c.json<FetchReportResponseDTO>(responseDTO, 200);
  }
}
