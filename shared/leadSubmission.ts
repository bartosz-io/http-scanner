import { z } from 'zod';
import { isValidReportHash } from './reportHash';

export const LEAD_CONSENT_VERSION = 'paid-security-contact-v1';
export const LEAD_FIELD_LIMITS = { name: 100, email: 254, message: 2000 } as const;

export const leadSubmissionSchema = z.object({
  hash: z.string().refine(isValidReportHash, 'Invalid report identifier.'),
  name: z.string().trim().min(1, 'Enter your name.').max(100),
  email: z.string().trim().email('Enter a valid email address.').max(254),
  message: z.string().trim().max(2000).default(''),
  consent: z.boolean().refine(Boolean, 'Consent is required.'),
  website: z.string().max(0, 'Invalid submission.').default(''),
});

export type LeadSubmissionRequestDTO = z.infer<typeof leadSubmissionSchema>;

export interface LeadSubmissionResponseDTO {
  accepted: true;
  leadId: string;
}
