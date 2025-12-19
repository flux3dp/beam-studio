export type OSName = 'Linux' | 'MacOS' | 'others' | 'Windows';

let osCache: null | OSName = null;

/**
 * getOSByProcess
 * use process.platform to detect OS, works in Electron environment
 */
const getOSByProcess = (): null | OSName => {
  if (window?.process) {
    const platform = window.process.platform;

    if (platform === 'darwin') {
      return 'MacOS';
    }

    if (platform === 'win32') {
      return 'Windows';
    }

    if (platform === 'linux') {
      return 'Linux';
    }
  }

  return null;
};

/**
 * getOSByNavigator
 * use navigator.platform to detect OS, works in web environment
 */
const getOSByNavigator = (): null | OSName => {
  if (typeof navigator !== 'undefined') {
    const { platform } = navigator;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'iPhone', 'iPad'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];

    if (macosPlatforms.includes(platform)) {
      return 'MacOS';
    }

    if (windowsPlatforms.includes(platform)) {
      return 'Windows';
    }

    if (platform.toLowerCase().includes('linux')) {
      return 'Linux';
    }
  }

  return null;
};

export function getOS(): OSName {
  if (osCache !== null) return osCache;

  osCache = getOSByProcess();

  if (osCache !== null) return osCache;

  osCache = getOSByNavigator();

  if (osCache !== null) return osCache;

  return 'others';
}

/**
 * Reset OS cache, for testing purposes only
 */
export const resetOsCache = (): void => {
  osCache = null;
};

export default {
  getOS,
};
