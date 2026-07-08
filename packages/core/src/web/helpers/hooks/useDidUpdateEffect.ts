import type { DependencyList, EffectCallback } from 'react';
import { useEffect, useRef } from 'react';

// work like componentDidUpdate
// ref: https://stackoverflow.com/questions/53253940/make-react-useeffect-hook-not-run-on-initial-render
const useDidUpdateEffect = (effect: EffectCallback, deps: DependencyList) => {
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;

      return undefined;
    }

    // Forward the effect's cleanup so callers can return one (e.g. clearTimeout).
    return effect();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, deps);
};

export default useDidUpdateEffect;
