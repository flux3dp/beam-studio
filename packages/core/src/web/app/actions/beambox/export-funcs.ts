import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import constant, { hexaRfModelsArray, promarkModels } from '@core/app/actions/beambox/constant';
import { fetchTaskCodeSwiftray } from '@core/app/actions/beambox/export-funcs-swiftray';
import MonitorController from '@core/app/actions/monitor-controller';
import Progress from '@core/app/actions/progress-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import AlertConstants from '@core/app/constants/alert-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import type { PreviewTask, VariableTextTask } from '@core/app/contexts/MonitorContext';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import workareaManager from '@core/app/svgedit/workarea';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import svgLaserParser from '@core/helpers/api/svg-laser-parser';
import { hasSwiftray } from '@core/helpers/api/swiftray-client';
import AwsHelper from '@core/helpers/aws-helper';
import { convertAllTextToPath } from '@core/helpers/convertToPath';
import deviceMaster from '@core/helpers/device-master';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import updateImagesResolution from '@core/helpers/image/updateImagesResolution';
import annotatePrintingColor from '@core/helpers/layer/annotatePrintingColor';
import convertShapeToBitmap from '@core/helpers/layer/convertShapeToBitmap';
import { tempSplitFullColorLayers } from '@core/helpers/layer/full-color/splitFullColorLayer';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { VariableTextElemHandler } from '@core/helpers/variableText';
import { extractVariableText, hasVariableText, removeVariableText } from '@core/helpers/variableText';
import VersionChecker from '@core/helpers/version-checker';
import dialog from '@core/implementations/dialog';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { BackendProgressData, TaskMetaData } from '@core/interfaces/ITask';
import type { IWrappedTaskFile } from '@core/interfaces/IWrappedFile';

import { getAdorPaddingAccel } from './export/ador-utils';
import {
  annotateCurveEngravingZSpeed,
  removeCurveEngravingZSpeedAnnotation,
} from './export/annotateCurveEngravingZSpeed';
import { annotateLayerBBox } from './export/annotateLayerBBox';
import { annotateLayerDpmm } from './export/annotateLayerDpmm';
import generateThumbnail from './export/generate-thumbnail';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const svgeditorParser = svgLaserParser({ type: 'svgeditor' });

const handleProgress = (id: string, { message, percentage, translation_key }: BackendProgressData) => {
  if (
    translation_key &&
    i18n.lang.message.backend_calculation[translation_key as keyof typeof i18n.lang.message.backend_calculation]
  ) {
    message = sprintf(
      i18n.lang.message.backend_calculation[translation_key as keyof typeof i18n.lang.message.backend_calculation],
      percentage * 100,
    );
  }

  Progress.update(id, {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message,
    percentage: percentage * 100,
  });
};

const generateUploadFile = async (thumbnail: string, thumbnailUrl: string) => {
  Progress.openNonstopProgress({
    id: 'retrieve-image-data',
    message: i18n.lang.beambox.bottom_right_panel.retreive_image_data,
  });
  Progress.popById('retrieve-image-data');

  const svgString = svgCanvas.getSvgString({ fixTopExpansion: true });

  console.log('File Size', svgString.length);

  const blob = new Blob([thumbnail, svgString], { type: 'application/octet-stream' });
  const reader = new FileReader();
  const uploadFile = await new Promise<IWrappedTaskFile>((resolve) => {
    reader.onload = () => {
      // not sure whether all para is needed
      const file = {
        data: reader.result!,
        extension: 'svg',
        index: 0,
        name: 'svgeditor.svg',
        size: blob.size,
        thumbnailSize: thumbnail.length,
        totalFiles: 1,
        type: 'application/octet-stream',
        uploadName: thumbnailUrl.split('/').pop() ?? 'upload-file',
      };

      resolve(file);
    };
    reader.readAsArrayBuffer(blob);
  });

  return uploadFile;
};

