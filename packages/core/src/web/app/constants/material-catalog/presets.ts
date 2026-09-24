import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { PresetTable } from '@core/app/constants/presets';

/**
 * Presets that exist only in the Material Browser. presets.ts is what the legacy
 * laser-config dropdown lists, so keys introduced for the browser go here and never
 * reach legacy mode. Same shape and PM CSV workflow as presets.ts.
 */
/* eslint-disable perfectionist/sort-objects */
export const materialBrowserPresets: PresetTable = {
  acrylic_2mm_cutting: {
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 6 } },
  },
  wood_solid_3mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: { module: LayerModule.LASER_10W_DIODE, power: 100, speed: 4 },
      [LayerModule.LASER_20W_DIODE]: { module: LayerModule.LASER_20W_DIODE, power: 100, speed: 8 },
    },
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 15 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 15 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 15 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 45, speed: 7 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 45, speed: 7 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 7 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 65, speed: 5 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 65, speed: 8 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 65, speed: 10 } },
  },
  wood_solid_5mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: { module: LayerModule.LASER_10W_DIODE, power: 100, speed: 2 },
      [LayerModule.LASER_20W_DIODE]: { module: LayerModule.LASER_20W_DIODE, power: 100, speed: 4 },
    },
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 50, speed: 5 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 50, speed: 5 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 50, speed: 5 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 80, speed: 5 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 80, speed: 5 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 50, speed: 4 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 4 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 8 } },
  },
  wood_solid_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: { module: LayerModule.LASER_10W_DIODE, power: 80, speed: 100 },
      [LayerModule.LASER_20W_DIODE]: { module: LayerModule.LASER_20W_DIODE, power: 70, speed: 100 },
    },
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 500 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 500 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 500 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 20, speed: 300 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 20, speed: 300 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 20, speed: 300 } },
    fhx2rf_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 300,
        dpiOverrides: { high: { power: 20 }, detailed: { power: 10 }, ultra: { power: 5 } },
      },
    },
    fhx2rf_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 300,
        dpiOverrides: { high: { power: 11 }, detailed: { power: 5 }, ultra: { power: 3 } },
      },
    },
    fhx2rf_80: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 10,
        speed: 300,
        dpiOverrides: { high: { power: 9 }, detailed: { power: 5 }, ultra: { power: 2 } },
      },
    },
  },
  acrylic_6mm_cutting: {
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, repeat: 2, speed: 5 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
  },
  acrylic_film_3mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 8 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 10 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 75, speed: 7 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 6 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 9 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 12 } },
  },
  acrylic_film_5mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 4 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 59, speed: 3 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, repeat: 2, speed: 5 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 85, speed: 3 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 3 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 4 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
  },
  acrylic_film_engraving: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 150 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 13, speed: 500 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhx2rf_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 80,
        speed: 500,
        dpiOverrides: { high: { power: 12 }, detailed: { power: 12 }, ultra: { power: 12 } },
      },
    },
    fhx2rf_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 500,
        dpiOverrides: { high: { power: 9 }, detailed: { power: 9 }, ultra: { power: 9 } },
      },
    },
    fhx2rf_80: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 500,
        dpiOverrides: { high: { power: 6 }, detailed: { power: 6 }, ultra: { power: 6 } },
      },
    },
  },
  acrylic_fluorescent_3mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 8 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 10 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 45, speed: 7 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 6 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 9 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 12 } },
  },
  acrylic_fluorescent_5mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 4 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 59, speed: 3 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, repeat: 2, speed: 5 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 3 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 4 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
  },
  acrylic_fluorescent_engraving: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 150 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 13, speed: 500 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhx2rf_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 500,
        dpiOverrides: { high: { power: 12 }, detailed: { power: 12 }, ultra: { power: 12 } },
      },
    },
    fhx2rf_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 500,
        dpiOverrides: { high: { power: 9 }, detailed: { power: 9 }, ultra: { power: 9 } },
      },
    },
    fhx2rf_80: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 10,
        speed: 500,
        dpiOverrides: { high: { power: 6 }, detailed: { power: 6 }, ultra: { power: 6 } },
      },
    },
  },
  acrylic_glitter_3mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 8 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 10 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 45, speed: 7 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 6 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 9 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 12 } },
  },
  acrylic_glitter_5mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 4 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 59, speed: 3 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, repeat: 2, speed: 5 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 3 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 4 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
  },
  acrylic_glitter_engraving: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 150 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 13, speed: 500 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhx2rf_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 500,
        dpiOverrides: { high: { power: 12 }, detailed: { power: 12 }, ultra: { power: 12 } },
      },
    },
    fhx2rf_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 500,
        dpiOverrides: { high: { power: 9 }, detailed: { power: 9 }, ultra: { power: 9 } },
      },
    },
    fhx2rf_80: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 10,
        speed: 500,
        dpiOverrides: { high: { power: 6 }, detailed: { power: 6 }, ultra: { power: 6 } },
      },
    },
  },
  acrylic_mixed_3mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 8 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 10 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 45, speed: 7 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 6 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 9 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 12 } },
  },
  acrylic_mixed_5mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 4 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 59, speed: 3 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, repeat: 2, speed: 5 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 3 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 4 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
  },
  acrylic_mixed_engraving: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 150 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 13, speed: 500 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhx2rf_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 500,
        dpiOverrides: { high: { power: 12 }, detailed: { power: 12 }, ultra: { power: 12 } },
      },
    },
    fhx2rf_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 500,
        dpiOverrides: { high: { power: 9 }, detailed: { power: 9 }, ultra: { power: 9 } },
      },
    },
    fhx2rf_80: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 10,
        speed: 500,
        dpiOverrides: { high: { power: 6 }, detailed: { power: 6 }, ultra: { power: 6 } },
      },
    },
  },
  acrylic_sublimation_3mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 8 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 7 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 10 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 45, speed: 7 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 6 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 9 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 12 } },
  },
  acrylic_sublimation_5mm_cutting: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 4 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 59, speed: 3 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, repeat: 2, speed: 5 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 3 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 3 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 4 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 70, speed: 6 } },
  },
  acrylic_sublimation_engraving: {
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 150 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 13, speed: 500 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 25, speed: 150 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 15, speed: 300 } },
    fhx2rf_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 500,
        dpiOverrides: { high: { power: 12 }, detailed: { power: 12 }, ultra: { power: 12 } },
      },
    },
    fhx2rf_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 500,
        dpiOverrides: { high: { power: 9 }, detailed: { power: 9 }, ultra: { power: 9 } },
      },
    },
    fhx2rf_80: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 10,
        speed: 500,
        dpiOverrides: { high: { power: 6 }, detailed: { power: 6 }, ultra: { power: 6 } },
      },
    },
  },
  leather_faux_3mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: { module: LayerModule.LASER_10W_DIODE, power: 100, speed: 4 },
      [LayerModule.LASER_20W_DIODE]: { module: LayerModule.LASER_20W_DIODE, power: 100, speed: 8 },
    },
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 65, speed: 3 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 55, speed: 4 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 35, speed: 10 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 60, speed: 3 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 55, repeat: 3, speed: 10 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 6 } },
    fhx2rf_30: { [LayerModule.LASER_UNIVERSAL]: { power: 65, speed: 6 } },
    fhx2rf_60: { [LayerModule.LASER_UNIVERSAL]: { power: 65, speed: 9 } },
    fhx2rf_80: { [LayerModule.LASER_UNIVERSAL]: { power: 65, speed: 12 } },
  },
  leather_faux_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: { module: LayerModule.LASER_10W_DIODE, power: 30, speed: 100 },
      [LayerModule.LASER_20W_DIODE]: { module: LayerModule.LASER_20W_DIODE, power: 30, speed: 125 },
    },
    fbb1b: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 150 } },
    fbb1p: { [LayerModule.LASER_UNIVERSAL]: { power: 20, speed: 150 } },
    fbb2: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 300 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 150 } },
    fbm2: { [LayerModule.LASER_UNIVERSAL]: { power: 7, speed: 200 } },
    fhexa1: { [LayerModule.LASER_UNIVERSAL]: { power: 20, speed: 300 } },
    fhx2rf_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 300,
        dpiOverrides: { high: { power: 20 }, detailed: { power: 12 }, ultra: { power: 8 } },
      },
    },
    fhx2rf_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 300,
        dpiOverrides: { high: { power: 10 }, detailed: { power: 6 }, ultra: { power: 4 } },
      },
    },
    fhx2rf_80: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 300,
        dpiOverrides: { high: { power: 10 }, detailed: { power: 6 }, ultra: { power: 4 } },
      },
    },
  },
};
/* eslint-enable perfectionist/sort-objects */
