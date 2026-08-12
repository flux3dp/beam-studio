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
 * Decimal inches → typographic fraction with the inch mark (″), rounded to the
 * nearest 1/16 for display (PRD §6.4). The exact decimal stays in storage.
 * 0.125 → "⅛″", 1.5 → "1 ½″", 0.15625 → "⁵⁄₁₆″"
 */
export const inchDisplay = (decimal: number | undefined): string => {
  if (decimal === undefined || Number.isNaN(decimal) || decimal < 0) return '';

  const whole = Math.floor(decimal);
  let numerator = Math.round((decimal - whole) * 16);

  if (numerator === 16) return `${whole + 1}″`;

  if (numerator === 0) return `${whole}″`;

  const divisor = gcd(numerator, 16);
  const n = numerator / divisor;
  const d = 16 / divisor;
  // U+2044 fraction slash for non-standard fractions
  const fraction = FRACTION_GLYPHS[`${n}/${d}`] ?? `${n}⁄${d}`;

  return whole > 0 ? `${whole} ${fraction}″` : `${fraction}″`;
};
