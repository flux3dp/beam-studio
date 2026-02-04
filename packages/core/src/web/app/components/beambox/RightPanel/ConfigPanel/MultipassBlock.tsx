import React, { memo, useContext, useMemo } from 'react';

import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';

import configOptions from '@core/app/constants/config-options';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';
import ObjectPanelItem from '../ObjectPanelItem';
import objectPanelItemStyles from '../ObjectPanelItem.module.scss';

import styles from './Block.module.scss';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import initState from './initState';

interface Props {
  type?: 'default' | 'modal' | 'panel-item';
}

const MultipassBlock = ({ type = 'default' }: Props): React.JSX.Element => {
  const MIN_VALUE = 1;
  const MAX_VALUE = 10;
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const { activeKey } = useContext(ObjectPanelContext);

  const { change, multipass } = useConfigPanelStore();
  const simpleMode = !useGlobalPreferenceStore((state) => state['print-advanced-mode']);
  const { hasMultiValue, value } = multipass;
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    [],
  );

  const handleChange = (val: number) => {
    change({ configName: CUSTOM_PRESET_CONSTANT, multipass: val });
    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change multipass');

      useLayerStore.getState().selectedLayers.forEach((layerName) => {
        writeData(layerName, 'multipass', val, { batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const sliderOptions = useMemo(() => (simpleMode ? configOptions.multipassOptions : undefined), [simpleMode]);

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>{t.print_multipass}</span>
      <ConfigValueDisplay
        hasMultiValue={hasMultiValue}
        inputId="multipass-input"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        options={sliderOptions}
        type={type}
        unit={t.times}
        value={value}
      />
      <ConfigSlider
        id="multipass"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        options={sliderOptions}
        step={1}
        value={value}
      />
    </div>
  );

  return type === 'panel-item' ? (
    <Popover content={content} visible={activeKey === 'multipass'}>
      <ObjectPanelItem.Item
        autoClose={false}
        content={
          <Button
            className={classNames(objectPanelItemStyles['number-item'], styles['display-btn'])}
            fill="outline"
            shape="rounded"
            size="mini"
          >
            {value}
          </Button>
        }
        id="multipass"
        label={t.print_multipass}
      />
    </Popover>
  ) : (
    content
  );
};

export default memo(MultipassBlock);
