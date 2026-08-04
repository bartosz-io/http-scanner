import { describe, expect, it } from 'vitest';
import { LEAD_FIELD_LIMITS, leadSubmissionSchema } from './leadSubmission';

const valid = {
  hash: '9249232fefb9a1c0455ba007d7784f6c',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Please help with CSP.',
  consent: true,
  website: '',
};

describe('leadSubmissionSchema', () => {
  it('trims and accepts valid input', () => {
    expect(leadSubmissionSchema.parse({ ...valid, name: ' Ada ' }).name).toBe('Ada');
  });

  it.each([
    { ...valid, name: '' },
    { ...valid, email: 'invalid' },
    { ...valid, consent: false },
    { ...valid, hash: 'bad' },
    { ...valid, website: 'bot.example' },
    { ...valid, message: 'x'.repeat(LEAD_FIELD_LIMITS.message + 1) },
  ])('rejects invalid input %#', (input) => {
    expect(leadSubmissionSchema.safeParse(input).success).toBe(false);
  });
});
