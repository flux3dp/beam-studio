import { useCallback, useMemo, useRef } from 'react';

export const useAsyncTask = () => {
  const completedCallID = useRef(0);
  const pendingCallID = useRef(0);

  const getNextCallID = useCallback(() => {
    return ++pendingCallID.current;
  }, []);

  const checkIsLatestCall = useCallback((callID: number) => {
    const isLatest = callID > completedCallID.current;

    if (isLatest) completedCallID.current = callID;

    return isLatest;
  }, []);

  return useMemo(() => ({ checkIsLatestCall, getNextCallID }), [checkIsLatestCall, getNextCallID]);
};
