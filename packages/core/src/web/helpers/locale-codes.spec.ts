const mockGetActiveLang = jest.fn(() => 'en');

jest.mock('@core/helpers/i18n', () => ({
  getActiveLang: () => mockGetActiveLang(),
}));

import { getLocaleLookupKeys, LOCALE_OVERRIDES, toBcp47 } from './locale-codes';

describe('toBcp47', () => {
  test('maps app codes that mean a different language in BCP-47', () => {
    // kr = Kanuri, se = Northern Sami — both resolve silently to the wrong language
    expect(toBcp47('kr')).toBe('ko');
    expect(toBcp47('se')).toBe('sv');
  });

  test('canonicalizes Chinese region subtags to uppercase', () => {
    expect(toBcp47('zh-tw')).toBe('zh-TW');
    expect(toBcp47('zh-cn')).toBe('zh-CN');
  });

  test('passes through codes that are already valid', () => {
    ['en', 'ja', 'de', 'fr', 'th', 'vi', 'ms', 'id', 'el', 'cs', 'pl', 'ca'].forEach((lang) => {
      expect(toBcp47(lang)).toBe(lang);
    });
  });

  test('defaults to the active language', () => {
    mockGetActiveLang.mockReturnValue('kr');
    expect(toBcp47()).toBe('ko');
  });
});

describe('getLocaleLookupKeys', () => {
  test('overridden codes try the app code first, then the canonical tag', () => {
    expect(getLocaleLookupKeys('kr')).toEqual(['kr', 'ko']);
    expect(getLocaleLookupKeys('zh-tw')).toEqual(['zh-tw', 'zh-TW']);
  });

  test('unmapped codes yield a single key (no duplicates)', () => {
    expect(getLocaleLookupKeys('ja')).toEqual(['ja']);
  });

  test('every override is reachable from its app code', () => {
    Object.entries(LOCALE_OVERRIDES).forEach(([appCode, canonical]) => {
      expect(getLocaleLookupKeys(appCode)).toEqual([appCode, canonical]);
    });
  });
});
