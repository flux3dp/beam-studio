const mockIsMaterialBrowserActive = jest.fn(() => true);

jest.mock('@core/helpers/materials/isMaterialBrowserActive', () => ({
  isMaterialBrowserActive: () => mockIsMaterialBrowserActive(),
}));

import { MY_MATERIALS_ID, RECENTS_LIMIT } from '@core/app/constants/material-catalog/constants';
import * as storageStore from '@core/app/stores/storageStore';
import type { Material } from '@core/interfaces/IMaterial';

import { initMaterialStore, resetMaterialStoreInit, useMaterialStore } from './index';
import { convertLegacyPresets } from './migration';

const userMaterial = (id: string, overrides: Partial<Material> = {}): Material => ({
  category: 'wood',
  id,
  name: id,
  presets: [],
  source: 'user',
  ...overrides,
});

const resetStorage = () => {
  storageStore.useStorageStore.getState().update({
    'material-favorites': undefined,
    'material-recents': undefined,
    materials: undefined,
    presets: [],
  } as never);
};

describe('materialStore actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStorage();
    resetMaterialStoreInit();
  });

  test('ensureBucket creates the bucket once', () => {
    const store = useMaterialStore.getState();
    const bucket = store.ensureBucket();

    expect(bucket.id).toBe(MY_MATERIALS_ID);
    expect(useMaterialStore.getState().ensureBucket()).toEqual(bucket);
    expect(useMaterialStore.getState().userMaterials.filter(({ id }) => id === MY_MATERIALS_ID)).toHaveLength(1);
  });

  test('updatePreset edits user presets in place', () => {
    useMaterialStore.getState().addMaterial(userMaterial('m1'));
    useMaterialStore.getState().addPreset('m1', {
      id: 'p1',
      name: 'Cut',
      origin: 'user',
      settings: { '*': { '*': { power: 50, speed: 10 } } },
    });
    useMaterialStore.getState().updatePreset('p1', '*', '*', { name: 'Deep Cut', power: 80, speed: 5 });

    const preset = useMaterialStore.getState().userPresets[0];

    expect(preset.name).toBe('Deep Cut');
    expect(preset.settings['*']!['*']).toEqual({ power: 80, speed: 5 });
    expect(useMaterialStore.getState().presetOverrides).toEqual({});
  });

  test('updatePreset writes back to the cell the context resolves from', () => {
    useMaterialStore.getState().addMaterial(userMaterial('m1'));
    // From-layer presets are module-specific: settings['*']['15']
    useMaterialStore.getState().addPreset('m1', {
      id: 'p1',
      name: 'From Layer',
      origin: 'user',
      settings: { '*': { '15': { power: 50 } } },
    });
    useMaterialStore.getState().updatePreset('p1', 'fbb2', '15', { power: 70 });

    const preset = useMaterialStore.getState().userPresets[0];

    expect(preset.settings['*']!['15']).toEqual({ power: 70 });
    expect(preset.settings.fbb2).toBeUndefined();
  });

  test('updatePreset on a catalog preset writes an overlay; restorePreset removes it', () => {
    useMaterialStore.getState().updatePreset('wood_3mm_cutting', 'fbb2', '15', { power: 60 });

    expect(useMaterialStore.getState().presetOverrides.wood_3mm_cutting!.fbb2!['15']).toEqual({ power: 60 });

    useMaterialStore.getState().restorePreset('wood_3mm_cutting');
    expect(useMaterialStore.getState().presetOverrides.wood_3mm_cutting).toBeUndefined();
  });

  test('togglePresetDisabled round-trip', () => {
    useMaterialStore.getState().togglePresetDisabled('wood_engraving');
    expect(useMaterialStore.getState().disabledPresetIds).toContain('wood_engraving');
    useMaterialStore.getState().togglePresetDisabled('wood_engraving');
    expect(useMaterialStore.getState().disabledPresetIds).not.toContain('wood_engraving');
  });

  test('duplicateMaterial deep-copies parent and variants as user content', () => {
    const source: Material = {
      category: 'acrylic',
      id: 'glitter',
      name: 'Glitter Acrylic',
      presets: [{ id: 'cat_p', legacyKey: 'x', name: 'Cutting', origin: 'default', settings: {} }],
      shopLinks: { us: 'https://shop' },
    };
    const variant: Material = { ...source, id: 'glitter-3mm', parentId: 'glitter', presets: [] };
    const copy = useMaterialStore.getState().duplicateMaterial(source, [variant]);

    const { userMaterials, userPresets } = useMaterialStore.getState();

    expect(userMaterials).toHaveLength(2);
    expect(copy.source).toBe('user');
    expect(copy.shopLinks).toBeUndefined();

    const copiedPreset = userPresets.find(({ materialId }) => materialId === copy.id)!;

    expect(copiedPreset.origin).toBe('user');
    expect(copiedPreset.id).not.toBe('cat_p');
    expect(copiedPreset.legacyKey).toBeUndefined();
    expect(userMaterials[1].parentId).toBe(copy.id);
  });

  test('movePreset re-files a user preset with id unchanged', () => {
    useMaterialStore.getState().addMaterial(userMaterial('m1'));
    useMaterialStore.getState().addMaterial(userMaterial('m2'));
    useMaterialStore.getState().addPreset('m1', { id: 'p1', name: 'Cut', origin: 'user', settings: {} });
    useMaterialStore.getState().movePreset('p1', 'm2');

    const { userPresets } = useMaterialStore.getState();

    expect(userPresets).toHaveLength(1);
    expect(userPresets[0]).toMatchObject({ id: 'p1', materialId: 'm2' });
  });

  test('movePreset to the bucket lazily creates it', () => {
    useMaterialStore.getState().addMaterial(userMaterial('m1'));
    useMaterialStore.getState().addPreset('m1', { id: 'p1', name: 'Cut', origin: 'user', settings: {} });
    useMaterialStore.getState().movePreset('p1', MY_MATERIALS_ID);

    expect(useMaterialStore.getState().userMaterials.some(({ id }) => id === MY_MATERIALS_ID)).toBe(true);
    expect(useMaterialStore.getState().userPresets[0]).toMatchObject({ id: 'p1', materialId: MY_MATERIALS_ID });
  });

  test('deleteMaterial cascades variants, presets, favorites, and recents', () => {
    useMaterialStore.getState().addMaterial(userMaterial('m1'));
    useMaterialStore.getState().addMaterial(userMaterial('m1-3mm', { parentId: 'm1' }));
    useMaterialStore.getState().addPreset('m1-3mm', { id: 'p1', name: 'Cut', origin: 'user', settings: {} });
    useMaterialStore.getState().toggleFavorite('m1');
    useMaterialStore.getState().pushRecent('m1-3mm', 'p1');
    useMaterialStore.getState().deleteMaterial('m1');

    const state = useMaterialStore.getState();

    expect(state.userMaterials).toHaveLength(0);
    expect(state.userPresets).toHaveLength(0);
    expect(state.favorites).toHaveLength(0);
    expect(state.recents).toHaveLength(0);
  });

  test('pushRecent dedupes and caps', () => {
    for (let i = 0; i < RECENTS_LIMIT + 5; i++) {
      useMaterialStore.getState().pushRecent(`m${i}`, `p${i}`);
    }

    useMaterialStore.getState().pushRecent('m0', 'p0');

    const { recents } = useMaterialStore.getState();

    expect(recents).toHaveLength(RECENTS_LIMIT);
    expect(recents[0]).toMatchObject({ materialId: 'm0', presetId: 'p0' });
    expect(recents.filter(({ materialId }) => materialId === 'm0')).toHaveLength(1);
  });

  test('importData remaps colliding ids and unions overrides/disabled', () => {
    useMaterialStore.getState().addMaterial(userMaterial('m1'));
    useMaterialStore.getState().togglePresetDisabled('a');
    useMaterialStore.getState().importData({
      disabledPresetIds: ['a', 'b'],
      presetOverrides: { wood_engraving: { '*': { '*': { power: 10 } } } },
      userMaterials: [userMaterial('m1'), userMaterial('child', { parentId: 'm1' })],
    });

    const state = useMaterialStore.getState();

    expect(state.userMaterials).toHaveLength(3);

    const importedParent = state.userMaterials[1];
    const importedChild = state.userMaterials[2];

    expect(importedParent.id).not.toBe('m1');
    expect(importedChild.parentId).toBe(importedParent.id);
    expect(state.disabledPresetIds.sort()).toEqual(['a', 'b']);
    expect(state.presetOverrides.wood_engraving).toBeDefined();
  });
});

