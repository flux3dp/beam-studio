import { useEffect, useState } from 'react';

import { getOS } from '@core/helpers/getOS';

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
