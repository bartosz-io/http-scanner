import { Lead } from '../../entities/Lead';
import { LeadRepository } from '../../interfaces/repositories/LeadRepository';

export class D1LeadRepository implements LeadRepository {
  constructor(private readonly db: D1Database) {}

  async save(lead: Lead): Promise<void> {
    await this.db.prepare(`
      INSERT INTO leads (
        id, name, email, message, scanned_url, report_hash,
        report_url, score, consent_version, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lead.id,
      lead.name,
      lead.email,
      lead.message,
      lead.scannedUrl,
      lead.reportHash,
      lead.reportUrl,
      lead.score,
      lead.consentVersion,
      lead.createdAt
    ).run();
  }

  async markEmailSent(id: string): Promise<void> {
    await this.db.prepare(
      `UPDATE leads SET email_status = 'sent', email_error = NULL WHERE id = ?`
    ).bind(id).run();
  }

  async markEmailFailed(id: string, errorCode: string): Promise<void> {
    await this.db.prepare(
      `UPDATE leads SET email_status = 'failed', email_error = ? WHERE id = ?`
    ).bind(errorCode.slice(0, 100), id).run();
  }
}
