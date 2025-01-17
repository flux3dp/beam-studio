import { useEffect, useRef } from 'react';

// work like componentDidUpdate
// ref: https://stackoverflow.com/questions/53253940/make-react-useeffect-hook-not-run-on-initial-render
const useDidUpdateEffect = (effect: () => void, deps: any[]) => {
  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) effect();
    else didMount.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useDidUpdateEffect;