// Send svg string calculate taskcode, output Fcode in default
const fetchTaskCode = async (
  device: IDeviceInfo | null = null,
  opts: { fgGcode?: boolean; output?: 'fcode' | 'gcode' } = {},
) => {
  svgCanvas.removeUnusedDefs();

  let isCanceled = false;

  SymbolMaker.switchImageSymbolForAll(false);
  Progress.openNonstopProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'fetch-task-code',
    message: i18n.lang.beambox.bottom_right_panel.convert_text_to_path_before_export,
  });

  const revertFunctions: Array<() => void> = [];
  const { revert: revertConvertTextToPath, success } = await convertAllTextToPath();

  revertFunctions.push(revertConvertTextToPath);

  if (!success) {
    Progress.popById('fetch-task-code');
    SymbolMaker.switchImageSymbolForAll(true);

    return null;
  }

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Generating Thumbnail',
  });

  const { thumbnail, thumbnailBlobURL } = await generateThumbnail();

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Splitting Full color layer',
  });
  annotateLayerDpmm(device);
  annotateCurveEngravingZSpeed(device);

  revertFunctions.push(
    removeCurveEngravingZSpeedAnnotation,
    await updateImagesResolution(),
    await convertShapeToBitmap(),
    annotatePrintingColor(),
    await tempSplitFullColorLayers(),
    annotateLayerBBox(),
  );

  const cleanUp = () => {
    revertFunctions.toReversed().forEach((revert) => revert());
    SymbolMaker.switchImageSymbolForAll(true);
  };

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Generating Upload File',
  });

  const uploadFile = await generateUploadFile(thumbnail, thumbnailBlobURL);

  cleanUp();
  Progress.popById('fetch-task-code');
  Progress.openSteppingProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'upload-scene',
    message: '',
    onCancel: async () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });

  const documentState = useDocumentStore.getState();
  const globalPreference = useGlobalPreferenceStore.getState();
  const uploadRes = await svgeditorParser.uploadToSvgeditorAPI(uploadFile, {
    // TODO: fallback dpmm for older backend, can remove after firmware ghost update
    engraveDpi: globalPreference.engrave_dpi,
    model: workareaManager.model,
    onProgressing: (data: BackendProgressData) => handleProgress('upload-scene', data),
  });

  if (isCanceled) return null;

  if (!uploadRes.res) {
    Progress.popById('upload-scene');
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      id: 'get-taskcode-error',
      message: `#806 ${uploadRes.message}\n${i18n.lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
      onYes: () => {
        const svgString = svgCanvas.getSvgString();

        AwsHelper.uploadToS3('output.bvg', svgString);
      },
      type: AlertConstants.SHOW_POPUP_ERROR,
    });

    return null;
  }

  Progress.update('upload-scene', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: i18n.lang.message.uploading_fcode,
    percentage: 100,
  });

  let doesSupportDiodeAndAF = true;
  let shouldUseFastGradient = globalPreference.fast_gradient !== false;
  let supportPwm: boolean;
  let supportJobOrigin: boolean;
  let supportAccOverrideV1: boolean;

  if (device) {
    const vc = VersionChecker(device.version);
    const isAdor = constant.adorModels.includes(device.model);

    doesSupportDiodeAndAF = vc.meetRequirement('DIODE_AND_AUTOFOCUS');
    shouldUseFastGradient = shouldUseFastGradient && vc.meetRequirement('FAST_GRADIENT');
    supportPwm = vc.meetRequirement(isAdor ? 'ADOR_PWM' : 'PWM');
    supportJobOrigin = vc.meetRequirement(isAdor ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN');
    supportAccOverrideV1 = vc.meetRequirement('BEAMO_ACC_OVERRIDE');
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

  let didErrorOccur = false;
  const targetDevice = device || TopBarController.getSelectedDevice();
  const paddingAccel = await getAdorPaddingAccel(targetDevice);
  const addOnInfo = getAddOnInfo(workareaManager.model);
  const getTaskCode = (codeType: 'fcode' | 'gcode', getTaskCodeOpts = {}) =>
    new Promise<null | {
      fileTimeCost: number;
      metadata: TaskMetaData;
      taskCodeBlob: Blob;
    }>((resolve) => {
      const names: string[] = [];

      svgeditorParser.getTaskCode(names, {
        codeType,
        device: targetDevice,
        enableAutoFocus: doesSupportDiodeAndAF && documentState['enable-autofocus'] && addOnInfo.autoFocus,
        enableDiode: doesSupportDiodeAndAF && documentState['enable-diode'] && addOnInfo.hybridLaser,
        fileMode: '-f',
        model: workareaManager.model,
        onError: (message: string) => {
          Progress.popById('fetch-task');
          Alert.popUp({
            buttonType: AlertConstants.YES_NO,
            id: 'get-taskcode-error',
            message: `#806 ${message}\n${i18n.lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
            onYes: () => {
              const svgString = svgCanvas.getSvgString();

              AwsHelper.uploadToS3('output.bvg', svgString);
            },
            type: AlertConstants.SHOW_POPUP_ERROR,
          });
          didErrorOccur = true;
          resolve(null);
        },
        onFinished: (taskBlob: Blob, timeCost: number, metadata: TaskMetaData) => {
          Progress.update('fetch-task', { message: i18n.lang.message.uploading_fcode, percentage: 100 });
          resolve({ fileTimeCost: timeCost, metadata, taskCodeBlob: taskBlob });
        },
        onProgressing: (data: BackendProgressData) => handleProgress('fetch-task', data),
        shouldUseFastGradient,
        ...getTaskCodeOpts,
        paddingAccel,
        supportAccOverrideV1,
        supportJobOrigin,
        supportPwm,
      });
    });
  const { output = 'fcode' } = opts;
  const { fgGcode = false } = opts;
  const taskCodeRes = await getTaskCode(
    output,
    output === 'gcode' && !fgGcode
      ? {
          shouldMockFastGradient: true,
          shouldUseFastGradient: false,
        }
      : undefined,
  );

  if (!taskCodeRes) return null;

  const { metadata, taskCodeBlob } = taskCodeRes;
  let { fileTimeCost } = taskCodeRes;

  if (output === 'gcode' && !fgGcode) {
    const fcodeRes = await getTaskCode('fcode');

    if (!fcodeRes) return null;

    fileTimeCost = fcodeRes.fileTimeCost;
  }

  Progress.popById('fetch-task');

  if (isCanceled || didErrorOccur) return null;

  return {
    fileTimeCost,
    metadata,
    taskCodeBlob,
    thumbnail,
    thumbnailBlobURL,
  };
};

