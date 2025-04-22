import { Report } from '../entities/Report';
import { ReportRepository } from '../interfaces/repositories/ReportRepository';
import { FetchReportsQueryModel } from '../../src/types';

/**
 * Use case for fetching a paginated list of reports
 * Following clean architecture principles by keeping business logic separate from infrastructure
 */
export class FetchReportsUseCase {
  constructor(
    private readonly reportRepository: ReportRepository
  ) {}

  /**
   * Execute the use case to fetch a paginated list of reports
   * @param queryModel Query model containing pagination and sorting parameters
   * @returns List of reports and cursor to next page (if exists)
   */
  async execute(queryModel: FetchReportsQueryModel): Promise<{
    reports: Report[];
    nextCursor?: string;
  }> {
    // Validate query parameters
    const limit = Math.min(Math.max(queryModel.limit, 20), 100);
    
    // Execute query to repository
    return await this.reportRepository.findPaginated(
      limit,
      queryModel.sortField,
      queryModel.sortDirection,
      queryModel.cursor
    );
  }
}
