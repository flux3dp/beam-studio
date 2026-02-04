import React, { memo, useCallback, useContext, useEffect, useMemo } from 'react';

import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import {
  CUSTOM_PRESET_CONSTANT,
  presetRelatedConfigs,
  timeRelatedConfigs,
  writeDataLayer,
} from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import units from '@core/helpers/units';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';
import ObjectPanelItem from '../ObjectPanelItem';
import objectPanelItemStyles from '../ObjectPanelItem.module.scss';

import styles from './Block.module.scss';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import initState from './initState';

interface Props {
  configKey: ConfigKey;
  /** not detect inch or mm, always use props unit */
  forceUsePropsUnit?: boolean;
  hasSlider?: boolean;
  id?: string;
  lightTitle?: boolean;
  max?: number;
  min?: number;
  /**  Number input or button for panel-item */
  panelType?: 'button' | 'input';
  precision?: number;
  precisionInch?: number;
  sliderStep?: number;
  step?: number;
  title: string;
  tooltip?: string;
  type?: 'default' | 'modal' | 'panel-item';
  unit?: string;
  warning?: string;
}

const NumberBlock = ({
  configKey: key,
  forceUsePropsUnit,
  hasSlider,
  id,
  lightTitle,
  max = 100,
  min = 0,
  panelType = 'input',
  precision = 0,
  precisionInch = precision + 2,
  sliderStep,
  step = 1,
  title,
  tooltip,
  type = 'default',
  unit,
  warning,
}: Props): React.ReactNode => {
  const isPanelType = useMemo(() => type === 'panel-item', [type]);
  const { activeKey } = useContext(ObjectPanelContext);
  const {
    change,
    [key]: { hasMultiValue, value = 0 },
  } = useConfigPanelStore();
  const { isPresetRelated, isTimeRelated } = useMemo(
    () => ({
      isPresetRelated: presetRelatedConfigs.has(key),
      isTimeRelated: timeRelatedConfigs.has(key),
    }),
    [key],
  );
  const isDefaultInch = useStorageStore((state) => state.isInch);
  const { isInch, unit: displayUnit } = useMemo(() => {
    if (forceUsePropsUnit || !unit?.includes('mm') || !isDefaultInch) {
      return { isInch: false, unit };
    }

    return { isInch: true, unit: unit.replace('mm', 'in') };
  }, [unit, forceUsePropsUnit, isDefaultInch]);
  const displayPrecision = useMemo(
    () => (isInch ? (precisionInch ?? precision) : precision),
    [isInch, precision, precisionInch],
  );

  const handleChange = useCallback(
    (newVal: number) => {
      if ((newVal === value && !hasMultiValue) || typeof value !== 'number') return;

      const noHistory = value > max || value < min;
      const payload: Record<string, number | string> = { [key]: newVal };
      const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

      if (isPresetRelated) payload.configName = CUSTOM_PRESET_CONSTANT;

      change(payload);

      if (isTimeRelated) timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);

      if (type !== 'modal') {
        const batchCmd = noHistory ? undefined : new history.BatchCommand(`Change ${key}`);

        useLayerStore.getState().selectedLayers.forEach((layerName) => {
          const layer = getLayerByName(layerName)!;

          writeDataLayer(layer, key, newVal, { batchCmd });

          if (isPresetRelated) {
            writeDataLayer(layer, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
          }
        });

        if (batchCmd) {
          batchCmd.onAfter = initState;
          undoManager.addCommandToHistory(batchCmd);
        }
      }
    },
    [change, value, key, max, min, isPresetRelated, isTimeRelated, type, hasMultiValue],
  );

  useEffect(() => {
    if (typeof value !== 'number') return;

    if (value > max) handleChange(max);

    if (value < min) handleChange(min);
  }, [value, max, min, handleChange]);

  if (typeof value !== 'number') {
    console.warn(`NumberBlock: Config ${key}: ${value} type is not number`);

    return null;
  }

  if (isPanelType && panelType === 'button') {
    return (
      <ObjectPanelItem.Number
        decimal={displayPrecision}
        id={id ?? key}
        label={title}
        max={max}
        min={min}
        unit={unit}
        updateValue={handleChange}
        value={value}
      />
    );
  }

  const content = (
    <div className={classNames(styles.panel, { [styles['without-drag']]: !hasSlider })}>
      <span className={classNames(styles.title, { [styles.light]: lightTitle })}>
        {title}
        {tooltip && (
          <Tooltip classNames={{ root: styles['hint-overlay'] }} title={tooltip}>
            <QuestionCircleOutlined className={styles.hint} />
          </Tooltip>
        )}
      </span>
      <ConfigValueDisplay
        decimal={displayPrecision}
        hasMultiValue={hasMultiValue}
        inputId={id}
        isInch={isInch}
        max={max}
        min={min}
        onChange={handleChange}
        step={step * (isInch ? 1.27 : 1)}
        type={type}
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
      {warning && (
        <div className={styles.warning}>
          <div className={styles['warning-icon']}>
            <ExclamationCircleOutlined />
          </div>
          <div className={styles['warning-text']}>{warning}</div>
        </div>
      )}
    </div>
  );

  return isPanelType ? (
    <Popover content={content} visible={activeKey === key}>
      <ObjectPanelItem.Item
        autoClose={false}
        content={
          <Button className={objectPanelItemStyles['number-item']} fill="outline" shape="rounded" size="mini">
            {isInch ? units.convertUnit(value, 'inch', 'mm').toFixed(precision) : value}
          </Button>
        }
        id={key}
        label={title}
      />
    </Popover>
  ) : (
    content
  );
};

export default memo(NumberBlock);
