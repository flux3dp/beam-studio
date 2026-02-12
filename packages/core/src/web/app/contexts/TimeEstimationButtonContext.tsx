import React, { useCallback, useEffect, useMemo, useState } from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

interface ITimeEstimationButtonContext {
  estimatedTime: null | number;
  setEstimatedTime: (estimatedTime: null | number) => void;
}

export const TimeEstimationButtonContext = React.createContext<ITimeEstimationButtonContext>({
  estimatedTime: null,
  setEstimatedTime: () => {},
});

const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

interface TimeEstimationButtonContextProviderProps {
  children: React.ReactNode;
}

export const TimeEstimationButtonContextProvider = ({
  children,
}: TimeEstimationButtonContextProviderProps): React.JSX.Element => {
  const [estimatedTime, setEstimatedTime] = useState<null | number>(null);

  const handleSetEstimatedTime = useCallback((newTime: null | number) => {
    setEstimatedTime((prev) => (newTime !== prev ? newTime : prev));
  }, []);

  useEffect(() => {
    timeEstimationButtonEventEmitter.on('SET_ESTIMATED_TIME', handleSetEstimatedTime);

    return () => {
      timeEstimationButtonEventEmitter.removeListener('SET_ESTIMATED_TIME', handleSetEstimatedTime);
    };
  }, [handleSetEstimatedTime]);

  const value = useMemo(
    () => ({ estimatedTime, setEstimatedTime: handleSetEstimatedTime }),
    [estimatedTime, handleSetEstimatedTime],
  );

  return <TimeEstimationButtonContext value={value}>{children}</TimeEstimationButtonContext>;
};
