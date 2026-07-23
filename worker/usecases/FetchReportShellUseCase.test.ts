import { describe, expect, it, vi } from 'vitest';
import type {
  ReportShellDocument,
  ReportShellGateway,
} from '../interfaces/gateways/ReportShellGateway';
import { FetchReportShellUseCase } from './FetchReportShellUseCase';

const REPORT_HASH = '9249232fefb9a1c0455ba007d7784f6c';
const SHELL_DOCUMENT: ReportShellDocument = {
  body: null,
  headers: [['content-type', 'text/html; charset=utf-8']],
  status: 200,
  statusText: 'OK',
};

function createGateway(fetchShell: ReportShellGateway['fetchShell']): ReportShellGateway {
  return { fetchShell };
}

describe('FetchReportShellUseCase', () => {
  it('delegates a valid report URL to the output port', async () => {
    const fetchShell = vi.fn<ReportShellGateway['fetchShell']>(
      async () => SHELL_DOCUMENT
    );
    const useCase = new FetchReportShellUseCase(createGateway(fetchShell));

    await expect(useCase.execute({
      hash: REPORT_HASH,
      requestUrl: `https://httpscanner.com/report/${REPORT_HASH}`,
    })).resolves.toBe(SHELL_DOCUMENT);
    expect(fetchShell).toHaveBeenCalledWith(
      `https://httpscanner.com/report/${REPORT_HASH}`
    );
  });

  it('rejects an invalid hash without calling the output port', async () => {
    const fetchShell = vi.fn<ReportShellGateway['fetchShell']>();
    const useCase = new FetchReportShellUseCase(createGateway(fetchShell));

    await expect(useCase.execute({
      hash: 'not-a-hash',
      requestUrl: 'https://httpscanner.com/report/not-a-hash',
    })).rejects.toThrow('INVALID_HASH_FORMAT');
    expect(fetchShell).not.toHaveBeenCalled();
  });
});
