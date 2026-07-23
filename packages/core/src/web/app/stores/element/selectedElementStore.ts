import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { getObjectPanelContext } from '@core/app/components/beambox/RightPanel/OptionsBlocks/utils';
import { useDocumentStore } from '@core/app/stores/documentStore';
import {
  computeLazyData,
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
const attributes = Object.keys(relatedLazyDataKeyMap);
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
    (document.activeElement as HTMLElement).blur();
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

export const getLazyData = <T extends LazyDataKey>(
  key: T,
  elem = useSelectedElementStore.getState().selectedElement as null | SVGElement,
): DerivedData[T] | undefined => {
  const state = useSelectedElementStore.getState();

  if (state[key] !== undefined) {
    return state[key] as DerivedData[T];
  }

  const result = computeLazyData(key, elem, state);

  useSelectedElementStore.setState({ [key]: result });

  return result;
};

export const useLazyData = <T extends LazyDataKey>(key: T): DerivedData[T] =>
  useSelectedElementStore((state) => {
    if (state[key] !== undefined) {
      return state[key];
    }

    const { data, type } = computeLazyDataWithLock(key, state.selectedElement, state);

    if (type !== 'computed') return data;

    // Prevent 'Cannot update a component while rendering a different component' Error
    queueMicrotask(() => {
      useSelectedElementStore.setState({ [key]: data });
    });

    return data;
  });
