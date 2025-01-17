import FormatDuration from './duration-formatter';

jest.mock('helpers/i18n', () => ({
  lang: {
    monitor: {
      hour: 'h',
      minute: 'm',
      second: 's',
    },
  },
}));

test('test duration-formatter', () => {
  expect(FormatDuration(7200)).toBe('2 h 0 m');
  expect(FormatDuration(1800)).toBe('30 m 0 s');
  expect(FormatDuration(1800)).toBe('30 m 0 s');
  expect(FormatDuration(30)).toBe('30 s');
  expect(FormatDuration(0)).toBe('');
});
