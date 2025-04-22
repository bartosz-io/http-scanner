import { FetchStatsQueryModel } from '../../../src/types';

/**
 * Repository interface for fetching statistics from the database
 */
export interface StatsRepository {
  /**
   * Fetch statistics about the system within a specified time range
   * @param query Query parameters containing optional from and to timestamps
   * @returns Object containing statistics about scans, domains, and errors
   */
  fetchStats(query: FetchStatsQueryModel): Promise<{
    total_scans: number;
    unique_domains: number;
    timeout_errors: number;
  }>;
}
