import type { Lead } from '../../entities/Lead';
import type {
  LeadNotificationConfig,
  LeadNotificationService,
} from '../../interfaces/services/LeadNotificationService';

const SUBJECT = 'New paid security help request';

export function buildLeadNotification(lead: Lead, config: LeadNotificationConfig) {
  const message = lead.message ? `\n<p><strong>Message:</strong><br>${escapeHtml(lead.message)}</p>` : '';
  const textMessage = lead.message ? `\nMessage: ${lead.message}\n` : '';

  return {
    to: config.to,
    from: { email: config.from, name: config.fromName },
    replyTo: lead.email,
    subject: SUBJECT,
    html: `<h1>New paid security help request</h1>
<p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
<p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
<p><strong>Scanned URL:</strong> ${escapeHtml(lead.scannedUrl)}</p>
<p><strong>Report URL:</strong> <a href="${escapeHtml(lead.reportUrl)}">${escapeHtml(lead.reportUrl)}</a></p>
<p><strong>Score:</strong> ${lead.score}</p>${message}`,
    text: `New paid security help request

Name: ${lead.name}
Email: ${lead.email}
Scanned URL: ${lead.scannedUrl}
Report URL: ${lead.reportUrl}
Score: ${lead.score}${textMessage}`,
  };
}

export class CloudflareLeadNotificationService implements LeadNotificationService {
  constructor(
    private readonly email: SendEmail,
    private readonly config: LeadNotificationConfig,
  ) {}

  async send(lead: Lead): Promise<void> {
    try {
      await this.email.send(buildLeadNotification(lead, this.config));
    } catch (error) {
      return Promise.reject(new Error(getErrorCode(error)));
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && /^E_[A-Z_]+$/.test(code)) {
      return code;
    }
  }

  return 'EMAIL_SEND_FAILED';
}
