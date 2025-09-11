const mockParse = jest.fn();

jest.mock('bcp-47', () => ({ parse: mockParse }));

const mockGetTimezoneOffset = jest.fn();

jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(mockGetTimezoneOffset);

import localeHelper from './locale-helper';

Object.defineProperty(global, 'navigator', { value: { language: 'not-important' } });

describe('test locale-helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('test isNorthAmerica', () => {
    test('when region is US and timezone offset is 300', () => {
      mockGetTimezoneOffset.mockReturnValue(300);
      mockParse.mockReturnValue({ region: 'US' });
      expect(localeHelper.detectNorthAmerica()).toBe(true);
    });

    test('when region is US and timezone offset is 660', () => {
      mockGetTimezoneOffset.mockReturnValue(660);
      mockParse.mockReturnValue({ region: 'US' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
    });

    test('when region is CA and timezone offset is 300', () => {
      mockGetTimezoneOffset.mockReturnValue(300);
      mockParse.mockReturnValue({ region: 'CA' });
      expect(localeHelper.detectNorthAmerica()).toBe(true);
    });

    test('when region is CA and timezone offset is 660', () => {
      mockGetTimezoneOffset.mockReturnValue(660);
      mockParse.mockReturnValue({ region: 'CA' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
    });

    test('when region is CN and timezone offset is 300', () => {
      mockGetTimezoneOffset.mockReturnValue(300);
      mockParse.mockReturnValue({ region: 'CN' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
    });

    test('when region is CN and timezone offset is 660', () => {
      mockGetTimezoneOffset.mockReturnValue(660);
      mockParse.mockReturnValue({ region: 'CN' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
    });
  });

  describe('test isTwOrHk', () => {
    test('when region is TW', () => {
      mockGetTimezoneOffset.mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'TW' });
      expect(localeHelper.detectTwOrHk()).toBe(true);
    });

    test('when region is HK', () => {
      mockGetTimezoneOffset.mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'HK' });
      expect(localeHelper.detectTwOrHk()).toBe(true);
    });

    test('when region is CN', () => {
      mockGetTimezoneOffset.mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'CN' });
      expect(localeHelper.detectTwOrHk()).toBe(false);
    });
  });

  describe('test isJp', () => {
    test('when language is ja', () => {
      mockGetTimezoneOffset.mockReturnValue(-540);
      mockParse.mockReturnValue({ language: 'ja' });
      expect(localeHelper.detectJp()).toBe(true);
    });

    test('when region is JP', () => {
      mockGetTimezoneOffset.mockReturnValue(-540);
      mockParse.mockReturnValue({ region: 'JP' });
      expect(localeHelper.detectJp()).toBe(true);
    });
  });

  describe('test isKr', () => {
    test('when language is ko', () => {
      mockGetTimezoneOffset.mockReturnValue(-540);
      mockParse.mockReturnValue({ language: 'ko' });
      expect(localeHelper.detectKr()).toBe(true);
    });
    test('when region is KR', () => {
      mockGetTimezoneOffset.mockReturnValue(-540);
      mockParse.mockReturnValue({ region: 'KR' });
      expect(localeHelper.detectKr()).toBe(true);
    });
    test('when region is US', () => {
      mockGetTimezoneOffset.mockReturnValue(-540);
      mockParse.mockReturnValue({ region: 'US' });
      expect(localeHelper.detectKr()).toBe(false);
    });
  });

  describe('test isPs', () => {
    test('when language is ar', () => {
      mockGetTimezoneOffset.mockReturnValue(-120);
      mockParse.mockReturnValue({ language: 'ar' });
      expect(localeHelper.detectPs()).toBe(true);
    });

    test('when region is PS', () => {
      mockGetTimezoneOffset.mockReturnValue(-120);
      mockParse.mockReturnValue({ region: 'PS' });
      expect(localeHelper.detectPs()).toBe(true);
    });
  });

  describe('test isMy', () => {
    test('when language is ms', () => {
      mockGetTimezoneOffset.mockReturnValue(-480);
      mockParse.mockReturnValue({ language: 'ms' });
      expect(localeHelper.detectMy()).toBe(true);
    });

    test('when region is MY', () => {
      mockGetTimezoneOffset.mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'MY' });
      expect(localeHelper.detectMy()).toBe(true);
    });
  });

  describe('test isAu', () => {
    test('when language is en and timezone offset is -480', () => {
      mockGetTimezoneOffset.mockReturnValue(-480);
      mockParse.mockReturnValue({ language: 'en' });
      expect(localeHelper.detectAu()).toBe(true);
    });

    test('when region is AU and timezone offset is -660', () => {
      mockGetTimezoneOffset.mockReturnValue(-660);
      mockParse.mockReturnValue({ region: 'AU' });
      expect(localeHelper.detectAu()).toBe(true);
    });

    test('when timezone offset is outside range', () => {
      mockGetTimezoneOffset.mockReturnValue(0);
      mockParse.mockReturnValue({ region: 'AU' });
      expect(localeHelper.detectAu()).toBe(false);
    });
  });

  describe('test isAr', () => {
    test('when language is es', () => {
      mockGetTimezoneOffset.mockReturnValue(180);
      mockParse.mockReturnValue({ language: 'es' });
      expect(localeHelper.detectAr()).toBe(true);
    });

    test('when region is AR', () => {
      mockGetTimezoneOffset.mockReturnValue(180);
      mockParse.mockReturnValue({ region: 'AR' });
      expect(localeHelper.detectAr()).toBe(true);
    });

    test('when region is AR but timezone offset is wrong', () => {
      mockGetTimezoneOffset.mockReturnValue(0);
      mockParse.mockReturnValue({ region: 'AR' });
      expect(localeHelper.detectAr()).toBe(false);
    });
  });
});
