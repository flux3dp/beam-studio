import { EventEmitter } from 'eventemitter3';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import constant, { dpmm, promarkModels } from '@core/app/actions/beambox/constant';
import exportFuncs from '@core/app/actions/beambox/export-funcs';
import { fetchFramingTaskCode } from '@core/app/actions/beambox/export-funcs-swiftray';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';
import deviceConstants from '@core/app/constants/device-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import { getAutoFeeder } from '@core/helpers/addOn';
import type { RotaryInfo } from '@core/helpers/addOn/rotary';
import { getRotaryInfo } from '@core/helpers/addOn/rotary';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import getUtilWS from '@core/helpers/api/utils-ws';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import getJobOrigin from '@core/helpers/job-origin';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';
import monitorStatus from '@core/helpers/monitor-status';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import { convertVariableText, hasVariableText } from '@core/helpers/variableText';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { PromarkStore } from '@core/interfaces/Promark';

import applyRedDot from './promark/apply-red-dot';
import promarkDataStore from './promark/promark-data-store';

// TODO: add unit test
export const FramingType = {
  AreaCheck: 1,
  Contour: 6,
  Framing: 2,
  Hull: 3,
  RotateAxis: 4,
  RotateFraming: 5,
} as const;

export type TFramingType = (typeof FramingType)[keyof typeof FramingType];

type Coordinates = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

type Task = { isOutOfBounds?: boolean; points: Array<[number, number]> };

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const framingOptions = {
  [FramingType.AreaCheck]: {
    description: 'areacheck_desc',
    title: 'area_check',
  },
  [FramingType.Contour]: {
    description: 'contour_desc',
    title: 'contour',
  },
  [FramingType.Framing]: {
    description: 'framing_desc',
    title: 'framing',
  },
  [FramingType.Hull]: {
    description: 'hull_desc',
    title: 'hull',
  },
  [FramingType.RotateAxis]: {
    description: 'rotateaxis_desc',
    title: 'rotate_axis',
  },
  [FramingType.RotateFraming]: {
    description: 'rotation_framing_desc',
    title: 'framing',
  },
} as const;

export const getFramingOptions = (device: IDeviceInfo): TFramingType[] => {
  if (promarkModels.has(device.model)) {
    const withRotary = Boolean(useDocumentStore.getState().rotary_mode && getAddOnInfo(device.model).rotary);

    if (withRotary) return [FramingType.RotateAxis, FramingType.RotateFraming];

    return [FramingType.Framing, FramingType.Hull, FramingType.Contour];
  }

  return [FramingType.Framing, FramingType.Hull, FramingType.AreaCheck];
};

const getCoords = async (mm?: boolean): Promise<Coordinates> => {
  const revertVariableText = await convertVariableText();
  const coords: Partial<Coordinates> = {
    maxX: undefined,
    maxY: undefined,
    minX: undefined,
    minY: undefined,
  };
  const { maxY: workareaMaxY, minY: workareaMinY, width: workareaWidth } = workareaManager;
  const allLayers = getAllLayers();
  const { dpmm } = constant;

  allLayers.forEach((layer) => {
    if (layer.getAttribute('display') === 'none') {
      return;
    }

    if (getData(layer, 'repeat') === 0) {
      return;
    }

    const bboxs = svgCanvas.getVisibleElementsAndBBoxes([layer]);

    bboxs.forEach(({ bbox, elem }) => {
      const { height, width, x, y } = bbox;
      const right = x + width;
      const bottom = y + height;

      if (
        right < 0 ||
        bottom < workareaMinY ||
        x > workareaWidth ||
        y > workareaMaxY ||
        (width === 0 && height === 0 && elem.tagName === 'g')
      ) {
        return;
      }

      if (coords.minX === undefined || x < coords.minX) {
        coords.minX = x;
      }

      if (coords.minY === undefined || y < coords.minY) {
        coords.minY = y;
      }

      if (coords.maxX === undefined || right > coords.maxX) {
        coords.maxX = right;
      }

      if (coords.maxY === undefined || bottom > coords.maxY) {
        coords.maxY = bottom;
      }
    });
  });

  if (coords.minX !== undefined) {
    const ratio = mm ? dpmm : 1;

    coords.minX = Math.max(coords.minX ?? 0, 0) / ratio;
    coords.minY = Math.max(coords.minY ?? workareaMinY, workareaMinY) / ratio;
    coords.maxX = Math.min(coords.maxX ?? workareaWidth, workareaWidth) / ratio;
    coords.maxY = Math.min(coords.maxY ?? workareaMaxY, workareaMaxY) / ratio;
  }

  revertVariableText?.();

  return coords as Coordinates;
};

