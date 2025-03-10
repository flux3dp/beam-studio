import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import generateThumbnail from '@core/app/actions/beambox/export/generate-thumbnail';
import { fetchTaskCodeSwiftray } from '@core/app/actions/beambox/export-funcs-swiftray';
import FontFuncs from '@core/app/actions/beambox/font-funcs';
import MonitorController from '@core/app/actions/monitor-controller';
import Progress from '@core/app/actions/progress-caller';
import { getSupportInfo } from '@core/app/constants/add-on';
import AlertConstants from '@core/app/constants/alert-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import type { PreviewTask } from '@core/app/contexts/MonitorContext';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import svgLaserParser from '@core/helpers/api/svg-laser-parser';
import { hasSwiftray } from '@core/helpers/api/swiftray-client';
import AwsHelper from '@core/helpers/aws-helper';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import updateImagesResolution from '@core/helpers/image/updateImagesResolution';
import convertShapeToBitmap from '@core/helpers/layer/convertShapeToBitmap';
import { tempSplitFullColorLayers } from '@core/helpers/layer/full-color/splitFullColorLayer';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-maker';
import VersionChecker from '@core/helpers/version-checker';
import dialog from '@core/implementations/dialog';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TaskMetaData } from '@core/interfaces/ITask';
import type { IWrappedTaskFile } from '@core/interfaces/IWrappedFile';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const { lang } = i18n;
const svgeditorParser = svgLaserParser({ type: 'svgeditor' });

