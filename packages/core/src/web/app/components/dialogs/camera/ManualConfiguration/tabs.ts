import {
  fisheyeModels,
  legacyBeamSeriesModels,
  modelsWithModules,
  promarkModels,
} from '@core/app/actions/beambox/constant';

/** Which tabs a model gets; see docs/prd/manual-calibration-config.md §5 */
export const getManualConfigurationTabs = (model: string) => ({
  camera: fisheyeModels.has(model) || model === 'fbm2' || promarkModels.has(model) || legacyBeamSeriesModels.has(model),
  modules: modelsWithModules.has(model),
  printAndCut: true,
});
