import classNames from 'classnames';
import React, { memo, useContext, useMemo } from 'react';
import { Button, Popover } from 'antd-mobile';

import configOptions from 'app/constants/config-options';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from 'app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import useI18n from 'helpers/useI18n';
import { CUSTOM_PRESET_CONSTANT, writeData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';

import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './Block.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  type?: 'default' | 'panel-item' | 'modal';
}

const MultipassBlock = ({ type = 'default' }: Props): JSX.Element => {
  const MIN_VALUE = 1;
  const MAX_VALUE = 10;
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const { activeKey } = useContext(ObjectPanelContext);

  const {
    selectedLayers,
    state,
    dispatch,
    simpleMode = true,
    initState,
  } = useContext(ConfigPanelContext);
  const { multipass } = state;
  const { value, hasMultiValue } = multipass;
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    []
  );

  const handleChange = (val: number) => {
    dispatch({
      type: 'change',
      payload: { multipass: val, configName: CUSTOM_PRESET_CONSTANT },
    });
    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change multipass');
      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'multipass', val, { batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }
  };

  const sliderOptions = useMemo(
    () => (simpleMode ? configOptions.multipassOptions : null),
    [simpleMode]
  );

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>{t.print_multipass}</span>
      <ConfigValueDisplay
        inputId="multipass-input"
        type={type}
        max={MAX_VALUE}
        min={MIN_VALUE}
        value={value}
        unit={t.times}
        hasMultiValue={hasMultiValue}
        onChange={handleChange}
        options={sliderOptions}
      />
      <ConfigSlider
        id="multipass"
        value={value}
        onChange={handleChange}
        min={MIN_VALUE}
        max={MAX_VALUE}
        step={1}
        options={sliderOptions}
      />
    </div>
  );

  return type === 'panel-item' ? (
    <Popover visible={activeKey === 'multipass'} content={content}>
      <ObjectPanelItem.Item
        id="multipass"
        content={
          <Button
            className={classNames(objectPanelItemStyles['number-item'], styles['display-btn'])}
            shape="rounded"
            size="mini"
            fill="outline"
          >
            {value}
          </Button>
        }
        label={t.print_multipass}
        autoClose={false}
      />
    </Popover>
  ) : (
    content
  );
};

export default memo(MultipassBlock);
