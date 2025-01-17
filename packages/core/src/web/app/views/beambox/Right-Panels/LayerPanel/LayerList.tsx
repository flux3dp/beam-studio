import classNames from 'classnames';
import React, { useContext, useEffect, useRef } from 'react';
import { Action, SwipeActionRef } from 'antd-mobile/es/components/swipe-action';
import { SwipeAction } from 'antd-mobile';

import ColorPicker from 'app/widgets/ColorPicker';
import constant from 'app/actions/beambox/constant';
import LayerModule from 'app/constants/layer-module/layer-modules';
import LayerPanelIcons from 'app/icons/layer-panel/LayerPanelIcons';
import ObjectPanelIcons from 'app/icons/object-panel/ObjectPanelIcons';
import useWorkarea from 'helpers/hooks/useWorkarea';
import {
  deleteLayerByName,
  getAllLayerNames,
  getLayerElementByName,
  setLayerLock,
} from 'helpers/layer/layer-helper';
import { getData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { useIsMobile } from 'helpers/system-helper';

import styles from './LayerList.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  draggingDestIndex: number | null;
  onLayerClick: (e: React.MouseEvent, layerName: string) => void;
  highlightLayer: (layerName?: string) => void;
  onLayerDragStart: (layerName: string, e: React.DragEvent) => void;
  onlayerDragEnd: (e: React.DragEvent) => void;
  onLayerTouchStart: (layerName: string, e: React.TouchEvent, delay?: number) => void;
  onLayerTouchMove: (e: React.TouchEvent) => void;
  onLayerTouchEnd: (e: React.TouchEvent) => void;
  onSensorAreaDragEnter: (index: number) => void;
  onLayerCenterDragEnter: (layerName: string) => void;
  onLayerDoubleClick: () => void;
  onLayerColorChange: (layerName: string, color: string) => void;
  setLayerVisibility: (layerName: string) => void;
  unLockLayers: (layerName: string) => void;
}

const renderDragBar = (): JSX.Element => <div key="drag-bar" className={styles['drag-bar']} />;

