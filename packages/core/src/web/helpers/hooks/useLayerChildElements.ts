// 【TODO：add tests】high-risk hook, currently untested. Cover:
// - watchLayer / unwatchLayer are no-ops on duplicate / missing layers
// - childElements recomputes when a watched layer's first-depth childList changes
// - throttled refresh coalesces rapid mutations
// - MutationObserver is not rebuilt on every refresh tick (version should not force observer teardown)
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

  // Recompute is O(scene): each refresh rebuilds every watched layer's child list. Scale the debounce
  // to the (roughly estimated) object count so busy scenes coalesce more mutations per recompute.
  // Bucketed so the value — and thus the funnel below — only changes when crossing a threshold, not
  // on every tick.
  const quietPeriod = useMemo(() => {
    const count = watchedLayers.reduce((sum, layer) => sum + (layer.isConnected ? layer.childElementCount : 0), 0);

    if (count > 800) return 1200;

    if (count > 300) return 800;

    if (count > 100) return 600;

    return 400;
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [watchedLayers, version]);

  const throttledRefresh = useMemo(
    () => funnel(() => setVersion((v) => v + 1), { minQuietPeriodMs: quietPeriod, triggerAt: 'both' }),
    [quietPeriod],
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
