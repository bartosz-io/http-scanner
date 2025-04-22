import { Report } from '../../entities/Report';
import { ReportRepository } from '../../interfaces/repositories/ReportRepository';
import { HeaderEntry } from '../../entities/HeaderEntry';

interface ReportRow {
  hash: string;
  url: string;
  created_at: number;
  score: number;
  headers: string; // JSON string of header entries
  deleteToken: string;
  share_image_key: string | null;
}

export class D1ReportRepository implements ReportRepository {
  constructor(private readonly db: D1Database) {}

  async save(report: Report): Promise<void> {
    await this.db.prepare(
      `INSERT INTO reports (hash, url, created_at, score, headers, deleteToken, share_image_key) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      report.hash,
      report.url,
      report.created_at,
      report.score,
      JSON.stringify(report.headers),
      report.deleteToken,
      report.share_image_key
    )
    .run();
  }

  async wasScannedInLastMinute(domain: string): Promise<boolean> {
    const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
    
    const result = await this.db.prepare(
      `SELECT EXISTS(
         SELECT 1 FROM reports 
         WHERE instr(lower(url), lower(?)) > 0 
         AND created_at > ?
       ) as scanned`
    )
    .bind(domain, oneMinuteAgo)
    .first<{ scanned: number }>();
    
    return result?.scanned === 1;
  }
  
  async findByHash(hash: string): Promise<Report | null> {
    // Validate hash format (32-character hex string)
    if (!/^[0-9a-f]{32}$/i.test(hash)) {
      throw new Error('INVALID_HASH_FORMAT');
    }
    
    // Query the database for the report with the given hash
    const result = await this.db.prepare(
      `SELECT hash, url, created_at, score, headers, deleteToken, share_image_key 
       FROM reports 
       WHERE hash = ?`
    )
    .bind(hash)
    .first<ReportRow>();
    
    // Return null if no report was found
    if (!result) {
      return null;
    }
    
    // Parse the headers JSON string to an array of HeaderEntry objects
    const headers = JSON.parse(result.headers) as HeaderEntry[];
    
    // Create and return a Report domain object
    return Report.create({
      hash: result.hash,
      url: result.url,
      created_at: result.created_at,
      score: result.score,
      headers,
      deleteToken: result.deleteToken,
      share_image_key: result.share_image_key
    });
  }
}
