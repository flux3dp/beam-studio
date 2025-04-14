import React, { memo } from 'react';

import { showPresetsManagementPanel } from '@core/app/components/dialogs/PresetsManagementPanel/PresetsManagementPanel';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useI18n from '@core/helpers/useI18n';

import initState from './initState';
import styles from './ParameterTitle.module.scss';
import SaveConfigButton from './SaveConfigButton';

const ParameterTitle = (): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const { configName, module } = useConfigPanelStore();

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
