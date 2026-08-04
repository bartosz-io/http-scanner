import { Hono } from 'hono';
import type { LeadController } from '../impl/controllers/LeadController';
import { mapErrorResponse } from '../impl/middleware/errorHandler';

export function createLeadRoute<Bindings extends object>(
  createController: (bindings: Bindings) => LeadController
): Hono<{ Bindings: Bindings }> {
  const route = new Hono<{ Bindings: Bindings }>();

  route.onError((error, c) => mapErrorResponse(error, c));
  route.post('/', (c) => createController(c.env).handleSubmitLead(c));

  return route;
}
