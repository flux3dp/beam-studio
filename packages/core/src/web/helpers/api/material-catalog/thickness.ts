import type { MaterialVariant } from '@core/interfaces/IMaterial';

/** Precomposed vulgar fractions; everything else is composed from super/subscript digits */
const FRACTION_GLYPHS: Record<string, string> = {
  '1/2': '½',
  '1/4': '¼',
  '1/8': '⅛',
  '3/4': '¾',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
};

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUBSCRIPT = '₀₁₂₃₄₅₆₇₈₉';
const mapDigits = (value: number, digits: string): string =>
  String(value)
    .split('')
    .map((c) => digits[Number(c)])
    .join('');

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/**
 * Fractional inches → typographic fraction with the inch mark (″), rendered exactly
 * as stored — thickness keeps its marketed fraction (PRD §6.4), no rounding.
 * (1, 8) → "⅛″", (3, 2) → "1 ½″", (5, 64) → "⁵⁄₆₄″""
 */
export const inchDisplay = (num: number, den: number = 1): string => {
  if (!Number.isFinite(num) || !Number.isFinite(den) || num < 0 || den <= 0) return '';

  const whole = Math.floor(num / den);
  const remainder = num - whole * den;

  if (remainder === 0) return `${whole}″`;

  const divisor = gcd(remainder, den);
  const n = remainder / divisor;
  const d = den / divisor;
  // Superscript numerator + U+2044 fraction slash + subscript denominator, any values
  const fraction = FRACTION_GLYPHS[`${n}/${d}`] ?? `${mapDigits(n, SUPERSCRIPT)}⁄${mapDigits(d, SUBSCRIPT)}`;

  return whole > 0 ? `${whole} ${fraction}″` : `${fraction}″`;
};

/**
 * Thickness label in the variant's own authoritative unit: inch variants render
 * typographic fractions, metric variants render mm. Null for unset/0 (D18).
 */
export const getThicknessLabel = ({
  thicknessDen,
  thicknessNum,
  thicknessUnit,
}: Pick<MaterialVariant, 'thicknessDen' | 'thicknessNum' | 'thicknessUnit'>): null | string => {
  if (!thicknessUnit || !thicknessNum) return null;

  return thicknessUnit === 'inch'
    ? inchDisplay(thicknessNum, thicknessDen)
    : `${thicknessNum / (thicknessDen ?? 1)} mm`;
};

export interface ThicknessValue {
  thicknessDen?: number;
  thicknessNum?: number;
  thicknessUnit: 'inch' | 'mm';
}

/** Editor value → stored variant thickness: drops the denominator outside inch mode and collapses "no number" to undefined, ready for addVariant */
export const toVariantThickness = (
  value: ThicknessValue,
): Pick<MaterialVariant, 'thicknessDen' | 'thicknessNum' | 'thicknessUnit'> | undefined =>
  value.thicknessNum
    ? {
        thicknessNum: value.thicknessNum,
        thicknessUnit: value.thicknessUnit,
        ...(value.thicknessUnit === 'inch' && value.thicknessDen && { thicknessDen: value.thicknessDen }),
      }
    : undefined;