// Modified from fetchTaskCode
const fetchBeamo24CCalibrationTaskCode = async (limitPosition: string) => {
  let isCanceled = false;
  let modelId = 'upload-scene';

  Progress.openSteppingProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: modelId,
    message: '',
    onCancel: async () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });

  const sceneArgsResp = await fetch('assets/bm2-4c-scene-args.txt');
  const sceneArgsString = await sceneArgsResp.text();
  const fileResp = await fetch('assets/bm2-4c-scene.txt');
  const scene = (await fileResp.text()).replaceAll(/\r\n/g, '\n');
  const data = Buffer.from(scene, 'utf8');
  const uploadRes = await svgeditorParser.uploadToSvgeditorAPI({ data, size: data.length } as any, {
    forceArgString: sprintf(sceneArgsString, data.length),
    model: 'fbm2',
    onProgressing: (data: BackendProgressData) => handleProgress(modelId, data),
  });

  if (isCanceled) return null;

  Progress.popById(modelId);

  if (!uploadRes.res) {
    Alert.popUp({
      buttonType: AlertConstants.INFO,
      id: 'get-taskcode-error',
      message: `#806 ${uploadRes.message}`,
      type: AlertConstants.SHOW_POPUP_ERROR,
    });

    return null;
  }

  modelId = 'fetch-task';
  Progress.openSteppingProgress({
    id: modelId,
    message: '',
    onCancel: () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });

  let didErrorOccur = false;
  const taskArgsResp = await fetch('assets/bm2-4c-task-args.txt');
  const taskArgsString = await taskArgsResp.text();
  const taskCodeRes = await new Promise<null | {
    fileTimeCost: number;
    metadata: TaskMetaData;
    taskCodeBlob: Blob;
  }>((resolve) => {
    svgeditorParser.getTaskCode([], {
      forceArgString: `${taskArgsString} -machine-limit-position ${limitPosition}`,
      onError: (message: string) => {
        Progress.popById(modelId);
        Alert.popUp({
          buttonType: AlertConstants.INFO,
          id: 'get-taskcode-error',
          message: `#806 ${message}`,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
        didErrorOccur = true;
        resolve(null);
      },
      onFinished: (taskBlob: Blob, timeCost: number, metadata: TaskMetaData) => {
        Progress.update(modelId, { message: i18n.lang.message.uploading_fcode, percentage: 100 });
        resolve({ fileTimeCost: timeCost, metadata, taskCodeBlob: taskBlob });
      },
      onProgressing: (data: BackendProgressData) => handleProgress(modelId, data),
    } as any);
  });

  if (isCanceled || didErrorOccur) return null;

  Progress.popById(modelId);

  if (!taskCodeRes) return null;

  return taskCodeRes.taskCodeBlob;
};

// Send svg string calculate taskcode, output Fcode in default
const fetchTransferredFcode = async (gcodeString: string, thumbnail: string) => {
  let isErrorOccur = false;
  let isCanceled = false;
  const blob = new Blob([thumbnail, gcodeString], { type: 'application/octet-stream' });
  const arrayBuffer = await blob.arrayBuffer();

  Progress.openSteppingProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'fetch-task',
    message: '',
    onCancel: () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });

  const { fileTimeCost, taskCodeBlob } = await new Promise<{
    fileTimeCost: null | number;
    taskCodeBlob: Blob | null;
  }>((resolve) => {
    const codeType = 'fcode';

    svgeditorParser.gcodeToFcode(
      { arrayBuffer, size: blob.size, thumbnailSize: thumbnail.length },
      {
        codeType,
        model: workareaManager.model,
        onError: (message: string) => {
          Progress.popById('fetch-task');
          Alert.popUp({
            buttonType: AlertConstants.YES_NO,
            id: 'get-taskcode-error',
            message: `#806 ${message}\n${i18n.lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
            onYes: () => {
              const svgString = svgCanvas.getSvgString();

              AwsHelper.uploadToS3('output.bvg', svgString);
            },
            type: AlertConstants.SHOW_POPUP_ERROR,
          });
          isErrorOccur = true;
          resolve({
            fileTimeCost: null,
            taskCodeBlob: null,
          });
        },
        onFinished: (taskBlob: Blob, fileName: string, timeCost: number) => {
          Progress.update('fetch-task', { message: i18n.lang.message.uploading_fcode, percentage: 100 });
          resolve({ fileTimeCost: timeCost, taskCodeBlob: taskBlob });
        },
        onProgressing: (data: BackendProgressData) => handleProgress('fetch-task', data),
      },
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

const openTaskInDeviceMonitor = async (
  device: IDeviceInfo,
  taskInfo: {
    blob: Blob;
    metadata?: TaskMetaData;
    taskTime: number;
    thumbnailUrl: string;
  },
  {
    autoStart = false,
    vtElemHandler,
    vtTaskTinfo,
  }: {
    autoStart?: boolean;
    vtElemHandler?: VariableTextElemHandler;
    vtTaskTinfo?: VariableTextTask;
  } = {},
): Promise<void> => {
  const fileName = currentFileManager.getName() || i18n.lang.topbar.untitled;
  const task: PreviewTask = {
    fcodeBlob: taskInfo.blob,
    fileName,
    metadata: taskInfo.metadata ?? ({} as TaskMetaData),
    taskImageURL: taskInfo.thumbnailUrl,
    taskTime: taskInfo.taskTime,
  };

  await MonitorController.showMonitor(device, Mode.PREVIEW, task, autoStart, vtTaskTinfo, vtElemHandler);
};

export const getConvertEngine = (targetDevice?: IDeviceInfo) => {
  const currentWorkarea = workareaManager.model;
  const isPromark = promarkModels.has(currentWorkarea);

  const useSwiftray =
    hasSwiftray &&
    !['fbm2', ...hexaRfModelsArray].includes(currentWorkarea) &&
    (isPromark ||
      useGlobalPreferenceStore.getState()['path-engine'] === 'swiftray' ||
      targetDevice?.source === 'swiftray');
  const convertEngine = useSwiftray ? fetchTaskCodeSwiftray : fetchTaskCode;

  return { convertEngine, useSwiftray };
};

const promarkTaskCache: Record<string, PreviewTask> = {};

export default {
  estimateTime: async (): Promise<number> => {
    const { convertEngine } = getConvertEngine();
    const res = await convertEngine();

    if (!res) throw new Error('estimateTime: No task code blob');

    return res.fileTimeCost;
  },
  exportFcode: async (device?: IDeviceInfo): Promise<void> => {
    const { convertEngine } = getConvertEngine();
    const res = await convertEngine(device);

    if (!res) return;

    const { taskCodeBlob } = res;

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
          extensions: ['fc'],
          name: getOS() === 'MacOS' ? `${langFile.fcode_files} (*.fc)` : langFile.fcode_files,
        },
        { extensions: ['*'], name: langFile.all_files },
      ]);
    };

    fileReader.readAsArrayBuffer(taskCodeBlob);
  },
  fetchBeamo24CCalibrationTaskCode,
  gcodeToFcode: async (
    gcodeString: string,
    thumbnail: string,
  ): Promise<null | {
    fcodeBlob: Blob;
    fileTimeCost: number;
  }> => {
    const { fcodeBlob, fileTimeCost } = await fetchTransferredFcode(gcodeString, thumbnail);

    if (!fcodeBlob) return null;

    return { fcodeBlob, fileTimeCost: fileTimeCost ?? 0 };
  },
  getCachedPromarkTask: (serial: string): PreviewTask | undefined => promarkTaskCache[serial],
  getFastGradientGcode: async (): Promise<Blob | null> => {
    const { convertEngine } = getConvertEngine();
    const res = await convertEngine(null, { fgGcode: true, output: 'gcode' });

    if (!res) return null;

    return res.taskCodeBlob;
  },
  getGcode: async (): Promise<{
    fileTimeCost: number;
    gcodeBlob?: Blob;
    useSwiftray: boolean;
  }> => {
    const { convertEngine, useSwiftray } = getConvertEngine();
    const res = await convertEngine(null, { output: 'gcode' });
    const { fileTimeCost, taskCodeBlob } = res ?? {};

    return { fileTimeCost: fileTimeCost || 0, gcodeBlob: taskCodeBlob, useSwiftray };
  },
  getMetadata: async (device?: IDeviceInfo): Promise<TaskMetaData> => {
    const { convertEngine } = getConvertEngine();
    const res = await convertEngine(device);

    if (!res) throw new Error('getMetadata: No task code blob');

    return res.metadata;
  },
  openTaskInDeviceMonitor,
  prepareFileWrappedFromSvgStringAndThumbnail: async (): Promise<{
    thumbnailBlobURL: string;
    uploadFile: IWrappedTaskFile;
  }> => {
    const { revert } = await convertAllTextToPath();

    const { thumbnail, thumbnailBlobURL } = await generateThumbnail();

    const revertUpdateImagesResolution = await updateImagesResolution();

    const uploadFile = await generateUploadFile(thumbnail, thumbnailBlobURL);

    revertUpdateImagesResolution();
    revert();

    return { thumbnailBlobURL, uploadFile };
  },
  uploadFcode: async (device: IDeviceInfo, autoStart?: boolean): Promise<void> => {
    const { convertEngine } = getConvertEngine(device);
    const revertVT = removeVariableText();
    const res = await convertEngine(device);

    revertVT?.();

    if (!res) return;

    let { fileTimeCost, metadata, taskCodeBlob, thumbnail, thumbnailBlobURL } = res;

    if (!taskCodeBlob) return;

    let vtTaskTinfo: undefined | VariableTextTask;
    let vtElemHandler: undefined | VariableTextElemHandler;

    if (hasVariableText({ visibleOnly: true })) {
      // Update thumbnail with variable text placeholder
      SymbolMaker.switchImageSymbolForAll(false);

      const { revert } = await convertAllTextToPath();

      ({ thumbnail, thumbnailBlobURL } = await generateThumbnail());
      revert();
      SymbolMaker.switchImageSymbolForAll(true);
      // Get variable text task info for initial total time estimation
      vtElemHandler = extractVariableText() ?? undefined;
      vtTaskTinfo = ((await convertEngine(device)) as null | VariableTextTask) ?? undefined;
      vtElemHandler?.revert();
    }

    try {
      const res = await deviceMaster.select(device);

      if (!res) return;

      if (promarkModels.has(device.model)) {
        promarkTaskCache[device.serial] = {
          fcodeBlob: taskCodeBlob,
          fileName: '',
          metadata,
          taskImageURL: thumbnail,
          taskTime: fileTimeCost,
          vtTaskTime: vtTaskTinfo?.fileTimeCost,
        };
      }

      await openTaskInDeviceMonitor(
        device,
        { blob: taskCodeBlob, metadata, taskTime: fileTimeCost, thumbnailUrl: thumbnailBlobURL },
        { autoStart, vtElemHandler, vtTaskTinfo },
      );
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
};
