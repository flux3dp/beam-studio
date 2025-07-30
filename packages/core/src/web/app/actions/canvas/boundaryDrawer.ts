import { funnel } from 'remeda';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { dpmm } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { getModuleBoundary } from '@core/app/constants/layer-module/module-boundary';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import workareaManager from '@core/app/svgedit/workarea';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import type { TBoundary } from '@core/helpers/boundary-helper';
import {
  createBoundaryContainer,
  createBoundaryPath,
  createBoundaryText,
  getAbsRect,
  getTextPosition,
  mergeBoundaries,
} from '@core/helpers/boundary-helper';
import { getModuleOffsets } from '@core/helpers/device/moduleOffsets';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { hasModuleLayer } from '@core/helpers/layer-module/layer-module-helper';

const printerHeight = 12.7; // mm
const keys = ['autoFeeder', 'passThrough', 'openBottom', 'diode', 'module', 'uvPrint'] as const;

type BoundaryKey = (typeof keys)[number];

const beamboxPreferenceEvents = eventEmitterFactory.createEventEmitter('beambox-preference');
const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

export class BoundaryDrawer {
  private static instance: BoundaryDrawer;

  private container: SVGSVGElement;
  private boundary: SVGPathElement;
  private text: SVGTextElement;

  private appended = false;

  private useRealBoundary: boolean;
  private useUnionBoundary: boolean;
  private supportMultiModules = false;

  /**
   * Boundaries in px. Top expansion is not included.
   */
  public boundaries: Partial<Record<BoundaryKey, TBoundary>> = {};
  private changedKeys: Set<BoundaryKey> = new Set();

  private constructor() {
    this.useRealBoundary = beamboxPreference.read('use-real-boundary');
    this.useUnionBoundary = beamboxPreference.read('use-union-boundary');
    this.container = createBoundaryContainer('workarea-boundary');
    this.boundary = createBoundaryPath('boundary-path', this.container, !this.useRealBoundary);
    this.text = createBoundaryText(this.container);
  }

  static getInstance(): BoundaryDrawer {
    return (BoundaryDrawer.instance ??= new BoundaryDrawer());
  }

  checkMouseTarget = (target: Element): boolean => target.id === 'boundary-path';

  onSkippedLayersChange = () => {
    if (this.supportMultiModules && this.useUnionBoundary) {
      this.changedKeys.add('module');
      this.update();
    }
  };

  registerEvents = () => {
    const onCanvasChange = () => {
      this.supportMultiModules = workareaManager.model === 'fbm2';
      this.changedKeys = new Set(keys);
      this.update();
    };

    const onModuleChange = () => {
      this.changedKeys.add('module');
      this.changedKeys.add('uvPrint');
      this.update();
    };

    const onDiodeChange = () => {
      this.changedKeys.add('diode');
      this.update();
    };

    const onAutoFeederChange = () => {
      this.changedKeys.add('autoFeeder');
      this.update();
    };

    const onPassThroughChange = () => {
      this.changedKeys.add('passThrough');
      this.update();
    };

    const onBorderlessChange = () => {
      this.changedKeys.add('autoFeeder');
      this.changedKeys.add('passThrough');
      this.changedKeys.add('openBottom');
      this.update();
    };

    const onEnableDiodeChange = () => {
      this.changedKeys.add('diode');
      this.update();
    };

    beamboxPreferenceEvents.on('auto-feeder', onAutoFeederChange);
    beamboxPreferenceEvents.on('pass-through', onPassThroughChange);
    beamboxPreferenceEvents.on('borderless', onBorderlessChange);
    beamboxPreferenceEvents.on('enable-diode', onEnableDiodeChange);
    beamboxPreferenceEvents.on('diode_offset_x', onDiodeChange);
    beamboxPreferenceEvents.on('diode_offset_y', onDiodeChange);
    canvasEventEmitter.on('canvas-change', onCanvasChange);
    useConfigPanelStore.subscribe((state) => state.diode.value, onDiodeChange);
    useConfigPanelStore.subscribe((state) => state.module.value, onModuleChange);
    useConfigPanelStore.subscribe(
      (state) => state.repeat,
      (repeat, prev) => {
        if (prev.hasMultiValue || repeat.value === 0 || prev.value === 0) {
          this.onSkippedLayersChange();
        }
      },
    );
  };

