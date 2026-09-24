import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useStorageStore } from '@core/app/stores/storageStore';

import { getPresetDisplayParams } from './presetDisplayParams';

const context = { model: 'fbb2' as const, module: LayerModule.LASER_UNIVERSAL };
const speedPill = (values: Parameters<typeof getPresetDisplayParams>[0]) =>
  getPresetDisplayParams(values, context).find(({ label }) => label === 'Speed')!.value;

describe('getPresetDisplayParams', () => {
  afterEach(() => useStorageStore.getState().set('default-units', 'mm'));

  test('speed follows default-units like SpeedBlock (mm/s vs in/s, 2 decimals)', () => {
    expect(speedPill({ power: 50, speed: 25.4 })).toBe('25.4 mm/s');

    useStorageStore.getState().set('default-units', 'inches');
    expect(speedPill({ power: 50, speed: 25.4 })).toBe('1 in/s');
    expect(speedPill({ power: 50, speed: 7 })).toBe('0.28 in/s');
  });
});
