import type { ObjectPanelContext } from '@core/app/components/beambox/RightPanel/OptionsBlocks/utils';
import { isInteractionMode } from '@core/app/stores/interactionModeStore';

import type { EditableInfo, MultiValue } from './base';
import { allEditableInfo, attributeName, ControlType, ControlTypes } from './base';

const getOverrideValue = (elem: Element): EditableInfo | null => {
  if (isInteractionMode('editor')) return allEditableInfo;

  // Note: this function is called before selectionManager setting tempGroup, don't use selectionManager.isTempGroup()
  if (elem.getAttribute('data-tempgroup')) return isInteractionMode('project') ? allEditableInfo : {};

  return null;
};

export const parseEditableInfo = (elem: Element): EditableInfo => {
  const overrideValue = getOverrideValue(elem);

  if (overrideValue) return overrideValue;

  const editableAttr = elem.getAttribute(attributeName);

  if (!editableAttr) {
    return {};
  } else if (editableAttr === '*') {
    return allEditableInfo;
  }

  try {
    const keys = JSON.parse(editableAttr);

    if (Array.isArray(keys)) {
      const editableInfo: EditableInfo = {};

      keys.forEach((key) => {
        editableInfo[key as ControlType] = true;
      });

      return editableInfo;
    }
  } catch (e) {
    console.error('Failed to parse editable attribute', e);
    elem.removeAttribute(attributeName);
  }

  return {};
};

export const getEditableInfo = (elem: Element | null, controllableTypes = ControlTypes): MultiValue<EditableInfo> => {
  if (!elem) return {};

  const overrideValue = getOverrideValue(elem);

  // Editable Info with temp groups is not supported now, keep array for future use
  const editableInfos = overrideValue ? [overrideValue] : [elem].map(parseEditableInfo);

  const result = {} as MultiValue<EditableInfo>;

  controllableTypes.forEach((key) => {
    const withFalse = editableInfos.some((info) => !info[key]);
    const withTrue = editableInfos.some((info) => info[key]);

    result[key as ControlType] = {
      hasMultiValue: withTrue && withFalse,
      value: withTrue,
    };
  });

  return result;
};

export const getControllableType = (
  elem: Element | null,
  { infillPanels, textOptions }: Pick<ObjectPanelContext, 'infillPanels' | 'textOptions'>,
): ControlType[] => {
  const types: ControlType[] = [];

  if (!elem) return types;

  types.push(
    ControlType.POSITION_X,
    ControlType.POSITION_Y,
    ControlType.ROTATION,
    ControlType._FLIP,
    ControlType.DELETE,
  );

  const tagName = elem.tagName.toLowerCase();

  if (tagName === 'line') {
    types.push(ControlType.POSITION_X2, ControlType.POSITION_Y2);
  } else {
    types.push(ControlType._SIZE);
  }

  if (tagName === 'use' || tagName === 'image') types.push(ControlType.LIBRARY);

  if (textOptions.size > 0) {
    if (textOptions.has('text_content')) types.push(ControlType.TEXT_CONTENT);

    if (textOptions.has('text_transform')) types.push(ControlType.TEXT_TRANSFORM);

    if (textOptions.has('vertical_switch')) types.push(ControlType.TEXT_VERTICAL);

    if (textOptions.has('font')) types.push(ControlType.FONT_FAMILY, ControlType.FONT_STYLE);

    if (textOptions.has('font_size')) types.push(ControlType.FONT_SIZE);

    if (textOptions.has('fit_text_align')) types.push(ControlType.FIT_TEXT_ALIGN);

    if (textOptions.has('vertical_align')) types.push(ControlType.TEXTPATH_ALIGN);

    if (textOptions.has('start_offset')) types.push(ControlType.TEXTPATH_OFFSET);

    if (textOptions.has('line_spacing')) types.push(ControlType.LINE_SPACING);

    if (textOptions.has('letter_spacing')) types.push(ControlType.LETTER_SPACING);
  }

  if (infillPanels.includes('infill')) types.push(ControlType.INFILL);

  if (infillPanels.includes('infillPath')) types.push(ControlType.PATH_INFILL);

  return types;
};