  private appendToCanvasBackground = (): void => {
    if (this.appended) return;

    const canvasBackground = document.getElementById('canvasBackground');
    const fixedSizeSvg = document.getElementById('fixedSizeSvg');

    if (canvasBackground && fixedSizeSvg) {
      canvasBackground.insertBefore(this.container, fixedSizeSvg);
      this.appended = true;
    }
  };

  private updateContainerSize = (): void => {
    const { height, width } = workareaManager;
    const viewBox = `0 0 ${width} ${height}`;

    this.container.setAttribute('viewBox', viewBox);
  };

  updateAutoFeederPath = (): void => {
    const { model, width: workareaW } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const { autoFeeder } = addOnInfo;

    if (!getAutoFeeder(addOnInfo)) {
      this.boundaries.autoFeeder = undefined;

      return;
    }

    this.boundaries.autoFeeder = { bottom: 0, left: 0, right: 0, top: autoFeeder?.minY ?? 0 };

    if (autoFeeder?.xRange) {
      const [x, width] = autoFeeder.xRange;

      this.boundaries.autoFeeder.left = x * dpmm;
      this.boundaries.autoFeeder.right = workareaW - (x + width) * dpmm;
    }
  };

  updatePassThroughPath = (): void => {
    const { expansion, model, width: workareaW } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const { passThrough } = addOnInfo;

    if (!getPassThrough(addOnInfo)) {
      this.boundaries.passThrough = undefined;

      return;
    }

    this.boundaries.passThrough = { bottom: expansion[1], left: 0, right: 0, top: 0 };

    if (passThrough?.xRange) {
      const [x, width] = passThrough.xRange;

      this.boundaries.passThrough.left = x * dpmm;
      this.boundaries.passThrough.right = workareaW - (x + width) * dpmm;
    }
  };

  updateOpenBottomBoundary = (): void => {
    const enabled = beamboxPreference.read('borderless');
    const { model } = workareaManager;
    const { openBottom } = getAddOnInfo(model);

    if (!enabled || !openBottom) {
      this.boundaries.openBottom = undefined;

      return;
    }

    const w = constant.borderless.safeDistance.X * dpmm;

    this.boundaries.openBottom = { bottom: 0, left: 0, right: w, top: 0 };
  };

  updateUvPath = (module: LayerModuleType): void => {
    const { maxY, model, width } = workareaManager;
    const supportedModules = getSupportedModules(model);

    if (module !== LayerModule.UV_PRINT || !supportedModules.includes(LayerModule.UV_PRINT)) {
      this.boundaries.uvPrint = undefined;

      return;
    }

    // A4 paper size: 297mm x 210mm
    const x = 297 * dpmm;
    const y = 210 * dpmm;

    this.boundaries.uvPrint = { bottom: maxY - y, left: 0, right: width - x, top: 0 };
  };

  updateDiodeBoundary = (diode: number): void => {
    const { model } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const isDiodeEnabled = beamboxPreference.read('enable-diode') && addOnInfo.hybridLaser;

    if (!isDiodeEnabled) {
      this.boundaries.diode = undefined;

      return;
    }

    this.boundaries.diode = { bottom: 0, left: 0, right: 0, top: 0 };

    if (diode) {
      // Moving boundary + Module offsets
      this.boundaries.diode.left = beamboxPreference.read('diode_offset_x') * dpmm;
      this.boundaries.diode.top = beamboxPreference.read('diode_offset_y') * dpmm;
    } else {
      // Moving boundary with diode addon
      this.boundaries.diode.right = constant.diode.limitX * dpmm;
      this.boundaries.diode.bottom = constant.diode.limitY * dpmm;
    }
  };

  updateModuleBoundary = (currentModule: LayerModuleType): void => {
    const { model } = workareaManager;
    const boundary = getModuleBoundary(model, currentModule);

    if (this.supportMultiModules && this.useUnionBoundary) {
      const supportedModules = getSupportedModules(model);

      supportedModules?.forEach((module) => {
        if (module !== currentModule && hasModuleLayer([module])) {
          mergeBoundaries(boundary, getModuleBoundary(model, module));
        }
      });
    }

    this.boundaries.module = {
      bottom: boundary.bottom * dpmm,
      left: boundary.left * dpmm,
      right: boundary.right * dpmm,
      top: boundary.top * dpmm,
    };
  };

