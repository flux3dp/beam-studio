import colorConstants, { PrintingColors } from '@core/app/constants/color-constants';
import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import { getData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getDefaultPreset } from '@core/helpers/presets/preset-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { ConfigKey, PresetModel } from '@core/interfaces/ILayerConfig';

/**
 * Only rewrite keys whose value differs by dpi (per preset.dpiOverrides), so manual edits
 * to other keys survive the dpi change. Mirrors the merge in applyPreset, but surgical.
 * @returns whether any key was rewritten
 */
export const applyDpiOverrides = (
  layer: Element,
  prevDpi: EngraveDpiOption,
  newDpi: EngraveDpiOption,
  model: PresetModel,
  batchCmd?: IBatchCommand,
): boolean => {
  const configName = getData(layer, 'configName');

  if (!configName) return false;

  const preset = getDefaultPreset(configName, model, getData(layer, 'module'));
  const oldOverrides = preset?.dpiOverrides?.[prevDpi];
  const newOverrides = preset?.dpiOverrides?.[newDpi];

  if (!oldOverrides && !newOverrides) return false;

  let changed = false;

  for (const key of Object.keys({ ...oldOverrides, ...newOverrides }) as ConfigKey[]) {
    const newValue = newOverrides?.[key] ?? preset![key];

    if (newValue === undefined) continue;

    writeDataLayer(layer, key, newValue as any, { batchCmd });
    changed = true;
  }

  return changed;
};

/**
 * minPower is meaningless once power drops to it, clear it.
 * @returns whether minPower was cleared
 */
export const clearMinPower = (layer: Element, power: number, batchCmd?: IBatchCommand): boolean => {
  const minPower = getData(layer, 'minPower');

  if (!minPower || power > minPower) return false;

  writeDataLayer(layer, 'minPower', 0, { batchCmd });

  return true;
};

/**
 * Toggling fullcolor also repaints the layer and, when turning it off, resets colors that only
 * exist in full color mode.
 * @returns whether the layer color was reset
 */
export const applyFullColor = (layer: Element, fullcolor: boolean, batchCmd: IBatchCommand): boolean => {
  if (getData(layer, 'fullcolor') === fullcolor) return false;

  let colorChanged = false;

  if (!fullcolor && !colorConstants.printingLayerColor.includes(getData(layer, 'color') as PrintingColors)) {
    writeDataLayer(layer, 'color', PrintingColors.BLACK, { batchCmd });
    colorChanged = true;
  }

  const cmd = toggleFullColorLayer(layer, { val: fullcolor });

  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

  return colorChanged;
};
