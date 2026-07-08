import type { EffectCallback } from 'react';
import { useRef } from 'react';

import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';

import { useMaintenanceData } from './useMaintenanceData';

/**
 * Runs `onEdge` when the selected machine's essentials become all-clear — but only on a genuine
 * false→true transition for the *same* machine. It does not fire on mount, nor when switching to
 * (or back to) an already-healthy machine, since those are selection changes rather than the user
 * completing the checklist. Any cleanup returned by `onEdge` is forwarded.
 */
export const useAllClearEdge = (onEdge: EffectCallback): void => {
  const { health, selection } = useMaintenanceData();
  const prevKey = useRef(selection?.key);

  useDidUpdateEffect(() => {
    const sameMachine = selection?.key === prevKey.current;

    prevKey.current = selection?.key;

    if (!sameMachine || !health.allOk) return undefined;

    return onEdge();
  }, [health.allOk, selection?.key]);
};