  updateFinalBoundary = (currentModule: LayerModuleType): void => {
    const { maxY: workareaBottom, minY: workareaTop, model, width: w } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const isRotary = Boolean(beamboxPreference.read('rotary_mode') && addOnInfo.rotary);
    const isAutoFeeder = getAutoFeeder(addOnInfo);
    const finalBoundary: TBoundary = { bottom: 0, left: 0, right: 0, top: 0 };
    let { bottom, left, right, top } = finalBoundary;
    const [offsetX, offsetY] = getModuleOffsets({ module: currentModule, workarea: model });
    const unionOffsets = {
      bottom: -offsetY - (printingModules.has(currentModule) ? printerHeight : 0),
      left: offsetX,
      right: -offsetX,
      top: offsetY,
    };

    if (this.boundaries.uvPrint) {
      ({ bottom, left, right, top } = this.boundaries.uvPrint);
    } else {
      if (this.supportMultiModules && this.useUnionBoundary) {
        const supportedModules = getSupportedModules(model);

        supportedModules?.forEach((module) => {
          if (module !== currentModule && hasModuleLayer([module])) {
            const offsets = getModuleOffsets({ module, workarea: model });

            mergeBoundaries(unionOffsets, {
              bottom: -offsets[1] - (printingModules.has(module) ? printerHeight : 0),
              left: offsets[0],
              right: -offsets[0],
              top: offsets[1],
            });
          }
        });
      }

      keys.forEach((key) => {
        mergeBoundaries(finalBoundary, this.boundaries[key]);
      });
      ({ bottom, left, right, top } = finalBoundary);
      left += unionOffsets.left * dpmm;
      right += unionOffsets.right * dpmm;

      if (isRotary || isAutoFeeder) {
        top = this.boundaries.autoFeeder?.top ?? 0;
        bottom = 0;
      } else if (currentModule !== LayerModule.PRINTER) {
        // FIXME: Ador printer spec: height 270; Ignoring module offsets to keep workarea height consistent
        top += unionOffsets.top * dpmm;
        bottom += unionOffsets.bottom * dpmm;
      }

      if (!this.useRealBoundary) {
        const unit = 100;

        // Note: workareaBottom may not be a multiple of 100
        if (bottom > 0) bottom = workareaBottom - Math.floor((workareaBottom - bottom) / unit) * unit;

        left = Math.ceil(left / unit) * unit;
        right = Math.ceil(right / unit) * unit;
        top = Math.ceil(top / unit) * unit;
      }
    }

    bottom = Math.max(bottom, 0);
    left = Math.max(left, 0);
    right = Math.max(right, 0);
    top = Math.max(top - workareaTop, 0);

    if (bottom === 0 && left === 0 && right === 0 && top === 0) {
      this.boundary.setAttribute('d', '');

      return;
    }

    this.boundary.setAttribute(
      'd',
      getAbsRect(0, workareaTop, w, workareaBottom) +
        getAbsRect(left, workareaTop + top, w - right, workareaBottom - bottom),
    );

    workareaManager.boundary.minY = Math.max(workareaTop, workareaTop + top);
    workareaManager.boundary.maxY = Math.min(workareaBottom, workareaBottom - bottom);
    workareaManager.boundary.maxX = Math.min(w, w - right);
    workareaManager.boundary.minX = Math.max(0, left);

    const { rotate, x, y } = getTextPosition(left, top, right, bottom);

    this.text.setAttribute('x', `${x}`);
    this.text.setAttribute('y', `${y}`);

    if (rotate) {
      this.text.setAttribute('transform', `rotate(90 ${x - 20} 0)`);
      this.text.removeAttribute('text-anchor');
    } else {
      this.text.setAttribute('text-anchor', 'middle');
      this.text.removeAttribute('transform');
    }

    canvasEventEmitter.emit('boundary-updated', workareaManager.boundary);
  };

  updateHandler = funnel(
    () => {
      const {
        diode: { value: diode },
        module: { value: module },
      } = useConfigPanelStore.getState();

      this.appendToCanvasBackground();
      this.updateContainerSize();

      if (this.changedKeys.has('autoFeeder')) this.updateAutoFeederPath();

      if (this.changedKeys.has('passThrough')) this.updatePassThroughPath();

      if (this.changedKeys.has('openBottom')) this.updateOpenBottomBoundary();

      if (this.changedKeys.has('uvPrint')) this.updateUvPath(module);

      if (this.changedKeys.has('module')) this.updateModuleBoundary(module);

      if (this.changedKeys.has('diode')) this.updateDiodeBoundary(diode);

      this.changedKeys.clear();
      this.updateFinalBoundary(module);
    },
    { minQuietPeriodMs: 100, triggerAt: 'end' },
  );

  update = () => {
    this.updateHandler.call();
  };
}

export const boundaryDrawer = BoundaryDrawer.getInstance();
