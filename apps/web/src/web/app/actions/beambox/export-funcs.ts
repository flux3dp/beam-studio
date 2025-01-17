/* eslint-disable no-console */
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import AwsHelper from 'helpers/aws-helper';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import constant, { promarkModels } from 'app/actions/beambox/constant';
import convertShapeToBitmap from 'helpers/layer/convertShapeToBitmap';
import currentFileManager from 'app/svgedit/currentFileManager';
import deviceMaster from 'helpers/device-master';
import dialog from 'implementations/dialog';
import FontFuncs from 'app/actions/beambox/font-funcs';
import generateThumbnail from 'app/actions/beambox/export/generate-thumbnail';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import i18n from 'helpers/i18n';
import MonitorController from 'app/actions/monitor-controller';
import Progress from 'app/actions/progress-caller';
import SymbolMaker from 'helpers/symbol-maker';
import svgLaserParser from 'helpers/api/svg-laser-parser';
import TopBarController from 'app/views/beambox/TopBar/contexts/TopBarController';
import updateImagesResolution from 'helpers/image/updateImagesResolution';
import VersionChecker from 'helpers/version-checker';
import { fetchTaskCodeSwiftray } from 'app/actions/beambox/export-funcs-swiftray';
import { getSupportInfo } from 'app/constants/add-on';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { hasSwiftray } from 'helpers/api/swiftray-client';
import { IDeviceInfo } from 'interfaces/IDevice';
import { Mode } from 'app/constants/monitor-constants';
import { tempSplitFullColorLayers } from 'helpers/layer/full-color/splitFullColorLayer';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const { lang } = i18n;
const svgeditorParser = svgLaserParser({ type: 'svgeditor' });

const getAdorPaddingAccel = async (device: IDeviceInfo | null): Promise<number | null> => {
  if (!constant.adorModels.includes(device?.model)) return null;
  try {
    await deviceMaster.select(device);
    const deviceDetailInfo = await deviceMaster.getDeviceDetailInfo();
    const xAcc = parseInt(deviceDetailInfo.x_acc, 10);
    // handle nan and 0
    return Number.isNaN(xAcc) || !xAcc ? null : xAcc;
  } catch (error) {
    console.error(error);
    return null;
  }
};

interface WrappedFile {
  data: string | ArrayBuffer;
  name: string;
  uploadName: string;
  extension: string;
  type: string;
  size: number;
  thumbnailSize: number;
  index: number;
  totalFiles: number;
}

const generateUploadFile = async (thumbnail: string, thumbnailUrl: string) => {
  Progress.openNonstopProgress({
    id: 'retrieve-image-data',
    message: lang.beambox.bottom_right_panel.retreive_image_data,
  });
  await updateImagesResolution(true);
  Progress.popById('retrieve-image-data');
  const svgString = svgCanvas.getSvgString();
  console.log('File Size', svgString.length);
  const blob = new Blob([thumbnail, svgString], { type: 'application/octet-stream' });
  const reader = new FileReader();
  const uploadFile = await new Promise<WrappedFile>((resolve) => {
    reader.onload = () => {
      // not sure whether all para is needed
      const file = {
        data: reader.result,
        name: 'svgeditor.svg',
        uploadName: thumbnailUrl.split('/').pop(),
        extension: 'svg',
        type: 'application/octet-stream',
        size: blob.size,
        thumbnailSize: thumbnail.length,
        index: 0,
        totalFiles: 1,
      };
      resolve(file);
    };
    reader.readAsArrayBuffer(blob);
  });
  return uploadFile;
};

