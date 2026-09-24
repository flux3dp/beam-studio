import React, { useMemo } from 'react';

import { ConfigProvider } from 'antd';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import {
  applyPreset,
  CUSTOM_PRESET_CONSTANT,
  forcedKeys,
  getConfigKeys,
  getDefaultConfig,
} from '@core/helpers/layer/layer-config-helper';
import { usePresetList } from '@core/helpers/presets/preset-helper';
import { checkPresetTutorialStep } from '@core/helpers/presets/preset-tutorial';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './ConfigPanel.module.scss';
import initState from './initState';

export const PARAMETERS_CONSTANT = 'parameters';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

interface PresetDropdownProps {
  UIType: 'default' | 'modal' | 'panel-item';
}

/**
 * The legacy flat preset dropdown (id="laser-config-dropdown"), extracted verbatim from
 * ConfigPanel. Rendered in old mode; new mode renders MaterialChip instead.
 */
const PresetDropdown = ({ UIType }: PresetDropdownProps): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const forceUpdate = useForceUpdate();
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
  const { change, getState } = useConfigPanelStore();
  const state = getState();
  const { module } = state;
  const presetList = usePresetList(workarea, module.value);

  const hiddenOptions = useMemo(
    () => [
      { key: lang.dropdown.parameters, label: lang.dropdown.parameters, value: PARAMETERS_CONSTANT },
      { key: lang.custom_preset, label: lang.custom_preset, value: lang.custom_preset },
      { key: lang.various_preset, label: lang.various_preset, value: lang.various_preset },
    ],
    [lang.dropdown.parameters, lang.custom_preset, lang.various_preset],
  );

  const dropdownValue = useMemo(() => {
    const { configName: name, diode, ink, multipass, power, repeat, speed, zStep } = state;
    const hasMultiValueList = [speed, power, ink, repeat, diode, zStep, name, multipass];

    // multi select
    if (hasMultiValueList.some((item) => item.hasMultiValue)) {
      return lang.various_preset;
    }

    if (name.value === CUSTOM_PRESET_CONSTANT) {
      return lang.custom_preset;
    }

    const preset = presetList?.find((p) => name.value === p.key || name.value === p.name);

    if (!preset) {
      return lang.custom_preset;
    }

    if (name.value) {
      return preset.key ?? preset.name;
    }

    return PARAMETERS_CONSTANT;
  }, [state, lang, presetList]);

  const handleSelectPresets = (value: string) => {
    if (value === PARAMETERS_CONSTANT) {
      forceUpdate();

      return;
    }

    const preset = presetList.find((p) => value === p.key || value === p.name);

    if (!preset) {
      console.error('No such value', value);

      return;
    }

    const changedKeys = getConfigKeys(module.value);
    const defaultConfig = getDefaultConfig();
    const payload: Record<string, boolean | number | string> = {};

    payload.configName = value;

    const { maxSpeed, minSpeed } = getWorkarea(workarea);
    const { dpiOverrides, ...base } = preset;
    const dpi = state.dpi.value;
    const resolvedPreset = { ...base, ...dpiOverrides?.[dpi] };

    for (const key of changedKeys) {
      let val = resolvedPreset[key];

      if (val === undefined) {
        if (!forcedKeys.includes(key)) continue;

        val = defaultConfig[key];
      }

      if (key === 'speed') {
        val = Math.max(minSpeed, Math.min(val as number, maxSpeed));
      }

      payload[key] = val! as any;
    }

    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    change(payload);

    if (UIType !== 'modal') {
      const batchCmd = new history.BatchCommand('Change layer preset');

      selectedLayers.forEach((layerName: string) => {
        const layer = layerManager.getLayerElementByName(layerName)!;

        applyPreset(layer, preset, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }

    checkPresetTutorialStep(preset);
  };

  const dropdownOptions = presetList.map((e) => ({
    key: e.key || e.name,
    label: e.name,
    value: e.key || e.name,
  })) as Array<{ key: string; label: string; value: string }>;

  if (UIType === 'panel-item') {
    return (
      <ObjectPanelItem.Select
        id="laser-config-dropdown"
        label={lang.presets}
        onChange={handleSelectPresets as any}
        options={[...dropdownOptions, ...hiddenOptions.filter((option) => option.value === dropdownValue)]}
        selected={
          dropdownOptions.find((option) => option.value === dropdownValue) || {
            label: dropdownValue!,
            value: dropdownValue!,
          }
        }
      />
    );
  }

  if (UIType === 'modal') {
    return (
      <ConfigProvider theme={{ components: { Select: { borderRadius: 100, controlHeight: 30 } } }}>
        <Select
          className={styles.select}
          id="laser-config-dropdown"
          onChange={handleSelectPresets}
          options={[...dropdownOptions, ...hiddenOptions.filter((option) => option.value === dropdownValue)]}
          value={dropdownValue}
        />
      </ConfigProvider>
    );
  }

  return (
    <div className={styles['preset-dropdown-container']}>
      <Select
        className={styles['preset-dropdown']}
        id="laser-config-dropdown"
        onChange={handleSelectPresets}
        options={[...hiddenOptions.filter((option) => option.value === dropdownValue), ...dropdownOptions]}
        placement="bottomRight"
        popupMatchSelectWidth={false}
        value={dropdownValue}
      />
    </div>
  );
};

export default PresetDropdown;
