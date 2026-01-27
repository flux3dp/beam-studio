export interface BoxTypeOption {
  key: string;
  labelKey: string;
  value: string;
}

export const BOX_TYPE_OPTIONS: BoxTypeOption[] = [
  {
    key: 'basic',
    labelKey: 'basic_box',
    value: 'basic',
  },
  // Future box types can be added here
];
