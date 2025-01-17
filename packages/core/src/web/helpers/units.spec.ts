import units from './units';

test('test units', () => {
  expect(units.convertUnit(100, 'pt')).toBe(100);
  expect(units.convertUnit(100, 'xxx' as any)).toBe(100);
  expect(units.convertUnit(100, 'cm', 'mm')).toBe(10);
});
