import React, { useEffect, useRef, useState } from 'react';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Collapse, ConfigProvider } from 'antd';
import type { SwipeActionRef } from 'antd-mobile/es/components/swipe-action';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { pick } from 'remeda';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/shallow';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
import ColorPicker from '@core/app/widgets/ColorPicker';
import { useLayerChildElements } from '@core/helpers/hooks/useLayerChildElements';
import { useSupportedModules } from '@core/helpers/hooks/useSupportedModules';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getData } from '@core/helpers/layer/layer-config-helper';

import ElementList from './ElementList';
import { ElementDragOverlay } from './ElementListItem';
import { applyElementOrder, getSelectedElementList, isPlaceholderId, placeholderIdFor } from './elementListUtils';
import styles from './LayerList.module.scss';

interface Props {
  draggingDestIndex: null | number;
  highlightLayer: (layerName?: string) => void;
  onLayerCenterDragEnter: (layerName: string) => void;
  onLayerClick: (e: React.MouseEvent, layerName: string) => void;
  onLayerColorChange: (layerName: string, color: string) => void;
  onLayerDoubleClick: () => void;
  onLayerDragEnd: (e: React.DragEvent) => void;
  onLayerDragStart: (layerName: string, e: React.DragEvent) => void;
  onLayerTouchEnd: (e: React.TouchEvent) => void;
  onLayerTouchMove: (e: React.TouchEvent) => void;
  onLayerTouchStart: (layerName: string, e: React.TouchEvent, delay?: number) => void;
  onSensorAreaDragEnter: (index: number) => void;
  setLayerVisibility: (layerName: string) => void;
  unLockLayers: (layerName: string) => void;
}

const renderDragBar = (): React.JSX.Element => <div className={styles['drag-bar']} key="drag-bar" />;

