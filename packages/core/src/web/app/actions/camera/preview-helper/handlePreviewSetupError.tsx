import { CameraOutlined, UploadOutlined } from '@ant-design/icons';

import alertCaller from '@core/app/actions/alert-caller';
import { showCalibrateCamera } from '@core/app/actions/dialog-controller';
import { backUpCalibrationData } from '@core/helpers/device/camera/backUpCalibrationData';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import CalibrationDataMissingError from './CalibrationDataMissingError';

const handlePreviewSetupError = (device: IDeviceInfo, error: unknown): void => {
  const { lang } = i18n;

  if (error instanceof CalibrationDataMissingError) {
    alertCaller.popUp({
      buttons: [
        {
          isLeft: true,
          label: lang.alert.cancel,
        },
        {
          icon: <UploadOutlined />,
          label: lang.topbar.menu.import_calibration_data,
          onClick: () => backUpCalibrationData(device, 'upload'),
          type: 'primary',
        },
        {
          icon: <CameraOutlined />,
          label: lang.topbar.menu.calibrate_beambox_camera,
          onClick: () => showCalibrateCamera(device, { isAdvanced: true }),
          type: 'primary',
        },
      ],
      caption: lang.message.camera.calibration_data_missing,
      message: lang.message.camera.calibration_data_missing_message,
    });
  } else if (error instanceof Error && error.message.startsWith('Camera WS')) {
    alertCaller.popUpError({
      message: `${lang.topbar.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
    });
  } else {
    alertCaller.popUpError({
      message: `${lang.topbar.alerts.fail_to_start_preview}<br/>${error instanceof Error ? error.message : ''}`,
    });
  }
};

export default handlePreviewSetupError;