// Send svg string calculate taskcode, output Fcode in default
const fetchTaskCode = async (
  device: IDeviceInfo = null,
  opts: { output?: 'fcode' | 'gcode'; fgGcode?: boolean } = {}
) => {
  svgCanvas.removeUnusedDefs();
  let didErrorOccur = false;
  let isCanceled = false;

  SymbolMaker.switchImageSymbolForAll(false);
  Progress.openNonstopProgress({
    id: 'fetch-task-code',
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: lang.beambox.bottom_right_panel.convert_text_to_path_before_export,
  });

  const res = await FontFuncs.tempConvertTextToPathAmoungSvgcontent();
  if (!res) {
    Progress.popById('fetch-task-code');
    SymbolMaker.switchImageSymbolForAll(true);
    return {};
  }
  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Generating Thumbnail',
  });
  const { thumbnail, thumbnailBlobURL } = await generateThumbnail();
  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Spliting Full color layer',
  });
  const revertShapesToImage = await convertShapeToBitmap();
  const revertTempSplitFullColorLayers = await tempSplitFullColorLayers();
  const cleanUp = async () => {
    revertTempSplitFullColorLayers();
    revertShapesToImage();
    await FontFuncs.revertTempConvert();
    SymbolMaker.switchImageSymbolForAll(true);
  };
  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Generating Upload File',
  });
  const uploadFile = await generateUploadFile(thumbnail, thumbnailBlobURL);
  await cleanUp();
  Progress.popById('fetch-task-code');
  Progress.openSteppingProgress({
    id: 'upload-scene',
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: '',
    onCancel: async () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });
  await svgeditorParser.uploadToSvgeditorAPI([uploadFile], {
    model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
    rotaryMode: BeamboxPreference.read('rotary_mode'),
    engraveDpi:
      // (isDev() && BeamboxPreference.read('engrave-dpi-value')) ||
      BeamboxPreference.read('engrave_dpi'),
    onProgressing: (data) => {
      // message: Analyzing SVG - 0.0%
      Progress.update('upload-scene', {
        caption: i18n.lang.beambox.popup.progress.calculating,
        message: data.message,
        percentage: data.percentage * 100,
      });
    },
    onFinished: () => {
      Progress.update('upload-scene', {
        caption: i18n.lang.beambox.popup.progress.calculating,
        message: lang.message.uploading_fcode,
        percentage: 100,
      });
    },
    onError: (message) => {
      if (isCanceled || didErrorOccur) return;
      didErrorOccur = true;
      Progress.popById('upload-scene');
      Alert.popUp({
        id: 'get-taskcode-error',
        message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
        type: AlertConstants.SHOW_POPUP_ERROR,
        buttonType: AlertConstants.YES_NO,
        onYes: () => {
          const svgString = svgCanvas.getSvgString();
          AwsHelper.uploadToS3('output.bvg', svgString);
        },
      });
    },
  });
  if (isCanceled || didErrorOccur) {
    return {};
  }

  let doesSupportDiodeAndAF = true;
  let shouldUseFastGradient = BeamboxPreference.read('fast_gradient') !== false;
  let supportPwm: boolean;
  let supportJobOrigin: boolean;
  if (device) {
    const vc = VersionChecker(device.version);
    const isAdor = constant.adorModels.includes(device.model);
    doesSupportDiodeAndAF = vc.meetRequirement('DIODE_AND_AUTOFOCUS');
    shouldUseFastGradient = shouldUseFastGradient && vc.meetRequirement('FAST_GRADIENT');
    supportPwm = vc.meetRequirement(isAdor ? 'ADOR_PWM' : 'PWM');
    supportJobOrigin = vc.meetRequirement(isAdor ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN');
  }
  Progress.popById('upload-scene');
  Progress.openSteppingProgress({
    id: 'fetch-task',
    message: '',
    onCancel: () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });

  const paddingAccel = await getAdorPaddingAccel(device || TopBarController.getSelectedDevice());
  const supportInfo = getSupportInfo(BeamboxPreference.read('workarea'));
  const getTaskCode = (codeType: 'gcode' | 'fcode', getTaskCodeOpts = {}) =>
    new Promise<{
      fileTimeCost: null | number;
      taskCodeBlob: Blob | null;
      metadata: { [key: string]: string };
    }>((resolve) => {
      const names = [];
      svgeditorParser.getTaskCode(names, {
        onProgressing: (data) => {
          // message: Calculating Toolpath 28.6%
          Progress.update('fetch-task', {
            message: data.message,
            percentage: data.percentage * 100,
          });
        },
        onFinished: (taskBlob, timeCost, metadata) => {
          Progress.update('fetch-task', { message: lang.message.uploading_fcode, percentage: 100 });
          resolve({ taskCodeBlob: taskBlob, fileTimeCost: timeCost, metadata });
        },
        onError: (message) => {
          Progress.popById('fetch-task');
          Alert.popUp({
            id: 'get-taskcode-error',
            message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
            type: AlertConstants.SHOW_POPUP_ERROR,
            buttonType: AlertConstants.YES_NO,
            onYes: () => {
              const svgString = svgCanvas.getSvgString();
              AwsHelper.uploadToS3('output.bvg', svgString);
            },
          });
          didErrorOccur = true;
          resolve({
            taskCodeBlob: null,
            fileTimeCost: null,
            metadata: {},
          });
        },
        fileMode: '-f',
        codeType,
        model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
        enableAutoFocus:
          doesSupportDiodeAndAF &&
          BeamboxPreference.read('enable-autofocus') &&
          supportInfo.autoFocus,
        enableDiode:
          doesSupportDiodeAndAF &&
          BeamboxPreference.read('enable-diode') &&
          supportInfo.hybridLaser,
        shouldUseFastGradient,
        vectorSpeedConstraint: BeamboxPreference.read('vector_speed_contraint') !== false,
        ...getTaskCodeOpts,
        paddingAccel,
        supportPwm,
        supportJobOrigin,
      });
    });
  const { output = 'fcode' } = opts;
  const { fgGcode = false } = opts;
  const taskCodeRes = await getTaskCode(
    output,
    output === 'gcode' && !fgGcode
      ? {
          shouldUseFastGradient: false,
          shouldMockFastGradient: true,
        }
      : undefined
  );
  const { taskCodeBlob, metadata } = taskCodeRes;
  let { fileTimeCost } = taskCodeRes;

  if (output === 'gcode' && !fgGcode) {
    const fcodeRes = await getTaskCode('fcode');
    fileTimeCost = fcodeRes.fileTimeCost;
  }

  Progress.popById('fetch-task');
  if (isCanceled || didErrorOccur) {
    return {};
  }

  return {
    taskCodeBlob,
    thumbnail,
    thumbnailBlobURL,
    fileTimeCost,
    metadata,
  };
};

