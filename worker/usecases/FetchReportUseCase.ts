import { Report } from '../entities/Report';
import { ReportRepository } from '../interfaces/repositories/ReportRepository';

/**
 * Use case for fetching a report by its hash
 * Follows clean architecture principles by keeping business logic separate from infrastructure
 */
export class FetchReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository
  ) {}

  /**
   * Execute the use case to fetch a report by its hash
   * @param hash The 32-character hex hash of the report to fetch
   * @returns The report if found, null otherwise
   * @throws Error with code 'INVALID_HASH_FORMAT' if hash format is invalid
   */
  async execute(hash: string): Promise<Report | null> {
    // Validate hash format (this is also done in the repository, but we validate here for completeness)
    if (!hash || typeof hash !== 'string' || !/^[0-9a-f]{32}$/i.test(hash)) {
      throw new Error('INVALID_HASH_FORMAT');
    }

    // Fetch the report from the repository
    const report = await this.reportRepository.findByHash(hash);
    
    // Return the report (will be null if not found)
    return report;
  }
}
