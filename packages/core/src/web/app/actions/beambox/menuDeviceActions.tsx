import React from 'react';

import Alert from '@core/app/actions/alert-caller';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import exportFuncs from '@core/app/actions/beambox/export-funcs';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import MonitorController from '@core/app/actions/monitor-controller';
import ProgressCaller from '@core/app/actions/progress-caller';
import { calibrateCamera, showModuleCalibration } from '@core/app/components/dialogs/camera';
import { parsingChipData } from '@core/app/components/dialogs/CartridgeSettingPanel';
import { showDiodeCalibration } from '@core/app/components/dialogs/DiodeCalibration';
import { showPromarkSettings } from '@core/app/components/dialogs/promark/PromarkSettings';
import { showZAxisAdjustment } from '@core/app/components/dialogs/promark/ZAxisAdjustment';
import { showUploadFirmwareDialog } from '@core/app/components/dialogs/updateFirmware';
import AlertConstants from '@core/app/constants/alert-constants';
import { InkDetectionStatus } from '@core/app/constants/layer-module/ink-cartridge';
import type { DetectedLayerModuleType, LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { Mode } from '@core/app/constants/monitor-constants';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { downloadCameraData, uploadCameraData } from '@core/helpers/device/camera-data-backup';
import { checkBlockedSerial } from '@core/helpers/device/checkBlockedSerial';
import checkFirmware from '@core/helpers/device/updateFirmware/checkFirmware';
import firmwareUpdater from '@core/helpers/device/updateFirmware/firmwareUpdater';
import DeviceMaster from '@core/helpers/device-master';
import { getOS } from '@core/helpers/getOS';
import { checkIsAtEditor } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import { getDetectedModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import { extractVariableText } from '@core/helpers/variableText';
import VersionChecker from '@core/helpers/version-checker';
import dialog from '@core/implementations/dialog';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const calibrateModule = async (device: IDeviceInfo, module?: LayerModuleType) => {
  if (!checkIsAtEditor()) return;

  try {
    const deviceStatus = await checkDeviceStatus(device);

    if (!deviceStatus) {
      return;
    }

    const res = await DeviceMaster.select(device);

    if (res.success) {
      showModuleCalibration(module);
    }
  } catch (error) {
    console.error(error);
  }
};

export const executeFirmwareUpdate = async (device: IDeviceInfo): Promise<void> => {
  const { lang } = i18n;
  const updateFirmware = async () => {
    try {
      const response = await checkFirmware(device);
      const latestVersion = device.version;
      const { caption, message } = lang.update.firmware.latest_firmware;

      MessageCaller.openMessage({
        content: lang.update.software.checking,
        duration: 1,
        key: 'checking-firmware',
        level: MessageLevel.SUCCESS,
      });

      if (!response.needUpdate) {
        Alert.popUp({
          buttonLabels: [lang.update.firmware.latest_firmware.still_update],
          buttonType: AlertConstants.CUSTOM_CANCEL,
          callbacks: () => {
            firmwareUpdater(response, device, true);
          },
          caption,
          id: 'latest-firmware',
          message: `${message} (v${latestVersion})`,
          onCancel: () => {},
        });
      } else {
        firmwareUpdater(response, device);
      }
    } catch {
      Alert.popUp({
        id: 'cant-get-latest-firmware',
        message: lang.update.firmware.latest_firmware.cant_get_latest,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    }
  };
  const checkStatus = () => {
    ProgressCaller.openNonstopProgress({ caption: lang.update.preparing, id: 'check-status' });
    ProgressCaller.popById('check-status');
    MessageCaller.openMessage({
      content: lang.update.software.checking,
      duration: 10,
      key: 'checking-firmware',
      level: MessageLevel.LOADING,
    });
    updateFirmware();
  };
  // TODO: Handle the error better (output eresp)
  const vc = VersionChecker(device.version);

  if (!vc.meetRequirement('UPDATE_BY_SOFTWARE')) {
    Alert.popUp({ id: 'update-firmware', message: lang.update.firmware.firmware_too_old_update_by_sdcard });

    return;
  }

  try {
    const res = await DeviceMaster.select(device);

    if (res.success) {
      checkStatus();
    }
  } catch (resp) {
    console.error(resp);

    Alert.popUp({
      id: 'exec-fw-update',
      message: resp as string,
      type: AlertConstants.SHOW_POPUP_ERROR,
    });
  }
};

const getLog = async (device: IDeviceInfo, log: string) => {
  try {
    const res = await DeviceMaster.select(device);

    if (res.success) {
      ProgressCaller.openSteppingProgress({ id: 'get_log', message: 'downloading' });
      try {
        const file = await DeviceMaster.downloadLog(log, async (progress: { completed: number; size: number }) => {
          ProgressCaller.update('get_log', {
            message: 'downloading',
            percentage: (progress.completed / progress.size) * 100,
          });
        });

        ProgressCaller.popById('get_log');

        const getContent = async () => file[1] as Blob;

        await dialog.writeFileDialog(getContent, log, log, [
          {
            extensions: ['log'],
            name: getOS() === 'MacOS' ? 'log (*.log)' : 'log',
          },
        ]);
      } catch (errorData) {
        ProgressCaller.popById('get_log');

        const msg =
          errorData === 'canceled'
            ? i18n.lang.topmenu.device.download_log_canceled
            : i18n.lang.topmenu.device.download_log_error;

        Alert.popUp({
          message: msg,
          type: AlertConstants.SHOW_POPUP_INFO,
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const backUpCalibrationData = async (device: IDeviceInfo, type: 'download' | 'upload') => {
  const vc = VersionChecker(device.version);

  if (!vc.meetRequirement('ADOR_STATIC_FILE_ENTRY')) {
    Alert.popUpError({
      message: 'tPlease update firmware.',
    });

    return;
  }

  try {
    const res = await DeviceMaster.select(device);

    if (res.success) {
      if (type === 'download') {
        downloadCameraData(device.name);
      } else {
        uploadCameraData();
      }
    }
  } catch (e) {
    console.error(e);
  }
};

export default {
  CALIBRATE_BEAMBOX_CAMERA: async (device: IDeviceInfo): Promise<void> => {
    if (!checkIsAtEditor()) return;

    calibrateCamera(device);
  },
  CALIBRATE_BEAMBOX_CAMERA_BORDERLESS: async (device: IDeviceInfo): Promise<void> => {
    if (!checkIsAtEditor()) return;

    const vc = VersionChecker(device.version);
    const isAvailableVersion = vc.meetRequirement('BORDERLESS_MODE');

    if (isAvailableVersion) {
      calibrateCamera(device, { isBorderless: true });
    } else {
      const langCameraCali = i18n.lang.calibration;
      const message = `${langCameraCali.update_firmware_msg1} 2.5.1 ${langCameraCali.update_firmware_msg2}`;

      Alert.popUp({
        message,
        type: AlertConstants.SHOW_POPUP_INFO,
      });
    }
  },
  CALIBRATE_CAMERA_ADVANCED: async (device: IDeviceInfo): Promise<void> => {
    if (!checkIsAtEditor()) return;

    calibrateCamera(device, { isAdvanced: true });
  },
  CALIBRATE_CAMERA_V2_FACTORY: async (device: IDeviceInfo): Promise<void> => {
    if (!checkIsAtEditor()) return;

    calibrateCamera(device, { factoryMode: true });
  },
  CALIBRATE_CAMERA_WIDE_ANGLE: async (device: IDeviceInfo): Promise<void> => {
    if (!checkIsAtEditor()) return;

    calibrateCamera(device, { isWideAngle: true });
  },
  CALIBRATE_DIODE_MODULE: async (device: IDeviceInfo): Promise<void> => {
    if (!checkIsAtEditor()) return;

    const vc = VersionChecker(device.version);
    const diodeAvailable = vc.meetRequirement('DIODE_AND_AUTOFOCUS');

    if (diodeAvailable) {
      try {
        const res = await DeviceMaster.select(device);

        if (res.success) {
          showDiodeCalibration(device);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      const langDiodeCali = i18n.lang.calibration;
      const message = `${langDiodeCali.update_firmware_msg1} 3.0.0 ${langDiodeCali.update_firmware_msg2}`;

      Alert.popUp({
        message,
        type: AlertConstants.SHOW_POPUP_INFO,
      });
    }
  },
  CALIBRATE_IR_MODULE: async (device: IDeviceInfo): Promise<void> => {
    calibrateModule(device, LayerModule.LASER_1064);
  },
  CALIBRATE_PRINTER_4C_MODULE: async (device: IDeviceInfo): Promise<void> => {
    calibrateModule(device, LayerModule.PRINTER_4C);
  },
  CALIBRATE_PRINTER_MODULE: async (device: IDeviceInfo): Promise<void> => {
    calibrateModule(device, LayerModule.PRINTER);
  },
  CALIBRATE_UV_VARNISH_MODULE: async (device: IDeviceInfo): Promise<void> => {
    calibrateModule(device, LayerModule.UV_VARNISH);
  },
  CALIBRATE_UV_WHITE_INK_MODULE: async (device: IDeviceInfo): Promise<void> => {
    calibrateModule(device, LayerModule.UV_WHITE_INK);
  },
  CARTRIDGE_CHIP_SETTING: async (device: IDeviceInfo): Promise<void> => {
    const res = await DeviceMaster.select(device);

    if (!res.success) {
      return;
    }

    if (!(await checkDeviceStatus(device))) return;

    ProgressCaller.openNonstopProgress({
      id: 'fetch-cartridge-data',
      message: 'Fetching Cartridge Data',
    });

    let inkLevel = 1;

    try {
      const deviceDetailInfo = await DeviceMaster.getDeviceDetailInfo();
      const headSubmoduleInfo = JSON.parse(deviceDetailInfo.head_submodule_info) as {
        color: string;
        ink_level: number;
        serial_number: string;
        state: InkDetectionStatus;
        type: string;
      };

      inkLevel = headSubmoduleInfo.ink_level;
    } catch {
      /* do nothing */
    }
    try {
      await DeviceMaster.enterCartridgeIOMode();

      const chipDataRes = await DeviceMaster.getCartridgeChipData();

      if (chipDataRes.status === 'ok') {
        const parsed = parsingChipData(chipDataRes.data.result);

        Dialog.showCartridgeSettingPanel(parsed, inkLevel);
      } else {
        Alert.popUp({
          id: 'cant-get-chip-data',
          message: `Failed to get chip data: ${JSON.stringify(chipDataRes)}`,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
      }
    } catch {
      await DeviceMaster.endSubTask();
    } finally {
      ProgressCaller.popById('fetch-cartridge-data');
    }
  },
  CONNECTION_TEST: async (device: IDeviceInfo): Promise<void> => {
    Dialog.showConnectionTest(device);
  },
  DASHBOARD: async (device: IDeviceInfo): Promise<void> => {
    Dialog.popDialogById('monitor');

    const serialOk = await checkBlockedSerial(device.serial);

    if (!serialOk) {
      return;
    }

    const res = await DeviceMaster.select(device);

    if (res.success) {
      const vtElemHandler = extractVariableText(false) ?? undefined;
      const isPromark = promarkModels.has(device.model);
      const isIdle = device.st_id <= 0;
      const previewTask = isIdle && isPromark ? exportFuncs.getCachedPromarkTask(device.serial) : undefined;

      await MonitorController.showMonitor(
        device,
        previewTask ? Mode.PREVIEW : isIdle && !isPromark ? Mode.FILE : Mode.WORKING,
        previewTask,
        undefined,
        undefined,
        vtElemHandler,
      );
    }
  },
  DOWNLOAD_CALIBRATION_DATA: async (device: IDeviceInfo): Promise<void> => {
    backUpCalibrationData(device, 'download');
  },
  LOG_CAMERA: (device: IDeviceInfo): void => {
    getLog(device, 'fluxcamerad.log');
  },
  LOG_DISCOVER: (device: IDeviceInfo): void => {
    getLog(device, 'fluxupnpd.log');
  },
  LOG_HARDWARE: (device: IDeviceInfo): void => {
    getLog(device, 'fluxhald.log');
  },
  LOG_NETWORK: (device: IDeviceInfo): void => {
    getLog(device, 'fluxnetworkd.log');
  },
  LOG_PLAYER: (device: IDeviceInfo): void => {
    const vc = VersionChecker(device.version);

    if (vc.meetRequirement('NEW_PLAYER')) {
      getLog(device, 'playerd.log');
    } else {
      getLog(device, 'fluxplayerd.log');
    }
  },
  LOG_ROBOT: (device: IDeviceInfo): void => {
    getLog(device, 'fluxrobotd.log');
  },
  LOG_USB: (device: IDeviceInfo): void => {
    getLog(device, 'fluxusbd.log');
  },
  LOG_USBLIST: async (device: IDeviceInfo): Promise<void> => {
    const res = await DeviceMaster.select(device);

    if (res.success) {
      const data = await DeviceMaster.lsusb();

      Alert.popUp({
        caption: i18n.lang.topmenu.device.log.usblist,
        message: data.usbs.join('\n'),
        type: AlertConstants.SHOW_POPUP_INFO,
      });
    }
  },
  MACHINE_INFO: async (device: IDeviceInfo): Promise<void> => {
    const isAdor = constant.adorModels.includes(device.model);
    const { lang } = i18n;
    let subModuleInfo = null;

    if (isAdor) {
      try {
        await DeviceMaster.select(device);

        const deviceDetailInfo = await DeviceMaster.getDeviceDetailInfo();
        const headType = Number.parseInt(deviceDetailInfo.head_type, 10) as DetectedLayerModuleType;
        const headSubmoduleInfo = JSON.parse(deviceDetailInfo.head_submodule_info);

        console.log(headSubmoduleInfo);

        const moduleName = getDetectedModulesTranslations()[headType] || lang.layer_module.unknown;
        const {
          color,
          ink_level: inkLevel,
          serial_number: serialNumber,
          state,
          type,
        } = headSubmoduleInfo as {
          color: string;
          ink_level: number;
          serial_number: string;
          state: InkDetectionStatus;
          type: string;
        };

        subModuleInfo = (
          <div>
            <br />
            <div>
              {lang.device.submodule_type}: {moduleName}
            </div>
            <br />
            {headType === LayerModule.PRINTER && (
              <>
                {state === InkDetectionStatus.PENDING && <div>{lang.device.close_door_to_read_cartridge_info}</div>}
                {state === InkDetectionStatus.FAILED && <div>{lang.device.cartridge_info_read_failed}</div>}
                {state === InkDetectionStatus.VALIDATE_FAILED && (
                  <div>{lang.device.cartridge_info_verification_failed}</div>
                )}
                {[InkDetectionStatus.SUCCESS, InkDetectionStatus.UNUSED].includes(state) && (
                  <>
                    <div>
                      {lang.device.cartridge_serial_number}: {serialNumber ?? '-'}
                    </div>
                    <div>
                      {lang.device.ink_color}: {color}
                    </div>
                    <div>
                      {lang.device.ink_type}: {type}
                    </div>
                    <div>
                      {lang.device.ink_level}: {Math.round((InkDetectionStatus.UNUSED ? 1 : inkLevel) * 100)}%
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      } catch (error) {
        console.log(error);
      }
    }

    const info = (
      <div>
        <div>
          {lang.device.model_name}: {device.model.toUpperCase()}
        </div>
        <div>
          {lang.device.IP}: {device.ipaddr}
        </div>
        <div>
          {lang.device.serial_number}: {device.serial}
        </div>
        <div>
          {lang.device.firmware_version}: {device.version}
        </div>
        <div>
          {lang.device.UUID}: {device.uuid}
        </div>
        {subModuleInfo}
      </div>
    );

    Alert.popUp({
      buttonLabels: [lang.topmenu.device.network_test, lang.global.ok],
      callbacks: [() => Dialog.showNetworkTestingPanel(device.ipaddr), () => {}],
      caption: device.name,
      id: 'machine-info',
      message: info,
      primaryButtonIndex: 1,
      type: AlertConstants.SHOW_POPUP_INFO,
    });
  },
  PROMARK_SETTINGS: async (device: IDeviceInfo): Promise<void> => {
    showPromarkSettings(device);
  },
  UPDATE_FIRMWARE: async (device: IDeviceInfo): Promise<void> => {
    if (await checkDeviceStatus(device)) {
      executeFirmwareUpdate(device);
    }
  },
  UPDATE_MAINBOARD: async (device: IDeviceInfo): Promise<void> => {
    if (await checkDeviceStatus(device)) {
      showUploadFirmwareDialog(device, 'mainboard');
    }
  },
  UPDATE_PRINTER_BOARD: async (device: IDeviceInfo): Promise<void> => {
    if (await checkDeviceStatus(device)) {
      showUploadFirmwareDialog(device, 'headboard');
    }
  },
  UPLOAD_CALIBRATION_DATA: async (device: IDeviceInfo): Promise<void> => {
    backUpCalibrationData(device, 'upload');
  },
  Z_AXIS_ADJUSTMENT: async (device: IDeviceInfo): Promise<void> => {
    showZAxisAdjustment(device);
  },
};
