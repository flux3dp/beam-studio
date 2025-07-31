import { useCallback, useState } from 'react';

export const useSetState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);

  const updateState = useCallback((newState: Partial<T>) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  }, []);

  return [state, updateState] as const;
};