// Send svg string calculate taskcode, output Fcode in default
const fetchTransferredFcode = async (gcodeString: string, thumbnail: string) => {
  let isErrorOccur = false;
  let isCanceled = false;
  const blob = new Blob([thumbnail, gcodeString], { type: 'application/octet-stream' });
  const arrayBuffer = await blob.arrayBuffer();

  Progress.openSteppingProgress({
    id: 'fetch-task',
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: '',
    onCancel: () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });
  const { taskCodeBlob, fileTimeCost } = await new Promise<{
    taskCodeBlob: Blob | null;
    fileTimeCost: number | null;
  }>((resolve) => {
    const codeType = 'fcode';
    svgeditorParser.gcodeToFcode(
      { arrayBuffer, thumbnailSize: thumbnail.length, size: blob.size },
      {
        onProgressing: (data) => {
          Progress.update('fetch-task', {
            message: data.message,
            percentage: data.percentage * 100,
          });
        },
        onFinished: (taskBlob, fileName, timeCost) => {
          Progress.update('fetch-task', { message: lang.message.uploading_fcode, percentage: 100 });
          resolve({ taskCodeBlob: taskBlob, fileTimeCost: timeCost });
        },
        onError: (message) => {
          Progress.popById('fetch-task');
          Alert.popUp({
            id: 'get-taskcode-error',
            message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
            type: AlertConstants.SHOW_POPUP_ERROR,
            buttonType: AlertConstants.YES_NO,
            onYes: () => {
              const svgString = svgCanvas.getSvgString();
              AwsHelper.uploadToS3('output.bvg', svgString);
            },
          });
          isErrorOccur = true;
          resolve({
            taskCodeBlob: null,
            fileTimeCost: null,
          });
        },
        codeType,
        model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
        vectorSpeedConstraint: BeamboxPreference.read('vector_speed_contraint') !== false,
      }
    );
  });
  Progress.popById('fetch-task');
  if (isCanceled || isErrorOccur) {
    return {};
  }

  return {
    fcodeBlob: taskCodeBlob,
    fileTimeCost,
  };
};

const openTaskInDeviceMonitor = (
  device: IDeviceInfo,
  fcodeBlob: Blob,
  taskImageURL: string,
  taskTime: number,
  autoStart?: boolean
): void => {
  const fileName = currentFileManager.getName() || i18n.lang.topbar.untitled;
  MonitorController.showMonitor(
    device,
    Mode.PREVIEW,
    {
      fcodeBlob,
      taskImageURL,
      taskTime,
      fileName,
    },
    autoStart
  );
};

export const getConvertEngine = (targetDevice?: IDeviceInfo) => {
  const currentWorkarea = BeamboxPreference.read('workarea');
  const isPromark = promarkModels.has(currentWorkarea);
  const useSwiftray =
    hasSwiftray &&
    (isPromark ||
      BeamboxPreference.read('path-engine') === 'swiftray' ||
      targetDevice?.source === 'swiftray');
  const convertEngine = useSwiftray ? fetchTaskCodeSwiftray : fetchTaskCode;
  return { convertEngine, useSwiftray };
};

