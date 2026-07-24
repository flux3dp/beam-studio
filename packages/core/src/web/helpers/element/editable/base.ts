/**
 * IMPORTANT: these numeric values are serialized into the `data-editable` attribute and persisted
 * inside `.beam` template files. DO NOT change or reorder any existing value — doing so silently
 * remaps the editable flags of every template already saved in the field. New members must be
 * appended with the next unused explicit value only.
 */
export const ControlType = {
  // Text options
  TEXT_CONTENT: 0,
  TEXT_TRANSFORM: 1,
  TEXT_VERTICAL: 2,
  FONT_FAMILY: 3,
  FONT_STYLE: 4,
  FONT_SIZE: 5,
  FIT_TEXT_ALIGN: 6,
  TEXTPATH_ALIGN: 7,
  TEXTPATH_OFFSET: 8,
  LINE_SPACING: 9,
  LETTER_SPACING: 10,
  // Dimensions
  POSITION_X: 11,
  POSITION_Y: 12,
  POSITION_X2: 13,
  POSITION_Y2: 14,
  _SIZE: 15,
  ROTATION: 16,
  _FLIP: 17,
  // Infill
  INFILL: 18,
  PATH_INFILL: 19, // For path of textpath
  // Others
  LIBRARY: 20,
  DELETE: 21,
} as const;

export type ControlType = (typeof ControlType)[keyof typeof ControlType];

// Derived from ControlType so a new member can never be forgotten here (values are in declaration
// order, i.e. 0..N).
export const ControlTypes: ControlType[] = Object.values(ControlType);

export const DimensionControls: ControlType[] = [
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

// Frozen shared default: returned directly from getOverrideValue/parseEditableInfo, so it must never
// be mutated by a caller. All current consumers only read or spread it (booleans → shallow freeze).
export const allEditableInfo: EditableInfo = Object.freeze(
  ControlTypes.reduce((acc, control) => {
    acc[control] = true;

    return acc;
  }, {} as EditableInfo),
);

export const attributeName = 'data-editable';
