import { match } from 'ts-pattern';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { axiosFluxId } from '@core/helpers/api/flux-id';
import versionCompare from '@core/helpers/version-compare';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export default async function checkFirmware(device: IDeviceInfo): Promise<
  | {
      changelog_en: string;
      changelog_zh: string;
      downloadUrl: string;
      latestVersion: string;
      needUpdate: boolean;
    }
  | { needUpdate: false }
> {
  if (!navigator.onLine) {
    throw new Error('Offline');
  }

  try {
    const key = match<WorkAreaModel, string>(device.model)
      .with('ado1', () => 'ador-latest')
      .with('fhexa1', () => 'hexa-latest')
      .with('fbm2', () => 'beamo-ii-latest')
      .with('fhx2rf', () => 'hexa-rf-latest')
      .with('fbb2', () => 'nx-latest')
      .otherwise(() => 'firmware-latest');
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

    return { needUpdate: false };
  }
}
