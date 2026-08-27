import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { getRegionPreviewGrid } from '@core/app/constants/fisheyeCameraConstants';
import NS from '@core/app/constants/namespaces';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useDocumentStore } from '@core/app/stores/documentStore';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { PerspectiveGrid } from '@core/interfaces/FisheyePreview';

// Models whose region preview capture footprint is defined by a perspective grid.
const gridPreviewModels = ['fbb2', 'fbm2', 'fhx2rf'];
// Models whose preview only supports full-area capture; no region indicator.
const fullAreaOnlyModels = new Set(['ado1', ...promarkModels]);

let indicatorRect: null | SVGRectElement = null;

const getIndicatorElement = (): null | SVGRectElement => {
  if (indicatorRect?.isConnected) return indicatorRect;

  const fixedSizeSvg = document.getElementById('fixedSizeSvg');

  if (!fixedSizeSvg) return null;

  indicatorRect = document.createElementNS(NS.SVG, 'rect') as SVGRectElement;
  indicatorRect.setAttribute('id', 'previewRegionIndicator');
  indicatorRect.setAttribute('fill', '#1890ff');
  indicatorRect.setAttribute('fill-opacity', '0.1');
  indicatorRect.setAttribute('stroke', '#1890ff');
  indicatorRect.setAttribute('stroke-width', '1');
  indicatorRect.setAttribute('stroke-dasharray', '8 4');
  indicatorRect.setAttribute('vector-effect', 'non-scaling-stroke');
  indicatorRect.setAttribute('pointer-events', 'none');
  indicatorRect.setAttribute('display', 'none');
  fixedSizeSvg.appendChild(indicatorRect);

  return indicatorRect;
};

const hide = (): void => {
  indicatorRect?.setAttribute('display', 'none');
};

interface IndicatorConfig {
  height: number;
  maxCenterX: number;
  maxCenterY: number;
  minCenterX: number;
  minCenterY: number;
  width: number;
}

let config: IndicatorConfig | null = null;

/**
 * Mirrors RegionPreviewMixin.getPreviewPosition: the capture is centered on the click
 * point and the footprint (grid.x/y ranges in mm) is clamped inside the workarea —
 * equivalently, the center stays at least half a footprint away from every edge.
 */
const getGridConfig = (model: WorkAreaModel, grid: PerspectiveGrid): IndicatorConfig => {
  const { dpmm } = constant;
  const { displayHeight, height: origHeight, width: workareaWidth } = getWorkarea(model);
  const workareaHeight = displayHeight ?? origHeight;
  const width = (grid.x[1] - grid.x[0]) * dpmm;
  const height = (grid.y[1] - grid.y[0]) * dpmm;

  return {
    height,
    maxCenterX: workareaWidth * dpmm - width / 2,
    maxCenterY: workareaHeight * dpmm - height / 2,
    minCenterX: width / 2,
    minCenterY: height / 2,
    width,
  };
};

/**
 * Mirrors BeamPreviewManager for legacy Beam Series (offset laser-head camera): the
 * capture is a square of side imgHeight * scaleRatioY / (cos(angle) + sin(angle)),
 * and constrainPreviewXY clamps the *center* (not the footprint, which may overhang
 * the edges). Uses the live calibration when preview is running, ideal camera
 * constants otherwise.
 */
const getBeamConfig = (model: WorkAreaModel): IndicatorConfig => {
  const { camera, dpmm } = constant;
  const offset = previewModeController.previewManager?.getCameraOffset?.() ?? {
    angle: 0,
    scaleRatioY: camera.scaleRatio_ideal,
    x: camera.offsetX_ideal,
    y: camera.offsetY_ideal,
  };
  const side = (camera.imgHeight * offset.scaleRatioY) / (Math.cos(offset.angle) + Math.sin(offset.angle));
  const { pxDisplayHeight, pxHeight, pxWidth } = getWorkarea(model);
  const addOnInfo = getAddOnInfo(model);
  const { borderless, 'enable-diode': enableDiode } = useDocumentStore.getState();
  let maxCenterX = pxWidth;
  let maxCenterY = pxDisplayHeight ?? pxHeight;

  if (enableDiode && addOnInfo.hybridLaser) {
    maxCenterX -= constant.diode.safeDistance.X * dpmm;
    maxCenterY -= constant.diode.safeDistance.Y * dpmm;
  } else if (borderless && addOnInfo.openBottom) {
    maxCenterX -= constant.borderless.safeDistance.X * dpmm;
  }

  return {
    height: side,
    maxCenterX,
    maxCenterY,
    minCenterX: offset.x * dpmm,
    minCenterY: offset.y * dpmm,
    width: side,
  };
};

const updateConfig = (): void => {
  const { isPreviewMode, pendingPreviewMode, previewMode, supportedPreviewModes } = useCameraPreviewStore.getState();
  const mode = pendingPreviewMode ?? previewMode;
  // before preview starts the device is unknown; the workarea has been checked to match it
  const model = (isPreviewMode && previewModeController.currentDevice?.model) || workareaManager.model;

  if ((mode !== PreviewMode.REGION && mode !== PreviewMode.PRECISE_REGION) || fullAreaOnlyModels.has(model)) {
    config = null;
    hide();

    return;
  }

  const isCameraOblique = supportedPreviewModes.includes(PreviewMode.PRECISE_REGION);

  config = gridPreviewModels.includes(model)
    ? getGridConfig(model, getRegionPreviewGrid(model, { isCameraOblique, mode }))
    : getBeamConfig(model);
};

useCameraPreviewStore.subscribe(
  (state) => [state.previewMode, state.pendingPreviewMode, state.isPreviewMode, state.supportedPreviewModes],
  updateConfig,
);
// workarea/model switches don't touch the cameraPreview store; recompute on canvas change.
eventEmitterFactory.createEventEmitter('canvas').on('canvas-change', updateConfig);

/** Show / move the indicator for a hover at (x, y) in canvas px; hides itself when not applicable. */
const update = (x: number, y: number): void => {
  if (!config) {
    hide();

    return;
  }

  const elem = getIndicatorElement();

  if (!elem) return;

  const { height, maxCenterX, maxCenterY, minCenterX, minCenterY, width } = config;
  const centerX = Math.min(Math.max(x, minCenterX), maxCenterX);
  const centerY = Math.min(Math.max(y, minCenterY), maxCenterY);

  elem.setAttribute('x', (centerX - width / 2).toFixed(1));
  elem.setAttribute('y', (centerY - height / 2).toFixed(1));
  elem.setAttribute('width', width.toFixed(1));
  elem.setAttribute('height', height.toFixed(1));
  elem.removeAttribute('display');
};

export default { hide, update };
