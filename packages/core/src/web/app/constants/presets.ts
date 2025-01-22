import LayerModule from '@core/app/constants/layer-module/layer-modules';
import type { Preset, PresetModel } from '@core/interfaces/ILayerConfig';

export const presets: {
  [key: string]: {
    [model in PresetModel]?: {
      [module in LayerModule]?: Preset;
    };
  };
} = {
  acrylic_3mm_cutting: {
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 8,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 7,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 10,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 4,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 6,
      },
    },
  },
  acrylic_5mm_cutting: {
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 4,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 4,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 59,
        speed: 3,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        repeat: 2,
        speed: 5,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 3,
      },
    },
  },
  acrylic_8mm_cutting: {
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        speed: 3,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        repeat: 2,
        speed: 3,
      },
    },
  },
  acrylic_10mm_cutting: {
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        repeat: 2,
        speed: 3,
      },
    },
  },
  acrylic_engraving: {
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
        speed: 150,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 150,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 13,
        speed: 500,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
        speed: 150,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 300,
      },
    },
  },
  acrylic_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        module: LayerModule.PRINTER,
        multipass: 4,
        speed: 30,
      },
    },
  },
  aluminum_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 80,
        speed: 20,
      },
    },
  },
  aluminum_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 90,
        speed: 3500,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 72,
        speed: 3500,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 55,
        speed: 3500,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 55,
        pulseWidth: 350,
        speed: 3000,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 40,
        power: 50,
        pulseWidth: 500,
        speed: 5000,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 55,
        power: 55,
        pulseWidth: 500,
        speed: 4000,
      },
    },
  },
  bamboo_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        module: LayerModule.PRINTER,
        multipass: 3,
        speed: 60,
      },
    },
  },
  black_abs: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 27,
        power: 20,
        speed: 5000,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 30,
        power: 16,
        speed: 5000,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 45,
        power: 15,
        speed: 700,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 25,
        pulseWidth: 350,
        speed: 4000,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 40,
        power: 20,
        pulseWidth: 500,
        speed: 2500,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 55,
        power: 20,
        pulseWidth: 500,
        speed: 2500,
      },
    },
  },
  black_acrylic_3mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 2,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 4,
      },
    },
    flv1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 2,
      },
    },
  },
  black_acrylic_5mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        repeat: 2,
        speed: 2,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        repeat: 1,
        speed: 2,
      },
    },
  },
  black_acrylic_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 90,
        speed: 175,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 65,
        speed: 175,
      },
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 50,
        speed: 40,
      },
    },
  },
  brass_dark: {
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 90,
        speed: 700,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 80,
        pulseWidth: 350,
        speed: 500,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 40,
        power: 100,
        pulseWidth: 300,
        speed: 700,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 55,
        power: 100,
        pulseWidth: 300,
        speed: 900,
      },
    },
  },
  brass_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 85,
        speed: 30,
      },
    },
  },
  brass_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 90,
        speed: 1500,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 72,
        speed: 1500,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 55,
        speed: 3000,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 45,
        pulseWidth: 200,
        speed: 2000,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 40,
        power: 50,
        pulseWidth: 500,
        speed: 1000,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 55,
        power: 75,
        pulseWidth: 500,
        speed: 1500,
      },
    },
  },
  canvas_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        module: LayerModule.PRINTER,
        multipass: 4,
        speed: 60,
      },
    },
  },
  cardstock_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        module: LayerModule.PRINTER,
        multipass: 3,
        speed: 60,
      },
    },
  },
  copper: {
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 90,
        speed: 3000,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 90,
        pulseWidth: 350,
        speed: 1000,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 40,
        power: 90,
        pulseWidth: 150,
        speed: 1000,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 55,
        power: 100,
        pulseWidth: 125,
        speed: 4000,
      },
    },
  },
  cork_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        module: LayerModule.PRINTER,
        multipass: 3,
        speed: 60,
      },
    },
  },
  denim_1mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 14,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 50,
        speed: 10,
      },
    },
  },
  fabric_3mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 6,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 10,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 20,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 20,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 20,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 20,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 25,
      },
    },
  },
  fabric_5mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 2,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 4,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 20,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 20,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 20,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 20,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 20,
      },
    },
  },
  fabric_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 30,
        speed: 125,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 40,
        speed: 150,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 150,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 150,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 250,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 150,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 250,
      },
    },
  },
  fabric_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        module: LayerModule.PRINTER,
        multipass: 3,
        speed: 60,
      },
    },
  },
  flat_stone_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        module: LayerModule.PRINTER,
        multipass: 3,
        speed: 60,
      },
    },
  },
  glass_bw_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 40,
        speed: 20,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 40,
        speed: 30,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 150,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
        speed: 150,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 150,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 150,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 150,
      },
    },
  },
  glass_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        module: LayerModule.PRINTER,
        multipass: 4,
        speed: 30,
      },
    },
  },
  gloss_leather_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        module: LayerModule.PRINTER,
        multipass: 3,
        speed: 60,
      },
    },
  },
  gold_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 95,
        speed: 10,
      },
    },
  },
  iron_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 90,
        speed: 20,
      },
    },
  },
  leather_3mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 4,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 8,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        speed: 3,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 4,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 10,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 3,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 6,
      },
    },
  },
  leather_5mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        repeat: 2,
        speed: 3,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        repeat: 2,
        speed: 6,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        speed: 1,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 2,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 10,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        repeat: 2,
        speed: 3,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 3,
      },
    },
  },
  leather_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 30,
        speed: 100,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 30,
        speed: 125,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 150,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 150,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 300,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 150,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 300,
      },
    },
  },
  mdf_3mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 4,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 8,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 15,
      },
    },
  },
  mdf_5mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 2,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 4,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 10,
      },
    },
  },
  mdf_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 30,
        speed: 100,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 70,
        speed: 100,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 500,
      },
    },
  },
  metal_bw_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 20,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 90,
        speed: 20,
      },
    },
  },
  metal_engraving: {
    fpm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 1200,
      },
    },
  },
  opaque_acrylic: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 30,
        speed: 5000,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 24,
        speed: 5000,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 45,
        power: 15,
        speed: 1500,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 15,
        pulseWidth: 350,
        speed: 4000,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 40,
        power: 35,
        pulseWidth: 100,
        speed: 1000,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 55,
        power: 100,
        pulseWidth: 500,
        speed: 3500,
      },
    },
  },
  pc_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        module: LayerModule.PRINTER,
        multipass: 4,
        speed: 30,
      },
    },
  },
  rubber_bw_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 15,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 25,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 130,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 150,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 200,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 100,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 300,
      },
    },
  },
  silver_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 95,
        speed: 20,
      },
    },
  },
  stainless_steel_bw_engraving_diode: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 10,
      },
    },
  },
  stainless_steel_dark: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 10,
        speed: 300,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 8,
        speed: 300,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 20,
        speed: 400,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 30,
        pulseWidth: 350,
        speed: 150,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 40,
        power: 50,
        pulseWidth: 500,
        speed: 500,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 55,
        power: 30,
        pulseWidth: 100,
        speed: 500,
      },
    },
  },
  stainless_steel_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 90,
        speed: 20,
      },
    },
  },
  stainless_steel_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 50,
        speed: 4500,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 40,
        speed: 4500,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 50,
        speed: 2000,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 20,
        pulseWidth: 350,
        speed: 2000,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 40,
        power: 30,
        pulseWidth: 500,
        speed: 2000,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 55,
        power: 30,
        pulseWidth: 500,
        speed: 4000,
      },
    },
  },
  stainless_steel_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        module: LayerModule.PRINTER,
        multipass: 4,
        speed: 30,
      },
    },
  },
  steel_engraving_spray_engraving: {
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 120,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 140,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 80,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 150,
      },
    },
  },
  stone: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 90,
        speed: 1000,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 72,
        speed: 1000,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 45,
        power: 30,
        speed: 250,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 25,
        power: 60,
        pulseWidth: 350,
        speed: 500,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 40,
        power: 40,
        pulseWidth: 400,
        speed: 850,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 330,
        power: 25,
        pulseWidth: 500,
        speed: 2500,
      },
    },
  },
  ti_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        module: LayerModule.LASER_1064,
        power: 75,
        speed: 30,
      },
    },
  },
  titanium_dark: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 100,
        speed: 700,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 80,
        speed: 700,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.005,
        frequency: 45,
        power: 55,
        speed: 1500,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 80,
        pulseWidth: 350,
        speed: 1000,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.005,
        frequency: 40,
        power: 50,
        pulseWidth: 500,
        speed: 2000,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 55,
        power: 80,
        pulseWidth: 500,
        speed: 1000,
      },
    },
  },
  titanium_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 55,
        speed: 2500,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 44,
        speed: 2500,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 30,
        speed: 2000,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 25,
        power: 60,
        pulseWidth: 350,
        speed: 800,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.005,
        frequency: 40,
        power: 20,
        pulseWidth: 500,
        speed: 2000,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 55,
        power: 30,
        pulseWidth: 500,
        speed: 1000,
      },
    },
  },
  white_abs: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 27,
        power: 30,
        speed: 4000,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 30,
        power: 24,
        speed: 4000,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.01,
        frequency: 45,
        power: 15,
        speed: 4000,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 25,
        power: 40,
        pulseWidth: 350,
        speed: 500,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 40,
        power: 30,
        pulseWidth: 500,
        speed: 1500,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        fillInterval: 0.05,
        frequency: 30,
        power: 100,
        pulseWidth: 500,
        speed: 3000,
      },
    },
  },
  wood_3mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 6,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 8,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 6,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 7,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 15,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 5,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 6,
      },
    },
    flv1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 6,
      },
    },
  },
  wood_5mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 3,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 4,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 3,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 4,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 10,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        repeat: 2,
        speed: 4,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        speed: 3,
      },
    },
    flv1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 3,
      },
    },
  },
  wood_7mm_cutting: {
    ado1: {
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 100,
        speed: 2,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 5,
      },
    },
  },
  wood_8mm_cutting: {
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        repeat: 2,
        speed: 3,
      },
    },
  },
  wood_10mm_cutting: {
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        repeat: 3,
        speed: 3,
      },
    },
  },
  wood_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        module: LayerModule.LASER_10W_DIODE,
        power: 100,
        speed: 150,
      },
      [LayerModule.LASER_20W_DIODE]: {
        module: LayerModule.LASER_20W_DIODE,
        power: 70,
        speed: 150,
      },
    },
    fbb1b: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
        speed: 150,
      },
    },
    fbb1p: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 150,
      },
    },
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 500,
      },
    },
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
        speed: 150,
      },
    },
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 300,
      },
    },
    flv1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 150,
      },
    },
  },
  wood_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        module: LayerModule.PRINTER,
        multipass: 3,
        speed: 60,
      },
    },
  },
};

export default presets;
