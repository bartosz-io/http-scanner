import { FetchStatsQueryModel } from '../../../src/types';
import { StatsRepository } from '../../interfaces/repositories/StatsRepository';

/**
 * D1 implementation of the StatsRepository interface
 */
export class D1StatsRepository implements StatsRepository {
  constructor(private readonly db: D1Database) {}

  /**
   * Fetch statistics about the system within a specified time range
   * @param query Query parameters containing optional from and to timestamps
   * @returns Object containing statistics about scans, domains, and errors
   */
  async fetchStats(query: FetchStatsQueryModel): Promise<{
    total_scans: number;
    unique_domains: number;
    timeout_errors: number;
  }> {
    // Default to last 30 days if no time range is provided
    const now = Math.floor(Date.now() / 1000);
    const from = query.from || now - 30 * 24 * 60 * 60; // 30 days ago
    const to = query.to || now;

    // Validate time range
    if (from > to) {
      throw new Error('INVALID_TIME_RANGE');
    }

    // Query for total scans in the given period
    const totalScansResult = await this.db.prepare(
      `SELECT COUNT(*) as count FROM reports WHERE created_at >= ? AND created_at <= ?`
    )
    .bind(from, to)
    .first<{ count: number }>();

    // Query for unique domains in the given period
    const uniqueDomainsResult = await this.db.prepare(
      `SELECT COUNT(DISTINCT substr(url, instr(url, '://') + 3, 
        CASE 
          WHEN instr(substr(url, instr(url, '://') + 3), '/') = 0 
          THEN length(substr(url, instr(url, '://') + 3)) 
          ELSE instr(substr(url, instr(url, '://') + 3), '/') - 1 
        END)) as count 
      FROM reports 
      WHERE created_at >= ? AND created_at <= ?`
    )
    .bind(from, to)
    .first<{ count: number }>();

    // Query for timeout errors in the given period
    // Assuming timeout errors are stored in the headers JSON as a specific error type
    const timeoutErrorsResult = await this.db.prepare(
      `SELECT COUNT(*) as count 
      FROM reports 
      WHERE created_at >= ? AND created_at <= ? 
      AND headers LIKE '%"timeout"%'`
    )
    .bind(from, to)
    .first<{ count: number }>();

    return {
      total_scans: totalScansResult?.count || 0,
      unique_domains: uniqueDomainsResult?.count || 0,
      timeout_errors: timeoutErrorsResult?.count || 0
    };
  }
}
