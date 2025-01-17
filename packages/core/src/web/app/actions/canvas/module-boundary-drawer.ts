import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import i18n from 'helpers/i18n';
import moduleBoundary from 'app/constants/layer-module/module-boundary';
import moduleOffsets from 'app/constants/layer-module/module-offsets';
import workareaManager from 'app/svgedit/workarea';
import { getSupportInfo } from 'app/constants/add-on';

const { svgedit } = window;
const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

let boundarySvg: SVGSVGElement;
let boundaryPath: SVGPathElement;
let boundaryDescText: SVGTextElement;

const createBoundary = () => {
  boundarySvg = document.createElementNS(svgedit.NS.SVG, 'svg') as unknown as SVGSVGElement;
  boundaryPath = document.createElementNS(svgedit.NS.SVG, 'path') as unknown as SVGPathElement;
  boundaryDescText = document.createElementNS(svgedit.NS.SVG, 'text') as unknown as SVGTextElement;
  document.getElementById('canvasBackground')?.appendChild(boundarySvg);
  const { width, height } = workareaManager;
  boundarySvg.appendChild(boundaryPath);
  boundarySvg.appendChild(boundaryDescText);
  boundarySvg.setAttribute('id', 'module-boundary');
  boundarySvg.setAttribute('x', '0');
  boundarySvg.setAttribute('y', '0');
  boundarySvg.setAttribute('width', '100%');
  boundarySvg.setAttribute('height', '100%');
  boundarySvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  boundarySvg.setAttribute('style', 'pointer-events:none');

  boundaryPath.setAttribute('fill', '#CCC');
  boundaryPath.setAttribute('fill-opacity', '0.4');
  boundaryPath.setAttribute('fill-rule', 'evenodd');
  boundaryPath.setAttribute('stroke', 'none');
  boundaryPath.setAttribute('style', 'pointer-events:none');

  boundaryDescText.setAttribute('font-size', '80');
  boundaryDescText.setAttribute('font-weight', 'bold');
  boundaryDescText.setAttribute('fill', '#999');
  boundaryDescText.setAttribute('stroke', 'none');
  boundaryDescText.setAttribute('paint-order', 'stroke');
  boundaryDescText.setAttribute('style', 'pointer-events:none');
  const textNode = document.createTextNode(i18n.lang.layer_module.non_working_area);
  boundaryDescText.appendChild(textNode);
};

const updateCanvasSize = (): void => {
  const { width, height } = workareaManager;
  const viewBox = `0 0 ${width} ${height}`;
  boundarySvg?.setAttribute('viewBox', viewBox);
};
canvasEventEmitter.on('canvas-change', updateCanvasSize);

const update = (module: LayerModule): void => {
  const { width: w, height: h, expansion, model } = workareaManager;
  if (!modelsWithModules.has(model)) {
    boundaryPath?.setAttribute('d', '');
    boundaryDescText?.setAttribute('display', 'none');
    return;
  }
  if (!boundaryPath) createBoundary();
  const viewBox = `0 0 ${w} ${h}`;
  boundarySvg?.setAttribute('viewBox', viewBox);
  const d1 = `M0,0H${w}V${h}H0V0`;
  const { dpmm } = constant;
  let { top, left, bottom, right } = moduleBoundary[module] || { top: 0, left: 0, bottom: 0, right: 0 };
  const offsets = { ...moduleOffsets, ...BeamboxPreference.read('module-offsets') };
  const [offsetX, offsetY] = offsets[module] || [0, 0];
  if (module === LayerModule.PRINTER && offsetY < 0) top = Math.max(top + offsetY, 0);
  if (offsetX >= 0) left = Math.max(left, offsetX);
  else right = Math.max(right, -offsetX);
  const rotaryMode = BeamboxPreference.read('rotary_mode');
  if (offsetY >= 0) {
    top = Math.max(top, offsetY);
    bottom -= offsetY;
  } else bottom = Math.max(bottom, -offsetY);
  if (rotaryMode) {
    top = 0;
    bottom = 0;
  } else if (BeamboxPreference.read('pass-through') && getSupportInfo(model).passThrough) {
    bottom = 0;
  }
  bottom = Math.max(bottom, 0);
  if (!top && !bottom && !left && !right) {
    boundaryPath?.setAttribute('d', '');
    boundaryDescText?.setAttribute('display', 'none');
    return;
  }
  top *= dpmm;
  left *= dpmm;
  bottom *= dpmm;
  right *= dpmm;
  const d2 = `M${left},${top}H${w - right}V${h - bottom}H${left}V${top}`;
  boundaryPath?.setAttribute('d', `${d1} ${d2}`);
  boundaryDescText?.removeAttribute('display');
  if (top >= bottom) {
    boundaryDescText?.setAttribute('x', `${top / 2 - 40}`);
    boundaryDescText?.setAttribute('y', `${top / 2 + 40} `);
  } else {
    boundaryDescText?.setAttribute('x', `${bottom / 2 - 40}`);
    boundaryDescText?.setAttribute('y', `${h - bottom / 2 + 40}`);
  }
};

export default {
  update,
};
