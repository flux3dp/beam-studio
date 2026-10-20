import { LaserType } from '@core/app/constants/promark-constants';
import type { PromarkStore } from '@core/interfaces/Promark';

import {
  getDocumentLensProfile,
  getDocumentLensProfileKey,
  getLensProfileKeys,
  isSameLensParameters,
  mergeLensProfiles,
  normalizeLensProfileKey,
  resolveLensProfile,
  saveLensProfiles,
} from './lens-profiles';

const mockGet = jest.fn();
const mockUpdate = jest.fn();

jest.mock('./promark-data-store', () => ({
  get: (...args) => mockGet(...args),
  update: (...args) => mockUpdate(...args),
}));

const mockIsInnerEngravingActive = jest.fn();

jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  isInnerEngravingActive: () => mockIsInnerEngravingActive(),
}));

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => mockGetState() },
}));

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const uvInfo = { laserType: LaserType.UV, watt: 5 } as const;
const legacyField = { angle: 1, offsetX: 1, offsetY: 1 };
const innerField = { angle: 2, offsetX: 2, offsetY: 2 };
const flatField = { angle: 3, offsetX: 3, offsetY: 3 };

const store: PromarkStore = {
  field: legacyField,
  info: uvInfo,
  lensProfiles: [
    { field: innerField, innerEngraving: true, workarea: 70 },
    { field: flatField, innerEngraving: false, workarea: 70 },
  ],
};

describe('test lens-profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ workarea: 'fpm1' });
    mockGetWorkarea.mockReturnValue({ width: 70 });
    mockIsInnerEngravingActive.mockReturnValue(true);
  });

  test('inner engraving only exists on the 70 mm UV lens', () => {
    expect(normalizeLensProfileKey(LaserType.UV, { innerEngraving: true, workarea: 70 })).toEqual({
      innerEngraving: true,
      workarea: 70,
    });
    expect(normalizeLensProfileKey(LaserType.UV, { innerEngraving: true, workarea: 200 })).toEqual({
      innerEngraving: false,
      workarea: 200,
    });
    expect(normalizeLensProfileKey(LaserType.MOPA, { innerEngraving: true, workarea: 70 }).innerEngraving).toBe(false);
  });

  test('resolves an exact profile, then the default profile, the legacy set, then factory values', () => {
    expect(resolveLensProfile(store, { innerEngraving: true, workarea: 70 })).toMatchObject({
      field: innerField,
      source: 'exact',
    });
    expect(resolveLensProfile(store, { innerEngraving: false, workarea: 70 })).toMatchObject({
      field: flatField,
      source: 'exact',
    });
    expect(resolveLensProfile(store, { innerEngraving: false, workarea: 200 })).toMatchObject({
      field: legacyField,
      source: 'legacy',
    });
    expect(
      resolveLensProfile(
        { ...store, defaultLensProfile: { innerEngraving: false, workarea: 70 } },
        { innerEngraving: false, workarea: 200 },
      ),
    ).toMatchObject({ field: flatField, source: 'default' });
    // a default mark without its profile is ignored
    expect(
      resolveLensProfile(
        { ...store, defaultLensProfile: { innerEngraving: false, workarea: 200 } },
        { innerEngraving: false, workarea: 200 },
      ),
    ).toMatchObject({ field: legacyField, source: 'legacy' });
    expect(resolveLensProfile({ info: uvInfo }, { innerEngraving: false, workarea: 200 })).toEqual({
      key: { innerEngraving: false, workarea: 200 },
      source: 'fallback',
    });
  });

  test('lists every lens of a laser type', () => {
    expect(getLensProfileKeys(LaserType.UV)).toEqual([
      { innerEngraving: false, workarea: 70 },
      { innerEngraving: true, workarea: 70 },
      { innerEngraving: false, workarea: 200 },
    ]);
    expect(getLensProfileKeys(LaserType.MOPA)).toEqual([
      { innerEngraving: false, workarea: 110 },
      { innerEngraving: false, workarea: 150 },
      { innerEngraving: false, workarea: 220 },
    ]);
  });

  test('compares parameters with factory values filled in, whatever the field order', () => {
    expect(isSameLensParameters({}, { field: { angle: 0, offsetX: 0, offsetY: 0 } })).toBe(true);
    expect(
      isSameLensParameters(
        { field: { angle: 1, offsetX: 2, offsetY: 3 } },
        { field: { angle: 1, offsetX: 2, offsetY: 3 } },
      ),
    ).toBe(true);
    expect(isSameLensParameters({ field: innerField }, { field: flatField })).toBe(false);
    expect(
      isSameLensParameters(
        {
          galvoParameters: {
            x: { bulge: 1, scale: 80, skew: 1, trapezoid: 1 },
            y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
          },
        },
        {},
      ),
    ).toBe(false);
  });

  test('document key follows the work area and inner engraving toggle', () => {
    expect(getDocumentLensProfileKey(uvInfo)).toEqual({ innerEngraving: true, workarea: 70 });

    mockIsInnerEngravingActive.mockReturnValue(false);
    mockGetWorkarea.mockReturnValue({ width: 200 });
    expect(getDocumentLensProfileKey(uvInfo)).toEqual({ innerEngraving: false, workarea: 200 });
  });

  test('document key falls back to the default work area', () => {
    mockGetState.mockReturnValue({ workarea: 'fbm1' });
    mockIsInnerEngravingActive.mockReturnValue(false);
    expect(getDocumentLensProfileKey(uvInfo)).toEqual({ innerEngraving: false, workarea: 70 });

    mockGetState.mockReturnValue({ workarea: 'fpm1' });
    mockGetWorkarea.mockReturnValue({ width: 123 });
    expect(getDocumentLensProfileKey({ laserType: LaserType.MOPA, watt: 20 })).toEqual({
      innerEngraving: false,
      workarea: 110,
    });
  });

  test('getDocumentLensProfile reads the store of the serial', () => {
    mockGet.mockReturnValue(store);
    expect(getDocumentLensProfile('serial')).toMatchObject({ field: innerField, source: 'exact' });
    expect(mockGet).toHaveBeenCalledWith('serial');
  });

  test('mergeLensProfiles replaces profiles with the same key and copies the default into the legacy set', () => {
    const saved = { field: legacyField, innerEngraving: true, workarea: 70 };
    const merged = mergeLensProfiles(store, [saved], { innerEngraving: false, workarea: 70 });

    expect(merged.lensProfiles).toEqual([{ field: flatField, innerEngraving: false, workarea: 70 }, saved]);
    expect(merged.defaultLensProfile).toEqual({ innerEngraving: false, workarea: 70 });
    expect(merged.field).toEqual(flatField);
    expect(merged.galvoParameters).toEqual({
      x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
      y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
    });
    expect(merged.redDot).toEqual({ offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 });
    expect(merged.info).toBe(uvInfo);
  });

  test('saveLensProfiles writes the merged profiles, default and legacy set', () => {
    mockGet.mockReturnValue(store);

    const result = saveLensProfiles('serial', [{ field: legacyField, innerEngraving: false, workarea: 200 }], {
      innerEngraving: false,
      workarea: 200,
    });

    expect(mockGet).toHaveBeenCalledWith('serial');
    expect(mockUpdate).toHaveBeenCalledWith('serial', {
      defaultLensProfile: { innerEngraving: false, workarea: 200 },
      field: legacyField,
      galvoParameters: result.galvoParameters,
      lensProfiles: [...store.lensProfiles!, { field: legacyField, innerEngraving: false, workarea: 200 }],
      redDot: result.redDot,
    });
  });
});
