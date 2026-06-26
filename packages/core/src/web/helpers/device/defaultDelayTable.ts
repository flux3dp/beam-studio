import storage from '@core/implementations/storage';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import {
  DELAY_TABLE_VERSION_KEY,
  DELAY_TABLE_VERSION_VALUE,
  getLaserDelayTable,
  type LaserDelayTable,
  setLaserDelayTable,
} from './laserDelayTable';

const YONG_LI_SERIALS = ['FLYP131B3M', 'FLBZBJYJFG', 'FLPLUR8W8A', 'FLCP6T3UAS', 'FLEMC41A7J'];

export const setDefaultDelayTable = async (device: IDeviceInfo) => {
  if (!YONG_LI_SERIALS.includes(device.serial)) {
    return;
  }

  const writtenSerials = storage.get('yongli-written-serials') || [];

  if (writtenSerials.includes(device.serial)) {
    return;
  }

  try {
    // Read the current delay table first: if the version marker is already present, the device
    // already has a delay table updated by the user, so skip writing the default table.
    try {
      const currentDelayTable = await getLaserDelayTable();

      if (currentDelayTable[DELAY_TABLE_VERSION_KEY] !== undefined) {
        storage.set('yongli-written-serials', [...writtenSerials, device.serial]);

        return;
      }
    } catch (error) {
      // Reading failed (e.g. setting not present yet); fall through to write the default table.
      console.error(`Failed to read laser delay table for device ${device.serial}:`, error);
    }

    const defaultDelayTable: LaserDelayTable = {};

    for (let i = 100; i <= 2000; i += 100) {
      defaultDelayTable[`S${i}`] = 1500;
    }
    defaultDelayTable[DELAY_TABLE_VERSION_KEY] = DELAY_TABLE_VERSION_VALUE;

    await setLaserDelayTable(defaultDelayTable);
    storage.set('yongli-written-serials', [...writtenSerials, device.serial]);
  } catch (error) {
    console.error(`Failed to set default delay table for device ${device.serial}:`, error);
  }
};
