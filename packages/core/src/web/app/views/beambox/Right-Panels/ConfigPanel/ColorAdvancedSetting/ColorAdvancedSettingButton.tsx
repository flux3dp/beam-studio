import React from 'react';

import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import useLayerStore from '@core/app/stores/layer/layerStore';

import styles from '../Block.module.scss';

import { showColorAdvancedSetting } from './utils';

const ColorAdvancedSettingButton = () => {
  return (
    <>
      <div className={styles.panel}>
        <span
          className={styles.title}
          onClick={() => showColorAdvancedSetting(useLayerStore.getState().selectedLayers)}
        >
          Color Advanced Setting
          <span className={styles.icon}>
            <ConfigPanelIcons.ColorAdjustment />
          </span>
        </span>
      </div>
    </>
  );
};

export default ColorAdvancedSettingButton;
