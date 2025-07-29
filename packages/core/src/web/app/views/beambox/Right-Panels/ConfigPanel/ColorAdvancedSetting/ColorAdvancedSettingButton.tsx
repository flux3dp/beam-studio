import React, { useContext } from 'react';

import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';

import styles from '../Block.module.scss';
import ConfigPanelContext from '../ConfigPanelContext';

import { showColorAdvancedSetting } from './utils';

const ColorAdvancedSettingButton = () => {
  const { selectedLayers } = useContext(ConfigPanelContext);

  return (
    <>
      <div className={styles.panel}>
        <span className={styles.title} onClick={() => showColorAdvancedSetting(selectedLayers)}>
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
