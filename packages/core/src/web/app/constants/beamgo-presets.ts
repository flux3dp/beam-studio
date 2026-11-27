// Values from the BeamGo USB handoff (FLUX Go 1.0.2, 2026-11-24).
// Image DPI maps to the nearest Beam Studio resolution; sourceDpi retains the supplied value.
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { Preset, PresetModel } from '@core/interfaces/ILayerConfig';

import data from './beamgo-presets.json';

export const beamGoPresetNames = Object.fromEntries(
  data.map(({ key, mode, nameEn, nameZh }) => [key, { mode: mode as 'cut' | 'fill' | 'line', nameEn, nameZh }]),
);

export const beamGoPresets: Record<
  string,
  Partial<Record<PresetModel, Partial<Record<number, Preset>>>>
> = Object.fromEntries(
  data.map(({ config, key, model }) => [key, { [model]: { [LayerModule.LASER_UNIVERSAL]: config as Preset } }]),
);
