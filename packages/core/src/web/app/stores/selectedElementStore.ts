import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { isFitText } from '@core/app/svgedit/text/textedit/getters';
import type { ILang } from '@core/interfaces/ILang';

type CanvasNodeType = keyof ILang['topbar']['tag_names'];

const categoryOverride = {
  dxf: 'use',
  ellipse: 'shape',
  fit_text: 'text',
  layer_config: 'text',
  line: 'shape',
  pass_through_object: 'g',
  polygon: 'shape',
  rect: 'shape',
  svg: 'use',
} as const satisfies Partial<Record<CanvasNodeType, string>>;

type CanvasNodeCategory =
  | (typeof categoryOverride)[keyof typeof categoryOverride]
  | Exclude<CanvasNodeType, keyof typeof categoryOverride>;

export interface DerivedData {
  canGroup: boolean;
  canUngroup: boolean;
  canUngroupOrDisassemble: boolean;
  nodeCategory: CanvasNodeCategory;
  nodeType: CanvasNodeType;
}

interface SelectedElementStoreState {
  refreshState: () => void;
  selectedElement: Element | null;
  setSelectedElement: (element: Element | null) => void;
}

const defaultElementState: DerivedData = {
  canGroup: false,
  canUngroup: false,
  canUngroupOrDisassemble: false,
  nodeCategory: 'no_selection',
  nodeType: 'no_selection',
};

const getNodeType = (elem: Element | null): { nodeCategory: CanvasNodeCategory; nodeType: CanvasNodeType } => {
  let nodeType: CanvasNodeType = 'no_selection';

  if (elem) {
    if (elem.getAttribute('data-tempgroup') === 'true') {
      nodeType = 'multi_select';
    } else {
      if (elem.getAttribute('data-textpath-g')) {
        nodeType = 'text_path';
      } else if (elem.getAttribute('data-layer-config')) {
        nodeType = 'layer_config';
      } else if (isFitText(elem)) {
        nodeType = 'fit_text';
      } else if (elem.getAttribute('data-pass-through')) {
        nodeType = 'pass_through_object';
      } else if (elem.tagName.toLowerCase() !== 'use') {
        nodeType = elem.tagName.toLowerCase() as CanvasNodeType;
      } else if (elem.getAttribute('data-svg') === 'true') {
        nodeType = 'svg';
      } else if (elem.getAttribute('data-dxf') === 'true') {
        nodeType = 'dxf';
      } else {
        nodeType = 'use';
      }
    }
  }

  const nodeCategory: CanvasNodeCategory = (categoryOverride as any)[nodeType] || nodeType;

  return { nodeCategory, nodeType };
};

export const getDerivedData = (selectedElement: Element | null): DerivedData => {
  const state: DerivedData = { ...defaultElementState };

  if (!selectedElement) return state;

  const { nodeCategory, nodeType } = getNodeType(selectedElement);

  state.nodeCategory = nodeCategory;
  state.nodeType = nodeType;

  state.canGroup = !['g', 'pass_through_object', 'text_path'].includes(nodeType);
  state.canUngroup = nodeType === 'g';
  state.canUngroupOrDisassemble = state.canUngroup || nodeCategory === 'use';

  return state;
};

export const useSelectedElementStore = create(
  subscribeWithSelector<DerivedData & SelectedElementStoreState>((set, get) => ({
    refreshState: () => {
      set(getDerivedData(get().selectedElement));
    },
    selectedElement: null,
    setSelectedElement: (element: Element | null) => {
      set({ selectedElement: element, ...getDerivedData(element) });
    },
    ...getDerivedData(null),
  })),
);

useSelectedElementStore.subscribe(
  (state) => state.selectedElement,
  () => (document.activeElement as HTMLElement).blur(),
);