const getCanvasImage = async (negative = false): Promise<Blob | null> => {
  const { maxY, minY, width } = workareaManager;

  if (negative && minY >= 0) return null;

  symbolMaker.switchImageSymbolForAll(false);

  const allLayers = getAllLayers()
    .filter((layer) => getData(layer, 'repeat')! > 0)
    .map((layer) => layer.cloneNode(true) as SVGGElement);

  symbolMaker.switchImageSymbolForAll(true);
  allLayers.forEach((layer) => {
    const images = layer.querySelectorAll('image');

    images.forEach((image) => {
      const x = image.getAttribute('x');
      const y = image.getAttribute('y');
      const width = image.getAttribute('width');
      const height = image.getAttribute('height');
      const transform = image.getAttribute('transform');
      const rect = document.createElementNS(NS.SVG, 'rect');

      if (x) rect.setAttribute('x', x);

      if (y) rect.setAttribute('y', y);

      if (width) rect.setAttribute('width', width);

      if (height) rect.setAttribute('height', height);

      if (transform) rect.setAttribute('transform', transform);

      image.replaceWith(rect);
    });
  });

  const svgDefs = findDefs();
  const height = negative ? -minY : maxY;
  const y = negative ? minY : 0;
  const svgString = `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 ${y} ${width} ${height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${svgDefs.outerHTML}
      ${allLayers.map((layer) => layer.outerHTML).join('')}
    </svg>`;
  const canvas = await svgStringToCanvas(svgString, width, height);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
};

const getConvexHull = async (imgBlob: Blob): Promise<Array<[number, number]>> => getUtilWS().getConvexHull(imgBlob);

const getAreaCheckTask = async (
  device: IDeviceInfo,
  jobOrigin: null | undefined | { x: number; y: number },
): Promise<Array<[number, number]>> => {
  try {
    const metadata = await exportFuncs.getMetadata(device);

    if (metadata?.max_x) {
      // compensate job origin
      const { x = 0, y = 0 } = jobOrigin || {};
      const minX = Number.parseFloat(metadata.min_x) + x;
      const minY = Number.parseFloat(metadata.min_y) + y;
      const maxX = Number.parseFloat(metadata.max_x) + x;
      const maxY = Number.parseFloat(metadata.max_y) + y;
      const res: Array<[number, number]> = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ];

      return res;
    }

    return [];
  } catch (err) {
    console.error('Failed to get task metadata', err);

    return [];
  }
};

class FramingTaskManager extends EventEmitter {
  private device: IDeviceInfo;
  private messageKey: string;
  private addOnInfo: AddOnInfo;
  private isAdor = false;
  private isFcodeV2 = false;
  private isPromark = false;
  private isProcessing = false;
  private isBeamo2 = false;
  private isWorking = false;
  private interrupted = false;
  private rotaryInfo: RotaryInfo = null;
  private enabledInfo: {
    '24v': boolean;
    lineCheckMode: boolean;
    rotary: boolean;
  } = {
    '24v': false,
    lineCheckMode: false,
    rotary: false,
  };
  private jobOrigin?: null | { x: number; y: number } = undefined; // x, y in mm
  private vc: ReturnType<typeof versionChecker>;
  private curPos: { a: number; x: number; y: number } = { a: 0, x: 0, y: 0 };
  private movementFeedrate = 6000; // mm/min
  private lowPower = 0;
  private taskCache: { [type in TFramingType]?: Task } = {};
  private taskCodeCache: { [type in TFramingType]?: string } = {};
  private taskPoints: Array<[number, number]> = [];
  private hasAppliedRedLight = false;
  private initialized = false;
  private withVT = false;
  private shouldCheckDoor = false;

