import { HeaderEntry } from './HeaderEntry';

export interface ScanResult {
  hash: string;
  url: string;
  created_at: number;
  score: number;
  headers: HeaderEntry[];
  deleteToken: string;
  share_image_key: string | null;
}
