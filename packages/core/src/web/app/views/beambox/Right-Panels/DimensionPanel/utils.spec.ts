import { getValue } from './utils';

jest.mock('app/actions/beambox/constant', () => ({
  dpmm: 10,
}));

describe('test DimensionPanel/utils', () => {
  test('getValue', () => {
    expect(getValue({ width: 10 }, 'w', { unit: 'mm', allowUndefined: true })).toBe(1);
    expect(getValue({ width: 10 }, 'w', { unit: 'px', allowUndefined: true })).toBe(10);
    expect(getValue({ width: 254 }, 'w', { unit: 'in', allowUndefined: true })).toBeCloseTo(1, 4);
    expect(getValue({ rx: 10 }, 'rx', { unit: 'mm', allowUndefined: true })).toBe(2);
    expect(getValue({ rx: 10 }, 'rx', { unit: 'px', allowUndefined: true })).toBe(20);
    expect(getValue({ rx: 254 }, 'rx', { unit: 'in', allowUndefined: true })).toBeCloseTo(2, 4);
    expect(getValue({ width: 10 }, 'h', { unit: 'mm', allowUndefined: true })).toBe(undefined);
    expect(getValue({ width: 10 }, 'h', { unit: 'mm', allowUndefined: false })).toBe(0);
  });
});
