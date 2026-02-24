import { useEffect, useState } from 'react';

import { match, P } from 'ts-pattern';

import { getOS } from '@core/helpers/getOS';
import os from '@core/implementations/os';

export const isMobile = (): boolean => window.innerWidth < 601;

export const isMac = (): boolean => getOS() === 'MacOS';

export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const useIsMobile = (): boolean => {
  const [val, setVal] = useState(isMobile);

  useEffect(() => {
    const handler = () => setVal(isMobile());

    window.addEventListener('resize', handler);

    return () => window.removeEventListener('resize', handler);
  }, []);

  return val;
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
