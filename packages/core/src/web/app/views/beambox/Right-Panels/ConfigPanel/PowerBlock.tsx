import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from '@core/app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import checkPwmImages from '@core/helpers/layer/check-pwm-images';
import {
  CUSTOM_PRESET_CONSTANT,
  getData,
  getMultiSelectData,
  writeDataLayer,
} from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';

import AdvancedPowerPanel from './AdvancedPowerPanel';
import styles from './Block.module.scss';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import initState from './initState';

const MAX_VALUE = 100;
const MIN_VALUE = 0;

function PowerBlock({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, power, selectedLayer, update } = useConfigPanelStore();
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
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

  const handleChange = (value: number) => {
    change({ configName: CUSTOM_PRESET_CONSTANT, power: value });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change power');
      const layers = selectedLayers.map((layerName) => getLayerByName(layerName)!);
      let minPowerChanged = false;

      layers.forEach((layer) => {
        writeDataLayer(layer, 'power', value, { batchCmd });
        writeDataLayer(layer, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });

        const minPower = getData(layer, 'minPower');

        if (minPower && value <= minPower) {
          writeDataLayer(layer, 'minPower', 0, { batchCmd });
          minPowerChanged = true;
        }
      });

      if (minPowerChanged) {
        const selectedIdx = selectedLayers.findIndex((layerName) => layerName === selectedLayer);
        const config = getMultiSelectData(layers, selectedIdx, 'minPower') as ConfigItem<number>;

        update({ minPower: config });
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
          <span className={styles.icon} onClick={openModal} title={t.pwm_advanced_setting}>
            <ConfigPanelIcons.ColorAdjustment />
          </span>
        )}
      </span>
      <ConfigValueDisplay
        decimal={1}
        hasMultiValue={power.hasMultiValue}
        inputId="power-input"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        type={type}
        unit="%"
        value={power.value}
      />
      <ConfigSlider
        id="power_value"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        step={1}
        value={power.value}
      />
      {power.value < (workareaObj.minPower ?? -1) && (
        <div className={styles.warning}>
          <div className={styles['warning-icon']}>
            <ExclamationCircleOutlined />
          </div>
          <div className={styles['warning-text']}>{t.low_power_warning}</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {type === 'panel-item' ? (
        <Popover content={content} visible={visible}>
          <ObjectPanelItem.Item
            autoClose={false}
            content={
              <Button className={objectPanelItemStyles['number-item']} fill="outline" shape="rounded" size="mini">
                {power.value}
              </Button>
            }
            id="power"
            label={t.strength}
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
