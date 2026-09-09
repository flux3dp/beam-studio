import { getThicknessLabel, inchDisplay, toVariantThickness } from './inchDisplay';

describe('inchDisplay', () => {
  test('standard vulgar fractions', () => {
    expect(inchDisplay(1, 8)).toBe('⅛″');
    expect(inchDisplay(1, 4)).toBe('¼″');
    expect(inchDisplay(3, 8)).toBe('⅜″');
    expect(inchDisplay(1, 2)).toBe('½″');
    expect(inchDisplay(3, 4)).toBe('¾″');
  });

  test('sixteenths use fraction-slash composition glyphs', () => {
    expect(inchDisplay(1, 16)).toBe('¹⁄₁₆″');
    expect(inchDisplay(3, 16)).toBe('³⁄₁₆″');
    expect(inchDisplay(5, 16)).toBe('⁵⁄₁₆″');
  });

  test('any other denominator composes super/subscript digits', () => {
    expect(inchDisplay(5, 64)).toBe('⁵⁄₆₄″'); // 2 mm bamboo
    expect(inchDisplay(1, 32)).toBe('¹⁄₃₂″'); // 1 mm denim
    expect(inchDisplay(11, 20)).toBe('¹¹⁄₂₀″');
    expect(inchDisplay(7, 100)).toBe('⁷⁄₁₀₀″');
  });

  test('fractions reduce before rendering', () => {
    expect(inchDisplay(2, 16)).toBe('⅛″');
    expect(inchDisplay(8, 64)).toBe('⅛″');
  });

  test('whole numbers and mixed values', () => {
    expect(inchDisplay(1)).toBe('1″');
    expect(inchDisplay(3, 2)).toBe('1 ½″');
    expect(inchDisplay(0)).toBe('0″');
  });

  test('invalid input', () => {
    expect(inchDisplay(Number.NaN)).toBe('');
    expect(inchDisplay(-1)).toBe('');
    expect(inchDisplay(1, 0)).toBe('');
  });
});

describe('getThicknessLabel', () => {
  test('renders in the material own authoritative unit', () => {
    expect(getThicknessLabel({ thicknessNum: 3, thicknessUnit: 'mm' })).toBe('3 mm');
    expect(getThicknessLabel({ thicknessDen: 8, thicknessNum: 1, thicknessUnit: 'inch' })).toBe('⅛″');
  });

  test('null for unset or zero thickness (D18)', () => {
    expect(getThicknessLabel({})).toBeNull();
    expect(getThicknessLabel({ thicknessNum: 0, thicknessUnit: 'mm' })).toBeNull();
    expect(getThicknessLabel({ thicknessNum: 3 })).toBeNull();
  });
});

describe('toVariantThickness', () => {
  test('keeps the denominator only in inch mode; no number → undefined', () => {
    expect(toVariantThickness({ thicknessDen: 8, thicknessNum: 1, thicknessUnit: 'inch' })).toEqual({
      thicknessDen: 8,
      thicknessNum: 1,
      thicknessUnit: 'inch',
    });
    expect(toVariantThickness({ thicknessDen: 8, thicknessNum: 3, thicknessUnit: 'mm' })).toEqual({
      thicknessNum: 3,
      thicknessUnit: 'mm',
    });
    expect(toVariantThickness({ thicknessUnit: 'mm' })).toBeUndefined();
  });
});
