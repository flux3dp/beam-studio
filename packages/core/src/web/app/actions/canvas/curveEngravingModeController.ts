import alertCaller from '@core/app/actions/alert-caller';
import constant from '@core/app/actions/beambox/constant';
import progressCaller from '@core/app/actions/progress-caller';
import { showCurveEngraving, showMeasureArea } from '@core/app/components/dialogs/CurveEngraving';
import {
  preprocessData,
  type ThreeDisplayData,
} from '@core/app/components/dialogs/CurveEngraving/utils/preprocessData';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import NS from '@core/app/constants/namespaces';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { setCurveEngravingState } from '@core/app/stores/curveEngravingStore';
import { changeMultipleDocumentStoreValues } from '@core/app/stores/documentStore';
import CustomCommand from '@core/app/svgedit/history/CustomCommand';
import { BatchCommand } from '@core/app/svgedit/history/history';
import workareaManager from '@core/app/svgedit/workarea';
import { getAbsRect, getRelRect } from '@core/helpers/boundary-helper';
import RawModeCurveMeasurer from '@core/helpers/device/curve-measurer/raw';
import RedLightCurveMeasurer from '@core/helpers/device/curve-measurer/red-light';
import getDevice from '@core/helpers/device/get-device';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import type { CurveMeasurer } from '@core/interfaces/CurveMeasurer';
import type { CurveEngraving, MeasureData, Point } from '@core/interfaces/ICurveEngraving';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

// TODO: add unit tests
class CurveEngravingModeController {
  started: boolean;
  data: CurveEngraving | null;
  displayData: null | ThreeDisplayData;
  boundarySvg?: SVGSVGElement;
  boundaryPath?: SVGPathElement;
  areaPath?: SVGPathElement;
  measurer: CurveMeasurer | null;

  constructor() {
    this.started = false;
    this.data = null;
    this.displayData = null;
    this.measurer = null;
    canvasEventEmitter.on('canvas-change', this.updateContainer);
    useCanvasStore.subscribe(
      (state) => state.mode,
      (mode) => {
        if (mode !== CanvasMode.CurveEngraving && this.started) {
          this.end();
        }
      },
    );
  }

  checkSupport = () => {
    const workarea = workareaManager.model;

    return getAddOnInfo(workarea).curveEngraving;
  };

  start = () => {
    if (!this.checkSupport()) {
      return;
    }

    this.started = true;
    this.updateBoundaryPath();
    this.toAreaSelectMode();
    useCanvasStore.getState().setMode(CanvasMode.CurveEngraving);
  };

  end = () => {
    this.started = false;
    this.updateBoundaryPath();
  };

  back = (mode: CanvasMode = CanvasMode.Draw) => {
    this.end();
    setMouseMode('select');
    useCanvasStore.getState().setMode(mode);
  };

  toAreaSelectMode = () => {
    setMouseMode('curve-engraving');
  };

  toCanvasSelectMode = () => {
    setMouseMode('select');
  };

  applyRemeasureData = (data: MeasureData) => {
    if (!this.data) {
      return;
    }

    this.data = { ...this.data, ...data, subdividedPoints: undefined };
    this.handleDataChange();
  };

  initMeasurer = async (): Promise<boolean> => {
    if (this.measurer) {
      await this.clearMeasurer();
    }

    const { device } = await getDevice();

    if (!device) return false;

    const { redLight } = getAddOnInfo(device.model);

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
    const workarea = workareaManager.model;
    const {
      autoFocusOffset: [offsetX, offsetY] = [0, 0, 0],
      height: workareaH,
      width: workareaW,
    } = getWorkarea(workarea);
    const leftBound = Math.max(offsetX, 0);
    const rightBound = workareaW + Math.min(offsetX, 0);
    const topBound = Math.max(offsetY, 0);
    const bottomBound = workareaH + Math.min(offsetY, 0);

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

      this.data = { bbox, ...res, subdividedPoints: undefined };
      this.handleDataChange();

      await showCurveEngraving();
      this.updateAreaPath();
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
    this.displayData = null;
    this.updateAreaPath();
    setCurveEngravingState({ hasData: false, maxAngle: 0 });
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

      await showCurveEngraving();
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

    if (!this.checkSupport()) {
      this.clearArea(false);

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

    const workarea = workareaManager.model;
    const {
      autoFocusOffset: [offsetX, offsetY] = [0, 0, 0],
      height: workareaH,
      width: workareaW,
    } = getWorkarea(workarea);
    const { maxY, minY, width } = workareaManager;
    const { dpmm } = constant;
    const leftBound = Math.max(offsetX, 0) * dpmm;
    const rightBound = (workareaW + Math.min(offsetX, 0)) * dpmm;
    const topBound = Math.max(offsetY, 0) * dpmm;
    const bottomBound = (workareaH + Math.min(offsetY, 0)) * dpmm;
    const d1 = getAbsRect(0, minY, width, maxY);
    const d2 = getAbsRect(leftBound, topBound, rightBound, bottomBound);

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

    const { height, minY, width } = workareaManager;
    let { height: h, width: w, x, y } = this.data.bbox;
    const { dpmm } = constant;

    x *= dpmm;
    y *= dpmm;
    w *= dpmm;
    h *= dpmm;

    const d1 = getRelRect(0, minY, width, height);
    const d2 = getRelRect(x, y, w, h);

    this.areaPath.setAttribute('d', `${d1} ${d2}`);
  };

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
      this.handleDataChange();
      this.updateContainer();
      this.updateAreaPath();
    };

    customCmd.onAfter = postLoadData;
    changeMultipleDocumentStoreValues(
      { 'auto-feeder': false, 'pass-through': false, rotary_mode: false },
      { parentCmd: cmd },
    );
    cmd.addSubCommand(customCmd);

    cmd.apply();
    postLoadData();

    const { parentCmd } = opts;

    if (parentCmd) {
      parentCmd.addSubCommand(cmd);
    }

    return cmd;
  };

  handleDataChange = () => {
    if (!this.data) {
      this.displayData = null;
      setCurveEngravingState({ hasData: false, maxAngle: 0 });

      return;
    }

    const { displayData, maxAngle, subdividedPoints } = preprocessData(this.data);

    this.displayData = displayData;
    this.data.subdividedPoints = subdividedPoints;
    setCurveEngravingState({ hasData: true, maxAngle });
  };

  /**
   * Use for testing purpose only
   */
  generateTestData = () => {
    const generateData = (): CurveEngraving => {
      const bbox = { height: 100, width: 100, x: 0, y: 0 };
      const gap = 20;
      let highest: null | number = null;
      let lowest: null | number = null;
      const points: CurveEngraving['points'] = [];

      for (let i = bbox.x; i <= bbox.width; i += gap) {
        const currentRow: Point[] = [];

        for (let j = bbox.y; j <= bbox.height; j += gap) {
          const value = Math.random() * 20;

          if (highest === null || value > highest) {
            highest = value;
          }

          if (lowest === null || value < lowest) {
            lowest = value;
          }

          currentRow.push([i, j, value, 1, 1]);
        }

        points.push(currentRow);
      }

      return {
        bbox,
        errors: [],
        gap: [gap, gap],
        highest,
        lowest,
        objectHeight: highest !== null ? highest + 10 : 0,
        points,
      };
    };

    this.data = generateData();
    this.handleDataChange();
    this.updateContainer();
    this.updateAreaPath();
  };
}

const curveEngravingModeController = new CurveEngravingModeController();

export default curveEngravingModeController;
