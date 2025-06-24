import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import FontFuncs from '@core/app/actions/beambox/font-funcs';
import Progress from '@core/app/actions/progress-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import AlertConstants from '@core/app/constants/alert-constants';
import { controlConfig } from '@core/app/constants/promark-constants';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import { getExportOpt } from '@core/helpers/api/svg-laser-parser';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import AwsHelper from '@core/helpers/aws-helper';
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
import generateThumbnail from './export/generate-thumbnail';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const { lang } = i18n;

export const dpiTextMap = {
  high: 508,
  low: 127,
  medium: 254,
  ultra: 1016,
};

const generateUploadFile = async (thumbnail: string, thumbnailUrl: string): Promise<IWrappedSwiftrayTaskFile> => {
  Progress.openNonstopProgress({
    id: 'retrieve-image-data',
    message: lang.beambox.bottom_right_panel.retreive_image_data,
  });
  await updateImagesResolution(true);
  Progress.popById('retrieve-image-data');

  const svgString = svgCanvas.getSvgString();

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
      message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
      onYes: () => {
        const svgString = svgCanvas.getSvgString();

        AwsHelper.uploadToS3('output.bvg', svgString);
      },
      type: AlertConstants.SHOW_POPUP_ERROR,
    });
  }
};

const onUploadProgressing = (data): void => {
  Progress.update('upload-scene', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: data.message,
    percentage: data.percentage * 100,
  });
};

const onUploadFinished = (): void => {
  Progress.update('upload-scene', {
    caption: i18n.lang.beambox.popup.progress.calculating,
    message: lang.message.uploading_fcode,
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

  const uploadConfig = {
    engraveDpi: dpiTextMap[BeamboxPreference.read('engrave_dpi')],
    model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
    rotaryMode: BeamboxPreference.read('rotary_mode'),
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

const getTaskCode = (codeType: SwiftrayConvertType, taskOptions) =>
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
          Progress.update('fetch-task', { message: lang.message.uploading_fcode, percentage: 100 });
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
    message: lang.beambox.bottom_right_panel.convert_text_to_path_before_export,
  });

  // Convert text to path
  const res = await FontFuncs.tempConvertTextToPathAmongSvgContent();

  if (!res) {
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

  // Prepare for Printing task & clean up temp modification
  const revertShapesToImage = await convertShapeToBitmap();
  const revertAnnotatePrintingColor = annotatePrintingColor();
  const revertTempSplitFullColorLayers = await tempSplitFullColorLayers();
  const revertClipPath = await convertClipPath();
  const cleanUpTempModification = async () => {
    revertClipPath();
    revertTempSplitFullColorLayers();
    revertAnnotatePrintingColor();
    revertShapesToImage();
    await FontFuncs.revertTempConvert();
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
  let shouldUseFastGradient = BeamboxPreference.read('fast_gradient') !== false;
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

  const addOnInfo = getAddOnInfo(BeamboxPreference.read('workarea'));
  let codeType = opts.output || 'fcode';
  const { fgGcode = false } = opts;
  const isNonFGCode = codeType === 'gcode' && !fgGcode;
  const model = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
  const isPromark = promarkModels.has(model);

  if (isPromark) {
    codeType = 'gcode';
  }

  let taskConfig: IBaseConfig | IFcodeConfig = {
    enableAutoFocus: doesSupportDiodeAndAF && BeamboxPreference.read('enable-autofocus') && addOnInfo.autoFocus,
    enableDiode: doesSupportDiodeAndAF && BeamboxPreference.read('enable-diode') && addOnInfo.hybridLaser,
    isPromark,
    model,
    paddingAccel: await getAdorPaddingAccel(device || TopBarController.getSelectedDevice()),
    shouldMockFastGradient: isNonFGCode,
    shouldUseFastGradient: shouldUseFastGradient && !isNonFGCode,
    supportAccOverrideV1,
    supportJobOrigin,
    supportPwm,
    travelSpeed: isPromark ? controlConfig.travelSpeed : 100,
  };

  taskConfig = {
    ...taskConfig,
    ...getExportOpt(taskConfig).config,
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
    fileTimeCost,
    metadata,
    taskCodeBlob,
    thumbnail,
    thumbnailBlobURL,
  };
};

// Promark only
const fetchContourTaskCode = async (): Promise<null | string> => {
  if (!swiftrayClient.checkVersion('PROMARK_CONTOUR')) {
    return null;
  }

  let isCanceled = false;
  const revertVariableText = await convertVariableText();

  svgCanvas.removeUnusedDefs();
  SymbolMaker.switchImageSymbolForAll(false);
  Progress.openNonstopProgress({
    caption: i18n.lang.beambox.popup.progress.calculating,
    id: 'fetch-task-code',
    message: lang.beambox.bottom_right_panel.convert_text_to_path_before_export,
  });

  // Convert text to path
  const res = await FontFuncs.tempConvertTextToPathAmongSvgContent();

  if (!res) {
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
    await FontFuncs.revertTempConvert();
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

  if (BeamboxPreference.read('enable_mask')) {
    // Note: Swiftray only checks whether the key exists; the value is not used
    taskConfig.mask = true;
  }

  const { fileTimeCost, taskCodeBlob } = await getTaskCode('contour', taskConfig);

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

export { fetchContourTaskCode, fetchTaskCodeSwiftray };
