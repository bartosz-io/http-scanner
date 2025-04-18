import { Report } from '../../entities/Report';
import { ReportRepository } from '../../interfaces/repositories/ReportRepository';

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
}
