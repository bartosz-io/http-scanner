import { Lead } from '../../entities/Lead';

export interface LeadRepository {
  save(lead: Lead): Promise<void>;
  markEmailSent(id: string): Promise<void>;
  markEmailFailed(id: string, errorCode: string): Promise<void>;
}
