import { invert } from 'remeda';

export type EngraveDpiOption = 'detailed' | 'high' | 'low' | 'medium' | 'ultra';
export type EngraveDpiValue = 125 | 250 | 500 | 1000 | 2000;

export const defaultEngraveDpiOptions: EngraveDpiOption[] = ['low', 'medium', 'high', 'detailed'] as const;

export const dpiValueMap: Record<EngraveDpiOption, EngraveDpiValue> = {
  detailed: 1000,
  high: 500,
  low: 125,
  medium: 250,
  ultra: 2000,
} as const;

export const valueDpiMap: Record<EngraveDpiValue, EngraveDpiOption> = invert(dpiValueMap);
