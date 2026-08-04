import { describe, expect, it, vi } from 'vitest';
import type { LeadSubmissionRequestDTO } from '../types';
import { submitLeadSubmission } from './leadSubmissions';

const valid: LeadSubmissionRequestDTO = {
  hash: '9249232fefb9a1c0455ba007d7784f6c',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Please help with CSP.',
  consent: true,
  website: '',
};

describe('submitLeadSubmission', () => {
  it('posts the submission as JSON and returns the accepted response', async () => {
    const accepted = {
      accepted: true as const,
      leadId: '7af46242-3570-4d9c-a08d-a70a07b9b817',
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(accepted), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(submitLeadSubmission(valid, fetcher)).resolves.toEqual(accepted);
    expect(fetcher).toHaveBeenCalledWith('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valid),
    });
  });

  it('turns a non-success JSON response into a safe Error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        error: 'Check the lead form fields and try again',
        code: 'INVALID_LEAD_SUBMISSION',
        internal: 'sensitive details',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(submitLeadSubmission(valid, fetcher)).rejects.toEqual(
      new Error('Check the lead form fields and try again')
    );
  });

  it('uses a stable fallback when an error response is not valid JSON', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('<html>upstream failure</html>', { status: 502 })
    );

    await expect(submitLeadSubmission(valid, fetcher)).rejects.toEqual(
      new Error('Unable to submit your request. Please try again.')
    );
  });
});
