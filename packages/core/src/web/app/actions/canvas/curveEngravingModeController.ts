import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import progressCaller from '@core/app/actions/progress-caller';
import { showCurveEngraving, showMeasureArea } from '@core/app/components/dialogs/CurveEngraving';
import { getSupportInfo } from '@core/app/constants/add-on';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import NS from '@core/app/constants/namespaces';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import cursorIconUrl from '@core/app/icons/left-panel/curve-select.svg?url';
import BeamboxPreferenceCommand from '@core/app/svgedit/history/beamboxPreferenceCommand';
import CustomCommand from '@core/app/svgedit/history/CustomCommand';
import { BatchCommand } from '@core/app/svgedit/history/history';
import workareaManager from '@core/app/svgedit/workarea';
import RawModeCurveMeasurer from '@core/helpers/device/curve-measurer/raw';
import RedLightCurveMeasurer from '@core/helpers/device/curve-measurer/red-light';
import getDevice from '@core/helpers/device/get-device';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { CurveMeasurer } from '@core/interfaces/CurveMeasurer';
import type { CurveEngraving, MeasureData } from '@core/interfaces/ICurveEngraving';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

// TODO: add unit tests
class CurveEngravingModeController {
  started: boolean;
  data: CurveEngraving | null;
  boundarySvg?: SVGSVGElement;
  boundaryPath?: SVGPathElement;
  areaPath?: SVGPathElement;
  measurer: CurveMeasurer | null;

  constructor() {
    this.started = false;
    this.data = null;
    this.measurer = null;
    canvasEventEmitter.on('canvas-change', this.updateContainer);
  }

  checkSupport = () => {
    const workarea = beamboxPreference.read('workarea');

    return getSupportInfo(workarea).curveEngraving;
  };

  start = () => {
    if (!this.checkSupport()) {
      return;
    }

    this.started = true;
    this.updateBoundaryPath();
    this.toAreaSelectMode();
    canvasEventEmitter.emit('SET_MODE', CanvasMode.CurveEngraving);
  };

  end = () => {
    this.started = false;
    this.updateBoundaryPath();
  };

  back = (mode: CanvasMode = CanvasMode.Draw) => {
    this.end();
    svgCanvas.setMode('select');

    const workarea: HTMLDivElement | null = document.querySelector('#workarea');

    if (workarea) {
      if (mode === CanvasMode.Preview) {
        workarea.style.cursor = 'url(img/camera-cursor.svg) 9 12, cell';
      } else {
        workarea.style.cursor = 'auto';
      }
    }

    canvasEventEmitter.emit('SET_MODE', mode);
  };

  toAreaSelectMode = () => {
    svgCanvas.setMode('curve-engraving');

    const workarea = document.querySelector('#workarea');

    if (workarea) {
      (workarea as HTMLDivElement).style.cursor = `url(${cursorIconUrl}) 25 7, cell`;
    }
  };

  toCanvasSelectMode = () => {
    svgCanvas.setMode('select');

    const workarea = document.querySelector('#workarea');

    if (workarea) {
      (workarea as HTMLDivElement).style.cursor = 'auto';
    }
  };

  applyRemeasureData = (data: MeasureData) => {
    if (!this.data) {
      return;
    }

    this.data = { ...this.data, ...data };
  };

  initMeasurer = async (): Promise<boolean> => {
    if (this.measurer) {
      await this.clearMeasurer();
    }

    const { device } = await getDevice();

    if (!device) return false;

    const { redLight } = getSupportInfo(device.model);

    if (redLight) {
      this.measurer = new RedLightCurveMeasurer(device);
    } else {
      this.measurer = new RawModeCurveMeasurer(device);
    }

    progressCaller.openNonstopProgress({ id: 'init-measurer' });
    try {
      const setupRes = await this.measurer.setup((text) => progressCaller.update('init-measurer', { message: text }));

      if (!setupRes) {
        return false;
      }

      return true;
    } catch {
      return false;
    } finally {
      progressCaller.popById('init-measurer');
    }
  };

  clearMeasurer = async () => {
    if (!this.measurer) {
      return;
    }

    await this.measurer.end();
    this.measurer = null;
  };