const promarkTaskCache: Record<string, { url: string; timeCost: number }> = {};

export default {
  uploadFcode: async (device: IDeviceInfo, autoStart?: boolean): Promise<void> => {
    const { convertEngine } = getConvertEngine(device);
    const { taskCodeBlob, thumbnail, thumbnailBlobURL, fileTimeCost } = await convertEngine(device);
    if (!taskCodeBlob && device.model !== 'fpm1') {
      return;
    }
    try {
      const res = await deviceMaster.select(device);
      if (!res) {
        return;
      }
      if (promarkModels.has(device.model)) {
        promarkTaskCache[device.serial] = {
          url: thumbnail,
          timeCost: fileTimeCost,
        };
      }
      openTaskInDeviceMonitor(device, taskCodeBlob, thumbnailBlobURL, fileTimeCost, autoStart);
    } catch (errMsg) {
      console.error(errMsg);
      // TODO: handle err message
      Alert.popUp({
        id: 'menu-item',
        message: `#807 ${errMsg}`,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    }
  },
  exportFcode: async (device?: IDeviceInfo): Promise<void> => {
    const { convertEngine } = getConvertEngine();
    const { taskCodeBlob } = await convertEngine(device);
    if (!taskCodeBlob) {
      throw new Error('exportFCode: No task code blob');
    }
    const defaultFCodeName = currentFileManager.getName() || 'untitled';
    const langFile = i18n.lang.topmenu.file;
    const fileReader = new FileReader();

    fileReader.onload = function onLoad() {
      const getContent = () => new Blob([this.result as ArrayBuffer]);
      dialog.writeFileDialog(getContent, langFile.save_fcode, defaultFCodeName, [
        {
          name: window.os === 'MacOS' ? `${langFile.fcode_files} (*.fc)` : langFile.fcode_files,
          extensions: ['fc'],
        },
        { name: langFile.all_files, extensions: ['*'] },
      ]);
    };

    fileReader.readAsArrayBuffer(taskCodeBlob);
  },
  getGcode: async (): Promise<{
    gcodeBlob?: Blob;
    fileTimeCost: number;
    useSwiftray: boolean;
  }> => {
    const { convertEngine, useSwiftray } = getConvertEngine();
    const { taskCodeBlob, fileTimeCost } = await convertEngine(null, { output: 'gcode' });
    return { gcodeBlob: taskCodeBlob, fileTimeCost: fileTimeCost || 0, useSwiftray };
  },
  getFastGradientGcode: async (): Promise<Blob> => {
    const { convertEngine } = getConvertEngine();
    const { taskCodeBlob } = await convertEngine(null, { output: 'gcode', fgGcode: true });
    return taskCodeBlob;
  },
  estimateTime: async (): Promise<number> => {
    const { convertEngine } = getConvertEngine();
    const { taskCodeBlob, fileTimeCost } = await convertEngine();
    if (!taskCodeBlob) {
      throw new Error('estimateTime: No task code blob');
    }
    return fileTimeCost;
  },
  getMetadata: async (device?: IDeviceInfo): Promise<{ [key: string]: string }> => {
    const { convertEngine } = getConvertEngine();
    const { taskCodeBlob, metadata } = await convertEngine(device);
    if (!taskCodeBlob) {
      throw new Error('getMetadata: No task code blob');
    }
    return metadata;
  },
  gcodeToFcode: async (
    gcodeString: string,
    thumbnail: string
  ): Promise<{
    fcodeBlob: Blob;
    fileTimeCost: number;
  }> => {
    const { fcodeBlob, fileTimeCost } = await fetchTransferredFcode(gcodeString, thumbnail);
    if (!fcodeBlob) {
      return null;
    }
    return { fcodeBlob, fileTimeCost };
  },
  prepareFileWrappedFromSvgStringAndThumbnail: async (): Promise<{
    uploadFile: WrappedFile;
    thumbnailBlobURL: string;
  }> => {
    await FontFuncs.tempConvertTextToPathAmoungSvgcontent();
    const { thumbnail, thumbnailBlobURL } = await generateThumbnail();
    const uploadFile = await generateUploadFile(thumbnail, thumbnailBlobURL);
    await FontFuncs.revertTempConvert();
    return { uploadFile, thumbnailBlobURL };
  },
  openTaskInDeviceMonitor,
  getCachedPromarkTask: (serial: string): { url: string; timeCost: number } =>
    promarkTaskCache[serial],
};
