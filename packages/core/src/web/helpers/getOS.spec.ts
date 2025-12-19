import globalHelper from './getOS';

test('test global-helper', () => {
  for (const { os, platform } of [
    {
      os: 'MacOS',
      platform: 'Macintosh',
    },
    {
      os: 'MacOS',
      platform: 'MacIntel',
    },
    {
      os: 'MacOS',
      platform: 'MacPPC',
    },
    {
      os: 'MacOS',
      platform: 'Mac68K',
    },
    {
      os: 'Windows',
      platform: 'Win32',
    },
    {
      os: 'Windows',
      platform: 'Win64',
    },
    {
      os: 'Windows',
      platform: 'Windows',
    },
    {
      os: 'Windows',
      platform: 'WinCE',
    },
    {
      os: 'Linux',
      platform: 'Linux i686',
    },
    {
      os: 'others',
      platform: 'SunOS',
    },
  ]) {
    Object.defineProperty(window.navigator, 'platform', {
      value: platform,
      writable: true,
    });
    globalHelper.setWindowMember();
    expect(window.os).toBe(os);
  }
});
