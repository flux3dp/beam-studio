import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import NS from '@core/app/constants/namespaces';
import rotaryConstants from '@core/app/constants/rotary-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
let container: SVGSVGElement;
let rotaryLine: SVGLineElement;
let transparentRotaryLine: SVGLineElement;
// px
let boundary: number[] = [0, 0];

const round = (num: number, decimal: number): number => {
  const factor = 10 ** decimal;

  return Math.round(num * factor) / factor;
};

const getPosition = (mm = false): null | number => {
  if (!rotaryLine) {
    return null;
  }

  const pxY = round(Number.parseFloat(rotaryLine.getAttribute('y1') ?? '0'), 2);

  if (!mm) {
    return pxY;
  }

  const { dpmm } = constant;

  return pxY / dpmm;
};

const setPosition = (val: number, opts: { unit?: 'mm' | 'px'; write?: boolean } = {}) => {
  if (!rotaryLine) {
    return;
  }

  const { dpmm } = constant;
  const { unit = 'px', write = true } = opts;
  const pxY = unit === 'mm' ? val * dpmm : val;

  rotaryLine.setAttribute('y1', pxY.toString());
  rotaryLine.setAttribute('y2', pxY.toString());
  transparentRotaryLine.setAttribute('y1', pxY.toString());
  transparentRotaryLine.setAttribute('y2', pxY.toString());

  if (write) {
    beamboxPreference.write('rotary-y', pxY);
  }
};

const checkBoundary = () => {
  const position = getPosition();

  if (position === null) {
    return;
  }

  const [min, max] = boundary;

  if (position < min) {
    setPosition(min);
  } else if (position > max) {
    setPosition(max);
  }
};

const updateBoundary = () => {
  const model: WorkAreaModel = beamboxPreference.read('workarea');
  const enableJobOrigin = beamboxPreference.read('enable-job-origin');
  const { maxY } = workareaManager;

  if (rotaryConstants[model]?.boundary && !enableJobOrigin) {
    boundary = rotaryConstants[model].boundary.map((v) => v * constant.dpmm);
  } else {
    boundary = [0, maxY];
  }

  checkBoundary();
};

canvasEventEmitter.on('canvas-change', updateBoundary);
// for enable job origin change
canvasEventEmitter.on('document-settings-saved', updateBoundary);

const toggleDisplay = (): void => {
  const rotaryMode = beamboxPreference.read('rotary_mode');

  rotaryLine?.setAttribute('display', rotaryMode ? 'visible' : 'none');
  transparentRotaryLine?.setAttribute('display', rotaryMode ? 'visible' : 'none');
};

const init = (): void => {
  if (!rotaryLine) {
    const fixedSizeSvg = document.getElementById('fixedSizeSvg');

    container = document.createElementNS(NS.SVG, 'svg') as unknown as SVGSVGElement;
    container.setAttribute('id', 'rotaryAxis');
    container.setAttribute('width', '100%');
    container.setAttribute('height', '100%');
    container.setAttribute('x', '0');
    container.setAttribute('y', '0');
    container.setAttribute('style', 'cursor:ns-resize');
    container.setAttribute('overflow', 'visible');
    container.setAttribute('display', 'inline');
    fixedSizeSvg?.appendChild(container);

    const { maxY } = workareaManager;
    const initPosition = beamboxPreference.read('rotary-y') ?? maxY / 2;

    rotaryLine = document.createElementNS(NS.SVG, 'line') as unknown as SVGLineElement;

    const rotaryLineWidth = 3;
    const transparentLineWidth = 7;

    rotaryLine.setAttribute('id', 'rotaryLine');
    rotaryLine.setAttribute('x1', '0%');
    rotaryLine.setAttribute('x2', '100%');
    rotaryLine.setAttribute('y1', initPosition.toString());
    rotaryLine.setAttribute('y2', initPosition.toString());
    rotaryLine.setAttribute('stroke-width', rotaryLineWidth.toString());
    rotaryLine.setAttribute('vector-effect', 'non-scaling-stroke');
    rotaryLine.setAttribute('stroke', 'rgba(0, 128, 255, 0.3)');
    rotaryLine.setAttribute('fill', 'none');
    rotaryLine.setAttribute('style', `cursor:ns-resize;stroke-width:${rotaryLineWidth}`);
    rotaryLine.setAttribute('display', 'none');
    container.appendChild(rotaryLine);

    transparentRotaryLine = document.createElementNS(NS.SVG, 'line') as unknown as SVGLineElement;
    transparentRotaryLine.setAttribute('id', 'transparentRotaryLine');
    transparentRotaryLine.setAttribute('x1', '0%');
    transparentRotaryLine.setAttribute('x2', '100%');
    transparentRotaryLine.setAttribute('y1', initPosition.toString());
    transparentRotaryLine.setAttribute('y2', initPosition.toString());
    transparentRotaryLine.setAttribute('stroke-width', transparentLineWidth.toString());
    transparentRotaryLine.setAttribute('vector-effect', 'non-scaling-stroke');
    transparentRotaryLine.setAttribute('stroke', 'transparent');
    transparentRotaryLine.setAttribute('fill', 'none');
    transparentRotaryLine.setAttribute('style', `cursor:ns-resize`);
    transparentRotaryLine.setAttribute('display', 'none');
    container.appendChild(transparentRotaryLine);

    const title = document.createElementNS(NS.SVG, 'title');

    title.textContent = 'Rotary Axis';
    container.appendChild(title);

    toggleDisplay();
    updateBoundary();
  }
};

const checkMouseTarget = (elem: Element): boolean => !!elem.closest('#rotaryAxis');

let startY = 0;
const mouseDown = (): void => {
  startY = getPosition() ?? 0;
};

const mouseMove = (y: number): void => {
  const val = Math.min(Math.max(y, boundary[0]), boundary[1]);

  setPosition(val, { write: false });
};
const mouseUp = (): void => {
  checkBoundary();

  const val = getPosition(false) ?? 0;

  setPosition(val, { write: true });

  if (rotaryLine) {
    const batchCmd = new history.BatchCommand('Move Rotary Axis');

    batchCmd.addSubCommand(new history.ChangeElementCommand(rotaryLine, { y1: startY, y2: startY }));
    batchCmd.addSubCommand(new history.ChangeElementCommand(transparentRotaryLine, { y1: startY, y2: startY }));
    batchCmd.onAfter = () => {
      const position = getPosition();

      beamboxPreference.write('rotary-y', position);
    };
    undoManager.addCommandToHistory(batchCmd);
  }
};

// TODO: add test
export default {
  checkMouseTarget,
  getPosition,
  init,
  mouseDown,
  mouseMove,
  mouseUp,
  toggleDisplay,
};
