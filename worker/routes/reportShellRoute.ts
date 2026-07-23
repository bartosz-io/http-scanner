import { Hono, type Handler } from 'hono';
import type { ReportShellController } from '../impl/controllers/ReportShellController';

export function createReportShellRoute<Bindings extends object>(
  createController: (bindings: Bindings) => ReportShellController
): Hono<{ Bindings: Bindings }> {
  const reportShellRoute = new Hono<{ Bindings: Bindings }>();

  const serveReportShell: Handler<{ Bindings: Bindings }> = async (c) => {
    const controller = createController(c.env);
    return controller.handleFetchReportShell(c);
  };

  reportShellRoute.get('/:hash', serveReportShell);
  reportShellRoute.get('/:hash/', serveReportShell);

  return reportShellRoute;
}
