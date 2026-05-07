import { useEffect, useRef, useState } from 'react';

import type { StyleOption } from './getStyleOptions';
import { getStyleOptions } from './getStyleOptions';

/**
 * Hook that returns available font style options for a given family.
 * Handles race conditions from rapid family changes via a call-ID guard.
 */
export const useFontStyleOptions = (family: string): StyleOption[] => {
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>([]);
  const callIdRef = useRef(0);

  useEffect(() => {
    const callId = callIdRef.current > 10000 ? 1 : callIdRef.current + 1;

    callIdRef.current = callId;

    const fetchOptions = async () => {
      const options = await getStyleOptions(family);

      if (callIdRef.current === callId) {
        setStyleOptions(options);
      }
    };

    fetchOptions();
  }, [family]);

  return styleOptions;
};
