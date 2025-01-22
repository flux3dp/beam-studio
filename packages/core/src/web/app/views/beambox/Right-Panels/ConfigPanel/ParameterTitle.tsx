import React, { memo, useContext } from 'react';

import { showPresetsManagementPanel } from '@core/app/components/dialogs/PresetsManagementPanel/PresetsManagementPanel';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import useI18n from '@core/helpers/useI18n';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './ParameterTitle.module.scss';
import SaveConfigButton from './SaveConfigButton';

const ParameterTitle = (): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const { initState, state } = useContext(ConfigPanelContext);
  const { configName, module } = state;

  const handleOpenManageModal = () => {
    showPresetsManagementPanel({
      currentModule: module.value,
      initPreset: configName.value,
      onClose: initState,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t.parameters}</div>
      <div>
        <SaveConfigButton />
        <button onClick={handleOpenManageModal} title={t.preset_management.title} type="button">
          <ConfigPanelIcons.Settings />
        </button>
      </div>
    </div>
  );
};

export default memo(ParameterTitle);
