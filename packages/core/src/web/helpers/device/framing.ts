import { EventEmitter } from 'eventemitter3';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import exportFuncs from '@core/app/actions/beambox/export-funcs';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import { getWorkarea } from '@core/app/constants/workarea-constants';
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
import symbolMaker from '@core/helpers/symbol-maker';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { PromarkStore } from '@core/interfaces/Promark';

import applyRedDot from './promark/apply-red-dot';
import promarkDataStore from './promark/promark-data-store';

// TODO: add unit test
export enum FramingType {
  Framing,
  RotateFraming,
  Hull,
  AreaCheck,
  RotateAxis,
}

type Coordinates = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const framingOptions = {
  [FramingType.AreaCheck]: {
    description: 'areacheck_desc',
    title: 'area_check',
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

export const getFramingOptions = (device: IDeviceInfo) => {
  if (promarkModels.has(device.model)) {
    const withRotary = Boolean(beamboxPreference.read('rotary_mode') && getAddOnInfo(device.model).rotary);

    if (withRotary) return [FramingType.RotateAxis, FramingType.RotateFraming];

    return [FramingType.Framing];
  }

  return [FramingType.Framing, FramingType.Hull, FramingType.AreaCheck];
};

const getCoords = (mm?: boolean): Coordinates => {
  const coords: Partial<Coordinates> = {
    maxX: undefined,
    maxY: undefined,
    minX: undefined,
    minY: undefined,
  };
  const { height: workareaHeight, width: workareaWidth } = workareaManager;
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
        bottom < 0 ||
        x > workareaWidth ||
        y > workareaHeight ||
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
    coords.minY = Math.max(coords.minY ?? 0, 0) / ratio;
    coords.maxX = Math.min(coords.maxX ?? workareaWidth, workareaWidth) / ratio;
    coords.maxY = Math.min(coords.maxY ?? workareaHeight, workareaHeight) / ratio;
  }

  return coords as Coordinates;
};

const getCanvasImage = async (): Promise<Blob> => {
  symbolMaker.switchImageSymbolForAll(false);

  const allLayers = getAllLayers()
    .filter((layer) => getData(layer, 'repeat') > 0)
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

  const { height, width } = workareaManager;
  const svgDefs = findDefs();
  const svgString = `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
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

  return new Promise<Blob>((resolve) => canvas.toBlob(resolve));
};

const getConvexHull = async (imgBlob: Blob): Promise<Array<[number, number]>> => getUtilWS().getConvexHull(imgBlob);

const getAreaCheckTask = async (
  device: IDeviceInfo,
  jobOrigin: null | { x: number; y: number },
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
  private addOnInfo: AddOnInfo;
  private isAdor = false;
  private isFcodeV2 = false;
  private isPromark = false;
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
  private jobOrigin: null | { x: number; y: number } = null; // x, y in mm
  private vc: ReturnType<typeof versionChecker>;
  private curPos: { a: number; x: number; y: number } = { a: 0, x: 0, y: 0 };
  private movementFeedrate = 6000; // mm/min
  private lowPower = 0;
  private taskCache: { [type in FramingType]?: Array<[number, number]> } = {};
  private taskPoints: Array<[number, number]> = [];
  private hasAppliedRedLight = false;

  constructor(device: IDeviceInfo) {
    super();
    this.device = device;
    this.addOnInfo = getAddOnInfo(this.device.model);
    this.resetEnabledInfo();
    this.vc = versionChecker(device.version);
    this.isAdor = constant.adorModels.includes(device.model);
    this.isPromark = promarkModels.has(device.model);
    this.isFcodeV2 = constant.fcodeV2Models.has(device.model);
    this.rotaryInfo = getRotaryInfo(this.device.model, true);

    if (
      beamboxPreference.read('enable-job-origin') &&
      this.addOnInfo.jobOrigin &&
      this.vc.meetRequirement(this.isAdor ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN')
    ) {
      this.jobOrigin = getJobOrigin();
    } else {
      this.jobOrigin = null;
    }
  }

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

  public startPromarkFraming = async (noRotation: boolean): Promise<void> => {
    swiftrayClient.on('disconnected', this.onSwiftrayDisconnected);

    if (this.isWorking) {
      return;
    }

    if (this.rotaryInfo && !noRotation && !swiftrayClient.checkVersion('PROMARK_RPTARY')) {
      return;
    }

    this.changeWorkingStatus(true);

    const deviceStatus = await checkDeviceStatus(this.device);

    if (!deviceStatus) {
      this.changeWorkingStatus(false);

      return;
    }

    if (!this.hasAppliedRedLight) {
      this.emit('message', i18n.lang.message.connecting);

      const { field, galvoParameters, redDot } = promarkDataStore.get(this.device?.serial) as PromarkStore;

      if (redDot) {
        const { field: newField, galvoParameters: newGalvo } = applyRedDot(redDot, field, galvoParameters);
        const { width } = getWorkarea(this.device.model);

        await deviceMaster.setField(width, newField);
        await deviceMaster.setGalvoParameters(newGalvo);
      }

      this.hasAppliedRedLight = true;
    }

    await deviceMaster.startFraming([this.taskPoints[0], this.taskPoints[2]], noRotation ? null : this.rotaryInfo);

    setTimeout(() => this.emit('close-message'), 1000);

    if (this.rotaryInfo && !noRotation) {
      // No loop, need check finish status
      const timer = setInterval(async () => {
        if (this.isWorking) {
          const report = await deviceMaster.getReport();

          if (monitorStatus.isAbortedOrCompleted(report)) {
            this.changeWorkingStatus(false);
            clearInterval(timer);
          }
        } else {
          clearInterval(timer);
        }
      }, 1000);
    }
  };

  public stopPromarkFraming = async (): Promise<void> => {
    swiftrayClient.off('disconnected', this.onSwiftrayDisconnected);

    if (!this.isWorking) {
      return;
    }

    await deviceMaster.stopFraming();
    this.changeWorkingStatus(false);
  };

  public resetPromarkParams = async (): Promise<void> => {
    if (this.hasAppliedRedLight) {
      const { field, galvoParameters, redDot } = promarkDataStore.get(this.device?.serial) as PromarkStore;

      if (redDot) {
        const { width } = getWorkarea(this.device.model);

        await deviceMaster.setField(width, field);
        await deviceMaster.setGalvoParameters(galvoParameters);
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

  private generateTaskPoints = async (type: FramingType): Promise<Array<[number, number]>> => {
    if (this.taskCache[type]) {
      return this.taskCache[type];
    }

    svgCanvas.clearSelection();

    if (type === FramingType.Framing || type === FramingType.RotateFraming) {
      const coords = getCoords(true);

      if (coords.minX === undefined) {
        return [];
      }

      const res: Array<[number, number]> = [
        [coords.minX, coords.minY],
        [coords.maxX, coords.minY],
        [coords.maxX, coords.maxY],
        [coords.minX, coords.maxY],
        [coords.minX, coords.minY],
      ];

      this.taskCache[type] = res;

      return res;
    }

    if (type === FramingType.Hull) {
      const image = await getCanvasImage();
      const points = await getConvexHull(image);
      const res: Array<[number, number]> = points.map(([x, y]) => [x / constant.dpmm, y / constant.dpmm]);

      res.push(res[0]);
      this.taskCache[type] = res;

      return res;
    }

    if (type === FramingType.AreaCheck) {
      const res = await getAreaCheckTask(this.device, this.jobOrigin);

      if (res.length > 0) {
        this.taskCache[type] = res;
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

      this.taskCache[type] = res;

      return res;
    }

    throw new Error('Not implemented');
  };

  private initTask = async () => {
    const selectRes = await deviceMaster.select(this.device);

    if (!selectRes.success) return;

    const deviceStatus = await checkDeviceStatus(this.device);

    if (!deviceStatus) return;

    const { lang } = i18n;

    this.emit('message', sprintf(lang.message.connectingMachine, this.device.name));
    this.resetEnabledInfo();
    this.curPos = { a: 0, x: 0, y: 0 };
    this.rotaryInfo = getRotaryInfo(this.device.model, true);

    const autoFeeder = getAutoFeeder(this.addOnInfo);

    if (!this.rotaryInfo && autoFeeder && this.addOnInfo.autoFeeder) {
      let y: number;

      if (this.jobOrigin) {
        y = this.jobOrigin.y;
      } else {
        const reverseEngraving = beamboxPreference.read('reverse-engraving');
        const workareaObj = getWorkarea(this.device.model);

        y = reverseEngraving ? workareaObj.height : 0;
      }

      this.rotaryInfo = {
        useAAxis: this.isFcodeV2,
        y,
        yRatio: this.addOnInfo.autoFeeder.rotaryRatio * beamboxPreference.read('auto-feeder-scale'),
      };
    }
  };

  private setLowPowerValue = async (settingValue: number) => {
    this.lowPower = 0;

    if (constant.adorModels.includes(this.device.model) && settingValue > 0) {
      const t = i18n.lang.topbar.alerts;
      let warningMessage = '';
      const deviceDetailInfo = await deviceMaster.getDeviceDetailInfo();
      const headType = Number.parseInt(deviceDetailInfo.head_type, 10);

      if ([LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE].includes(headType)) {
        this.lowPower = settingValue * 10; // mapping 0~100 to 0~1000
      } else if (headType === 0) {
        warningMessage = t.headtype_none + t.install_correct_headtype;
      } else if (LayerModule[headType]) {
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

    this.emit('message', lang.message.enteringRawMode);
    await deviceMaster.enterRawMode();
    this.emit('message', lang.message.exitingRotaryMode);
    await deviceMaster.rawSetRotary(false);
    this.emit('message', lang.message.homing);

    if (this.isAdor && this.rotaryInfo) {
      await deviceMaster.rawHomeZ();
    }

    if (this.jobOrigin) {
      await deviceMaster.rawUnlock();
      await deviceMaster.rawSetOrigin();
    } else {
      await deviceMaster.rawHome();
    }

    if (
      (!this.isAdor && this.vc.meetRequirement('MAINTAIN_WITH_LINECHECK')) ||
      (this.isAdor && this.vc.meetRequirement('ADOR_RELEASE'))
    ) {
      await deviceMaster.rawStartLineCheckMode();
      this.enabledInfo.lineCheckMode = true;
    }

    this.emit('message', lang.message.turningOffFan);
    await deviceMaster.rawSetFan(false);
    this.emit('message', lang.message.turningOffAirPump);
    await deviceMaster.rawSetAirPump(false);

    if (!this.isAdor) {
      await deviceMaster.rawSetWaterPump(false);
    }

    this.emit('close-message');

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

      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();
    }
  };

  private performTask = async () => {
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

    for (let i = 1; i < taskPoints.length; i += 1) {
      if (this.interrupted) {
        return;
      }

      await this.moveTo({ x: taskPoints[i][0], [yKey]: taskPoints[i][1] });
    }

    if (this.interrupted) {
      return;
    }

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

  public startFraming = async (type: FramingType, opts: { lowPower?: number }): Promise<void> => {
    // Go to Promark logic
    if (this.isWorking) {
      return;
    }

    this.emit('message', i18n.lang.framing.calculating_task);
    this.taskPoints = await this.generateTaskPoints(type);

    if (this.taskPoints.length === 0) {
      this.emit('close-message');
      MessageCaller.openMessage({
        content: i18n.lang.topbar.alerts.add_content_first,
        duration: 3,
        key: 'no-element-to-frame',
        level: MessageLevel.INFO,
      });

      return;
    }

    if (this.isPromark) {
      await this.startPromarkFraming(type === FramingType.RotateAxis);

      return;
    }

    try {
      this.changeWorkingStatus(true);
      this.interrupted = false;
      await this.initTask();

      if (this.interrupted) {
        return;
      }

      const { lowPower = 0 } = opts;

      await this.setLowPowerValue(lowPower);

      if (this.interrupted) {
        return;
      }

      await this.setupTask();

      if (this.interrupted) {
        return;
      }

      await this.performTask();
    } catch (error) {
      console.error(error);
      alertCaller.popUp({ message: `Failed to start framing: ${error}` });
    } finally {
      await this.endTask();
      this.emit('close-message');
      this.changeWorkingStatus(false);
    }
  };

  public stopFraming = async (): Promise<void> => {
    if (this.isPromark) {
      await this.stopPromarkFraming();

      return;
    }

    if (!this.isWorking) {
      return;
    }

    this.interrupted = true;
  };
}

export default FramingTaskManager;
