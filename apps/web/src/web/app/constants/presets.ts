import LayerModule from 'app/constants/layer-module/layer-modules';
import { Preset, PresetModel } from 'interfaces/ILayerConfig';

export const presets: {
  [key: string]: {
    [model in PresetModel]?: {
      [module in LayerModule]?: Preset;
    };
  };
} = {
  wood_3mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 5,
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
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 6,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 8,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  wood_5mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 4,
        repeat: 2,
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
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 3,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 4,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  wood_7mm_cutting: {
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 5,
      },
    },
    ado1: {
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 2,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  wood_8mm_cutting: {
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        speed: 3,
        repeat: 2,
      },
    },
  },
  wood_10mm_cutting: {
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 65,
        speed: 3,
        repeat: 3,
      },
    },
  },
  wood_engraving: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
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
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 150,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 70,
        speed: 150,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  acrylic_3mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 4,
      },
    },
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 6,
      },
    },
  },
  acrylic_5mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 5,
        repeat: 2,
      },
    },
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
        speed: 3,
        repeat: 2,
      },
    },
  },
  acrylic_10mm_cutting: {
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 3,
        repeat: 2,
      },
    },
  },
  acrylic_engraving: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 300,
      },
    },
  },
  black_acrylic_3mm_cutting: {
    flv1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 2,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 2,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 4,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  black_acrylic_5mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 2,
        repeat: 2,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 2,
        repeat: 1,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  black_acrylic_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 90,
        speed: 175,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 65,
        speed: 175,
        module: LayerModule.LASER_20W_DIODE,
      },
      [LayerModule.LASER_1064]: {
        power: 50,
        speed: 40,
        module: LayerModule.LASER_1064,
      },
    },
  },
  mdf_3mm_cutting: {
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 15,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 4,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 8,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  mdf_5mm_cutting: {
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 10,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 2,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 4,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  mdf_engraving: {
    fbb2: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 500,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 30,
        speed: 100,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 70,
        speed: 100,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  leather_3mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 3,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 6,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 4,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 8,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  leather_5mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 3,
        repeat: 2,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 3,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 3,
        repeat: 2,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 6,
        repeat: 2,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  leather_engraving: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 150,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 300,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 30,
        speed: 100,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 30,
        speed: 125,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  denim_1mm_cutting: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 14,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 50,
        speed: 10,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  fabric_3mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 20,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 25,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 6,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 10,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  fabric_5mm_cutting: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 20,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 20,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 2,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 4,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  fabric_engraving: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 250,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 30,
        speed: 125,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 40,
        speed: 150,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  rubber_bw_engraving: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 100,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 300,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 15,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 100,
        speed: 25,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  glass_bw_engraving: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 150,
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 150,
      },
    },
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 40,
        speed: 20,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 40,
        speed: 30,
        module: LayerModule.LASER_20W_DIODE,
      },
    },
  },
  steel_engraving_spray_engraving: {
    fbm1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 80,
      },
    },
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
    fhexa1: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 150,
      },
    },
  },
  metal_bw_engraving: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: {
        power: 100,
        speed: 20,
        module: LayerModule.LASER_10W_DIODE,
      },
      [LayerModule.LASER_20W_DIODE]: {
        power: 90,
        speed: 20,
        module: LayerModule.LASER_20W_DIODE,
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
  gold_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        power: 95,
        speed: 10,
        module: LayerModule.LASER_1064,
      },
    },
  },
  brass_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        power: 85,
        speed: 30,
        module: LayerModule.LASER_1064,
      },
    },
  },
  ti_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        power: 75,
        speed: 30,
        module: LayerModule.LASER_1064,
      },
    },
  },
  stainless_steel_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        power: 90,
        speed: 20,
        module: LayerModule.LASER_1064,
      },
    },
  },
  aluminum_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        power: 80,
        speed: 20,
        module: LayerModule.LASER_1064,
      },
    },
  },
  silver_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        power: 95,
        speed: 20,
        module: LayerModule.LASER_1064,
      },
    },
  },
  iron_engraving: {
    ado1: {
      [LayerModule.LASER_1064]: {
        power: 90,
        speed: 20,
        module: LayerModule.LASER_1064,
      },
    },
  },
  fabric_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        speed: 60,
        multipass: 3,
        module: LayerModule.PRINTER,
      },
    },
  },
  canvas_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        speed: 60,
        multipass: 4,
        module: LayerModule.PRINTER,
      },
    },
  },
  cardstock_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        speed: 60,
        multipass: 3,
        module: LayerModule.PRINTER,
      },
    },
  },
  wood_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        speed: 60,
        multipass: 3,
        module: LayerModule.PRINTER,
      },
    },
  },
  bamboo_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        speed: 60,
        multipass: 3,
        module: LayerModule.PRINTER,
      },
    },
  },
  cork_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        speed: 60,
        multipass: 3,
        module: LayerModule.PRINTER,
      },
    },
  },
  flat_stone_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        speed: 60,
        multipass: 3,
        module: LayerModule.PRINTER,
      },
    },
  },
  acrylic_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        speed: 30,
        multipass: 4,
        module: LayerModule.PRINTER,
      },
    },
  },
  pc_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 2,
        speed: 30,
        multipass: 4,
        module: LayerModule.PRINTER,
      },
    },
  },
  stainless_steel_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        speed: 30,
        multipass: 4,
        module: LayerModule.PRINTER,
      },
    },
  },
  gloss_leather_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        speed: 60,
        multipass: 3,
        module: LayerModule.PRINTER,
      },
    },
  },
  glass_printing: {
    ado1: {
      [LayerModule.PRINTER]: {
        ink: 3,
        speed: 30,
        multipass: 4,
        module: LayerModule.PRINTER,
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
  aluminum_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 90,
        speed: 3500,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 72,
        speed: 3500,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 3500,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 3000,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 5000,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.01,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 4000,
        frequency: 55,
        pulseWidth: 500,
        fillInterval: 0.01,
      },
    },
  },
  stainless_steel_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 4500,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 4500,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 2000,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 2000,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 2000,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.01,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 4000,
        frequency: 55,
        pulseWidth: 500,
        fillInterval: 0.01,
      },
    },
  },
  stainless_steel_dark: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 10,
        speed: 300,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 8,
        speed: 300,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 400,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 150,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 500,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.01,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 500,
        frequency: 55,
        pulseWidth: 100,
        fillInterval: 0.01,
      },
    },
  },
  brass_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 90,
        speed: 1500,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 72,
        speed: 1500,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 3000,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 45,
        speed: 2000,
        frequency: 25,
        pulseWidth: 200,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 1000,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.01,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 75,
        speed: 1500,
        frequency: 55,
        pulseWidth: 500,
        fillInterval: 0.01,
      },
    },
  },
  brass_dark: {
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 90,
        speed: 700,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 80,
        speed: 500,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 700,
        frequency: 40,
        pulseWidth: 300,
        fillInterval: 0.01,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 900,
        frequency: 55,
        pulseWidth: 300,
        fillInterval: 0.01,
      },
    },
  },
  copper: {
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 90,
        speed: 3000,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 90,
        speed: 1000,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 90,
        speed: 1000,
        frequency: 40,
        pulseWidth: 150,
        fillInterval: 0.01,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 4000,
        frequency: 55,
        pulseWidth: 125,
        fillInterval: 0.01,
      },
    },
  },
  titanium_light: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 2500,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 44,
        speed: 2500,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 2000,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 800,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 2000,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.005,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 1000,
        frequency: 55,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
  },
  titanium_dark: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 700,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 80,
        speed: 700,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 55,
        speed: 1500,
        frequency: 45,
        fillInterval: 0.005,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 80,
        speed: 1000,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 50,
        speed: 2000,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.005,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 80,
        speed: 1000,
        frequency: 55,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
  },
  white_abs: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 4000,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 24,
        speed: 4000,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 4000,
        frequency: 45,
        fillInterval: 0.01,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 500,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.05,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 1500,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 3000,
        frequency: 30,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
  },
  black_abs: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 5000,
        frequency: 27,
        fillInterval: 0.05,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 16,
        speed: 5000,
        frequency: 30,
        fillInterval: 0.05,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 700,
        frequency: 45,
        fillInterval: 0.05,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
        speed: 4000,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 2500,
        frequency: 40,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 20,
        speed: 2500,
        frequency: 55,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
  },
  opaque_acrylic: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 5000,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 24,
        speed: 5000,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 1500,
        frequency: 45,
        fillInterval: 0.05,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 15,
        speed: 4000,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.01,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 35,
        speed: 1000,
        frequency: 40,
        pulseWidth: 100,
        fillInterval: 0.05,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 100,
        speed: 3500,
        frequency: 55,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
  },
  stone: {
    fpm1_0_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 90,
        speed: 1000,
        frequency: 27,
        fillInterval: 0.01,
      },
    },
    fpm1_0_30: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 72,
        speed: 1000,
        frequency: 30,
        fillInterval: 0.01,
      },
    },
    fpm1_0_50: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 30,
        speed: 250,
        frequency: 45,
        fillInterval: 0.05,
      },
    },
    fpm1_1_20: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 60,
        speed: 500,
        frequency: 25,
        pulseWidth: 350,
        fillInterval: 0.05,
      },
    },
    fpm1_1_60: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 40,
        speed: 850,
        frequency: 40,
        pulseWidth: 400,
        fillInterval: 0.05,
      },
    },
    fpm1_1_100: {
      [LayerModule.LASER_UNIVERSAL]: {
        power: 25,
        speed: 2500,
        frequency: 330,
        pulseWidth: 500,
        fillInterval: 0.05,
      },
    },
  },
};

export default presets;
