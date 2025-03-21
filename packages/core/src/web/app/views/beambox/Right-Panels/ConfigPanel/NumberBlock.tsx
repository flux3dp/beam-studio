import React, { memo, useContext, useMemo } from 'react';

import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import {
  CUSTOM_PRESET_CONSTANT,
  presetRelatedConfigs,
  timeRelatedConfigs,
  writeData,
} from '@core/helpers/layer/layer-config-helper';
import storage from '@core/implementations/storage';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import Input from './Input';

interface Props {
  configKey: ConfigKey;
  hasSlider?: boolean;
  id?: string;
  max?: number;
  min?: number;
  precision?: number;
  sliderStep?: number;
  step?: number;
  title: string;
  type?: 'default' | 'modal' | 'panel-item';
  unit?: string;
}

// TODO: use this for simple blocks in ConfigPanel, write unit tests
const NumberBlock = ({
  configKey: key,
  hasSlider,
  id,
  max = 100,
  min = 0,
  precision = 0,
  sliderStep,
  step = 1,
  title,
  type = 'default',
  unit,
}: Props): React.ReactNode => {
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { isPresetRelated, isTimeRelated } = useMemo(
    () => ({
      isPresetRelated: presetRelatedConfigs.has(key),
      isTimeRelated: timeRelatedConfigs.has(key),
    }),
    [key],
  );
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    [],
  );
  const { isInch, unit: displayUnit } = useMemo(() => {
    if (!unit?.includes('mm') || storage.get('default-units') !== 'inches') {
      return { isInch: false, unit };
    }

    return { isInch: true, unit: unit.replace('mm', 'in') };
  }, [unit]);
  const {
    [key]: { hasMultiValue, value },
  } = state;

  if (typeof value !== 'number') {
    console.warn(`NumberBlock: Config ${key}: ${value} type is not number`);

    return null;
  }

  const handleChange = (newVal: number) => {
    const noHistory = value > max || value < min;

    dispatch({
      payload: { configName: isPresetRelated ? CUSTOM_PRESET_CONSTANT : undefined, [key]: newVal },
      type: 'change',
    });

    if (isTimeRelated) timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);

    if (type !== 'modal') {
      const batchCmd = noHistory ? undefined : new history.BatchCommand('Change AM Density');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, key, newVal, { batchCmd });

        if (isPresetRelated) {
          writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
        }
      });

      if (batchCmd) {
        batchCmd.onAfter = initState;
        undoManager.addCommandToHistory(batchCmd);
      }
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      decimal={precision}
      id={id ?? key}
      label={title}
      max={max}
      min={min}
      updateValue={handleChange}
      value={value}
    />
  ) : (
    <div className={classNames(styles.panel, { [styles['without-drag']]: !hasSlider })}>
      <span className={styles.title}>{title}</span>
      <Input
        hasMultiValue={hasMultiValue}
        id={id}
        isInch={isInch}
        max={max}
        min={min}
        onChange={handleChange}
        precision={precision}
        step={step * (isInch ? 1.27 : 1)}
        unit={displayUnit}
        value={value}
      />
      {hasSlider && (
        <ConfigSlider
          id={id ? `${id}-slider` : undefined}
          max={max}
          min={min}
          onChange={handleChange}
          step={(sliderStep ?? step) * (isInch ? 1.27 : 1)}
          value={value}
        />
      )}
    </div>
  );
};

export default memo(NumberBlock);
