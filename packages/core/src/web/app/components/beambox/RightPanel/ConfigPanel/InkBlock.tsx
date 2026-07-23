import React, { memo, useCallback, useMemo, useState } from 'react';

import { match } from 'ts-pattern';

import { PrintingColors } from '@core/app/constants/color-constants';
import { getSaturationOptions, getWhiteSaturationOptions } from '@core/app/constants/config-options';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ColorRationModal from './ColorRatioModal';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import initState from './initState';
import styles from './InkBlock.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const MIN_VALUE = 1;

function InkBlock({ noApply }: CommonProps): React.JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, color, fullcolor, ink, module: layerModule } = useConfigPanelStore();
  const simpleMode = !useGlobalPreferenceStore((state) => state['print-advanced-mode']);
  const [showModal, setShowModal] = useState(false);
  const handleChange = (value: number) => {
    change({ configName: CUSTOM_PRESET_CONSTANT, ink: value });

    if (!noApply) {
      const batchCmd = new history.BatchCommand('Change ink');

      useLayerStore.getState().selectedLayers.forEach((layerName) => {
        writeData(layerName, 'ink', value, { batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }
  };
  const sliderOptions = useMemo(() => {
    if (!simpleMode) return undefined;

    if (color.value === PrintingColors.WHITE) {
      return getWhiteSaturationOptions(lang, layerModule.value);
    }

    return getSaturationOptions(lang, layerModule.value);
  }, [simpleMode, color.value, lang, layerModule.value]);
  const [maxValue, unit] = useMemo(() => {
    return match<LayerModuleType, [number, string | undefined]>(layerModule.value)
      .with(LayerModule.PRINTER_4C, LayerModule.UV_VARNISH, LayerModule.UV_WHITE_INK, () => [100, '%'])
      .otherwise(() => [15, undefined]);
  }, [layerModule.value]);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const content = (
    <div className={styles.panel}>
      <span className={styles.title}>
        {t.ink_saturation}
        {!fullcolor.hasMultiValue && (
          <span className={styles.icon} onClick={openModal} title={t.color_adjustment}>
            <ConfigPanelIcons.ColorAdjustment />
          </span>
        )}
      </span>
      <ConfigValueDisplay
        hasMultiValue={ink.hasMultiValue}
        inputId="saturation-input"
        max={maxValue}
        min={MIN_VALUE}
        onChange={handleChange}
        options={sliderOptions}
        unit={unit}
        value={ink.value}
      />
      <ConfigSlider
        id="saturation"
        max={maxValue}
        min={MIN_VALUE}
        onChange={handleChange}
        options={sliderOptions}
        step={1}
        value={ink.value}
      />
    </div>
  );

  return (
    <>
      {content}
      {showModal && <ColorRationModal fullColor={fullcolor.value} onClose={closeModal} />}
    </>
  );
}

export default memo(InkBlock);
