import type {
  LeadSubmissionRequestDTO,
  LeadSubmissionResponseDTO,
} from '../types';

const SUBMISSION_ERROR_MESSAGE = 'Unable to submit your request. Please try again.';

export async function submitLeadSubmission(
  input: LeadSubmissionRequestDTO,
  fetcher: typeof fetch = fetch
): Promise<LeadSubmissionResponseDTO> {
  const response = await fetcher('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === 'object' && 'error' in body &&
      typeof body.error === 'string'
      ? body.error
      : SUBMISSION_ERROR_MESSAGE;
    throw new Error(message);
  }

  return response.json() as Promise<LeadSubmissionResponseDTO>;
}
