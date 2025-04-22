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
}
