import React, { useCallback, useEffect, useMemo, useState } from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

export const TopBarHintsContext = React.createContext<{
  hintType: string;
}>({
  hintType: null,
});

const topBarHintsEventEmitter = eventEmitterFactory.createEventEmitter('top-bar-hints');

interface TopBarHintsContextProviderProps {
  children: React.ReactNode;
}

export const TopBarHintsContextProvider = ({ children }: TopBarHintsContextProviderProps): React.JSX.Element => {
  const [hintType, setHintType] = useState<string>(null);

  const setHint = useCallback((type: string) => setHintType(type), []);
  const removeHint = useCallback(() => setHintType(null), []);

  useEffect(() => {
    topBarHintsEventEmitter.on('SET_HINT', setHint);
    topBarHintsEventEmitter.on('REMOVE_HINT', removeHint);

    return () => {
      topBarHintsEventEmitter.off('SET_HINT', setHint);
      topBarHintsEventEmitter.off('REMOVE_HINT', removeHint);
    };
  }, [setHint, removeHint]);

  const value = useMemo(() => ({ hintType }), [hintType]);

  return <TopBarHintsContext value={value}>{children}</TopBarHintsContext>;
};
