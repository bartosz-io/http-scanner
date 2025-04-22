import { FetchStatsQueryModel } from '../../src/types';
import { StatsRepository } from '../interfaces/repositories/StatsRepository';

/**
 * Use case for fetching system statistics
 */
export class FetchStatsUseCase {
  constructor(private readonly statsRepository: StatsRepository) {}

  /**
   * Execute the use case to fetch system statistics
   * @param query Query parameters containing optional from and to timestamps
   * @returns Object containing statistics about scans, domains, and errors
   */
  async execute(query: FetchStatsQueryModel): Promise<{
    total_scans: number;
    unique_domains: number;
    timeout_errors: number;
  }> {
    // Validate query parameters
    this.validateQuery(query);

    // Fetch statistics from repository
    return await this.statsRepository.fetchStats(query);
  }

  /**
   * Validate the query parameters
   * @param query Query parameters to validate
   * @throws Error if parameters are invalid
   */
  private validateQuery(query: FetchStatsQueryModel): void {
    // Check if from and to are valid integers
    if (query.from !== undefined) {
      if (!Number.isInteger(query.from) || query.from < 0) {
        throw new Error('INVALID_FROM_TIMESTAMP');
      }
    }

    if (query.to !== undefined) {
      if (!Number.isInteger(query.to) || query.to < 0) {
        throw new Error('INVALID_TO_TIMESTAMP');
      }
    }

    // Check if from is earlier than to
    if (query.from !== undefined && query.to !== undefined && query.from > query.to) {
      throw new Error('INVALID_TIME_RANGE');
    }

    // Limit maximum date range to 1 year for performance reasons
    const MAX_RANGE = 365 * 24 * 60 * 60; // 1 year in seconds
    if (query.from !== undefined && query.to !== undefined && (query.to - query.from) > MAX_RANGE) {
      throw new Error('TIME_RANGE_TOO_LARGE');
    }
  }
}
