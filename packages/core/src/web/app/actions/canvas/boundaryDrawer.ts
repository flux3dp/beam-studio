import { funnel } from 'remeda';
import { shallow } from 'zustand/shallow';

import constant, { dpmm } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { getModuleBoundary } from '@core/app/constants/layer-module/module-boundary';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
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
import { getGalvoConfig, isGalvoModule } from '@core/helpers/device/galvoConfig';
// Side effect: registers the listener that turns a HEXA II's reported travel into the module
// boundary this file draws. DEVELOPMENT ONLY, and the listener itself does nothing unless
// fhx2galvo-dev is set -- see that file.
import '@core/helpers/device/galvoWorkRange';
import { getGantryTravelBoundary } from '@core/helpers/device/gantryTravelRange';
import { getModuleOffsets } from '@core/helpers/device/moduleOffsets';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const printerHeight = 12.7; // mm
const keys = ['autoFeeder', 'passThrough', 'openBottom', 'diode', 'module', 'uvPrint'] as const;

type BoundaryKey = (typeof keys)[number];

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

export class BoundaryDrawer {
  private static instance: BoundaryDrawer;

  private container: SVGSVGElement;
  private boundary: SVGPathElement;
  private text: SVGTextElement;

  private appended = false;

  private useRealBoundary: boolean;
  private supportMultiModules = false;

  /**
   * HEXA II decides this per document, in Document Settings; every other machine follows the
   * global preference. Read on demand rather than cached, so the two sources cannot drift.
   */
  private get useUnionBoundary(): boolean {
    const documentState = useDocumentStore.getState();

    if (documentState.workarea === 'fhx2galvo') return documentState['use-union-boundary-hx2'];

    return useGlobalPreferenceStore.getState()['use-union-boundary'];
  }

  /**
   * Boundaries in px. Top expansion is not included.
   */
  public boundaries: Partial<Record<BoundaryKey, TBoundary>> = {};
  private changedKeys: Set<BoundaryKey> = new Set();

  private constructor() {
    const globalPreference = useGlobalPreferenceStore.getState();

    this.useRealBoundary = globalPreference['use-real-boundary'];
    this.container = createBoundaryContainer('workarea-boundary');
    this.boundary = createBoundaryPath('boundary-path', this.container, !this.useRealBoundary);
    this.text = createBoundaryText(this.container);
  }

  static getInstance(): BoundaryDrawer {
    return (BoundaryDrawer.instance ??= new BoundaryDrawer());
  }

  checkMouseTarget = (target: Element): boolean => target.id === 'boundary-path';

