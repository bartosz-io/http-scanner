import { describe, expect, it } from 'vitest';
import { LEAD_CONSENT_VERSION, type LeadSubmissionRequestDTO } from '../../shared/leadSubmission';
import type { Lead } from '../entities/Lead';
import { Report } from '../entities/Report';
import type { LeadRepository } from '../interfaces/repositories/LeadRepository';
import type { ReportRepository } from '../interfaces/repositories/ReportRepository';
import type { LeadNotificationService } from '../interfaces/services/LeadNotificationService';
import { SubmitLeadUseCase } from './SubmitLeadUseCase';

const valid = new Report(
  '9249232fefb9a1c0455ba007d7784f6c',
  'https://example.com/',
  1_754_272_800,
  79.99,
  [],
  'delete-token'
);

const input: LeadSubmissionRequestDTO = {
  hash: valid.hash,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Please help secure my site.',
  consent: true,
  website: '',
};

class InMemoryReportRepository implements ReportRepository {
  constructor(
    private readonly report: Report | null,
    private readonly events: string[]
  ) {}

  async save(): Promise<void> {}

  async wasScannedInLastMinute(): Promise<boolean> {
    return false;
  }

  async findByHash(): Promise<Report | null> {
    this.events.push('report:find');
    return this.report;
  }

  async deleteByHashAndToken(): Promise<boolean> {
    return false;
  }

  async findPaginated(): Promise<{ reports: Report[]; nextCursor?: string }> {
    return { reports: [] };
  }
}

class InMemoryLeadRepository implements LeadRepository {
  savedLead: Lead | undefined;
  sentLeadId: string | undefined;
  failedEmail: { id: string; code: string } | undefined;

  constructor(
    private readonly events: string[],
    private readonly saveError?: Error
  ) {}

  async save(lead: Lead): Promise<void> {
    this.events.push('lead:save');
    if (this.saveError) throw this.saveError;
    this.savedLead = lead;
  }

  async markEmailSent(id: string): Promise<void> {
    this.events.push('lead:sent');
    this.sentLeadId = id;
  }

  async markEmailFailed(id: string, code: string): Promise<void> {
    this.events.push('lead:failed');
    this.failedEmail = { id, code };
  }
}

class InMemoryNotificationService implements LeadNotificationService {
  sentLead: Lead | undefined;

  constructor(
    private readonly events: string[],
    private readonly sendError?: Error
  ) {}

  async send(lead: Lead): Promise<void> {
    this.events.push('email:send');
    if (this.sendError) throw this.sendError;
    this.sentLead = lead;
  }
}

function createUseCase(
  report: Report | null = valid,
  options: { saveError?: Error; sendError?: Error } = {}
) {
  const events: string[] = [];
  const reports = new InMemoryReportRepository(report, events);
  const leads = new InMemoryLeadRepository(events, options.saveError);
  const notifications = new InMemoryNotificationService(events, options.sendError);
  const useCase = new SubmitLeadUseCase(
    reports,
    leads,
    notifications,
    'https://httpscanner.com',
    () => 'lead-123',
    () => 1_754_272_800
  );

  return { events, leads, notifications, useCase };
}

describe('SubmitLeadUseCase', () => {
  it('persists an eligible lead before notifying and marking the notification sent', async () => {
    const { events, leads, useCase } = createUseCase();

    await expect(useCase.execute(input)).resolves.toEqual({ leadId: 'lead-123' });

    expect(events).toEqual(['report:find', 'lead:save', 'email:send', 'lead:sent']);
    expect(leads.savedLead).toMatchObject({
      scannedUrl: 'https://example.com/',
      reportUrl: `https://httpscanner.com/report/${valid.hash}`,
      score: 79.99,
      consentVersion: LEAD_CONSENT_VERSION,
      emailStatus: 'pending',
    });
  });

  it.each([80, 100])('rejects a score of %i before persisting a lead', async (score) => {
    const report = new Report(
      valid.hash,
      valid.url,
      valid.created_at,
      score,
      valid.headers,
      valid.deleteToken
    );
    const { events, useCase } = createUseCase(report);

    await expect(useCase.execute(input)).rejects.toThrow('LEAD_NOT_ELIGIBLE');

    expect(events).toEqual(['report:find']);
  });

  it('rejects a submission when its report no longer exists', async () => {
    const { events, useCase } = createUseCase(null);

    await expect(useCase.execute(input)).rejects.toThrow('NOT_FOUND');

    expect(events).toEqual(['report:find']);
  });

  it('does not notify when persistence fails', async () => {
    const { events, useCase } = createUseCase(valid, { saveError: new Error('DB_WRITE_FAILED') });

    await expect(useCase.execute(input)).rejects.toThrow('DB_WRITE_FAILED');

    expect(events).toEqual(['report:find', 'lead:save']);
  });

  it('records delivery failure and accepts the already-persisted lead', async () => {
    const { events, leads, useCase } = createUseCase(valid, {
      sendError: new Error('E_DELIVERY_FAILED'),
    });

    await expect(useCase.execute(input)).resolves.toEqual({ leadId: 'lead-123' });

    expect(events).toEqual(['report:find', 'lead:save', 'email:send', 'lead:failed']);
    expect(leads.failedEmail).toEqual({ id: 'lead-123', code: 'E_DELIVERY_FAILED' });
  });
});
