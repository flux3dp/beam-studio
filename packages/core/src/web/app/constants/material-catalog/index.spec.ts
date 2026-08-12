// The central presets mock (src/__mocks__) would replace the real catalog source;
// this spec must diff the mapping against the REAL presets.ts keys.
jest.unmock('@core/app/constants/presets');

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { presets as defaultPresets } from '@core/app/constants/presets';
import { useStorageStore } from '@core/app/stores/storageStore';

import { getBundledCatalog } from './index';
import { materialDefs, presetMappings } from './mapping';

describe('material-catalog mapping', () => {
  test('every presets.ts key is mapped exactly once', () => {
    const presetKeys = Object.keys(defaultPresets).sort();
    const mappedKeys = Object.keys(presetMappings).sort();

    expect(mappedKeys).toEqual(presetKeys);
  });

  test('every mapping targets an existing material', () => {
    const materialIds = new Set(materialDefs.map(({ id }) => id));

    Object.values(presetMappings).forEach((mapping) => {
      expect(materialIds.has(mapping.materialId)).toBe(true);
    });
  });

  test('material ids are unique and parent refs are valid one-level', () => {
    const ids = materialDefs.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);

    const byId = new Map(materialDefs.map((def) => [def.id, def]));

    materialDefs.forEach(({ parentId }) => {
      if (!parentId) return;

      const parent = byId.get(parentId);

      expect(parent).toBeDefined();
      expect(parent!.parentId).toBeUndefined();
    });
  });
});

describe('getBundledCatalog', () => {
  const catalog = getBundledCatalog();
  const allPresets = catalog.materials.flatMap((m) => m.presets);
  const findPreset = (id: string) => allPresets.find((p) => p.id === id);

  test('envelope', () => {
    expect(catalog.version).toBe(0);
    expect(catalog.materials.length).toBe(materialDefs.length);
  });

  test('memoized', () => {
    expect(getBundledCatalog()).toBe(catalog);
  });

  test('thickness carries ONE authoritative unit picked by default-units', () => {
    // Central storage mock defaults to mm
    const wood3 = catalog.materials.find(({ id }) => id === 'wood-3mm')!;

    expect(wood3).toMatchObject({ thicknessNum: 3, thicknessUnit: 'mm' });
    expect(wood3.thicknessDen).toBeUndefined();

    useStorageStore.getState().set('default-units', 'inches');

    const inchCatalog = getBundledCatalog();

    expect(inchCatalog).not.toBe(catalog);
    // Curated marketing fractions, not conversions (8mm corrected to 5/16″)
    expect(inchCatalog.materials.find(({ id }) => id === 'wood-3mm')).toMatchObject({
      thicknessDen: 8,
      thicknessNum: 1,
      thicknessUnit: 'inch',
    });
    expect(inchCatalog.materials.find(({ id }) => id === 'wood-8mm')).toMatchObject({
      thicknessDen: 16,
      thicknessNum: 5,
      thicknessUnit: 'inch',
    });

    useStorageStore.getState().set('default-units', 'mm');
    // Per-unit memoization: switching back returns the original build
    expect(getBundledCatalog()).toBe(catalog);
  });

  test('dpi is declared only on scopes that carry dpiOverrides', () => {
    const woodEngraving = findPreset('wood_engraving')!;

    // fhx2rf scopes curate override tiers → base dpi 'medium' declared
    expect(woodEngraving.settings.fhx2rf_30![LayerModule.LASER_UNIVERSAL]!.dpi).toBe('medium');
    // scopes without overrides declare nothing — applying must not touch the layer's DPI
    expect(woodEngraving.settings.fbb2![LayerModule.LASER_UNIVERSAL]!.dpi).toBeUndefined();
    expect(woodEngraving.settings.ado1![LayerModule.LASER_10W_DIODE]!.dpi).toBeUndefined();
    expect(findPreset('wood_3mm_cutting')!.settings.fbb2![LayerModule.LASER_UNIVERSAL]!.dpi).toBeUndefined();
  });

  test('strips legacy Preset metadata from settings values', () => {
    allPresets.forEach((preset) => {
      Object.values(preset.settings).forEach((modules) => {
        Object.values(modules!).forEach((values) => {
          expect(values).not.toHaveProperty('module');
          expect(values).not.toHaveProperty('name');
          expect(values).not.toHaveProperty('isDefault');
          expect(values).not.toHaveProperty('hide');
          expect(values).not.toHaveProperty('key');
        });
      });
    });
  });

  test('default presets carry id = legacyKey = presets.ts key', () => {
    const woodCutting = findPreset('wood_3mm_cutting')!;

    expect(woodCutting.legacyKey).toBe('wood_3mm_cutting');
    expect(woodCutting.origin).toBe('default');
  });

  test('base entries map 1:1 to presets.ts keys; extras are only quality tiers', () => {
    const baseIds = allPresets.filter(({ legacyKey }) => legacyKey).map(({ id }) => id);

    expect(baseIds.sort()).toEqual(Object.keys(presetMappings).sort());
    expect(new Set(allPresets.map(({ id }) => id)).size).toBe(allPresets.length);
    allPresets
      .filter(({ legacyKey }) => !legacyKey)
      .forEach((preset) => expect(preset.nameKey).toBe('engraving_quality'));
  });

  test('quality tiers per override above 250 DPI: same values, only dpi differs (D19)', () => {
    // wood_engraving fhx2rf curates high/detailed/ultra → three tiers
    const base = findPreset('wood_engraving')!;
    const high = findPreset('wood_engraving_high')!;

    expect(findPreset('wood_engraving_detailed')).toBeDefined();
    expect(findPreset('wood_engraving_ultra')).toBeDefined();

    // Tiers scope only to models that actually curate that override (no fbb2/ado1)
    expect(Object.keys(high.settings).sort()).toEqual(['fhx2rf_30', 'fhx2rf_60', 'fhx2rf_80']);

    // Values identical to the base — including dpiOverrides, so DpiBlock compensation
    // keeps working after applying a tier — with only the declared dpi differing.
    const baseRf = base.settings.fhx2rf_30![LayerModule.LASER_UNIVERSAL]!;
    const highRf = high.settings.fhx2rf_30![LayerModule.LASER_UNIVERSAL]!;

    expect(highRf).toEqual({ ...baseRf, dpi: 'high' });
    expect(highRf.dpiOverrides).toEqual(
      defaultPresets.wood_engraving.fhx2rf_30![LayerModule.LASER_UNIVERSAL]!.dpiOverrides,
    );

    // No overrides in the source → no tiers (black_acrylic_engraving has none)
    expect(findPreset('black_acrylic_engraving_high')).toBeUndefined();
    expect(findPreset('wood_3mm_cutting_high')).toBeUndefined();
  });

  test('promark scopes are preserved verbatim', () => {
    const dark = findPreset('stainless_steel_dark')!;
    const source = defaultPresets.stainless_steel_dark.fpm1_0_20![LayerModule.LASER_UNIVERSAL]!;
    const built = dark.settings.fpm1_0_20![LayerModule.LASER_UNIVERSAL]!;

    expect(built.power).toBe(source.power);
    expect(built.frequency).toBe(source.frequency);
    expect(built.fillInterval).toBe(source.fillInterval);
  });

  test('catalog snapshot', () => {
    expect(catalog).toMatchSnapshot();
  });
});
