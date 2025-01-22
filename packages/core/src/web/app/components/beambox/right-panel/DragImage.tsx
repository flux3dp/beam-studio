import React from 'react';

import classNames from 'classnames';

import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import ColorPicker from '@core/app/widgets/ColorPicker';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';

import styles from './DragImage.module.scss';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  draggingLayer: string;
  selectedLayers: string[];
}

function DragImage({ draggingLayer = null, selectedLayers }: Props): React.JSX.Element {
  if (!draggingLayer) {
    return <div id="drag-image" />;
  }

  const drawing = svgCanvas.getCurrentDrawing();
  const layer = drawing.getLayerByName(draggingLayer);

  if (!layer) {
    return <div id="drag-image" />;
  }

  const isLocked = layer.getAttribute('data-lock') === 'true';
  const isFullColor = layer.getAttribute('data-fullcolor') === '1';
  const isVis = drawing.getLayerVisibility(draggingLayer);
  const backLayers = [];

  for (let i = selectedLayers.length - 1; i >= 1; i -= 1) {
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
              <ColorPicker
                disabled
                initColor={drawing.getLayerColor(draggingLayer)}
                onChange={(color) => console.log(color)}
                triggerSize="small"
              />
            )}
          </div>
          <div className={styles.name}>{draggingLayer}</div>
          <div
            className={classNames(styles.vis, {
              [styles.invis]: !drawing.getLayerVisibility(draggingLayer),
            })}
          >
            <img
              alt="vis-icon"
              src={isVis ? 'img/right-panel/icon-eyeopen.svg' : 'img/right-panel/icon-eyeclose.svg'}
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
