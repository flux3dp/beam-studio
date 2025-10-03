import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

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
