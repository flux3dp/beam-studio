import Alert from '@core/app/actions/alert-caller';
import {
  annotateCurveEngravingZSpeed,
  removeCurveEngravingZSpeedAnnotation,
} from '@core/app/actions/beambox/export/annotateCurveEngravingZSpeed';
import Progress from '@core/app/actions/progress-caller';
import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import { getAddOnInfo } from '@core/app/constants/addOn';
import AlertConstants from '@core/app/constants/alert-constants';
import { controlConfig } from '@core/app/constants/promark-constants';
import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import { getExportOpt } from '@core/helpers/api/svg-laser-parser';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import AwsHelper from '@core/helpers/aws-helper';
import { convertAllTextToPath } from '@core/helpers/convertToPath';
import i18n from '@core/helpers/i18n';
import updateImagesResolution from '@core/helpers/image/updateImagesResolution';
import annotatePrintingColor from '@core/helpers/layer/annotatePrintingColor';
import convertBitmapToInfilledRect from '@core/helpers/layer/convertBitmapToInfilledRect';
import convertClipPath from '@core/helpers/layer/convertClipPath';
import convertShapeToBitmap from '@core/helpers/layer/convertShapeToBitmap';
import { tempSplitFullColorLayers } from '@core/helpers/layer/full-color/splitFullColorLayer';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import { convertVariableText } from '@core/helpers/variableText';
import VersionChecker from '@core/helpers/version-checker';
import type { SwiftrayConvertType } from '@core/interfaces/IControlSocket';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TaskMetaData } from '@core/interfaces/ITask';
import type { IBaseConfig, IFcodeConfig } from '@core/interfaces/ITaskConfig';
import type { IWrappedSwiftrayTaskFile } from '@core/interfaces/IWrappedFile';

import { adorModels, promarkModels } from './constant';
import { getAdorPaddingAccel } from './export/ador-utils';
import { annotateLayerBBox } from './export/annotateLayerBBox';
import { annotateLayerDpmm } from './export/annotateLayerDpmm';
import generateThumbnail from './export/generate-thumbnail';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const dpiTextMap: { [key in EngraveDpiOption]: number } = {
  detailed: 1016,
  high: 508,
  low: 127,
  medium: 254,
  ultra: 1016,
};

const generateUploadFile = async (thumbnail: string, thumbnailUrl: string): Promise<IWrappedSwiftrayTaskFile> => {
  Progress.openNonstopProgress({
    id: 'retrieve-image-data',
    message: i18n.lang.beambox.bottom_right_panel.retreive_image_data,
  });
  Progress.popById('retrieve-image-data');

  const svgString = svgCanvas.getSvgString({ fixTopExpansion: true });

  console.log('File Size', svgString.length);

  return {
    data: svgString,
    extension: 'svg',
    name: 'svgeditor.svg',
    thumbnail: thumbnail.toString(),
    uploadName: thumbnailUrl.split('/').pop() ?? '',
  };
};

const popupError = (message: string): void => {
  if (message === 'cancel') {
    // Do nothing
  } else if (message.includes('busy')) {
    Alert.popUp({
      buttonType: AlertConstants.INFO,
      id: 'get-taskcode-error',
      message,
      type: AlertConstants.SHOW_POPUP_ERROR,
    });
  } else {
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
  }
};

const onUploadProgressing = (data: { message: string; percentage: number }): void => {
  Progress.update('upload-scene', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: data.message,
    percentage: data.percentage * 100,
  });
};

const onUploadFinished = (): void => {
  Progress.update('upload-scene', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: i18n.lang.message.uploading_fcode,
    percentage: 100,
  });
};

const uploadToParser = async (uploadFile: IWrappedSwiftrayTaskFile): Promise<boolean> => {
  let errorMessage: null | string = null;
  let isCanceled = false;

  // Fetching task code
  Progress.popById('fetch-task-code');
  Progress.openSteppingProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'upload-scene',
    message: '',
    onCancel: async () => {
      swiftrayClient.interruptCalculation();
      isCanceled = true;
    },
  });

  const documentState = useDocumentStore.getState();
  const uploadConfig = {
    model: workareaManager.model,
    rotaryMode: documentState['rotary_mode'],
  };

  await swiftrayClient.loadSVG(
    uploadFile,
    {
      onError: (message: string) => {
        if (isCanceled || errorMessage) {
          return;
        }

        errorMessage = message;
      },
      onFinished: onUploadFinished,
      onProgressing: onUploadProgressing,
    },
    uploadConfig,
  );

  if (errorMessage && !isCanceled) {
    Progress.popById('upload-scene');
    popupError(errorMessage);
  }

  return !isCanceled && !errorMessage;
};

