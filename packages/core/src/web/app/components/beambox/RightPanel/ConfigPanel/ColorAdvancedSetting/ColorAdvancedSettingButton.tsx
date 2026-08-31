import React from 'react';

import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import layerManager from '@core/app/svgedit/layer/layerManager';

import styles from '../Block.module.scss';

import { showColorAdvancedSetting } from './utils';

const ColorAdvancedSettingButton = () => {
  return (
    <>
      <div className={styles.panel}>
        <span className={styles.title} onClick={() => showColorAdvancedSetting(layerManager.getSelectedLayers())}>
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
