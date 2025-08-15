import constant from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import NS from '@core/app/constants/namespaces';
import rotaryConstants from '@core/app/constants/rotary-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
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

const getPosition = (mm = false): number => {
  if (!rotaryLine) {
    return 0;
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
    useDocumentStore.getState().set('rotary-y', pxY);
  }
};

const checkBoundary = () => {
  if (!rotaryLine) {
    return;
  }

  const [min, max] = boundary;

  setPosition(Math.min(Math.max(getPosition(), min), max));
};

const updateBoundary = () => {
  const { 'enable-job-origin': enableJobOrigin, workarea } = useDocumentStore.getState();
  const { maxY } = workareaManager;

  if (rotaryConstants[workarea]?.boundary && !enableJobOrigin) {
    boundary = rotaryConstants[workarea].boundary.map((v) => v * constant.dpmm);
  } else {
    boundary = [0, maxY];
  }

  checkBoundary();
  toggleDisplay();
};

canvasEventEmitter.on('canvas-change', updateBoundary);
// for enable job origin change
canvasEventEmitter.on('document-settings-saved', updateBoundary);

const toggleDisplay = (): void => {
  const { 'enable-job-origin': enableJobOrigin, rotary_mode: rotaryMode, workarea } = useDocumentStore.getState();
  const isJobOriginEnabled = Boolean(enableJobOrigin && getAddOnInfo(workarea).jobOrigin);
  const visible = rotaryMode && !isJobOriginEnabled ? 'visible' : 'none';

  rotaryLine?.setAttribute('display', visible);
  transparentRotaryLine?.setAttribute('display', visible);
};

const init = (): void => {
  if (rotaryLine) {
    return; // already initialized
  }

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
  const initPosition = Number(useDocumentStore.getState()['rotary-y']) || maxY / 2;

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
};

const checkMouseTarget = (elem: Element): boolean => Boolean(elem.closest('#rotaryAxis'));

let startY = 0;
const mouseDown = (): void => {
  startY = getPosition();
};

const mouseMove = (y: number): void => {
  setPosition(Math.min(Math.max(y, boundary[0]), boundary[1]), { write: false });
};
const mouseUp = (): void => {
  checkBoundary();
  setPosition(getPosition(false), { write: true });

  if (rotaryLine) {
    const batchCmd = new history.BatchCommand('Move Rotary Axis');

    batchCmd.addSubCommand(new history.ChangeElementCommand(rotaryLine, { y1: startY, y2: startY }));
    batchCmd.addSubCommand(new history.ChangeElementCommand(transparentRotaryLine, { y1: startY, y2: startY }));
    batchCmd.onAfter = () => {
      useDocumentStore.getState().set('rotary-y', getPosition());
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
  setPosition,
  toggleDisplay,
};
