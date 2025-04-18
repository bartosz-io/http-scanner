import { Report as ReportType } from '../../src/types';
import { HeaderEntry } from './HeaderEntry';

export class Report implements ReportType {
  constructor(
    public hash: string,
    public url: string,
    public created_at: number,
    public score: number,
    public headers: HeaderEntry[],
    public deleteToken: string,
    public share_image_key?: string | null
  ) {}

  static create(params: {
    hash: string;
    url: string;
    created_at: number;
    score: number;
    headers: HeaderEntry[];
    deleteToken: string;
    share_image_key?: string | null;
  }): Report {
    return new Report(
      params.hash,
      params.url,
      params.created_at,
      params.score,
      params.headers,
      params.deleteToken,
      params.share_image_key
    );
  }
}
