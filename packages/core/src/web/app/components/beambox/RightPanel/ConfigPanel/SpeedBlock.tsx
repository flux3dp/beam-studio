import React, { memo, useContext, useMemo } from 'react';

import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';
import { pick } from 'remeda';
import { sprintf } from 'sprintf-js';
import { useShallow } from 'zustand/react/shallow';

import { promarkModels } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { getSpeedOptions } from '@core/app/constants/config-options';
import { getWarningSpeed as getCurveEngravingWarningSpeed } from '@core/app/constants/curveEngraving';
import { laserModules, LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { getAutoFeeder } from '@core/helpers/addOn';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';
import ObjectPanelItem from '../ObjectPanelItem';
import objectPanelItemStyles from '../ObjectPanelItem.module.scss';

import styles from './Block.module.scss';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import initState from './initState';

const moduleSpeedLimit = 500; // for bm2

const SpeedBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, module, speed } = useConfigPanelStore();
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
  const hasVector = useLayerStore((state) => state.hasVector);
  const simpleMode = !useGlobalPreferenceStore((state) => state['print-advanced-mode']);
  const { activeKey } = useContext(ObjectPanelContext);
  const visible = activeKey === 'speed';
  const { hasData: hasCurveEngraving, maxAngle } = useCurveEngravingStore();
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    [],
  );

  const { hasMultiValue, value } = speed;
  const layerModule = module.value;
  const { isLaser, isNormalLaser, isPrinting } = useMemo(
    () => ({
      isLaser: laserModules.has(layerModule),
      isNormalLaser: layerModule === LayerModule.LASER_UNIVERSAL,
      isPrinting: printingModules.has(layerModule),
    }),
    [layerModule],
  );

  const isInch = useStorageStore((state) => state.isInch);
  const {
    calculateUnit: fakeUnit,
    decimal,
    display: displayUnit,
  } = useMemo(() => {
    return isInch
      ? ({ calculateUnit: 'inch', decimal: 2, display: 'in/s' } as const)
      : ({ calculateUnit: 'mm', decimal: 1, display: 'mm/s' } as const);
  }, [isInch]);
  const workarea = useWorkarea();
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const { 'auto-feeder': autoFeeder, borderless } = useDocumentStore(
    useShallow((state) => pick(state, ['auto-feeder', 'borderless'])),
  );
  const isAutoFeederOn = useMemo(
    () => getAutoFeeder(addOnInfo, { autoFeeder, borderless }),
    [addOnInfo, autoFeeder, borderless],
  );
  const {
    curveSpeedLimit,
    maxSpeed: workareaMaxSpeed,
    minSpeed: minValue,
    minSpeedWarning,
    vectorSpeedLimit,
  } = useMemo(() => {
    const workareaObj = getWorkarea(workarea);

    return {
      curveSpeedLimit: workareaObj.curveSpeedLimit?.x,
      maxSpeed: workareaObj.maxSpeed,
      minSpeed: workareaObj.minSpeed,
      minSpeedWarning: workareaObj.minSpeedWarning,
      vectorSpeedLimit: (isAutoFeederOn && addOnInfo.autoFeeder?.vectorSpeedLimit) || workareaObj.vectorSpeedLimit,
    };
  }, [workarea, addOnInfo, isAutoFeederOn]);

  const maxValue = useMemo(() => {
    let value = workareaMaxSpeed;

    if (curveSpeedLimit !== undefined && hasCurveEngraving) value = Math.min(value, curveSpeedLimit);

    if (layerModule === LayerModule.PRINTER_4C) value = Math.min(value, 45);
    else if (layerModule === LayerModule.LASER_1064 && workarea === 'fbm2') value = Math.min(value, 150);

    return value;
  }, [workareaMaxSpeed, layerModule, workarea, hasCurveEngraving, curveSpeedLimit]);

  const vectorSpeedWarning = useMemo(() => {
    if (!vectorSpeedLimit || !isLaser) return '';

    return sprintf(isAutoFeederOn ? t.speed_constrain_warning_auto_feeder : t.speed_constrain_warning, {
      limit: `${units.convertUnit(vectorSpeedLimit, fakeUnit, 'mm', 2)} ${displayUnit}`,
    });
  }, [vectorSpeedLimit, isLaser, isAutoFeederOn, t, fakeUnit, displayUnit]);

  const moduleSpeedWarning = useMemo(() => {
    return sprintf(t.speed_constrain_warning_module_addon, {
      limit: `${units.convertUnit(moduleSpeedLimit, fakeUnit, 'mm', 2)} ${displayUnit}`,
    });
  }, [t.speed_constrain_warning_module_addon, fakeUnit, displayUnit]);
  const hasVectorLimit = useGlobalPreferenceStore((state) => state.vector_speed_constraint);
  const hasModuleAddon = useDocumentStore((state) => state['enable-1064'] || state['enable-4c']);

  let warningText = '';

  if (!isPromark && isLaser) {
    if (hasVector && hasVectorLimit && vectorSpeedLimit && value > vectorSpeedLimit) {
      warningText = vectorSpeedWarning;
    } else if (minSpeedWarning && value < minSpeedWarning) {
      warningText = t.low_speed_warning;
    } else if (addOnInfo.multiModules && isNormalLaser && hasModuleAddon && value > moduleSpeedLimit) {
      warningText = moduleSpeedWarning;
    }
  }

  const handleChange = (val: number) => {
    change({ configName: CUSTOM_PRESET_CONSTANT, speed: val });
    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change speed');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'speed', val, { applyPrinting: true, batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const sliderOptions = useMemo(
    () => (simpleMode && isPrinting ? getSpeedOptions(lang, layerModule) : undefined),
    [simpleMode, isPrinting, lang, layerModule],
  );
  const warningPercent = useMemo(() => {
    let warningSpeed: null | number = null;

    if (hasCurveEngraving) {
      warningSpeed = getCurveEngravingWarningSpeed(workarea, maxAngle);
    }

    if (!isPrinting && hasVector && vectorSpeedLimit) {
      warningSpeed = warningSpeed ? Math.min(warningSpeed, vectorSpeedLimit) : vectorSpeedLimit;
    }

    if (warningSpeed === null) return undefined;

    return ((warningSpeed - minValue) / (maxValue - minValue)) * 100;
  }, [isPrinting, hasVector, vectorSpeedLimit, minValue, maxValue, hasCurveEngraving, workarea, maxAngle]);

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>
        {t.speed}
        {isPromark && (
          <Tooltip title={t.promark_speed_desc}>
            <QuestionCircleOutlined className={styles.hint} />
          </Tooltip>
        )}
      </span>
      <ConfigValueDisplay
        decimal={decimal}
        hasMultiValue={hasMultiValue}
        inputId="speed-input"
        max={maxValue}
        min={minValue}
        onChange={handleChange}
        options={sliderOptions}
        type={type}
        unit={displayUnit}
        value={Math.min(Math.max(value, minValue), maxValue)}
      />
      <ConfigSlider
        decimal={decimal}
        id="speed"
        isGradient
        max={maxValue}
        min={minValue}
        onChange={handleChange}
        options={sliderOptions}
        step={0.1}
        unit={displayUnit}
        value={value}
        warningPercent={warningPercent}
      />
      {warningText ? (
        <div className={styles.warning}>
          <div className={styles['warning-icon']}>
            <ExclamationCircleOutlined />
          </div>
          <div className={styles['warning-text']}>{warningText}</div>
        </div>
      ) : null}
    </div>
  );

  const displayValue = useMemo(() => {
    const selectedOption = sliderOptions?.find((opt) => opt.value === value);

    if (selectedOption) {
      return selectedOption.label;
    }

    return units.convertUnit(value, fakeUnit, 'mm', decimal);
  }, [decimal, sliderOptions, value, fakeUnit]);

  return type === 'panel-item' ? (
    <Popover content={content} visible={visible}>
      <ObjectPanelItem.Item
        autoClose={false}
        content={
          <Button
            className={classNames(objectPanelItemStyles['number-item'], styles['display-btn'])}
            fill="outline"
            shape="rounded"
            size="mini"
          >
            <span style={{ whiteSpace: 'nowrap' }}>{displayValue}</span>
          </Button>
        }
        id="speed"
        label={t.speed}
      />
    </Popover>
  ) : (
    content
  );
};

export default memo(SpeedBlock);