const getTaskCode = (codeType: SwiftrayConvertType, taskOptions: any) =>
  new Promise<{
    fileTimeCost: null | number;
    metadata: Record<string, string>;
    taskCodeBlob: Blob | null;
  }>((resolve) => {
    swiftrayClient.convert(
      codeType,
      {
        onError: (message) => {
          Progress.popById('fetch-task');
          popupError(message);
          resolve({
            fileTimeCost: null,
            metadata: {},
            taskCodeBlob: null,
          });
        },
        onFinished: (taskBlob, timeCost, metadata) => {
          Progress.update('fetch-task', { message: i18n.lang.message.uploading_fcode, percentage: 100 });
          resolve({ fileTimeCost: timeCost, metadata, taskCodeBlob: taskBlob });
        },
        onProgressing: (data) => {
          Progress.update('fetch-task', {
            message: data.message,
            percentage: data.percentage * 100,
            progressKey: data.message,
          });
        },
      },
      { ...taskOptions, useActualWorkarea: true },
    );
  });

// Send svg string calculate taskcode, output Fcode in default
const fetchTaskCodeSwiftray = async (
  device: IDeviceInfo | null = null,
  opts: { fgGcode?: boolean; output?: 'fcode' | 'gcode' } = {},
): Promise<
  | Record<string, never>
  | {
      fileTimeCost: number;
      metadata: TaskMetaData;
      taskCodeBlob: Blob;
      thumbnail: string;
      thumbnailBlobURL: string;
    }
> => {
  let isCanceled = false;

  svgCanvas.removeUnusedDefs();
  SymbolMaker.switchImageSymbolForAll(false);
  Progress.openNonstopProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'fetch-task-code',
    message: i18n.lang.beambox.bottom_right_panel.convert_text_to_path_before_export,
  });

  const revertFunctions: Array<() => void> = [];
  // Convert text to path
  const { revert, success } = await convertAllTextToPath();

  revertFunctions.push(revert);

  if (!success) {
    Progress.popById('fetch-task-code');
    SymbolMaker.switchImageSymbolForAll(true);

    return {};
  }

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Generating Thumbnail',
  });

  // Generate Thumbnail
  const { thumbnail, thumbnailBlobURL } = await generateThumbnail();

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Splitting Full color layer',
  });
  annotateLayerDpmm(device);
  annotateCurveEngravingZSpeed(device);

  // Prepare for Printing task & clean up temp modification
  revertFunctions.push(
    removeCurveEngravingZSpeedAnnotation,
    await updateImagesResolution(),
    await convertShapeToBitmap(),
    annotatePrintingColor(),
    await tempSplitFullColorLayers(),
    await convertClipPath(),
    annotateLayerBBox(),
  );

  const cleanUpTempModification = async () => {
    revertFunctions.toReversed().forEach((revert) => revert());
    SymbolMaker.switchImageSymbolForAll(true);
  };

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Generating Upload File',
  });

  const uploadFile = await generateUploadFile(thumbnail, thumbnailBlobURL);

  await cleanUpTempModification();

  const didUpload = await uploadToParser(uploadFile);

  if (!didUpload) {
    return {};
  }

  let doesSupportDiodeAndAF = true;
  let shouldUseFastGradient = useGlobalPreferenceStore.getState().fast_gradient !== false;
  let supportPwm: boolean | undefined;
  let supportJobOrigin: boolean | undefined;
  let supportAccOverrideV1: boolean | undefined;

  if (device) {
    const vc = VersionChecker(device.version);
    const isAdor = adorModels.has(device.model);

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
      swiftrayClient.interruptCalculation();
      isCanceled = true;
    },
  });

  const addOnInfo = getAddOnInfo(workareaManager.model);
  let codeType = opts.output || 'fcode';
  const { fgGcode = false } = opts;
  const isNonFGCode = codeType === 'gcode' && !fgGcode;
  const model = workareaManager.model;
  const isPromark = promarkModels.has(model);

  if (isPromark) {
    codeType = 'gcode';
  }

  const targetDevice = device || TopBarController.getSelectedDevice();
  const documentState = useDocumentStore.getState();

  let taskConfig: IBaseConfig | IFcodeConfig = {
    device: targetDevice,
    enableAutoFocus: doesSupportDiodeAndAF && documentState['enable-autofocus'] && addOnInfo.autoFocus,
    enableDiode: doesSupportDiodeAndAF && documentState['enable-diode'] && addOnInfo.hybridLaser,
    isPromark,
    model,
    paddingAccel: await getAdorPaddingAccel(targetDevice),
    shouldMockFastGradient: isNonFGCode,
    shouldUseFastGradient: shouldUseFastGradient && !isNonFGCode,
    supportAccOverrideV1,
    supportJobOrigin,
    supportPwm,
    travelSpeed: isPromark ? controlConfig.travelSpeed : 100,
  };

  taskConfig = {
    ...taskConfig,
    ...(await getExportOpt(taskConfig)).config,
  };

  console.log('fetchTaskCodeSwiftray', codeType, 'taskConfig', taskConfig);

  if (isCanceled) {
    // TODO: Copy this logic to regular fetchTaskCode
    return {};
  }

  const getTaskCodeResult = await getTaskCode(codeType, taskConfig);
  const { metadata, taskCodeBlob } = getTaskCodeResult;
  let { fileTimeCost } = getTaskCodeResult;

  if (isCanceled || taskCodeBlob == null) {
    return {};
  }

  if (isNonFGCode && !isPromark) {
    if (shouldUseFastGradient) {
      (taskConfig as IFcodeConfig).fg = true;
      (taskConfig as IFcodeConfig).mfg = false;
    }

    const fcodeRes = await getTaskCode('preview', taskConfig);

    fileTimeCost = fcodeRes.fileTimeCost;
  }

  Progress.popById('fetch-task');

  if (isCanceled || taskCodeBlob == null) {
    return {};
  }

  return {
    fileTimeCost: fileTimeCost!,
    metadata: metadata as any,
    taskCodeBlob,
    thumbnail,
    thumbnailBlobURL,
  };
};

