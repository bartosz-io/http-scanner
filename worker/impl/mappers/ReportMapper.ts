import { ScanResponseDTO, FetchReportResponseDTO, ReportsResponseDTO } from '../../../src/types';
import { Report } from '../../entities/Report';
import { HeaderAnalysisResult } from '../../entities/HeaderAnalysisResult';

export class ReportMapper {
  /**
   * Maps a domain Report to a ScanResponseDTO
   * @param report The domain Report to map
   * @param cdnDomain The CDN domain for share images
   */
  static toScanResponseDTO(report: Report, cdnDomain: string): ScanResponseDTO {
    // Group headers by type
    const groupedHeaders = {
      detected: report.headers.filter(h => h.present && !h.leaking),
      missing: report.headers.filter(h => !h.present),
      leaking: report.headers.filter(h => h.leaking)
    };

    // Generate share image URL if available
    let shareImageUrl = null;
    if (report.share_image_key) {
      // Use URLs with /api prefix to match our backend structure
      // This works with the Vite proxy in development and with the same origin in production
      shareImageUrl = `/api/images/${report.share_image_key}`;
    }

    // Generate report URL - this still needs the full URL for sharing outside the application
    const reportUrl = `https://${cdnDomain}/report/${report.hash}`;

    return {
      hash: report.hash,
      url: report.url,
      created_at: report.created_at,
      score: report.score,
      headers: groupedHeaders as unknown as Report['headers'], // Type assertion with proper typing
      share_image_url: shareImageUrl,
      report_url: reportUrl,
      deleteToken: report.deleteToken // Include deleteToken for scan response
    };
  }
  
  /**
   * Maps a domain Report to a FetchReportResponseDTO
   * This is used for the GET /report/{hash} endpoint
   * @param report The domain Report to map
   */
  static toFetchReportResponseDTO(report: Report): FetchReportResponseDTO {
    // Group headers by type
    const groupedHeaders = {
      detected: report.headers.filter(h => h.present && !h.leaking),
      missing: report.headers.filter(h => !h.present),
      leaking: report.headers.filter(h => h.leaking)
    };

    // Generate share image URL if available
    let shareImageUrl = null;
    if (report.share_image_key) {
      // Use URLs with /api prefix to match our backend structure
      // This works with the Vite proxy in development and with the same origin in production
      shareImageUrl = `/api/images/${report.share_image_key}`;
    }

    // Return public report data without security-sensitive fields
    return {
      hash: report.hash,
      url: report.url,
      created_at: report.created_at,
      score: report.score,
      headers: groupedHeaders as unknown as Report['headers'],
      share_image_url: shareImageUrl
      // No report_url or deleteToken for single report endpoint - following clean architecture
      // by separating the concerns between initial scan and report viewing
    };
  }

  /**
   * Maps a HeaderAnalysisResult to an array of HeaderEntry
   * @param result The HeaderAnalysisResult to map
   */
  static headerAnalysisToEntries(result: HeaderAnalysisResult): Report['headers'] {
    return [
      ...result.detected,
      ...result.missing,
      ...result.leaking
    ];
  }

  /**
   * Maps a list of Report domain objects to ReportsResponseDTO
   * @param reports List of Report domain objects
   * @param nextCursor Cursor to next page (if exists)
   * @param cdnDomain The CDN domain for report URLs
   * @returns Paginated reports response DTO
   */
  static toReportsResponseDTO(reports: Report[], nextCursor?: string, cdnDomain?: string): ReportsResponseDTO {
    return {
      items: reports.map(report => {
        return {
          hash: report.hash,
          url: report.url,
          created_at: report.created_at,
          score: report.score,
          report_url: `https://${cdnDomain}/report/${report.hash}`
        };
      }),
      next: nextCursor
    };
  }
}
