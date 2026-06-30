import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

/** raw data -> display string
 * Hanlding mm -> inch with isInch flag
 */
export const formatter = (
  value: number | string = '',
  {
    config = {},
    isInch = false,
    multiValue = false,
    withUnit = false,
  }: Partial<{
    config: NumberOptionConfig;
    isInch: boolean;
    multiValue: boolean;
    withUnit: boolean;
  }> = {},
) => {
  if (multiValue) return '-';

  const { precision = 4, unit = '' } = config;

  let newVal = typeof value === 'string' ? Number.parseFloat(value) : value;

  if (isInch) newVal /= 25.4;

  let displayValue = newVal.toFixed(precision);

  if (withUnit) displayValue += ` ${unit}`;

  return displayValue;
};
