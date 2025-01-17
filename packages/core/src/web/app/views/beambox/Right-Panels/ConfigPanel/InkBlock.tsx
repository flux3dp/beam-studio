import classNames from 'classnames';
import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import { Button, Popover } from 'antd-mobile';

import ConfigPanelIcons from 'app/icons/config-panel/ConfigPanelIcons';
import configOptions from 'app/constants/config-options';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ObjectPanelIcons from 'app/icons/object-panel/ObjectPanelIcons';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from 'app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import useI18n from 'helpers/useI18n';
import { CUSTOM_PRESET_CONSTANT, writeData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import { PrintingColors } from 'app/constants/color-constants';

import ConfigPanelContext from './ConfigPanelContext';
import ColorRationModal from './ColorRatioModal';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './InkBlock.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const MAX_VALUE = 15;
const MIN_VALUE = 1;

function InkBlock({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const {
    selectedLayers,
    state,
    dispatch,
    simpleMode = true,
    initState,
  } = useContext(ConfigPanelContext);
  const { activeKey } = useContext(ObjectPanelContext);
  const [showModal, setShowModal] = useState(false);
  const visible = activeKey === 'power';
  const { ink, color, fullcolor } = state;
  const handleChange = (value: number) => {
    dispatch({
      type: 'change',
      payload: { ink: value, configName: CUSTOM_PRESET_CONSTANT },
    });
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
    if (!simpleMode) return null;
    if (color.value === PrintingColors.WHITE) return configOptions.getWhiteSaturationOptions(lang);
    return configOptions.getSaturationOptions(lang);
  }, [simpleMode, color.value, lang]);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>
        {t.ink_saturation}
        {!fullcolor.hasMultiValue && type !== 'panel-item' && (
          <span className={styles.icon} title={t.color_adjustment} onClick={openModal}>
            <ConfigPanelIcons.ColorAdjustment />
          </span>
        )}
      </span>
      <ConfigValueDisplay
        inputId="saturation-input"
        type={type}
        max={MAX_VALUE}
        min={MIN_VALUE}
        value={ink.value}
        hasMultiValue={ink.hasMultiValue}
        onChange={handleChange}
        options={sliderOptions}
      />
      <ConfigSlider
        id="saturation"
        value={ink.value}
        onChange={handleChange}
        min={MIN_VALUE}
        max={MAX_VALUE}
        step={1}
        options={sliderOptions}
      />
    </div>
  );

  const displayValue = useMemo(() => {
    const selectedOption = sliderOptions?.find((opt) => opt.value === ink.value);
    if (selectedOption) return selectedOption.label;
    return ink.value;
  }, [ink.value, sliderOptions]);

  return (
    <>
      {type === 'panel-item' ? (
        <>
          {fullcolor.value && <ObjectPanelItem.Divider />}
          <Popover visible={visible} content={content}>
            <ObjectPanelItem.Item
              id="power"
              content={
                <Button
                  className={objectPanelItemStyles['number-item']}
                  shape="rounded"
                  size="mini"
                  fill="outline"
                >
                  <span style={{ whiteSpace: 'nowrap' }}>{displayValue}</span>
                </Button>
              }
              label={t.ink_saturation}
              autoClose={false}
            />
          </Popover>
          <ObjectPanelItem.Item
            id="color-adjustment"
            content={<ObjectPanelIcons.Parameter />}
            label={t.color_adjustment_short}
            onClick={openModal}
            disabled={!fullcolor.value}
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
