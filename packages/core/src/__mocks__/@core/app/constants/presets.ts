import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

export const presets = {
  pre1: {
    ado1: {
      [LayerModule.LASER_10W_DIODE]: { power: 50, speed: 50 },
      [LayerModule.PRINTER]: { ink: 3, multipass: 3, speed: 60 },
    },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 30, speed: 30 } },
  },
  pre2: {
    ado1: { [LayerModule.LASER_20W_DIODE]: { power: 60, speed: 60 } },
    fbm1: { [LayerModule.LASER_UNIVERSAL]: { power: 40, speed: 40 } },
  },
};

export default presets;
