// 【TODO：add tests】high-risk, currently untested. Cover:
// - setEditableInfo: serialized attribute is a JSON array of ControlType values; overwrite vs merge
// - setEditableInfo on a temp group: all children updated; undo should collapse into one step
// - setEditableInfo triggers updateNonEditableGripVisibility only when a DimensionControls key changes
// - clearEditableInfo: temp-group handling should match setEditableInfo
// - toggleEditableInfo: optimistic store update stays consistent with the written attribute
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils/handleHistoryActionOptions';
import selectionManager from '@core/app/svgedit/selection';
import selector from '@core/app/svgedit/selector';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';

import type { ControlType, EditableInfo } from './base';
import { attributeName, ControlTypes, DimensionControls } from './base';
import { parseEditableInfo } from './getter';

export const setEditableInfo = (
  elem: Element | null,
  editableInfo: Partial<EditableInfo>,
  { overwrite = false, ...options }: HistoryActionOptions & { overwrite?: boolean } = {},
) => {
  if (!elem) return;

  const elements = selectionManager.isTempGroup(elem) ? Array.from(elem.children) : [elem];
  // Collapse all per-child attribute writes into one undo step so a multi-select edit reverts in a
  // single undo instead of one per child.
  const batchCmd = new history.BatchCommand('Set editable info');

  for (const element of elements) {
    const newEditableInfo = { ...(overwrite ? {} : parseEditableInfo(element)), ...editableInfo };
    const attributeString = JSON.stringify(ControlTypes.filter((key) => newEditableInfo[key]));

    undoManager.beginUndoableChange(attributeName, [element]);
    element.setAttribute(attributeName, attributeString);

    const cmd = undoManager.finishUndoableChange();

    handleHistoryActionOptions(cmd, { parentCmd: batchCmd });
  }

  handleHistoryActionOptions(batchCmd, options);

  if (DimensionControls.some((control) => control in editableInfo)) {
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
