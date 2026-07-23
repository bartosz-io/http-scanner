import { isValidReportHash } from '../../shared/reportHash';
import type {
  ReportShellDocument,
  ReportShellGateway,
} from '../interfaces/gateways/ReportShellGateway';

export interface FetchReportShellQuery {
  hash: string;
  requestUrl: string;
}

/**
 * Application use case for resolving the shared shell behind a report URL.
 */
export class FetchReportShellUseCase {
  constructor(private readonly reportShellGateway: ReportShellGateway) {}

  async execute(query: FetchReportShellQuery): Promise<ReportShellDocument> {
    if (!isValidReportHash(query.hash)) {
      throw new Error('INVALID_HASH_FORMAT');
    }

    return this.reportShellGateway.fetchShell(query.requestUrl);
  }
}