  registerEvents = () => {
    const onCanvasChange = () => {
      this.supportMultiModules = Boolean(getAddOnInfo(workareaManager.model).multiModules);
      this.changedKeys = new Set(keys);
      this.update();
    };

    const onModuleChange = () => {
      this.changedKeys.add('module');
      this.changedKeys.add('uvPrint');
      this.update();
    };

    const onSupportedModulesChange = () => {
      if (this.supportMultiModules) {
        this.changedKeys.add('module');
        this.update();
      }
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

    const onGlobalPreferenceChange = () => {
      const globalPreference = useGlobalPreferenceStore.getState();

      this.useRealBoundary = globalPreference['use-real-boundary'];
      this.boundary.setAttribute('stroke', !this.useRealBoundary ? '#000' : '');
      this.update();
    };

    useDocumentStore.subscribe((state) => state['auto-feeder'], onAutoFeederChange);
    useDocumentStore.subscribe((state) => state['pass-through'], onPassThroughChange);
    useDocumentStore.subscribe((state) => state['borderless'], onBorderlessChange);
    useDocumentStore.subscribe((state) => state['enable-diode'], onEnableDiodeChange);
    useDocumentStore.subscribe(
      (state) => [state['enable-4c'], state['enable-1064'], state['enable-galvo-mopa']],
      onSupportedModulesChange,
      { equalityFn: shallow },
    );
    useDocumentStore.subscribe(
      (state) => state['use-union-boundary-hx2'],
      () => this.update(),
    );
    useGlobalPreferenceStore.subscribe((state) => [state['diode_offset_x'], state['diode_offset_y']], onDiodeChange, {
      equalityFn: shallow,
    });
    useGlobalPreferenceStore.subscribe(
      (state) => [state['use-real-boundary'], state['use-union-boundary']],
      onGlobalPreferenceChange,
      { equalityFn: shallow },
    );
    canvasEventEmitter.on('canvas-change', onCanvasChange);
    useConfigPanelStore.subscribe((state) => state.diode.value, onDiodeChange);
    useConfigPanelStore.subscribe((state) => state.module.value, onModuleChange);
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
    const enabled = useDocumentStore.getState()['borderless'];
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
    const isDiodeEnabled = useDocumentStore.getState()['enable-diode'] && addOnInfo.hybridLaser;

    if (!isDiodeEnabled) {
      this.boundaries.diode = undefined;

      return;
    }

    this.boundaries.diode = { bottom: 0, left: 0, right: 0, top: 0 };

    if (diode) {
      const { diode_offset_x: x, diode_offset_y: y } = useGlobalPreferenceStore.getState();

      // Moving boundary + Module offsets
      this.boundaries.diode.left = x * dpmm;
      this.boundaries.diode.top = y * dpmm;
    } else {
      // Moving boundary with diode addon
      this.boundaries.diode.right = constant.diode.limitX * dpmm;
      this.boundaries.diode.bottom = constant.diode.limitY * dpmm;
    }
  };

  updateModuleBoundary = (currentModule: LayerModuleType): void => {
    const { model } = workareaManager;
    // A machine that can hold several heads loses the travel every one of them costs, whichever
    // this job uses -- the same union the exporter sends and the travel clamps read, taken from the
    // one place that defines it. A machine that holds one head at a time only loses that head's.
    const boundary = this.supportMultiModules
      ? getGantryTravelBoundary(model)
      : getModuleBoundary(model, currentModule);

    this.boundaries.module = {
      bottom: boundary.bottom * dpmm,
      left: boundary.left * dpmm,
      right: boundary.right * dpmm,
      top: boundary.top * dpmm,
    };
  };

  /**
   * How far one module's reach falls short of the gantry's, per edge, in mm.
   *
   * A galvo head is the odd one out: it marks a square centred on wherever it sits, so from any
   * one position it already reaches half a field in every direction. That buys back part of what
   * its own offset costs -- never more than the canvas, which the clamp at the end of
   * updateFinalBoundary takes care of.
   */
  private getModuleReach = async (module: LayerModuleType, model: WorkAreaModel) => {
    const offsets = await getModuleOffsets({ module, workarea: model });

    const [offsetX, offsetY] = offsets;
    const halfField = isGalvoModule(module) ? (await getGalvoConfig(module)).workarea / 2 : 0;
    const inset: TBoundary = {
      bottom: -offsetY - (printingModules.has(module) ? printerHeight : 0) - halfField,
      left: offsetX - halfField,
      right: -offsetX - halfField,
      top: offsetY - halfField,
    };

    return { inset, offsets };
  };

  updateFinalBoundary = async (currentModule: LayerModuleType): Promise<void> => {
    const { maxY: workareaBottom, minY: workareaTop, model, width: w } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const isRotary = Boolean(useDocumentStore.getState()['rotary_mode'] && addOnInfo.rotary);
    const isAutoFeeder = getAutoFeeder(addOnInfo);
    const finalBoundary: TBoundary = { bottom: 0, left: 0, right: 0, top: 0 };
    let { bottom, left, right, top } = finalBoundary;
    const {
      inset: unionOffsets,
      // needed on its own below, for the Ador printer's height handling
      offsets: [, offsetY],
    } = await this.getModuleReach(currentModule, model);

    if (this.boundaries.uvPrint) {
      ({ bottom, left, right, top } = this.boundaries.uvPrint);
    } else {
      if (this.supportMultiModules && this.useUnionBoundary) {
        const supportedModules = getSupportedModules(model);

        // Each head is expanded by its own field before the merge: the two galvos may carry
        // different field lenses, so the union has to compare what each can actually reach.
        await Promise.allSettled(
          supportedModules?.map(async (module) => {
            if (module !== currentModule) {
              mergeBoundaries(unionOffsets, (await this.getModuleReach(module, model)).inset);
            }
          }),
        );
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
        top += unionOffsets.top * dpmm;
        bottom += unionOffsets.bottom * dpmm;
      } else {
        // FIXME: Ador printer spec: height 270; Ignoring module offsets in some case to keep workarea height consistent
        const offsetYPx = offsetY * dpmm;

        top += printerHeight * dpmm;

        if (offsetYPx >= 0) {
          top = Math.max(top, offsetYPx);
          bottom -= offsetYPx;
        } else {
          top = Math.max(top + offsetYPx, 0);
          bottom = Math.max(bottom, -offsetYPx);
        }
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
      canvasEventEmitter.emit('boundary-updated', workareaManager.boundary);

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
