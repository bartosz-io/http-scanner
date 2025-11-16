import { HeaderEntry as HeaderEntryType } from '../../src/types';

export class HeaderEntry implements HeaderEntryType {
  constructor(
    public name: string,
    public value: string | undefined,
    public present: boolean,
    public weight: number,
    public leaking: boolean,
    public awardedScore: number,
    public status?: 'pass' | 'partial' | 'fail' | 'missing' | 'unknown',
    public notes?: string[]
  ) {}

  static create(params: {
    name: string;
    value?: string;
    present: boolean;
    weight: number;
    leaking: boolean;
    awardedScore?: number;
    status?: 'pass' | 'partial' | 'fail' | 'missing' | 'unknown';
    notes?: string[];
  }): HeaderEntry {
    return new HeaderEntry(
      params.name,
      params.value,
      params.present,
      params.weight,
      params.leaking,
      params.awardedScore ?? 0,
      params.status,
      params.notes
    );
  }
}
