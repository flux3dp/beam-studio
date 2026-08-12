import { inchDisplay } from './inchDisplay';

describe('inchDisplay', () => {
  test('standard vulgar fractions', () => {
    expect(inchDisplay(0.125)).toBe('⅛″');
    expect(inchDisplay(0.25)).toBe('¼″');
    expect(inchDisplay(0.375)).toBe('⅜″');
    expect(inchDisplay(0.5)).toBe('½″');
    expect(inchDisplay(0.75)).toBe('¾″');
  });

  test('sixteenths use fraction-slash composition glyphs', () => {
    expect(inchDisplay(0.0625)).toBe('¹⁄₁₆″');
    expect(inchDisplay(0.1875)).toBe('³⁄₁₆″');
    expect(inchDisplay(0.3125)).toBe('⁵⁄₁₆″');
  });

  test('rounds to the nearest 1/16', () => {
    expect(inchDisplay(0.118)).toBe('⅛″'); // 3 mm honest conversion
    expect(inchDisplay(0.1969)).toBe('³⁄₁₆″'); // 5 mm
    expect(inchDisplay(0.3937)).toBe('⅜″'); // 10 mm
  });

  test('whole numbers and mixed values', () => {
    expect(inchDisplay(1)).toBe('1″');
    expect(inchDisplay(1.5)).toBe('1 ½″');
    expect(inchDisplay(0.97)).toBe('1″'); // rounds up to the next whole
    expect(inchDisplay(0)).toBe('0″');
  });

  test('invalid input', () => {
    expect(inchDisplay(undefined)).toBe('');
    expect(inchDisplay(Number.NaN)).toBe('');
    expect(inchDisplay(-1)).toBe('');
  });
});
