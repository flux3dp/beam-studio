import { useEffect, useRef } from 'react';

import handleAutoConnect from '@core/helpers/handleAutoConnect';
import isWeb from '@core/helpers/is-web';

/**
 * Component that runs QR code auto-connect on mount.
 * Must be inside AlertProgressContextProvider for MessageCaller to work.
 */
export function AutoConnectHandler(): null {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current || !isWeb()) return;

    hasRunRef.current = true;
    // void operator for fire-and-forget promise
    void handleAutoConnect();
  }, []);

  return null;
}