const LayerList = ({
  draggingDestIndex,
  onLayerClick,
  highlightLayer,
  onLayerDragStart,
  onlayerDragEnd,
  onLayerTouchStart,
  onLayerTouchMove,
  onLayerTouchEnd,
  onSensorAreaDragEnter,
  onLayerCenterDragEnter,
  onLayerDoubleClick,
  onLayerColorChange,
  setLayerVisibility,
  unLockLayers,
}: Props): JSX.Element => {
  const { selectedLayers, setSelectedLayers, forceUpdate } = useContext(LayerPanelContext);
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
    // eslint-disable-next-line no-underscore-dangle
    if (!layer.group_.parentNode) return true;
    return false;
  });
  if (isAnyLayerMissing) drawing.identifyLayers();

  const allLayerNames = getAllLayerNames();
  if (draggingDestIndex === allLayerNames.length) items.push(renderDragBar());
  const shouldShowModuleIcon = constant.adorModels.includes(workarea);

  for (let i = allLayerNames.length - 1; i >= 0; i -= 1) {
    const layerName = allLayerNames[i];
    const layer = getLayerElementByName(layerName);
    if (layer) {
      const isLocked = layer.getAttribute('data-lock') === 'true';
      const isFullColor = layer.getAttribute('data-fullcolor') === '1';
      const isSelected = selectedLayers.includes(layerName);
      const isVis = drawing.getLayerVisibility(layerName);
      const module = getData(layer, 'module');
      const isRef = getData(layer, 'ref');
      let moduleIcon = null;
      if (isRef) moduleIcon = <LayerPanelIcons.Ref />;
      else if (shouldShowModuleIcon)
        moduleIcon =
          module === LayerModule.PRINTER ? <LayerPanelIcons.Print /> : <LayerPanelIcons.Laser />;
      const layerItem = (
        <div
          key={layerName}
          data-testid={layerName}
          data-layer={layerName}
          className={classNames('layer-item', styles.item, {
            [styles.selected]: isSelected,
            [styles.locked]: isLocked,
            [styles.current]: currentLayerName === layerName,
          })}
          onClick={(e: React.MouseEvent) => onLayerClick(e, layerName)}
          onMouseOver={() => highlightLayer(layerName)}
          onMouseOut={() => highlightLayer()}
          draggable
          onDragStart={(e: React.DragEvent) => onLayerDragStart(layerName, e)}
          onDragEnd={onlayerDragEnd}
          onTouchStart={(e: React.TouchEvent) => {
            onLayerTouchStart(layerName, e, isMobile ? 100 : 800);
          }}
          onTouchMove={onLayerTouchMove}
          onTouchEnd={onLayerTouchEnd}
          onFocus={() => {}}
          onBlur={() => {}}
        >
          <div
            className={styles['drag-sensor-area']}
            data-index={i + 1}
            onDragEnter={() => onSensorAreaDragEnter(i + 1)}
          />
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
                  initColor={drawing.getLayerColor(layerName)}
                  forPrinter={module === LayerModule.PRINTER}
                  triggerSize="small"
                  onChange={(color) => onLayerColorChange(layerName, color)}
                />
              )}
            </div>
            {moduleIcon && (
              <div className={styles.module}>
                {moduleIcon}
              </div>
            )}
            <div
              id={`layerdoubleclick-${i}`}
              className={classNames(styles.name, {
                [styles['with-module']]: shouldShowModuleIcon,
              })}
              onDoubleClick={(e: React.MouseEvent) => {
                if (!isMobile && !e.ctrlKey && !e.shiftKey && !e.metaKey) onLayerDoubleClick();
              }}
            >
              {layerName}
            </div>
            {isMobile && (
              <div
                id={`layerlock-${i}`}
                className={styles.lock}
                onClick={(e: React.MouseEvent) => {
                  if (isLocked) {
                    e.stopPropagation();
                    unLockLayers(layerName);
                  }
                }}
              >
                <img src="img/right-panel/icon-layerlock.svg" alt="lock-icon" />
              </div>
            )}
            <div
              id={`layervis-${i}`}
              className={styles.vis}
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
                id={`layerlock-${i}`}
                className={styles.lock}
                onClick={(e: React.MouseEvent) => {
                  if (isLocked) {
                    e.stopPropagation();
                    unLockLayers(layerName);
                  }
                }}
              >
                <img src="img/right-panel/icon-layerlock.svg" alt="lock-icon" />
              </div>
            )}
          </div>
          <div
            className={styles['drag-sensor-area']}
            data-index={i}
            onDragEnter={() => onSensorAreaDragEnter(i)}
          />
        </div>
      );
      if (!isMobile) {
        items.push(layerItem);
      } else {
        const leftActions: Action[] = isMobile
          ? [
              {
                key: 'lock',
                text: isLocked ? <LayerPanelIcons.Unlock /> : <LayerPanelIcons.Lock />,
                color: 'warning',
                onClick: () => {
                  setLayerLock(layerName, !isLocked);
                  // let SwipeAction close before force update
                  setTimeout(forceUpdate);
                },
              },
            ]
          : undefined;
        const rightActions: Action[] = isMobile
          ? [
              {
                key: 'delete',
                text: <ObjectPanelIcons.Trash />,
                color: 'danger',
                onClick: () => {
                  deleteLayerByName(layerName);
                  setSelectedLayers([]);
                },
              },
            ]
          : undefined;
        items.push(
          <SwipeAction
            key={layerName}
            ref={isSelected && layerName === selectedLayers[0] ? ref : undefined}
            leftActions={leftActions}
            rightActions={rightActions}
            onActionsReveal={() => setSelectedLayers([layerName])}
          >
            {layerItem}
          </SwipeAction>
        );
      }
      if (draggingDestIndex === i) {
        items.push(renderDragBar());
      }
    }
  }

  return (
    <div id="layerlist" className={styles.list} onDragOver={(e) => e.preventDefault()}>
      {items}
    </div>
  );
};

export default LayerList;
