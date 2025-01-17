import React from 'react';
import classNames from 'classnames';

import ColorPicker from 'app/widgets/ColorPicker';
import LayerPanelIcons from 'app/icons/layer-panel/LayerPanelIcons';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import styles from './DragImage.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  selectedLayers: string[];
  draggingLayer: string;
}

function DragImage({ selectedLayers, draggingLayer = null }: Props): JSX.Element {
  if (!draggingLayer) return <div id="drag-image" />;

  const drawing = svgCanvas.getCurrentDrawing();
  const layer = drawing.getLayerByName(draggingLayer);
  if (!layer) return <div id="drag-image" />;

  const isLocked = layer.getAttribute('data-lock') === 'true';
  const isFullColor = layer.getAttribute('data-fullcolor') === '1';
  const isVis = drawing.getLayerVisibility(draggingLayer);
  const backLayers = [];
  for (let i = selectedLayers.length - 1; i >= 1; i -= 1) {
    backLayers.push(<div className={styles.back} key={i} style={{ top: -10 * i, left: 10 * i }} />);
  }

  return (
    <div id="drag-image" className={styles.container}>
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
                triggerSize="small"
                onChange={(color) => console.log(color)}
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
              src={isVis ? 'img/right-panel/icon-eyeopen.svg' : 'img/right-panel/icon-eyeclose.svg'}
              alt="vis-icon"
            />
          </div>
          <div className={styles.lock}>
            <img src="img/right-panel/icon-layerlock.svg" alt="lock-icon" />
          </div>
        </div>
        <div className={styles['sensor-area']} />
      </div>
    </div>
  );
}

export default DragImage;
