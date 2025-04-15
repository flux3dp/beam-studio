import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { modelsWithModules } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import moduleBoundary from '@core/app/constants/layer-module/module-boundary';
import workareaManager from '@core/app/svgedit/workarea';
import { getAutoFeeder } from '@core/helpers/addOn';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';

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

  const { height, width } = workareaManager;

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
  const { height, width } = workareaManager;
  const viewBox = `0 0 ${width} ${height}`;

  boundarySvg?.setAttribute('viewBox', viewBox);
};

canvasEventEmitter.on('canvas-change', updateCanvasSize);

const update = (module: LayerModuleType): void => {
  const { expansion, height: h, model, width: w } = workareaManager;

  if (!modelsWithModules.has(model)) {
    boundaryPath?.setAttribute('d', '');
    boundaryDescText?.setAttribute('display', 'none');

    return;
  }

  if (!boundaryPath) {
    createBoundary();
  }

  const viewBox = `0 0 ${w} ${h}`;

  boundarySvg?.setAttribute('viewBox', viewBox);

  const [workareaTop, workareaBottom] = [expansion[0], h - expansion[1]];

  const d1 = `M0,${workareaTop}H${w}V${workareaBottom}H0V${workareaTop}`;
  const { dpmm } = constant;
  let { bottom, left, right, top } = moduleBoundary[module] || { bottom: 0, left: 0, right: 0, top: 0 };
  const offsets = structuredClone(BeamboxPreference.read('module-offsets'));
  const [offsetX, offsetY] = offsets[module] || [0, 0];

  if (module === LayerModule.PRINTER && offsetY < 0) {
    top = Math.max(top + offsetY, 0);
  }

  if (offsetX >= 0) {
    left = Math.max(left, offsetX);
  } else {
    right = Math.max(right, -offsetX);
  }

  const addOnInfo = getAddOnInfo(model);
  const isRotary = Boolean(BeamboxPreference.read('rotary_mode') && addOnInfo.rotary);
  const isAutoFeeder = getAutoFeeder(addOnInfo);

  if (offsetY >= 0) {
    top = Math.max(top, offsetY);
    bottom -= offsetY;
  } else {
    bottom = Math.max(bottom, -offsetY);
  }

  if (isRotary || isAutoFeeder) {
    top = 0;
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

  const d2 = `M${left},${workareaTop + top}H${w - right}V${workareaBottom - bottom}H${left}V${workareaTop + top}`;

  boundaryPath?.setAttribute('d', `${d1} ${d2}`);
  boundaryDescText?.removeAttribute('display');

  if (top >= bottom) {
    boundaryDescText?.setAttribute('x', `${top / 2 - 40}`);
    boundaryDescText?.setAttribute('y', `${workareaTop + top / 2 + 40} `);
  } else {
    boundaryDescText?.setAttribute('x', `${bottom / 2 - 40}`);
    boundaryDescText?.setAttribute('y', `${workareaBottom - bottom / 2 + 40}`);
  }
};

export default {
  update,
};
