import type { Context } from 'hono';
import {
  leadSubmissionSchema,
  type LeadSubmissionResponseDTO,
} from '../../../shared/leadSubmission';
import type { SubmitLeadUseCase } from '../../usecases/SubmitLeadUseCase';

type SubmitLead = Pick<SubmitLeadUseCase, 'execute'>;

export class LeadController {
  constructor(private readonly submitLead: SubmitLead) {}

  async handleSubmitLead(c: Context): Promise<Response> {
    const body = await c.req.json().catch(() => null);
    const parsed = leadSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      throw new Error('INVALID_LEAD_SUBMISSION');
    }

    const result = await this.submitLead.execute(parsed.data);

    return c.json<LeadSubmissionResponseDTO>({
      accepted: true,
      leadId: result.leadId,
    }, 201);
  }
}