const getAdorPaddingAccel = async (device: IDeviceInfo | null): Promise<null | number> => {
  if (!device || !constant.adorModels.includes(device?.model)) return null;

  try {
    await deviceMaster.select(device);

    const deviceDetailInfo = await deviceMaster.getDeviceDetailInfo();
    const xAcc = Number.parseInt(deviceDetailInfo.x_acc, 10);

    // handle nan and 0
    return Number.isNaN(xAcc) || !xAcc ? null : xAcc;
  } catch (error) {
    console.error(error);

    return null;
  }
};

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
    message: lang.beambox.bottom_right_panel.convert_text_to_path_before_export,
  });

  const res = await FontFuncs.tempConvertTextToPathAmoungSvgcontent();

  if (!res) {
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
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'upload-scene',
    message: '',
    onCancel: async () => {
      svgeditorParser.interruptCalculation();
      isCanceled = true;
    },
  });

  const uploadRes = await svgeditorParser.uploadToSvgeditorAPI(uploadFile, {
    engraveDpi:
      // (isDev() && BeamboxPreference.read('engrave-dpi-value')) ||
      BeamboxPreference.read('engrave_dpi'),
    model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
    onProgressing: (data: { message: string; percentage: number }) => {
      // message: Analyzing SVG - 0.0%
      Progress.update('upload-scene', {
        caption: i18n.lang.beambox.popup.progress.calculating,
        message: data.message,
        percentage: data.percentage * 100,
      });
    },
  });

  if (isCanceled) return null;

  if (!uploadRes.res) {
    Progress.popById('upload-scene');
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      id: 'get-taskcode-error',
      message: `#806 ${uploadRes.message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
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
    message: lang.message.uploading_fcode,
    percentage: 100,
  });

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

  let didErrorOccur = false;
  const paddingAccel = await getAdorPaddingAccel(device || TopBarController.getSelectedDevice());
  const supportInfo = getSupportInfo(BeamboxPreference.read('workarea'));
  const getTaskCode = (codeType: 'fcode' | 'gcode', getTaskCodeOpts = {}) =>
    new Promise<null | {
      fileTimeCost: number;
      metadata: TaskMetaData;
      taskCodeBlob: Blob;
    }>((resolve) => {
      const names: string[] = [];

      svgeditorParser.getTaskCode(names, {
        codeType,
        enableAutoFocus: doesSupportDiodeAndAF && BeamboxPreference.read('enable-autofocus') && supportInfo.autoFocus,
        enableDiode: doesSupportDiodeAndAF && BeamboxPreference.read('enable-diode') && supportInfo.hybridLaser,
        fileMode: '-f',
        model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
        onError: (message: string) => {
          Progress.popById('fetch-task');
          Alert.popUp({
            buttonType: AlertConstants.YES_NO,
            id: 'get-taskcode-error',
            message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
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
          Progress.update('fetch-task', { message: lang.message.uploading_fcode, percentage: 100 });
          resolve({ fileTimeCost: timeCost, metadata, taskCodeBlob: taskBlob });
        },
        onProgressing: (data: { message: string; percentage: number }) => {
          // message: Calculating Toolpath 28.6%
          Progress.update('fetch-task', {
            message: data.message,
            percentage: data.percentage * 100,
          });
        },
        shouldUseFastGradient,
        ...getTaskCodeOpts,
        paddingAccel,
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
        model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
        onError: (message) => {
          Progress.popById('fetch-task');
          Alert.popUp({
            buttonType: AlertConstants.YES_NO,
            id: 'get-taskcode-error',
            message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
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
          Progress.update('fetch-task', { message: lang.message.uploading_fcode, percentage: 100 });
          resolve({ fileTimeCost: timeCost, taskCodeBlob: taskBlob });
        },
        onProgressing: (data: { message: string; percentage: number }) => {
          Progress.update('fetch-task', {
            message: data.message,
            percentage: data.percentage * 100,
          });
        },
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
  }: {
    autoStart?: boolean;
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

  await MonitorController.showMonitor(device, Mode.PREVIEW, task, autoStart);
};

export const getConvertEngine = (targetDevice?: IDeviceInfo) => {
  const currentWorkarea = BeamboxPreference.read('workarea');
  const isPromark = promarkModels.has(currentWorkarea);
  const useSwiftray =
    hasSwiftray &&
    (isPromark || BeamboxPreference.read('path-engine') === 'swiftray' || targetDevice?.source === 'swiftray');
  const convertEngine = useSwiftray ? fetchTaskCodeSwiftray : fetchTaskCode;

  return { convertEngine, useSwiftray };
};

const promarkTaskCache: Record<string, { timeCost: number; url: string }> = {};

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
          name: window.os === 'MacOS' ? `${langFile.fcode_files} (*.fc)` : langFile.fcode_files,
        },
        { extensions: ['*'], name: langFile.all_files },
      ]);
    };

    fileReader.readAsArrayBuffer(taskCodeBlob);
  },
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
  getCachedPromarkTask: (serial: string): { timeCost: number; url: string } => promarkTaskCache[serial],
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
    await FontFuncs.tempConvertTextToPathAmoungSvgcontent();

    const { thumbnail, thumbnailBlobURL } = await generateThumbnail();
    const uploadFile = await generateUploadFile(thumbnail, thumbnailBlobURL);

    await FontFuncs.revertTempConvert();

    return { thumbnailBlobURL, uploadFile };
  },
  uploadFcode: async (device: IDeviceInfo, autoStart?: boolean): Promise<void> => {
    const { convertEngine } = getConvertEngine(device);
    const res = await convertEngine(device);

    if (!res) return;

    const { fileTimeCost, metadata, taskCodeBlob, thumbnail, thumbnailBlobURL } = res;

    if (!taskCodeBlob && device.model !== 'fpm1') return;

    try {
      const res = await deviceMaster.select(device);

      if (!res) return;

      if (promarkModels.has(device.model)) {
        promarkTaskCache[device.serial] = {
          timeCost: fileTimeCost,
          url: thumbnail,
        };
      }

      await openTaskInDeviceMonitor(
        device,
        { blob: taskCodeBlob, metadata, taskTime: fileTimeCost, thumbnailUrl: thumbnailBlobURL },
        { autoStart },
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
