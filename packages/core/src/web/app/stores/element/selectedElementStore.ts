// 【TODO：add tests】high-risk, currently untested. Cover:
// - setSelectedElement: no-op when unchanged; recomputes derived data on change
// - MutationObserver → invalidateLazyData for d/fill/data-shading/data-vt-type (attributeFilter is derived
//   from relatedLazyDataKeyMap — a key missing there never fires; guards the data-fullcolor gap)
// - getLazyData / useLazyData: returns cached value, computes+stores on miss
// - layout change clears activeKey
import { useEffect } from 'react';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { getObjectPanelContext } from '@core/app/components/beambox/RightPanel/OptionsBlocks/utils';
import { useDocumentStore } from '@core/app/stores/documentStore';
import {
  computeLazyDataWithLock,
  getDerivedData,
  invalidateLazyDataCache,
} from '@core/app/stores/element/utils';

import { useLayoutStore } from '../layoutStore';

import type { DerivedData, LazyDataKey } from './interface';

interface SelectedElementStoreState {
  activeKey: null | string;
  refreshState: () => void;
  selectedElement: null | SVGElement;
  setSelectedElement: (element: null | SVGElement) => void;
}

export const useSelectedElementStore = create(
  subscribeWithSelector<DerivedData & SelectedElementStoreState>((set, get) => ({
    activeKey: null,
    refreshState: () => {
      set(getDerivedData(get().selectedElement));
    },
    selectedElement: null,
    setSelectedElement: (element: null | SVGElement) => {
      const oldElem = get().selectedElement;

      if (oldElem === element) return;

      set({ selectedElement: element, ...getDerivedData(element) });
    },
    ...getDerivedData(null),
  })),
);

const relatedLazyDataKeyMap: Record<string, LazyDataKey> = {
  d: 'isFillable',
  'data-shading': 'isShading',
  'data-vt-type': 'isVariableText',
  fill: 'isFilled',
};
// `data-fullcolor` is not a lazy-data key (it refreshes objectPanelData, not a lazy field), so it is
// appended here rather than in relatedLazyDataKeyMap; without it the observer never fires for it and
// the data-fullcolor branch below is unreachable.
const attributes = [...Object.keys(relatedLazyDataKeyMap), 'data-fullcolor'];
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type !== 'attributes') continue;

    const attr = m.attributeName;

    if (!attr) continue;

    if (relatedLazyDataKeyMap[attr]) invalidateLazyData(relatedLazyDataKeyMap[attr]);

    const { nodeCategory, selectedElement } = useSelectedElementStore.getState();

    if (attr === 'data-fullcolor' && nodeCategory === 'image') {
      useSelectedElementStore.setState({
        objectPanelData: getObjectPanelContext(selectedElement),
      });
    }
  }
});

useDocumentStore.subscribe(
  (state) => state.workarea,
  () => {
    const { nodeCategory, selectedElement } = useSelectedElementStore.getState();

    if (nodeCategory === 'use') {
      useSelectedElementStore.setState({
        objectPanelData: getObjectPanelContext(selectedElement),
      });
    }
  },
);

useSelectedElementStore.subscribe(
  (state) => state.selectedElement,
  (elem) => {
    (document.activeElement as HTMLElement | null)?.blur();
    observer.disconnect();

    if (elem) {
      observer.observe(elem, { attributeFilter: attributes });
    }
  },
);

useLayoutStore.subscribe(
  (state) => state.layout,
  () => {
    // Layout changes may cause rwd popup locate in wrong position, clear activeKey in case
    useSelectedElementStore.setState({ activeKey: null });
  },
);

export const invalidateLazyData = <T extends LazyDataKey>(key: T) => {
  invalidateLazyDataCache(key);
  useSelectedElementStore.setState({ [key]: undefined });
};

// Imperative read. Always operates on the current selected element: the lazy cache is scoped to the
// selection (cleared by getDerivedData on change), so a foreign element must never be passed in — it
// would pollute the shared cache/store. Goes through the cache-aware path so the compute stays single.
export const getLazyData = <T extends LazyDataKey>(key: T): DerivedData[T] => {
  const state = useSelectedElementStore.getState();

  if (state[key] !== undefined) {
    return state[key] as DerivedData[T];
  }

  const { data } = computeLazyDataWithLock(key, state.selectedElement, state);

  useSelectedElementStore.setState({ [key]: data });

  return data;
};

export const useLazyData = <T extends LazyDataKey>(key: T): DerivedData[T] => {
  // Pure subscription — no side effects in the selector.
  const stored = useSelectedElementStore((state) => state[key]);
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);

  // Commit the computed value into the store from an effect (never during render). The compute goes
  // through the cache-aware path, so the heavy `compute` runs at most once per key per selection
  // across every consumer, regardless of how many components read the same key.
  useEffect(() => {
    if (useSelectedElementStore.getState()[key] !== undefined) return;

    const state = useSelectedElementStore.getState();
    const { data } = computeLazyDataWithLock(key, state.selectedElement, state);

    useSelectedElementStore.setState({ [key]: data });
  }, [key, selectedElement, stored]);

  if (stored !== undefined) return stored as DerivedData[T];

  // First render before the effect commits: return a cache-backed value without writing state.
  const state = useSelectedElementStore.getState();

  return computeLazyDataWithLock(key, selectedElement, state).data;
};
