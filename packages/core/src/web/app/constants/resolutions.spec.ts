import { getEngraveDpmm } from './resolutions';

test('BeamGo uses the 1016 DPI grid without changing existing Promark resolution', () => {
  expect(getEngraveDpmm('detailed', 'fbg1')).toBe(40);
  expect(getEngraveDpmm('detailed', 'fpm1')).toBe(50);
  expect(getEngraveDpmm('detailed', 'fhx2rf')).toBe(40);
});
