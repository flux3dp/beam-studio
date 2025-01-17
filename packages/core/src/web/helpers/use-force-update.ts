import { useCallback, useState } from 'react';

const useForceUpdate = (): () => void => {
  const [, setVal] = useState(0);
  const forceUpdate = useCallback(() => setVal((v) => v + 1), []);
  return forceUpdate;
};

export default useForceUpdate;
