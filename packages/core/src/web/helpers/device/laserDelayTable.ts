import deviceMaster from '@core/helpers/device-master';

export type LaserDelayTable = Record<string, number>;

// Workaround: S10000 is not a real speed, it is used as a version marker. Its value must be
// larger than 1000 (we use 1001) so it can be distinguished from real delay values. When the
// user updates the delay table, the marker is stamped onto the table so we can detect that the
// device already has a (newer) delay table and avoid overriding it with the default one.
export const DELAY_TABLE_VERSION_KEY = 'S10000';
export const DELAY_TABLE_VERSION_VALUE = 1001;

export const getLaserDelayTable = async (): Promise<LaserDelayTable> => {
  const res = await deviceMaster.getDeviceSetting('laser_delay');

  if (res.status !== 'ok') {
    throw new Error(JSON.stringify(res));
  }

  // The firmware returns a python dict repr using single quotes.
  return JSON.parse(res.value.replace(/'/g, '"')) as LaserDelayTable;
};

export const setLaserDelayTable = async (table: LaserDelayTable): Promise<void> => {
  // Parsing for shlex.split in python in ghost and firmware, ('\\\"' => '\"' (ghost) => '"' (firmware))
  await deviceMaster.setDeviceSetting('laser_delay', JSON.stringify(table).replaceAll('"', '\\\\\\"'));
};
