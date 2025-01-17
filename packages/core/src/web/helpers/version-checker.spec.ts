import VersionChecker from './version-checker';

test('test version-checker', () => {
  expect(VersionChecker('2.0.0').meetRequirement('MAINTAIN_WITH_LINECHECK')).toBeFalsy();
  expect(VersionChecker('3.2').meetRequirement('MAINTAIN_WITH_LINECHECK')).toBeFalsy();
  expect(VersionChecker('3.2.6').meetRequirement('MAINTAIN_WITH_LINECHECK')).toBeTruthy();
  expect(VersionChecker('3.2.7').meetRequirement('MAINTAIN_WITH_LINECHECK')).toBeTruthy();
  expect(VersionChecker('3.3.0').meetRequirement('MAINTAIN_WITH_LINECHECK')).toBeTruthy();
  expect(VersionChecker('3.3').meetRequirement('MAINTAIN_WITH_LINECHECK')).toBeTruthy();
  expect(VersionChecker('1.5a12').meetRequirement('BACKLASH')).toBeFalsy();
  expect(VersionChecker('1.5b12').meetRequirement('BACKLASH')).toBeTruthy();
});
