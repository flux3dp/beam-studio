import type { MutableRefObject } from 'react';
import React, { forwardRef } from 'react';

import classNames from 'classnames';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import useI18n from '@core/helpers/useI18n';
import type { Preset } from '@core/interfaces/ILayerConfig';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  displayList: Preset[];
  editingValues: Record<string, Preset>;
  onReorder: (newPresets: Preset[]) => void;
  presets: Preset[];
  selected: Preset;
  setSelectedPreset: (preset: Preset) => void;
  toggleHidePreset: (preset: Preset) => void;
}

const PresetList = forwardRef<HTMLDivElement, Props>(
  (
    { displayList, editingValues, onReorder, presets, selected, setSelectedPreset, toggleHidePreset }: Props,
    outerRef: MutableRefObject<HTMLDivElement>,
  ): React.JSX.Element => {
    const t = useI18n().beambox.right_panel.laser_panel.preset_management;
    const handleBeforeDragStart = ({ source }) => {
      setSelectedPreset(displayList[source.index]);
    };

    const handleDragEnd = (result) => {
      if (!result.destination) {
        return;
      }

      const sourceIdx = presets.findIndex((p) => p === displayList[result.source.index]);
      const destIdx = presets.findIndex((p) => p === displayList[result.destination.index]);

      if (sourceIdx === -1 || destIdx === -1) {
        return;
      }

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

                outerRef.current = node;
              }}
            >
              {displayList.map((preset, index) => (
                <Draggable
                  draggableId={preset.isDefault ? preset.key : preset.name}
                  index={index}
                  key={preset.isDefault ? preset.key : preset.name}
                >
                  {(draggalbeProvided, snapshot) => (
                    <div
                      {...draggalbeProvided.draggableProps}
                      {...draggalbeProvided.dragHandleProps}
                      className={classNames(styles.item, {
                        [styles.dragging]: snapshot.isDragging,
                        [styles.preset]: preset.isDefault,
                        [styles.selected]: preset === selected,
                      })}
                      data-key={preset.isDefault ? preset.key : preset.name}
                      onClick={() => setSelectedPreset(preset)}
                      ref={draggalbeProvided.innerRef}
                      title={preset.name}
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
  },
);

export default PresetList;
