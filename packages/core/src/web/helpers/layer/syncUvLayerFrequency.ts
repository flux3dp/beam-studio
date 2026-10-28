import layerManager from '@core/app/svgedit/layer/layerManager';
import { getAllPresets } from '@core/helpers/presets/preset-helper';

import { getData, writeDataLayer } from './layer-config-helper';
import { uvFrequencyToPower, uvPowerToFrequency } from './uvPowerFrequency';

/**
 * Make every layer's frequency stand for the power it already has, for a document whose laser
 * source has just become Promark UV.
 *
 * UV realises power through the frequency (uvPowerFrequency.ts): the panel shows the power derived
 * from the frequency, and the frequency is what the source gets. A layer carried over from another
 * source keeps a frequency that meant something else there — a beamo layer's 27 kHz is clamped to
 * the UV floor of 30 kHz, which reads as 100% — so a 15% layer would fire at full power. The power
 * is what the user set and sees, so it wins: the frequency is derived from it, and the power is
 * rewritten to the value that frequency stands for (the two then agree, within the UV range).
 *
 * Layers on a default preset are left alone: postPresetChange re-applies the UV preset to them.
 * Called from the document settings and from registerPromarkInfoListener (machine selection).
 */
export const syncUvLayerFrequency = (): void => {
  const presets = getAllPresets();

  layerManager.getAllLayers().forEach((layer) => {
    const group = layer.getGroup();

    if (!group) return;

    const configName = getData(group, 'configName');
    const preset = presets.find((p) => !p.hide && (configName === p.key || configName === p.name));

    if (preset?.isDefault) return;

    // at 100% a frequency already in the 30–40kHz band is kept, so no entry turns a legal 35kHz into 40
    const frequency = uvPowerToFrequency(getData(group, 'power') as number, getData(group, 'frequency') as number);

    writeDataLayer(group, 'frequency', frequency);
    writeDataLayer(group, 'power', uvFrequencyToPower(frequency));
  });
};

export default syncUvLayerFrequency;
