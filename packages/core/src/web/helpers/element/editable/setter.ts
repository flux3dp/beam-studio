import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import undoManager from '@core/app/svgedit/history/undoManager';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils/handleHistoryActionOptions';
import selectionManager from '@core/app/svgedit/selection';
import selector from '@core/app/svgedit/selector';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';

import type { ControlType, EditableInfo } from './base';
import { attributeName, ControlTypes, DimenstionControls } from './base';
import { parseEditableInfo } from './getter';

export const setEditableInfo = (
  elem: Element | null,
  editableInfo: Partial<EditableInfo>,
  { overwrite = false, ...options }: HistoryActionOptions & { overwrite?: boolean } = {},
) => {
  if (!elem) return;

  const elements = selectionManager.isTempGroup(elem) ? Array.from(elem.children) : [elem];

  for (const element of elements) {
    const newEditableInfo = { ...(overwrite ? {} : parseEditableInfo(element)), ...editableInfo };
    const attributeString = JSON.stringify(ControlTypes.filter((key) => newEditableInfo[key]));

    undoManager.beginUndoableChange(attributeName, [element]);
    element.setAttribute(attributeName, attributeString);

    const cmd = undoManager.finishUndoableChange();

    handleHistoryActionOptions(cmd, options);
  }

  if (DimenstionControls.some((control) => control in editableInfo)) {
    // If rotation or size editable state changes, need to update selector grips visibility
    selector.getSelectorManager().requestSelector(elem)?.updateNonEditableGripVisibility();
  }
};

export const clearEditableInfo = (elem: Element | null, options: HistoryActionOptions = {}) => {
  if (!elem) return;

  undoManager.beginUndoableChange(attributeName, [elem]);
  elem.removeAttribute(attributeName);

  const cmd = undoManager.finishUndoableChange();

  handleHistoryActionOptions(cmd, options);
};

export const toggleEditableInfo = (type: ControlType) => {
  const { editableInfo, selectedElement } = useSelectedElementStore.getState();
  const newValue = !editableInfo[type]?.value;

  useSelectedElementStore.setState({
    editableInfo: { ...editableInfo, [type]: { hasMultiValue: false, value: newValue } },
  });
  setEditableInfo(selectedElement, { [type]: newValue });
};
