import { match } from 'ts-pattern';

import dialogCaller from '@core/app/actions/dialog-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { uploadToDevice } from '@core/helpers/device/updateFirmware/upload';
import i18n from '@core/helpers/i18n';
import type { FirmwareType, IDeviceInfo } from '@core/interfaces/IDevice';

import FirmwareUpdate from './FirmwareUpdate';

export const showFirmwareUpdateDialog = (
  device: IDeviceInfo,
  updateInfo: {
    changelog_en: string;
    changelog_zh: string;
    latestVersion: string;
  },
  onDownload: () => void,
  onInstall: () => void,
): void => {
  if (isIdExist('update-dialog')) {
    return;
  }

  const { model, name, version } = device;
  const releaseNode = i18n.getActiveLang() === 'zh-tw' ? updateInfo.changelog_zh : updateInfo.changelog_en;

  addDialogComponent(
    'update-dialog',
    <FirmwareUpdate
      currentVersion={version}
      deviceModel={model}
      deviceName={name}
      latestVersion={updateInfo.latestVersion}
      onClose={() => popDialogById('update-dialog')}
      onDownload={onDownload}
      onInstall={onInstall}
      releaseNote={releaseNode}
    />,
  );
};

export const showUploadFirmwareDialog = (device: IDeviceInfo, type: FirmwareType) => {
  const t = i18n.lang.update.firmware;
  const title = match(type)
    .with('firmware', () => t.upload_firmware_title)
    .with('mainboard', () => t.upload_mainboard_title)
    .with('headboard', () => t.upload_printer_board_title)
    .exhaustive();

  dialogCaller.showInputLightbox('upload-firmware', {
    caption: title,
    confirmText: t.confirm,
    onSubmit: (files: FileList) => uploadToDevice(device, files.item(0)!, type),
    type: 'file',
  });
};
