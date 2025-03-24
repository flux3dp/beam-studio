import React, { useContext, useEffect, useRef } from 'react';

import { SwipeAction } from 'antd-mobile';
import type { Action, SwipeActionRef } from 'antd-mobile/es/components/swipe-action';
import classNames from 'classnames';

import constant from '@core/app/actions/beambox/constant';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import ColorPicker from '@core/app/widgets/ColorPicker';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getData } from '@core/helpers/layer/layer-config-helper';
import {
  deleteLayerByName,
  getAllLayerNames,
  getLayerElementByName,
  setLayerLock,
} from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './LayerList.module.scss';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  draggingDestIndex: null | number;
  highlightLayer: (layerName?: string) => void;
  onLayerCenterDragEnter: (layerName: string) => void;
  onLayerClick: (e: React.MouseEvent, layerName: string) => void;
  onLayerColorChange: (layerName: string, color: string) => void;
  onLayerDoubleClick: () => void;
  onlayerDragEnd: (e: React.DragEvent) => void;
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
  onlayerDragEnd,
  onLayerDragStart,
  onLayerTouchEnd,
  onLayerTouchMove,
  onLayerTouchStart,
  onSensorAreaDragEnter,
  setLayerVisibility,
  unLockLayers,
}: Props): React.JSX.Element => {
  const { forceUpdate, selectedLayers, setSelectedLayers } = useContext(LayerPanelContext);
  const items: React.ReactNode[] = [];
  const drawing = svgCanvas.getCurrentDrawing();
  const currentLayerName = drawing.getCurrentLayerName();
  const isMobile = useIsMobile();
  const ref = useRef<SwipeActionRef>(null);

  useEffect(() => {
    if (ref.current && draggingDestIndex !== null) {
      ref.current.close();
    }
  }, [ref, draggingDestIndex, selectedLayers]);

  const workarea = useWorkarea();

  const isAnyLayerMissing = drawing.all_layers.some((layer) => {
    if (!layer.group_.parentNode) {
      return true;
    }

    return false;
  });

  if (isAnyLayerMissing) {
    drawing.identifyLayers();
  }

  const allLayerNames = getAllLayerNames();

  if (draggingDestIndex === allLayerNames.length) {
    items.push(renderDragBar());
  }

  const shouldShowModuleIcon = constant.adorModels.includes(workarea);

  for (let i = allLayerNames.length - 1; i >= 0; i -= 1) {
    const layerName = allLayerNames[i];
    const layer = getLayerElementByName(layerName);

    if (layer) {
      const isLocked = layer.getAttribute('data-lock') === 'true';
      const isFullColor = layer.getAttribute('data-fullcolor') === '1';
      const isSelected = selectedLayers.includes(layerName);
      const isVis = drawing.getLayerVisibility(layerName);
      const layerModule = getData(layer, 'module');
      const isPrinting = printingModules.has(layerModule);
      const isRef = getData(layer, 'ref');
      let moduleIcon = null;

      if (isRef) {
        moduleIcon = <LayerPanelIcons.Ref />;
      } else if (shouldShowModuleIcon) {
        moduleIcon = isPrinting ? <LayerPanelIcons.Print /> : <LayerPanelIcons.Laser />;
      }

      const layerItem = (
        <div
          className={classNames('layer-item', styles.item, {
            [styles.current]: currentLayerName === layerName,
            [styles.locked]: isLocked,
            [styles.selected]: isSelected,
          })}
          data-layer={layerName}
          data-testid={layerName}
          draggable
          key={layerName}
          onBlur={() => {}}
          onClick={(e: React.MouseEvent) => onLayerClick(e, layerName)}
          onDragEnd={onlayerDragEnd}
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
            className={styles['drag-sensor-area']}
            data-index={i + 1}
            onDragEnter={() => onSensorAreaDragEnter(i + 1)}
          />
          <div className={styles.row} data-layer={layerName} onDragEnter={() => onLayerCenterDragEnter(layerName)}>
            <div className={styles.color}>
              {isFullColor ? (
                <LayerPanelIcons.FullColor />
              ) : (
                <ColorPicker
                  forPrinter={isPrinting}
                  initColor={drawing.getLayerColor(layerName)}
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
                if (!isMobile && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
                  onLayerDoubleClick();
                }
              }}
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
              {isVis ? <LayerPanelIcons.Visible /> : <LayerPanelIcons.Invisible />}
            </div>
            {isMobile && (
              <div>
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
          <div className={styles['drag-sensor-area']} data-index={i} onDragEnter={() => onSensorAreaDragEnter(i)} />
        </div>
      );

      if (!isMobile) {
        items.push(layerItem);
      } else {
        const leftActions: Action[] = isMobile
          ? [
              {
                color: 'warning',
                key: 'lock',
                onClick: () => {
                  setLayerLock(layerName, !isLocked);
                  // let SwipeAction close before force update
                  setTimeout(forceUpdate);
                },
                text: isLocked ? <LayerPanelIcons.Unlock /> : <LayerPanelIcons.Lock />,
              },
            ]
          : undefined;
        const rightActions: Action[] = isMobile
          ? [
              {
                color: 'danger',
                key: 'delete',
                onClick: () => {
                  deleteLayerByName(layerName);
                  setSelectedLayers([]);
                },
                text: <ObjectPanelIcons.Trash />,
              },
            ]
          : undefined;

        items.push(
          <SwipeAction
            key={layerName}
            leftActions={leftActions}
            onActionsReveal={() => setSelectedLayers([layerName])}
            ref={isSelected && layerName === selectedLayers[0] ? ref : undefined}
            rightActions={rightActions}
          >
            {layerItem}
          </SwipeAction>,
        );
      }

      if (draggingDestIndex === i) {
        items.push(renderDragBar());
      }
    }
  }

  return (
    <div className={styles.list} id="layerlist" onDragOver={(e) => e.preventDefault()}>
      {items}
    </div>
  );
};

export default LayerList;