describe('legacy migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStorage();
    resetMaterialStoreInit();
    mockIsMaterialBrowserActive.mockReturnValue(true);
  });

  const legacyPresets = [
    { hide: false, isDefault: true, key: 'wood_3mm_cutting' },
    { hide: true, isDefault: true, key: 'wood_engraving' },
    { hide: true, isDefault: true, key: 'not_a_real_key' },
    { isDefault: false, module: 5, multipass: 3, name: 'My Print', power: 50 },
    { isDefault: false, name: 'My Cut', power: 80, speed: 5 },
  ] as never[];

  test('convertLegacyPresets maps hidden defaults and user presets', () => {
    const { bucketPresets, disabledPresetIds } = convertLegacyPresets(legacyPresets);

    expect(disabledPresetIds).toEqual(['wood_engraving']);
    expect(bucketPresets).toHaveLength(2);
    expect(bucketPresets[0].name).toBe('My Print');
    expect(bucketPresets[0].settings['*']!['5']).toMatchObject({ multipass: 3, power: 50 });
    expect(bucketPresets[1].settings['*']!['*']).toMatchObject({ power: 80, speed: 5 });
    expect(bucketPresets.every(({ origin }) => origin === 'user')).toBe(true);
  });

  test('initMaterialStore migrates once and never writes the presets key', () => {
    const setStorageSpy = jest.spyOn(storageStore, 'setStorage');

    storageStore.useStorageStore.getState().update({ presets: legacyPresets } as never);

    initMaterialStore();

    const state = useMaterialStore.getState();

    expect(state.migratedFromPresets).toBe(true);
    expect(state.disabledPresetIds).toContain('wood_engraving');

    const bucketPresets = state.userPresets.filter(({ materialId }) => materialId === MY_MATERIALS_ID);

    expect(state.userMaterials.some(({ id }) => id === MY_MATERIALS_ID)).toBe(true);
    expect(bucketPresets).toHaveLength(2);

    // idempotency: a second init (e.g. after fallback + re-enable) never duplicates
    resetMaterialStoreInit();
    initMaterialStore();
    expect(useMaterialStore.getState().userPresets).toHaveLength(2);

    // the legacy key is read-only for the new system
    expect(setStorageSpy).not.toHaveBeenCalledWith('presets', expect.anything());
    expect(storageStore.getStorage('presets')).toEqual(legacyPresets);
  });

  test('initMaterialStore is a no-op when the browser is not active', () => {
    mockIsMaterialBrowserActive.mockReturnValue(false);
    storageStore.useStorageStore.getState().update({ presets: legacyPresets } as never);

    initMaterialStore();

    expect(useMaterialStore.getState().migratedFromPresets).toBe(false);
    expect(useMaterialStore.getState().userMaterials).toHaveLength(0);
  });

  test('migration flag flips even with nothing to migrate', () => {
    initMaterialStore();
    expect(useMaterialStore.getState().migratedFromPresets).toBe(true);
    expect(useMaterialStore.getState().userMaterials).toHaveLength(0);
  });
});
