import { Report } from '../../entities/Report';

export interface ReportRepository {
  /**
   * Save a report to the database
   * @param report The report to save
   */
  save(report: Report): Promise<void>;

  /**
   * Check if a domain has been scanned in the last minute
   * @param domain The domain to check
   */
  wasScannedInLastMinute(domain: string): Promise<boolean>;
  
  /**
   * Find a report by its hash
   * @param hash The 32-character hex hash of the report
   * @returns The report if found, null otherwise
   */
  findByHash(hash: string): Promise<Report | null>;
  
  /**
   * Delete a report by its hash and delete token
   * @param hash The 32-character hex hash of the report to delete
   * @param deleteToken The 32-character hex token required for authorization
   * @returns True if the report was found and deleted, false if not found or token mismatch
   * @throws Error with code 'INVALID_HASH_FORMAT' or 'INVALID_TOKEN_FORMAT' if formats are invalid
   */
  deleteByHashAndToken(hash: string, deleteToken: string): Promise<boolean>;
  
  /**
   * Find a paginated list of reports
   * @param limit Maximum number of reports to retrieve
   * @param sortField Field to sort by
   * @param sortDirection Sort direction
   * @param cursor Optional pagination cursor
   * @returns List of reports and cursor to next page (if exists)
   */
  findPaginated(limit: number, sortField: 'created_at' | 'score', sortDirection: 'asc' | 'desc', cursor?: string): Promise<{
    reports: Report[];
    nextCursor?: string;
  }>;
}
