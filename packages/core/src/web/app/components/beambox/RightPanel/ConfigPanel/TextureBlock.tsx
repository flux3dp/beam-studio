import React, { memo } from 'react';

import type { RadioChangeEvent } from 'antd';
import { Radio, Switch } from 'antd';
import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './initState';
import NumberBlock from './NumberBlock';

const TextureBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const { change, texture, textureMode } = useConfigPanelStore(useShallow(pick(['change', 'texture', 'textureMode'])));

  const handleToggle = () => {
    const newVal = !texture.value;

    change({ texture: newVal });

    if (type === 'modal') return;

    const batchCmd = new history.BatchCommand('Toggle texture');

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      writeData(layerName, 'texture', newVal, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const handleModeChange = (e: RadioChangeEvent) => {
    const newValue = e.target.value as number;

    if (newValue === textureMode.value && !textureMode.hasMultiValue) return;

    change({ textureMode: newValue });

    if (type === 'modal') return;

    const batchCmd = new history.BatchCommand('Change texture mode');

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      writeData(layerName, 'textureMode', newValue, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="texture">
          {t.texture}
        </label>
        <Switch
          checked={texture.value}
          className={classNames(styles.switch, { [styles.partial]: texture.hasMultiValue })}
          id="texture"
          onChange={handleToggle}
          size="small"
        />
      </div>
      {texture.value && (
        <>
          <div className={styles.panel}>
            <Radio.Group
              block
              id="texture-mode"
              onChange={handleModeChange}
              options={[
                { label: t.texture_random, value: 1 },
                { label: t.texture_stripe, value: 2 },
              ]}
              optionType="button"
              value={textureMode.value}
            />
          </div>
          {textureMode.value === 1 ? (
            <NumberBlock
              configKey="textureRandomIntensity"
              id="texture-random-intensity"
              max={100}
              min={0}
              title={t.texture_intensity}
              type={type}
              unit="%"
            />
          ) : (
            <>
              <NumberBlock
                configKey="textureStripeAngle"
                id="texture-stripe-angle"
                max={180}
                min={0}
                title={t.texture_angle}
                type={type}
                unit="deg"
              />
              <NumberBlock
                configKey="textureStripeInterval"
                id="texture-stripe-interval"
                max={10}
                min={0.05}
                precision={2}
                step={0.05}
                title={t.texture_interval}
                type={type}
                unit="mm"
              />
              <NumberBlock
                configKey="textureStripeIntensity"
                id="texture-stripe-intensity"
                max={100}
                min={0}
                title={t.texture_intensity}
                type={type}
                unit="%"
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export default memo(TextureBlock);
