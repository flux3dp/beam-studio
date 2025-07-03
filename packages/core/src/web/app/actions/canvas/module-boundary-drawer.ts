import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { dpmm, modelsWithModules } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { getModuleBoundary } from '@core/app/constants/layer-module/module-boundary';
import NS from '@core/app/constants/namespaces';
import { getWorkarea, type WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import workareaManager from '@core/app/svgedit/workarea';
import { getAutoFeeder } from '@core/helpers/addOn';
import { getAbsRect } from '@core/helpers/boundary-helper';
import { getModuleOffsets } from '@core/helpers/device/moduleOffsets';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import { hasModuleLayer } from '@core/helpers/layer-module/layer-module-helper';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

let boundarySvg: SVGSVGElement;
let boundaryPath: SVGPathElement;
let boundaryDescText: SVGTextElement;

const createBoundary = () => {
  boundarySvg = document.createElementNS(NS.SVG, 'svg') as unknown as SVGSVGElement;
  boundaryPath = document.createElementNS(NS.SVG, 'path') as unknown as SVGPathElement;
  boundaryDescText = document.createElementNS(NS.SVG, 'text') as unknown as SVGTextElement;
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

const clearBoundary = (): void => {
  boundaryPath?.setAttribute('d', '');
  boundaryDescText?.setAttribute('display', 'none');
};

const updateCanvasSize = (): void => {
  const { height, width } = workareaManager;
  const viewBox = `0 0 ${width} ${height}`;

  boundarySvg?.setAttribute('viewBox', viewBox);
};

canvasEventEmitter.on('canvas-change', updateCanvasSize);

const getBoundary = (
  model: WorkAreaModel,
  module: LayerModuleType,
): { bottom: number; left: number; right: number; top: number } => {
  const [offsetX, offsetY] = getModuleOffsets({ module, workarea: model });
  let { bottom, left, right, top } = getModuleBoundary(model, module);

  left += offsetX;
  right -= offsetX;
  top += offsetY;
  bottom -= offsetY;

  return { bottom, left, right, top };
};

const getUnionBoundary = (
  model: WorkAreaModel,
  currentModule: LayerModuleType,
): { bottom: number; left: number; right: number; top: number } => {
  const { supportedModules } = getWorkarea(model);
  const [offsetX, offsetY] = getModuleOffsets({ module: currentModule, workarea: model });
  let { bottom, left, right, top } = getModuleBoundary(model, currentModule);

  supportedModules?.forEach((module) => {
    if (module !== currentModule && hasModuleLayer([module])) {
      const boundary = getModuleBoundary(model, module);

      bottom = Math.max(bottom, boundary.bottom);
      left = Math.max(left, boundary.left);
      right = Math.max(right, boundary.right);
      top = Math.max(top, boundary.top);
    }
  });

  left += offsetX;
  right -= offsetX;
  top += offsetY;
  bottom -= offsetY;

  return { bottom, left, right, top };
};

const update = ({ unionOnly } = { unionOnly: false }): void => {
  const { expansion, height: h, maxY: workareaBottom, minY: workareaTop, model, width: w } = workareaManager;
  const supportMultiModules = model === 'fbm2';
  const {
    module: { value: module },
  } = useConfigPanelStore.getState();

  if (!supportMultiModules && unionOnly) {
    return;
  }

  if (!modelsWithModules.has(model) || !module) {
    clearBoundary();

    return;
  }

  if (!boundaryPath) {
    createBoundary();
  }

  const viewBox = `0 0 ${w} ${h}`;

  boundarySvg?.setAttribute('viewBox', viewBox);

  const d1 = getAbsRect(0, workareaTop, w, workareaBottom);
  let { bottom, left, right, top } = supportMultiModules ? getUnionBoundary(model, module) : getBoundary(model, module);
  const addOnInfo = getAddOnInfo(model);
  const isRotary = Boolean(BeamboxPreference.read('rotary_mode') && addOnInfo.rotary);
  const isAutoFeeder = getAutoFeeder(addOnInfo);

  if (isRotary || isAutoFeeder) {
    top = 0;
    bottom = 0;
  } else {
    top += expansion[0] / dpmm;
  }

  left = Math.max(left, 0);
  right = Math.max(right, 0);
  top = Math.max(top, 0);
  bottom = Math.max(bottom, 0);

  if (!top && !bottom && !left && !right) {
    clearBoundary();

    return;
  }

  top *= dpmm;
  left *= dpmm;
  bottom *= dpmm;
  right *= dpmm;

  const d2 = getAbsRect(left, workareaTop + top, w - right, workareaBottom - bottom);

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

canvasEventEmitter.on('canvas-change', update);

export default {
  update,
};