  constructor(device: IDeviceInfo, messageKey = 'framing-task') {
    super();
    this.device = device;
    this.messageKey = messageKey;
    this.addOnInfo = getAddOnInfo(this.device.model);
    this.resetEnabledInfo();
    this.vc = versionChecker(device.version);
    this.isAdor = constant.adorModels.includes(device.model);
    this.isPromark = promarkModels.has(device.model);
    this.isBeamo2 = device.model === 'fbm2';
    this.isFcodeV2 = constant.fcodeV2Models.has(device.model);
    this.withVT = hasVariableText();
  }

  private calculateJobOrigin = async (): Promise<void> => {
    if (this.jobOrigin === undefined) {
      if (
        useDocumentStore.getState()['enable-job-origin'] &&
        this.addOnInfo.jobOrigin &&
        this.vc.meetRequirement(this.isAdor ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN')
      ) {
        this.jobOrigin = await getJobOrigin();
      } else {
        this.jobOrigin = null;
      }

      this.rotaryInfo = getRotaryInfo(this.device.model, { axisInMm: true, forceY: this.jobOrigin?.y });
    }
  };

  private resetEnabledInfo = () => {
    this.enabledInfo = {
      '24v': false,
      lineCheckMode: false,
      rotary: false,
    };
  };

  private changeWorkingStatus = (status: boolean): void => {
    this.isWorking = status;
    this.emit('status-change', status);
  };

  private onSwiftrayDisconnected = (): void => {
    this.changeWorkingStatus(false);
  };

  public startPromarkFraming = async (noRotation: boolean, taskCode?: string): Promise<boolean> => {
    if (this.interrupted) {
      return false;
    }

    swiftrayClient.on('disconnected', this.onSwiftrayDisconnected);

    if (this.isWorking) {
      return false;
    }

    if (this.rotaryInfo && !noRotation && !swiftrayClient.checkVersion('PROMARK_ROTARY')) {
      return false;
    }

    this.changeWorkingStatus(true);

    const deviceStatus = await checkDeviceStatus(this.device);

    if (!deviceStatus) {
      this.changeWorkingStatus(false);

      return false;
    }

    if (!this.hasAppliedRedLight) {
      this.showMessage(i18n.lang.message.connecting);

      const { field, galvoParameters, redDot } = promarkDataStore.get(this.device?.serial) as PromarkStore;

      if (redDot) {
        const { field: newField, galvoParameters: newGalvo } = applyRedDot(redDot, field!, galvoParameters!);
        const { width } = getWorkarea(this.device.model);

        await deviceMaster.setField(width, newField);
        await deviceMaster.setGalvoParameters(newGalvo);
      }

      this.hasAppliedRedLight = true;
    }

    if (this.interrupted) {
      return false;
    }

    if (taskCode) {
      await deviceMaster.startFraming({ taskCode });
    } else {
      this.showMessage(i18n.lang.framing.calculating_task, 0);
      await deviceMaster.startFraming({
        points: [this.taskPoints[0], this.taskPoints[2]],
        rotaryInfo: noRotation ? null : this.rotaryInfo,
      });
    }

    if (this.rotaryInfo && !noRotation) {
      let initializing = true;
      // No loop, need check finish status
      const timer = setInterval(async () => {
        if (this.isWorking) {
          const report = await deviceMaster.getReport();

          // RotateFraming may take more time to start, show calculating message util it is running (max 5s)
          if (initializing && report.st_id === deviceConstants.status.RUNNING) {
            initializing = false;
            this.closeMessage();
          }

          if (monitorStatus.isAbortedOrCompleted(report)) {
            this.closeMessage();
            this.changeWorkingStatus(false);
            clearInterval(timer);
          }
        } else {
          clearInterval(timer);
        }
      }, 1000);

      setTimeout(() => this.closeMessage(), 5000);
    } else {
      setTimeout(() => this.closeMessage(), 1000);
    }

    return true;
  };

  public stopPromarkFraming = async (): Promise<void> => {
    swiftrayClient.off('disconnected', this.onSwiftrayDisconnected);

    if (!this.isWorking) {
      return;
    }

    await deviceMaster.stopFraming();
    this.changeWorkingStatus(false);
    this.interrupted = true;
  };

  public resetPromarkParams = async (): Promise<void> => {
    if (this.hasAppliedRedLight) {
      const { field, galvoParameters, redDot } = promarkDataStore.get(this.device?.serial) as PromarkStore;

      if (redDot) {
        const { width } = getWorkarea(this.device.model);

        await deviceMaster.setField(width, field);

        if (galvoParameters) await deviceMaster.setGalvoParameters(galvoParameters);
      }

      this.hasAppliedRedLight = false;
    }
  };

  private moveTo = async ({
    a,
    f = this.movementFeedrate,
    wait,
    x,
    y,
  }: {
    a?: number;
    f?: number;
    wait?: boolean;
    x?: number;
    y?: number;
  }) => {
    let xDist = 0;
    let yDist = 0;
    const moveTarget = { a, f, x, y };

    if (moveTarget.x !== undefined) {
      if (this.jobOrigin) {
        moveTarget.x -= this.jobOrigin.x;
      }

      xDist = moveTarget.x - this.curPos.x;
      this.curPos.x = moveTarget.x;
    }

    if (moveTarget.y !== undefined) {
      if (this.enabledInfo.rotary) {
        moveTarget.y = this.rotaryInfo!.yRatio * (moveTarget.y - this.rotaryInfo!.y) + this.rotaryInfo!.y;
      }

      if (this.jobOrigin) {
        moveTarget.y -= this.jobOrigin.y;
      }

      yDist = moveTarget.y - this.curPos.y;
      this.curPos.y = moveTarget.y;
    } else if (moveTarget.a !== undefined) {
      if (this.enabledInfo.rotary) {
        moveTarget.a = this.rotaryInfo!.yRatio * (moveTarget.a - this.rotaryInfo!.y) + this.rotaryInfo!.y;
      }

      if (this.jobOrigin) {
        moveTarget.a -= this.jobOrigin.y;
      }

      yDist = moveTarget.a - this.curPos.a;
      this.curPos.a = moveTarget.a;
    }

    await deviceMaster.rawMove(moveTarget);

    if (wait) {
      const totalDist = Math.sqrt(xDist ** 2 + yDist ** 2);
      const time = (totalDist / f) * 60 * 1000;

      await new Promise((resolve) => setTimeout(resolve, time));
    }
  };

  private generateTaskCode = async (type: TFramingType): Promise<null | string> => {
    if (this.taskCodeCache[type] && !this.withVT) {
      return this.taskCodeCache[type];
    }

    svgCanvas.clearSelection();

    if (type === FramingType.Contour) {
      const taskCode = await fetchFramingTaskCode(false);

      if (taskCode) {
        this.taskCodeCache[type] = taskCode;
      }

      return taskCode;
    } else if (type === FramingType.Hull) {
      const taskCode = await fetchFramingTaskCode(true);

      if (taskCode) {
        this.taskCodeCache[type] = taskCode;
      }

      return taskCode;
    }

    throw new Error('Not implemented');
  };

  private generateTaskPoints = async (type: TFramingType): Promise<Array<[number, number]>> => {
    if (this.taskCache[type] && !this.withVT) {
      return this.taskCache[type].points;
    }

    svgCanvas.clearSelection();

    if (type === FramingType.Framing || type === FramingType.RotateFraming) {
      const coords = await getCoords(true);
      let isOutOfBounds = false;

      if (coords.minX === undefined) {
        return [];
      }

      if (coords.minY < 0) {
        isOutOfBounds = true;
        coords.minY = 0;
      }

      const res: Array<[number, number]> =
        coords.maxY < 0
          ? []
          : [
              [coords.minX, coords.minY],
              [coords.maxX, coords.minY],
              [coords.maxX, coords.maxY],
              [coords.minX, coords.maxY],
              [coords.minX, coords.minY],
            ];

      this.taskCache[type] = { isOutOfBounds, points: res };

      return res;
    }

    if (type === FramingType.Hull) {
      const image = await getCanvasImage();

      if (!image) return [];

      const points = await getConvexHull(image);

      if (points.length === 0) return [];

      const res: Array<[number, number]> = points.map(([x, y]) => [x / constant.dpmm, y / constant.dpmm]);

      res.push(res[0]);

      let isOutOfBounds = false;
      const topImage = await getCanvasImage(true);

      if (topImage) {
        const res2 = await getConvexHull(topImage);

        isOutOfBounds = res2.length > 0;
      }

      this.taskCache[type] = { isOutOfBounds, points: res };

      return res;
    }

    if (type === FramingType.AreaCheck) {
      const res = await getAreaCheckTask(this.device, this.jobOrigin);

      if (res.length > 0) {
        this.taskCache[type] = { points: res };
      }

      return res;
    }

    if (type === FramingType.RotateAxis) {
      if (this.rotaryInfo?.y === undefined) {
        return [];
      }

      const { width } = workareaManager;

      const res: Array<[number, number]> = [
        [0, this.rotaryInfo.y],
        [width / constant.dpmm, this.rotaryInfo.y],
        [width / constant.dpmm, this.rotaryInfo.y],
        [0, this.rotaryInfo.y],
        [0, this.rotaryInfo.y],
      ];

      this.taskCache[type] = { points: res };

      return res;
    }

    throw new Error('Not implemented');
  };

  private isInDangerZone = () => {
    if (!this.isBeamo2) return false;

    // For beamo2, moving through certain area requires door closed
    // Condition 1: Y < 20
    // Condition 2: Y < 60 and X > 320
    // Only checks the rectangular bounding area of points to simplify the calculation
    if (this.rotaryInfo) {
      if (this.rotaryInfo.y < 20) return true;

      if (this.rotaryInfo.y < 60) return this.taskPoints.some(([x]) => x > 320);
    } else {
      let yDanger = false;
      let xDanger = false;

      for (const [x, y] of this.taskPoints) {
        if (y < 20) return true;

        if (y < 60) yDanger = true;

        if (x > 320) xDanger = true;

        if (yDanger && xDanger) return true;
      }
    }

    return false;
  };

  private checkDoor = async () => {
    if (!this.shouldCheckDoor) return true;

    let isDoorClosed: boolean;

    if (deviceMaster.currentControlMode === 'raw') {
      // During raw line check mode, previous command may complete without waiting for ok msg
      // Manually wait for ok msg of previous command
      await new Promise((resolve) => setTimeout(resolve, 200));

      const { interlock } = await deviceMaster.rawGetDoorOpen();

      isDoorClosed = interlock === 0;
    } else {
      const res = await deviceMaster.getDoorOpen();

      isDoorClosed = res.value === '0';
    }

    if (!isDoorClosed) {
      alertCaller.popUpError({
        caption: i18n.lang.message.camera.door_opened,
        message: i18n.lang.topbar.alerts.close_door_before_framing,
      });
      this.stopFraming();
    }

    return isDoorClosed;
  };

  private initTask = async () => {
    const selectRes = await deviceMaster.select(this.device);

    if (!selectRes.success) return;

    const deviceStatus = await checkDeviceStatus(this.device);

    if (!deviceStatus) return;

    const { lang } = i18n;

    this.showMessage(sprintf(lang.message.connectingMachine, this.device.name));
    this.resetEnabledInfo();
    this.curPos = { a: 0, x: 0, y: 0 };
    this.rotaryInfo = getRotaryInfo(this.device.model, { axisInMm: true, forceY: this.jobOrigin?.y });

    const autoFeeder = getAutoFeeder(this.addOnInfo);

    if (!this.rotaryInfo && autoFeeder && this.addOnInfo.autoFeeder) {
      let y: number;

      if (this.jobOrigin) {
        y = this.jobOrigin.y;
      } else {
        const reverseEngraving = useGlobalPreferenceStore.getState()['reverse-engraving'];
        const workareaObj = getWorkarea(this.device.model);

        y = reverseEngraving ? workareaObj.height : (this.addOnInfo.autoFeeder.minY ?? 0) / dpmm;
      }

      this.rotaryInfo = {
        useAAxis: this.isFcodeV2,
        y,
        yRatio: this.addOnInfo.autoFeeder.rotaryRatio * useDocumentStore.getState()['auto-feeder-scale'],
      };
    }

    this.shouldCheckDoor = this.isInDangerZone();
  };

  private setLowPowerValue = async (settingValue: number) => {
    this.lowPower = 0;

    if (this.isAdor && settingValue > 0) {
      if (deviceMaster.currentControlMode !== '') await deviceMaster.endSubTask();

      const t = i18n.lang.topbar.alerts;
      let warningMessage = '';
      const deviceDetailInfo = await deviceMaster.getDeviceDetailInfo();
      const headType = Number.parseInt(deviceDetailInfo.head_type, 10);

      if ([LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE].includes(headType)) {
        this.lowPower = settingValue * 10; // mapping 0~100 to 0~1000
      } else if (headType === 0) {
        warningMessage = t.headtype_none + t.install_correct_headtype;
      } else if (Object.values(LayerModule).includes(headType)) {
        warningMessage = t.headtype_mismatch + t.install_correct_headtype;
      } else {
        warningMessage = t.headtype_unknown + t.install_correct_headtype;
      }

      if (this.lowPower > 0) {
        try {
          const res = await deviceMaster.getDoorOpen();
          const isDoorOpened = res.value === '1';

          if (isDoorOpened) {
            warningMessage = t.door_opened;
          }
        } catch (error) {
          console.error(error);
          warningMessage = t.fail_to_get_door_status;
        }
      }

      if (warningMessage) {
        MessageCaller.openMessage({
          content: warningMessage,
          key: 'low-laser-warning',
          level: MessageLevel.INFO,
        });
      }
    }
  };

  private setupTask = async () => {
    const { lang } = i18n;

    this.showMessage(lang.message.enteringRawMode);
    await deviceMaster.enterRawMode();
    this.showMessage(lang.message.exitingRotaryMode);
    await deviceMaster.rawSetRotary(false);
    this.showMessage(lang.message.homing);

    if (this.isAdor && this.rotaryInfo) {
      await deviceMaster.rawHomeZ();
    }

    if (this.jobOrigin) {
      await deviceMaster.rawUnlock();
      await deviceMaster.rawSetOrigin();
    } else if (!this.initialized) {
      await deviceMaster.rawHome();
      this.initialized = true;
    }

    if (
      (!this.isAdor && this.vc.meetRequirement('MAINTAIN_WITH_LINECHECK')) ||
      (this.isAdor && this.vc.meetRequirement('ADOR_RELEASE'))
    ) {
      await deviceMaster.rawStartLineCheckMode();
      this.enabledInfo.lineCheckMode = true;
    }

    this.showMessage(lang.message.turningOffFan);
    await deviceMaster.rawSetFan(false);
    this.showMessage(lang.message.turningOffAirPump);
    await deviceMaster.rawSetAirPump(false);

    if (!this.isAdor) await deviceMaster.rawSetWaterPump(false);

    this.closeMessage();

    if (this.rotaryInfo) {
      const { y } = this.rotaryInfo;

      if (this.isAdor) {
        if (this.taskPoints.length > 0) {
          const [fistPoint] = this.taskPoints;

          await this.moveTo({ x: fistPoint[0] });
        }

        await this.moveTo({ y });
        await deviceMaster.rawMoveZRelToLastHome(0);
      } else if (this.jobOrigin) {
        await this.moveTo({ x: this.jobOrigin.x, y });
      } else {
        await this.moveTo({ x: 0, y });
      }

      await deviceMaster.rawSetRotary(true);
      this.curPos.a = y;
      this.enabledInfo.rotary = true;
    }
  };

  private endTask = async () => {
    if (deviceMaster.currentControlMode === 'raw') {
      const { enabledInfo } = this;

      if (enabledInfo.lineCheckMode) {
        await deviceMaster.rawEndLineCheckMode();
      }

      if (enabledInfo.rotary) {
        await deviceMaster.rawSetRotary(false);
      }

      if (this.addOnInfo.redLight) {
        await deviceMaster.rawSetRedLight(true);
      }

      await deviceMaster.rawSetLaser({ on: false, s: 0 });

      if (enabledInfo['24v']) {
        await deviceMaster.rawSet24V(false);
      }

      if (this.jobOrigin) {
        await deviceMaster.rawLooseMotor();
        await deviceMaster.endSubTask();
      }
    }
  };

  public destroy = async () => {
    await this.stopFraming();

    if (!this.jobOrigin && this.initialized && !this.isPromark) {
      if (deviceMaster.currentControlMode !== 'raw') await deviceMaster.enterRawMode();

      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();
    }

    this.closeMessage();
    this.removeAllListeners();
  };

  private performTask = async (loop = false) => {
    const { jobOrigin, rotaryInfo, taskPoints } = this;

    if (taskPoints.length === 0) {
      return;
    }

    const yKey = rotaryInfo?.useAAxis ? 'a' : 'y';

    if (this.addOnInfo.redLight) {
      await deviceMaster.rawSetRedLight(false);
    }

    await this.moveTo({ wait: true, x: taskPoints[0][0], [yKey]: taskPoints[0][1] });

    if (this.interrupted) {
      return;
    }

    if (this.addOnInfo.redLight) {
      await deviceMaster.rawSetRedLight(true);
    } else if (this.lowPower > 0) {
      await deviceMaster.rawSetLaser({ on: true, s: this.lowPower });
      await deviceMaster.rawSet24V(true);
      this.enabledInfo['24v'] = true;
    }

    if (this.interrupted) {
      return;
    }

    for (let i = 1; i < taskPoints.length; ) {
      if (this.interrupted) return;

      if (!(await this.checkDoor())) return;

      await this.moveTo({ x: taskPoints[i][0], [yKey]: taskPoints[i][1] });
      i++;

      if (loop && i === taskPoints.length) i = 0;
    }

    if (this.interrupted) return;

    if (rotaryInfo) {
      if (this.addOnInfo.redLight) {
        await deviceMaster.rawSetRedLight(false);
      } else if (this.lowPower > 0) {
        await deviceMaster.rawSetLaser({ on: false, s: 0 });
      }

      await this.moveTo({ [yKey]: rotaryInfo.y });
      await deviceMaster.rawSetRotary(false);
      this.enabledInfo.rotary = false;
    }

    if (this.interrupted) {
      return;
    }

    if (jobOrigin) {
      await this.moveTo({ x: jobOrigin.x, y: jobOrigin.y });
    }
  };

  public startFraming = async (
    type: TFramingType,
    opts: { loop?: boolean; lowPower?: number },
  ): Promise<boolean | undefined> => {
    if (this.isWorking || this.isProcessing) {
      return false;
    }

    this.interrupted = false;
    this.isProcessing = true;
    this.showMessage(i18n.lang.framing.calculating_task, 0);

    let isEmpty = false;
    let taskCode: null | string | undefined;

    await this.calculateJobOrigin();

    if (this.isPromark && (type === FramingType.Contour || type === FramingType.Hull)) {
      taskCode = await this.generateTaskCode(type);
      isEmpty = !taskCode;
    } else {
      this.taskPoints = await this.generateTaskPoints(type);
      isEmpty = this.taskPoints.length === 0;
    }

    this.closeMessage();
    this.isProcessing = false;

    if (this.interrupted) {
      return false;
    }

    if (this.taskCache[type]?.isOutOfBounds) {
      MessageCaller.openMessage({
        content: i18n.lang.topbar.alerts.object_outside_moving_area,
        duration: 3,
        key: 'out-of-bound',
        level: MessageLevel.WARNING,
      });
    }

    if (isEmpty) {
      MessageCaller.openMessage({
        content: i18n.lang.topbar.alerts.add_content_first,
        duration: 3,
        key: 'no-element-to-frame',
        level: MessageLevel.INFO,
      });

      return false;
    }

    if (this.isPromark) {
      return await this.startPromarkFraming(type === FramingType.RotateAxis, taskCode ?? undefined);
    }

    try {
      this.changeWorkingStatus(true);
      await this.initTask();

      if (this.interrupted) return;

      const { loop = false, lowPower = 0 } = opts;

      await this.setLowPowerValue(lowPower);

      if (this.interrupted) return;

      await this.checkDoor();

      if (this.interrupted) return;

      await this.setupTask();

      if (this.interrupted) return;

      await this.performTask(loop);
    } catch (error) {
      console.error(error);
      alertCaller.popUp({ message: `Failed to start framing: ${error}` });
    } finally {
      await this.endTask();
      this.closeMessage();
      this.changeWorkingStatus(false);
    }
  };

  public stopFraming = async (): Promise<void> => {
    if (this.isProcessing) {
      this.interrupted = true;

      return;
    }

    if (this.isPromark) {
      await this.stopPromarkFraming();

      return;
    }

    if (!this.isWorking) {
      return;
    }

    this.interrupted = true;
  };

  private showMessage = (message: string, duration?: number): void => {
    MessageCaller.closeMessage(this.messageKey);
    MessageCaller.openMessage({ content: message, duration, key: this.messageKey, level: MessageLevel.LOADING });
  };

  private closeMessage = (): void => {
    MessageCaller.closeMessage(this.messageKey);
  };
}

export default FramingTaskManager;
