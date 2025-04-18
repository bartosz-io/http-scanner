import { Context } from 'hono';
import { ScanRequestDTO, ScanResponseDTO } from '../../../src/types';
import { ScanUrlUseCase } from '../../usecases/ScanUrlUseCase';
import { UrlValidator } from '../utils/UrlValidator';
import { ReportMapper } from '../mappers/ReportMapper';

export class ScanController {
  constructor(
    private readonly scanUrlUseCase: ScanUrlUseCase,
    private readonly cdnDomain: string
  ) {}

  /**
   * Handle POST /scan requests
   */
  async handleScan(c: Context): Promise<Response> {
    // Parse and validate request body
    const body = await c.req.json<ScanRequestDTO>();
    
    if (!body || !body.url) {
      throw new Error('INVALID_URL');
    }
    
    // Validate and normalize URL
    const normalizedUrl = UrlValidator.validate(body.url);
    
    // Execute use case
    const report = await this.scanUrlUseCase.execute({
      url: normalizedUrl
    });
    
    // Map to response DTO
    const responseDTO = ReportMapper.toScanResponseDTO(report, this.cdnDomain);
    
    // Return response
    return c.json<ScanResponseDTO>(responseDTO, 200);
  }
}
