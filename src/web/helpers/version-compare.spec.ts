import versionCompare from './version-compare';

test('test version-compare', () => {
  expect(versionCompare('1.2.3', '1.2.3')).toBeFalsy();
  expect(versionCompare('1.2.3', '1.2.4')).toBeTruthy();
  expect(versionCompare('1.2.3', '1.2.2')).toBeFalsy();
  expect(versionCompare('1.2', '1.2.3')).toBeTruthy();
  expect(versionCompare('1.2.3', '1.2')).toBeFalsy();
});
