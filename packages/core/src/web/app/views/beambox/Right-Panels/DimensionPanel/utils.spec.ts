import { getValue } from './utils';

jest.mock('@core/app/actions/beambox/constant', () => ({
  dpmm: 10,
}));

describe('test DimensionPanel/utils', () => {
  test('getValue', () => {
    expect(getValue({ width: 10 }, 'w', { allowUndefined: true, unit: 'mm' })).toBe(1);
    expect(getValue({ width: 10 }, 'w', { allowUndefined: true, unit: 'px' })).toBe(10);
    expect(getValue({ width: 254 }, 'w', { allowUndefined: true, unit: 'in' })).toBeCloseTo(1, 4);
    expect(getValue({ rx: 10 }, 'rx', { allowUndefined: true, unit: 'mm' })).toBe(2);
    expect(getValue({ rx: 10 }, 'rx', { allowUndefined: true, unit: 'px' })).toBe(20);
    expect(getValue({ rx: 254 }, 'rx', { allowUndefined: true, unit: 'in' })).toBeCloseTo(2, 4);
    expect(getValue({ width: 10 }, 'h', { allowUndefined: true, unit: 'mm' })).toBe(undefined);
    expect(getValue({ width: 10 }, 'h', { allowUndefined: false, unit: 'mm' })).toBe(0);
  });
});
