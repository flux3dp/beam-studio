import { invert } from 'remeda';
import { match } from 'ts-pattern';

import type { WorkAreaModel } from './workarea-constants';

export type EngraveDpiOption = 'detailed' | 'high' | 'low' | 'medium' | 'ultra';
export type EngraveDpiValue = 125 | 250 | 500 | 1000 | 2000;
export type EngraveDpmmValue = 5 | 10 | 20 | 40 | 50 | 80;

export const defaultEngraveDpiOptions: EngraveDpiOption[] = ['low', 'medium', 'high', 'detailed'] as const;

export const dpiValueMap: Record<EngraveDpiOption, EngraveDpiValue> = {
  detailed: 1000,
  high: 500,
  low: 125,
  medium: 250,
  ultra: 2000,
} as const;

export const valueDpiMap: Record<EngraveDpiValue, EngraveDpiOption> = invert(dpiValueMap);
export const getEngraveDpmm = (dpi: EngraveDpiOption, workarea: WorkAreaModel): EngraveDpmmValue => {
  return match<EngraveDpiOption, EngraveDpmmValue>(dpi)
    .with('ultra', () => (workarea === 'fhx2rf' ? 80 : 50))
    .with('detailed', () => (workarea === 'fhx2rf' ? 40 : 50))
    .with('high', () => 20)
    .with('medium', () => 10)
    .with('low', () => 5)
    .exhaustive();
};
