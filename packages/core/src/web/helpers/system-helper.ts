import { match, P } from 'ts-pattern';

import { getOS } from '@core/helpers/getOS';
import os from '@core/implementations/os';

const isMacCache = getOS() === 'MacOS';

export const isMac = (): boolean => isMacCache;

export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

/**
 * Get a user-friendly display name for the CPU architecture
 * Returns values like "Apple Silicon", "Intel 64-bit", "ARM64", etc.
 */
export const getArchDisplayName = (): null | string => {
  const arch = os.arch();
  const osType = getOS();

  if (!arch) return null;

  return match([osType, arch])
    .with(['MacOS', 'arm64'], () => 'Apple Silicon')
    .with(['MacOS', 'x64'], () => 'Intel')
    .with(['Windows', 'x64'], () => '64-bit')
    .with(['Windows', 'arm64'], () => 'ARM64')
    .with(['Windows', P.union('ia32', 'x32')], () => '32-bit')
    .with(['Linux', 'x64'], () => 'x86_64')
    .with(['Linux', 'arm64'], () => 'ARM64')
    .with(['Linux', 'arm'], () => 'ARM')
    .otherwise(() => arch);
};
