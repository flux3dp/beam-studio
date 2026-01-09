import { useEffect, useState } from 'react';

import { getOS } from '@core/helpers/getOS';
import os from '@core/implementations/os';

export const isMobile = (): boolean => window.innerWidth < 601;

export const isMac = (): boolean => getOS() === 'MacOS';

export const useIsMobile = (): boolean => {
  const [val, setVal] = useState<boolean>(isMobile());

  useEffect(() => {
    const handler = () => {
      const newVal = isMobile();

      if (val !== newVal) {
        setVal(newVal);
      }
    };

    window.addEventListener('resize', handler);

    return () => window.removeEventListener('resize', handler);
  });

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

  if (osType === 'MacOS') {
    if (arch === 'arm64') return 'Apple Silicon';

    if (arch === 'x64') return 'Intel';
  }

  if (osType === 'Windows') {
    if (arch === 'x64') return '64-bit';

    if (arch === 'arm64') return 'ARM64';

    if (arch === 'ia32' || arch === 'x32') return '32-bit';
  }

  if (osType === 'Linux') {
    if (arch === 'x64') return 'x86_64';

    if (arch === 'arm64') return 'ARM64';

    if (arch === 'arm') return 'ARM';
  }

  // Fallback: return the raw arch value
  return arch;
};
