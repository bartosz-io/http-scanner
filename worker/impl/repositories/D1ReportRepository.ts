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
  
  async deleteByHashAndToken(hash: string, deleteToken: string): Promise<boolean> {
    // Validate hash format (32-character hex string)
    if (!/^[0-9a-f]{32}$/i.test(hash)) {
      throw new Error('INVALID_HASH_FORMAT');
    }
    
    // Validate deleteToken format (32-character hex string)
    if (!/^[0-9a-f]{32}$/i.test(deleteToken)) {
      throw new Error('INVALID_TOKEN_FORMAT');
    }
    
    // First, verify the report exists and the token matches
    const report = await this.db.prepare(
      `SELECT hash, deleteToken, share_image_key 
       FROM reports 
       WHERE hash = ?`
    )
    .bind(hash)
    .first<{ hash: string; deleteToken: string; share_image_key: string | null }>();
    
    // If report not found, return false
    if (!report) {
      return false;
    }
    
    // Use constant-time comparison to prevent timing attacks
    // This is important for security when comparing tokens
    if (!this.secureCompare(report.deleteToken, deleteToken)) {
      return false;
    }
    
    // At this point, the hash exists and the token matches, so delete the report
    const result = await this.db.prepare(
      `DELETE FROM reports WHERE hash = ?`
    )
    .bind(hash)
    .run();
    
    // Return true if a row was affected (report was deleted)
    return result.success && result.meta?.changes === 1;
  }
  
  /**
   * Performs a constant-time comparison of two strings to prevent timing attacks
   * @param a First string to compare
   * @param b Second string to compare
   * @returns True if the strings are equal, false otherwise
   */
  private secureCompare(a: string, b: string): boolean {
    // If lengths are different, strings are not equal
    // But still continue with the comparison to maintain constant time
    const equal = a.length === b.length;
    
    // XOR each character - if any character differs, result will be non-zero
    let result = 0;
    const len = Math.max(a.length, b.length);
    
    for (let i = 0; i < len; i++) {
      // Use 0 if index is out of bounds
      const charA = i < a.length ? a.charCodeAt(i) : 0;
      const charB = i < b.length ? b.charCodeAt(i) : 0;
      
      // Bitwise XOR - if characters are different, bits will be set
      result |= charA ^ charB;
    }
    
    // Only return true if lengths are equal and no characters differ
    return equal && result === 0;
  }
}
