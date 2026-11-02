import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { useStlStore } from '@core/app/stores/stlStore';
import { is3dProjection } from '@core/app/svgedit/stl/getters';
import { isFitText, isParamsLabel } from '@core/app/svgedit/text/textedit/getters';
import type { ILang } from '@core/interfaces/ILang';

type CanvasNodeType = keyof ILang['topbar']['tag_names'];

const categoryOverride = {
  dxf: 'use',
  ellipse: 'shape',
  fit_text: 'text',
  line: 'shape',
  params_label: 'text',
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
  /** Every selected element. Only inner engraving has more than one here: 2D gathers a
   *  multi-selection into its temporary group, which is then the one `selectedElement`. */
  selectedElements: Element[];
  setSelectedElement: (element: Element | null, elements?: Element[]) => void;
}

const defaultElementState: DerivedData = {
  canGroup: false,
  canUngroup: false,
  canUngroupOrDisassemble: false,
  nodeCategory: 'no_selection',
  nodeType: 'no_selection',
};

const isStlObject = (elem: Element): boolean =>
  is3dProjection(elem) && Boolean(useStlStore.getState().objects[elem.id]);

const getNodeType = (
  elem: Element | null,
  elements: Element[],
): { nodeCategory: CanvasNodeCategory; nodeType: CanvasNodeType } => {
  let nodeType: CanvasNodeType = 'no_selection';

  if (elem) {
    if (elements.length > 1 && elements.every(isStlObject)) {
      // several 3D objects are selected side by side, without a temporary group (see SelectionManager)
      nodeType = 'stl_multi';
    } else if (elem.getAttribute('data-tempgroup') === 'true') {
      nodeType = 'multi_select';
    } else {
      if (elem.getAttribute('data-textpath-g')) {
        nodeType = 'text_path';
      } else if (isParamsLabel(elem)) {
        nodeType = 'params_label';
      } else if (isFitText(elem)) {
        nodeType = 'fit_text';
      } else if (elem.getAttribute('data-pass-through')) {
        nodeType = 'pass_through_object';
      } else if (isStlObject(elem)) {
        nodeType = 'stl';
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

export const getDerivedData = (
  selectedElement: Element | null,
  selectedElements: Element[] = selectedElement ? [selectedElement] : [],
): DerivedData => {
  const state: DerivedData = { ...defaultElementState };

  if (!selectedElement) return state;

  const { nodeCategory, nodeType } = getNodeType(selectedElement, selectedElements);

  state.nodeCategory = nodeCategory;
  state.nodeType = nodeType;

  state.canGroup = !['g', 'pass_through_object', 'stl', 'stl_multi', 'text_path'].includes(nodeType);
  state.canUngroup = nodeType === 'g';
  state.canUngroupOrDisassemble = state.canUngroup || nodeCategory === 'use';

  return state;
};

export const useSelectedElementStore = create(
  subscribeWithSelector<DerivedData & SelectedElementStoreState>((set, get) => ({
    refreshState: () => {
      set(getDerivedData(get().selectedElement, get().selectedElements));
    },
    selectedElement: null,
    selectedElements: [],
    setSelectedElement: (element: Element | null, elements: Element[] = element ? [element] : []) => {
      set({ selectedElement: element, selectedElements: elements, ...getDerivedData(element, elements) });
    },
    ...getDerivedData(null),
  })),
);

useSelectedElementStore.subscribe(
  (state) => state.selectedElement,
  () => (document.activeElement as HTMLElement).blur(),
);
