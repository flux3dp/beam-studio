import { useCallback, useEffect, useMemo, useState } from 'react';

import { funnel } from 'remeda';

import { getLayerChildElements } from '@core/helpers/layer/getLayerChildElements';

interface UseLayerChildElementsOptions {
  /** Layer <g> elements to watch initially. */
  initialLayers?: SVGGElement[];
}

interface UseLayerChildElementsResult {
  /** First-depth child elements keyed by layer group. */
  childElements: Map<SVGGElement, SVGElement[]>;
  /** Stop watching a layer. */
  unwatchLayer: (layerName: SVGGElement) => void;
  /** Currently watched layer <g> elements. */
  watchedLayers: SVGGElement[];
  /** Start watching a layer. No-op if already watched. */
  watchLayer: (layerName: SVGGElement) => void;
}

export const useLayerChildElements = ({
  initialLayers = [],
}: UseLayerChildElementsOptions = {}): UseLayerChildElementsResult => {
  const [watchedLayers, setWatchedLayers] = useState<SVGGElement[]>(() => [...initialLayers]);
  const [version, setVersion] = useState(0);

  const throttledRefresh = useMemo(
    () => funnel(() => setVersion((v) => v + 1), { minQuietPeriodMs: 500, triggerAt: 'both' }),
    [],
  );

  const watchLayer = useCallback((layer: SVGGElement) => {
    setWatchedLayers((prev) => (prev.includes(layer) ? prev : [...prev, layer]));
  }, []);

  const unwatchLayer = useCallback((layer: SVGGElement) => {
    setWatchedLayers((prev) => (prev.includes(layer) ? prev.filter((l) => l !== layer) : prev));
  }, []);

  const childElements = useMemo(() => {
    const result = new Map<SVGGElement, SVGElement[]>();

    watchedLayers.forEach((layer) => {
      result.set(layer, getLayerChildElements(layer));
    });

    return result;
    // `version` is an intentional dependency so `refresh` re-runs the compute.
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [watchedLayers, version]);

  useEffect(() => {
    if (watchedLayers.length === 0) {
      return undefined;
    }

    // childList only counts at first depth: its mutation target is the observed node itself.
    const firstDepthTargets = new Set<Node>(watchedLayers);

    const observer = new MutationObserver((records) => {
      const shouldRefresh = records.some(
        (record) =>
          // nested child attribute change (subtree), or first-depth child list change
          record.type === 'attributes' || (record.type === 'childList' && firstDepthTargets.has(record.target)),
      );

      if (shouldRefresh) throttledRefresh.call();
    });

    watchedLayers.forEach((layer) => {
      if (layer.isConnected) observer.observe(layer, { attributes: true, childList: true, subtree: true });
    });
    document.querySelectorAll<SVGGElement>('[data-tempgroup="true"]').forEach((tempGroup) => {
      observer.observe(tempGroup, { attributes: true, subtree: true });
    });

    return () => {
      observer.disconnect();
      throttledRefresh.cancel();
    };
  }, [watchedLayers, version, throttledRefresh]);

  return { childElements, unwatchLayer, watchedLayers, watchLayer };
};

export default useLayerChildElements;
