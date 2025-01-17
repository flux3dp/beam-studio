/* eslint-disable react/jsx-props-no-spreading */
import classNames from 'classnames';
import React, { forwardRef, MutableRefObject } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import LayerPanelIcons from 'app/icons/layer-panel/LayerPanelIcons';
import useI18n from 'helpers/useI18n';
import { Preset } from 'interfaces/ILayerConfig';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  presets: Preset[];
  displayList: Preset[];
  editingValues: Record<string, Preset>;
  selected: Preset;
  setSelectedPreset: (preset: Preset) => void;
  toggleHidePreset: (preset: Preset) => void;
  onReorder: (newPresets: Preset[]) => void;
}

const PresetList = forwardRef<HTMLDivElement, Props>(
  (
    {
      presets,
      displayList,
      editingValues,
      selected,
      setSelectedPreset,
      toggleHidePreset,
      onReorder,
    }: Props,
    outerRef: MutableRefObject<HTMLDivElement>
  ): JSX.Element => {
    const t = useI18n().beambox.right_panel.laser_panel.preset_management;
    const handleBeforeDragStart = ({ source }) => {
      setSelectedPreset(displayList[source.index]);
    };

    const handleDragEnd = (result) => {
      if (!result.destination) return;
      const sourceIdx = presets.findIndex((p) => p === displayList[result.source.index]);
      const destIdx = presets.findIndex((p) => p === displayList[result.destination.index]);
      if (sourceIdx === -1 || destIdx === -1) return;
      const newPresets = Array.from(presets);
      const [removed] = newPresets.splice(sourceIdx, 1);
      newPresets.splice(destIdx, 0, removed);
      onReorder(newPresets);
    };

    return (
      <DragDropContext onBeforeDragStart={handleBeforeDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable">
          {(droppableProvided) => (
            <div
              {...droppableProvided.droppableProps}
              className={styles.list}
              ref={(node) => {
                droppableProvided.innerRef(node);
                // eslint-disable-next-line no-param-reassign
                outerRef.current = node;
              }}
            >
              {displayList.map((preset, index) => (
                <Draggable
                  key={preset.isDefault ? preset.key : preset.name}
                  draggableId={preset.isDefault ? preset.key : preset.name}
                  index={index}
                >
                  {(draggalbeProvided, snapshot) => (
                    <div
                      {...draggalbeProvided.draggableProps}
                      {...draggalbeProvided.dragHandleProps}
                      ref={draggalbeProvided.innerRef}
                      className={classNames(styles.item, {
                        [styles.preset]: preset.isDefault,
                        [styles.selected]: preset === selected,
                        [styles.dragging]: snapshot.isDragging,
                      })}
                      title={preset.name}
                      onClick={() => setSelectedPreset(preset)}
                      data-key={preset.isDefault ? preset.key : preset.name}
                    >
                      <div className={styles.left}>
                        {preset.isDefault && <div className={styles.mark}>{t.preset}</div>}
                        <div className={styles.name}>
                          {editingValues[preset.name] ? '*' : ''}
                          {preset.name}
                        </div>
                      </div>
                      <div
                        className={styles.eye}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHidePreset(preset);
                        }}
                      >
                        {preset.hide ? <LayerPanelIcons.Invisible /> : <LayerPanelIcons.Visible />}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
);

export default PresetList;
