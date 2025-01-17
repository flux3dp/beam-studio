import classNames from 'classnames';
import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, Popover } from 'antd-mobile';

import ConfigPanelIcons from 'app/icons/config-panel/ConfigPanelIcons';
import checkPwmImages from 'helpers/layer/check-pwm-images';
import history from 'app/svgedit/history/history';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import objectPanelItemStyles from 'app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import undoManager from 'app/svgedit/history/undoManager';
import useI18n from 'helpers/useI18n';
import useWorkarea from 'helpers/hooks/useWorkarea';
import {
  CUSTOM_PRESET_CONSTANT,
  getData,
  getMultiSelectData,
  writeDataLayer,
} from 'helpers/layer/layer-config-helper';
import { getLayerByName } from 'helpers/layer/layer-helper';
import { getWorkarea } from 'app/constants/workarea-constants';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';

import AdvancedPowerPanel from './AdvancedPowerPanel';
import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './Block.module.scss';

const MAX_VALUE = 100;
const MIN_VALUE = 0;

function PowerBlock({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { activeKey } = useContext(ObjectPanelContext);
  const [showModal, setShowModal] = useState(false);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);
  const visible = activeKey === 'power';
  const [hasPwmImages, setHasPwmImages] = useState(() => checkPwmImages(selectedLayers));
  useEffect(() => {
    const handler = () => setHasPwmImages(checkPwmImages(selectedLayers));
    ObjectPanelController.events.on('pwm-changed', handler);
    return () => {
      ObjectPanelController.events.off('pwm-changed', handler);
    };
  });
  useEffect(() => {
    setHasPwmImages(checkPwmImages(selectedLayers));
  }, [selectedLayers]);

  const { power, selectedLayer } = state;
  const handleChange = (value: number) => {
    dispatch({
      type: 'change',
      payload: { power: value, configName: CUSTOM_PRESET_CONSTANT },
    });
    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change power');
      const layers = selectedLayers.map((layerName) => getLayerByName(layerName));
      let minPowerChanged = false;
      layers.forEach((layer) => {
        writeDataLayer(layer, 'power', value, { batchCmd });
        writeDataLayer(layer, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
        const minPower = getData(layer, 'minPower');
        if (value <= minPower) {
          writeDataLayer(layer, 'minPower', 0, { batchCmd });
          minPowerChanged = true;
        }
      });
      if (minPowerChanged) {
        const selectedIdx = selectedLayers.findIndex((layerName) => layerName === selectedLayer);
        const config = getMultiSelectData(layers, selectedIdx, 'minPower');
        dispatch({ type: 'update', payload: { minPower: config } });
      }
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };
  const workarea = useWorkarea();
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>
        {t.strength}
        {type !== 'panel-item' && hasPwmImages && (
          <span className={styles.icon} title={t.pwm_advanced_setting} onClick={openModal}>
            <ConfigPanelIcons.ColorAdjustment />
          </span>
        )}
      </span>
      <ConfigValueDisplay
        inputId="power-input"
        type={type}
        max={MAX_VALUE}
        min={MIN_VALUE}
        value={power.value}
        unit="%"
        hasMultiValue={power.hasMultiValue}
        decimal={1}
        onChange={handleChange}
      />
      <ConfigSlider
        id="power_value"
        value={power.value}
        onChange={handleChange}
        min={MIN_VALUE}
        max={MAX_VALUE}
        step={1}
      />
      {power.value < workareaObj.minPower  && (
        <div className={styles.warning}>
          <div className={styles['warning-icon']}>!</div>
          <div className={styles['warning-text']}>{t.low_power_warning}</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {type === 'panel-item' ? (
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
                {power.value}
              </Button>
            }
            label={t.strength}
            autoClose={false}
          />
        </Popover>
      ) : (
        content
      )}
      {showModal && hasPwmImages && <AdvancedPowerPanel onClose={closeModal} />}
    </>
  );
}

export default memo(PowerBlock);
