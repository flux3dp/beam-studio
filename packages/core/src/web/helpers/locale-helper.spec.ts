const mockParse = jest.fn();

jest.mock('bcp-47', () => ({
  parse: (...args) => mockParse(...args),
}));
jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);

import localeHelper from './locale-helper';

const mockConsoleError = jest.fn();

describe('test locale-helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = mockConsoleError;
  });

  describe('test isNorthAmerica', () => {
    test('when locale is en-US and timezone offset is 300', () => {
      const navigator = { language: 'en-US' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);
      mockParse.mockReturnValue({ region: 'US' });
      expect(localeHelper.detectNorthAmerica()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is en-US and timezone offset is 660', () => {
      const navigator = { language: 'en-US' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(660);
      mockParse.mockReturnValue({ region: 'US' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is en-CA and timezone offset is 300', () => {
      const navigator = { language: 'en-CA' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);
      mockParse.mockReturnValue({ region: 'CA' });
      expect(localeHelper.detectNorthAmerica()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is en-CA and timezone offset is 660', () => {
      const navigator = { language: 'en-CA' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(660);
      mockParse.mockReturnValue({ region: 'CA' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is zh-CN and timezone offset is 300', () => {
      const navigator = { language: 'zh-CN' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);
      mockParse.mockReturnValue({ region: 'CN' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is zh-CN and timezone offset is 660', () => {
      const navigator = { language: 'zh-CN' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(660);
      mockParse.mockReturnValue({ region: 'CN' });
      expect(localeHelper.detectNorthAmerica()).toBe(false);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('test isTwOrHk', () => {
    test('when locale is zh-TW', () => {
      const navigator = { language: 'zh-TW' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'TW' });
      expect(localeHelper.detectTwOrHk()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is zh-HK', () => {
      const navigator = { language: 'zh-HK' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'HK' });
      expect(localeHelper.detectTwOrHk()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is zh-CN', () => {
      const navigator = { language: 'zh-CN' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'CN' });
      expect(localeHelper.detectTwOrHk()).toBe(false);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('test isJp', () => {
    test('when locale is ja', () => {
      const navigator = { language: 'ja' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-540);
      mockParse.mockReturnValue({ language: 'ja' });
      expect(localeHelper.detectJp()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is ja-JP', () => {
      const navigator = { language: 'ja-JP' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-540);
      mockParse.mockReturnValue({ region: 'JP' });
      expect(localeHelper.detectJp()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('test isPs', () => {
    test('when locale is ar', () => {
      const navigator = { language: 'ar' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);
      mockParse.mockReturnValue({ language: 'ar' });
      expect(localeHelper.detectPs()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is ar-PS', () => {
      const navigator = { language: 'ar-PS' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);
      mockParse.mockReturnValue({ region: 'PS' });
      expect(localeHelper.detectPs()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('test isMy', () => {
    test('when locale is ms', () => {
      const navigator = { language: 'ms' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-480);
      mockParse.mockReturnValue({ language: 'ms' });
      expect(localeHelper.detectMy()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('when locale is ms-MY', () => {
      const navigator = { language: 'ms-MY' };

      Object.defineProperty(global, 'navigator', { value: navigator });
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-480);
      mockParse.mockReturnValue({ region: 'MY' });
      expect(localeHelper.detectMy()).toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });
});
