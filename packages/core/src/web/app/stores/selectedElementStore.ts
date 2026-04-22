import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface SelectedElementStoreState {
  selectedElement: Element | null;
}

export const useSelectedElementStore = create(
  subscribeWithSelector<SelectedElementStoreState>(() => ({
    selectedElement: null,
  })),
);

useSelectedElementStore.subscribe(
  (state) => state.selectedElement,
  () => (document.activeElement as HTMLElement).blur(),
);

export default useSelectedElementStore;
