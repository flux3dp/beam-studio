import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import NS from '@core/app/constants/namespaces';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import styles from './grid.module.scss';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const gridIntervals = [1, 10, 100]; // px
let currentGridInterval: number;
let gridContainer: SVGSVGElement;
let xGridContainer: SVGGElement;
let yGridContainer: SVGGElement;
let show = beamboxPreference.read('show_grids');
let lastZoomRatio = 1;

const getGridInterval = (zoomRatio: number): number => {
  if (zoomRatio > 10) {
    return gridIntervals[0];
  }

  if (zoomRatio > 1) {
    return gridIntervals[1];
  }

  return gridIntervals[2];
};

const updateGrids = (zoomRatio: number, force = false): void => {
  lastZoomRatio = zoomRatio;

  if (!show) {
    return;
  }

  const gridLevel = getGridInterval(zoomRatio);

  if (!force && gridLevel === currentGridInterval) {
    return;
  }

  const { maxY, minY, width } = workareaManager;

  xGridContainer.replaceChildren();
  yGridContainer.replaceChildren();
  for (let i = 0; i <= width / gridLevel; i += 1) {
    const x = i * gridLevel;
    const line = document.createElementNS(NS.SVG, 'line');

    line.setAttribute('x1', x.toString());
    line.setAttribute('y1', minY.toString());
    line.setAttribute('x2', x.toString());
    line.setAttribute('y2', maxY.toString());
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    line.setAttribute('opacity', i % 10 === 0 ? '0.5' : '0.18');
    xGridContainer.appendChild(line);
  }
  for (let i = Math.ceil(minY / gridLevel); i <= maxY / gridLevel; i += 1) {
    const y = i * gridLevel;
    const line = document.createElementNS(NS.SVG, 'line');

    line.setAttribute('x1', '0');
    line.setAttribute('y1', y.toString());
    line.setAttribute('x2', width.toString());
    line.setAttribute('y2', y.toString());
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    line.setAttribute('opacity', i % 10 === 0 ? '0.5' : '0.18');
    yGridContainer.appendChild(line);
  }
  currentGridInterval = gridLevel;
};

canvasEventEmitter.on('zoom-changed', (zoomRatio: number) => {
  requestAnimationFrame(() => updateGrids(zoomRatio));
});

const updateCanvasSize = (): void => {
  const { height, width } = workareaManager;

  gridContainer.setAttribute('viewBox', `0 0 ${width} ${height}`);
};

canvasEventEmitter.on('canvas-change', () => {
  requestAnimationFrame(() => {
    updateCanvasSize();
    updateGrids(lastZoomRatio, true);
  });
});

const toggleGrids = (): void => {
  show = beamboxPreference.read('show_grids');
  gridContainer.style.display = show ? 'inline' : 'none';
  updateGrids(lastZoomRatio, true);
};

const init = (zoomRatio = 1): void => {
  gridContainer = document.createElementNS(NS.SVG, 'svg') as unknown as SVGSVGElement;
  gridContainer.id = 'canvasGrid';
  gridContainer.classList.add(styles.container);
  xGridContainer = document.createElementNS(NS.SVG, 'g') as unknown as SVGGElement;
  gridContainer.appendChild(xGridContainer);
  yGridContainer = document.createElementNS(NS.SVG, 'g') as unknown as SVGGElement;
  gridContainer.appendChild(yGridContainer);

  const canvasBackground = document.getElementById('canvasBackground');
  const backgroundRect = canvasBackground?.querySelector('#canvasBackgroundRect');

  if (backgroundRect) {
    canvasBackground!.insertBefore(gridContainer, backgroundRect.nextSibling);
  } else {
    canvasBackground?.appendChild(gridContainer);
  }

  updateGrids(zoomRatio);
  updateCanvasSize();
};

export default {
  init,
  toggleGrids,
  updateGrids,
};
