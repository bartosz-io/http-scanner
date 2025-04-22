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
      shareImageUrl = `https://${cdnDomain}/images/${report.share_image_key}`;
    }

    return {
      hash: report.hash,
      url: report.url,
      created_at: report.created_at,
      score: report.score,
      headers: groupedHeaders as unknown as Report['headers'], // Type assertion with proper typing
      share_image_url: shareImageUrl,
      deleteToken: report.deleteToken // Include deleteToken for scan response
    };
  }
  
  /**
   * Maps a domain Report to a FetchReportResponseDTO
   * This is used for the GET /report/{hash} endpoint
   * @param report The domain Report to map
   * @param cdnDomain The CDN domain for share images
   */
  static toFetchReportResponseDTO(report: Report, cdnDomain: string): FetchReportResponseDTO {
    // Group headers by type
    const groupedHeaders = {
      detected: report.headers.filter(h => h.present && !h.leaking),
      missing: report.headers.filter(h => !h.present),
      leaking: report.headers.filter(h => h.leaking)
    };

    // Generate share image URL if available
    let shareImageUrl = null;
    if (report.share_image_key) {  
      shareImageUrl = `https://${cdnDomain}/images/${report.share_image_key}`;
    }

    // Create response without deleteToken for security
    return {
      hash: report.hash,
      url: report.url,
      created_at: report.created_at,
      score: report.score,
      headers: groupedHeaders as unknown as Report['headers'],
      share_image_url: shareImageUrl
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
   * @returns Paginated reports response DTO
   */
  static toReportsResponseDTO(reports: Report[], nextCursor?: string): ReportsResponseDTO {
    return {
      items: reports.map(report => ({
        hash: report.hash,
        url: report.url,
        created_at: report.created_at,
        score: report.score
      })),
      next: nextCursor
    };
  }
}
