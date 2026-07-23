import { getObjectPanelContext } from '@core/app/components/beambox/RightPanel/OptionsBlocks/utils';
import { CanvasElements } from '@core/app/constants/canvasElements';
import { isElemFillable } from '@core/app/svgedit/operations/infill';
import { isFitText } from '@core/app/svgedit/text/textedit/getters';
import { getControllableType, getEditableInfo } from '@core/helpers/element/editable/getter';
import { getVariableTextType } from '@core/helpers/variableText';
import { VariableTextType } from '@core/interfaces/ObjectPanel';

import type { CanvasNodeCategory, CanvasNodeType, DerivedData, LazyDataKey } from './interface';
import { categoryOverride } from './interface';

const defaultElementState: DerivedData = {
  canChildrenConvertToPath: undefined,
  canGroup: false,
  canUngroup: false,
  canUngroupOrDisassemble: false,
  controllableTypes: [],
  editableInfo: {},
  elementCount: 0,
  hasChildPathsOnly: undefined,
  hasChildTextAndPath: undefined,
  hasChildTextsOnly: undefined,
  hasChildVariableText: undefined,
  isFillable: undefined,
  isFilled: undefined,
  isShading: undefined,
  isVariableText: undefined,
  nodeCategory: 'no_selection',
  nodeType: 'no_selection',
  objectPanelData: null,
  ungroupedElems: [],
};

const lazyDataCache: Map<LazyDataKey, DerivedData[LazyDataKey]> = new Map();

// ======== Eager calculated ========
const getNodeType = (elem: Element | null): { nodeCategory: CanvasNodeCategory; nodeType: CanvasNodeType } => {
  let nodeType: CanvasNodeType = 'no_selection';

  if (elem) {
    if (elem.getAttribute('data-tempgroup') === 'true') {
      nodeType = 'multi_select';
    } else {
      if (elem.getAttribute('data-textpath-g')) {
        nodeType = 'text_path';
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

export const getDerivedData = (selectedElement: null | SVGElement): DerivedData => {
  const state: DerivedData = { ...defaultElementState };

  lazyDataCache.clear();

  if (!selectedElement) return state;

  const { nodeCategory, nodeType } = getNodeType(selectedElement);

  state.nodeCategory = nodeCategory;
  state.nodeType = nodeType;
  state.ungroupedElems = nodeType === 'multi_select' ? Array.from(selectedElement.children) : [selectedElement];
  state.elementCount = state.ungroupedElems.length;

  state.canGroup = !['g', 'pass_through_object', 'text_path'].includes(nodeType);
  state.canUngroup = nodeType === 'g';
  state.canUngroupOrDisassemble = state.canUngroup || nodeCategory === 'use';

  state.objectPanelData = getObjectPanelContext(selectedElement);
  state.controllableTypes = getControllableType(selectedElement, state.objectPanelData);
  state.editableInfo = getEditableInfo(selectedElement, state.controllableTypes);

  return state;
};

// ======== Lazy calculated ========
const getIsFillable = (elem: null | SVGElement): boolean => {
  if (!elem) return false;

  return isElemFillable(elem);
};

const getIsFilled = (elem: null | SVGElement): boolean => {
  // Note: this is a simple check for actions panel
  // For more accurate check, use infill.calcElemsFilledInfo
  if (!elem) return false;

  const fill = elem.getAttribute('fill');

  return !!fill && fill !== 'none';
};

const getIsShading = (elem: null | SVGElement): boolean => {
  if (!elem) return false;

  return elem.getAttribute('data-shading') === 'true';
};

const getIsVariableText = (elem: null | SVGElement): boolean => {
  if (!elem) return false;

  return getVariableTextType(elem) !== VariableTextType.NONE;
};

const getHasChildVariableText = (elem: null | SVGElement, state: DerivedData): boolean => {
  if (!elem) return false;

  return state.ungroupedElems.some((c) => getVariableTextType(c as SVGElement) !== VariableTextType.NONE);
};

const getHasChildTextAndPath = (elem: null | SVGElement, state: DerivedData): boolean => {
  if (!elem) return false;

  return (
    state.ungroupedElems.some((c) => c.nodeName === 'text') &&
    state.ungroupedElems.some((c) => CanvasElements.basicPaths.includes(c.nodeName))
  );
};

const getHasChildTextsOnly = (elem: null | SVGElement, state: DerivedData): boolean => {
  if (!elem) return false;

  return state.ungroupedElems.every((c) => c.nodeName === 'text');
};

const getHasChildPathsOnly = (elem: null | SVGElement, state: DerivedData): boolean => {
  if (!elem) return false;

  return state.ungroupedElems.every((c) => c.nodeName === 'path');
};

const getCanChildrenConvertToPath = (elem: null | SVGElement, state: DerivedData): boolean => {
  if (!elem) return false;

  return state.ungroupedElems.every(
    (c) =>
      c.nodeName === 'text' ||
      CanvasElements.basicPaths.includes(c.nodeName) ||
      (c.nodeName === 'g' && c.getAttribute('data-textpath-g')),
  );
};

const running = new Set<string>();
const lazyDataMap: {
  [K in LazyDataKey]: {
    compute: (elem: null | SVGElement, state: DerivedData) => DerivedData[K];
    fallback: DerivedData[K];
  };
} = {
  canChildrenConvertToPath: { compute: getCanChildrenConvertToPath, fallback: false },
  hasChildPathsOnly: { compute: getHasChildPathsOnly, fallback: false },
  hasChildTextAndPath: { compute: getHasChildTextAndPath, fallback: false },
  hasChildTextsOnly: { compute: getHasChildTextsOnly, fallback: false },
  hasChildVariableText: { compute: getHasChildVariableText, fallback: false },
  isFillable: { compute: getIsFillable, fallback: false },
  isFilled: { compute: getIsFilled, fallback: false },
  isShading: { compute: getIsShading, fallback: false },
  isVariableText: { compute: getIsVariableText, fallback: false },
};

export const invalidateLazyDataCache = (key: LazyDataKey) => {
  lazyDataCache.delete(key);
};

export const computeLazyData = <T extends LazyDataKey>(key: T, elem: null | SVGElement, state: DerivedData) => {
  const result = lazyDataMap[key].compute(elem, state);

  lazyDataCache.set(key, result);

  return result;
};

export const computeLazyDataWithLock = <T extends LazyDataKey>(
  key: T,
  elem: null | SVGElement,
  state: DerivedData,
): { data: DerivedData[T]; type: 'cache' | 'computed' | 'fallback' } => {
  if (lazyDataCache.has(key)) {
    // Return local cache before asynchronous update with queueMicrotask
    return { data: lazyDataCache.get(key), type: 'cache' };
  }

  if (running.has(key)) {
    return { data: lazyDataMap[key].fallback, type: 'fallback' };
  }

  running.add(key);

  const result = computeLazyData(key, elem, state);

  running.delete(key);

  return { data: result, type: 'computed' };
};
