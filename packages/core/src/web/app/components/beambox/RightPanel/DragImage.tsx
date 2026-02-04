import React from 'react';

import classNames from 'classnames';

import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import ColorPicker from '@core/app/widgets/ColorPicker';
import { getData } from '@core/helpers/layer/layer-config-helper';

import styles from './DragImage.module.scss';

interface Props {
  draggingLayer: null | string;
}

function DragImage({ draggingLayer = null }: Props): React.JSX.Element {
  if (!draggingLayer) {
    return <div id="drag-image" />;
  }

  const layerObject = layerManager.getLayerByName(draggingLayer);

  if (!layerObject) return <div id="drag-image" />;

  const layer = layerObject.getGroup();

  const isLocked = layer.getAttribute('data-lock') === 'true';
  const isFullColor = getData(layer, 'fullcolor')!;
  const color = getData(layer, 'color') ?? '#333333';
  const isVisible = layerObject.isVisible();
  const backLayers = [];
  // No need to rerender DragImage when selectedLayers change, so not using useLayerStore hook here
  const layerCount = useLayerStore.getState().selectedLayers.length;

  for (let i = layerCount - 1; i >= 1; i -= 1) {
    backLayers.push(<div className={styles.back} key={i} style={{ left: 10 * i, top: -10 * i }} />);
  }

  return (
    <div className={styles.container} id="drag-image">
      {backLayers}
      <div className={classNames(styles.layer, styles.sel, { lock: isLocked })}>
        <div className={styles['sensor-area']} />
        <div className={styles.row}>
          <div className={styles.color}>
            {isFullColor ? (
              <LayerPanelIcons.FullColor />
            ) : (
              <ColorPicker disabled initColor={color} onChange={(color) => console.log(color)} triggerSize="small" />
            )}
          </div>
          <div className={styles.name}>{draggingLayer}</div>
          <div className={classNames(styles.vis, { [styles.invis]: !isVisible })}>
            <img
              alt="vis-icon"
              src={isVisible ? 'img/right-panel/icon-eyeopen.svg' : 'img/right-panel/icon-eyeclose.svg'}
            />
          </div>
          <div className={styles.lock}>
            <img alt="lock-icon" src="img/right-panel/icon-layerlock.svg" />
          </div>
        </div>
        <div className={styles['sensor-area']} />
      </div>
    </div>
  );
}

export default DragImage;
