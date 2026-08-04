import type { Lead } from '../../entities/Lead';

export interface LeadNotificationService {
  send(lead: Lead): Promise<void>;
}

export interface LeadNotificationConfig {
  to: string;
  from: string;
  fromName: string;
}
