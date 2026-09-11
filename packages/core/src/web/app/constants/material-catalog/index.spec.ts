// The central presets mock (src/__mocks__) would replace the real catalog source;
// this spec must diff the mapping against the REAL presets.ts keys.
jest.unmock('@core/app/constants/presets');

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { presets as defaultPresets } from '@core/app/constants/presets';
import { useStorageStore } from '@core/app/stores/storageStore';

import { bundledPresets, getBundledCatalog } from './index';
import { materialDefs, mergedLegacyKeys, presetMappings } from './mapping';
import { materialBrowserPresets } from './presets';

describe('material-catalog mapping', () => {
  test('every bundled preset key (legacy + browser-only) is mapped exactly once, unless merged', () => {
    const presetKeys = Object.keys(bundledPresets)
      .filter((key) => !(key in mergedLegacyKeys))
      .sort();
    const mappedKeys = Object.keys(presetMappings).sort();

    expect(mappedKeys).toEqual(presetKeys);
  });

  test('merged legacy keys exist in presets.ts and point at a mapped key', () => {
    Object.entries(mergedLegacyKeys).forEach(([key, target]) => {
      expect(defaultPresets[key]).toBeDefined();
      expect(presetMappings[key]).toBeUndefined();
      expect(presetMappings[target]).toBeDefined();
    });
  });

  test('browser-only presets never shadow a legacy key', () => {
    const legacyKeys = new Set(Object.keys(defaultPresets));

    expect(Object.keys(materialBrowserPresets).filter((key) => legacyKeys.has(key))).toEqual([]);
  });

  test('every mapping targets an existing material, and variant refs its variants', () => {
    const byId = new Map(materialDefs.map((def) => [def.id, def]));

    Object.values(presetMappings).forEach((mapping) => {
      const material = byId.get(mapping.materialId);

      expect(material).toBeDefined();

      if (mapping.variantId) {
        expect(material!.variants?.some(({ id }) => id === mapping.variantId)).toBe(true);
      }
    });
  });

  test('material and variant ids are all unique', () => {
    const ids = materialDefs.flatMap((def) => [def.id, ...(def.variants ?? []).map(({ id }) => id)]);

    expect(new Set(ids).size).toBe(ids.length);
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
    const woodVariants = catalog.materials.find(({ id }) => id === 'wood')!.variants!;

    expect(woodVariants[0]).toMatchObject({ id: 'wood-3mm', thicknessNum: 3, thicknessUnit: 'mm' });
    expect(woodVariants[0].thicknessDen).toBeUndefined();
    // Single-thickness materials get exactly one variant — thickness never lives on the material
    expect(catalog.materials.find(({ id }) => id === 'denim')!.variants).toEqual([
      { id: 'denim-1mm', thicknessNum: 1, thicknessUnit: 'mm' },
    ]);

    useStorageStore.getState().set('default-units', 'inches');

    const inchCatalog = getBundledCatalog();

    expect(inchCatalog).not.toBe(catalog);

    // Curated marketing fractions, not conversions (8mm corrected to 5/16″)
    const inchVariants = inchCatalog.materials.find(({ id }) => id === 'wood')!.variants!;

    expect(inchVariants.find(({ id }) => id === 'wood-3mm')).toMatchObject({
      thicknessDen: 8,
      thicknessNum: 1,
      thicknessUnit: 'inch',
    });
    expect(inchVariants.find(({ id }) => id === 'wood-8mm')).toMatchObject({
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

  test('base entries map 1:1 to presets.ts keys; extras are flat per-DPI presets', () => {
    const baseIds = allPresets.filter(({ legacyKey }) => legacyKey).map(({ id }) => id);

    expect(baseIds.sort()).toEqual(Object.keys(presetMappings).sort());
    expect(new Set(allPresets.map(({ id }) => id)).size).toBe(allPresets.length);
    // Per-DPI presets reuse the base name — the browser suffixes it with the declared DPI
    allPresets.filter(({ legacyKey }) => !legacyKey).forEach((preset) => expect(preset.nameKey).toBe('engraving'));
  });

  test('the catalog is FLAT: per-DPI presets carry merged values, dpiOverrides never leave the builder', () => {
    allPresets.forEach((preset) =>
      Object.values(preset.settings).forEach((modules) =>
        Object.values(modules!).forEach((values) => expect(values!.dpiOverrides).toBeUndefined()),
      ),
    );

    // wood_engraving fhx2rf curates high/detailed/ultra → three extra flat presets
    const sourceRf = defaultPresets.wood_engraving.fhx2rf_30![LayerModule.LASER_UNIVERSAL]!;
    const base = findPreset('wood_engraving')!.settings.fhx2rf_30![LayerModule.LASER_UNIVERSAL]!;
    const high = findPreset('wood_engraving_high')!;

    expect(findPreset('wood_engraving_detailed')).toBeDefined();
    expect(findPreset('wood_engraving_ultra')).toBeDefined();

    // Base = source values at its curated 250 DPI
    expect(base.dpi).toBe('medium');
    expect(base.power).toBe(sourceRf.power);

    // Per-DPI presets scope only to models that actually curate that override (no fbb2/ado1)
    expect(Object.keys(high.settings).sort()).toEqual(['fhx2rf_30', 'fhx2rf_60', 'fhx2rf_80']);

    // Their values = base merged with that option's deltas
    const highRf = high.settings.fhx2rf_30![LayerModule.LASER_UNIVERSAL]!;

    expect(highRf.dpi).toBe('high');
    expect(highRf.power).toBe(sourceRf.dpiOverrides!.high!.power);
    expect(highRf.speed).toBe(sourceRf.speed);

    // No overrides in the source → no per-DPI presets
    expect(findPreset('black_acrylic_engraving_high')).toBeUndefined();
    expect(findPreset('wood_3mm_cutting_high')).toBeUndefined();
  });

  test('per-DPI families share a groupId (the base key); single-DPI presets have none', () => {
    expect(findPreset('wood_engraving')!.groupId).toBe('wood_engraving');
    expect(findPreset('wood_engraving_high')!.groupId).toBe('wood_engraving');
    expect(findPreset('wood_engraving_ultra')!.groupId).toBe('wood_engraving');
    expect(findPreset('wood_3mm_cutting')!.groupId).toBeUndefined();
    expect(findPreset('black_acrylic_engraving')!.groupId).toBeUndefined();
  });

  test('promark scopes are preserved verbatim', () => {
    const dark = findPreset('stainless_steel_dark')!;
    const source = defaultPresets.stainless_steel_dark.fpm1_0_20![LayerModule.LASER_UNIVERSAL]!;
    const built = dark.settings.fpm1_0_20![LayerModule.LASER_UNIVERSAL]!;

    expect(built.power).toBe(source.power);
    expect(built.frequency).toBe(source.frequency);
    expect(built.fillInterval).toBe(source.fillInterval);
  });
});
