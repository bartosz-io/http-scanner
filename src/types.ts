// Auto-generated TypeScript types based on sql/init-db.sql schema

export interface HeaderEntry {
  name: string;
  value?: string;
  present: boolean;
  weight: number;
  leaking: boolean;
  status?: 'pass' | 'partial' | 'fail' | 'missing' | 'unknown';
  notes?: string[];
}

export interface Report {
  hash: string; // 32-char hex ID
  url: string; // normalized URL
  created_at: number; // Unix epoch
  score: number; // 0-100 aggregate
  headers: HeaderEntry[]; // Array of header entries
  deleteToken: string; // 32-char hex
  share_image_key?: string | null; // KV/R2 PNG key (nullable)
}

/* ----------------------------------------------------
   DTO & Command Models for the REST API
   ---------------------------------------------------- */

/* ---------- 1 • /scan --------------------------------*/

/** POST /scan – client request */
export interface ScanRequestDTO {
  /** Fully‑qualified HTTP/HTTPS URL (≤ 2048 chars) */
  url: string;
}

/** Fields returned to *anyone* (no secrets) */
export type PublicReportDTO = Omit<Report, 'deleteToken' | 'share_image_key'> & {
  /** Public CDN URL for social-share PNG */
  share_image_url: string | null;
  /** Public URL to view this report (only included in scan and reports endpoints) */
  report_url?: string;
};

/** POST /scan – server response (full report) */
/**
 * Server response for POST /scan (full report)
 * @extends PublicReportDTO
 * @property {string} deleteToken - Token required to delete this report (only returned once at creation)
 */
export interface ScanResponseDTO extends PublicReportDTO {
  /** Token required to delete this report (only returned once at creation) */
  deleteToken: string;
}

/* ---------- 2 /report/{hash} -----------------------*/

/** GET /report/{hash} - only public data, no deleteToken */
export type FetchReportResponseDTO = PublicReportDTO;

/* ---------- 3 /report/delete -----------------------*/

/** POST /report/delete – client request */
export interface DeleteReportRequestDTO {
  hash: string;          // 32-char hex
  deleteToken: string;   // 32-char hex
}

/** 204 No Content on success – no body required */
export type DeleteReportResponseDTO = void;

/* ---------- 4 /admin/stats -------------------------*/

/** Query model for fetching admin stats */
export interface FetchStatsQueryModel {
  /** Starting timestamp (optional) */
  from?: number;
  /** Ending timestamp (optional) */
  to?: number;
}

/** GET /admin/stats – aggregated service metrics */
export interface AdminStatsResponseDTO {
  total_scans: number;
  unique_domains: number;
  timeout_errors: number;
}

/* ---------- 5 /reports (public) -------------------*/

/** Minimal report list item for public endpoint */
export type ReportListItemDTO = Pick<
  Report,
  'hash' | 'url' | 'created_at' | 'score'
> & {
  /** Public URL to view this report */
  report_url: string;
};

/** GET /reports - paginated result set */
export interface ReportsResponseDTO {
  items: ReportListItemDTO[];
  next?: string;  // opaque cursor for next page
}

/** Query model for fetching paginated reports */
export interface FetchReportsQueryModel {
  limit: number;
  cursor?: string;
  sortField: 'created_at' | 'score';
  sortDirection: 'asc' | 'desc';
}

/* ----------------------------------------------------
   View Models for the Frontend Components
   ---------------------------------------------------- */

export interface ScanFormViewModel {
  url: string;
  isValid: boolean;
  errorMessage?: string;
  isSubmitting: boolean;
  scanResponse?: ScanResponseDTO;
  errorCode?: string;
}

export interface ScanFormFeedbackProps {
  isSubmitting: boolean;
  error?: string;
  errorCode?: string; // e.g. "RATE_LIMIT_EXCEEDED", "INVALID_URL", "SCAN_TIMEOUT"
}

export interface RecentScansViewModel {
  scans: ReportListItemDTO[];
  isLoading: boolean;
  error?: string;
  next?: string;
}
