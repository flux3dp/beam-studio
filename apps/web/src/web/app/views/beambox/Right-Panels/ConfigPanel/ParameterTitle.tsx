import React, { memo, useContext } from 'react';

import ConfigPanelIcons from 'app/icons/config-panel/ConfigPanelIcons';
import useI18n from 'helpers/useI18n';
import { showPresetsManagementPanel } from 'app/components/dialogs/PresetsManagementPanel/PresetsManagementPanel';

import ConfigPanelContext from './ConfigPanelContext';
import SaveConfigButton from './SaveConfigButton';
import styles from './ParameterTitle.module.scss';

const ParameterTitle = (): JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const { initState, state } = useContext(ConfigPanelContext);
  const { module, configName } = state;

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
        <button title={t.preset_management.title} type="button" onClick={handleOpenManageModal}>
          <ConfigPanelIcons.Settings />
        </button>
      </div>
    </div>
  );
};

export default memo(ParameterTitle);
