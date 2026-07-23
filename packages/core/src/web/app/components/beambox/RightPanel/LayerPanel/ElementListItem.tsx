import React, { useEffect, useMemo, useState } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';

import dialogCaller from '@core/app/actions/dialog-caller';
import ElementPreview from '@core/app/components/common/ElementPreview';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsInteractionMode } from '@core/app/stores/interactionModeStore';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { allEditableInfo } from '@core/helpers/element/editable/base';
import { getControllableType, getEditableInfo } from '@core/helpers/element/editable/getter';
import { setEditableInfo } from '@core/helpers/element/editable/setter';
import { setElemLock } from '@core/helpers/element/lock';
import useI18n from '@core/helpers/useI18n';

import { EditableButton } from '../common/ControlBlock';
import { getObjectPanelContext } from '../OptionsBlocks/utils';

import styles from './ElementListItem.module.scss';

const getEditableState = (element: SVGElement, isSelected: boolean, isProjectMode: boolean) => {
  if (!isProjectMode) return { editable: false, partiallyEditable: false };

  const editableAttr = element.getAttribute('data-editable');

  if (!editableAttr) return { editable: false, partiallyEditable: false };
  else if (editableAttr === '*') return { editable: true, partiallyEditable: false };

  const objectPanelData = isSelected ? ({} as any) : getObjectPanelContext(element);
  const controllableTypes = isSelected
    ? useSelectedElementStore.getState().controllableTypes
    : getControllableType(element, objectPanelData);
  const editableInfo = isSelected
    ? useSelectedElementStore.getState().editableInfo
    : getEditableInfo(element, controllableTypes);

  if (isSelected) {
    console.log('editableInfo', editableInfo, controllableTypes);
  }

  const allEditable = controllableTypes.every((type) => Boolean(editableInfo[type]?.value));

  if (allEditable) return { editable: true, partiallyEditable: false };

  const someEditable = controllableTypes.some((type) => Boolean(editableInfo[type]?.value));

  return { editable: someEditable, partiallyEditable: someEditable };
};

interface Props {
  element: SVGElement;
  index: number;
  onSelect: (element: SVGElement, e: React.MouseEvent<HTMLDivElement>) => void;
}

const ElementListItem = ({ element, index, onSelect }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { attributes, isDragging, isSorting, listeners, setNodeRef, transform, transition } = useSortable({
    data: { index },
    id: element.id,
  });
  const dragStyle: React.CSSProperties = {
    // The DragOverlay renders the moving copy, so keep the source item in place
    // (don't apply its drag transform) while still animating the other items.
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
  };
  const isProjectMode = useIsInteractionMode('project');
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const { isMultiSelected, isSelected } = useMemo(() => {
    if (element === selectedElement) return { isMultiSelected: false, isSelected: true };
    else if (element.parentElement === selectedElement) return { isMultiSelected: true, isSelected: false };
    else return { isMultiSelected: false, isSelected: false };
  }, [element, selectedElement]);
  const [elemName, setElemName] = useState<string>(element.getAttribute('data-name') ?? element.id);
  const [locked, setLocked] = useState<boolean>(element.getAttribute('data-lock') === 'true');
  const [editable, setEditable] = useState(() => getEditableState(element, isSelected, isProjectMode));

  useEffect(() => {
    setEditable(getEditableState(element, isSelected, isProjectMode));
  }, [element, isSelected, isProjectMode]);

  if (isSelected) {
    console.log('editable', editable);
  }

  const handleRename = () => {
    dialogCaller.promptDialog({
      caption: lang.beambox.right_panel.layer_panel.notification.newName,
      defaultValue: elemName,
      onYes: (newName?: string) => {
        if (!newName || newName === elemName) return;

        undoManager.beginUndoableChange('data-name', [element]);
        element.setAttribute('data-name', newName);

        const cmd = undoManager.finishUndoableChange();

        if (!cmd.isEmpty()) undoManager.addCommandToHistory(cmd);

        setElemName(newName);
      },
    });
  };

  const handleDelete = () => {
    deleteElements([element]);
  };

  return (
    <div
      className={classNames(styles.container, {
        [styles.dragging]: isDragging,
        [styles.selected]: isSelected,
        [styles.sorting]: isSorting,
        [styles['multi-selected']]: isMultiSelected,
      })}
      onClick={(e) => onSelect(element, e)}
      ref={setNodeRef}
      style={dragStyle}
    >
      {isProjectMode && (
        <EditableButton
          editable={editable.editable}
          onClick={(e) => {
            e.stopPropagation();
            setEditableInfo(element, editable.editable ? {} : allEditableInfo, { overwrite: true });

            if (isSelected) {
              useSelectedElementStore.setState({
                editableInfo: getEditableInfo(selectedElement),
              });
            }

            setEditable(getEditableState(element, isSelected, isProjectMode));
          }}
          partial={editable.partiallyEditable}
        />
      )}
      <div className={styles.preview}>
        <ElementPreview element={element as SVGGraphicsElement} />
      </div>
      <div className={styles.name} onDoubleClick={handleRename} title={elemName}>
        {elemName}
      </div>
      <button
        className={classNames(styles.action, styles.danger)}
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        title={lang.topbar.menu.delete}
        type="button"
      >
        <ObjectPanelIcons.Trash height="20" width="20" />
      </button>
      <button
        className={styles.action}
        onClick={(e) => {
          e.stopPropagation();
          setLocked(setElemLock(element));
        }}
        title="Lock"
        type="button"
      >
        {locked ? <LayerPanelIcons.Lock height="20" width="20" /> : <LayerPanelIcons.Unlock height="20" width="20" />}
      </button>
      <button
        className={classNames(styles.action, styles.dragHandle)}
        onClick={(e) => e.stopPropagation()}
        title="Drag"
        type="button"
        {...attributes}
        {...listeners}
      >
        <LayerPanelIcons.Move />
      </button>
    </div>
  );
};

export default ElementListItem;

/**
 * Trailing drop target for a layer's element list. Keeps every layer (including empty ones)
 * droppable so elements can be moved to the end of / into any layer. Not draggable itself.
 */
export const ElementDropPlaceholder = ({ empty, id }: { empty: boolean; id: string }): React.JSX.Element => {
  const { over, setNodeRef } = useSortable({ id });

  return (
    <div
      className={classNames(styles.placeholder, { [styles.empty]: empty, [styles.over]: over?.id === id })}
      ref={setNodeRef}
    />
  );
};

/**
 * Visual hint rendered inside a dnd-kit DragOverlay while dragging. When multiple
 * elements are being moved (`count > 1`) it shows a stacked-card look plus a count badge.
 */
export const ElementDragOverlay = ({ count, element }: { count: number; element: SVGElement }): React.JSX.Element => {
  const name = element.getAttribute('data-name') ?? element.id;

  console.log('ElementDragOverlay', count, element, name);

  return (
    <div className={classNames(styles.container, styles.overlay, { [styles.stacked]: count > 1 })}>
      <div className={styles.preview}>
        <ElementPreview element={element as SVGGraphicsElement} />
      </div>
      <div className={styles.name} title={name}>
        {name}
      </div>
      {count > 1 && <div className={styles.count}>{count}</div>}
    </div>
  );
};
