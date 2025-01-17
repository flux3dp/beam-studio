/* eslint-disable no-restricted-syntax */
import globalHelper from './global-helper';

test('test global-helper', () => {
  for (const { platform, os } of [{
    platform: 'Macintosh', os: 'MacOS',
  }, {
    platform: 'MacIntel', os: 'MacOS',
  }, {
    platform: 'MacPPC', os: 'MacOS',
  }, {
    platform: 'Mac68K', os: 'MacOS',
  }, {
    platform: 'Win32', os: 'Windows',
  }, {
    platform: 'Win64', os: 'Windows',
  }, {
    platform: 'Windows', os: 'Windows',
  }, {
    platform: 'WinCE', os: 'Windows',
  }, {
    platform: 'Linux i686', os: 'Linux',
  }, {
    platform: 'SunOS', os: 'others',
  }]) {
    Object.defineProperty(window.navigator, 'platform', {
      value: platform,
      writable: true,
    });
    globalHelper.setWindowMember();
    expect(window.os).toBe(os);
  }
});
