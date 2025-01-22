import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { axiosFluxId } from './api/flux-id';
import versionCompare from './version-compare';

export default async function checkFirmware(
  device: IDeviceInfo,
): Promise<{ [key: string]: boolean | string; needUpdate: boolean }> {
  if (!navigator.onLine) {
    throw new Error('Offline');
  }

  try {
    const key =
      {
        ado1: 'ador-latest',
        fhexa1: 'hexa-latest',
      }[device.model.toLowerCase()] || 'firmware-latest';
    const resp = await axiosFluxId.get(`api/check-update?key=${key}`);

    console.log(resp);

    const { data } = resp;
    const latestVersion = data.links[0];
    const [name, link] = latestVersion;
    const version = name.split(' ').pop();
    const needUpdate = versionCompare(device.version, version);

    return {
      changelog_en: name,
      changelog_zh: name,
      downloadUrl: link,
      latestVersion: version,
      needUpdate,
    };
  } catch (err) {
    console.error('Error when getting latest firmware version', err);

    return {
      needUpdate: false,
    };
  }
}
