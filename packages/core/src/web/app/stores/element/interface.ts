import type { ObjectPanelContext } from '@core/app/components/beambox/RightPanel/OptionsBlocks/utils';
import type { ControlType, EditableInfo, MultiValue } from '@core/helpers/element/editable/base';
import type { ILang } from '@core/interfaces/ILang';

export type CanvasNodeType = keyof ILang['topbar']['tag_names'];

export const categoryOverride = {
  dxf: 'use',
  ellipse: 'shape',
  fit_text: 'text',
  line: 'shape',
  pass_through_object: 'g',
  polygon: 'shape',
  rect: 'shape',
  svg: 'use',
} as const satisfies Partial<Record<CanvasNodeType, string>>;

export type CanvasNodeCategory =
  | (typeof categoryOverride)[keyof typeof categoryOverride]
  | Exclude<CanvasNodeType, keyof typeof categoryOverride>;

export interface DerivedData {
  canChildrenConvertToPath: boolean | undefined;
  canGroup: boolean;
  canUngroup: boolean;
  canUngroupOrDisassemble: boolean;
  controllableTypes: ControlType[];
  editableInfo: MultiValue<EditableInfo>;
  elementCount: number;
  hasChildPathsOnly: boolean | undefined;
  hasChildTextAndPath: boolean | undefined;
  hasChildTextsOnly: boolean | undefined;
  hasChildVariableText: boolean | undefined;
  isFillable: boolean | undefined;
  isFilled: boolean | undefined;
  isShading: boolean | undefined;
  isVariableText: boolean | undefined;
  nodeCategory: CanvasNodeCategory;
  nodeType: CanvasNodeType;
  objectPanelData: null | ObjectPanelContext;
  ungroupedElems: Element[];
}

type OptionalKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? K : never }[keyof T];

export type LazyDataKey = OptionalKeys<DerivedData>;