// Promark only
const fetchFramingTaskCode = async (hull: boolean): Promise<null | string> => {
  if (!swiftrayClient.checkVersion(hull ? 'PROMARK_HULL' : 'PROMARK_CONTOUR')) {
    return null;
  }

  let isCanceled = false;
  const revertVariableText = await convertVariableText();

  svgCanvas.removeUnusedDefs();
  SymbolMaker.switchImageSymbolForAll(false);
  Progress.openNonstopProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'fetch-task-code',
    message: i18n.lang.beambox.bottom_right_panel.convert_text_to_path_before_export,
  });

  // Convert text to path
  const { revert, success } = await convertAllTextToPath({ pathPerChar: hull });

  if (!success) {
    Progress.popById('fetch-task-code');
    SymbolMaker.switchImageSymbolForAll(true);
    revertVariableText?.();

    return null;
  }

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Simplifying bitmap',
  });

  const revertBitmap = convertBitmapToInfilledRect();

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Calculating clip path',
  });

  const revertClipPath = await convertClipPath();

  const cleanUpTempModification = async () => {
    revertClipPath();
    revertBitmap();
    revert();
    SymbolMaker.switchImageSymbolForAll(true);
    revertVariableText?.();
  };

  Progress.update('fetch-task-code', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: 'Generating Upload File',
  });

  const uploadFile = await generateUploadFile('', '');

  await cleanUpTempModification();

  const didUpload = await uploadToParser(uploadFile);

  Progress.popById('upload-scene');

  if (!didUpload) {
    return null;
  }

  Progress.openSteppingProgress({
    id: 'fetch-task',
    message: '',
    onCancel: () => {
      swiftrayClient.interruptCalculation();
      isCanceled = true;
    },
  });

  const taskConfig: any = {
    isPromark: true,
    model: 'fpm1',
    travelSpeed: controlConfig.travelSpeed,
  };

  const { fileTimeCost, taskCodeBlob } = await getTaskCode(hull ? 'hull' : 'contour', taskConfig);

  Progress.popById('fetch-task');

  if (isCanceled || fileTimeCost === 0 || !taskCodeBlob) {
    return null;
  }

  try {
    return await taskCodeBlob.text();
  } catch (e) {
    console.error('Error reading task code blob:', e);

    return null;
  }
};

export { fetchFramingTaskCode, fetchTaskCodeSwiftray };
