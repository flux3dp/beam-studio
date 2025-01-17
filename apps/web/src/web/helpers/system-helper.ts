import { useEffect, useState } from 'react';

export const isMobile = (): boolean => window.innerWidth < 601;

export const isMac = (): boolean => window.os === 'MacOS';

export const useIsMobile = (): boolean => {
  const [val, setVal] = useState<boolean>(isMobile());
  useEffect(() => {
    const handler = () => {
      const newVal = isMobile();
      if (val !== newVal) setVal(newVal);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });

  return val;
};
