import { isInteractionMode } from '@core/app/stores/interactionModeStore';
import selectionManager from '@core/app/svgedit/selection';

export enum ControlType {
  // Text options
  TEXT_CONTENT,
  TEXT_VERTICAL,
  FONT_FAMILY,
  FONT_STYLE,
  FONT_SIZE,
  FIT_TEXT_ALIGN,
  TEXTPATH_ALIGN,
  TEXTPATH_OFFSET,
  LINE_SPACING,
  LETTER_SPACING,
  // Dimensions
  POSITION_X,
  POSITION_Y,
  POSITION_X2,
  POSITION_Y2,
  _SIZE,
  ROTATION,
  _FLIP,
  // Infill
  INFILL,
  PATH_INFILL, // For path of textpath
  // Others
  LIBRARY,
  DELETE,
}

export const ControlTypes = [
  ControlType.TEXT_CONTENT,
  ControlType.TEXT_VERTICAL,
  ControlType.FONT_FAMILY,
  ControlType.FONT_STYLE,
  ControlType.FONT_SIZE,
  ControlType.FIT_TEXT_ALIGN,
  ControlType.TEXTPATH_ALIGN,
  ControlType.TEXTPATH_OFFSET,
  ControlType.LINE_SPACING,
  ControlType.LETTER_SPACING,
  ControlType.POSITION_X,
  ControlType.POSITION_Y,
  ControlType.POSITION_X2,
  ControlType.POSITION_Y2,
  ControlType._SIZE,
  ControlType.ROTATION,
  ControlType._FLIP,
  ControlType.INFILL,
  ControlType.PATH_INFILL,
  ControlType.LIBRARY,
  ControlType.DELETE,
];

export const DimenstionControls = [
  ControlType.ROTATION,
  ControlType._SIZE,
  ControlType.POSITION_X,
  ControlType.POSITION_Y,
  ControlType.POSITION_X2,
  ControlType.POSITION_Y2,
];

export type EditableInfo = Partial<Record<ControlType, boolean>>;

export type MultiValueField<V> = {
  hasMultiValue: boolean;
  value: V;
};
export type MultiValue<T> = {
  [K in keyof T]: MultiValueField<T[K]>;
};

export const allEditableInfo = ControlTypes.reduce((acc, control) => {
  acc[control] = true;

  return acc;
}, {} as EditableInfo);

export const shouldIgnoreEditableInfo = (elem: Element) =>
  isInteractionMode('editor') || selectionManager.isTempGroup(elem);

export const attributeName = 'data-editable';
