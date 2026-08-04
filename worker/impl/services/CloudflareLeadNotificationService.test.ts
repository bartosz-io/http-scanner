import { describe, expect, it, vi } from 'vitest';
import type { Lead } from '../../entities/Lead';
import {
  buildLeadNotification,
  CloudflareLeadNotificationService,
} from './CloudflareLeadNotificationService';

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

const config = {
  to: 'pietrucha.bartosz+scanner@gmail.com',
  from: 'scanner@httpscanner.com',
  fromName: 'HTTP Scanner',
};

describe('CloudflareLeadNotificationService', () => {
  it('renders a complete notification with escaped submitted values', () => {
    const notification = buildLeadNotification({
      ...lead,
      name: '<img src=x>',
      message: '<script>alert(1)</script>',
    }, config);

    expect(notification.to).toBe('pietrucha.bartosz+scanner@gmail.com');
    expect(notification.from).toEqual({ email: 'scanner@httpscanner.com', name: 'HTTP Scanner' });
    expect(notification.replyTo).toBe('ada@example.com');
    expect(notification.subject).toBe('New paid security help request');
    expect(notification.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(notification.html).not.toContain('<script>');
    expect(notification.html).toContain('&lt;img src=x&gt;');
    expect(notification.text).toContain('https://example.com/report/report-hash');
  });

  it('omits an empty optional message from both email versions', () => {
    const notification = buildLeadNotification({ ...lead, message: '' }, config);

    expect(notification.html).not.toContain('Message');
    expect(notification.text).not.toContain('Message:');
  });

  it('sends the rendered payload through the injected email binding', async () => {
    const send = vi.fn(async () => ({ messageId: 'message-1' }));
    const service = new CloudflareLeadNotificationService({ send } as unknown as SendEmail, config);

    await service.send(lead);

    expect(send).toHaveBeenCalledWith({
      to: 'pietrucha.bartosz+scanner@gmail.com',
      from: { email: 'scanner@httpscanner.com', name: 'HTTP Scanner' },
      replyTo: 'ada@example.com',
      subject: 'New paid security help request',
      html: expect.stringContaining('Ada Lovelace'),
      text: expect.stringContaining('https://example.com/report/report-hash'),
    });
  });

  it('exposes a provider error code without its provider message', async () => {
    const send = vi.fn(async () => {
      throw Object.assign(new Error('recipient is unavailable'), { code: 'E_DELIVERY_FAILED' });
    });
    const service = new CloudflareLeadNotificationService({ send } as unknown as SendEmail, config);

    await expect(service.send(lead)).rejects.toThrow('E_DELIVERY_FAILED');
  });

  it('normalizes an unknown provider failure', async () => {
    const send = vi.fn(async () => {
      throw new Error('internal details');
    });
    const service = new CloudflareLeadNotificationService({ send } as unknown as SendEmail, config);

    await expect(service.send(lead)).rejects.toThrow('EMAIL_SEND_FAILED');
  });
});
