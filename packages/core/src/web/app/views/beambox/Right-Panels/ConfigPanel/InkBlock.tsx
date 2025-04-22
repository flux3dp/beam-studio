import React, { memo, useCallback, useContext, useMemo, useState } from 'react';

import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';

import { PrintingColors } from '@core/app/constants/color-constants';
import configOptions from '@core/app/constants/config-options';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from '@core/app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import { useBeamboxPreference } from '@core/helpers/hooks/useBeamboxPreference';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ColorRationModal from './ColorRatioModal';
import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import initState from './initState';
import styles from './InkBlock.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const MAX_VALUE = 15;
const MIN_VALUE = 1;

function InkBlock({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, color, fullcolor, ink } = useConfigPanelStore();
  const { selectedLayers } = useContext(ConfigPanelContext);
  const simpleMode = !useBeamboxPreference('print-advanced-mode');
  const { activeKey } = useContext(ObjectPanelContext);
  const [showModal, setShowModal] = useState(false);
  const visible = activeKey === 'power';
  const handleChange = (value: number) => {
    change({ configName: CUSTOM_PRESET_CONSTANT, ink: value });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change ink');

      selectedLayers.forEach((layerName) => {
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
      return configOptions.getWhiteSaturationOptions(lang);
    }

    return configOptions.getSaturationOptions(lang);
  }, [simpleMode, color.value, lang]);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>
        {t.ink_saturation}
        {!fullcolor.hasMultiValue && type !== 'panel-item' && (
          <span className={styles.icon} onClick={openModal} title={t.color_adjustment}>
            <ConfigPanelIcons.ColorAdjustment />
          </span>
        )}
      </span>
      <ConfigValueDisplay
        hasMultiValue={ink.hasMultiValue}
        inputId="saturation-input"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        options={sliderOptions}
        type={type}
        value={ink.value}
      />
      <ConfigSlider
        id="saturation"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        options={sliderOptions}
        step={1}
        value={ink.value}
      />
    </div>
  );

  const displayValue = useMemo(() => {
    const selectedOption = sliderOptions?.find((opt) => opt.value === ink.value);

    if (selectedOption) {
      return selectedOption.label;
    }

    return ink.value;
  }, [ink.value, sliderOptions]);

  return (
    <>
      {type === 'panel-item' ? (
        <>
          {fullcolor.value && <ObjectPanelItem.Divider />}
          <Popover content={content} visible={visible}>
            <ObjectPanelItem.Item
              autoClose={false}
              content={
                <Button className={objectPanelItemStyles['number-item']} fill="outline" shape="rounded" size="mini">
                  <span style={{ whiteSpace: 'nowrap' }}>{displayValue}</span>
                </Button>
              }
              id="power"
              label={t.ink_saturation}
            />
          </Popover>
          <ObjectPanelItem.Item
            content={<ObjectPanelIcons.Parameter />}
            disabled={!fullcolor.value}
            id="color-adjustment"
            label={t.color_adjustment_short}
            onClick={openModal}
          />
          {fullcolor.value && <ObjectPanelItem.Divider />}
        </>
      ) : (
        content
      )}
      {showModal && <ColorRationModal fullColor={fullcolor.value} onClose={closeModal} />}
    </>
  );
}

export default memo(InkBlock);
