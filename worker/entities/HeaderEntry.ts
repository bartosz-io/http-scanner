import { HeaderEntry as HeaderEntryType } from '../../src/types';

export class HeaderEntry implements HeaderEntryType {
  constructor(
    public name: string,
    public value: string | undefined,
    public present: boolean,
    public weight: number,
    public leaking: boolean
  ) {}

  static create(params: {
    name: string;
    value?: string;
    present: boolean;
    weight: number;
    leaking: boolean;
  }): HeaderEntry {
    return new HeaderEntry(
      params.name,
      params.value,
      params.present,
      params.weight,
      params.leaking
    );
  }
}
