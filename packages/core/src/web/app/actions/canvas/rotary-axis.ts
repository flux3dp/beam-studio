import beamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import history from 'app/svgedit/history/history';
import NS from 'app/constants/namespaces';
import rotaryConstants from 'app/constants/rotary-constants';
import undoManager from 'app/svgedit/history/undoManager';
import workareaManager from 'app/svgedit/workarea';
import { WorkAreaModel } from 'app/constants/workarea-constants';

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

const getPosition = (mm = false): number => {
  if (!rotaryLine) return null;
  const pxY = round(parseFloat(rotaryLine.getAttribute('y1') ?? '0'), 2);
  if (!mm) return pxY;
  const { dpmm } = constant;
  return pxY / dpmm;
};

const setPosition = (val: number, opts: { unit?: 'px' | 'mm'; write?: boolean } = {}) => {
  if (!rotaryLine) return;
  const { dpmm } = constant;
  const { unit = 'px', write = true } = opts;
  const pxY = unit === 'mm' ? val * dpmm : val;
  rotaryLine.setAttribute('y1', pxY.toString());
  rotaryLine.setAttribute('y2', pxY.toString());
  transparentRotaryLine.setAttribute('y1', pxY.toString());
  transparentRotaryLine.setAttribute('y2', pxY.toString());
  if (write) beamboxPreference.write('rotary-y', pxY);
};

const checkBoundary = () => {
  const position = getPosition();
  if (position === null) return;
  const [min, max] = boundary;
  if (position < min) setPosition(min);
  else if (position > max) setPosition(max);
};

const updateBoundary = () => {
  const model: WorkAreaModel = beamboxPreference.read('workarea');
  const { height } = workareaManager;
  if (rotaryConstants[model]?.boundary) {
    boundary = rotaryConstants[model].boundary.map((v) => v * constant.dpmm);
  } else {
    boundary = [0, height];
  }
  checkBoundary();
};
canvasEventEmitter.on('canvas-change', updateBoundary);

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

    const { height } = workareaManager;
    const initPosition = beamboxPreference.read('rotary-y') ?? height / 2;
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
  startY = getPosition();
};

const mouseMove = (y: number): void => {
  const val = Math.min(Math.max(y, boundary[0]), boundary[1]);
  setPosition(val, { write: false });
};
const mouseUp = (): void => {
  checkBoundary();
  const val = getPosition(false);
  setPosition(val, { write: true });
  if (rotaryLine) {
    const batchCmd = new history.BatchCommand('Move Rotary Axis');
    batchCmd.addSubCommand(
      new history.ChangeElementCommand(rotaryLine, { y1: startY, y2: startY })
    );
    batchCmd.addSubCommand(
      new history.ChangeElementCommand(transparentRotaryLine, { y1: startY, y2: startY })
    );
    batchCmd.onAfter = () => {
      const position = getPosition();
      beamboxPreference.write('rotary-y', position);
    };
    undoManager.addCommandToHistory(batchCmd);
  }
};

// TODO: add test
export default {
  init,
  getPosition,
  checkMouseTarget,
  mouseDown,
  mouseMove,
  mouseUp,
  toggleDisplay,
};
