import { useEffect, useRef } from 'react';

const useIsUnmounted = () => {
  const isUnmounted = useRef(false);

  useEffect(() => {
    // reset on mount as well: StrictMode unmounts and mounts again once in development
    isUnmounted.current = false;

    return () => {
      isUnmounted.current = true;
    };
  }, []);

  return isUnmounted;
};

export default useIsUnmounted;
