import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { Material } from '@core/interfaces/IMaterial';

import { getPresetsForContext, getVariants, getVisibleMaterials, searchMaterials } from './selectors';

const material = (overrides: Partial<Material> & { id: string }): Material => ({
  category: 'wood',
  presets: [],
  ...overrides,
});

describe('getVisibleMaterials', () => {
  test('excludes variants and region-gated materials', () => {
    const materials = [
      material({ id: 'parent' }),
      material({ id: 'child', parentId: 'parent' }),
      material({ id: 'us-only', regions: ['us'] }),
      material({ id: 'tw-only', regions: ['tw'] }),
    ];

    expect(getVisibleMaterials(materials, 'us').map(({ id }) => id)).toEqual(['parent', 'us-only']);
  });
});

describe('searchMaterials', () => {
  const materials = [
    material({ id: 'walnut', name: 'Walnut Plywood', tags: ['Indoor'] }),
    material({ category: 'metal', id: 'steel', name: 'Steel' }),
  ];

  test('matches name, tag, and category; empty query returns all', () => {
    expect(searchMaterials(materials, 'walnut').map(({ id }) => id)).toEqual(['walnut']);
    expect(searchMaterials(materials, 'indoor').map(({ id }) => id)).toEqual(['walnut']);
    expect(searchMaterials(materials, 'metal').map(({ id }) => id)).toEqual(['steel']);
    expect(searchMaterials(materials, '  ').length).toBe(2);
    expect(searchMaterials(materials, 'nomatch').length).toBe(0);
  });

  test('matches the translated category label, not only the enum', () => {
    const acrylic = material({ category: 'acrylic', id: 'clear' });

    // en label is 'Acrylics' — plural, so this only matches through the translation
    expect(searchMaterials([acrylic], 'acrylics').map(({ id }) => id)).toEqual(['clear']);
  });
});

describe('getVariants', () => {
  test('children sorted by thickness', () => {
    const parent = material({ id: 'wood' });
    const all = [
      parent,
      material({ id: 'wood-8mm', parentId: 'wood', thicknessMm: 8 }),
      material({ id: 'wood-3mm', parentId: 'wood', thicknessMm: 3 }),
      material({ id: 'other' }),
    ];

    expect(getVariants(parent, all).map(({ id }) => id)).toEqual(['wood-3mm', 'wood-8mm']);
  });
});

describe('getPresetsForContext', () => {
  const parent = material({
    id: 'wood',
    presets: [
      {
        id: 'wood_engraving',
        legacyKey: 'wood_engraving',
        origin: 'default',
        settings: { fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } } },
      },
    ],
  });
  const variant = material({
    id: 'wood-3mm',
    parentId: 'wood',
    presets: [
      {
        id: 'wood_3mm_cutting',
        legacyKey: 'wood_3mm_cutting',
        origin: 'default',
        settings: { fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } } },
      },
      {
        id: 'user_1',
        name: 'My Cut',
        origin: 'user',
        settings: { '*': { '*': { power: 80, speed: 5 } } },
      },
    ],
    thicknessMm: 3,
  });
  const emptyUserData = { disabledPresetIds: [], presetOverrides: {} };

  test('resolves one material; unresolvable contexts dropped; rows carry the owner id', () => {
    const rows = getPresetsForContext(variant, 'fbb2', LayerModule.LASER_UNIVERSAL, emptyUserData);

    expect(rows.map(({ presetId }) => presetId)).toEqual(['wood_3mm_cutting', 'user_1']);
    expect(rows[0].values.power).toBe(55);
    expect(rows[0].state).toBe('default');
    expect(rows[0].materialId).toBe('wood-3mm');
    expect(rows[1].state).toBe('user');

    expect(
      getPresetsForContext(parent, 'fbb2', LayerModule.LASER_UNIVERSAL, emptyUserData).map(
        ({ materialId }) => materialId,
      ),
    ).toEqual(['wood']);

    // ado1 has no scopes for the default presets; only the wildcard user preset survives
    const adoRows = getPresetsForContext(variant, 'ado1', LayerModule.LASER_10W_DIODE, emptyUserData);

    expect(adoRows.map(({ presetId }) => presetId)).toEqual(['user_1']);
  });

  test('user additions on the material are appended after its own presets', () => {
    const rows = getPresetsForContext(variant, 'fbb2', LayerModule.LASER_UNIVERSAL, {
      ...emptyUserData,
      presetAdditions: {
        'wood-3mm': [{ id: 'added_1', name: 'Added', origin: 'user', settings: { '*': { '*': { power: 9 } } } }],
      },
    });

    expect(rows.map(({ presetId }) => presetId)).toEqual(['wood_3mm_cutting', 'user_1', 'added_1']);
  });

  test('customized overlay merges values and flips state', () => {
    const rows = getPresetsForContext(variant, 'fbb2', LayerModule.LASER_UNIVERSAL, {
      disabledPresetIds: [],
      presetOverrides: { wood_3mm_cutting: { '*': { '*': { name: 'Tuned Cut', power: 60 } } } },
    });
    const cutting = rows.find(({ presetId }) => presetId === 'wood_3mm_cutting')!;

    expect(cutting.state).toBe('customized');
    expect(cutting.values.power).toBe(60);
    expect(cutting.values.speed).toBe(7); // base value preserved
    expect(cutting.displayName).toBe('Tuned Cut');
  });

  test('disabled presets flagged but still listed', () => {
    const rows = getPresetsForContext(parent, 'fbb2', LayerModule.LASER_UNIVERSAL, {
      disabledPresetIds: ['wood_engraving'],
      presetOverrides: {},
    });

    expect(rows.find(({ presetId }) => presetId === 'wood_engraving')!.isDisabled).toBe(true);
  });
});
