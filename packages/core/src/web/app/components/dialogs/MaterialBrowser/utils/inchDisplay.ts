import type { MaterialVariant } from '@core/interfaces/IMaterial';

const FRACTION_GLYPHS: Record<string, string> = {
  '1/2': '½',
  '1/4': '¼',
  '1/8': '⅛',
  '1/16': '¹⁄₁₆',
  '3/4': '¾',
  '3/8': '⅜',
  '3/16': '³⁄₁₆',
  '5/8': '⅝',
  '5/16': '⁵⁄₁₆',
  '7/8': '⅞',
  '7/16': '⁷⁄₁₆',
  '9/16': '⁹⁄₁₆',
  '11/16': '¹¹⁄₁₆',
  '13/16': '¹³⁄₁₆',
  '15/16': '¹⁵⁄₁₆',
};

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/**
 * Fractional inches → typographic fraction with the inch mark (″), rendered exactly
 * as stored — thickness keeps its marketed fraction (PRD §6.4), no rounding.
 * (1, 8) → "⅛″", (3, 2) → "1 ½″", (5, 64) → "5⁄64″"
 */
export const inchDisplay = (num: number, den: number = 1): string => {
  if (!Number.isFinite(num) || !Number.isFinite(den) || num < 0 || den <= 0) return '';

  const whole = Math.floor(num / den);
  const remainder = num - whole * den;

  if (remainder === 0) return `${whole}″`;

  const divisor = gcd(remainder, den);
  const n = remainder / divisor;
  const d = den / divisor;
  // U+2044 fraction slash for non-standard fractions
  const fraction = FRACTION_GLYPHS[`${n}/${d}`] ?? `${n}⁄${d}`;

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