  remeasurePoints = async (indices: number[]): Promise<CurveEngraving | null> => {
    const { lang } = i18n;
    let canceled = false;
    const progressId = 'remeasure-points';

    progressCaller.openSteppingProgress({
      id: progressId,
      message: lang.message.connecting,
      onCancel: () => {
        canceled = true;
      },
    });

    if (canceled) {
      progressCaller.popById(progressId);

      return null;
    }

    try {
      let completedCount = 0;
      const res = await this.measurer!.measurePoints(this.data!, indices, {
        checkCancel: () => canceled,
        onPointFinished: (count) => {
          completedCount = count;
          progressCaller.update(progressId, { percentage: (count / indices.length) * 100 });
        },
        onProgressText: (text) =>
          progressCaller.update(progressId, {
            message: `${lang.curve_engraving.remeasuring_points} ${completedCount}/${indices.length}<br>${text}`,
          }),
      });

      if (!res) {
        return null;
      }

      this.applyRemeasureData(res);

      return this.data;
    } catch {
      return null;
    } finally {
      progressCaller.popById(progressId);
    }
  };

  setArea = async (bbox: { height: number; width: number; x: number; y: number }) => {
    let { height, width, x, y } = bbox;
    const workarea = beamboxPreference.read('workarea');
    const { autoFocusOffset = [0, 0, 0], height: workareaH, width: workareaW } = getWorkarea(workarea);
    const leftBound = autoFocusOffset[0] > 0 ? autoFocusOffset[0] : 0;
    const rightBound = autoFocusOffset[0] < 0 ? workareaW + autoFocusOffset[0] : workareaW;
    const topBound = autoFocusOffset[1] > 0 ? autoFocusOffset[1] : 0;
    const bottomBound = autoFocusOffset[1] < 0 ? workareaH + autoFocusOffset[1] : workareaH;

    if (x < leftBound) {
      width -= leftBound - x;
      x = leftBound;
    }

    if (x + width > rightBound) {
      width = rightBound - x;
    }

    if (y < topBound) {
      height -= topBound - y;
      y = topBound;
    }

    if (y + height > bottomBound) {
      height = bottomBound - y;
    }

    if (width <= 0 || height <= 0) {
      return;
    }

    const newBBox = { height, width, x, y };

    try {
      const initMeasurerRes = await this.initMeasurer();

      if (!initMeasurerRes) {
        alertCaller.popUpError({ message: 'Failed to start curve engraving measurer.' });

        return;
      }

      const res = await showMeasureArea(newBBox, this.measurer!);

      if (!res) {
        return;
      }

      this.data = { bbox, ...res };
      await showCurveEngraving(this.data, this.remeasurePoints);
      this.updateAreaPath();
      canvasEventEmitter.emit('CURVE_ENGRAVING_AREA_SET');
    } finally {
      this.clearMeasurer();
    }
  };

  clearArea = async (showAlert = true) => {
    if (showAlert) {
      const res = await new Promise<boolean>((resolve) =>
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          message: i18n.lang.curve_engraving.sure_to_delete,
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
        }),
      );

