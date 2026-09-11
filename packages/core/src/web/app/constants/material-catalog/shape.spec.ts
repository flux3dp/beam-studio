// Builder OUTPUT shape on a tiny fixed preset set. index.spec.ts checks the rules against the
// real presets.ts; this snapshot stays stable across PM parameter packages.
jest.mock('@core/app/constants/presets', () => {
  const { LayerModule } = jest.requireActual('@core/app/constants/layer-module/layer-modules');

  return {
    presets: {
      // Printing module scope
      canvas_printing: {
        ado1: { [LayerModule.PRINTER]: { ink: 3, module: LayerModule.PRINTER, multipass: 3, speed: 60 } },
      },
      // Variant-scoped, plain values, diode modules carry `module`
      wood_solid_3mm_cutting: {
        ado1: { [LayerModule.LASER_10W_DIODE]: { module: LayerModule.LASER_10W_DIODE, power: 100, speed: 4 } },
        fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 15 } },
      },
      // Material-wide, one scope with dpiOverrides → base + flat per-DPI presets sharing a groupId
      wood_solid_engraving: {
        fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 500 } },
        fhx2rf_30: {
          [LayerModule.LASER_UNIVERSAL]: {
            dpiOverrides: { detailed: { power: 10 }, high: { power: 20 } },
            power: 55,
            speed: 300,
          },
        },
      },
    },
  };
});

import { getBundledCatalog } from './index';

test('bundled catalog shape for a fixed preset set', () => {
  // Materials without presets in the fixture stay in the catalog (as display-only) — only the
  // populated ones are interesting for the shape
  const populated = getBundledCatalog().materials.filter((material) => material.presets.length > 0);

  expect(populated.map(({ id }) => id)).toEqual(['solid-wood', 'canvas']);
  expect(populated).toMatchSnapshot();
});
