// Auto-generated TypeScript types based on sql/init-db.sql schema

export interface HeaderEntry {
  name: string;
  value?: string;
  present: boolean;
  weight: number;
  leaking: boolean;
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
};

/** POST /scan – server response (full report) */
export interface ScanResponseDTO extends PublicReportDTO {
  /** Token required to delete this report (only returned once at creation) */
  deleteToken: string;
}

/* ---------- 2 /report/{hash} -----------------------*/

/** GET /report/{hash} – same payload as ScanResponse */
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

/* ---------- 5 /admin/reports -----------------------*/

/** Minimal representation in paginated admin list */
export type AdminReportListItemDTO = Pick<
  Report,
  'hash' | 'url' | 'created_at' | 'score'
>;

/** GET /admin/reports – paged result set */
export interface AdminReportsResponseDTO {
  items: AdminReportListItemDTO[];
  next?: string;                 // opaque cursor for subsequent page
}

/* ---------- 6 /reports (public) -------------------*/

/** Minimal report list item for public endpoint */
export type ReportListItemDTO = Pick<
  Report,
  'hash' | 'url' | 'created_at' | 'score'
>;

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