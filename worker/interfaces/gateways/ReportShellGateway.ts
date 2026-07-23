export interface ReportShellDocument {
  body: ReadableStream<Uint8Array> | null;
  headers: Array<[string, string]>;
  status: number;
  statusText: string;
}

/**
 * Output port for loading the static document used by dynamic report URLs.
 * Application code depends on this contract, not on a hosting provider binding.
 */
export interface ReportShellGateway {
  fetchShell(requestUrl: string): Promise<ReportShellDocument>;
}
