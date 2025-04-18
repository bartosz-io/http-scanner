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
}
