import { useEffect, useRef } from 'react';

import { create } from 'zustand';

/**
 * Savers of the Manual Configuration modal. Every editable block registers itself under
 * `<tab>.<block>`; the modal footer's single Save button acts on the savers of the active tab.
 */
export interface Saver {
  changed: boolean;
  save: () => Promise<void>;
}

interface ManualConfigState {
  remove: (id: string) => void;
  reset: () => void;
  savers: Record<string, Saver>;
  set: (id: string, saver: Saver) => void;
}

export const useManualConfigStore = create<ManualConfigState>((setState) => ({
  remove: (id) =>
    setState((state) => ({ savers: Object.fromEntries(Object.entries(state.savers).filter(([key]) => key !== id)) })),
  reset: () => setState({ savers: {} }),
  savers: {},
  set: (id, saver) => setState((state) => ({ savers: { ...state.savers, [id]: saver } })),
}));

/** Savers of one tab, by id prefix (a plain helper: a selector returning a fresh array would re-render forever) */
export const tabSavers = (savers: Record<string, Saver>, tab: string): Saver[] =>
  Object.entries(savers)
    .filter(([id]) => id.startsWith(`${tab}.`))
    .map(([, saver]) => saver);

/**
 * Register a block's saver. The store entry is refreshed only when `changed` flips (so nothing
 * re-renders on every keystroke); `save` always calls the latest handler through a ref.
 */
export const useRegisterSaver = (id: string, changed: boolean, save: () => Promise<void>): void => {
  const saveRef = useRef(save);

  saveRef.current = save;

  useEffect(() => {
    useManualConfigStore.getState().set(id, { changed, save: () => saveRef.current() });
  }, [id, changed]);

  useEffect(() => () => useManualConfigStore.getState().remove(id), [id]);
};
