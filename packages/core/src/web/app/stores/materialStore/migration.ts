import { presetMappings } from '@core/app/constants/material-catalog/mapping';
import type { Preset } from '@core/interfaces/ILayerConfig';
import type { MaterialPreset } from '@core/interfaces/IMaterial';

import { generateUserId } from './utils';

export interface LegacyConversionResult {
  /** origin: 'user' presets for the "My Materials" bucket */
  bucketPresets: MaterialPreset[];
  /** Legacy hidden defaults, mapped to catalog preset ids (= legacy keys) */
  disabledPresetIds: string[];
}

/**
 * Converts the legacy `presets` storage array (already normalized from
 * customizedLaserConfigs by preset-helper's own migration) into Material Browser
 * user data. Pure — shared by first-activation migration and the legacy import shim.
 * Never writes any storage key.
 */
export const convertLegacyPresets = (legacy: Preset[] | undefined): LegacyConversionResult => {
  const bucketPresets: MaterialPreset[] = [];
  const disabledPresetIds: string[] = [];

  if (!legacy) return { bucketPresets, disabledPresetIds };

  for (const entry of legacy) {
    if (entry.isDefault) {
      // Catalog preset ids reuse the presets.ts keys, so the hide flag maps 1:1
      if (entry.hide && entry.key && presetMappings[entry.key]) {
        disabledPresetIds.push(entry.key);
      }

      continue;
    }

    const { hide, isDefault: _isDefault, key, module, name, ...values } = entry;

    bucketPresets.push({
      id: generateUserId(),
      name: name ?? key ?? 'preset',
      origin: 'user',
      settings: { '*': { [module ?? '*']: values } },
    });

    if (hide && bucketPresets.length > 0) {
      // Legacy user presets could be hidden too — carry the state over
      disabledPresetIds.push(bucketPresets[bucketPresets.length - 1].id);
    }
  }

  return { bucketPresets, disabledPresetIds };
};
