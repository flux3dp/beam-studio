import { LaserType } from '@core/app/constants/promark-constants';
import type { PromarkStore } from '@core/interfaces/Promark';

import { getLensProfileKeys, resolveLensProfile } from './lens-profiles';
import {
  getCloudLensParameters,
  getLensCloudDifferences,
  hasLensCloudDifferences,
  readLensCloudData,
  uploadLensCloudData,
} from './lens-profiles-cloud';

jest.mock('@core/app/stores/documentStore', () => ({ useDocumentStore: { getState: () => ({}) } }));
jest.mock('@core/helpers/addOn/innerEngraving', () => ({ isInnerEngravingActive: () => false }));

const mockReadCloudConfigs = jest.fn();
const mockUpdateCloudConfigs = jest.fn();

jest.mock('@core/helpers/api/flux-id/cloudConfig', () => ({
  readCloudConfigs: (...args) => mockReadCloudConfigs(...args),
  updateCloudConfigs: (...args) => mockUpdateCloudConfigs(...args),
}));

const fieldA = { angle: 1, offsetX: 1, offsetY: 1 };
const fieldB = { angle: 2, offsetX: 2, offsetY: 2 };
const flat70 = { innerEngraving: false, workarea: 70 };
const inner70 = { innerEngraving: true, workarea: 70 };
const flat200 = { innerEngraving: false, workarea: 200 };
const keys = getLensProfileKeys(LaserType.UV);

const store: PromarkStore = {
  defaultLensProfile: flat70,
  field: fieldA,
  lensProfiles: [
    { ...flat70, field: fieldA },
    { ...flat200, field: fieldA },
  ],
};
const getLocal = (key) => resolveLensProfile(store, key, LaserType.UV);

describe('test lens-profiles-cloud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reads both keys in one request', async () => {
    mockReadCloudConfigs.mockResolvedValueOnce({
      promarkLens: { field: fieldA },
      promarkLensProfiles: { defaultKey: flat70, profiles: [] },
    });

    expect(await readLensCloudData('hash', 'serial')).toEqual({
      defaultKey: flat70,
      legacy: { field: fieldA },
      profiles: [],
    });
    expect(mockReadCloudConfigs).toHaveBeenCalledWith({
      hash: 'hash',
      keys: ['promarkLensProfiles', 'promarkLens'],
      serialNumber: 'serial',
    });
  });

  test('resolves null when the cloud has nothing or the request failed', async () => {
    mockReadCloudConfigs.mockResolvedValueOnce({});
    expect(await readLensCloudData('hash', 'serial')).toBeNull();
    mockReadCloudConfigs.mockResolvedValueOnce(null);
    expect(await readLensCloudData('hash', 'serial')).toBeNull();
  });

  test('the cloud legacy set stands for every lens only while neither side has profiles', () => {
    expect(getCloudLensParameters({ legacy: { field: fieldB } }, {}, flat200)).toEqual({ field: fieldB });
    expect(getCloudLensParameters({ legacy: { field: fieldB } }, store, flat200)).toBeUndefined();
    expect(getCloudLensParameters({ legacy: { field: fieldB }, profiles: [] }, {}, flat200)).toBeUndefined();
    expect(getCloudLensParameters({ profiles: [{ ...flat200, field: fieldB }] }, store, flat200)).toEqual({
      ...flat200,
      field: fieldB,
    });
  });

  test('lists the lenses whose cloud copy differs, but not those only saved locally', () => {
    const differences = getLensCloudDifferences(
      {
        defaultKey: flat70,
        profiles: [
          { ...flat70, field: fieldA },
          { ...inner70, field: fieldB },
        ],
      },
      store,
      keys,
      getLocal,
    );

    expect(differences).toEqual({ defaultKey: false, keys: [inner70], legacy: false });
    expect(hasLensCloudDifferences(differences)).toBe(true);
  });

  test('the same cloud copy has no difference', () => {
    const differences = getLensCloudDifferences(
      { defaultKey: flat70, profiles: [{ ...flat70, field: fieldA }] },
      store,
      keys,
      getLocal,
    );

    expect(hasLensCloudDifferences(differences)).toBe(false);
  });

  test('a different default is a difference', () => {
    expect(getLensCloudDifferences({ defaultKey: flat200, profiles: [] }, store, keys, getLocal).defaultKey).toBe(true);
  });

  test('the cloud legacy set is compared only while nothing local has profiles', () => {
    const legacyStore = { field: fieldA };

    expect(getLensCloudDifferences({ legacy: { field: fieldA } }, legacyStore, keys, getLocal).legacy).toBe(false);
    expect(getLensCloudDifferences({ legacy: { field: fieldB } }, legacyStore, keys, getLocal).legacy).toBe(true);
    expect(hasLensCloudDifferences(getLensCloudDifferences({ legacy: { field: fieldB } }, store, keys, getLocal))).toBe(
      false,
    );
  });

  test('a default saved under another laser type is no difference', () => {
    expect(
      getLensCloudDifferences(
        { defaultKey: { innerEngraving: false, workarea: 220 }, profiles: [] },
        store,
        keys,
        getLocal,
      ).defaultKey,
    ).toBe(false);
    expect(
      getLensCloudDifferences(
        { defaultKey: flat70, profiles: [] },
        { ...store, defaultLensProfile: { innerEngraving: false, workarea: 220 } },
        keys,
        getLocal,
      ).defaultKey,
    ).toBe(true);
  });

  test('uploads the profiles and laser source in one request, never the legacy set', async () => {
    const info = { laserType: LaserType.UV, watt: 5 };

    mockUpdateCloudConfigs.mockResolvedValue(true);
    expect(await uploadLensCloudData({ hash: 'hash', info, model: 'fpm1', serial: 'serial', store })).toBe(true);
    expect(mockUpdateCloudConfigs).toHaveBeenCalledWith({
      configs: {
        promarkLaserSource: info,
        promarkLensProfiles: { defaultKey: flat70, profiles: store.lensProfiles },
      },
      hash: 'hash',
      model: 'fpm1',
      serialNumber: 'serial',
    });
  });
});
