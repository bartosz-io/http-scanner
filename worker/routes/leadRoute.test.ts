import { describe, expect, it } from 'vitest';
import { LeadController } from '../impl/controllers/LeadController';
import { createLeadRoute } from './leadRoute';

const VALID_HASH = '9249232fefb9a1c0455ba007d7784f6c';
const LEAD_ID = '7af46242-3570-4d9c-a08d-a70a07b9b817';

const validSubmission = {
  hash: VALID_HASH,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Please help secure my site.',
  consent: true,
  website: '',
};

function createRoute(
  execute: ConstructorParameters<typeof LeadController>[0]['execute']
) {
  const controller = new LeadController({ execute });
  return createLeadRoute(() => controller);
}

describe('leadRoute', () => {
  it('accepts a valid lead submission', async () => {
    const route = createRoute(async () => ({ leadId: LEAD_ID }));

    const response = await route.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validSubmission),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      accepted: true,
      leadId: LEAD_ID,
    });
  });

  it('rejects malformed JSON with a stable client error', async () => {
    const route = createRoute(async () => ({ leadId: LEAD_ID }));

    const response = await route.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not valid JSON',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Check the lead form fields and try again',
      code: 'INVALID_LEAD_SUBMISSION',
    });
  });

  it('rejects invalid lead fields with a stable client error', async () => {
    const route = createRoute(async () => ({ leadId: LEAD_ID }));

    const response = await route.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validSubmission, email: 'not-an-email' }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Check the lead form fields and try again',
      code: 'INVALID_LEAD_SUBMISSION',
    });
  });

  it('maps ineligible reports without echoing submitted personal data', async () => {
    const route = createRoute(async () => {
      throw new Error('LEAD_NOT_ELIGIBLE');
    });

    const response = await route.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validSubmission),
    });
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(JSON.parse(body)).toEqual({
      error: 'Paid help requests are available for reports scoring below 80',
      code: 'LEAD_NOT_ELIGIBLE',
    });
    expect(body).not.toContain(validSubmission.email);
  });

  it('does not expose unrecognized operational errors', async () => {
    const route = createRoute(async () => {
      throw new Error('D1_ERROR: internal database details');
    });

    const response = await route.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validSubmission),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'An internal error occurred',
      code: 'INTERNAL_ERROR',
    });
  });
});