      if (!res) {
        return;
      }
    }

    this.data = null;
    this.updateAreaPath();
    canvasEventEmitter.emit('CURVE_ENGRAVING_AREA_SET');
  };

  hasArea = () => Boolean(this.data);

  preview = async () => {
    if (!this.data) {
      return;
    }

    try {
      const initMeasurerRes = await this.initMeasurer();

      if (!initMeasurerRes) {
        alertCaller.popUpError({ message: 'Failed to start curve engraving measurer.' });

        return;
      }

      await showCurveEngraving(this.data, this.remeasurePoints);
    } finally {
      this.clearMeasurer();
    }
  };

  createContainer = () => {
    if (this.boundarySvg) {
      return;
    }

    this.boundarySvg = document.createElementNS(NS.SVG, 'svg') as unknown as SVGSVGElement;
    this.boundarySvg.setAttribute('id', 'curve-engraving-boundary');
    this.boundarySvg.setAttribute('width', '100%');
    this.boundarySvg.setAttribute('height', '100%');

    const { height, width } = workareaManager;

    this.boundarySvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.boundarySvg.setAttribute('style', 'pointer-events:none');
    document.getElementById('canvasBackground')?.appendChild(this.boundarySvg);
  };

  updateContainer = () => {
    if (!this.boundarySvg) {
      return;
    }

    const { height, width } = workareaManager;

    this.boundarySvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.updateBoundaryPath();
    this.updateAreaPath();
  };

  updateBoundaryPath = () => {
    this.createContainer();

    if (!this.started) {
      this.boundaryPath?.setAttribute('d', '');

      return;
    }

    if (!this.boundaryPath) {
      this.boundaryPath = document.createElementNS(NS.SVG, 'path') as SVGPathElement;
      this.boundaryPath.setAttribute('fill', '#CCC');
      this.boundaryPath.setAttribute('fill-opacity', '0.4');
      this.boundaryPath.setAttribute('fill-rule', 'evenodd');
      this.boundaryPath.setAttribute('stroke', 'none');
      this.boundarySvg!.appendChild(this.boundaryPath);
    }

    const workarea = beamboxPreference.read('workarea');
    const { autoFocusOffset = [0, 0, 0], height: workareaH, width: workareaW } = getWorkarea(workarea);
    const { height, width } = workareaManager;
    const { dpmm } = constant;
    const leftBound = (autoFocusOffset[0] > 0 ? autoFocusOffset[0] : 0) * dpmm;
    const rightBound = (autoFocusOffset[0] < 0 ? workareaW + autoFocusOffset[0] : workareaW) * dpmm;
    const topBound = (autoFocusOffset[1] > 0 ? autoFocusOffset[1] : 0) * dpmm;
    const bottomBound = (autoFocusOffset[1] < 0 ? workareaH + autoFocusOffset[1] : workareaH) * dpmm;
    const d1 = `M0,0H${width}V${height}H0V0Z`;
    const d2 = `M${leftBound},${topBound}H${rightBound}V${bottomBound}H${leftBound}V${topBound}Z`;

    this.boundaryPath.setAttribute('d', `${d1} ${d2}`);
  };

  updateAreaPath = () => {
    this.createContainer();

    if (!this.data) {
      this.areaPath?.setAttribute('d', '');

      return;
    }

    if (!this.areaPath) {
      this.areaPath = document.createElementNS(NS.SVG, 'path') as SVGPathElement;
      this.areaPath.setAttribute('fill', '#1890ff');
      this.areaPath.setAttribute('fill-opacity', '0.25');
      this.areaPath.setAttribute('fill-rule', 'evenodd');
      this.areaPath.setAttribute('stroke', '#1890ff');
      this.areaPath.setAttribute('stroke-width', '5');
      this.boundarySvg!.appendChild(this.areaPath);
    }

    const { height, width } = workareaManager;
    let { height: h, width: w, x, y } = this.data.bbox;
    const { dpmm } = constant;

    x *= dpmm;
    y *= dpmm;
    w *= dpmm;
    h *= dpmm;

    const d1 = `M0,0H${width}V${height}H0V0Z`;
    const d2 = `M${x},${y}H${x + w}V${y + h}H${x}V${y}Z`;

    this.areaPath.setAttribute('d', `${d1} ${d2}`);
  };

  // TODO: write exclusive here, add beamboxPreferenceCommand.ts
  loadData = (data: CurveEngraving, opts: { parentCmd?: IBatchCommand } = {}): ICommand | null => {
    if (!this.checkSupport() || !data) {
      return null;
    }

    const origData = this.data;
    const cmd = new BatchCommand('Curve Engraving Load Data');
    const customCmd = new CustomCommand(
      'Curve Engraving Post Load Data',
      () => {
        this.data = data;
      },
      () => {
        this.data = origData;
      },
    );
    const postLoadData = () => {
      this.updateContainer();
      this.updateAreaPath();
      canvasEventEmitter.emit('CURVE_ENGRAVING_AREA_SET');
    };
    const beamboxPreferenceCmds = (['rotary_mode', 'auto-feeder', 'pass-through'] as const).map(
      (key) => new BeamboxPreferenceCommand(key, beamboxPreference.read(key), false),
    );

    customCmd.onAfter = postLoadData;

    beamboxPreferenceCmds.forEach((c) => cmd.addSubCommand(c));
    cmd.addSubCommand(customCmd);

    cmd.apply();
    postLoadData();

    const { parentCmd } = opts;

    if (parentCmd) {
      parentCmd.addSubCommand(cmd);
    }

    return cmd;
  };
}

const curveEngravingModeController = new CurveEngravingModeController();

export default curveEngravingModeController;
