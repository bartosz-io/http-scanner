import { LEAD_CONSENT_VERSION, type LeadSubmissionRequestDTO } from '../../shared/leadSubmission';
import type { Lead } from '../entities/Lead';
import type { LeadRepository } from '../interfaces/repositories/LeadRepository';
import type { ReportRepository } from '../interfaces/repositories/ReportRepository';
import type { LeadNotificationService } from '../interfaces/services/LeadNotificationService';

export class SubmitLeadUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly leads: LeadRepository,
    private readonly notifications: LeadNotificationService,
    private readonly publicBaseUrl: string,
    private readonly createId: () => string = () => crypto.randomUUID(),
    private readonly now: () => number = () => Math.floor(Date.now() / 1000)
  ) {}

  async execute(input: LeadSubmissionRequestDTO): Promise<{ leadId: string }> {
    const report = await this.reports.findByHash(input.hash);
    if (!report) throw new Error('NOT_FOUND');
    if (report.score >= 80) throw new Error('LEAD_NOT_ELIGIBLE');

    const lead: Lead = {
      id: this.createId(),
      name: input.name,
      email: input.email,
      message: input.message || null,
      scannedUrl: report.url,
      reportHash: report.hash,
      reportUrl: `${this.publicBaseUrl}/report/${report.hash}`,
      score: report.score,
      consentVersion: LEAD_CONSENT_VERSION,
      emailStatus: 'pending',
      emailError: null,
      createdAt: this.now(),
    };
    await this.leads.save(lead);

    try {
      await this.notifications.send(lead);
      await this.leads.markEmailSent(lead.id);
    } catch (error) {
      const code = error instanceof Error && /^E_[A-Z_]+$/.test(error.message)
        ? error.message
        : 'EMAIL_SEND_FAILED';
      await this.leads.markEmailFailed(lead.id, code);
    }

    return { leadId: lead.id };
  }
}
