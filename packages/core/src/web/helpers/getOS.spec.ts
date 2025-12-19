import { getOS, resetOsCache } from './getOS';

describe('getOS', () => {
  const originalNavigator = window.navigator;
  const originalProcess = window.process;

  beforeEach(() => {
    resetOsCache();
    // Reset window.process to undefined for navigator tests
    Object.defineProperty(window, 'process', {
      configurable: true,
      value: undefined,
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original values
    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: originalNavigator,
      writable: true,
    });
    Object.defineProperty(window, 'process', {
      configurable: true,
      value: originalProcess,
      writable: true,
    });
  });

  describe('getOS from navigator.platform', () => {
    const testCases = [
      { os: 'MacOS', platform: 'Macintosh' },
      { os: 'MacOS', platform: 'MacIntel' },
      { os: 'MacOS', platform: 'MacPPC' },
      { os: 'MacOS', platform: 'Mac68K' },
      { os: 'MacOS', platform: 'iPhone' },
      { os: 'MacOS', platform: 'iPad' },
      { os: 'Windows', platform: 'Win32' },
      { os: 'Windows', platform: 'Win64' },
      { os: 'Windows', platform: 'Windows' },
      { os: 'Windows', platform: 'WinCE' },
      { os: 'Linux', platform: 'Linux i686' },
      { os: 'Linux', platform: 'Linux x86_64' },
      { os: 'others', platform: 'SunOS' },
      { os: 'others', platform: 'FreeBSD' },
    ];

    test.each(testCases)('returns $os for navigator.platform=$platform', ({ os, platform }) => {
      resetOsCache();
      Object.defineProperty(window.navigator, 'platform', {
        configurable: true,
        value: platform,
        writable: true,
      });
      expect(getOS()).toBe(os);
    });
  });

  describe('getOS from process.platform (Electron)', () => {
    const testCases = [
      { os: 'MacOS', platform: 'darwin' },
      { os: 'Windows', platform: 'win32' },
      { os: 'Linux', platform: 'linux' },
    ];

    test.each(testCases)('returns $os for process.platform=$platform', ({ os, platform }) => {
      resetOsCache();
      Object.defineProperty(window, 'process', {
        configurable: true,
        value: { platform },
        writable: true,
      });
      expect(getOS()).toBe(os);
    });

    test('process.platform takes priority over navigator.platform', () => {
      resetOsCache();
      Object.defineProperty(window, 'process', {
        configurable: true,
        value: { platform: 'darwin' },
        writable: true,
      });
      Object.defineProperty(window.navigator, 'platform', {
        configurable: true,
        value: 'Win32',
        writable: true,
      });
      expect(getOS()).toBe('MacOS');
    });
  });

  describe('caching behavior', () => {
    test('caches the result after first call', () => {
      resetOsCache();
      Object.defineProperty(window.navigator, 'platform', {
        configurable: true,
        value: 'MacIntel',
        writable: true,
      });
      expect(getOS()).toBe('MacOS');

      // Change platform, but cached value should be returned
      Object.defineProperty(window.navigator, 'platform', {
        configurable: true,
        value: 'Win32',
        writable: true,
      });
      expect(getOS()).toBe('MacOS');
    });

    test('resetOsCache clears the cache', () => {
      resetOsCache();
      Object.defineProperty(window.navigator, 'platform', {
        configurable: true,
        value: 'MacIntel',
        writable: true,
      });
      expect(getOS()).toBe('MacOS');

      resetOsCache();
      Object.defineProperty(window.navigator, 'platform', {
        configurable: true,
        value: 'Win32',
        writable: true,
      });
      expect(getOS()).toBe('Windows');
    });
  });
});
