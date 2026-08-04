import { describe, expect, it } from 'vitest';
import { Lead } from '../../entities/Lead';
import { D1LeadRepository } from './D1LeadRepository';

interface RecordedCall {
  sql: string;
  values: unknown[];
}

class RecordingD1Database {
  calls: RecordedCall[] = [];

  prepare(sql: string) {
    return {
      bind: (...values: unknown[]) => {
        this.calls.push({ sql, values });

        return {
          run: async () => ({ success: true }),
        };
      },
    };
  }
}

const lead: Lead = {
  id: 'lead-123',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Please help secure my site.',
  scannedUrl: 'https://example.com',
  reportHash: 'report-hash',
  reportUrl: 'https://example.com/report/report-hash',
  score: 42.5,
  consentVersion: '2026-08-04',
  emailStatus: 'pending',
  emailError: null,
  createdAt: 1_754_272_800_000,
};

describe('D1LeadRepository', () => {
  it('saves only the lead fields required to create a lead', async () => {
    const db = new RecordingD1Database();
    const repository = new D1LeadRepository(db as unknown as D1Database);

    await repository.save(lead);

    expect(db.calls[0].sql).toContain('INSERT INTO leads');
    expect(db.calls[0].values).toEqual([
      lead.id,
      lead.name,
      lead.email,
      lead.message,
      lead.scannedUrl,
      lead.reportHash,
      lead.reportUrl,
      lead.score,
      lead.consentVersion,
      lead.createdAt,
    ]);
    expect(db.calls[0].sql.toLowerCase()).not.toContain('ip');
  });

  it('marks a lead email as sent', async () => {
    const db = new RecordingD1Database();
    const repository = new D1LeadRepository(db as unknown as D1Database);

    await repository.markEmailSent(lead.id);

    expect(db.calls[0].sql).toContain("email_status = 'sent'");
    expect(db.calls[0].values).toEqual([lead.id]);
  });

  it('marks a lead email as failed with an error code', async () => {
    const db = new RecordingD1Database();
    const repository = new D1LeadRepository(db as unknown as D1Database);

    await repository.markEmailFailed(lead.id, 'E_DELIVERY_FAILED');

    expect(db.calls.at(-1)?.values).toEqual(['E_DELIVERY_FAILED', lead.id]);
  });
});
