import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { Material } from '@core/interfaces/IMaterial';

import {
  getPresetsForContext,
  getSortedVariants,
  getVisibleMaterials,
  getVisibleVariants,
  searchMaterials,
} from './selectors';

const material = (overrides: Partial<Material> & { id: string }): Material => ({
  category: 'wood',
  presets: [],
  ...overrides,
});

describe('getVisibleMaterials', () => {
  test('excludes region-gated materials', () => {
    const materials = [
      material({ id: 'global' }),
      material({ id: 'us-only', regions: ['us'] }),
      material({ id: 'tw-only', regions: ['tw'] }),
    ];

    expect(getVisibleMaterials(materials, 'us').map(({ id }) => id)).toEqual(['global', 'us-only']);
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

describe('getSortedVariants', () => {
  test('merges user additions, grouped by unit (mm first), each sorted by resolved thickness', () => {
    const wood = material({
      id: 'wood',
      variants: [
        { id: 'wood-8mm', thicknessNum: 8, thicknessUnit: 'mm' },
        // Fraction resolution puts 3/16 (0.1875) before 1/4 (0.25)
        { id: 'wood-quarter', thicknessDen: 4, thicknessNum: 1, thicknessUnit: 'inch' },
        { id: 'wood-3-16', thicknessDen: 16, thicknessNum: 3, thicknessUnit: 'inch' },
        { id: 'wood-3mm', thicknessNum: 3, thicknessUnit: 'mm' },
      ],
    });
    // User variants attach to ANY material and sort into place; other owners filtered out
    const userVariants = [
      { id: 'user-6mm', materialId: 'wood', thicknessNum: 6, thicknessUnit: 'mm' as const },
      { id: 'other-2mm', materialId: 'mdf', thicknessNum: 2, thicknessUnit: 'mm' as const },
    ];

    expect(getSortedVariants(wood, userVariants).map(({ id }) => id)).toEqual([
      'wood-3mm',
      'user-6mm',
      'wood-8mm',
      'wood-3-16',
      'wood-quarter',
    ]);
    expect(getSortedVariants(material({ id: 'bare' }), [])).toEqual([]);
  });
});

describe('getVisibleVariants', () => {
  const wood = material({
    id: 'wood',
    presets: [
      {
        id: 'wood_3mm_cutting',
        origin: 'default',
        settings: { fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } } },
        variantId: 'wood-3mm',
      },
      {
        id: 'wood_5mm_cutting',
        origin: 'default',
        settings: { ado1: { [LayerModule.LASER_10W_DIODE]: { power: 100, speed: 3 } } },
        variantId: 'wood-5mm',
      },
    ],
    variants: [
      { id: 'wood-3mm', thicknessNum: 3, thicknessUnit: 'mm' },
      { id: 'wood-5mm', thicknessNum: 5, thicknessUnit: 'mm' },
      { id: 'wood-8mm', thicknessNum: 8, thicknessUnit: 'mm' },
    ],
  });
  const userData = {
    disabledPresetIds: [],
    pinnedVariantIds: [],
    presetOverrides: {},
    userPresets: [],
    userVariants: [{ id: 'user-6mm', materialId: 'wood', thicknessNum: 6, thicknessUnit: 'mm' as const }],
  };
  const ids = (variants: Array<{ id: string }>) => variants.map(({ id }) => id);

  test('catalog variants need a resolvable scoped preset; user additions always show', () => {
    expect(ids(getVisibleVariants(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, userData))).toEqual([
      'wood-3mm',
      'user-6mm',
    ]);
    expect(ids(getVisibleVariants(wood, 'ado1', LayerModule.LASER_10W_DIODE, userData))).toEqual([
      'wood-5mm',
      'user-6mm',
    ]);
  });

  test('pinned catalog variants show regardless of machine', () => {
    const pinned = { ...userData, pinnedVariantIds: ['wood-8mm'] };

    expect(ids(getVisibleVariants(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, pinned))).toEqual([
      'wood-3mm',
      'user-6mm',
      'wood-8mm',
    ]);
  });

  test('a user preset scoped to a catalog variant keeps it visible', () => {
    const withUserPreset = {
      ...userData,
      userPresets: [
        {
          id: 'u1',
          materialId: 'wood',
          name: 'Mine',
          origin: 'user' as const,
          settings: { '*': { '*': { power: 10, speed: 10 } } },
          variantId: 'wood-8mm',
        },
      ],
    };

    expect(ids(getVisibleVariants(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, withUserPreset))).toEqual([
      'wood-3mm',
      'user-6mm',
      'wood-8mm',
    ]);
  });
});

describe('getPresetsForContext', () => {
  const wood = material({
    id: 'wood',
    presets: [
      {
        id: 'wood_3mm_cutting',
        legacyKey: 'wood_3mm_cutting',
        origin: 'default',
        settings: { fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } } },
        variantId: 'wood-3mm',
      },
      {
        id: 'wood_5mm_cutting',
        legacyKey: 'wood_5mm_cutting',
        origin: 'default',
        settings: { fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 4 } } },
        variantId: 'wood-5mm',
      },
      {
        id: 'wood_engraving',
        legacyKey: 'wood_engraving',
        origin: 'default',
        settings: { fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } } },
      },
      {
        id: 'user_1',
        name: 'My Cut',
        origin: 'user',
        settings: { '*': { '*': { power: 80, speed: 5 } } },
        variantId: 'wood-3mm',
      },
    ],
    variants: [
      { id: 'wood-3mm', thicknessNum: 3, thicknessUnit: 'mm' },
      { id: 'wood-5mm', thicknessNum: 5, thicknessUnit: 'mm' },
    ],
  });
  const emptyUserData = { disabledPresetIds: [], presetOverrides: {}, userPresets: [] };

  test('variant filter: scoped presets match their variant, material-wide always shows', () => {
    const rows3 = getPresetsForContext(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, emptyUserData, 'wood-3mm');

    expect(rows3.map(({ presetId }) => presetId)).toEqual(['wood_3mm_cutting', 'wood_engraving', 'user_1']);
    expect(rows3[0].values.power).toBe(55);
    expect(rows3[0].state).toBe('default');
    expect(rows3[0].materialId).toBe('wood');

    expect(
      getPresetsForContext(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, emptyUserData, 'wood-5mm').map(
        ({ presetId }) => presetId,
      ),
    ).toEqual(['wood_5mm_cutting', 'wood_engraving']);

    // No variant given → every preset of the material (support checks, row lookups)
    expect(getPresetsForContext(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, emptyUserData)).toHaveLength(4);
  });

  test('unresolvable contexts dropped', () => {
    // ado1 has no scopes for the default presets; only the wildcard user preset survives
    const adoRows = getPresetsForContext(wood, 'ado1', LayerModule.LASER_10W_DIODE, emptyUserData, 'wood-3mm');

    expect(adoRows.map(({ presetId }) => presetId)).toEqual(['user_1']);
  });

  test('user presets on the material are appended after its own presets', () => {
    const rows = getPresetsForContext(
      wood,
      'fbb2',
      LayerModule.LASER_UNIVERSAL,
      {
        ...emptyUserData,
        userPresets: [
          { id: 'other_1', materialId: 'mdf', name: 'Other', origin: 'user', settings: { '*': { '*': { power: 1 } } } },
          {
            id: 'added_1',
            materialId: 'wood',
            name: 'Added',
            origin: 'user',
            settings: { '*': { '*': { power: 9 } } },
            variantId: 'wood-3mm',
          },
        ],
      },
      'wood-3mm',
    );

    // Only this material's user presets; other owners filtered out
    expect(rows.map(({ presetId }) => presetId)).toEqual(['wood_3mm_cutting', 'wood_engraving', 'user_1', 'added_1']);
  });

  test('catalog presets declaring a dpi get a DPI name suffix (browser rows only)', () => {
    const ply = material({
      id: 'ply',
      presets: [
        {
          id: 'e',
          name: 'Engraving',
          origin: 'default',
          settings: { fbb2: { [LayerModule.LASER_UNIVERSAL]: { dpi: 'high', power: 20 } } },
        },
        {
          id: 'u',
          name: 'Mine',
          origin: 'user',
          settings: { '*': { '*': { dpi: 'high', power: 1 } } },
        },
      ],
    });
    const rows = getPresetsForContext(ply, 'fbb2', LayerModule.LASER_UNIVERSAL, emptyUserData);

    expect(rows[0].displayName).toBe('Engraving - 500 DPI');
    // User presets keep their own name untouched
    expect(rows[1].displayName).toBe('Mine');
  });

  test('customized overlay merges values and flips state', () => {
    const rows = getPresetsForContext(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, {
      ...emptyUserData,
      presetOverrides: { wood_3mm_cutting: { '*': { '*': { name: 'Tuned Cut', power: 60 } } } },
    });
    const cutting = rows.find(({ presetId }) => presetId === 'wood_3mm_cutting')!;

    expect(cutting.state).toBe('customized');
    expect(cutting.values.power).toBe(60);
    expect(cutting.values.speed).toBe(7); // base value preserved
    expect(cutting.displayName).toBe('Tuned Cut');
  });

  test('disabled presets flagged but still listed', () => {
    const rows = getPresetsForContext(wood, 'fbb2', LayerModule.LASER_UNIVERSAL, {
      ...emptyUserData,
      disabledPresetIds: ['wood_engraving'],
    });

    expect(rows.find(({ presetId }) => presetId === 'wood_engraving')!.isDisabled).toBe(true);
  });
});
