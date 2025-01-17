import classNames from 'classnames';
import React, { memo, useContext, useMemo } from 'react';
import { Button, Popover } from 'antd-mobile';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { sprintf } from 'sprintf-js';
import { Tooltip } from 'antd';

import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import configOptions from 'app/constants/config-options';
import doLayersContainsVector from 'helpers/layer/check-vector';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import LayerModule from 'app/constants/layer-module/layer-modules';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from 'app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import storage from 'implementations/storage';
import units from 'helpers/units';
import useI18n from 'helpers/useI18n';
import { CUSTOM_PRESET_CONSTANT, writeData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import { promarkModels } from 'app/actions/beambox/constant';

import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './Block.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const SpeedBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element => {
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
  const visible = activeKey === 'speed';
  const { hasVector } = useContext(LayerPanelContext);
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    []
  );

  const { value, hasMultiValue } = state.speed;
  const module = state.module.value;

  const {
    display: displayUnit,
    decimal,
    calculateUnit: fakeUnit,
  } = useMemo(() => {
    const unit: 'mm' | 'inches' = storage.get('default-units') || 'mm';
    const display = { mm: 'mm/s', inches: 'in/s' }[unit];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calculateUnit: 'mm' | 'inch' = { mm: 'mm', inches: 'inch' }[unit] as any;
    const d = { mm: 1, inches: 2 }[unit];
    return { display, decimal: d, calculateUnit };
  }, []);
  const workarea: WorkAreaModel = BeamboxPreference.read('workarea');
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const {
    workareaMaxSpeed: maxValue,
    workareaMinSpeed,
    vectorSpeedLimit,
  } = useMemo(() => {
    const workareaObj = getWorkarea(workarea);
    return {
      workareaMaxSpeed: workareaObj.maxSpeed,
      workareaMinSpeed: workareaObj.minSpeed,
      vectorSpeedLimit: workareaObj.vectorSpeedLimit,
    };
  }, [workarea]);
  let minValue = workareaMinSpeed;
  const enableLowSpeed = BeamboxPreference.read('enable-low-speed');
  if (minValue > 1 && enableLowSpeed) minValue = 1;
  let warningText = '';

  const vectorSpeedWarning = useMemo(
    () =>
      sprintf(t.speed_contrain_warning, {
        limit:
          fakeUnit === 'mm'
            ? `${vectorSpeedLimit} mm/s`
            : `${(vectorSpeedLimit / 25.4).toFixed(2)} in/s`,
      }),
    [fakeUnit, t.speed_contrain_warning, vectorSpeedLimit]
  );

  if (!isPromark) {
    if (
      hasVector &&
      value > vectorSpeedLimit &&
      BeamboxPreference.read('vector_speed_contraint') !== false
    ) {
      warningText = vectorSpeedWarning;
    } else if (value < workareaMinSpeed && enableLowSpeed) {
      warningText = t.low_speed_warning;
    }
  }

  const handleChange = (val: number) => {
    dispatch({
      type: 'change',
      payload: { speed: val, configName: CUSTOM_PRESET_CONSTANT },
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
    () =>
      simpleMode && module === LayerModule.PRINTER
        ? configOptions.getPrintingSpeedOptions(lang)
        : null,
    [simpleMode, module, lang]
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
        inputId="speed-input"
        type={type}
        max={maxValue}
        min={minValue}
        value={value}
        unit={displayUnit}
        hasMultiValue={hasMultiValue}
        decimal={decimal}
        onChange={handleChange}
        options={sliderOptions}
      />
      <ConfigSlider
        id="speed"
        value={value}
        onChange={handleChange}
        min={minValue}
        max={maxValue}
        step={0.1}
        speedLimit={
          module !== LayerModule.PRINTER &&
          (type === 'modal' ? doLayersContainsVector(selectedLayers) : hasVector)
        }
        options={sliderOptions}
        decimal={decimal}
        unit={displayUnit}
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
    if (selectedOption) return selectedOption.label;
    return +units.convertUnit(value, fakeUnit, 'mm').toFixed(decimal);
  }, [decimal, sliderOptions, value, fakeUnit]);

  return type === 'panel-item' ? (
    <Popover visible={visible} content={content}>
      <ObjectPanelItem.Item
        id="speed"
        content={
          <Button
            className={classNames(objectPanelItemStyles['number-item'], styles['display-btn'])}
            shape="rounded"
            size="mini"
            fill="outline"
          >
            <span style={{ whiteSpace: 'nowrap' }}>{displayValue}</span>
          </Button>
        }
        label={t.speed}
        autoClose={false}
      />
    </Popover>
  ) : (
    content
  );
};

export default memo(SpeedBlock);
