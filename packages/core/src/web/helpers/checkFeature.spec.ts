const mockIsWeb = jest.fn();
const mockIsDev = jest.fn();
const mockLocale = { isPs: false, isTw: false, isTwOrHk: false };

jest.mock('./is-web', () => () => mockIsWeb());
jest.mock('./is-dev', () => () => mockIsDev());
jest.mock('./locale-helper', () => mockLocale);

import { checkFpm1UV } from './checkFeature';

describe('checkFpm1UV', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 2));
    mockIsWeb.mockReturnValue(false);
    mockIsDev.mockReturnValue(false);
    Object.assign(mockLocale, { isPs: false, isTw: false });
  });

  afterEach(() => jest.useRealTimers());

  test('is off elsewhere before the release', () => {
    expect(checkFpm1UV()).toBe(false);
  });

  test('is on in dev, Taiwan and Palestine before the release', () => {
    mockIsDev.mockReturnValue(true);
    expect(checkFpm1UV()).toBe(true);
    mockIsDev.mockReturnValue(false);

    mockLocale.isTw = true;
    expect(checkFpm1UV()).toBe(true);
    mockLocale.isTw = false;

    mockLocale.isPs = true;
    expect(checkFpm1UV()).toBe(true);
  });

  test('is on everywhere from 2027-01-01', () => {
    jest.setSystemTime(new Date(2026, 11, 31, 23, 59));
    expect(checkFpm1UV()).toBe(false);
    jest.setSystemTime(new Date(2027, 0, 1));
    expect(checkFpm1UV()).toBe(true);
  });

  test('is never on the web', () => {
    mockIsWeb.mockReturnValue(true);
    mockIsDev.mockReturnValue(true);
    mockLocale.isTw = true;
    jest.setSystemTime(new Date(2027, 0, 1));
    expect(checkFpm1UV()).toBe(false);
  });
});
