import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import Constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import NS from 'app/constants/namespaces';
import workareaManager from 'app/svgedit/workarea';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

let diodeBoundaryPath: SVGPathElement;
let diodeBoundarySvg: SVGSVGElement;
const createBoundary = () => {
  diodeBoundarySvg = document.createElementNS(NS.SVG, 'svg') as unknown as SVGSVGElement;
  diodeBoundaryPath = document.createElementNS(NS.SVG, 'path') as unknown as SVGPathElement;
  document.getElementById('canvasBackground')?.appendChild(diodeBoundarySvg);
  diodeBoundarySvg.appendChild(diodeBoundaryPath);
  const { width, height } = workareaManager;
  diodeBoundarySvg.setAttribute('id', 'diode-boundary');
  diodeBoundarySvg.setAttribute('width', '100%');
  diodeBoundarySvg.setAttribute('height', '100%');
  diodeBoundarySvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  diodeBoundarySvg.setAttribute('x', '0');
  diodeBoundarySvg.setAttribute('y', '0');
  diodeBoundarySvg.setAttribute('style', 'pointer-events:none');

  diodeBoundaryPath.setAttribute('fill', '#CCC');
  diodeBoundaryPath.setAttribute('fill-opacity', '0.4');
  diodeBoundaryPath.setAttribute('fill-rule', 'evenodd');
  diodeBoundaryPath.setAttribute('stroke', 'none');
  diodeBoundaryPath.setAttribute('style', 'pointer-events:none');
};

const updateCanvasSize = (): void => {
  const { width, height } = workareaManager;
  const viewBox = `0 0 ${width} ${height}`;
  diodeBoundarySvg?.setAttribute('viewBox', viewBox);
};
canvasEventEmitter.on('canvas-change', updateCanvasSize);

const show = (isDiode = false): void => {
  if (!diodeBoundaryPath) createBoundary();
  const { width: w, height: h } = workareaManager;

  let d = '';
  if (isDiode) {
    let offsetX = BeamboxPreference.read('diode_offset_x') ?? Constant.diode.defaultOffsetX;
    let offsetY = BeamboxPreference.read('diode_offset_y') ?? Constant.diode.defaultOffsetY;
    offsetX = Math.max(offsetX, 0);
    offsetY = Math.max(offsetY, 0);
    const limitXL = offsetX * Constant.dpmm;
    const limitYT = offsetY * Constant.dpmm;
    d = `M0,0H${w}V${limitYT}H${limitXL}V${h}H0V0`;
  } else {
    const limitXR = Constant.diode.limitX * Constant.dpmm;
    const limitYB = Constant.diode.limitY * Constant.dpmm;
    d = `M${w},${h}H0,V${h - limitYB}H${w - limitXR}V0H${w}V${h}`;
  }
  diodeBoundaryPath.setAttribute('d', d);
};
const hide = (): void => {
  if (!diodeBoundaryPath) return;
  diodeBoundaryPath.setAttribute('d', '');
};

export default {
  show,
  hide,
  updateCanvasSize,
};