const LayerList = ({
  draggingDestIndex,
  highlightLayer,
  onLayerCenterDragEnter,
  onLayerClick,
  onLayerColorChange,
  onLayerDoubleClick,
  onLayerDragEnd,
  onLayerDragStart,
  onLayerTouchEnd,
  onLayerTouchMove,
  onLayerTouchStart,
  onSensorAreaDragEnter,
  setLayerVisibility,
  unLockLayers,
}: Props): React.JSX.Element => {
  const { forceUpdate, selectedLayers, setSelectedLayers } = useLayerStore(
    useShallow(pick(['forceUpdate', 'selectedLayers', 'setSelectedLayers'])),
  );
  const { childElements, unwatchLayer, watchedLayers, watchLayer } = useLayerChildElements({ initialLayers: [] });

  const items: React.ReactNode[] = [];
  const currentLayerName = layerManager.getCurrentLayerName();
  const isMobile = useIsTabletOrMobile();
  const workarea = useWorkarea();
  const supportedModules = useSupportedModules(workarea);
  const ref = useRef<SwipeActionRef>(null);
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const sensors = useSensors(
    useSensor(isTouch ? TouchSensor : PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  // element + how many are moving together, used to render the element drag hint overlay
  const [dragState, setDragState] = useState<null | { count: number; element: SVGElement }>(null);
  // during a drag, the per-layer element-id order overriding the DOM order, so the target
  // layer's SortableContext reserves space and animates while dragging across layers
  const [dragOrder, setDragOrder] = useState<null | Record<string, string[]>>(null);
  const autoSwitchTab = useRef(null as boolean | null);

  useEffect(() => {
    if (ref.current && draggingDestIndex !== null) {
      ref.current.close();
    }
  }, [ref, draggingDestIndex, selectedLayers]);

  const isAnyLayerMissing = layerManager.getAllLayers().some((layer) => !layer.getGroup().parentNode);

  if (isAnyLayerMissing) {
    layerManager.identifyLayers();
  }

  const allLayerNames = layerManager.getAllLayerNames();

  // Shared, cross-layer lookups derived from the child-element map.
  const idToElement = new Map<string, SVGElement>();
  const layerGroupByName = new Map<string, SVGGElement>();
  const baseOrder: Record<string, string[]> = {};

  allLayerNames.forEach((name) => {
    const group = layerManager.getLayerByName(name)?.getGroup();

    if (!group) return;

    layerGroupByName.set(name, group);
    baseOrder[name] = [
      ...(childElements.get(group) ?? []).map((el) => {
        idToElement.set(el.id, el);

        return el.id;
      }),
      // trailing placeholder so the layer is always a drop target (incl. when empty)
      placeholderIdFor(name),
    ];
  });

  // Ids rendered per layer: the drag override while dragging, otherwise the DOM order.
  const orderForLayer = (name: string): string[] => dragOrder?.[name] ?? baseOrder[name] ?? [];

  const findContainerName = (order: Record<string, string[]>, id: string): null | string => {
    for (const name of Object.keys(order)) {
      if (order[name].includes(id)) return name;
    }

    return null;
  };

  const handleElementDragStart = (event: DragStartEvent) => {
    const activeElem = idToElement.get(event.active.id as string);

    if (!activeElem) return;

    autoSwitchTab.current = useGlobalPreferenceStore.getState()['auto-switch-tab'];

    const selected = getSelectedElementList();
    const isSelected = selected.includes(activeElem);

    // Dragging an element that isn't part of the selection: make it the selection first.
    if (!isSelected) {
      if (useGlobalPreferenceStore.getState()['auto-switch-tab']) {
        autoSwitchTab.current = true;
        useGlobalPreferenceStore.setState({ 'auto-switch-tab': false });
      }

      selectionManager.selectOnly([activeElem], true);
    }

    setDragState({ count: isSelected ? selected.length : 1, element: activeElem });
    // snapshot the current order so onDragOver can relocate the dragged id across layers
    setDragOrder(structuredClone(baseOrder));
  };

  // Relocate the dragged id into the hovered layer so that layer's items animate a gap.
  const handleElementDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setDragOrder((prev) => {
      const order = prev ?? structuredClone(baseOrder);
      const fromLayer = findContainerName(order, activeId);
      const toLayer = findContainerName(order, overId);

      if (!fromLayer || !toLayer || fromLayer === toLayer) return prev;

      const next: Record<string, string[]> = {
        ...order,
        [fromLayer]: [...order[fromLayer]],
        [toLayer]: [...order[toLayer]],
      };

      next[fromLayer] = next[fromLayer].filter((id) => id !== activeId);

      const overIndex = next[toLayer].indexOf(overId);
      const activeRect = active.rect.current.translated;
      const insertAfter = Boolean(activeRect) && activeRect!.top > over.rect.top + over.rect.height / 2;
      const insertAt = overIndex >= 0 ? overIndex + (insertAfter ? 1 : 0) : next[toLayer].length;

      next[toLayer].splice(insertAt, 0, activeId);

      return next;
    });
  };

  const handleElementDragEnd = (event: DragEndEvent) => {
    const order = dragOrder;

    setDragState(null);
    setDragOrder(null);

    try {
      const { active, over } = event;
      const activeId = active.id as string;
      const activeElem = idToElement.get(activeId);

      if (!activeElem || !order) return;

      // The layer the dragged element ended up in (onDragOver relocated it there for cross-layer moves).
      const targetLayerName = findContainerName(order, activeId);
      const targetLayer = targetLayerName ? layerGroupByName.get(targetLayerName) : null;

      if (!targetLayerName || !targetLayer) return;

      // Finalize position within the target layer via arrayMove (off-by-one-proof: the dragged id
      // stays in the array, so the target index is interpreted the same way dnd-kit previews it).
      let ids = order[targetLayerName];
      const overId = over?.id as string | undefined;

      if (overId && overId !== activeId) {
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);

        if (oldIndex >= 0 && newIndex >= 0) ids = arrayMove(ids, oldIndex, newIndex);
      }

      // Move the whole selection together when the dragged element is part of it (may span layers).
      const selected = getSelectedElementList();
      const moving = selected.includes(activeElem) ? selected : [activeElem];
      const movingIds = new Set(moving.map((el) => el.id));

      // Expand the dragged id into the full moving block; drop placeholders and other moving ids.
      const orderedIds: string[] = [];

      ids.forEach((id) => {
        if (id === activeId) {
          moving.forEach((el) => orderedIds.push(el.id));
        } else if (!movingIds.has(id) && !isPlaceholderId(id)) {
          orderedIds.push(id);
        }
      });

      const newOrder = orderedIds.map((id) => idToElement.get(id)).filter(Boolean) as SVGElement[];

      // Flatten any temp group so all elements sit physically in their layer before reordering.
      selectionManager.clearSelection();
      applyElementOrder(targetLayer, newOrder);
      // Restore the selection (re-creates the temp group for multi-selection).
      selectionManager.multiSelect(moving);
      layerManager.setCurrentLayer(targetLayerName);
      useLayerStore.getState().setSelectedLayers([targetLayerName]);
    } finally {
      if (autoSwitchTab.current) {
        useGlobalPreferenceStore.setState({ 'auto-switch-tab': true });
        autoSwitchTab.current = null;
      }
    }
  };

  if (draggingDestIndex === allLayerNames.length) {
    items.push(renderDragBar());
  }

  const shouldShowModuleIcon = supportedModules.length > 1;

  for (let i = allLayerNames.length - 1; i >= 0; i -= 1) {
    const layerName = allLayerNames[i];
    const layerObject = layerManager.getLayerByName(layerName);

    if (layerObject) {
      const layer = layerObject.getGroup();
      const isLocked = layer.getAttribute('data-lock') === 'true';
      const isFullColor = getData(layer, 'fullcolor');
      const color = getData(layer, 'color') ?? '#333333';
      const isSelected = selectedLayers.includes(layerName);
      const layerModule = getData(layer, 'module');
      const isPrinting = printingModules.has(layerModule!);
      const colorPresets = match<LayerModuleType | undefined, 'cmyk' | 'cmykw' | undefined>(layerModule)
        .with(LayerModule.PRINTER_4C, () => 'cmyk')
        .with(LayerModule.PRINTER, () => 'cmykw')
        .otherwise(() => undefined);
      let moduleIcon = null;

      moduleIcon = match(layerModule)
        .with(LayerModule.GUIDE, () => <LeftPanelIcons.Photo />)
        .with(LayerModule.UV_PRINT, () => <LayerPanelIcons.UvPrint />)
        .when(
          () => getData(layer, 'ref'),
          () => <LayerPanelIcons.Ref />,
        )
        .when(
          () => isPrinting,
          () => <LayerPanelIcons.Print />,
        )
        .otherwise(() => <LayerPanelIcons.Laser />);

      const layerItem = (
        <div
          className={classNames('layer-item', styles.item, {
            [styles.current]: currentLayerName === layerName,
            [styles.locked]: isLocked,
            [styles.selected]: isSelected,
          })}
        >
          <div
            className={styles['drag-sensor-area']}
            data-index={i + 1}
            onDragEnter={() => onSensorAreaDragEnter(i + 1)}
          />
          <Collapse
            activeKey={watchedLayers.includes(layer) ? [layerName] : []}
            bordered={false}
            className={styles.collapse}
            ghost
            items={[
              {
                children: (
                  <div className={styles.elements}>
                    <ElementList elementById={idToElement} elementIds={orderForLayer(layerName)} />
                  </div>
                ),
                key: layerName,
                label: (
                  <div
                    data-layer={layerName}
                    data-testid={layerName}
                    draggable
                    key={layerName}
                    onBlur={() => {}}
                    onClick={(e: React.MouseEvent) => onLayerClick(e, layerName)}
                    onDragEnd={onLayerDragEnd}
                    onDragStart={(e: React.DragEvent) => onLayerDragStart(layerName, e)}
                    onFocus={() => {}}
                    onMouseOut={() => highlightLayer()}
                    onMouseOver={() => highlightLayer(layerName)}
                    onTouchEnd={onLayerTouchEnd}
                    onTouchMove={onLayerTouchMove}
                    onTouchStart={(e: React.TouchEvent) => {
                      onLayerTouchStart(layerName, e, isMobile ? 100 : 800);
                    }}
                  >
                    <div
                      className={styles.row}
                      data-layer={layerName}
                      onDragEnter={() => onLayerCenterDragEnter(layerName)}
                    >
                      <div className={styles.color}>
                        {isFullColor ? (
                          <LayerPanelIcons.FullColor />
                        ) : (
                          <ColorPicker
                            colorPresets={colorPresets}
                            initColor={color}
                            onChange={(color) => onLayerColorChange(layerName, color)}
                            triggerSize="small"
                          />
                        )}
                      </div>
                      {moduleIcon && <div className={styles.module}>{moduleIcon}</div>}
                      <div
                        className={classNames(styles.name, {
                          [styles['with-module']]: shouldShowModuleIcon,
                        })}
                        id={`layerdoubleclick-${i}`}
                        onDoubleClick={(e: React.MouseEvent) => {
                          if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
                            onLayerDoubleClick();
                          }
                        }}
                        title={layerName}
                      >
                        {layerName}
                      </div>
                      {isMobile && (
                        <div
                          className={styles.lock}
                          id={`layerlock-${i}`}
                          onClick={(e: React.MouseEvent) => {
                            if (isLocked) {
                              e.stopPropagation();
                              unLockLayers(layerName);
                            }
                          }}
                        >
                          <img alt="lock-icon" src="img/right-panel/icon-layerlock.svg" />
                        </div>
                      )}
                      <div
                        className={styles.vis}
                        id={`layervis-${i}`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setLayerVisibility(layerName);
                        }}
                      >
                        {layerObject?.isVisible() ? <LayerPanelIcons.Visible /> : <LayerPanelIcons.Invisible />}
                      </div>
                      {isMobile && (
                        <div className={styles.move}>
                          <LayerPanelIcons.Move />
                        </div>
                      )}
                      {!isMobile && (
                        <div
                          className={styles.lock}
                          id={`layerlock-${i}`}
                          onClick={(e: React.MouseEvent) => {
                            if (isLocked) {
                              e.stopPropagation();
                              unLockLayers(layerName);
                            }
                          }}
                        >
                          <img alt="lock-icon" src="img/right-panel/icon-layerlock.svg" />
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
            onChange={(keys) => (keys.length > 0 ? watchLayer(layer) : unwatchLayer(layer))}
          />
          <div className={styles['drag-sensor-area']} data-index={i} onDragEnter={() => onSensorAreaDragEnter(i)} />
        </div>
      );

      items.push(layerItem);

      if (draggingDestIndex === i) {
        items.push(renderDragBar());
      }
    }
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            contentPadding: 0,
            headerPadding: '8px',
          },
        },
      }}
    >
      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={() => {
          setDragState(null);
          setDragOrder(null);

          if (autoSwitchTab.current) {
            useGlobalPreferenceStore.setState({ 'auto-switch-tab': true });
            autoSwitchTab.current = null;
          }
        }}
        onDragEnd={handleElementDragEnd}
        onDragOver={handleElementDragOver}
        onDragStart={handleElementDragStart}
        sensors={sensors}
      >
        <div className={styles.list} id="layerlist" onDragOver={(e) => e.preventDefault()}>
          {items}
        </div>
        {/* Portal to body so the overlay isn't clipped by the panel's overflow/transform ancestors */}
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {dragState ? <ElementDragOverlay count={dragState.count} element={dragState.element} /> : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </ConfigProvider>
  );
};

export default LayerList;
