import React, { memo, useContext, useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { promarkModels } from '@core/app/actions/beambox/constant';
import configOptions from '@core/app/constants/config-options';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import history from '@core/app/svgedit/history/history';
import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from '@core/app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import doLayersContainsVector from '@core/helpers/layer/check-vector';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import storage from '@app/implementations/storage';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const SpeedBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { dispatch, initState, selectedLayers, simpleMode = true, state } = useContext(ConfigPanelContext);
  const { activeKey } = useContext(ObjectPanelContext);
  const visible = activeKey === 'speed';
  const { hasVector } = useContext(LayerPanelContext);
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    [],
  );

  const { hasMultiValue, value } = state.speed;
  const module = state.module.value;

  const {
    calculateUnit: fakeUnit,
    decimal,
    display: displayUnit,
  } = useMemo(() => {
    const unit: 'inches' | 'mm' = storage.get('default-units') || 'mm';
    const display = { inches: 'in/s', mm: 'mm/s' }[unit];

    const calculateUnit: 'inch' | 'mm' = { inches: 'inch', mm: 'mm' }[unit] as any;
    const d = { inches: 2, mm: 1 }[unit];

    return { calculateUnit, decimal: d, display };
  }, []);
  const workarea: WorkAreaModel = BeamboxPreference.read('workarea');
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const {
    vectorSpeedLimit,
    workareaMaxSpeed: maxValue,
    workareaMinSpeed,
  } = useMemo(() => {
    const workareaObj = getWorkarea(workarea);

    return {
      vectorSpeedLimit: workareaObj.vectorSpeedLimit,
      workareaMaxSpeed: workareaObj.maxSpeed,
      workareaMinSpeed: workareaObj.minSpeed,
    };
  }, [workarea]);
  let minValue = workareaMinSpeed;
  const enableLowSpeed = BeamboxPreference.read('enable-low-speed');

  if (minValue > 1 && enableLowSpeed) {
    minValue = 1;
  }

  let warningText = '';

  const vectorSpeedWarning = useMemo(
    () =>
      sprintf(t.speed_contrain_warning, {
        limit: fakeUnit === 'mm' ? `${vectorSpeedLimit} mm/s` : `${(vectorSpeedLimit / 25.4).toFixed(2)} in/s`,
      }),
    [fakeUnit, t.speed_contrain_warning, vectorSpeedLimit],
  );

  if (!isPromark) {
    if (hasVector && value > vectorSpeedLimit && BeamboxPreference.read('vector_speed_contraint') !== false) {
      warningText = vectorSpeedWarning;
    } else if (value < workareaMinSpeed && enableLowSpeed) {
      warningText = t.low_speed_warning;
    }
  }

  const handleChange = (val: number) => {
    dispatch({
      payload: { configName: CUSTOM_PRESET_CONSTANT, speed: val },
      type: 'change',
    });
    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change speed');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'speed', val, { applyPrinting: true, batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }
  };

  const sliderOptions = useMemo(
    () => (simpleMode && module === LayerModule.PRINTER ? configOptions.getPrintingSpeedOptions(lang) : null),
    [simpleMode, module, lang],
  );

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
        value={value}
      />
      <ConfigSlider
        decimal={decimal}
        id="speed"
        max={maxValue}
        min={minValue}
        onChange={handleChange}
        options={sliderOptions}
        speedLimit={
          module !== LayerModule.PRINTER && (type === 'modal' ? doLayersContainsVector(selectedLayers) : hasVector)
        }
        step={0.1}
        unit={displayUnit}
        value={value}
      />
      {warningText ? (
        <div className={styles.warning}>
          <div className={styles['warning-icon']}>!</div>
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

    return +units.convertUnit(value, fakeUnit, 'mm').toFixed(decimal);
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
