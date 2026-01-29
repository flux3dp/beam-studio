import { EventEmitter } from 'eventemitter3';

import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { importBvgString } from '@core/app/svgedit/operations/import/importBvg';
import { discoverManager } from '@core/helpers/api/discover';
import svgLaserParser from '@core/helpers/api/svg-laser-parser';
import DeviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const svgeditorParser = svgLaserParser({ type: 'svgeditor' });
const MACHINE_STATUS = {
  '-17': 'Cartridge IO Mode',
  '-10': 'Maintain mode',
  '-2': 'Scanning',
  '-1': 'Maintaining',
  0: 'Idle',
  1: 'Initiating',
  2: 'ST_TRANSFORM',
  4: 'Starting',
  6: 'Resuming',
  16: 'Working',
  18: 'Resuming',
  32: 'Paused',
  36: 'Paused',
  38: 'Pausing',
  48: 'Paused',
  50: 'Pausing',
  64: 'Completed',
  66: 'Completing',
  68: 'Preparing',
  128: 'Aborted',
  UNKNOWN: 'Unknown',
};

// Core
export default window['EasyManipulator'] = class EasyManipulator extends EventEmitter {
  private machines: IDeviceInfo[];

  private isWorking: boolean;

  private device: IDeviceInfo;

  private bvg: string;

  private taskCodeBlob: Blob;

  constructor() {
    super();
    this.machines = [];
    this.isWorking = false;
    discoverManager.register('easy-manipulator', (machines) => {
      this.machines = Object.values(machines).filter((m) => m.model.startsWith('fb'));

      if (this.device) {
        const device = this.machines.filter((m) => m.uuid === this.device.uuid)[0];

        if (device) {
          this.device = device;

          if (this.isWorking && this.device.st_id === 64) {
            this.emit('DONE');
            this.quit();
            this.isWorking = false;
          }
        }
      }
    });
  }

  addEventListener(event: string, listener: (...args: any[]) => void) {
    this.addListener(event, listener);
  }

  removeEventListener(event: string, listener: (...args: any[]) => void) {
    this.removeListener(event, listener);
  }

  async selectMachine(machineName: string) {
    return new Promise((resolve) => {
      let isSuccessSelected = false;
      const interval = window.setInterval(async () => {
        const targets = this.machines.filter((m) => m.name === machineName);
        const device = targets[0];

        this.device = device;

        if (!device) {
          return;
        }

        const res = await DeviceMaster.select(device);

        if (res.success) {
          this.isWorking = device.st_id === 16;
          isSuccessSelected = true;
          window.clearInterval(interval);
          resolve(true);
        } else {
          console.log(`Failed to connect to ${machineName}`);
          this.emit('ERROR', { detail: { error: res.error } });
        }
      }, 15000);

      window.setTimeout(() => {
        if (!isSuccessSelected) {
          const error = `Unable to select device: ${machineName}`;

          this.emit('ERROR', { detail: { error } });
          resolve(false);
        }
      }, 3000);
    });
  }

  async loadBVG(bvgString) {
    this.bvg = bvgString;
    /*
    this.bvg = `
    <svg id="svgcontent" width="3000" height="2100" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" data-top="-1300" data-left="-512" data-zoom="0.115" data-rotary_mode="0">
      <g data-repeat="1" data-strength="1" data-speed="20" clip-path="url(#scene_mask)" data-dpi="medium" data-color="#333333" class="layer">
        <title>預設圖層</title>
        <rect fill="black" vector-effect="non-scaling-stroke" fill-opacity="0" id="svg_1" stroke="#333333" height="913.57312" width="713.4571" y="196.98372" x="201.85626"/>
      </g>
    </svg>`; */
    await importBvgString(this.bvg);

    const { uploadFile } = await ExportFuncs.prepareFileWrappedFromSvgStringAndThumbnail();
    const { workarea } = useDocumentStore.getState();
    const { message, res } = await svgeditorParser.uploadToSvgeditorAPI(uploadFile, {
      engraveDpi: useGlobalPreferenceStore.getState().engrave_dpi,
      model: this.device ? this.device.model : workarea,
    });

    if (res) {
      this.emit('LOAD');

      return true;
    }

    this.emit('ERROR', { detail: { error: message } });

    return false;
  }

  async calculate() {
    if (!this.bvg) {
      const error = 'No BVG loaded';

      this.emit('ERROR', { detail: { error } });

      return { success: false, timeCost: 0 };
    }

    const { fileTimeCost, taskCodeBlob } = await new Promise<{
      fileTimeCost: number;
      taskCodeBlob: Blob;
    }>((resolve) => {
      const names = []; // don't know what this is for
      const codeType = 'fcode';
      const { workarea } = useDocumentStore.getState();

      svgeditorParser.getTaskCode(names, {
        codeType,
        fileMode: '-f',
        model: this.device ? this.device.model : workarea,
        onFinished: (codeBlob, timeCost) => {
          resolve({ fileTimeCost: timeCost, taskCodeBlob: codeBlob });
          this.emit('CALCULATED', { detail: { fileTimeCost: timeCost, taskCodeBlob: codeBlob } });
        },
        onProgressing: () => {},
      });
    });

    this.taskCodeBlob = taskCodeBlob;

    return { success: true, timeCost: fileTimeCost };
  }

  async start() {
    if (!this.device) {
      const error = 'No Machine Selected';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    if (!this.taskCodeBlob) {
      const error = 'No Calculated Task';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    let isSuc = false;

    try {
      await DeviceMaster.go(this.taskCodeBlob, (progress) => {
        this.emit('UPLOADING', { detail: { progress } });
      });
      isSuc = true;
      this.isWorking = true;
    } catch (error) {
      this.emit('ERROR', { detail: { error } });
      isSuc = false;
    }

    return isSuc;
  }

  pause() {
    if (!this.device) {
      const error = 'No Machine Selected';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    DeviceMaster.pause();

    return true;
  }

  resume() {
    if (!this.device) {
      const error = 'No Machine Selected';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    DeviceMaster.resume();

    return true;
  }

  abort() {
    if (!this.device) {
      const error = 'No Machine Selected';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    this.isWorking = false;
    DeviceMaster.stop();
    DeviceMaster.quit();

    return true;
  }

  quit() {
    if (!this.device) {
      const error = 'No Machine Selected';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    DeviceMaster.quit();

    return true;
  }

  kick() {
    if (!this.device) {
      const error = 'No Machine Selected';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    DeviceMaster.kick();

    return true;
  }

  getStatus() {
    if (!this.device) {
      const error = 'No Machine Selected';

      this.emit('ERROR', { detail: { error } });

      return false;
    }

    const { st_id: id, st_prog: prog } = this.device;

    return { progress: prog, state: MACHINE_STATUS[id] };
  }
};
