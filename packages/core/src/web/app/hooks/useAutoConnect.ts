import { useEffect, useRef } from 'react';

import handleAutoConnect from '@core/helpers/handleAutoConnect';
import isWeb from '@core/helpers/is-web';

/**
 * Hook that runs QR code auto-connect on mount.
 * Must be called inside AlertProgressContextProvider for MessageCaller to work.
 */
const useAutoConnect = (): void => {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current || !isWeb()) return;

    hasRunRef.current = true;
    void handleAutoConnect();
  }, []);
};

export default useAutoConnect;
