import beamboxPreference from 'app/actions/beambox/beambox-preference';
import LayerModule from 'app/constants/layer-module/layer-modules';
import i18n from 'helpers/i18n';

const LaserModuleSet = new Set([
  LayerModule.LASER_10W_DIODE,
  LayerModule.LASER_20W_DIODE,
]);

const getDefaultLaserModule = (): LayerModule => {
  const value = beamboxPreference.read('default-laser-module') as LayerModule;
  if (LaserModuleSet.has(value)) return value;
  return LayerModule.LASER_20W_DIODE;
}

const getModulesTranslations = (): { [module: number]: string } => {
  const t = i18n.lang.layer_module;
  return {
    0: t.none,
    [LayerModule.LASER_10W_DIODE]: t.laser_10w_diode,
    [LayerModule.LASER_20W_DIODE]: t.laser_20w_diode,
    [LayerModule.LASER_1064]: t.laser_2w_infrared,
    [LayerModule.PRINTER]: t.printing,
    [LayerModule.UNKNOWN]: t.unknown,
  };
};

export default {
  getDefaultLaserModule,
  getModulesTranslations,
};
