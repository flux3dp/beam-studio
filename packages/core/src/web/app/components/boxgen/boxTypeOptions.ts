import type { ILang } from '@core/interfaces/ILang';

export interface BoxTypeOption {
  key: string;
  labelKey: keyof ILang['boxgen'];
  value: string;
}

export const BOX_TYPE_OPTIONS: BoxTypeOption[] = [
  {
    key: 'basic',
    labelKey: 'basic_box',
    value: 'basic',
  },
];
