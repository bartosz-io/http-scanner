export type LeadEmailStatus = 'pending' | 'sent' | 'failed';

export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string | null;
  scannedUrl: string;
  reportHash: string;
  reportUrl: string;
  score: number;
  consentVersion: string;
  emailStatus: LeadEmailStatus;
  emailError: string | null;
  createdAt: number;
}
